import React, { useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, MessageSquare } from 'lucide-react';
import { ArticleItem, CommentItem, Lang, SourceItem } from '../types/foodtrace';
import { copy, pickText } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { SafeImage } from './SafeImage';

const TOPICS = [
  'HACCP',
  'ISO 22000',
  'Codex Alimentarius',
  'Food Standards',
  'Food Safety',
  'Food Chemistry',
  'Food Microbiology',
  'Food Technology Research',
];

const TOPIC_LABELS_MN: Record<string, string> = {
  HACCP: 'HACCP',
  'ISO 22000': 'ISO 22000',
  'Codex Alimentarius': 'Codex Alimentarius',
  'Food Standards': 'Хүнсний стандарт',
  'Food Safety': 'Хүнсний аюулгүй байдал',
  'Food Chemistry': 'Хүнсний химийн найрлага',
  'Food Microbiology': 'Хүнсний микробиологи',
  'Food Technology Research': 'Хүнсний технологийн судалгаа',
};

interface ResearchViewProps {
  articles: ArticleItem[];
  sources: SourceItem[];
  lang: Lang;
  initialSlug?: string | null;
}

export const ResearchView: React.FC<ResearchViewProps> = ({
  articles,
  sources,
  lang,
  initialSlug,
}) => {
  const t = copy[lang].research;
  const { dbUser, getToken } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug || null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');

  const filtered = useMemo(() => {
    if (selectedTopic === 'ALL') return articles;
    return articles.filter((a) => a.topic === selectedTopic);
  }, [articles, selectedTopic]);

  const activeArticle = activeSlug ? articles.find((a) => a.slug === activeSlug) : null;

  const openArticle = async (slug: string) => {
    setActiveSlug(slug);
    try {
      const detail = await apiFetch<{ comments: CommentItem[] }>(`/api/articles/${slug}`);
      setComments(detail.comments || []);
    } catch {
      setComments([]);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle || !commentText.trim()) return;
    const token = await getToken();
    const created = await apiFetch<CommentItem>(
      '/api/comments',
      {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'article',
          entityId: activeArticle.id,
          content: commentText.trim(),
        }),
      },
      token
    );
    setComments((prev) => [created, ...prev]);
    setCommentText('');
  };

  if (activeArticle) {
    const src = sources.find((s) => s.id === activeArticle.sourceId);
    return (
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-8">
        <button
          type="button"
          onClick={() => setActiveSlug(null)}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#14532D] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </button>

        <article className="bg-white border border-[#E2E8E3] rounded-xl overflow-hidden">
          <div className="p-6 lg:p-10 space-y-6">
            <div className="text-xs text-[#47544D] flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#14532D]">
                {lang === 'mn' ? TOPIC_LABELS_MN[activeArticle.topic] || activeArticle.topic : activeArticle.topic}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeArticle.author}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tech">{activeArticle.publishedDate}</span>
            </div>

            <h1 className="font-serif-editorial text-3xl lg:text-4xl font-semibold text-[#111C16] leading-tight">
              {pickText(lang, activeArticle.titleMn, activeArticle.titleEn)}
            </h1>

            <p className="text-base text-[#47544D] leading-relaxed border-b border-[#E2E8E3] pb-6">
              {pickText(lang, activeArticle.summaryMn, activeArticle.summaryEn)}
            </p>

            {activeArticle.imageUrl && (
              <div>
                <SafeImage
                  src={activeArticle.imageUrl}
                  alt={pickText(lang, activeArticle.titleMn, activeArticle.titleEn)}
                  aspectClass="aspect-[16/9]"
                  className="rounded-lg border border-[#E2E8E3]"
                />
                <p className="mt-2 text-xs text-[#47544D] italic">{activeArticle.imageSource}</p>
              </div>
            )}

            <div className="max-w-prose text-[15px] leading-[1.8] text-[#111C16] whitespace-pre-line">
              {pickText(lang, activeArticle.contentMn, activeArticle.contentEn)}
            </div>

            {src && (
              <div className="pt-6 border-t border-[#E2E8E3] flex flex-wrap items-center justify-between gap-3 text-xs text-[#47544D]">
                <div>
                  <span className="font-semibold text-[#111C16]">{copy[lang].product.sources}: </span>
                  {src.title} — {src.organization} ({src.year})
                </div>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#14532D] hover:underline"
                  >
                    {t.sourceLink}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </article>

        {/* Article Comments */}
        <section className="bg-white border border-[#E2E8E3] rounded-xl p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-[#14532D]" />
            <h3 className="text-base font-semibold text-[#111C16]">
              {copy[lang].product.commentsTitle} ({comments.length})
            </h3>
          </div>
          {dbUser && (
            <form onSubmit={handleComment} className="mb-5 space-y-2.5">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                placeholder={copy[lang].product.commentPlaceholder}
                className="w-full p-3 text-sm bg-[#FAFBF9] border border-[#E2E8E3] rounded-lg"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26]"
                >
                  {copy[lang].product.submitComment}
                </button>
              </div>
            </form>
          )}
          <div className="divide-y divide-[#E2E8E3]">
            {comments.map((c) => (
              <div key={c.id} className="py-3">
                <div className="text-xs text-[#47544D]">
                  <span className="font-semibold text-[#111C16]">{c.authorName || c.authorEmail}</span> ·{' '}
                  <span className="font-mono-tech">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-sm text-[#2C3A32]">{c.content}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-8">
      <div className="border-b border-[#E2E8E3] pb-6">
        <h1 className="text-3xl font-bold text-[#111C16] tracking-tight">{t.heading}</h1>
        <p className="mt-2 text-sm text-[#47544D] max-w-3xl">{t.subheading}</p>
      </div>

      {/* Topic Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#F0F7F2] border border-[#E2E8E3] rounded-xl">
        <button
          type="button"
          onClick={() => setSelectedTopic('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            selectedTopic === 'ALL'
              ? 'bg-[#14532D] text-white'
              : 'text-[#2C3A32] hover:bg-white'
          }`}
        >
          {t.allTopics}
        </button>
        {TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => setSelectedTopic(topic)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedTopic === topic
                ? 'bg-[#14532D] text-white'
                : 'text-[#2C3A32] hover:bg-white'
            }`}
          >
            {lang === 'mn' ? TOPIC_LABELS_MN[topic] || topic : topic}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((art) => (
          <button
            key={art.id}
            type="button"
            onClick={() => openArticle(art.slug)}
            className="text-left bg-white border border-[#E2E8E3] rounded-xl overflow-hidden hover:border-[#14532D]/50 transition-colors flex flex-col justify-between"
          >
            <div>
              <SafeImage
                src={art.imageUrl}
                alt={pickText(lang, art.titleMn, art.titleEn)}
                aspectClass="aspect-[16/10]"
              />
              <div className="p-5">
                <div className="text-xs text-[#47544D] mb-2">
                  <span className="font-semibold text-[#14532D]">
                    {lang === 'mn' ? TOPIC_LABELS_MN[art.topic] || art.topic : art.topic}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono-tech">{art.publishedDate}</span>
                </div>
                <h2 className="text-base font-bold text-[#111C16] leading-snug">
                  {pickText(lang, art.titleMn, art.titleEn)}
                </h2>
                <p className="mt-2 text-xs text-[#47544D] line-clamp-3 leading-relaxed">
                  {pickText(lang, art.summaryMn, art.summaryEn)}
                </p>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#E2E8E3] text-xs text-[#47544D] w-full truncate">
              {art.author}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
