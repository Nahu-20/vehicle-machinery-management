import { PRODUCT_CATALOG } from '../data/productCatalog';
import type { AgriculturalProduct, ProductCategory, ProductStatistics } from '../types/product';
import { getPublishedProductStatistics as getStatsFromAdapter } from './productStatisticsService';

/**
 * Product access layer — UI should call this service, not raw catalog arrays.
 * Ready for a future Firestore Product CMS without rewriting presentation.
 */
export async function listPublishedProducts(): Promise<AgriculturalProduct[]> {
  return [...PRODUCT_CATALOG];
}

export async function getPublishedProductBySlug(
  slug: string
): Promise<AgriculturalProduct | null> {
  const normalized = slug.trim().toLowerCase();
  return PRODUCT_CATALOG.find((p) => p.slug === normalized) ?? null;
}

export async function getPublishedProductById(
  id: string
): Promise<AgriculturalProduct | null> {
  return PRODUCT_CATALOG.find((p) => p.id === id) ?? null;
}

export async function listProductsByCategory(
  category: ProductCategory | 'all'
): Promise<AgriculturalProduct[]> {
  if (category === 'all') return listPublishedProducts();
  return PRODUCT_CATALOG.filter((p) => p.category === category);
}

export async function searchPublishedProducts(query: string): Promise<AgriculturalProduct[]> {
  const q = query.trim().toLowerCase();
  if (!q) return listPublishedProducts();
  return PRODUCT_CATALOG.filter((p) => {
    const nameParts =
      typeof p.name === 'string'
        ? [p.name]
        : [p.name.en, p.name.om, p.name.am];
    const haystack = [p.id, p.slug, p.category, ...nameParts]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * Product Statistics Adapter hook — resolves published + verified dataset statistics.
 * Returns null if no eligible dataset exists.
 */
export async function getPublishedProductStatistics(
  productId: string
): Promise<ProductStatistics | null> {
  return getStatsFromAdapter(productId);
}

export function getProductCategories(): ProductCategory[] {
  return ['cereal', 'cash_crop', 'oilseed', 'horticulture', 'livestock', 'dairy'];
}

