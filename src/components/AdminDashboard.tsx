import React, { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, Upload } from 'lucide-react';
import {
  ArticleItem,
  Category,
  EquipmentItem,
  FactoryItem,
  Lang,
  MediaItem,
  Product,
  ProductionStage,
  SourceItem,
} from '../types/foodtrace';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface AdminOverview {
  categories: Category[];
  products: Product[];
  stages: ProductionStage[];
  equipment: EquipmentItem[];
  factories: FactoryItem[];
  articles: ArticleItem[];
  sources: SourceItem[];
  media: MediaItem[];
}

interface AdminDashboardProps {
  lang: Lang;
  onDataChanged: () => void;
}

type AdminTab = 'products' | 'stages' | 'categories' | 'equipment' | 'factories' | 'articles' | 'sources' | 'media';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ lang, onDataChanged }) => {
  const { dbUser, getToken } = useAuth();
  const [tab, setTab] = useState<AdminTab>('products');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: AdminTab; id: number; label: string } | null>(null);

  // Product Form State (create or edit)
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodForm, setProdForm] = useState({
    nameMn: '',
    nameEn: '',
    categoryId: 1,
    imageUrl: '/src/assets/images/hero_food_facility_1794641656944.jpg',
    imageSource: 'FOOD TRACE Visual Reference',
    overviewMn: '',
    mainRawMaterialMn: '',
    rawMaterialPropertiesMn: '',
    processSequenceSummaryMn: '',
    equipmentSummaryMn: '',
    processingRegimeMn: '',
    qualityControlMn: '',
    foodSafetyMn: '',
    packagingMn: '',
    storageMn: '',
    transportMn: '',
    flowchartText: 'Түүхий эд хүлээн авах -> Боловсруулах -> Савлах -> Хадгалах',
    verificationStatus: 'needs_verification',
    status: 'published',
  });

  // Category Form
  const [catForm, setCatForm] = useState({ nameMn: '', nameEn: '', descriptionMn: '', sortOrder: 10 });

  // Stage Form
  const [stageForm, setStageForm] = useState({
    productId: 1,
    stepOrder: 1,
    titleMn: '',
    titleEn: '',
    descriptionMn: '',
    imageUrl: '/src/assets/images/equipment_pasteurizer_1794641658125.jpg',
    imageSource: 'FOOD TRACE Reference',
    videoUrl: '',
    videoSource: '',
    equipmentId: '',
    equipmentNameMn: '',
    temperature: '',
    duration: '',
    operatingPrincipleMn: '',
    qualityControlIndicatorMn: '',
    sourceId: '',
    verificationStatus: 'needs_verification',
  });

  // Equipment Form
  const [eqForm, setEqForm] = useState({
    nameMn: '',
    nameEn: '',
    imageUrl: '/src/assets/images/equipment_pasteurizer_1794641658125.jpg',
    imageSource: '',
    purposeMn: '',
    structureMn: '',
    mainPartsMn: '',
    operatingPrincipleMn: '',
    technicalSpecsMn: '',
    sectorMn: '',
    relatedStageMn: '',
    sourceId: '',
  });

  // Factory Form
  const [facForm, setFacForm] = useState({
    nameMn: '',
    nameEn: '',
    locationMn: '',
    descriptionMn: '',
    productsProducedMn: '',
    imageUrl: '/src/assets/images/factory_dairy_interior_1794641658340.jpg',
    imageSource: 'Баталгаажуулах шаардлагатай',
    technologiesUsedMn: '',
    equipmentUsedMn: '',
    officialWebsite: '',
    sourceId: '',
    verificationStatus: 'needs_verification',
  });

  // Article Form
  const [artForm, setArtForm] = useState({
    topic: 'HACCP',
    titleMn: '',
    titleEn: '',
    summaryMn: '',
    contentMn: '',
    author: 'FOOD TRACE Editorial',
    publishedDate: new Date().toISOString().slice(0, 10),
    imageUrl: '/src/assets/images/research_food_lab_1794641659359.jpg',
    imageSource: 'FOOD TRACE Lab Reference',
    sourceId: '',
    status: 'published',
  });

  // Source Form
  const [srcForm, setSrcForm] = useState({
    title: '',
    organization: '',
    year: '2025',
    url: '',
    citationType: 'standard',
    notesMn: '',
    verified: true,
  });

  // Media Upload Form
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaAttribution, setMediaAttribution] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await apiFetch<AdminOverview>('/api/admin/overview', {}, token);
      setOverview(res);
      if (res.categories[0]) {
        setProdForm((p) => ({ ...p, categoryId: p.categoryId || res.categories[0].id }));
      }
      if (res.products[0]) {
        setStageForm((s) => ({ ...s, productId: s.productId || res.products[0].id }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbUser?.role === 'admin') {
      loadOverview();
    } else {
      setLoading(false);
    }
  }, [dbUser?.role]);

  if (dbUser?.role !== 'admin') {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-16">
        <div className="bg-white border border-[#E2E8E3] rounded-xl p-8 text-center space-y-2">
          <h1 className="text-xl font-bold text-[#111C16]">
            {lang === 'mn' ? 'Админ эрх шаардлагатай' : 'Administrator Access Required'}
          </h1>
          <p className="text-sm text-[#47544D]">
            {lang === 'mn'
              ? 'Энэ хэсэгт зөвхөн сервер талд баталгаажсан админ хэрэглэгч нэвтэрч өгөгдөл удирдах эрхтэй.'
              : 'Server-verified administrator privileges are required to manage FOOD TRACE records.'}
          </p>
        </div>
      </div>
    );
  }

  const runAction = async (fn: () => Promise<void>, okMsg: string) => {
    setMessage(null);
    setError(null);
    try {
      await fn();
      setMessage(okMsg);
      await loadOverview();
      onDataChanged();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const nodes = prodForm.flowchartText
      .split('->')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label, idx, arr) => ({
        id: String(idx + 1),
        labelMn: label,
        labelEn: label,
        nextIds: idx < arr.length - 1 ? [String(idx + 2)] : [],
      }));

    const payload = { ...prodForm, flowchartJson: nodes };
    await runAction(async () => {
      const token = await getToken();
      if (editingProductId) {
        await apiFetch(`/api/admin/products/${editingProductId}`, { method: 'PUT', body: JSON.stringify(payload) }, token);
        setEditingProductId(null);
      } else {
        await apiFetch('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) }, token);
      }
      setProdForm((p) => ({ ...p, nameMn: '', nameEn: '', overviewMn: '' }));
    }, lang === 'mn' ? 'Бүтээгдэхүүн хадгалагдлаа.' : 'Product saved.');
  };

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdForm({
      nameMn: p.nameMn,
      nameEn: p.nameEn,
      categoryId: p.categoryId,
      imageUrl: p.imageUrl,
      imageSource: p.imageSource,
      overviewMn: p.overviewMn,
      mainRawMaterialMn: p.mainRawMaterialMn,
      rawMaterialPropertiesMn: p.rawMaterialPropertiesMn,
      processSequenceSummaryMn: p.processSequenceSummaryMn,
      equipmentSummaryMn: p.equipmentSummaryMn,
      processingRegimeMn: p.processingRegimeMn,
      qualityControlMn: p.qualityControlMn,
      foodSafetyMn: p.foodSafetyMn,
      packagingMn: p.packagingMn,
      storageMn: p.storageMn,
      transportMn: p.transportMn,
      flowchartText: (p.flowchartJson || []).map((n) => n.labelMn).join(' -> '),
      verificationStatus: p.verificationStatus,
      status: p.status,
    });
  };

  const handleExecuteDelete = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    setConfirmDelete(null);
    const endpointMap: Record<AdminTab, string> = {
      products: `/api/admin/products/${id}`,
      stages: `/api/admin/stages/${id}`,
      categories: `/api/admin/categories/${id}`,
      equipment: `/api/admin/equipment/${id}`,
      factories: `/api/admin/factories/${id}`,
      articles: `/api/admin/articles/${id}`,
      sources: `/api/admin/sources/${id}`,
      media: `/api/admin/media/${id}`,
    };
    await runAction(async () => {
      const token = await getToken();
      await apiFetch(endpointMap[type], { method: 'DELETE' }, token);
    }, lang === 'mn' ? 'Бичлэг устгагдлаа.' : 'Record deleted.');
  };

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) return;
    await runAction(async () => {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', mediaFile);
      formData.append('title', mediaTitle || mediaFile.name);
      formData.append('sourceAttribution', mediaAttribution || 'Баталгаажуулах шаардлагатай');
      await apiFetch('/api/admin/media/upload', { method: 'POST', body: formData }, token);
      setMediaFile(null);
      setMediaTitle('');
      setMediaAttribution('');
    }, lang === 'mn' ? 'Зураг/видео файл storage-д хадгалагдлаа.' : 'Media uploaded to server storage.');
  };

  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: 'products', label: lang === 'mn' ? 'Бүтээгдэхүүн' : 'Products' },
    { id: 'stages', label: lang === 'mn' ? 'Үе шат / Схем' : 'Process Stages' },
    { id: 'categories', label: lang === 'mn' ? 'Ангилал' : 'Categories' },
    { id: 'equipment', label: lang === 'mn' ? 'Тоног төхөөрөмж' : 'Equipment' },
    { id: 'factories', label: lang === 'mn' ? 'Үйлдвэрүүд' : 'Factories' },
    { id: 'articles', label: lang === 'mn' ? 'Нийтлэл' : 'Articles' },
    { id: 'sources', label: lang === 'mn' ? 'Эх сурвалж' : 'Sources' },
    { id: 'media', label: lang === 'mn' ? 'Зураг, видео' : 'Media Storage' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-6">
      <div className="border-b border-[#E2E8E3] pb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#111C16]">
            {lang === 'mn' ? 'Админ удирдлагын самбар' : 'Administrator Console'}
          </h1>
          <p className="text-sm text-[#47544D] mt-1">
            {lang === 'mn'
              ? 'Бүтээгдэхүүн, технологийн схем, тоног төхөөрөмж, үйлдвэр, судалгаа ба эх сурвалжийг удирдах.'
              : 'Manage products, flowcharts, machinery, factories, research articles, and citations.'}
          </p>
        </div>
        <div className="text-xs text-[#14532D] font-mono-tech">
          {dbUser.email} (admin)
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#F0F7F2] border border-[#E2E8E3] rounded-xl">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              tab === item.id ? 'bg-[#14532D] text-white' : 'text-[#2C3A32] hover:bg-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="p-3.5 rounded-lg bg-[#DCFCE7] border border-[#86EFAC] text-xs font-semibold text-[#14532D]">
          {message}
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] text-xs font-semibold text-[#991B1B]">
          {error}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8E3] rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-[#111C16]">
              {lang === 'mn' ? 'Устгахыг баталгаажуулах' : 'Confirm Deletion'}
            </h3>
            <p className="text-sm text-[#47544D]">
              {lang === 'mn'
                ? `"${confirmDelete.label}" бичлэгийг бүрмөсөн устгах уу?`
                : `Permanently delete "${confirmDelete.label}"?`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-xs font-semibold border border-[#E2E8E3] rounded-lg"
              >
                {lang === 'mn' ? 'Болих' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 text-xs font-semibold bg-[#991B1B] text-white rounded-lg"
              >
                {lang === 'mn' ? 'Устгах' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading || !overview ? (
        <div className="h-64 bg-white border border-[#E2E8E3] rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-8">
          {/* PRODUCTS TAB */}
          {tab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleSaveProduct}
                className="lg:col-span-6 bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3.5"
              >
                <h2 className="text-base font-bold text-[#111C16]">
                  {editingProductId
                    ? lang === 'mn' ? 'Бүтээгдэхүүн засах' : 'Edit Product'
                    : lang === 'mn' ? 'Шинэ бүтээгдэхүүн нэмэх' : 'Add Product'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    value={prodForm.nameMn}
                    onChange={(e) => setProdForm({ ...prodForm, nameMn: e.target.value })}
                    placeholder="Нэр (Монгол)"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                  <input
                    value={prodForm.nameEn}
                    onChange={(e) => setProdForm({ ...prodForm, nameEn: e.target.value })}
                    placeholder="Name (English)"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: Number(e.target.value) })}
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  >
                    {overview.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameMn}
                      </option>
                    ))}
                  </select>
                  <select
                    value={prodForm.verificationStatus}
                    onChange={(e) => setProdForm({ ...prodForm, verificationStatus: e.target.value })}
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  >
                    <option value="reference_standard">Жишиг стандарт</option>
                    <option value="verified">Баталгаажсан</option>
                    <option value="needs_verification">Баталгаажуулах шаардлагатай</option>
                  </select>
                  <select
                    value={prodForm.status}
                    onChange={(e) => setProdForm({ ...prodForm, status: e.target.value })}
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  >
                    <option value="published">Нийтлэх (Published)</option>
                    <option value="draft">Ноорог (Draft)</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={prodForm.imageUrl}
                    onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                    placeholder="Зургийн URL"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                  <input
                    value={prodForm.imageSource}
                    onChange={(e) => setProdForm({ ...prodForm, imageSource: e.target.value })}
                    placeholder="Зургийн эх сурвалж"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                </div>
                <textarea
                  rows={2}
                  value={prodForm.overviewMn}
                  onChange={(e) => setProdForm({ ...prodForm, overviewMn: e.target.value })}
                  placeholder="Ерөнхий танилцуулга"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <input
                  value={prodForm.mainRawMaterialMn}
                  onChange={(e) => setProdForm({ ...prodForm, mainRawMaterialMn: e.target.value })}
                  placeholder="Үндсэн түүхий эд"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <input
                  value={prodForm.rawMaterialPropertiesMn}
                  onChange={(e) => setProdForm({ ...prodForm, rawMaterialPropertiesMn: e.target.value })}
                  placeholder="Түүхий эдийн шинж чанар"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <input
                  value={prodForm.flowchartText}
                  onChange={(e) => setProdForm({ ...prodForm, flowchartText: e.target.value })}
                  placeholder="Технологийн схем (-> тэмдэгтээр тусгаарлана)"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg font-mono-tech"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={prodForm.processingRegimeMn}
                    onChange={(e) => setProdForm({ ...prodForm, processingRegimeMn: e.target.value })}
                    placeholder="Боловсруулах технологийн горим"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                  <input
                    value={prodForm.equipmentSummaryMn}
                    onChange={(e) => setProdForm({ ...prodForm, equipmentSummaryMn: e.target.value })}
                    placeholder="Ашиглагдах тоног төхөөрөмж"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                  <input
                    value={prodForm.qualityControlMn}
                    onChange={(e) => setProdForm({ ...prodForm, qualityControlMn: e.target.value })}
                    placeholder="Чанарын хяналт"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                  <input
                    value={prodForm.foodSafetyMn}
                    onChange={(e) => setProdForm({ ...prodForm, foodSafetyMn: e.target.value })}
                    placeholder="Хүнсний аюулгүй байдал"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                  <input
                    value={prodForm.packagingMn}
                    onChange={(e) => setProdForm({ ...prodForm, packagingMn: e.target.value })}
                    placeholder="Савлагаа"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                  <input
                    value={prodForm.storageMn}
                    onChange={(e) => setProdForm({ ...prodForm, storageMn: e.target.value })}
                    placeholder="Хадгалалт"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                </div>
                <input
                  value={prodForm.transportMn}
                  onChange={(e) => setProdForm({ ...prodForm, transportMn: e.target.value })}
                  placeholder="Тээвэрлэлт"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editingProductId ? 'Шинэчлэх' : 'Бүтээгдэхүүн хадгалах'}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={() => setEditingProductId(null)}
                      className="px-4 py-2 text-xs font-semibold border border-[#E2E8E3] rounded-lg"
                    >
                      Болих
                    </button>
                  )}
                </div>
              </form>

              <div className="lg:col-span-6 bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3">
                <h2 className="text-base font-bold text-[#111C16]">
                  Бүртгэлтэй бүтээгдэхүүнүүд ({overview.products.length})
                </h2>
                <div className="divide-y divide-[#E2E8E3]">
                  {overview.products.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#111C16] truncate">{p.nameMn}</div>
                        <div className="text-xs text-[#47544D]">
                          {p.status} · {p.verificationStatus}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditProduct(p)}
                          className="p-1.5 text-[#14532D] hover:bg-[#F0F7F2] rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ type: 'products', id: p.id, label: p.nameMn })}
                          className="p-1.5 text-[#991B1B] hover:bg-[#FEE2E2] rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGES TAB */}
          {tab === 'stages' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAction(async () => {
                    const token = await getToken();
                    await apiFetch('/api/admin/stages', { method: 'POST', body: JSON.stringify(stageForm) }, token);
                    setStageForm((s) => ({ ...s, titleMn: '', descriptionMn: '' }));
                  }, 'Үйлдвэрлэлийн үе шат нэмэгдлээ.');
                }}
                className="lg:col-span-6 bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3"
              >
                <h2 className="text-base font-bold text-[#111C16]">Үйлдвэрлэлийн үе шат нэмэх</h2>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={stageForm.productId}
                    onChange={(e) => setStageForm({ ...stageForm, productId: Number(e.target.value) })}
                    className="col-span-2 p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  >
                    {overview.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameMn}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={stageForm.stepOrder}
                    onChange={(e) => setStageForm({ ...stageForm, stepOrder: Number(e.target.value) })}
                    placeholder="Дараалал"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                </div>
                <input
                  required
                  value={stageForm.titleMn}
                  onChange={(e) => setStageForm({ ...stageForm, titleMn: e.target.value })}
                  placeholder="Дамжлагын нэр (жишээ: Пастеризаци)"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <textarea
                  rows={2}
                  value={stageForm.descriptionMn}
                  onChange={(e) => setStageForm({ ...stageForm, descriptionMn: e.target.value })}
                  placeholder="Тайлбар"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={stageForm.temperature}
                    onChange={(e) => setStageForm({ ...stageForm, temperature: e.target.value })}
                    placeholder="Температур (ж.нь 72°C)"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                  <input
                    value={stageForm.duration}
                    onChange={(e) => setStageForm({ ...stageForm, duration: e.target.value })}
                    placeholder="Хугацаа (ж.нь 15 сек)"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                </div>
                <input
                  value={stageForm.equipmentNameMn}
                  onChange={(e) => setStageForm({ ...stageForm, equipmentNameMn: e.target.value })}
                  placeholder="Тоног төхөөрөмжийн нэр"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <input
                  value={stageForm.operatingPrincipleMn}
                  onChange={(e) => setStageForm({ ...stageForm, operatingPrincipleMn: e.target.value })}
                  placeholder="Үйл ажиллагааны үндсэн зарчим"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <input
                  value={stageForm.qualityControlIndicatorMn}
                  onChange={(e) => setStageForm({ ...stageForm, qualityControlIndicatorMn: e.target.value })}
                  placeholder="Чанарын хяналтын үзүүлэлт"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={stageForm.imageUrl}
                    onChange={(e) => setStageForm({ ...stageForm, imageUrl: e.target.value })}
                    placeholder="Зургийн URL"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                  <input
                    value={stageForm.videoUrl}
                    onChange={(e) => setStageForm({ ...stageForm, videoUrl: e.target.value })}
                    placeholder="Видео URL (сонголт)"
                    className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                  />
                </div>
                <select
                  value={stageForm.sourceId}
                  onChange={(e) => setStageForm({ ...stageForm, sourceId: e.target.value })}
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                >
                  <option value="">Эх сурвалж сонгох...</option>
                  {overview.sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg"
                >
                  Үе шат хадгалах
                </button>
              </form>

              <div className="lg:col-span-6 bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-2 max-h-[600px] overflow-y-auto">
                <h2 className="text-base font-bold text-[#111C16] mb-3">
                  Бүртгэлтэй үе шатууд ({overview.stages.length})
                </h2>
                {overview.stages.map((s) => (
                  <div key={s.id} className="py-2.5 border-b border-[#E2E8E3] flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[#111C16]">
                        #{s.stepOrder} · {s.titleMn}
                      </div>
                      <div className="text-xs text-[#47544D] font-mono-tech">
                        Product #{s.productId} · {s.temperature} · {s.duration}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ type: 'stages', id: s.id, label: s.titleMn })}
                      className="p-1.5 text-[#991B1B]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {tab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAction(async () => {
                    const token = await getToken();
                    await apiFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(catForm) }, token);
                    setCatForm({ nameMn: '', nameEn: '', descriptionMn: '', sortOrder: 10 });
                  }, 'Ангилал үүслээ.');
                }}
                className="bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3"
              >
                <h2 className="text-base font-bold text-[#111C16]">Шинэ ангилал үүсгэх</h2>
                <input
                  required
                  value={catForm.nameMn}
                  onChange={(e) => setCatForm({ ...catForm, nameMn: e.target.value })}
                  placeholder="Ангиллын нэр (Монгол)"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <input
                  value={catForm.nameEn}
                  onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })}
                  placeholder="Category Name (English)"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <textarea
                  rows={2}
                  value={catForm.descriptionMn}
                  onChange={(e) => setCatForm({ ...catForm, descriptionMn: e.target.value })}
                  placeholder="Тайлбар"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg">
                  Ангилал нэмэх
                </button>
              </form>
              <div className="bg-white border border-[#E2E8E3] rounded-xl p-6 divide-y divide-[#E2E8E3]">
                {overview.categories.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between">
                    <span className="text-sm font-medium">{c.nameMn}</span>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ type: 'categories', id: c.id, label: c.nameMn })}
                      className="text-[#991B1B] p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EQUIPMENT TAB */}
          {tab === 'equipment' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAction(async () => {
                    const token = await getToken();
                    await apiFetch('/api/admin/equipment', { method: 'POST', body: JSON.stringify(eqForm) }, token);
                    setEqForm((f) => ({ ...f, nameMn: '', nameEn: '', purposeMn: '' }));
                  }, 'Тоног төхөөрөмж нэмэгдлээ.');
                }}
                className="bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3"
              >
                <h2 className="text-base font-bold text-[#111C16]">Тоног төхөөрөмж нэмэх</h2>
                <input required value={eqForm.nameMn} onChange={(e) => setEqForm({ ...eqForm, nameMn: e.target.value })} placeholder="Нэр (Монгол)" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={eqForm.nameEn} onChange={(e) => setEqForm({ ...eqForm, nameEn: e.target.value })} placeholder="Name (English)" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={eqForm.purposeMn} onChange={(e) => setEqForm({ ...eqForm, purposeMn: e.target.value })} placeholder="Зориулалт" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={eqForm.structureMn} onChange={(e) => setEqForm({ ...eqForm, structureMn: e.target.value })} placeholder="Бүтэц" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={eqForm.mainPartsMn} onChange={(e) => setEqForm({ ...eqForm, mainPartsMn: e.target.value })} placeholder="Үндсэн эд анги" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={eqForm.operatingPrincipleMn} onChange={(e) => setEqForm({ ...eqForm, operatingPrincipleMn: e.target.value })} placeholder="Ажиллах зарчим" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={eqForm.technicalSpecsMn} onChange={(e) => setEqForm({ ...eqForm, technicalSpecsMn: e.target.value })} placeholder="Техникийн үзүүлэлт" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={eqForm.sectorMn} onChange={(e) => setEqForm({ ...eqForm, sectorMn: e.target.value })} placeholder="Ашиглах салбар" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg">Хадгалах</button>
              </form>
              <div className="bg-white border border-[#E2E8E3] rounded-xl p-6 divide-y divide-[#E2E8E3]">
                {overview.equipment.map((eq) => (
                  <div key={eq.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{eq.nameMn}</div>
                      <div className="text-xs text-[#47544D]">{eq.sectorMn}</div>
                    </div>
                    <button type="button" onClick={() => setConfirmDelete({ type: 'equipment', id: eq.id, label: eq.nameMn })} className="text-[#991B1B] p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FACTORIES TAB */}
          {tab === 'factories' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAction(async () => {
                    const token = await getToken();
                    await apiFetch('/api/admin/factories', { method: 'POST', body: JSON.stringify(facForm) }, token);
                    setFacForm((f) => ({ ...f, nameMn: '', locationMn: '', descriptionMn: '' }));
                  }, 'Үйлдвэрийн мэдээлэл нэмэгдлээ.');
                }}
                className="bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3"
              >
                <h2 className="text-base font-bold text-[#111C16]">Үйлдвэрийн мэдээлэл нэмэх</h2>
                <input required value={facForm.nameMn} onChange={(e) => setFacForm({ ...facForm, nameMn: e.target.value })} placeholder="Үйлдвэрийн нэр" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={facForm.locationMn} onChange={(e) => setFacForm({ ...facForm, locationMn: e.target.value })} placeholder="Байршил" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <textarea rows={2} value={facForm.descriptionMn} onChange={(e) => setFacForm({ ...facForm, descriptionMn: e.target.value })} placeholder="Танилцуулга" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={facForm.productsProducedMn} onChange={(e) => setFacForm({ ...facForm, productsProducedMn: e.target.value })} placeholder="Үйлдвэрлэдэг бүтээгдэхүүн" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={facForm.technologiesUsedMn} onChange={(e) => setFacForm({ ...facForm, technologiesUsedMn: e.target.value })} placeholder="Ашигладаг технологи" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={facForm.officialWebsite} onChange={(e) => setFacForm({ ...facForm, officialWebsite: e.target.value })} placeholder="Албан ёсны вебсайт (https://...)" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <select value={facForm.verificationStatus} onChange={(e) => setFacForm({ ...facForm, verificationStatus: e.target.value })} className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg">
                  <option value="needs_verification">Баталгаажуулах шаардлагатай</option>
                  <option value="verified">Баталгаажсан</option>
                </select>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg">Хадгалах</button>
              </form>
              <div className="bg-white border border-[#E2E8E3] rounded-xl p-6 divide-y divide-[#E2E8E3]">
                {overview.factories.map((f) => (
                  <div key={f.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{f.nameMn}</div>
                      <div className="text-xs text-[#47544D]">{f.verificationStatus} · {f.locationMn}</div>
                    </div>
                    <button type="button" onClick={() => setConfirmDelete({ type: 'factories', id: f.id, label: f.nameMn })} className="text-[#991B1B] p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ARTICLES TAB */}
          {tab === 'articles' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAction(async () => {
                    const token = await getToken();
                    await apiFetch('/api/admin/articles', { method: 'POST', body: JSON.stringify(artForm) }, token);
                    setArtForm((a) => ({ ...a, titleMn: '', summaryMn: '', contentMn: '' }));
                  }, 'Судалгааны нийтлэл хадгалагдлаа.');
                }}
                className="bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3"
              >
                <h2 className="text-base font-bold text-[#111C16]">Судалгааны материал нийтлэх / ноороглох</h2>
                <div className="grid grid-cols-2 gap-3">
                  <select value={artForm.topic} onChange={(e) => setArtForm({ ...artForm, topic: e.target.value })} className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg">
                    <option value="HACCP">HACCP</option>
                    <option value="ISO 22000">ISO 22000</option>
                    <option value="Codex Alimentarius">Codex Alimentarius</option>
                    <option value="Food Standards">Хүнсний стандарт</option>
                    <option value="Food Safety">Хүнсний аюулгүй байдал</option>
                    <option value="Food Chemistry">Хүнсний химийн найрлага</option>
                    <option value="Food Microbiology">Хүнсний микробиологи</option>
                    <option value="Food Technology Research">Хүнсний технологийн судалгаа</option>
                  </select>
                  <select value={artForm.status} onChange={(e) => setArtForm({ ...artForm, status: e.target.value })} className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg">
                    <option value="published">Нийтлэх (Published)</option>
                    <option value="draft">Ноорог (Draft)</option>
                  </select>
                </div>
                <input required value={artForm.titleMn} onChange={(e) => setArtForm({ ...artForm, titleMn: e.target.value })} placeholder="Гарчиг (Монгол)" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <input value={artForm.author} onChange={(e) => setArtForm({ ...artForm, author: e.target.value })} placeholder="Зохиогч" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <textarea rows={2} value={artForm.summaryMn} onChange={(e) => setArtForm({ ...artForm, summaryMn: e.target.value })} placeholder="Хураангуй" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <textarea rows={4} value={artForm.contentMn} onChange={(e) => setArtForm({ ...artForm, contentMn: e.target.value })} placeholder="Үндсэн текст" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg">Хадгалах</button>
              </form>
              <div className="bg-white border border-[#E2E8E3] rounded-xl p-6 divide-y divide-[#E2E8E3]">
                {overview.articles.map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{a.titleMn}</div>
                      <div className="text-xs text-[#47544D]">{a.topic} · {a.status} · {a.publishedDate}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          runAction(async () => {
                            const token = await getToken();
                            await apiFetch(
                              `/api/admin/articles/${a.id}`,
                              { method: 'PUT', body: JSON.stringify({ ...a, status: a.status === 'published' ? 'draft' : 'published' }) },
                              token
                            );
                          }, 'Нийтлэлийн төлөв өөрчлөгдлөө.')
                        }
                        className="px-2.5 py-1 text-xs border border-[#E2E8E3] rounded hover:bg-[#F0F7F2]"
                      >
                        {a.status === 'published' ? 'Ноорог болгох' : 'Нийтлэх'}
                      </button>
                      <button type="button" onClick={() => setConfirmDelete({ type: 'articles', id: a.id, label: a.titleMn })} className="text-[#991B1B] p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOURCES TAB */}
          {tab === 'sources' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runAction(async () => {
                    const token = await getToken();
                    await apiFetch('/api/admin/sources', { method: 'POST', body: JSON.stringify(srcForm) }, token);
                    setSrcForm({ title: '', organization: '', year: '2025', url: '', citationType: 'standard', notesMn: '', verified: true });
                  }, 'Эх сурвалж бүртгэгдлээ.');
                }}
                className="bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3"
              >
                <h2 className="text-base font-bold text-[#111C16]">Эх сурвалж оруулах</h2>
                <input required value={srcForm.title} onChange={(e) => setSrcForm({ ...srcForm, title: e.target.value })} placeholder="Ном, стандарт эсвэл судалгааны нэр" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <div className="grid grid-cols-2 gap-3">
                  <input required value={srcForm.organization} onChange={(e) => setSrcForm({ ...srcForm, organization: e.target.value })} placeholder="Байгууллага" className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                  <input value={srcForm.year} onChange={(e) => setSrcForm({ ...srcForm, year: e.target.value })} placeholder="Он" className="p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                </div>
                <input value={srcForm.url} onChange={(e) => setSrcForm({ ...srcForm, url: e.target.value })} placeholder="Албан ёсны URL" className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg" />
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg">Эх сурвалж хадгалах</button>
              </form>
              <div className="bg-white border border-[#E2E8E3] rounded-xl p-6 divide-y divide-[#E2E8E3]">
                {overview.sources.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{s.title}</div>
                      <div className="text-xs text-[#47544D]">{s.organization} · {s.year}</div>
                    </div>
                    <button type="button" onClick={() => setConfirmDelete({ type: 'sources', id: s.id, label: s.title })} className="text-[#991B1B] p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEDIA UPLOAD TAB */}
          {tab === 'media' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form onSubmit={handleUploadMedia} className="bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3.5">
                <h2 className="text-base font-bold text-[#111C16]">Зураг, видео файл storage-д оруулах</h2>
                <input
                  type="file"
                  accept="image/*,video/*"
                  required
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="w-full text-sm border border-[#E2E8E3] rounded-lg p-2"
                />
                <input
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="Файлын нэр / тайлбар"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <input
                  required
                  value={mediaAttribution}
                  onChange={(e) => setMediaAttribution(e.target.value)}
                  placeholder="Зураг, видеоны эх сурвалж (заавал)"
                  className="w-full p-2.5 text-sm border border-[#E2E8E3] rounded-lg"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Storage руу хуулах
                </button>
              </form>
              <div className="bg-white border border-[#E2E8E3] rounded-xl p-6 space-y-3">
                <h2 className="text-base font-bold text-[#111C16]">Хадгалагдсан медиа ({overview.media.length})</h2>
                <div className="divide-y divide-[#E2E8E3]">
                  {overview.media.map((m) => (
                    <div key={m.id} className="py-2.5">
                      <div className="text-sm font-semibold text-[#111C16]">{m.title}</div>
                      <div className="text-xs font-mono-tech text-[#14532D] break-all">{m.url}</div>
                      <div className="text-xs text-[#47544D]">{m.sourceAttribution}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
