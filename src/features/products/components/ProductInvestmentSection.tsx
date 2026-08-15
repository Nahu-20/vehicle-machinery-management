import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinned, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import type { AgriculturalProduct } from '../types/product';
import { getInvestmentMapPathForProduct, getInvestmentMapPathForZone } from '../utils/productRoutes';

interface ProductInvestmentSectionProps {
  product: AgriculturalProduct;
}

export const ProductInvestmentSection: React.FC<ProductInvestmentSectionProps> = ({
  product,
}) => {
  const { t } = useLanguage();
  const mapHref = getInvestmentMapPathForProduct(product);
  const zones = product.majorZoneIds ?? [];

  return (
    <section className="space-y-4" aria-labelledby="product-investment-heading">
      <h2
        id="product-investment-heading"
        className="text-lg font-extrabold text-[#0A1912] dark:text-white"
      >
        {t('products_investment_opportunities')}
      </h2>
      <p className="text-sm leading-relaxed text-[#56635B] dark:text-emerald-100/75">
        {t('products_investment_opportunities_copy')}
      </p>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#087A4B] dark:text-[#A3E635]">
          {t('products_major_zones')}
        </h3>
        {zones.length === 0 ? (
          <p className="text-sm text-[#56635B] dark:text-emerald-100/70">
            {t('products_major_zones_empty')}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {zones.map((zoneId) => (
              <li key={zoneId}>
                <Link
                  to={getInvestmentMapPathForZone(product.investmentCommodityKey, zoneId)}
                  className="inline-flex min-h-11 items-center rounded-full border border-[#E2E8E3] bg-white px-4 py-2 text-sm font-semibold text-[#063D2A] hover:border-[#087A4B] dark:border-[#183327] dark:bg-[#0E241B] dark:text-emerald-100"
                >
                  {zoneId}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to={mapHref}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#063D2A] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#087A4B] dark:bg-emerald-800 dark:hover:bg-emerald-700"
      >
        <MapPinned className="h-4 w-4" aria-hidden />
        {t('products_view_on_map')}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
};
