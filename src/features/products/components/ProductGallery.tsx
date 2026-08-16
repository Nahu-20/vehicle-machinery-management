import React, { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { ImageWithFallback } from '../../../components/common/ImageWithFallback';
import type { AgriculturalProduct } from '../types/product';
import { getProductsDirectoryPath } from '../utils/productRoutes';

interface ProductGalleryProps {
  product: AgriculturalProduct;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ product }) => {
  const { t, getLocalizedText } = useLanguage();
  const images = product.images.length ? product.images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return (
      <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-[#063D2A] to-[#087A4B]" />
    );
  }

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {images.length > 1 && (
        <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${getLocalizedText(product.name)} image ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087A4B] ${
                activeIndex === index
                  ? 'border-[#087A4B] dark:border-[#A3E635]'
                  : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <ImageWithFallback
                src={image.src}
                alt=""
                loading="lazy"
                containerClassName="h-full w-full"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
          <Link
            to={getProductsDirectoryPath()}
            className="inline-flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#E2E8E3] bg-white text-[10px] font-bold text-[#063D2A] hover:border-[#087A4B] dark:border-[#183327] dark:bg-[#0E241B] dark:text-emerald-100"
            aria-label={t('products_all_products')}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            <span className="leading-none px-1 text-center">{t('products_all_products_short')}</span>
          </Link>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-3xl border border-[#E2E8E3] dark:border-[#183327] aspect-[4/3] bg-[#EFF8F2] dark:bg-[#081811]">
        <ImageWithFallback
          src={active.src}
          alt={getLocalizedText(active.alt)}
          loading="eager"
          containerClassName="h-full w-full"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
};
