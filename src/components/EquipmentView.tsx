import React, { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { EquipmentItem, Lang, SourceItem } from '../types/foodtrace';
import { copy, getVerificationLabel, pickText } from '../i18n/translations';
import { SafeImage } from './SafeImage';

interface EquipmentViewProps {
  equipmentList: EquipmentItem[];
  sources: SourceItem[];
  lang: Lang;
  initialSlug?: string | null;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  equipmentList,
  sources,
  lang,
  initialSlug,
}) => {
  const t = copy[lang].equipment;
  const [filterText, setFilterText] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialSlug || equipmentList[0]?.slug || null
  );

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return equipmentList;
    return equipmentList.filter((e) =>
      `${e.nameMn} ${e.nameEn} ${e.purposeMn} ${e.purposeEn} ${e.sectorMn} ${e.sectorEn}`
        .toLowerCase()
        .includes(q)
    );
  }, [equipmentList, filterText]);

  const activeItem =
    equipmentList.find((e) => e.slug === selectedSlug) || filtered[0] || equipmentList[0] || null;
  const activeSource = activeItem ? sources.find((s) => s.id === activeItem.sourceId) : null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[#E2E8E3] pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111C16] tracking-tight">{t.heading}</h1>
          <p className="mt-2 text-sm text-[#47544D] max-w-2xl">{t.subheading}</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#47544D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={lang === 'mn' ? 'Тоног төхөөрөмж шүүх...' : 'Filter equipment...'}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E2E8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14532D]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-2.5">
          {filtered.map((item) => {
            const active = activeItem?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSlug(item.slug)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  active
                    ? 'bg-[#14532D] border-[#14532D] text-white'
                    : 'bg-white border-[#E2E8E3] text-[#111C16] hover:bg-[#F0F7F2]'
                }`}
              >
                <div
                  className={`text-xs mb-1 ${
                    active ? 'text-[#BBF7D0]' : 'text-[#47544D]'
                  }`}
                >
                  {pickText(lang, item.sectorMn, item.sectorEn)}
                </div>
                <div className="text-sm font-semibold leading-snug">
                  {pickText(lang, item.nameMn, item.nameEn)}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-6 bg-white border border-[#E2E8E3] rounded-xl text-sm text-[#47544D]">
              {copy[lang].search.noResults}
            </div>
          )}
        </div>

        {/* Right Detail */}
        <div className="lg:col-span-8">
          {activeItem && (
            <div className="bg-white border border-[#E2E8E3] rounded-xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 items-stretch border-b border-[#E2E8E3]">
                <div className="md:col-span-7 p-6 lg:p-8 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-[#47544D] mb-2">
                      {pickText(lang, activeItem.sectorMn, activeItem.sectorEn)} ·{' '}
                      {getVerificationLabel(activeItem.verificationStatus, lang)}
                    </div>
                    <h2 className="text-2xl font-bold text-[#111C16]">
                      {pickText(lang, activeItem.nameMn, activeItem.nameEn)}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#2C3A32]">
                      {pickText(lang, activeItem.purposeMn, activeItem.purposeEn)}
                    </p>
                  </div>
                  {activeItem.relatedStageMn && (
                    <div className="mt-4 pt-3 border-t border-[#E2E8E3] text-xs text-[#47544D]">
                      <span className="font-semibold text-[#111C16]">{t.relatedStage}: </span>
                      {pickText(lang, activeItem.relatedStageMn, activeItem.relatedStageEn)}
                    </div>
                  )}
                </div>
                <div className="md:col-span-5 bg-[#FAFBF9] border-t md:border-t-0 md:border-l border-[#E2E8E3] p-4 flex flex-col justify-between">
                  <SafeImage
                    src={activeItem.imageUrl}
                    alt={pickText(lang, activeItem.nameMn, activeItem.nameEn)}
                    aspectClass="aspect-[4/3]"
                    className="rounded-lg border border-[#E2E8E3]"
                  />
                  <p className="mt-2 text-[11px] text-[#47544D]">{activeItem.imageSource}</p>
                </div>
              </div>

              <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-[#47544D] mb-1.5">{t.structure}</h3>
                  <p className="text-sm leading-relaxed text-[#2C3A32]">
                    {pickText(lang, activeItem.structureMn, activeItem.structureEn)}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#47544D] mb-1.5">{t.mainParts}</h3>
                  <p className="text-sm leading-relaxed text-[#2C3A32]">
                    {pickText(lang, activeItem.mainPartsMn, activeItem.mainPartsEn)}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#47544D] mb-1.5">{t.principle}</h3>
                  <p className="text-sm leading-relaxed text-[#2C3A32]">
                    {pickText(lang, activeItem.operatingPrincipleMn, activeItem.operatingPrincipleEn)}
                  </p>
                </div>
                <div className="bg-[#F0F7F2] border border-[#D4E7DA] rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-[#14532D] mb-1.5">{t.specs}</h3>
                  <p className="text-sm font-mono-tech leading-relaxed text-[#111C16]">
                    {pickText(lang, activeItem.technicalSpecsMn, activeItem.technicalSpecsEn)}
                  </p>
                </div>
              </div>

              {activeSource && (
                <div className="px-6 lg:px-8 py-4 bg-[#FAFBF9] border-t border-[#E2E8E3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#47544D]">
                  <span>
                    {activeSource.title} ({activeSource.organization}, {activeSource.year})
                  </span>
                  {activeSource.url && (
                    <a
                      href={activeSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#14532D] font-semibold hover:underline"
                    >
                      {copy[lang].research.sourceLink}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
