import React, { useEffect, useState } from 'react';
import { Bookmark, CheckCircle2 } from 'lucide-react';
import { FavoriteState, Lang, Product } from '../types/foodtrace';
import { copy, pickText } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { SafeImage } from './SafeImage';

interface LibraryViewProps {
  lang: Lang;
  onSelectProduct: (slug: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ lang, onSelectProduct }) => {
  const { dbUser, getToken, loginWithGoogle } = useAuth();
  const [items, setItems] = useState<Array<{ favorite: FavoriteState; product: Product }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!dbUser) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const token = await getToken();
        const res = await apiFetch<{ items: Array<{ favorite: FavoriteState; product: Product }> }>(
          '/api/user/library',
          {},
          token
        );
        if (active) setItems(res.items || []);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [dbUser?.id]);

  if (!dbUser) {
    return (
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-[#E2E8E3] rounded-xl p-10 space-y-4">
          <h1 className="text-2xl font-bold text-[#111C16]">{copy[lang].nav.library}</h1>
          <p className="text-sm text-[#47544D] max-w-md mx-auto">{copy[lang].product.signInToInteract}</p>
          <button
            type="button"
            onClick={loginWithGoogle}
            className="px-5 py-2.5 text-sm font-semibold bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26]"
          >
            {copy[lang].nav.signIn}
          </button>
        </div>
      </div>
    );
  }

  const favList = items.filter((i) => i.favorite.isFavorite);
  const studiedList = items.filter((i) => i.favorite.isStudied);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
      <div className="border-b border-[#E2E8E3] pb-6">
        <h1 className="text-3xl font-bold text-[#111C16]">{copy[lang].nav.library}</h1>
        <p className="mt-1.5 text-sm text-[#47544D]">
          {dbUser.displayName || dbUser.email} · {lang === 'mn' ? 'Хадгалсан болон судалсан бүтээгдэхүүнүүд' : 'Saved favorites and studied products'}
        </p>
      </div>

      {loading ? (
        <div className="h-48 bg-white border border-[#E2E8E3] rounded-xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#111C16]">
              <Bookmark className="w-4 h-4 text-[#14532D]" />
              {lang === 'mn' ? 'Дуртай бүтээгдэхүүн' : 'Favorite Products'} ({favList.length})
            </h2>
            {favList.length === 0 ? (
              <div className="p-6 bg-white border border-[#E2E8E3] rounded-xl text-sm text-[#47544D]">
                {lang === 'mn' ? 'Одоогоор хадгалсан бүтээгдэхүүн алга.' : 'No favorited products yet.'}
              </div>
            ) : (
              favList.map(({ product, favorite }) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelectProduct(product.slug)}
                  className="w-full text-left bg-white border border-[#E2E8E3] rounded-xl p-4 hover:border-[#14532D]/50 flex items-center gap-4"
                >
                  <div className="w-24 shrink-0">
                    <SafeImage src={product.imageUrl} alt={product.nameMn} aspectClass="aspect-[4/3]" className="rounded-lg" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#111C16] truncate">
                      {pickText(lang, product.nameMn, product.nameEn)}
                    </div>
                    {favorite.notes && (
                      <p className="mt-1 text-xs text-[#47544D] line-clamp-2">{favorite.notes}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </section>

          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#111C16]">
              <CheckCircle2 className="w-4 h-4 text-[#14532D]" />
              {lang === 'mn' ? 'Судалсан бүтээгдэхүүн' : 'Studied Products'} ({studiedList.length})
            </h2>
            {studiedList.length === 0 ? (
              <div className="p-6 bg-white border border-[#E2E8E3] rounded-xl text-sm text-[#47544D]">
                {lang === 'mn' ? 'Одоогоор судалсан гэж тэмдэглэсэн бүтээгдэхүүн алга.' : 'No products marked as studied yet.'}
              </div>
            ) : (
              studiedList.map(({ product }) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelectProduct(product.slug)}
                  className="w-full text-left bg-white border border-[#E2E8E3] rounded-xl p-4 hover:border-[#14532D]/50 flex items-center gap-4"
                >
                  <div className="w-24 shrink-0">
                    <SafeImage src={product.imageUrl} alt={product.nameMn} aspectClass="aspect-[4/3]" className="rounded-lg" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#111C16] truncate">
                      {pickText(lang, product.nameMn, product.nameEn)}
                    </div>
                    <p className="mt-1 text-xs text-[#47544D] line-clamp-2">
                      {pickText(lang, product.processSequenceSummaryMn, product.processSequenceSummaryEn)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
};
