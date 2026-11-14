import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { asc, desc, eq, ilike, or, and, inArray } from 'drizzle-orm';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import {
  articles,
  categories,
  comments,
  equipment,
  factories,
  favorites,
  media,
  productSources,
  productionStages,
  products,
  sources,
  users,
} from './src/db/schema.ts';
import { ensureSeeded } from './src/db/seed.ts';
import { AuthRequest, optionalAuth, requireAdmin, requireAuth } from './src/middleware/auth.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static directories for generated visual assets & uploaded media storage
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src/assets/images')));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // up to 50MB for instructional videos/images
});

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || `item-${Date.now()}`
  );
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Auth profile sync
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  res.json({ user: req.dbUser });
});

// Bootstrap endpoint for initial public catalog & counts
app.get('/api/bootstrap', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const [cats, prods, eqs, facs, arts, srcs] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
      db.select().from(products).where(eq(products.status, 'published')).orderBy(asc(products.id)),
      db.select().from(equipment).where(eq(equipment.status, 'published')).orderBy(asc(equipment.id)),
      db.select().from(factories).where(eq(factories.status, 'published')).orderBy(asc(factories.id)),
      db.select().from(articles).where(eq(articles.status, 'published')).orderBy(desc(articles.publishedDate)),
      db.select().from(sources).orderBy(asc(sources.id)),
    ]);

    res.json({
      user: req.dbUser || null,
      categories: cats,
      products: prods,
      equipment: eqs,
      factories: facs,
      articles: arts,
      sources: srcs,
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Өгөгдөл ачаалахад алдаа гарлаа.' });
  }
});

// Global Search across products, categories, production stages, equipment, factories, and articles
app.get('/api/search', async (req, res) => {
  try {
    await ensureSeeded();
    const q = String(req.query.q || '').trim();
    const categorySlug = String(req.query.category || '').trim();
    const pattern = q ? `%${q}%` : '%';

    let matchedCategoryId: number | null = null;
    if (categorySlug) {
      const catRows = await db.select().from(categories).where(eq(categories.slug, categorySlug));
      matchedCategoryId = catRows[0]?.id ?? null;
    }

    const productWhere = matchedCategoryId
      ? and(
          eq(products.status, 'published'),
          eq(products.categoryId, matchedCategoryId),
          or(
            ilike(products.nameMn, pattern),
            ilike(products.nameEn, pattern),
            ilike(products.overviewMn, pattern),
            ilike(products.overviewEn, pattern),
            ilike(products.processSequenceSummaryMn, pattern)
          )
        )
      : and(
          eq(products.status, 'published'),
          or(
            ilike(products.nameMn, pattern),
            ilike(products.nameEn, pattern),
            ilike(products.overviewMn, pattern),
            ilike(products.overviewEn, pattern),
            ilike(products.processSequenceSummaryMn, pattern)
          )
        );

    const [matchedProducts, matchedStages, matchedEquipment, matchedFactories, matchedArticles] =
      await Promise.all([
        db.select().from(products).where(productWhere).orderBy(asc(products.id)),
        q
          ? db
              .select({
                stage: productionStages,
                productSlug: products.slug,
                productNameMn: products.nameMn,
                productNameEn: products.nameEn,
              })
              .from(productionStages)
              .innerJoin(products, eq(productionStages.productId, products.id))
              .where(
                and(
                  eq(products.status, 'published'),
                  or(
                    ilike(productionStages.titleMn, pattern),
                    ilike(productionStages.titleEn, pattern),
                    ilike(productionStages.descriptionMn, pattern),
                    ilike(productionStages.equipmentNameMn, pattern)
                  )
                )
              )
          : Promise.resolve([]),
        db
          .select()
          .from(equipment)
          .where(
            and(
              eq(equipment.status, 'published'),
              or(
                ilike(equipment.nameMn, pattern),
                ilike(equipment.nameEn, pattern),
                ilike(equipment.purposeMn, pattern),
                ilike(equipment.sectorMn, pattern)
              )
            )
          ),
        db
          .select()
          .from(factories)
          .where(
            and(
              eq(factories.status, 'published'),
              or(
                ilike(factories.nameMn, pattern),
                ilike(factories.nameEn, pattern),
                ilike(factories.locationMn, pattern),
                ilike(factories.productsProducedMn, pattern)
              )
            )
          ),
        db
          .select()
          .from(articles)
          .where(
            and(
              eq(articles.status, 'published'),
              or(
                ilike(articles.titleMn, pattern),
                ilike(articles.titleEn, pattern),
                ilike(articles.topic, pattern),
                ilike(articles.summaryMn, pattern)
              )
            )
          ),
      ]);

    res.json({
      products: matchedProducts,
      stages: matchedStages,
      equipment: matchedEquipment,
      factories: matchedFactories,
      articles: matchedArticles,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Хайлт хийхэд алдаа гарлаа.' });
  }
});

// Categories
app.get('/api/categories', async (_req, res) => {
  try {
    await ensureSeeded();
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// Products list
app.get('/api/products', async (req, res) => {
  try {
    await ensureSeeded();
    const categorySlug = String(req.query.category || '').trim();
    if (categorySlug) {
      const catRows = await db.select().from(categories).where(eq(categories.slug, categorySlug));
      if (catRows.length === 0) return res.json([]);
      const rows = await db
        .select()
        .from(products)
        .where(and(eq(products.status, 'published'), eq(products.categoryId, catRows[0].id)))
        .orderBy(asc(products.id));
      return res.json(rows);
    }
    const rows = await db.select().from(products).where(eq(products.status, 'published')).orderBy(asc(products.id));
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// Product detail by slug (includes stages, equipment references, sources, comments, and user bookmark status)
app.get('/api/products/:slug', optionalAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const slug = req.params.slug;
    const prodRows = await db.select().from(products).where(eq(products.slug, slug));
    if (prodRows.length === 0) {
      return res.status(404).json({ error: 'Бүтээгдэхүүн олдсонгүй.' });
    }
    const product = prodRows[0];
    if (product.status !== 'published' && req.dbUser?.role !== 'admin') {
      return res.status(404).json({ error: 'Бүтээгдэхүүн олдсонгүй.' });
    }

    const [catRows, stageRows, prodSourceLinks, commentRows] = await Promise.all([
      db.select().from(categories).where(eq(categories.id, product.categoryId)),
      db.select().from(productionStages).where(eq(productionStages.productId, product.id)).orderBy(asc(productionStages.stepOrder)),
      db.select().from(productSources).where(eq(productSources.productId, product.id)),
      db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          userId: comments.userId,
          authorName: users.displayName,
          authorEmail: users.email,
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(and(eq(comments.entityType, 'product'), eq(comments.entityId, product.id)))
        .orderBy(desc(comments.createdAt)),
    ]);

    const sourceIds = Array.from(
      new Set([
        ...prodSourceLinks.map((ps) => ps.sourceId),
        ...stageRows.map((s) => s.sourceId).filter((id): id is number => id !== null),
      ])
    );

    const linkedSources = sourceIds.length
      ? await db.select().from(sources).where(inArray(sources.id, sourceIds))
      : [];

    const equipmentIds = Array.from(
      new Set(stageRows.map((s) => s.equipmentId).filter((id): id is number => id !== null))
    );
    const linkedEquipment = equipmentIds.length
      ? await db.select().from(equipment).where(inArray(equipment.id, equipmentIds))
      : [];

    let userLibraryState = null;
    if (req.dbUser) {
      const favRows = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, req.dbUser.id), eq(favorites.productId, product.id)));
      userLibraryState = favRows[0] || null;
    }

    res.json({
      product,
      category: catRows[0] || null,
      stages: stageRows,
      sources: linkedSources,
      equipment: linkedEquipment,
      comments: commentRows,
      userState: userLibraryState,
    });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).json({ error: 'Бүтээгдэхүүний мэдээлэл ачаалахад алдаа гарлаа.' });
  }
});

// Equipment routes
app.get('/api/equipment', async (_req, res) => {
  try {
    await ensureSeeded();
    const rows = await db.select().from(equipment).where(eq(equipment.status, 'published')).orderBy(asc(equipment.id));
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load equipment' });
  }
});

// Factories routes
app.get('/api/factories', async (_req, res) => {
  try {
    await ensureSeeded();
    const rows = await db.select().from(factories).where(eq(factories.status, 'published')).orderBy(asc(factories.id));
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load factories' });
  }
});

// Articles routes
app.get('/api/articles', async (req, res) => {
  try {
    await ensureSeeded();
    const topic = String(req.query.topic || '').trim();
    const rows = topic
      ? await db
          .select()
          .from(articles)
          .where(and(eq(articles.status, 'published'), eq(articles.topic, topic)))
          .orderBy(desc(articles.publishedDate))
      : await db.select().from(articles).where(eq(articles.status, 'published')).orderBy(desc(articles.publishedDate));
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

app.get('/api/articles/:slug', async (req, res) => {
  try {
    await ensureSeeded();
    const rows = await db.select().from(articles).where(eq(articles.slug, req.params.slug));
    if (rows.length === 0) return res.status(404).json({ error: 'Нийтлэл олдсонгүй.' });
    const article = rows[0];
    const sourceRows = article.sourceId
      ? await db.select().from(sources).where(eq(sources.id, article.sourceId))
      : [];
    const commentRows = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        userId: comments.userId,
        authorName: users.displayName,
        authorEmail: users.email,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.entityType, 'article'), eq(comments.entityId, article.id)))
      .orderBy(desc(comments.createdAt));

    res.json({ article, source: sourceRows[0] || null, comments: commentRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load article' });
  }
});

// Sources & Media
app.get('/api/sources', async (_req, res) => {
  try {
    await ensureSeeded();
    const rows = await db.select().from(sources).orderBy(asc(sources.id));
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load sources' });
  }
});

// Authenticated User System: Favorites, Studied Products, Saved Notes, Comments
app.get('/api/user/library', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.dbUser!.id;
    const [favRows, userComments] = await Promise.all([
      db
        .select({
          favorite: favorites,
          product: products,
        })
        .from(favorites)
        .innerJoin(products, eq(favorites.productId, products.id))
        .where(eq(favorites.userId, userId))
        .orderBy(desc(favorites.updatedAt)),
      db.select().from(comments).where(eq(comments.userId, userId)).orderBy(desc(comments.createdAt)),
    ]);

    res.json({ items: favRows, comments: userComments });
  } catch (error) {
    console.error('User library error:', error);
    res.status(500).json({ error: 'Хэрэглэгчийн сан ачаалахад алдаа гарлаа.' });
  }
});

app.post('/api/user/favorites', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.dbUser!.id;
    const { productId, isFavorite, isStudied, notes } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId шаардлагатай.' });

    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, Number(productId))));

    if (existing.length > 0) {
      const cur = existing[0];
      const updated = await db
        .update(favorites)
        .set({
          isFavorite: typeof isFavorite === 'boolean' ? isFavorite : cur.isFavorite,
          isStudied: typeof isStudied === 'boolean' ? isStudied : cur.isStudied,
          notes: typeof notes === 'string' ? notes : cur.notes,
          updatedAt: new Date(),
        })
        .where(eq(favorites.id, cur.id))
        .returning();
      return res.json(updated[0]);
    }

    const inserted = await db
      .insert(favorites)
      .values({
        userId,
        productId: Number(productId),
        isFavorite: typeof isFavorite === 'boolean' ? isFavorite : true,
        isStudied: typeof isStudied === 'boolean' ? isStudied : false,
        notes: typeof notes === 'string' ? notes : '',
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Save favorite error:', error);
    res.status(500).json({ error: 'Хадгалахад алдаа гарлаа.' });
  }
});

app.post('/api/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.dbUser!.id;
    const { entityType, entityId, content } = req.body;
    if (!entityType || !entityId || !String(content || '').trim()) {
      return res.status(400).json({ error: 'Сэтгэгдлийн мэдээлэл дутуу байна.' });
    }
    const inserted = await db
      .insert(comments)
      .values({
        userId,
        entityType: String(entityType),
        entityId: Number(entityId),
        content: String(content).trim(),
      })
      .returning();

    res.status(201).json({
      ...inserted[0],
      authorName: req.dbUser!.displayName,
      authorEmail: req.dbUser!.email,
    });
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({ error: 'Сэтгэгдэл нэмэхэд алдаа гарлаа.' });
  }
});

app.delete('/api/comments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.select().from(comments).where(eq(comments.id, id));
    if (existing.length === 0) return res.status(404).json({ error: 'Олдсонгүй.' });
    if (existing[0].userId !== req.dbUser!.id && req.dbUser!.role !== 'admin') {
      return res.status(403).json({ error: 'Энэ сэтгэгдлийг устгах эрхгүй байна.' });
    }
    await db.delete(comments).where(eq(comments.id, id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Устгахад алдаа гарлаа.' });
  }
});

// ============================================================================
// ADMIN ROUTES (Strictly server-side verified via requireAdmin)
// ============================================================================
app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
  try {
    const [cats, prods, stages, eqs, facs, arts, srcs, med] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
      db.select().from(products).orderBy(desc(products.updatedAt)),
      db.select().from(productionStages).orderBy(asc(productionStages.productId), asc(productionStages.stepOrder)),
      db.select().from(equipment).orderBy(desc(equipment.id)),
      db.select().from(factories).orderBy(desc(factories.id)),
      db.select().from(articles).orderBy(desc(articles.id)),
      db.select().from(sources).orderBy(desc(sources.id)),
      db.select().from(media).orderBy(desc(media.createdAt)),
    ]);
    res.json({ categories: cats, products: prods, stages, equipment: eqs, factories: facs, articles: arts, sources: srcs, media: med });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Админ өгөгдөл татахад алдаа гарлаа.' });
  }
});

// Admin: Categories
app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const { nameMn, nameEn, descriptionMn, descriptionEn, sortOrder } = req.body;
    const slug = req.body.slug ? slugify(req.body.slug) : slugify(nameEn || nameMn);
    const inserted = await db
      .insert(categories)
      .values({
        slug,
        nameMn,
        nameEn: nameEn || nameMn,
        descriptionMn: descriptionMn || '',
        descriptionEn: descriptionEn || '',
        sortOrder: Number(sortOrder || 10),
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ангилал үүсгэхэд алдаа гарлаа.' });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(categories).where(eq(categories.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Энэ ангилалд бүтээгдэхүүн бүртгэлтэй байгаа тул устгах боломжгүй.' });
  }
});

// Admin: Products CRUD
app.post('/api/admin/products', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    const slug = b.slug ? slugify(b.slug) : `${slugify(b.nameEn || b.nameMn)}-${Date.now().toString().slice(-4)}`;
    const inserted = await db
      .insert(products)
      .values({
        slug,
        categoryId: Number(b.categoryId),
        nameMn: b.nameMn,
        nameEn: b.nameEn || b.nameMn,
        imageUrl: b.imageUrl || '/src/assets/images/hero_food_facility_1794641656944.jpg',
        imageSource: b.imageSource || 'Баталгаажуулах шаардлагатай',
        overviewMn: b.overviewMn || '',
        overviewEn: b.overviewEn || '',
        mainRawMaterialMn: b.mainRawMaterialMn || '',
        mainRawMaterialEn: b.mainRawMaterialEn || '',
        rawMaterialPropertiesMn: b.rawMaterialPropertiesMn || '',
        rawMaterialPropertiesEn: b.rawMaterialPropertiesEn || '',
        processSequenceSummaryMn: b.processSequenceSummaryMn || '',
        processSequenceSummaryEn: b.processSequenceSummaryEn || '',
        flowchartJson: Array.isArray(b.flowchartJson) ? b.flowchartJson : [],
        equipmentSummaryMn: b.equipmentSummaryMn || '',
        equipmentSummaryEn: b.equipmentSummaryEn || '',
        processingRegimeMn: b.processingRegimeMn || '',
        processingRegimeEn: b.processingRegimeEn || '',
        qualityControlMn: b.qualityControlMn || '',
        qualityControlEn: b.qualityControlEn || '',
        foodSafetyMn: b.foodSafetyMn || '',
        foodSafetyEn: b.foodSafetyEn || '',
        packagingMn: b.packagingMn || '',
        packagingEn: b.packagingEn || '',
        storageMn: b.storageMn || '',
        storageEn: b.storageEn || '',
        transportMn: b.transportMn || '',
        transportEn: b.transportEn || '',
        verificationStatus: b.verificationStatus || 'needs_verification',
        status: b.status || 'published',
        createdBy: req.dbUser!.id,
      })
      .returning();

    if (Array.isArray(b.sourceIds) && b.sourceIds.length > 0) {
      await db.insert(productSources).values(
        b.sourceIds.map((sid: number) => ({ productId: inserted[0].id, sourceId: Number(sid) }))
      );
    }

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Бүтээгдэхүүн нэмэхэд алдаа гарлаа.' });
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const updated = await db
      .update(products)
      .set({
        categoryId: b.categoryId ? Number(b.categoryId) : undefined,
        nameMn: b.nameMn,
        nameEn: b.nameEn,
        imageUrl: b.imageUrl,
        imageSource: b.imageSource,
        overviewMn: b.overviewMn,
        overviewEn: b.overviewEn,
        mainRawMaterialMn: b.mainRawMaterialMn,
        mainRawMaterialEn: b.mainRawMaterialEn,
        rawMaterialPropertiesMn: b.rawMaterialPropertiesMn,
        rawMaterialPropertiesEn: b.rawMaterialPropertiesEn,
        processSequenceSummaryMn: b.processSequenceSummaryMn,
        processSequenceSummaryEn: b.processSequenceSummaryEn,
        flowchartJson: Array.isArray(b.flowchartJson) ? b.flowchartJson : undefined,
        equipmentSummaryMn: b.equipmentSummaryMn,
        equipmentSummaryEn: b.equipmentSummaryEn,
        processingRegimeMn: b.processingRegimeMn,
        processingRegimeEn: b.processingRegimeEn,
        qualityControlMn: b.qualityControlMn,
        qualityControlEn: b.qualityControlEn,
        foodSafetyMn: b.foodSafetyMn,
        foodSafetyEn: b.foodSafetyEn,
        packagingMn: b.packagingMn,
        packagingEn: b.packagingEn,
        storageMn: b.storageMn,
        storageEn: b.storageEn,
        transportMn: b.transportMn,
        transportEn: b.transportEn,
        verificationStatus: b.verificationStatus,
        status: b.status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (Array.isArray(b.sourceIds)) {
      await db.delete(productSources).where(eq(productSources.productId, id));
      if (b.sourceIds.length > 0) {
        await db.insert(productSources).values(
          b.sourceIds.map((sid: number) => ({ productId: id, sourceId: Number(sid) }))
        );
      }
    }

    res.json(updated[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Бүтээгдэхүүн засахад алдаа гарлаа.' });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(products).where(eq(products.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Бүтээгдэхүүн устгахад алдаа гарлаа.' });
  }
});

// Admin: Production Stages
app.post('/api/admin/stages', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const inserted = await db
      .insert(productionStages)
      .values({
        productId: Number(b.productId),
        stepOrder: Number(b.stepOrder || 1),
        titleMn: b.titleMn,
        titleEn: b.titleEn || b.titleMn,
        descriptionMn: b.descriptionMn || '',
        descriptionEn: b.descriptionEn || '',
        imageUrl: b.imageUrl || '',
        imageSource: b.imageSource || 'Баталгаажуулах шаардлагатай',
        videoUrl: b.videoUrl || '',
        videoSource: b.videoSource || '',
        equipmentId: b.equipmentId ? Number(b.equipmentId) : null,
        equipmentNameMn: b.equipmentNameMn || '',
        equipmentNameEn: b.equipmentNameEn || '',
        temperature: b.temperature || '',
        duration: b.duration || '',
        operatingPrincipleMn: b.operatingPrincipleMn || '',
        operatingPrincipleEn: b.operatingPrincipleEn || '',
        qualityControlIndicatorMn: b.qualityControlIndicatorMn || '',
        qualityControlIndicatorEn: b.qualityControlIndicatorEn || '',
        sourceId: b.sourceId ? Number(b.sourceId) : null,
        verificationStatus: b.verificationStatus || 'needs_verification',
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Үйлдвэрлэлийн үе шат нэмэхэд алдаа гарлаа.' });
  }
});

app.delete('/api/admin/stages/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(productionStages).where(eq(productionStages.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Үе шат устгахад алдаа гарлаа.' });
  }
});

// Admin: Equipment
app.post('/api/admin/equipment', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const slug = `${slugify(b.nameEn || b.nameMn)}-${Date.now().toString().slice(-4)}`;
    const inserted = await db
      .insert(equipment)
      .values({
        slug,
        nameMn: b.nameMn,
        nameEn: b.nameEn || b.nameMn,
        imageUrl: b.imageUrl || '/src/assets/images/equipment_pasteurizer_1794641658125.jpg',
        imageSource: b.imageSource || 'Баталгаажуулах шаардлагатай',
        purposeMn: b.purposeMn || '',
        purposeEn: b.purposeEn || '',
        structureMn: b.structureMn || '',
        structureEn: b.structureEn || '',
        mainPartsMn: b.mainPartsMn || '',
        mainPartsEn: b.mainPartsEn || '',
        operatingPrincipleMn: b.operatingPrincipleMn || '',
        operatingPrincipleEn: b.operatingPrincipleEn || '',
        technicalSpecsMn: b.technicalSpecsMn || '',
        technicalSpecsEn: b.technicalSpecsEn || '',
        sectorMn: b.sectorMn || '',
        sectorEn: b.sectorEn || '',
        relatedStageMn: b.relatedStageMn || '',
        relatedStageEn: b.relatedStageEn || '',
        sourceId: b.sourceId ? Number(b.sourceId) : null,
        verificationStatus: b.verificationStatus || 'needs_verification',
        status: b.status || 'published',
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Тоног төхөөрөмж нэмэхэд алдаа гарлаа.' });
  }
});

app.delete('/api/admin/equipment/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(equipment).where(eq(equipment.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Устгахад алдаа гарлаа.' });
  }
});

// Admin: Factories
app.post('/api/admin/factories', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const slug = `${slugify(b.nameEn || b.nameMn)}-${Date.now().toString().slice(-4)}`;
    const inserted = await db
      .insert(factories)
      .values({
        slug,
        nameMn: b.nameMn,
        nameEn: b.nameEn || b.nameMn,
        locationMn: b.locationMn || '',
        locationEn: b.locationEn || '',
        descriptionMn: b.descriptionMn || '',
        descriptionEn: b.descriptionEn || '',
        productsProducedMn: b.productsProducedMn || '',
        productsProducedEn: b.productsProducedEn || '',
        imageUrl: b.imageUrl || '/src/assets/images/factory_dairy_interior_1794641658340.jpg',
        imageSource: b.imageSource || 'Баталгаажуулах шаардлагатай',
        videoUrl: b.videoUrl || '',
        videoSource: b.videoSource || '',
        technologiesUsedMn: b.technologiesUsedMn || '',
        technologiesUsedEn: b.technologiesUsedEn || '',
        equipmentUsedMn: b.equipmentUsedMn || '',
        equipmentUsedEn: b.equipmentUsedEn || '',
        officialWebsite: b.officialWebsite || '',
        sourceId: b.sourceId ? Number(b.sourceId) : null,
        verificationStatus: b.verificationStatus || 'needs_verification',
        status: b.status || 'published',
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Үйлдвэр нэмэхэд алдаа гарлаа.' });
  }
});

app.delete('/api/admin/factories/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(factories).where(eq(factories.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Устгахад алдаа гарлаа.' });
  }
});

// Admin: Articles (publish or save as draft)
app.post('/api/admin/articles', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const slug = `${slugify(b.titleEn || b.titleMn)}-${Date.now().toString().slice(-4)}`;
    const inserted = await db
      .insert(articles)
      .values({
        slug,
        topic: b.topic || 'Food Safety',
        titleMn: b.titleMn,
        titleEn: b.titleEn || b.titleMn,
        summaryMn: b.summaryMn || '',
        summaryEn: b.summaryEn || '',
        contentMn: b.contentMn || '',
        contentEn: b.contentEn || '',
        imageUrl: b.imageUrl || '/src/assets/images/research_food_lab_1794641659359.jpg',
        imageSource: b.imageSource || 'Баталгаажуулах шаардлагатай',
        author: b.author || 'FOOD TRACE Editorial',
        publishedDate: b.publishedDate || new Date().toISOString().slice(0, 10),
        sourceId: b.sourceId ? Number(b.sourceId) : null,
        verificationStatus: b.verificationStatus || 'needs_verification',
        status: b.status || 'published',
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Нийтлэл нэмэхэд алдаа гарлаа.' });
  }
});

app.put('/api/admin/articles/:id', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const updated = await db
      .update(articles)
      .set({
        status: b.status,
        titleMn: b.titleMn,
        titleEn: b.titleEn,
        summaryMn: b.summaryMn,
        contentMn: b.contentMn,
        verificationStatus: b.verificationStatus,
      })
      .where(eq(articles.id, Number(req.params.id)))
      .returning();
    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Нийтлэл шинэчлэхэд алдаа гарлаа.' });
  }
});

app.delete('/api/admin/articles/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(articles).where(eq(articles.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Устгахад алдаа гарлаа.' });
  }
});

// Admin: Sources
app.post('/api/admin/sources', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const inserted = await db
      .insert(sources)
      .values({
        title: b.title,
        organization: b.organization || '',
        year: b.year || '',
        url: b.url || '',
        citationType: b.citationType || 'standard',
        notesMn: b.notesMn || '',
        notesEn: b.notesEn || '',
        verified: Boolean(b.verified),
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Эх сурвалж нэмэхэд алдаа гарлаа.' });
  }
});

app.delete('/api/admin/sources/:id', requireAdmin, async (req, res) => {
  try {
    await db.delete(sources).where(eq(sources.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Устгахад алдаа гарлаа.' });
  }
});

// Admin: Media upload to server storage & database registration
app.post('/api/admin/media/upload', requireAdmin, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл сонгоогүй байна.' });
    const fileUrl = `/uploads/${req.file.filename}`;
    const isVideo = req.file.mimetype.startsWith('video/');
    const inserted = await db
      .insert(media)
      .values({
        title: req.body.title || req.file.originalname,
        mediaType: isVideo ? 'video' : 'image',
        url: fileUrl,
        sourceAttribution: req.body.sourceAttribution || 'Баталгаажуулах шаардлагатай',
        entityType: req.body.entityType || 'general',
        entityId: req.body.entityId ? Number(req.body.entityId) : null,
        uploadedBy: req.dbUser!.id,
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Файл байршуулахад алдаа гарлаа.' });
  }
});

app.post('/api/admin/media', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    const inserted = await db
      .insert(media)
      .values({
        title: b.title,
        mediaType: b.mediaType || 'image',
        url: b.url,
        sourceAttribution: b.sourceAttribution || 'Баталгаажуулах шаардлагатай',
        entityType: b.entityType || 'general',
        entityId: b.entityId ? Number(b.entityId) : null,
        uploadedBy: req.dbUser!.id,
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Медиа бүртгэхэд алдаа гарлаа.' });
  }
});

// Vite / Static SPA serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FOOD TRACE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FOOD TRACE server:', err);
  process.exit(1);
});
