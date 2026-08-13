/**
 * Milestone M6A — Thematic Data Join & Classification Service
 *
 * Joins canonical GIS zone IDs with synthetic development fixtures.
 * Implements deterministic quantile/quintile bucketing for production volume
 * and score classification for suitability & investment potential.
 */

import { DEMO_THEMATIC_FIXTURES } from '../data/demoThematicData';
import {
  CommodityKey,
  DemoZoneCommodityMetrics,
  DerivedProductionStats,
  ThematicClass,
  ThematicClassificationResult,
  ThematicMetric,
} from '../types/thematic';

export const THEMATIC_CLASS_LABELS: Record<ThematicClass, string> = {
  very_high: 'Very High',
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
  very_low: 'Very Low',
  no_data: 'No Data',
};

/**
 * Maps thematic classification to high-contrast sequential agricultural green scale colors.
 */
export function getThematicColor(
  classification: ThematicClass,
  isDark: boolean
): { fill: string; stroke: string; legendColor: string } {
  switch (classification) {
    case 'very_high':
      return {
        fill: isDark ? 'rgba(5, 150, 105, 0.90)' : 'rgba(6, 78, 59, 0.88)',
        stroke: isDark ? '#34d399' : '#022c22',
        legendColor: isDark ? '#059669' : '#064e3b',
      };
    case 'high':
      return {
        fill: isDark ? 'rgba(16, 185, 129, 0.85)' : 'rgba(4, 120, 87, 0.82)',
        stroke: isDark ? '#6ee7b7' : '#064e3b',
        legendColor: isDark ? '#10b981' : '#047857',
      };
    case 'moderate':
      return {
        fill: isDark ? 'rgba(52, 211, 153, 0.80)' : 'rgba(16, 185, 129, 0.75)',
        stroke: isDark ? '#a7f3d0' : '#047857',
        legendColor: isDark ? '#34d399' : '#10b981',
      };
    case 'low':
      return {
        fill: isDark ? 'rgba(110, 231, 183, 0.70)' : 'rgba(110, 231, 183, 0.70)',
        stroke: isDark ? '#d1fae5' : '#059669',
        legendColor: isDark ? '#6ee7b7' : '#34d399',
      };
    case 'very_low':
      return {
        fill: isDark ? 'rgba(209, 250, 229, 0.55)' : 'rgba(209, 250, 229, 0.65)',
        stroke: isDark ? '#ecfdf5' : '#10b981',
        legendColor: isDark ? '#a7f3d0' : '#d1fae5',
      };
    case 'no_data':
    default:
      return {
        fill: isDark ? 'rgba(71, 85, 105, 0.50)' : 'rgba(148, 163, 184, 0.50)',
        stroke: isDark ? '#64748b' : '#94a3b8',
        legendColor: isDark ? '#475569' : '#94a3b8',
      };
  }
}

/**
 * Retrieves demo metrics for a zone + commodity pair
 */
export function getDemoZoneCommodityMetrics(
  zoneId: string,
  commodity: CommodityKey
): DemoZoneCommodityMetrics | null {
  if (!zoneId || !commodity) return null;
  const zoneFixtures = DEMO_THEMATIC_FIXTURES[zoneId];
  if (!zoneFixtures) return null;
  return zoneFixtures[commodity] || null;
}

/**
 * Retrieves all valid numeric production volume values across zones for quantile calculation.
 * Preserves 0 as a valid numeric production value while excluding null and undefined.
 */
export function getAllProductionVolumes(commodity: CommodityKey): number[] {
  const volumes: number[] = [];
  Object.values(DEMO_THEMATIC_FIXTURES).forEach((zoneFixtures) => {
    const metrics = zoneFixtures[commodity];
    const vol = metrics?.production?.volumeMT;
    if (typeof vol === 'number') {
      volumes.push(vol);
    }
  });
  return volumes.sort((a, b) => a - b);
}

export interface QuantileRanges {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  min: number;
  max: number;
}

/**
 * Safely calculates quantile boundaries across a numeric dataset.
 * Handles datasets with duplicate values or fewer than 5 unique values deterministically.
 */
export function calculateQuantiles(volumes: number[]): QuantileRanges {
  if (volumes.length === 0) {
    return { min: 0, q1: 0, q2: 0, q3: 0, q4: 0, max: 0 };
  }
  const sorted = [...volumes].sort((a, b) => a - b);
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
 * Returns formatted legend ranges for each classification bucket given a commodity & metric.
 */
export function getMetricLegendRanges(
  commodity: CommodityKey,
  metric: ThematicMetric
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

  // Production Quantile Ranges
  const volumes = getAllProductionVolumes(commodity);
  if (volumes.length === 0) {
    return {
      very_high: 'No Active Data',
      high: 'No Active Data',
      moderate: 'No Active Data',
      low: 'No Active Data',
      very_low: 'No Active Data',
      no_data: 'No Data',
    };
  }

  const q = calculateQuantiles(volumes);

  return {
    very_high: `>= ${q.q4.toLocaleString()} MT`,
    high: `${q.q3.toLocaleString()} – ${Math.max(q.q3, q.q4 - 1).toLocaleString()} MT`,
    moderate: `${q.q2.toLocaleString()} – ${Math.max(q.q2, q.q3 - 1).toLocaleString()} MT`,
    low: `${q.q1.toLocaleString()} – ${Math.max(q.q1, q.q2 - 1).toLocaleString()} MT`,
    very_low: `< ${q.q1.toLocaleString()} MT`,
    no_data: 'No Data',
  };
}

/**
 * Classifies a raw metric value into a ThematicClass based on metric type and dataset distribution.
 * Differentiates 0 (valid numeric value) from null/undefined (No Data).
 */
export function classifyThematicValue(
  commodity: CommodityKey,
  metric: ThematicMetric,
  value: number | null | undefined,
  allProductionVolumes?: number[]
): ThematicClassificationResult {
  if (value === null || value === undefined) {
    return {
      zoneId: '',
      commodity,
      metric,
      rawValue: null,
      classification: 'no_data',
      classLabel: THEMATIC_CLASS_LABELS.no_data,
      isNoData: true,
    };
  }

  // 1. Score-based Classification (Suitability and Investment Potential: 0–100 scale)
  if (metric === 'suitability' || metric === 'investment_potential') {
    let classification: ThematicClass = 'very_low';
    if (value >= 80) classification = 'very_high';
    else if (value >= 60) classification = 'high';
    else if (value >= 40) classification = 'moderate';
    else if (value >= 20) classification = 'low';
    else classification = 'very_low';

    return {
      zoneId: '',
      commodity,
      metric,
      rawValue: value,
      classification,
      classLabel: THEMATIC_CLASS_LABELS[classification],
      isNoData: false,
    };
  }

  // 2. Production Classification (Quantile-based distribution across active commodity dataset)
  const volumes = allProductionVolumes || getAllProductionVolumes(commodity);
  if (volumes.length === 0) {
    return {
      zoneId: '',
      commodity,
      metric,
      rawValue: value,
      classification: 'moderate',
      classLabel: THEMATIC_CLASS_LABELS.moderate,
      isNoData: false,
    };
  }

  const q = calculateQuantiles(volumes);

  let classification: ThematicClass = 'very_low';
  if (value >= q.q4 && (q.q4 > q.q3 || value > q.q3)) classification = 'very_high';
  else if (value >= q.q3 && (q.q3 > q.q2 || value > q.q2)) classification = 'high';
  else if (value >= q.q2 && (q.q2 > q.q1 || value > q.q1)) classification = 'moderate';
  else if (value >= q.q1) classification = 'low';
  else classification = 'very_low';

  return {
    zoneId: '',
    commodity,
    metric,
    rawValue: value,
    classification,
    classLabel: THEMATIC_CLASS_LABELS[classification],
    isNoData: false,
  };
}

/**
 * Calculates derived regional production statistics for a selected zone & commodity.
 * Tie Strategy: Standard competition ranking with deterministic tie-break using alphabetical zoneId order.
 * Share Safety: Checks total regional volume > 0 before dividing to prevent division by zero.
 */
export function getDerivedProductionStats(
  zoneId: string,
  commodity: CommodityKey
): DerivedProductionStats | null {
  if (!zoneId || !commodity) return null;

  const targetMetrics = getDemoZoneCommodityMetrics(zoneId, commodity);
  const prod = targetMetrics?.production;

  const rawVol = prod?.volumeMT ?? null;
  const harvestedAreaHa = prod?.harvestedAreaHa ?? null;
  const yieldPerHa = prod?.yieldPerHa ?? null;
  const trendPercent = prod?.trendPercent ?? null;

  // Collect all valid numeric volume entries
  const zoneVolumesList: { zoneId: string; volumeMT: number }[] = [];
  let totalRegionalVolumeMT = 0;

  Object.entries(DEMO_THEMATIC_FIXTURES).forEach(([zId, zoneFixtures]) => {
    const vol = zoneFixtures[commodity]?.production?.volumeMT;
    if (typeof vol === 'number') {
      zoneVolumesList.push({ zoneId: zId, volumeMT: vol });
      totalRegionalVolumeMT += vol;
    }
  });

  // Sort descending by volume.
  // Tie-breaker: Deterministic ascending alphabetical order by zoneId.
  zoneVolumesList.sort((a, b) => {
    if (b.volumeMT !== a.volumeMT) {
      return b.volumeMT - a.volumeMT;
    }
    return a.zoneId.localeCompare(b.zoneId);
  });

  let regionalRank: number | null = null;
  if (typeof rawVol === 'number') {
    const rankIndex = zoneVolumesList.findIndex((item) => item.zoneId === zoneId);
    if (rankIndex >= 0) {
      regionalRank = rankIndex + 1;
    }
  }

  const regionalSharePercent =
    typeof rawVol === 'number' && totalRegionalVolumeMT > 0
      ? Number(((rawVol / totalRegionalVolumeMT) * 100).toFixed(1))
      : null;

  const classificationRes = classifyThematicValue(commodity, 'production', rawVol);

  return {
    volumeMT: rawVol,
    harvestedAreaHa,
    yieldPerHa,
    trendPercent,
    regionalRank,
    totalRegionalVolumeMT,
    regionalSharePercent,
    classification: classificationRes.classification,
  };
}

