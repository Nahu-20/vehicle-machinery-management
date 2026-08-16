import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Leaf, ScanLine } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useReducedMotionPreference } from '../hooks/useReducedMotionPreference';
import { ProductGallery } from '../features/products/components/ProductGallery';
import { ProductOverview } from '../features/products/components/ProductOverview';
import { ProductDataSummary } from '../features/products/components/ProductDataSummary';
import { ProductInvestmentSection } from '../features/products/components/ProductInvestmentSection';
import { ProductSourceCard } from '../features/products/components/ProductSourceCard';
import { ProductRelatedServices } from '../features/products/components/ProductRelatedServices';
import {
  getPublishedProductBySlug,
  getPublishedProductStatistics,
} from '../features/products/services/productService';
import type { AgriculturalProduct, ProductStatistics } from '../features/products/types/product';
import { getProductsDirectoryPath } from '../features/products/utils/productRoutes';

export const ProductDetailPage: React.FC = () => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { t, getLocalizedText } = useLanguage();
  const isReducedMotion = useReducedMotionPreference();
  const [product, setProduct] = useState<AgriculturalProduct | null>(null);
  const [statistics, setStatistics] = useState<ProductStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      if (!productSlug) {
        setProduct(null);
        setLoading(false);
        return;
      }
      const data = await getPublishedProductBySlug(productSlug);
      if (!mounted) return;
      setProduct(data);
      if (data) {
        const stats = await getPublishedProductStatistics(data.id);
        if (mounted) setStatistics(stats);
      } else {
        setStatistics(null);
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [productSlug]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-[#F6F7F3] dark:bg-[#0B1912]">
        <div className="h-8 w-8 rounded-full border-2 border-[#087A4B] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] bg-[#F6F7F3] dark:bg-[#0B1912] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-[#E2E8E3] bg-white p-8 text-center dark:border-[#183327] dark:bg-[#0E241B]">
          <Leaf className="mx-auto mb-4 h-12 w-12 text-[#087A4B] dark:text-[#A3E635]" />
          <h1 className="text-xl font-extrabold text-[#0A1912] dark:text-white mb-2">
            {t('products_not_found')}
          </h1>
          <p className="text-sm text-[#56635B] dark:text-emerald-100/70 mb-6">
            {t('products_not_found_hint')}
          </p>
          <Link
            to={getProductsDirectoryPath()}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#063D2A] px-5 py-3 text-sm font-extrabold text-white"
          >
            {t('products_back_to_directory')}
          </Link>
        </div>
      </div>
    );
  }

  const name = getLocalizedText(product.name);

  return (
    <div className="min-h-screen bg-[#F6F7F3] dark:bg-[#0B1912] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        <nav aria-label="Breadcrumb" className="text-sm text-[#56635B] dark:text-emerald-100/70">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="hover:text-[#087A4B] dark:hover:text-[#A3E635]">
                {t('nav_home')}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to={getProductsDirectoryPath()} className="hover:text-[#087A4B] dark:hover:text-[#A3E635]">
                {t('products_breadcrumb')}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-semibold text-[#0A1912] dark:text-white" aria-current="page">
              {name}
            </li>
          </ol>
        </nav>

        <Link
          to={getProductsDirectoryPath()}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#087A4B] dark:text-[#A3E635]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('products_back_to_directory')}
        </Link>

        <motion.div
          initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={isReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 gap-10 lg:grid-cols-12"
        >
          <div className="lg:col-span-5">
            <ProductGallery product={product} />
          </div>

          <div className="lg:col-span-7 space-y-8">
            <header className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A1912] dark:text-white">
                      {name}
                    </h1>
                    <span className="rounded-full bg-[#EFF8F2] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#087A4B] dark:bg-[#081811] dark:text-[#A3E635]">
                      {t(`products_category_${product.category}`)}
                    </span>
                  </div>
                  <p className="text-base leading-relaxed text-[#56635B] dark:text-emerald-100/80 max-w-2xl">
                    {getLocalizedText(product.shortDescription)}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E2E8E3] bg-white text-[#063D2A] dark:border-[#183327] dark:bg-[#0E241B] dark:text-emerald-100"
                  aria-label={t('products_share')}
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      navigator.share({ title: name, url: window.location.href }).catch(() => undefined);
                    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href).catch(() => undefined);
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </header>

            <ProductOverview product={product} />
            <ProductDataSummary statistics={statistics} />
            <ProductInvestmentSection product={product} />

            <section className="space-y-3" aria-labelledby="product-quality-heading">
              <h2 id="product-quality-heading" className="text-lg font-extrabold text-[#0A1912] dark:text-white">
                {t('products_quality_certifications')}
              </h2>
              <p className="text-sm leading-relaxed text-[#56635B] dark:text-emerald-100/70">
                {t('products_quality_certifications_empty')}
              </p>
              
              {/* Blockchain Traceability CTA */}
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-[#081811] border border-emerald-100 dark:border-[#183327] rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#063D2A] dark:text-emerald-50">Blockchain Traceability</h3>
                  <p className="text-xs text-[#56635B] dark:text-emerald-100/70">Verify the journey of your product.</p>
                </div>
                <Link
                  to="/traceability/scan"
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-[#087A4B] hover:bg-[#063D2A] dark:bg-[#A3E635] dark:hover:bg-[#92D022] text-white dark:text-[#0A1912] text-xs font-bold py-2 px-4 rounded-full transition-colors shadow-sm"
                >
                  <ScanLine className="w-4 h-4" /> Check yours
                </Link>
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="product-support-heading">
              <h2 id="product-support-heading" className="text-lg font-extrabold text-[#0A1912] dark:text-white">
                {t('products_support_services')}
              </h2>
              <p className="text-sm leading-relaxed text-[#56635B] dark:text-emerald-100/70">
                {t('products_support_services_copy')}
              </p>
            </section>

            <ProductRelatedServices relatedServiceIds={product.relatedServiceIds} />
            <ProductSourceCard />

            <div className="rounded-2xl bg-[#063D2A] px-5 py-6 text-white dark:bg-emerald-950">
              <p className="text-sm font-semibold mb-3">{t('products_contact_cta_copy')}</p>
              <Link
                to="/contact"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#A3E635] px-5 py-3 text-sm font-extrabold text-[#0A1912] hover:bg-[#92D022]"
              >
                {t('products_contact_investment_desk')}
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-2xl bg-[#063D2A] px-4 py-5 text-white dark:bg-[#081811]">
          {[
            t('products_feature_sustainable'),
            t('products_feature_quality'),
            t('products_feature_supply'),
            t('products_feature_partner'),
          ].map((label) => (
            <div key={label} className="text-center text-xs sm:text-sm font-semibold text-emerald-50/90 px-2">
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
