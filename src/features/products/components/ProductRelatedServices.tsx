import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { mockServices } from '../../../data/mockData';

interface ProductRelatedServicesProps {
  relatedServiceIds?: string[];
}

export const ProductRelatedServices: React.FC<ProductRelatedServicesProps> = ({
  relatedServiceIds = [],
}) => {
  const { t } = useLanguage();
  const services = mockServices.filter((s) => relatedServiceIds.includes(s.id));

  if (!services.length) return null;

  return (
    <section className="space-y-4" aria-labelledby="product-related-services-heading">
      <h2
        id="product-related-services-heading"
        className="text-lg font-extrabold text-[#0A1912] dark:text-white"
      >
        {t('products_related_services')}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => (
          <li key={service.id}>
            <Link
              to={service.linkUrl || '/services'}
              className="group flex min-h-11 items-start justify-between gap-3 rounded-2xl border border-[#E2E8E3] bg-white px-4 py-3 transition hover:border-[#087A4B] dark:border-[#183327] dark:bg-[#0E241B] dark:hover:border-[#A3E635]"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#0A1912] dark:text-white">
                  {t(service.titleKey)}
                </p>
                <p className="text-xs leading-relaxed text-[#56635B] dark:text-emerald-100/70 line-clamp-2">
                  {t(service.descriptionKey)}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#087A4B] dark:text-[#A3E635]" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
