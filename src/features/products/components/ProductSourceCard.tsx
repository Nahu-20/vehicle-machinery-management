import React from 'react';
import { FileText, ExternalLink, ShieldCheck, Building2, Calendar, Award } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import type { PublicInvestmentSource } from '../../../types/investment';

interface ProductSourceCardProps {
  sources?: PublicInvestmentSource[] | null;
  datasetTitle?: string;
  referencePeriodLabel?: string;
}

/**
 * Provenance card — renders verified source metadata when available.
 * If no verified sources exist, shows the neutral empty state.
 */
export const ProductSourceCard: React.FC<ProductSourceCardProps> = ({
  sources,
  datasetTitle,
  referencePeriodLabel,
}) => {
  const { t } = useLanguage();

  const hasSources = sources && sources.length > 0;

  if (!hasSources) {
    return (
      <aside
        id="product-source-card-empty"
        className="rounded-2xl border border-[#E2E8E3] bg-white p-5 dark:border-[#183327] dark:bg-[#0E241B]"
      >
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF8F2] text-[#087A4B] dark:bg-[#081811] dark:text-[#A3E635]">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-[#0A1912] dark:text-white">
              {t('products_data_source')}
            </h3>
            <p className="text-sm leading-relaxed text-[#56635B] dark:text-emerald-100/70">
              {t('products_data_source_empty')}
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      id="product-source-card-verified"
      className="rounded-2xl border border-[#087A4B]/20 bg-white p-5 dark:border-emerald-800/40 dark:bg-[#0E241B] shadow-xs space-y-4"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#087A4B]/10 dark:border-emerald-800/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#087A4B]/10 text-[#087A4B] dark:bg-emerald-950 dark:text-[#A3E635]">
            <FileText className="h-4.5 w-4.5" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0A1912] dark:text-white">
              {t('products_data_source')}
            </h3>
            {datasetTitle && (
              <p className="text-xs text-[#56635B] dark:text-emerald-100/70 mt-0.5">
                {datasetTitle}
              </p>
            )}
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-[#087A4B]/10 dark:bg-emerald-500/20 text-[#087A4B] dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 border border-[#087A4B]/20 dark:border-emerald-500/30">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          {t('products_verified_badge')}
        </span>
      </div>

      <div className="space-y-3.5">
        {sources.map((src) => (
          <div
            key={src.sourceId}
            id={`source-item-${src.sourceId}`}
            className="rounded-xl border border-[#087A4B]/15 dark:border-emerald-800/40 bg-[#F6FAF7] dark:bg-[#0A1912]/70 p-3.5 text-xs space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="font-bold text-[#0A1912] dark:text-white flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#087A4B] dark:text-[#A3E635] shrink-0" aria-hidden />
                  <span>{src.organization}</span>
                </p>
                {src.documentTitle && (
                  <p className="text-[#56635B] dark:text-emerald-100/80 italic pl-5">
                    {src.documentTitle}
                  </p>
                )}
              </div>

              {src.url && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#087A4B] dark:text-[#A3E635] font-bold hover:underline shrink-0"
                  aria-label={`${t('products_source_link')}: ${src.title}`}
                >
                  <span>{t('products_source_link')}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#56635B] dark:text-emerald-100/60 pt-1 border-t border-[#087A4B]/10 dark:border-emerald-800/30">
              {(src.publicationDate || referencePeriodLabel) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#087A4B] dark:text-[#A3E635]" aria-hidden />
                  <span>{src.publicationDate || referencePeriodLabel}</span>
                </span>
              )}
              {src.license && (
                <span className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-[#087A4B] dark:text-[#A3E635]" aria-hidden />
                  <span>{src.license}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
