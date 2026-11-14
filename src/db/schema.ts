import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').default('').notNull(),
  role: text('role').default('user').notNull(), // 'user' | 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameMn: text('name_mn').notNull(),
  nameEn: text('name_en').notNull(),
  descriptionMn: text('description_mn').default('').notNull(),
  descriptionEn: text('description_en').default('').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

// 3. Sources
export const sources = pgTable('sources', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  organization: text('organization').notNull(),
  year: text('year').default('').notNull(),
  url: text('url').default('').notNull(),
  citationType: text('citation_type').default('standard').notNull(), // 'standard' | 'academic' | 'textbook' | 'official_factory'
  notesMn: text('notes_mn').default('').notNull(),
  notesEn: text('notes_en').default('').notNull(),
  verified: boolean('verified').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Equipment
export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameMn: text('name_mn').notNull(),
  nameEn: text('name_en').notNull(),
  imageUrl: text('image_url').default('').notNull(),
  imageSource: text('image_source').default('').notNull(),
  purposeMn: text('purpose_mn').notNull(),
  purposeEn: text('purpose_en').notNull(),
  structureMn: text('structure_mn').notNull(),
  structureEn: text('structure_en').notNull(),
  mainPartsMn: text('main_parts_mn').notNull(),
  mainPartsEn: text('main_parts_en').notNull(),
  operatingPrincipleMn: text('operating_principle_mn').notNull(),
  operatingPrincipleEn: text('operating_principle_en').notNull(),
  technicalSpecsMn: text('technical_specs_mn').notNull(),
  technicalSpecsEn: text('technical_specs_en').notNull(),
  sectorMn: text('sector_mn').notNull(),
  sectorEn: text('sector_en').notNull(),
  relatedStageMn: text('related_stage_mn').default('').notNull(),
  relatedStageEn: text('related_stage_en').default('').notNull(),
  sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
  verificationStatus: text('verification_status').default('reference_standard').notNull(), // 'verified' | 'reference_standard' | 'needs_verification'
  status: text('status').default('published').notNull(), // 'published' | 'draft'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'restrict' })
    .notNull(),
  nameMn: text('name_mn').notNull(),
  nameEn: text('name_en').notNull(),
  imageUrl: text('image_url').default('').notNull(),
  imageSource: text('image_source').default('').notNull(),
  overviewMn: text('overview_mn').notNull(),
  overviewEn: text('overview_en').notNull(),
  mainRawMaterialMn: text('main_raw_material_mn').notNull(),
  mainRawMaterialEn: text('main_raw_material_en').notNull(),
  rawMaterialPropertiesMn: text('raw_material_properties_mn').notNull(),
  rawMaterialPropertiesEn: text('raw_material_properties_en').notNull(),
  processSequenceSummaryMn: text('process_sequence_summary_mn').notNull(),
  processSequenceSummaryEn: text('process_sequence_summary_en').notNull(),
  flowchartJson: jsonb('flowchart_json').$type<Array<{ id: string; labelMn: string; labelEn: string; nextIds?: string[]; branchNoteMn?: string; branchNoteEn?: string }>>().default([]).notNull(),
  equipmentSummaryMn: text('equipment_summary_mn').notNull(),
  equipmentSummaryEn: text('equipment_summary_en').notNull(),
  processingRegimeMn: text('processing_regime_mn').notNull(),
  processingRegimeEn: text('processing_regime_en').notNull(),
  qualityControlMn: text('quality_control_mn').notNull(),
  qualityControlEn: text('quality_control_en').notNull(),
  foodSafetyMn: text('food_safety_mn').notNull(),
  foodSafetyEn: text('food_safety_en').notNull(),
  packagingMn: text('packaging_mn').notNull(),
  packagingEn: text('packaging_en').notNull(),
  storageMn: text('storage_mn').notNull(),
  storageEn: text('storage_en').notNull(),
  transportMn: text('transport_mn').notNull(),
  transportEn: text('transport_en').notNull(),
  verificationStatus: text('verification_status').default('reference_standard').notNull(), // 'verified' | 'reference_standard' | 'needs_verification'
  disclaimerMn: text('disclaimer_mn').default('Энэхүү технологийн дараалал нь салбарын жишиг стандарт болон ном зүйд суурилсан ерөнхий загвар бөгөөд үйлдвэр бүрийн тоног төхөөрөмж, жороос хамаарч горим өөр байж болно.').notNull(),
  disclaimerEn: text('disclaimer_en').default('This production sequence represents a general industry reference model based on published standards; actual parameters may vary by facility and formulation.').notNull(),
  status: text('status').default('published').notNull(), // 'published' | 'draft'
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product <-> Sources join table
export const productSources = pgTable('product_sources', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  sourceId: integer('source_id')
    .references(() => sources.id, { onDelete: 'cascade' })
    .notNull(),
});

// 6. Production Stages
export const productionStages = pgTable('production_stages', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  stepOrder: integer('step_order').notNull(),
  titleMn: text('title_mn').notNull(),
  titleEn: text('title_en').notNull(),
  descriptionMn: text('description_mn').notNull(),
  descriptionEn: text('description_en').notNull(),
  imageUrl: text('image_url').default('').notNull(),
  imageSource: text('image_source').default('').notNull(),
  videoUrl: text('video_url').default('').notNull(),
  videoSource: text('video_source').default('').notNull(),
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'set null' }),
  equipmentNameMn: text('equipment_name_mn').default('').notNull(),
  equipmentNameEn: text('equipment_name_en').default('').notNull(),
  temperature: text('temperature').default('').notNull(),
  duration: text('duration').default('').notNull(),
  operatingPrincipleMn: text('operating_principle_mn').notNull(),
  operatingPrincipleEn: text('operating_principle_en').notNull(),
  qualityControlIndicatorMn: text('quality_control_indicator_mn').notNull(),
  qualityControlIndicatorEn: text('quality_control_indicator_en').notNull(),
  sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
  verificationStatus: text('verification_status').default('reference_standard').notNull(),
});

// 7. Factories
export const factories = pgTable('factories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameMn: text('name_mn').notNull(),
  nameEn: text('name_en').notNull(),
  locationMn: text('location_mn').notNull(),
  locationEn: text('location_en').notNull(),
  descriptionMn: text('description_mn').notNull(),
  descriptionEn: text('description_en').notNull(),
  productsProducedMn: text('products_produced_mn').notNull(),
  productsProducedEn: text('products_produced_en').notNull(),
  imageUrl: text('image_url').default('').notNull(),
  imageSource: text('image_source').default('').notNull(),
  videoUrl: text('video_url').default('').notNull(),
  videoSource: text('video_source').default('').notNull(),
  technologiesUsedMn: text('technologies_used_mn').notNull(),
  technologiesUsedEn: text('technologies_used_en').notNull(),
  equipmentUsedMn: text('equipment_used_mn').notNull(),
  equipmentUsedEn: text('equipment_used_en').notNull(),
  officialWebsite: text('official_website').default('').notNull(),
  sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
  verificationStatus: text('verification_status').default('needs_verification').notNull(), // 'verified' | 'needs_verification'
  status: text('status').default('published').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Articles (Knowledge & Research)
export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  topic: text('topic').notNull(), // 'HACCP' | 'ISO 22000' | 'Codex Alimentarius' | 'Food Standards' | 'Food Safety' | 'Food Chemistry' | 'Food Microbiology' | 'Food Technology Research'
  titleMn: text('title_mn').notNull(),
  titleEn: text('title_en').notNull(),
  summaryMn: text('summary_mn').notNull(),
  summaryEn: text('summary_en').notNull(),
  contentMn: text('content_mn').notNull(),
  contentEn: text('content_en').notNull(),
  imageUrl: text('image_url').default('').notNull(),
  imageSource: text('image_source').default('').notNull(),
  author: text('author').notNull(),
  publishedDate: text('published_date').notNull(),
  sourceId: integer('source_id').references(() => sources.id, { onDelete: 'set null' }),
  verificationStatus: text('verification_status').default('verified').notNull(),
  status: text('status').default('published').notNull(), // 'published' | 'draft'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Media
export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  mediaType: text('media_type').notNull(), // 'image' | 'video'
  url: text('url').notNull(),
  sourceAttribution: text('source_attribution').notNull(),
  entityType: text('entity_type').default('general').notNull(), // 'product' | 'stage' | 'equipment' | 'factory' | 'article' | 'general'
  entityId: integer('entity_id'),
  uploadedBy: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Comments
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  entityType: text('entity_type').notNull(), // 'product' | 'article' | 'factory'
  entityId: integer('entity_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Favorites & Studied Progress
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  isFavorite: boolean('is_favorite').default(true).notNull(),
  isStudied: boolean('is_studied').default(false).notNull(),
  notes: text('notes').default('').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  stages: many(productionStages),
  productSources: many(productSources),
  favorites: many(favorites),
}));

export const productionStagesRelations = relations(productionStages, ({ one }) => ({
  product: one(products, {
    fields: [productionStages.productId],
    references: [products.id],
  }),
  equipment: one(equipment, {
    fields: [productionStages.equipmentId],
    references: [equipment.id],
  }),
  source: one(sources, {
    fields: [productionStages.sourceId],
    references: [sources.id],
  }),
}));

export const productSourcesRelations = relations(productSources, ({ one }) => ({
  product: one(products, {
    fields: [productSources.productId],
    references: [products.id],
  }),
  source: one(sources, {
    fields: [productSources.sourceId],
    references: [sources.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}));
