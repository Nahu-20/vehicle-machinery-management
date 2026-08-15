import React from 'react';
import { FileText } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * Provenance card — only render verified source metadata when available.
 * Currently shows a neutral future-ready empty state (no fabricated reports).
 */
export const ProductSourceCard: React.FC = () => {
  const { t } = useLanguage();

  return (
    <aside className="rounded-2xl border border-[#E2E8E3] bg-white p-5 dark:border-[#183327] dark:bg-[#0E241B]">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF8F2] text-[#087A4B] dark:bg-[#081811] dark:text-[#A3E635]">
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
};
