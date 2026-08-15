import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import type { AgriculturalProduct } from '../types/product';

interface ProductOverviewProps {
  product: AgriculturalProduct;
}

export const ProductOverview: React.FC<ProductOverviewProps> = ({ product }) => {
  const { t, getLocalizedText } = useLanguage();

  return (
    <section className="space-y-3" aria-labelledby="product-overview-heading">
      <h2
        id="product-overview-heading"
        className="text-lg font-extrabold text-[#0A1912] dark:text-white"
      >
        {t('products_overview')}
      </h2>
      <p className="text-base leading-relaxed text-[#56635B] dark:text-emerald-100/80">
        {getLocalizedText(product.overview)}
      </p>
    </section>
  );
};
