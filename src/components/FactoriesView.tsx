import React from 'react';
import { AlertTriangle, ExternalLink, MapPin, ShieldCheck } from 'lucide-react';
import { FactoryItem, Lang, SourceItem } from '../types/foodtrace';
import { copy, getVerificationLabel, pickText } from '../i18n/translations';
import { SafeImage } from './SafeImage';

interface FactoriesViewProps {
  factories: FactoryItem[];
  sources: SourceItem[];
  lang: Lang;
}

export const FactoriesView: React.FC<FactoriesViewProps> = ({ factories, sources, lang }) => {
  const t = copy[lang].factories;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-8">
      <div className="border-b border-[#E2E8E3] pb-6">
        <h1 className="text-3xl font-bold text-[#111C16] tracking-tight">{t.heading}</h1>
        <p className="mt-2 text-sm text-[#47544D] max-w-3xl">{t.subheading}</p>
      </div>

      <div className="space-y-6">
        {factories.map((fac) => {
          const src = sources.find((s) => s.id === fac.sourceId);
          const isVerified = fac.verificationStatus === 'verified';
          return (
            <article
              key={fac.id}
              className="bg-white border border-[#E2E8E3] rounded-xl overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-5 bg-[#FAFBF9] border-b lg:border-b-0 lg:border-r border-[#E2E8E3] p-5 flex flex-col justify-between gap-3">
                  <SafeImage
                    src={fac.imageUrl}
                    alt={pickText(lang, fac.nameMn, fac.nameEn)}
                    aspectClass="aspect-[16/10]"
                    className="rounded-lg border border-[#E2E8E3]"
                  />
                  <div className="text-xs text-[#47544D] space-y-1">
                    <div>
                      <span className="font-semibold text-[#111C16]">{copy[lang].product.imageSource}: </span>
                      {fac.imageSource}
                    </div>
                    {fac.videoUrl ? (
                      <video
                        src={fac.videoUrl}
                        controls
                        className="w-full rounded-lg border border-[#E2E8E3] mt-2"
                      />
                    ) : (
                      <div>{fac.videoSource || copy[lang].verification.needs_verification}</div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isVerified ? 'text-[#14532D]' : 'text-[#92400E]'
                        }`}
                      >
                        {isVerified ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {getVerificationLabel(fac.verificationStatus, lang)}
                      </span>
                      <span aria-hidden="true" className="text-[#94A39A]">·</span>
                      <span className="inline-flex items-center gap-1 text-[#47544D]">
                        <MapPin className="w-3.5 h-3.5" />
                        {pickText(lang, fac.locationMn, fac.locationEn)}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-[#111C16]">
                      {pickText(lang, fac.nameMn, fac.nameEn)}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#2C3A32]">
                      {pickText(lang, fac.descriptionMn, fac.descriptionEn)}
                    </p>

                    <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-[#E2E8E3]">
                      <div>
                        <dt className="text-xs font-semibold text-[#47544D] mb-1">{t.productsProduced}</dt>
                        <dd className="text-sm text-[#111C16]">
                          {pickText(lang, fac.productsProducedMn, fac.productsProducedEn)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-[#47544D] mb-1">{t.technologies}</dt>
                        <dd className="text-sm text-[#111C16]">
                          {pickText(lang, fac.technologiesUsedMn, fac.technologiesUsedEn)}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold text-[#47544D] mb-1">{t.equipment}</dt>
                        <dd className="text-sm text-[#111C16]">
                          {pickText(lang, fac.equipmentUsedMn, fac.equipmentUsedEn)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8E3] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-[#47544D]">
                      <span className="font-semibold text-[#111C16]">{t.source}: </span>
                      {src ? `${src.title} (${src.organization})` : copy[lang].verification.needs_verification}
                    </div>
                    {fac.officialWebsite && (
                      <a
                        href={fac.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#14532D] hover:underline"
                      >
                        {t.website}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
