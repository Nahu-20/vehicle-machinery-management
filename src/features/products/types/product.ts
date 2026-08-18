import type { LocalizedText } from '../../../types';
import type { CanonicalZoneId } from '../../investment-map/constants/canonicalZones';
import type { PublicInvestmentSource } from '../../../types/investment';

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

export interface MajorZoneProduction {
  zoneId: CanonicalZoneId;
  productionVolume: number;
  productionUnit?: string;
  harvestedAreaHa?: number | null;
  yieldValue?: number | null;
  yieldUnit?: string;
  regionalSharePercent?: number | null;
  regionalRank?: number | null;
}

export interface ProductCoverageInfo {
  populatedZoneCount: number;
  totalCanonicalZones: number; // 22
  missingZoneCount: number;
  coveragePercent: number;
  isFullCoverage: boolean;
}

/**
 * Verified Product Statistics DTO
 * Aggregated exclusively from published + verified Investment Datasets.
 */
export interface ProductStatistics {
  productId: string;
  commodityKey: string;
  datasetId: string;
  datasetTitle: string;
  referencePeriod: {
    label: string;
    startYear: number;
    endYear?: number;
    seasonName?: string;
  };
  metric: string;
  unit: string;
  annualProduction?: {
    value: number;
    unit: string;
    period: string;
    formatted?: string;
  } | null;
  cultivatedArea?: {
    value: number;
    unit: string;
    period: string;
    formatted?: string;
  } | null;
  averageYield?: {
    value: number;
    unit: string; // e.g. 't/ha' or 'MT/ha'
    period: string;
    isDerived: boolean;
    formatted?: string;
  } | null;
  coverage: ProductCoverageInfo;
  majorZones: MajorZoneProduction[];
  majorZoneIds: string[];
  regionalRank?: number | null;
  verificationStatus: 'verified';
  lifecycleStatus: 'published';
  sources: PublicInvestmentSource[];
  publishedAt?: string;
  sourceLabel?: LocalizedText;
}

