import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { listPublishedProducts } from '../../features/products/services/productService';
import type { AgriculturalProduct } from '../../features/products/types/product';
import { ProductCarousel } from '../../features/products/components/ProductCarousel';
import { getProductsDirectoryPath } from '../../features/products/utils/productRoutes';

export const AgriculturalProductsSection: React.FC = () => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const [products, setProducts] = useState<AgriculturalProduct[]>([]);

  useEffect(() => {
    let mounted = true;
    listPublishedProducts().then((items) => {
      if (mounted) setProducts(items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      id="products"
      className="relative overflow-hidden border-b border-[#E2E8E3] dark:border-[#183327] transition-colors duration-200"
    >
      {/* Soft botanical gradient atmosphere (OAB greens, not travel pinks) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[#F6F7F3] dark:bg-[#0B1912]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-10 h-[28rem] w-[28rem] rounded-full bg-[#A3E635]/15 blur-3xl dark:bg-emerald-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[-8%] top-1/3 h-[32rem] w-[32rem] rounded-full bg-[#087A4B]/12 blur-3xl dark:bg-emerald-700/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] left-1/3 h-72 w-72 rounded-full bg-[#D7A928]/10 blur-3xl dark:bg-amber-600/10"
        aria-hidden
      />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 lg:items-stretch">
          {/* Left intro column — Dribbble slideshow composition */}
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, y: 18 }}
            whileInView={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="lg:col-span-4 flex flex-col justify-center space-y-6 max-w-xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087A4B] dark:text-[#A3E635]">
              {t('products_eyebrow')}
            </p>
            <h2 className="text-3xl sm:text-4xl xl:text-[2.75rem] font-extrabold tracking-tight text-[#111310] dark:text-white leading-[1.1]">
              {t('products_title')}
            </h2>
            <p className="text-base text-[#56635B] dark:text-[#A7F3D0]/80 leading-relaxed">
              {t('products_subtitle')}
            </p>
            <div>
              <Link
                to={getProductsDirectoryPath()}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#063D2A] px-7 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_-10px_rgba(6,61,42,0.55)] transition hover:bg-[#087A4B] dark:bg-[#A3E635] dark:text-[#0A1912] dark:shadow-[0_12px_28px_-10px_rgba(163,230,53,0.35)] dark:hover:bg-[#92D022]"
              >
                {t('products_explore_all')}
              </Link>
            </div>
          </motion.div>

          {/* Right slideshow column */}
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, x: 24 }}
            whileInView={isReducedMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-8"
          >
            <ProductCarousel products={products} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
