import {
  CANONICAL_ZONE_IDS,
  CanonicalZoneId,
  isCanonicalZoneId,
} from '../constants/canonicalZones';
import {
  CommodityKey,
  ThematicClass,
  ThematicMetric,
} from '../types/thematic';
import {
  PublicInvestmentDataset,
  PublicInvestmentZoneValue,
  PublicInvestmentSource,
} from '../../../types/investment';
import { fetchPublicCurrentDataset } from '../../../services/investment/publicInvestmentService';
import { convertProductionToTonnes, formatStatNumber } from '../../products/services/productStatisticsService';

export interface QuantileBoundaries {
  min: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  max: number;
}

export interface PublicThematicZoneValue {
  zoneId: CanonicalZoneId;
  value: number | null;
  productionVolume: number | null;
  harvestedAreaHa: number | null;
  yieldValue: number | null;
  yieldUnit?: string;
  regionalSharePercent: number | null;
  regionalRank: number | null;
  qualityFlag: 'measured' | 'estimated' | 'projected' | 'unverified';
  thematicClass: ThematicClass;
  isNoData: boolean;
}

export interface PublicThematicDatasetResult {
  dataset: PublicInvestmentDataset;
  coverage: {
    populatedZones: number;
    missingZones: number;
    totalZones: 22;
    coveragePercent: number;
    isFullCoverage: boolean;
  };
  values: PublicThematicZoneValue[];
  valuesByZoneId: Record<CanonicalZoneId, PublicThematicZoneValue>;
  sources: PublicInvestmentSource[];
  annualProduction: {
    value: number;
    unit: string;
    period: string;
    formatted: string;
  } | null;
  cultivatedArea: {
    value: number;
    unit: string;
    period: string;
    formatted: string;
  } | null;
  averageYield: {
    value: number;
    unit: string;
    period: string;
    isDerived: boolean;
    formatted: string;
  } | null;
  quantiles?: QuantileBoundaries;
  legendRanges: Record<ThematicClass, string>;
  methodologyContext?: string;
}

/**
 * Calculates quantile boundaries across a numeric dataset for 5-class sequential choropleth.
 */
export function calculateDatasetQuantiles(values: number[]): QuantileBoundaries {
  if (values.length === 0) {
    return { min: 0, q1: 0, q2: 0, q3: 0, q4: 0, max: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const getPercentile = (p: number) => {
    const idx = (sorted.length - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
  };

  return {
    min: sorted[0],
    q1: getPercentile(0.2),
    q2: getPercentile(0.4),
    q3: getPercentile(0.6),
    q4: getPercentile(0.8),
    max: sorted[sorted.length - 1],
  };
}

/**
 * Generates dynamic legend range labels from active dataset distribution
 */
export function generateDynamicLegendRanges(
  metric: ThematicMetric,
  unit: string,
  quantiles?: QuantileBoundaries
): Record<ThematicClass, string> {
  if (metric === 'suitability' || metric === 'investment_potential') {
    return {
      very_high: '80 – 100 Score',
      high: '60 – 79 Score',
      moderate: '40 – 59 Score',
      low: '20 – 39 Score',
      very_low: '0 – 19 Score',
      no_data: 'No Data',
    };
  }

  if (!quantiles || quantiles.max === 0) {
    return {
      very_high: 'No Active Data',
      high: 'No Active Data',
      moderate: 'No Active Data',
      low: 'No Active Data',
      very_low: 'No Active Data',
      no_data: 'No Data',
    };
  }

  const q = quantiles;
  const u = unit || 'MT';

  return {
    very_high: `>= ${q.q4.toLocaleString()} ${u}`,
    high: `${q.q3.toLocaleString()} – ${Math.max(q.q3, q.q4 - 1).toLocaleString()} ${u}`,
    moderate: `${q.q2.toLocaleString()} – ${Math.max(q.q2, q.q3 - 1).toLocaleString()} ${u}`,
    low: `${q.q1.toLocaleString()} – ${Math.max(q.q1, q.q2 - 1).toLocaleString()} ${u}`,
    very_low: `< ${q.q1.toLocaleString()} ${u}`,
    no_data: 'No Data',
  };
}

/**
 * Derives full thematic data contract and choropleth classification from an approved published dataset.
 */
export function transformToPublicThematicResult(
  dataset: PublicInvestmentDataset,
  rawValues: PublicInvestmentZoneValue[],
  sources: PublicInvestmentSource[] = []
): PublicThematicDatasetResult {
  const metric = (dataset.metric?.toLowerCase() || 'production') as ThematicMetric;
  const unit = dataset.unit || (metric === 'production' ? 'MT' : 'Score');

  // 1. Group and index canonical zone values
  const rawMap = new Map<CanonicalZoneId, PublicInvestmentZoneValue>();
  for (const v of rawValues) {
    if (isCanonicalZoneId(v.zoneId)) {
      rawMap.set(v.zoneId, v);
    }
  }

  // 2. Extract populated numeric values for quantile calculation and ranking
  const populatedNumericVolumes: { zoneId: CanonicalZoneId; val: number }[] = [];
  const populatedNumericScores: { zoneId: CanonicalZoneId; val: number }[] = [];
  let totalProduction = 0;
  let totalHarvestedArea = 0;
  let hasValidProduction = false;
  let hasValidArea = false;

  for (const zoneId of CANONICAL_ZONE_IDS) {
    const v = rawMap.get(zoneId);
    if (!v) continue;

    const prodVal = v.productionVolume !== undefined && v.productionVolume !== null ? v.productionVolume : v.value;
    if (typeof prodVal === 'number' && !isNaN(prodVal)) {
      hasValidProduction = true;
      totalProduction += prodVal;
      populatedNumericVolumes.push({ zoneId, val: prodVal });
    }

    if (typeof v.harvestedAreaHa === 'number' && !isNaN(v.harvestedAreaHa)) {
      hasValidArea = true;
      totalHarvestedArea += v.harvestedAreaHa;
    }

    if (metric !== 'production' && typeof v.value === 'number' && !isNaN(v.value)) {
      populatedNumericScores.push({ zoneId, val: v.value });
    }
  }

  // 3. Compute deterministic rank across populated zones
  const rankMap = new Map<CanonicalZoneId, number>();
  const rankingList = metric === 'production' ? populatedNumericVolumes : populatedNumericScores;
  
  rankingList
    .slice()
    .sort((a, b) => {
      if (b.val !== a.val) return b.val - a.val;
      return a.zoneId.localeCompare(b.zoneId);
    })
    .forEach((item, idx) => {
      rankMap.set(item.zoneId, idx + 1);
    });

  // 4. Quantiles for production or score thresholds
  let quantiles: QuantileBoundaries | undefined = undefined;
  if (metric === 'production' && populatedNumericVolumes.length > 0) {
    const rawVols = populatedNumericVolumes.map((item) => item.val);
    quantiles = calculateDatasetQuantiles(rawVols);
  }

  // 5. Construct each of the 22 canonical zone values
  const values: PublicThematicZoneValue[] = [];
  const valuesByZoneId = {} as Record<CanonicalZoneId, PublicThematicZoneValue>;

  let populatedCount = 0;

  for (const zoneId of CANONICAL_ZONE_IDS) {
    const raw = rawMap.get(zoneId);
    const prodVal = raw?.productionVolume !== undefined && raw?.productionVolume !== null
      ? raw.productionVolume
      : raw?.value !== undefined
      ? raw.value
      : null;

    const isNumeric = typeof prodVal === 'number' && !isNaN(prodVal);
    if (isNumeric || (raw && typeof raw.value === 'number' && !isNaN(raw.value))) {
      populatedCount++;
    }

    let thematicClass: ThematicClass = 'no_data';
    let isNoData = true;

    if (metric === 'production') {
      if (isNumeric && quantiles) {
        isNoData = false;
        const q = quantiles;
        const val = prodVal!;
        if (val >= q.q4 && (q.q4 > q.q3 || val > q.q3)) thematicClass = 'very_high';
        else if (val >= q.q3 && (q.q3 > q.q2 || val > q.q2)) thematicClass = 'high';
        else if (val >= q.q2 && (q.q2 > q.q1 || val > q.q1)) thematicClass = 'moderate';
        else if (val >= q.q1) thematicClass = 'low';
        else thematicClass = 'very_low';
      }
    } else {
      const scoreVal = typeof raw?.value === 'number' ? raw.value : null;
      if (scoreVal !== null) {
        isNoData = false;
        if (scoreVal >= 80) thematicClass = 'very_high';
        else if (scoreVal >= 60) thematicClass = 'high';
        else if (scoreVal >= 40) thematicClass = 'moderate';
        else if (scoreVal >= 20) thematicClass = 'low';
        else thematicClass = 'very_low';
      }
    }

    let sharePercent: number | null = null;
    if (metric === 'production' && isNumeric && totalProduction > 0) {
      sharePercent = Math.round(((prodVal! / totalProduction) * 100) * 10) / 10;
    }

    const item: PublicThematicZoneValue = {
      zoneId,
      value: isNumeric ? prodVal : raw?.value ?? null,
      productionVolume: isNumeric ? prodVal : null,
      harvestedAreaHa: raw?.harvestedAreaHa ?? null,
      yieldValue: raw?.yieldValue ?? null,
      yieldUnit: raw?.yieldUnit || 'tons/ha',
      regionalSharePercent: sharePercent,
      regionalRank: rankMap.get(zoneId) ?? null,
      qualityFlag: (raw?.qualityFlag === 'measured' || raw?.qualityFlag === 'estimated' || raw?.qualityFlag === 'projected' || raw?.qualityFlag === 'unverified'
        ? raw.qualityFlag
        : 'unverified') as 'measured' | 'estimated' | 'projected' | 'unverified',
      thematicClass,
      isNoData,
    };

    values.push(item);
    valuesByZoneId[zoneId] = item;
  }

  // 6. Aggregate KPIs matching productStatisticsService
  let annualProduction: PublicThematicDatasetResult['annualProduction'] = null;
  if (hasValidProduction) {
    annualProduction = {
      value: totalProduction,
      unit,
      period: dataset.referencePeriod.label,
      formatted: `${formatStatNumber(totalProduction)} ${unit}`,
    };
  }

  let cultivatedArea: PublicThematicDatasetResult['cultivatedArea'] = null;
  if (hasValidArea && totalHarvestedArea > 0) {
    cultivatedArea = {
      value: totalHarvestedArea,
      unit: 'ha',
      period: dataset.referencePeriod.label,
      formatted: `${formatStatNumber(totalHarvestedArea)} ha`,
    };
  }

  let averageYield: PublicThematicDatasetResult['averageYield'] = null;
  if (hasValidProduction && hasValidArea && totalHarvestedArea > 0) {
    const tonnes = convertProductionToTonnes(totalProduction, unit);
    if (tonnes !== null) {
      const derivedYield = Math.round((tonnes / totalHarvestedArea) * 100) / 100;
      averageYield = {
        value: derivedYield,
        unit: 'tons/ha',
        period: dataset.referencePeriod.label,
        isDerived: true,
        formatted: `${formatStatNumber(derivedYield, 2)} tons/ha`,
      };
    }
  }

  const missingZones = Math.max(0, 22 - populatedCount);
  const coveragePercent = Math.round((populatedCount / 22) * 1000) / 10;

  const legendRanges = generateDynamicLegendRanges(metric, unit, quantiles);

  return {
    dataset,
    coverage: {
      populatedZones: populatedCount,
      missingZones,
      totalZones: 22,
      coveragePercent,
      isFullCoverage: populatedCount === 22,
    },
    values,
    valuesByZoneId,
    sources,
    annualProduction,
    cultivatedArea,
    averageYield,
    quantiles,
    legendRanges,
    methodologyContext:
      metric === 'production'
        ? `Official ${dataset.referencePeriod.label} production statistics classified via quintile distribution.`
        : `Assessment score (0–100 scale) for ${dataset.commodity}.`,
  };
}

/**
 * Primary public data access entry point for thematic map visualizations.
 * Queries current verified/published datasets and transforms into unified thematic model.
 */
export async function fetchPublicThematicDataset(
  commodity: string | null | undefined,
  metric: ThematicMetric = 'production'
): Promise<PublicThematicDatasetResult | null> {
  if (!commodity) return null;

  try {
    const rawResult = await fetchPublicCurrentDataset(commodity, metric);
    if (!rawResult || !rawResult.metadata) return null;

    return transformToPublicThematicResult(
      rawResult.metadata,
      rawResult.values,
      rawResult.sources
    );
  } catch (err) {
    console.warn(`[publicThematicInvestmentService] Error loading thematic dataset for ${commodity}/${metric}:`, err);
    return null;
  }
}
