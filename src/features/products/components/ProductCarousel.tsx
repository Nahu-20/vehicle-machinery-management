import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference';
import type { AgriculturalProduct } from '../types/product';
import { ProductSlideshowCard } from './ProductSlideshowCard';

interface ProductCarouselProps {
  products: AgriculturalProduct[];
}

function useVisibleCount() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCount(1);
      else if (w < 1024) setCount(2);
      else setCount(3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return count;
}

/**
 * Dribbble-inspired product slideshow:
 * tall full-bleed cards, page-style slides, 01 / N counter, circular arrows.
 * Manual interaction only (no autoplay).
 */
export const ProductCarousel: React.FC<ProductCarouselProps> = ({ products }) => {
  const { t } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const visibleCount = useVisibleCount();
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const pageCount = Math.max(1, Math.ceil(products.length / visibleCount));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  const pageProducts = useMemo(() => {
    const start = page * visibleCount;
    return products.slice(start, start + visibleCount);
  }, [page, products, visibleCount]);

  const goTo = useCallback(
    (nextPage: number, dir: number) => {
      const clamped = Math.max(0, Math.min(pageCount - 1, nextPage));
      if (clamped === page) return;
      setDirection(dir);
      setPage(clamped);
    },
    [page, pageCount]
  );

  const goPrev = () => goTo(page - 1, -1);
  const goNext = () => goTo(page + 1, 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  if (!products.length) return null;

  const slideVariants = {
    enter: (dir: number) =>
      isReducedMotion
        ? { opacity: 0 }
        : { x: dir >= 0 ? 56 : -56, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: (dir: number) =>
      isReducedMotion
        ? { opacity: 0 }
        : { x: dir >= 0 ? -56 : 56, opacity: 0 },
  };

  const indexLabel = String(page + 1).padStart(2, '0');
  const totalLabel = String(pageCount).padStart(2, '0');

  return (
    <div className="flex h-full flex-col">
      <div
        className="relative flex-1 min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]"
        role="region"
        aria-roledescription="carousel"
        aria-label={t('products_carousel_label')}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`${page}-${visibleCount}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              isReducedMotion
                ? { duration: 0.15 }
                : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
            }
            className="absolute inset-0 grid gap-4 sm:gap-5"
            style={{
              gridTemplateColumns: `repeat(${pageProducts.length}, minmax(0, 1fr))`,
            }}
          >
            {pageProducts.map((product, index) => (
              <ProductSlideshowCard
                key={product.id}
                product={product}
                priority={page === 0 && index < 2}
                className="h-full min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]"
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p
          className="text-sm font-bold tabular-nums tracking-wide text-[#0A1912]/70 dark:text-emerald-100/70"
          aria-live="polite"
        >
          <span className="text-[#0A1912] dark:text-white">{indexLabel}</span>
          <span className="mx-1.5 text-[#0A1912]/35 dark:text-emerald-100/35">/</span>
          <span>{totalLabel}</span>
          <span className="sr-only">
            {` ${t('products_carousel_pagination')}: ${page + 1} / ${pageCount}`}
          </span>
        </p>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={goPrev}
            disabled={page <= 0}
            aria-label={t('products_carousel_prev')}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D5DDD7] bg-white/80 text-[#0A1912] shadow-sm backdrop-blur transition enabled:hover:border-[#087A4B] enabled:hover:text-[#087A4B] disabled:cursor-not-allowed disabled:opacity-35 dark:border-[#183327] dark:bg-[#0E241B]/80 dark:text-white dark:enabled:hover:border-[#A3E635] dark:enabled:hover:text-[#A3E635]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={page >= pageCount - 1}
            aria-label={t('products_carousel_next')}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0A1912] text-white shadow-md transition enabled:hover:bg-[#063D2A] disabled:cursor-not-allowed disabled:opacity-35 dark:bg-[#A3E635] dark:text-[#0A1912] dark:enabled:hover:bg-[#92D022]"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};
