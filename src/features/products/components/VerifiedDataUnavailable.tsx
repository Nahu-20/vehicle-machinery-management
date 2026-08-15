import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

interface VerifiedDataUnavailableProps {
  className?: string;
}

export const VerifiedDataUnavailable: React.FC<VerifiedDataUnavailableProps> = ({
  className = '',
}) => {
  const { t } = useLanguage();

  return (
    <div
      className={`rounded-2xl border border-dashed border-[#087A4B]/25 dark:border-emerald-700/40 bg-[#EFF8F2]/60 dark:bg-[#0E241B]/80 px-5 py-6 ${className}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[#087A4B] dark:text-[#A3E635] shrink-0 mt-0.5" aria-hidden />
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-[#0A1912] dark:text-white">
            {t('products_verified_data_unavailable')}
          </p>
          <p className="text-sm text-[#56635B] dark:text-emerald-100/70 leading-relaxed">
            {t('products_verified_data_unavailable_hint')}
          </p>
        </div>
      </div>
    </div>
  );
};
