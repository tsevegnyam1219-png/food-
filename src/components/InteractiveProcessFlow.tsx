import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Film, Thermometer, Clock, Wrench, ShieldCheck } from 'lucide-react';
import { EquipmentItem, FlowchartNode, Lang, ProductionStage, SourceItem } from '../types/foodtrace';
import { copy, getVerificationLabel, pickText } from '../i18n/translations';
import { SafeImage } from './SafeImage';

interface InteractiveProcessFlowProps {
  stages: ProductionStage[];
  flowchartNodes?: FlowchartNode[];
  equipmentList: EquipmentItem[];
  sources: SourceItem[];
  lang: Lang;
  onSelectEquipment?: (slug: string) => void;
}

export const InteractiveProcessFlow: React.FC<InteractiveProcessFlowProps> = ({
  stages,
  flowchartNodes,
  equipmentList,
  sources,
  lang,
  onSelectEquipment,
}) => {
  const t = copy[lang].product;
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!stages || stages.length === 0) {
    return (
      <div className="p-8 bg-white border border-[#E2E8E3] rounded-xl text-sm text-[#47544D]">
        {t.noStages}
      </div>
    );
  }

  const safeIdx = Math.min(selectedIndex, stages.length - 1);
  const currentStage = stages[safeIdx];
  const matchedNode = flowchartNodes?.[safeIdx];
  const linkedEquip = equipmentList.find((e) => e.id === currentStage.equipmentId);
  const linkedSource = sources.find((s) => s.id === currentStage.sourceId);

  return (
    <div className="space-y-6">
      {/* Interactive Flowchart Nodes Rail */}
      <div className="bg-white border border-[#E2E8E3] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-4 border-b border-[#E2E8E3]">
          <div>
            <h3 className="text-lg font-semibold text-[#111C16]">{t.interactiveFlowchart}</h3>
            <p className="text-sm text-[#47544D] mt-0.5">{t.flowchartHint}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
              disabled={safeIdx === 0}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium border border-[#E2E8E3] rounded-lg text-[#111C16] hover:bg-[#F0F7F2] disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t.prevStage}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndex((prev) => Math.min(stages.length - 1, prev + 1))}
              disabled={safeIdx === stages.length - 1}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium bg-[#14532D] text-white rounded-lg hover:bg-[#0F3D26] disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
            >
              {t.nextStage}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Connected Process Nodes */}
        <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-2 overflow-x-auto pb-2" role="tablist" aria-label={t.interactiveFlowchart}>
          {stages.map((stage, idx) => {
            const isActive = idx === safeIdx;
            const title = pickText(lang, stage.titleMn, stage.titleEn);
            return (
              <React.Fragment key={stage.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedIndex(idx)}
                  className={`group flex-1 min-w-[148px] text-left p-3.5 rounded-lg border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14532D] ${
                    isActive
                      ? 'bg-[#14532D] border-[#14532D] text-white'
                      : 'bg-[#FAFBF9] border-[#E2E8E3] text-[#111C16] hover:border-[#14532D]/50 hover:bg-[#F0F7F2]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`font-mono-tech text-xs font-semibold ${
                        isActive ? 'text-[#BBF7D0]' : 'text-[#14532D]'
                      }`}
                    >
                      {String(stage.stepOrder).padStart(2, '0')}
                    </span>
                    {stage.temperature && (
                      <span
                        className={`font-mono-tech text-[11px] truncate max-w-[90px] ${
                          isActive ? 'text-white/80' : 'text-[#47544D]'
                        }`}
                      >
                        {stage.temperature}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold leading-snug line-clamp-2">{title}</div>
                </button>
                {idx < stages.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center text-[#94A39A] shrink-0 px-0.5" aria-hidden="true">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Optional Branch / Control Loop Note from Flowchart JSON */}
        {matchedNode && (matchedNode.branchNoteMn || matchedNode.branchNoteEn) && (
          <div className="mt-4 pt-3 border-t border-[#E2E8E3] text-xs text-[#14532D] font-medium">
            {pickText(lang, matchedNode.branchNoteMn || '', matchedNode.branchNoteEn || '')}
          </div>
        )}
      </div>

      {/* Selected Stage Deep Inspector */}
      <div className="bg-white border border-[#E2E8E3] rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left: Stage Technical Prose & Parameters */}
          <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#47544D] mb-2">
                <span className="font-mono-tech font-semibold text-[#14532D]">
                  {String(currentStage.stepOrder).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}
                </span>
                <span aria-hidden="true">·</span>
                <span>{t.stageDetail}</span>
                <span aria-hidden="true">·</span>
                <span>{getVerificationLabel(currentStage.verificationStatus, lang)}</span>
              </div>

              <h4 className="text-2xl font-bold text-[#111C16] tracking-tight">
                {pickText(lang, currentStage.titleMn, currentStage.titleEn)}
              </h4>

              <p className="mt-3 text-[15px] leading-relaxed text-[#2C3A32]">
                {pickText(lang, currentStage.descriptionMn, currentStage.descriptionEn)}
              </p>

              {/* Key Quantitative Process Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#E2E8E3]">
                <div className="bg-[#FAFBF9] border border-[#E2E8E3] rounded-lg p-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#47544D] mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-[#14532D]" />
                    <span>{t.temperature}</span>
                  </div>
                  <div className="font-mono-tech text-sm font-semibold text-[#111C16]">
                    {currentStage.temperature || '—'}
                  </div>
                </div>

                <div className="bg-[#FAFBF9] border border-[#E2E8E3] rounded-lg p-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#47544D] mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#14532D]" />
                    <span>{t.duration}</span>
                  </div>
                  <div className="font-mono-tech text-sm font-semibold text-[#111C16]">
                    {currentStage.duration || '—'}
                  </div>
                </div>
              </div>

              {/* Engineering Principle & Quality Control */}
              <dl className="mt-6 space-y-4">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-[#47544D] mb-1">
                    <Wrench className="w-3.5 h-3.5 text-[#14532D]" />
                    <span>{t.equipmentUsed}</span>
                  </dt>
                  <dd className="text-sm text-[#111C16] font-medium">
                    {linkedEquip && onSelectEquipment ? (
                      <button
                        type="button"
                        onClick={() => onSelectEquipment(linkedEquip.slug)}
                        className="text-[#14532D] underline underline-offset-4 hover:text-[#0F3D26] text-left"
                      >
                        {pickText(lang, linkedEquip.nameMn, linkedEquip.nameEn)}
                      </button>
                    ) : (
                      pickText(lang, currentStage.equipmentNameMn, currentStage.equipmentNameEn) || '—'
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold text-[#47544D] mb-1">{t.operatingPrinciple}</dt>
                  <dd className="text-sm leading-relaxed text-[#2C3A32]">
                    {pickText(lang, currentStage.operatingPrincipleMn, currentStage.operatingPrincipleEn)}
                  </dd>
                </div>

                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-[#47544D] mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#14532D]" />
                    <span>{t.qcIndicator}</span>
                  </dt>
                  <dd className="text-sm leading-relaxed text-[#111C16] bg-[#F0F7F2] border border-[#D4E7DA] rounded-lg p-3.5">
                    {pickText(lang, currentStage.qualityControlIndicatorMn, currentStage.qualityControlIndicatorEn)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Stage Source Citation */}
            <div className="pt-4 border-t border-[#E2E8E3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#47544D]">
              <div>
                <span className="font-semibold text-[#111C16]">{t.stageSource}: </span>
                {linkedSource ? (
                  <span>
                    {linkedSource.title} ({linkedSource.organization}, {linkedSource.year})
                  </span>
                ) : (
                  <span>{copy[lang].verification.needs_verification}</span>
                )}
              </div>
              {linkedSource?.url && (
                <a
                  href={linkedSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#14532D] font-medium hover:underline"
                >
                  {copy[lang].research.sourceLink}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Right: Stage Media (Image + Video Attribution) */}
          <div className="lg:col-span-5 bg-[#FAFBF9] border-t lg:border-t-0 lg:border-l border-[#E2E8E3] p-6 flex flex-col justify-between gap-5">
            <div>
              <SafeImage
                src={currentStage.imageUrl}
                alt={pickText(lang, currentStage.titleMn, currentStage.titleEn)}
                aspectClass="aspect-[4/3]"
                className="rounded-lg border border-[#E2E8E3]"
              />
              <p className="mt-2 text-xs text-[#47544D]">
                <span className="font-medium text-[#111C16]">{t.imageSource}: </span>
                {currentStage.imageSource || copy[lang].verification.needs_verification}
              </p>
            </div>

            <div className="border-t border-[#E2E8E3] pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111C16] mb-2">
                <Film className="w-3.5 h-3.5 text-[#14532D]" />
                <span>{t.videoTitle}</span>
              </div>
              {currentStage.videoUrl ? (
                <div>
                  <video
                    src={currentStage.videoUrl}
                    controls
                    className="w-full rounded-lg border border-[#E2E8E3] bg-black aspect-video"
                  />
                  {currentStage.videoSource && (
                    <p className="mt-1.5 text-xs text-[#47544D]">{currentStage.videoSource}</p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-white border border-[#E2E8E3] text-xs text-[#47544D]">
                  {currentStage.videoSource || copy[lang].verification.needs_verification}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
