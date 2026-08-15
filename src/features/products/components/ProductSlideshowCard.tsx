import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { ImageWithFallback } from '../../../components/common/ImageWithFallback';
import type { AgriculturalProduct } from '../types/product';
import { getProductPath } from '../utils/productRoutes';

interface ProductSlideshowCardProps {
  product: AgriculturalProduct;
  priority?: boolean;
  className?: string;
}

/**
 * Full-bleed portrait card used by the homepage Dribbble-inspired slideshow.
 * Directory grid continues to use ProductCard.
 */
export const ProductSlideshowCard: React.FC<ProductSlideshowCardProps> = ({
  product,
  priority = false,
  className = '',
}) => {
  const { t, getLocalizedText } = useLanguage();
  const name = getLocalizedText(product.name);
  const image = product.images[0];
  const href = getProductPath(product.slug);

  return (
    <Link
      to={href}
      className={`group relative block h-full w-full overflow-hidden rounded-[1.35rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] focus-visible:ring-offset-2 dark:focus-visible:ring-[#A3E635] dark:focus-visible:ring-offset-[#0B1912] ${className}`}
      aria-label={`${name} — ${t('products_view_details')}`}
    >
      <ImageWithFallback
        src={image?.src}
        alt={image ? getLocalizedText(image.alt) : name}
        loading={priority ? 'eager' : 'lazy'}
        containerClassName="absolute inset-0 h-full w-full"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />

      {/* Soft bottom gradient for text legibility */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A1912]/85 via-[#0A1912]/25 to-transparent"
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
          {name}
        </h3>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
          <MapPin className="h-3.5 w-3.5 text-[#A3E635]" aria-hidden />
          {t(`products_category_${product.category}`)}
        </p>
      </div>
    </Link>
  );
};
