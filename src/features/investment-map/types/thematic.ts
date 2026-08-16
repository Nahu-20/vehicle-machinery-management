/**
 * Milestone M6A — Product Thematic Map & Zone Statistics Prototype Types
 *
 * IMPORTANT:
 * All thematic values in M6A are SYNTHETIC DEVELOPMENT FIXTURES.
 * They are for interface/system testing only and NOT official Oromia Agricultural Bureau data.
 */

export type CommodityKey = 'coffee' | 'wheat' | 'maize';

export type ThematicMetric = 'production' | 'suitability' | 'investment_potential';

export type ThematicClass =
  | 'very_high'
  | 'high'
  | 'moderate'
  | 'low'
  | 'very_low'
  | 'no_data';

export interface CommodityConfig {
  key: CommodityKey;
  labelEn: string;
  labelOm: string;
  labelAm: string;
  unitVolume: string; // e.g. 'Metric Tons'
  iconName: string;
}

export interface MetricConfig {
  key: ThematicMetric;
  labelEn: string;
  labelOm: string;
  labelAm: string;
  description: string;
}

export interface ZoneProductionMetrics {
  volumeMT?: number | null; // Production Volume in Metric Tons
  harvestedAreaHa?: number | null; // Harvested area in Hectares
  yieldPerHa?: number | null; // Yield in Tons/Ha
  trendPercent?: number | null; // Year-over-year trend %
  referenceYear?: string; // e.g., '2024/2025'
}

export interface ZoneSuitabilityMetrics {
  score?: number | null; // 0 - 100
  referencePeriod?: string;
}

export interface ZoneInvestmentPotentialMetrics {
  score?: number | null; // 0 - 100
  referencePeriod?: string;
}

export interface DemoZoneCommodityMetrics {
  zoneId: string;
  commodity: CommodityKey;
  dataStatus: 'demo';
  production?: ZoneProductionMetrics;
  suitability?: ZoneSuitabilityMetrics;
  investmentPotential?: ZoneInvestmentPotentialMetrics;
}

export interface DerivedProductionStats {
  volumeMT: number | null;
  harvestedAreaHa: number | null;
  yieldPerHa: number | null;
  trendPercent: number | null;
  regionalRank: number | null; // 1 to 22
  totalRegionalVolumeMT: number;
  regionalSharePercent: number | null;
  classification: ThematicClass;
}

export interface ThematicClassificationResult {
  zoneId: string;
  commodity: CommodityKey;
  metric: ThematicMetric;
  rawValue: number | null | undefined;
  classification: ThematicClass;
  classLabel: string;
  isNoData: boolean;
}
