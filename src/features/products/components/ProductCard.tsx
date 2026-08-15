import React from 'react';
import { Link } from 'react-router-dom';
import {
  Coffee,
  Wheat,
  Beef,
  Sprout,
  Leaf,
  Apple,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { ImageWithFallback } from '../../../components/common/ImageWithFallback';
import type { AgriculturalProduct } from '../types/product';
import { getProductPath } from '../utils/productRoutes';

const CornIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M12 3c-1.5 2-2.5 4.5-2.5 7.5S10.5 17 12 21c1.5-4 2.5-7.5 2.5-10.5S13.5 5 12 3Z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path d="M9.5 9.5c1.5.8 3.5.8 5 0M9 12.5c1.7.9 4.3.9 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function ProductIcon({ name, className }: { name?: string; className?: string }) {
  switch (name) {
    case 'Coffee':
      return <Coffee className={className} />;
    case 'Wheat':
      return <Wheat className={className} />;
    case 'Corn':
      return <CornIcon className={className} />;
    case 'Beef':
      return <Beef className={className} />;
    case 'Apple':
      return <Apple className={className} />;
    case 'Leaf':
      return <Leaf className={className} />;
    case 'Bean':
    case 'Milk':
    case 'Sprout':
    default:
      return <Sprout className={className} />;
  }
}

interface ProductCardProps {
  product: AgriculturalProduct;
  className?: string;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
  priority = false,
}) => {
  const { t, getLocalizedText } = useLanguage();
  const name = getLocalizedText(product.name);
  const description = getLocalizedText(product.shortDescription);
  const image = product.images[0];
  const href = getProductPath(product.slug);

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8E3] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#087A4B]/40 hover:shadow-md dark:border-[#183327] dark:bg-[#0E241B] dark:hover:border-[#A3E635]/40 ${className}`}
    >
      <Link
        to={href}
        className="flex h-full flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] focus-visible:ring-offset-2 dark:focus-visible:ring-[#A3E635] dark:focus-visible:ring-offset-[#0E241B] rounded-2xl"
        aria-label={`${name} — ${t('products_view_details')}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <ImageWithFallback
            src={image?.src}
            alt={image ? getLocalizedText(image.alt) : name}
            loading={priority ? 'eager' : 'lazy'}
            containerClassName="h-full w-full"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute bottom-3 left-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/95 text-[#063D2A] shadow-sm dark:border-emerald-700/40 dark:bg-[#0A1912]/90 dark:text-[#A3E635]">
            <ProductIcon name={product.iconName} className="h-5 w-5" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#087A4B] dark:text-[#A3E635]">
              {t(`products_category_${product.category}`)}
            </p>
            <h3 className="text-lg font-extrabold tracking-tight text-[#0A1912] dark:text-white">
              {name}
            </h3>
            <p className="text-sm leading-relaxed text-[#56635B] dark:text-emerald-100/75 line-clamp-3">
              {description}
            </p>
          </div>

          <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-bold text-[#087A4B] dark:text-[#A3E635]">
            {t('products_view_details')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
};
