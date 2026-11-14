import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from 'lucide-react';
import {
  ArticleItem,
  Category,
  EquipmentItem,
  FactoryItem,
  Lang,
  Product,
  ProductionStage,
  SourceItem,
} from './types/foodtrace';
import { copy, getVerificationLabel, pickText } from './i18n/translations';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiFetch } from './lib/api';
import { SafeImage } from './components/SafeImage';
import { ProductDetailView } from './components/ProductDetailView';
import { EquipmentView } from './components/EquipmentView';
import { FactoriesView } from './components/FactoriesView';
import { ResearchView } from './components/ResearchView';
import { LibraryView } from './components/LibraryView';
import { AdminDashboard } from './components/AdminDashboard';

type RouteView =
  | { page: 'home' }
  | { page: 'products'; categorySlug?: string | null }
  | { page: 'product'; slug: string }
  | { page: 'equipment'; slug?: string | null }
  | { page: 'factories' }
  | { page: 'research'; slug?: string | null }
  | { page: 'library' }
  | { page: 'admin' }
  | { page: 'search'; query: string };

interface BootstrapData {
  categories: Category[];
  products: Product[];
  equipment: EquipmentItem[];
  factories: FactoryItem[];
  articles: ArticleItem[];
  sources: SourceItem[];
}

interface SearchResults {
  products: Product[];
  stages: Array<{
    stage: ProductionStage;
    productSlug: string;
    productNameMn: string;
    productNameEn: string;
  }>;
  equipment: EquipmentItem[];
  factories: FactoryItem[];
  articles: ArticleItem[];
}

function FoodTraceApp() {
  const [lang, setLang] = useState<Lang>('mn');
  const [route, setRoute] = useState<RouteView>({ page: 'home' });
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Search State
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<'all' | 'products' | 'stages' | 'equipment' | 'factories' | 'articles'>('all');

  // Home category filter
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('ALL');

  const { dbUser, getToken, loginWithGoogle, logout, authError } = useAuth();
  const t = copy[lang];

  const loadBootstrap = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = await getToken();
      const res = await apiFetch<BootstrapData>('/api/bootstrap', {}, token);
      setData(res);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  const navigate = (next: RouteView) => {
    setRoute(next);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setSearching(true);
    setRoute({ page: 'search', query: q });
    try {
      const res = await apiFetch<SearchResults>(`/api/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const filteredHomeProducts = useMemo(() => {
    if (!data) return [];
    if (activeCategorySlug === 'ALL') return data.products;
    const cat = data.categories.find((c) => c.slug === activeCategorySlug);
    if (!cat) return data.products;
    return data.products.filter((p) => p.categoryId === cat.id);
  }, [data, activeCategorySlug]);

  const featuredMilk = data?.products.find((p) => p.slug === 'pasteurized-milk') || data?.products[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBF9] text-[#111C16]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E2E8E3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigate({ page: 'home' })}
            className="text-lg font-extrabold tracking-tight text-[#0F3D26] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] rounded"
          >
            {t.brand}
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#47544D]">
            <button
              type="button"
              onClick={() => navigate({ page: 'products', categorySlug: null })}
              className={`hover:text-[#0F3D26] transition-colors whitespace-nowrap shrink-0 py-1 ${
                route.page === 'products' || route.page === 'product'
                  ? 'text-[#0F3D26] underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              {t.nav.products}
            </button>
            <button
              type="button"
              onClick={() => {
                if (featuredMilk) navigate({ page: 'product', slug: featuredMilk.slug });
                else navigate({ page: 'products', categorySlug: null });
              }}
              className="hover:text-[#0F3D26] transition-colors whitespace-nowrap shrink-0 py-1"
            >
              {t.nav.technology}
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'equipment', slug: null })}
              className={`hover:text-[#0F3D26] transition-colors whitespace-nowrap shrink-0 py-1 ${
                route.page === 'equipment'
                  ? 'text-[#0F3D26] underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              {t.nav.equipment}
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'factories' })}
              className={`hover:text-[#0F3D26] transition-colors whitespace-nowrap shrink-0 py-1 ${
                route.page === 'factories'
                  ? 'text-[#0F3D26] underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              {t.nav.factories}
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'research', slug: null })}
              className={`hover:text-[#0F3D26] transition-colors whitespace-nowrap shrink-0 py-1 ${
                route.page === 'research'
                  ? 'text-[#0F3D26] underline underline-offset-8 decoration-2'
                  : ''
              }`}
            >
              {t.nav.research}
            </button>
          </nav>

          {/* Zone 3: Primary Account Action */}
          <div className="flex items-center gap-3 shrink-0">
            {dbUser ? (
              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate({ page: 'library' })}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] hover:underline whitespace-nowrap shrink-0"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {t.nav.library}
                </button>
                {dbUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'admin' })}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111C16] hover:text-[#14532D] whitespace-nowrap shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {t.nav.admin}
                  </button>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-[#E2E8E3] rounded-lg text-[#111C16] hover:bg-[#F0F7F2] transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t.nav.signOut}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="hidden md:inline-flex px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26] transition-colors whitespace-nowrap shrink-0"
              >
                {t.nav.signIn}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle Menu"
              className="md:hidden p-2 border border-[#E2E8E3] rounded-lg text-[#111C16]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8E3] bg-white px-4 py-4 space-y-2">
            <button type="button" onClick={() => navigate({ page: 'products' })} className="block w-full text-left py-2 text-sm font-medium">
              {t.nav.products}
            </button>
            <button
              type="button"
              onClick={() => featuredMilk && navigate({ page: 'product', slug: featuredMilk.slug })}
              className="block w-full text-left py-2 text-sm font-medium"
            >
              {t.nav.technology}
            </button>
            <button type="button" onClick={() => navigate({ page: 'equipment' })} className="block w-full text-left py-2 text-sm font-medium">
              {t.nav.equipment}
            </button>
            <button type="button" onClick={() => navigate({ page: 'factories' })} className="block w-full text-left py-2 text-sm font-medium">
              {t.nav.factories}
            </button>
            <button type="button" onClick={() => navigate({ page: 'research' })} className="block w-full text-left py-2 text-sm font-medium">
              {t.nav.research}
            </button>
            <div className="pt-2 border-t border-[#E2E8E3] flex flex-wrap gap-2">
              {dbUser ? (
                <>
                  <button type="button" onClick={() => navigate({ page: 'library' })} className="px-3 py-2 text-xs font-semibold border border-[#E2E8E3] rounded-lg">
                    {t.nav.library}
                  </button>
                  {dbUser.role === 'admin' && (
                    <button type="button" onClick={() => navigate({ page: 'admin' })} className="px-3 py-2 text-xs font-semibold border border-[#E2E8E3] rounded-lg">
                      {t.nav.admin}
                    </button>
                  )}
                  <button type="button" onClick={logout} className="px-3 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg">
                    {t.nav.signOut}
                  </button>
                </>
              ) : (
                <button type="button" onClick={loginWithGoogle} className="w-full py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg">
                  {t.nav.signIn}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Workspace Search & Language Utility Bar */}
      <div className="bg-[#F0F7F2] border-b border-[#E2E8E3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#47544D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.search.placeholder}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D4E7DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26] transition-colors whitespace-nowrap shrink-0"
            >
              {t.search.button}
            </button>
          </form>

          {/* Language Switcher: MN / EN */}
          <div className="flex items-center justify-end gap-1 p-1 bg-white border border-[#E2E8E3] rounded-lg self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setLang('mn')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                lang === 'mn' ? 'bg-[#14532D] text-white' : 'text-[#47544D] hover:text-[#111C16]'
              }`}
            >
              Монгол
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                lang === 'en' ? 'bg-[#14532D] text-white' : 'text-[#47544D] hover:text-[#111C16]'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {authError && (
        <div className="max-w-[1200px] mx-auto px-6 mt-4">
          <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B]">
            {authError}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {loading && !data ? (
          <div className="max-w-[1200px] mx-auto px-6 py-12 space-y-6">
            <div className="h-72 bg-white border border-[#E2E8E3] rounded-xl animate-pulse" />
            <div className="h-48 bg-white border border-[#E2E8E3] rounded-xl animate-pulse" />
          </div>
        ) : loadError && !data ? (
          <div className="max-w-[1200px] mx-auto px-6 py-12">
            <div className="p-6 bg-white border border-[#E2E8E3] rounded-xl text-sm text-[#991B1B]">
              {loadError}
            </div>
          </div>
        ) : (
          <>
            {/* HOME PAGE */}
            {route.page === 'home' && data && (
              <div className="space-y-14 pb-16">
                {/* Hero Split */}
                <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 lg:pt-12">
                  <div className="bg-white border border-[#E2E8E3] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
                    <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between gap-8">
                      <div>
                        <p className="text-xs font-medium text-[#14532D] mb-4">{t.hero.kicker}</p>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-[#111C16] tracking-tight leading-[1.12]">
                          {t.hero.title}
                        </h1>
                        <p className="mt-5 text-base lg:text-lg text-[#47544D] leading-relaxed max-w-xl">
                          {t.hero.subtitle}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => navigate({ page: 'products', categorySlug: null })}
                          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26] transition-colors whitespace-nowrap"
                        >
                          {t.hero.cta}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        {featuredMilk && (
                          <button
                            type="button"
                            onClick={() => navigate({ page: 'product', slug: featuredMilk.slug })}
                            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold border border-[#E2E8E3] text-[#111C16] rounded-lg hover:bg-[#F0F7F2] transition-colors whitespace-nowrap"
                          >
                            {t.hero.secondaryCta}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-[#FAFBF9] border-t lg:border-t-0 lg:border-l border-[#E2E8E3] flex flex-col">
                      <SafeImage
                        src="/src/assets/images/hero_food_facility_1794641656944.jpg"
                        alt={t.hero.title}
                        aspectClass="aspect-[16/10] lg:h-full"
                      />
                      <div className="px-6 py-3 border-t border-[#E2E8E3] text-xs text-[#47544D] bg-white">
                        {t.hero.caption}
                      </div>
                    </div>
                  </div>

                  {/* Full-width 4-Column Structural Index Strip */}
                  <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#E2E8E3] rounded-xl p-5">
                      <div className="font-mono-tech text-2xl font-bold text-[#14532D]">{data.categories.length}</div>
                      <div className="text-xs text-[#47544D] mt-1">{t.stats.categories}</div>
                    </div>
                    <div className="bg-white border border-[#E2E8E3] rounded-xl p-5">
                      <div className="font-mono-tech text-2xl font-bold text-[#14532D]">{data.products.length}</div>
                      <div className="text-xs text-[#47544D] mt-1">{t.stats.products}</div>
                    </div>
                    <div className="bg-white border border-[#E2E8E3] rounded-xl p-5">
                      <div className="font-mono-tech text-2xl font-bold text-[#14532D]">{data.equipment.length}</div>
                      <div className="text-xs text-[#47544D] mt-1">{t.stats.equipment}</div>
                    </div>
                    <div className="bg-white border border-[#E2E8E3] rounded-xl p-5">
                      <div className="font-mono-tech text-2xl font-bold text-[#14532D]">{data.articles.length}</div>
                      <div className="text-xs text-[#47544D] mt-1">{t.stats.articles}</div>
                    </div>
                  </div>
                </section>

                {/* Section 2: 9 Food Categories & Product Catalog */}
                <section className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8E3] pb-5">
                    <div>
                      <h2 className="text-2xl font-bold text-[#111C16]">{t.categories.heading}</h2>
                      <p className="text-sm text-[#47544D] mt-1">{t.categories.subheading}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'products', categorySlug: null })}
                      className="text-xs font-semibold text-[#14532D] hover:underline whitespace-nowrap shrink-0"
                    >
                      {t.categories.all} →
                    </button>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#F0F7F2] border border-[#E2E8E3] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveCategorySlug('ALL')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        activeCategorySlug === 'ALL' ? 'bg-[#14532D] text-white' : 'text-[#2C3A32] hover:bg-white'
                      }`}
                    >
                      {t.categories.all}
                    </button>
                    {data.categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategorySlug(cat.slug)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                          activeCategorySlug === cat.slug
                            ? 'bg-[#14532D] text-white'
                            : 'text-[#2C3A32] hover:bg-white'
                        }`}
                      >
                        {pickText(lang, cat.nameMn, cat.nameEn)}
                      </button>
                    ))}
                  </div>

                  {filteredHomeProducts.length === 0 ? (
                    <div className="p-8 bg-white border border-[#E2E8E3] rounded-xl text-sm text-[#47544D]">
                      {t.categories.empty}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {filteredHomeProducts.map((prod) => {
                        const cat = data.categories.find((c) => c.id === prod.categoryId);
                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => navigate({ page: 'product', slug: prod.slug })}
                            className="text-left bg-white border border-[#E2E8E3] rounded-xl overflow-hidden hover:border-[#14532D]/60 transition-colors flex flex-col justify-between"
                          >
                            <div>
                              <SafeImage
                                src={prod.imageUrl}
                                alt={pickText(lang, prod.nameMn, prod.nameEn)}
                                aspectClass="aspect-[4/3]"
                              />
                              <div className="p-5">
                                <div className="text-xs text-[#47544D] mb-1.5">
                                  {cat ? pickText(lang, cat.nameMn, cat.nameEn) : ''}
                                </div>
                                <h3 className="text-base font-bold text-[#111C16] leading-snug">
                                  {pickText(lang, prod.nameMn, prod.nameEn)}
                                </h3>
                                <p className="mt-2 text-xs text-[#47544D] line-clamp-3 leading-relaxed">
                                  {pickText(lang, prod.overviewMn, prod.overviewEn)}
                                </p>
                              </div>
                            </div>
                            <div className="px-5 py-3 border-t border-[#E2E8E3] text-xs font-semibold text-[#14532D] flex items-center justify-between">
                              <span>{lang === 'mn' ? 'Технологи судлах' : 'Inspect Process'}</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Section 3: Knowledge & Equipment Highlights */}
                <section className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-6 bg-white border border-[#E2E8E3] rounded-xl p-6 lg:p-8 flex flex-col justify-between gap-6">
                    <div>
                      <div className="text-xs font-semibold text-[#14532D] mb-2">{t.nav.equipment}</div>
                      <h2 className="text-2xl font-bold text-[#111C16]">{t.equipment.heading}</h2>
                      <p className="mt-2 text-sm text-[#47544D]">{t.equipment.subheading}</p>
                      <ul className="mt-5 divide-y divide-[#E2E8E3]">
                        {data.equipment.slice(0, 4).map((eq) => (
                          <li key={eq.id} className="py-3">
                            <button
                              type="button"
                              onClick={() => navigate({ page: 'equipment', slug: eq.slug })}
                              className="w-full text-left flex items-center justify-between gap-3 hover:text-[#14532D]"
                            >
                              <span className="text-sm font-semibold">{pickText(lang, eq.nameMn, eq.nameEn)}</span>
                              <ChevronRight className="w-4 h-4 shrink-0 text-[#47544D]" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'equipment', slug: null })}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] hover:underline self-start"
                    >
                      {lang === 'mn' ? 'Бүх тоног төхөөрөмж үзэх' : 'Browse All Equipment'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="lg:col-span-6 bg-white border border-[#E2E8E3] rounded-xl p-6 lg:p-8 flex flex-col justify-between gap-6">
                    <div>
                      <div className="text-xs font-semibold text-[#14532D] mb-2">{t.nav.research}</div>
                      <h2 className="text-2xl font-bold text-[#111C16]">{t.research.heading}</h2>
                      <p className="mt-2 text-sm text-[#47544D]">{t.research.subheading}</p>
                      <ul className="mt-5 divide-y divide-[#E2E8E3]">
                        {data.articles.slice(0, 4).map((art) => (
                          <li key={art.id} className="py-3">
                            <button
                              type="button"
                              onClick={() => navigate({ page: 'research', slug: art.slug })}
                              className="w-full text-left flex items-center justify-between gap-3 hover:text-[#14532D]"
                            >
                              <div className="min-w-0">
                                <div className="text-xs text-[#47544D]">{art.topic} · {art.publishedDate}</div>
                                <div className="text-sm font-semibold truncate">{pickText(lang, art.titleMn, art.titleEn)}</div>
                              </div>
                              <ChevronRight className="w-4 h-4 shrink-0 text-[#47544D]" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'research', slug: null })}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] hover:underline self-start"
                    >
                      {lang === 'mn' ? 'Бүх судалгааг унших' : 'Explore All Research'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* PRODUCTS CATALOG PAGE */}
            {route.page === 'products' && data && (
              <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-8">
                <div className="border-b border-[#E2E8E3] pb-6">
                  <h1 className="text-3xl font-bold text-[#111C16]">{t.categories.heading}</h1>
                  <p className="mt-2 text-sm text-[#47544D]">{t.categories.subheading}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#F0F7F2] border border-[#E2E8E3] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveCategorySlug('ALL')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      activeCategorySlug === 'ALL' ? 'bg-[#14532D] text-white' : 'text-[#2C3A32] hover:bg-white'
                    }`}
                  >
                    {t.categories.all}
                  </button>
                  {data.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategorySlug(cat.slug)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        activeCategorySlug === cat.slug
                          ? 'bg-[#14532D] text-white'
                          : 'text-[#2C3A32] hover:bg-white'
                      }`}
                    >
                      {pickText(lang, cat.nameMn, cat.nameEn)}
                    </button>
                  ))}
                </div>

                {filteredHomeProducts.length === 0 ? (
                  <div className="p-8 bg-white border border-[#E2E8E3] rounded-xl text-sm text-[#47544D]">
                    {t.categories.empty}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHomeProducts.map((prod) => {
                      const cat = data.categories.find((c) => c.id === prod.categoryId);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => navigate({ page: 'product', slug: prod.slug })}
                          className="text-left bg-white border border-[#E2E8E3] rounded-xl overflow-hidden hover:border-[#14532D]/60 transition-colors flex flex-col justify-between"
                        >
                          <div>
                            <SafeImage
                              src={prod.imageUrl}
                              alt={pickText(lang, prod.nameMn, prod.nameEn)}
                              aspectClass="aspect-[4/3]"
                            />
                            <div className="p-6">
                              <div className="text-xs text-[#47544D] mb-2">
                                {cat ? pickText(lang, cat.nameMn, cat.nameEn) : ''} · {getVerificationLabel(prod.verificationStatus, lang)}
                              </div>
                              <h2 className="text-lg font-bold text-[#111C16]">
                                {pickText(lang, prod.nameMn, prod.nameEn)}
                              </h2>
                              <p className="mt-2 text-sm text-[#47544D] line-clamp-3">
                                {pickText(lang, prod.overviewMn, prod.overviewEn)}
                              </p>
                            </div>
                          </div>
                          <div className="px-6 py-3.5 border-t border-[#E2E8E3] text-xs font-semibold text-[#14532D] flex items-center justify-between">
                            <span>{pickText(lang, prod.processSequenceSummaryMn, prod.processSequenceSummaryEn).slice(0, 48)}...</span>
                            <ChevronRight className="w-4 h-4 shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PRODUCT DETAIL PAGE */}
            {route.page === 'product' && (
              <ProductDetailView
                slug={route.slug}
                lang={lang}
                onBack={() => navigate({ page: 'products', categorySlug: null })}
                onSelectEquipment={(eqSlug) => navigate({ page: 'equipment', slug: eqSlug })}
              />
            )}

            {/* EQUIPMENT PAGE */}
            {route.page === 'equipment' && data && (
              <EquipmentView
                equipmentList={data.equipment}
                sources={data.sources}
                lang={lang}
                initialSlug={route.slug}
              />
            )}

            {/* FACTORIES PAGE */}
            {route.page === 'factories' && data && (
              <FactoriesView factories={data.factories} sources={data.sources} lang={lang} />
            )}

            {/* RESEARCH PAGE */}
            {route.page === 'research' && data && (
              <ResearchView articles={data.articles} sources={data.sources} lang={lang} initialSlug={route.slug} />
            )}

            {/* LIBRARY PAGE */}
            {route.page === 'library' && (
              <LibraryView lang={lang} onSelectProduct={(slug) => navigate({ page: 'product', slug })} />
            )}

            {/* ADMIN DASHBOARD */}
            {route.page === 'admin' && (
              <AdminDashboard lang={lang} onDataChanged={loadBootstrap} />
            )}

            {/* SEARCH RESULTS PAGE */}
            {route.page === 'search' && (
              <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-6">
                <div className="border-b border-[#E2E8E3] pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#111C16]">
                      {t.search.resultsTitle}: “{route.query}”
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      navigate({ page: 'home' });
                    }}
                    className="text-xs font-semibold text-[#14532D] hover:underline"
                  >
                    {t.search.clear}
                  </button>
                </div>

                {searching || !searchResults ? (
                  <div className="h-48 bg-white border border-[#E2E8E3] rounded-xl animate-pulse" />
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#F0F7F2] border border-[#E2E8E3] rounded-xl">
                      {(
                        [
                          ['all', t.search.tabs.all],
                          ['products', `${t.search.tabs.products} (${searchResults.products.length})`],
                          ['stages', `${t.search.tabs.stages} (${searchResults.stages.length})`],
                          ['equipment', `${t.search.tabs.equipment} (${searchResults.equipment.length})`],
                          ['factories', `${t.search.tabs.factories} (${searchResults.factories.length})`],
                          ['articles', `${t.search.tabs.articles} (${searchResults.articles.length})`],
                        ] as const
                      ).map(([k, label]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSearchTab(k)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
                            searchTab === k ? 'bg-[#14532D] text-white' : 'text-[#2C3A32] hover:bg-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {searchResults.products.length === 0 &&
                      searchResults.stages.length === 0 &&
                      searchResults.equipment.length === 0 &&
                      searchResults.factories.length === 0 &&
                      searchResults.articles.length === 0 && (
                        <div className="p-8 bg-white border border-[#E2E8E3] rounded-xl text-sm text-[#47544D]">
                          {t.search.noResults}
                        </div>
                      )}

                    {(searchTab === 'all' || searchTab === 'products') && searchResults.products.length > 0 && (
                      <section className="space-y-3">
                        <h2 className="text-base font-bold">{t.search.tabs.products}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {searchResults.products.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => navigate({ page: 'product', slug: p.slug })}
                              className="text-left p-4 bg-white border border-[#E2E8E3] rounded-xl hover:border-[#14532D]"
                            >
                              <div className="text-sm font-bold">{pickText(lang, p.nameMn, p.nameEn)}</div>
                              <p className="text-xs text-[#47544D] mt-1 line-clamp-2">
                                {pickText(lang, p.overviewMn, p.overviewEn)}
                              </p>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {(searchTab === 'all' || searchTab === 'stages') && searchResults.stages.length > 0 && (
                      <section className="space-y-3">
                        <h2 className="text-base font-bold">{t.search.tabs.stages}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {searchResults.stages.map((item) => (
                            <button
                              key={item.stage.id}
                              type="button"
                              onClick={() => navigate({ page: 'product', slug: item.productSlug })}
                              className="text-left p-4 bg-white border border-[#E2E8E3] rounded-xl hover:border-[#14532D]"
                            >
                              <div className="text-xs text-[#14532D] font-semibold">
                                {pickText(lang, item.productNameMn, item.productNameEn)} · #{item.stage.stepOrder}
                              </div>
                              <div className="text-sm font-bold mt-0.5">
                                {pickText(lang, item.stage.titleMn, item.stage.titleEn)}
                              </div>
                              <p className="text-xs text-[#47544D] mt-1 line-clamp-2">
                                {pickText(lang, item.stage.descriptionMn, item.stage.descriptionEn)}
                              </p>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {(searchTab === 'all' || searchTab === 'equipment') && searchResults.equipment.length > 0 && (
                      <section className="space-y-3">
                        <h2 className="text-base font-bold">{t.search.tabs.equipment}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {searchResults.equipment.map((eq) => (
                            <button
                              key={eq.id}
                              type="button"
                              onClick={() => navigate({ page: 'equipment', slug: eq.slug })}
                              className="text-left p-4 bg-white border border-[#E2E8E3] rounded-xl hover:border-[#14532D]"
                            >
                              <div className="text-sm font-bold">{pickText(lang, eq.nameMn, eq.nameEn)}</div>
                              <p className="text-xs text-[#47544D] mt-1 line-clamp-2">
                                {pickText(lang, eq.purposeMn, eq.purposeEn)}
                              </p>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {(searchTab === 'all' || searchTab === 'factories') && searchResults.factories.length > 0 && (
                      <section className="space-y-3">
                        <h2 className="text-base font-bold">{t.search.tabs.factories}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {searchResults.factories.map((fac) => (
                            <button
                              key={fac.id}
                              type="button"
                              onClick={() => navigate({ page: 'factories' })}
                              className="text-left p-4 bg-white border border-[#E2E8E3] rounded-xl hover:border-[#14532D]"
                            >
                              <div className="text-sm font-bold">{pickText(lang, fac.nameMn, fac.nameEn)}</div>
                              <div className="text-xs text-[#47544D] mt-1">
                                {pickText(lang, fac.locationMn, fac.locationEn)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {(searchTab === 'all' || searchTab === 'articles') && searchResults.articles.length > 0 && (
                      <section className="space-y-3">
                        <h2 className="text-base font-bold">{t.search.tabs.articles}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {searchResults.articles.map((art) => (
                            <button
                              key={art.id}
                              type="button"
                              onClick={() => navigate({ page: 'research', slug: art.slug })}
                              className="text-left p-4 bg-white border border-[#E2E8E3] rounded-xl hover:border-[#14532D]"
                            >
                              <div className="text-xs text-[#14532D] font-semibold">{art.topic}</div>
                              <div className="text-sm font-bold mt-0.5">{pickText(lang, art.titleMn, art.titleEn)}</div>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Clean Institutional Footer */}
      <footer className="bg-white border-t border-[#E2E8E3] mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#47544D]">
          <div className="space-y-1">
            <div className="font-bold text-[#0F3D26]">{t.brand}</div>
            <div>{t.footer.tagline}</div>
            <div>{t.footer.accuracyNote}</div>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button type="button" onClick={() => navigate({ page: 'products' })} className="hover:text-[#111C16]">
              {t.nav.products}
            </button>
            <button type="button" onClick={() => navigate({ page: 'equipment' })} className="hover:text-[#111C16]">
              {t.nav.equipment}
            </button>
            <button type="button" onClick={() => navigate({ page: 'factories' })} className="hover:text-[#111C16]">
              {t.nav.factories}
            </button>
            <button type="button" onClick={() => navigate({ page: 'research' })} className="hover:text-[#111C16]">
              {t.nav.research}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FoodTraceApp />
    </AuthProvider>
  );
}
