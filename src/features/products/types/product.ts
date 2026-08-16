import type { LocalizedText } from '../../../types';

/**
 * Public agricultural product catalog types.
 * Editorial content only until verified CMS statistics exist.
 */

export type ProductCategory =
  | 'cereal'
  | 'cash_crop'
  | 'oilseed'
  | 'horticulture'
  | 'livestock'
  | 'dairy';

export interface ProductImage {
  src: string;
  alt: LocalizedText;
}

export interface AgriculturalProduct {
  id: string;
  slug: string;
  name: LocalizedText;
  shortDescription: LocalizedText;
  overview: LocalizedText;
  category: ProductCategory;
  images: ProductImage[];
  iconName?: string;
  /** Maps to investment thematic commodity when supported (e.g. coffee, wheat, maize). */
  investmentCommodityKey?: string;
  /** Canonical zone_id values only — never localized display names. */
  majorZoneIds?: string[];
  /** Service ids from mockServices / future CMS. */
  relatedServiceIds?: string[];
  sourceIds?: string[];
}

/** Future hook shape — returns null until verified published datasets exist. */
export interface ProductStatistics {
  productId: string;
  annualProduction?: { value: number; unit: string; period: string } | null;
  cultivatedArea?: { value: number; unit: string; period: string } | null;
  averageYield?: { value: number; unit: string; period: string } | null;
  regionalRank?: number | null;
  majorZoneIds?: string[];
  verificationStatus: 'verified' | 'unpublished';
  sourceLabel?: LocalizedText;
}
