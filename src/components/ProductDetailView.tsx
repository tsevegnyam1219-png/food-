import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, CheckCircle2, ExternalLink, MessageSquare, Trash2, AlertCircle } from 'lucide-react';
import {
  Category,
  CommentItem,
  EquipmentItem,
  FavoriteState,
  Lang,
  Product,
  ProductionStage,
  SourceItem,
} from '../types/foodtrace';
import { copy, getVerificationLabel, pickText } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { SafeImage } from './SafeImage';
import { InteractiveProcessFlow } from './InteractiveProcessFlow';

interface ProductDetailResponse {
  product: Product;
  category: Category | null;
  stages: ProductionStage[];
  sources: SourceItem[];
  equipment: EquipmentItem[];
  comments: CommentItem[];
  userState: FavoriteState | null;
}

interface ProductDetailViewProps {
  slug: string;
  lang: Lang;
  onBack: () => void;
  onSelectEquipment: (slug: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  slug,
  lang,
  onBack,
  onSelectEquipment,
}) => {
  const t = copy[lang].product;
  const { dbUser, getToken, loginWithGoogle } = useAuth();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [savingUserState, setSavingUserState] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await apiFetch<ProductDetailResponse>(`/api/products/${slug}`, {}, token);
        if (!active) return;
        setData(res);
        setNotes(res.userState?.notes || '');
      } catch (err: any) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug, dbUser?.id]);

  const handleToggleUserState = async (patch: { isFavorite?: boolean; isStudied?: boolean; notes?: string }) => {
    if (!data || !dbUser) return;
    setSavingUserState(true);
    setFeedback(null);
    try {
      const token = await getToken();
      const updated = await apiFetch<FavoriteState>(
        '/api/user/favorites',
        {
          method: 'POST',
          body: JSON.stringify({
            productId: data.product.id,
            ...patch,
          }),
        },
        token
      );
      setData((prev) => (prev ? { ...prev, userState: updated } : prev));
      setFeedback(lang === 'mn' ? 'Мэдээлэл хадгалагдлаа.' : 'Saved to your library.');
    } catch (err: any) {
      setFeedback(err.message);
    } finally {
      setSavingUserState(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !commentText.trim()) return;
    setPostingComment(true);
    try {
      const token = await getToken();
      const created = await apiFetch<CommentItem>(
        '/api/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            entityType: 'product',
            entityId: data.product.id,
            content: commentText.trim(),
          }),
        },
        token
      );
      setData((prev) => (prev ? { ...prev, comments: [created, ...prev.comments] } : prev));
      setCommentText('');
    } catch (err: any) {
      setFeedback(err.message);
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    try {
      const token = await getToken();
      await apiFetch(`/api/comments/${id}`, { method: 'DELETE' }, token);
      setData((prev) =>
        prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== id) } : prev
      );
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="h-8 w-48 bg-[#E6EFE8] rounded animate-pulse mb-6" />
        <div className="h-96 bg-white border border-[#E2E8E3] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#14532D] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>
        <div className="p-8 bg-white border border-[#E2E8E3] rounded-xl text-sm text-[#991B1B]">
          {error || 'Not found'}
        </div>
      </div>
    );
  }

  const { product, category, stages, sources, equipment, comments, userState } = data;

  const techSections = [
    { num: '03', label: t.overview, text: pickText(lang, product.overviewMn, product.overviewEn) },
    { num: '04', label: t.mainRawMaterial, text: pickText(lang, product.mainRawMaterialMn, product.mainRawMaterialEn) },
    { num: '05', label: t.rawProperties, text: pickText(lang, product.rawMaterialPropertiesMn, product.rawMaterialPropertiesEn) },
    { num: '06', label: t.processSequence, text: pickText(lang, product.processSequenceSummaryMn, product.processSequenceSummaryEn) },
  ];

  const postProcessSections = [
    { num: '08', label: t.equipmentSummary, text: pickText(lang, product.equipmentSummaryMn, product.equipmentSummaryEn) },
    { num: '09', label: t.processingRegime, text: pickText(lang, product.processingRegimeMn, product.processingRegimeEn) },
    { num: '10', label: t.qualityControl, text: pickText(lang, product.qualityControlMn, product.qualityControlEn) },
    { num: '11', label: t.foodSafety, text: pickText(lang, product.foodSafetyMn, product.foodSafetyEn) },
    { num: '12', label: t.packaging, text: pickText(lang, product.packagingMn, product.packagingEn) },
    { num: '13', label: t.storage, text: pickText(lang, product.storageMn, product.storageEn) },
    { num: '14', label: t.transport, text: pickText(lang, product.transportMn, product.transportEn) },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#14532D] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>
      </div>

      {/* 1 & 2: Hero Header + Image + User Actions */}
      <section className="bg-white border border-[#E2E8E3] rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 lg:p-10 flex flex-col justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#47544D] mb-3">
                {category && <span>{pickText(lang, category.nameMn, category.nameEn)}</span>}
                <span aria-hidden="true">·</span>
                <span>{getVerificationLabel(product.verificationStatus, lang)}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tech">{stages.length} {lang === 'mn' ? 'үе шат' : 'stages'}</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-[#111C16] tracking-tight">
                {pickText(lang, product.nameMn, product.nameEn)}
              </h1>

              <p className="mt-4 text-base leading-relaxed text-[#2C3A32] max-w-2xl">
                {pickText(lang, product.overviewMn, product.overviewEn)}
              </p>
            </div>

            {/* User Bookmark & Studied Controls */}
            <div className="pt-6 border-t border-[#E2E8E3] space-y-3">
              {dbUser ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={savingUserState}
                    onClick={() => handleToggleUserState({ isFavorite: !(userState?.isFavorite ?? false) })}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      userState?.isFavorite
                        ? 'bg-[#14532D] text-white border-[#14532D]'
                        : 'bg-white text-[#111C16] border-[#E2E8E3] hover:bg-[#F0F7F2]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {userState?.isFavorite ? t.favorited : t.favorite}
                  </button>
                  <button
                    type="button"
                    disabled={savingUserState}
                    onClick={() =>
                      handleToggleUserState({
                        isStudied: !(userState?.isStudied ?? false),
                        isFavorite: userState?.isFavorite ?? false,
                      })
                    }
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      userState?.isStudied
                        ? 'bg-[#DCFCE7] text-[#14532D] border-[#86EFAC]'
                        : 'bg-white text-[#111C16] border-[#E2E8E3] hover:bg-[#F0F7F2]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {userState?.isStudied ? t.studied : t.markStudied}
                  </button>
                  {feedback && <span className="text-xs text-[#14532D] font-medium">{feedback}</span>}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAFBF9] border border-[#E2E8E3] rounded-lg p-3.5">
                  <span className="text-xs text-[#47544D]">{t.signInToInteract}</span>
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26] transition-colors whitespace-nowrap"
                  >
                    {copy[lang].nav.signIn}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FAFBF9] border-t lg:border-t-0 lg:border-l border-[#E2E8E3] p-6 flex flex-col justify-between">
            <SafeImage
              src={product.imageUrl}
              alt={pickText(lang, product.nameMn, product.nameEn)}
              aspectClass="aspect-[4/3] lg:h-full"
              className="rounded-lg border border-[#E2E8E3]"
            />
            <p className="mt-2.5 text-xs text-[#47544D]">
              <span className="font-medium text-[#111C16]">{t.imageSource}: </span>
              {product.imageSource || copy[lang].verification.needs_verification}
            </p>
          </div>
        </div>
      </section>

      {/* Accuracy Disclaimer (Section 14) */}
      <div className="bg-[#F0F7F2] border border-[#CBE2D2] rounded-xl p-4 sm:p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" />
        <p className="text-sm text-[#111C16] leading-relaxed">
          {pickText(lang, product.disclaimerMn, product.disclaimerEn)}
        </p>
      </div>

      {/* Sections 03–06: Raw Material & Process Summary */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {techSections.map((sec) => (
          <div key={sec.num} className="bg-white border border-[#E2E8E3] rounded-xl p-6">
            <div className="flex items-center gap-2 text-xs font-mono-tech text-[#14532D] font-semibold mb-2">
              <span>{sec.num}.</span>
              <span className="font-sans text-[#47544D] font-semibold">{sec.label}</span>
            </div>
            <p className="text-sm leading-relaxed text-[#2C3A32] whitespace-pre-line">{sec.text}</p>
          </div>
        ))}
      </section>

      {/* Section 07: Interactive Production Flowchart & Stage Inspector */}
      <section id="interactive-process">
        <InteractiveProcessFlow
          stages={stages}
          flowchartNodes={product.flowchartJson}
          equipmentList={equipment}
          sources={sources}
          lang={lang}
          onSelectEquipment={onSelectEquipment}
        />
      </section>

      {/* Sections 08–14: Equipment, Regime, QC, Food Safety, Packaging, Storage, Transport */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {postProcessSections.map((sec) => (
          <div key={sec.num} className="bg-white border border-[#E2E8E3] rounded-xl p-6">
            <div className="flex items-center gap-2 text-xs font-mono-tech text-[#14532D] font-semibold mb-2">
              <span>{sec.num}.</span>
              <span className="font-sans text-[#47544D] font-semibold">{sec.label}</span>
            </div>
            <p className="text-sm leading-relaxed text-[#2C3A32] whitespace-pre-line">{sec.text}</p>
          </div>
        ))}
      </section>

      {/* Section 15: Cited Sources */}
      <section className="bg-white border border-[#E2E8E3] rounded-xl p-6 lg:p-8">
        <div className="flex items-center gap-2 text-xs font-mono-tech text-[#14532D] font-semibold mb-2">
          <span>15.</span>
          <span className="font-sans text-[#47544D] font-semibold">{t.sources}</span>
        </div>
        {sources.length > 0 ? (
          <ul className="divide-y divide-[#E2E8E3] mt-3">
            {sources.map((src) => (
              <li key={src.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-[#111C16]">{src.title}</div>
                  <div className="text-xs text-[#47544D] mt-0.5">
                    {src.organization} · {src.year} · {src.verified ? copy[lang].verification.verified : copy[lang].verification.needs_verification}
                  </div>
                </div>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] hover:underline shrink-0"
                  >
                    {copy[lang].research.sourceLink}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#47544D] mt-2">{copy[lang].verification.needs_verification}</p>
        )}
      </section>

      {/* Personal Study Notes (for logged-in users) */}
      {dbUser && (
        <section className="bg-white border border-[#E2E8E3] rounded-xl p-6 lg:p-8">
          <h3 className="text-base font-semibold text-[#111C16] mb-3">{t.personalNotes}</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-3 text-sm bg-[#FAFBF9] border border-[#E2E8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]"
            placeholder={lang === 'mn' ? 'Энэ бүтээгдэхүүний технологийн талаарх хувийн тэмдэглэл...' : 'Write your personal study notes...'}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={savingUserState}
              onClick={() => handleToggleUserState({ notes })}
              className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26] transition-colors"
            >
              {t.saveNotes}
            </button>
          </div>
        </section>
      )}

      {/* Reader Comments */}
      <section className="bg-white border border-[#E2E8E3] rounded-xl p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="w-4 h-4 text-[#14532D]" />
          <h3 className="text-base font-semibold text-[#111C16]">
            {t.commentsTitle} ({comments.length})
          </h3>
        </div>

        {dbUser && (
          <form onSubmit={handlePostComment} className="mb-6 space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              placeholder={t.commentPlaceholder}
              className="w-full p-3 text-sm bg-[#FAFBF9] border border-[#E2E8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={postingComment || !commentText.trim()}
                className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26] disabled:opacity-40 transition-colors"
              >
                {t.submitComment}
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-[#E2E8E3]">
          {comments.length === 0 ? (
            <p className="text-sm text-[#47544D] py-3">
              {lang === 'mn' ? 'Одоогоор сэтгэгдэл байхгүй байна.' : 'No comments yet.'}
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-[#47544D] flex items-center gap-2">
                    <span className="font-semibold text-[#111C16]">{c.authorName || c.authorEmail}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tech">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-[#2C3A32]">{c.content}</p>
                </div>
                {(dbUser?.id === c.userId || dbUser?.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(c.id)}
                    aria-label="Delete comment"
                    className="text-[#47544D] hover:text-[#991B1B] p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
