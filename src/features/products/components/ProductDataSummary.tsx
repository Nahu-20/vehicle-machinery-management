import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import type { ProductStatistics } from '../types/product';
import { VerifiedDataUnavailable } from './VerifiedDataUnavailable';

interface ProductDataSummaryProps {
  statistics: ProductStatistics | null;
}

export const ProductDataSummary: React.FC<ProductDataSummaryProps> = ({ statistics }) => {
  const { t } = useLanguage();

  if (!statistics || statistics.verificationStatus !== 'verified') {
    return (
      <section className="space-y-3" aria-labelledby="product-data-heading">
        <h2
          id="product-data-heading"
          className="text-lg font-extrabold text-[#0A1912] dark:text-white"
        >
          {t('products_verified_statistics')}
        </h2>
        <VerifiedDataUnavailable />
      </section>
    );
  }

  // Reserved for future verified CMS statistics — never invent values here.
  return (
    <section className="space-y-3" aria-labelledby="product-data-heading">
      <h2
        id="product-data-heading"
        className="text-lg font-extrabold text-[#0A1912] dark:text-white"
      >
        {t('products_verified_statistics')}
      </h2>
      <VerifiedDataUnavailable />
    </section>
  );
};
