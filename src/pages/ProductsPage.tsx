import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from '../features/products/components/ProductCard';
import {
  getProductCategories,
  listPublishedProducts,
  searchPublishedProducts,
} from '../features/products/services/productService';
import type { AgriculturalProduct, ProductCategory } from '../features/products/types/product';

type FilterCategory = ProductCategory | 'all';

export const ProductsPage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<AgriculturalProduct[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const load = query.trim()
      ? searchPublishedProducts(query)
      : listPublishedProducts();
    load.then((items) => {
      if (!mounted) return;
      setProducts(items);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [query]);

  const filtered = useMemo(() => {
    if (category === 'all') return products;
    return products.filter((p) => p.category === category);
  }, [products, category]);

  const categories = useMemo(() => ['all' as const, ...getProductCategories()], []);

  return (
    <div className="min-h-screen bg-[#F6F7F3] dark:bg-[#0B1912] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#087A4B] dark:text-[#A3E635]">
            {t('products_eyebrow')}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0A1912] dark:text-white">
            {t('products_directory_title')}
          </h1>
          <p className="text-base leading-relaxed text-[#56635B] dark:text-emerald-100/80">
            {t('products_directory_subtitle')}
          </p>
        </header>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full max-w-md">
            <span className="sr-only">{t('products_search_placeholder')}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56635B]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('products_search_placeholder')}
              className="w-full min-h-11 rounded-full border border-[#E2E8E3] bg-white pl-10 pr-4 py-2.5 text-sm text-[#0A1912] outline-none focus:border-[#087A4B] focus:ring-2 focus:ring-[#087A4B]/20 dark:border-[#183327] dark:bg-[#0E241B] dark:text-white dark:focus:border-[#A3E635]"
            />
          </label>

          <div className="flex flex-wrap gap-2" role="group" aria-label={t('products_filter_category')}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold transition ${
                  category === cat
                    ? 'bg-[#063D2A] text-white dark:bg-emerald-800'
                    : 'bg-white text-[#063D2A] border border-[#E2E8E3] hover:border-[#087A4B] dark:bg-[#0E241B] dark:text-emerald-100 dark:border-[#183327]'
                }`}
              >
                {cat === 'all' ? t('products_filter_all') : t(`products_category_${cat}`)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-[#E2E8E3]/70 dark:bg-[#183327]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[#56635B] dark:text-emerald-100/70">{t('products_no_results')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
