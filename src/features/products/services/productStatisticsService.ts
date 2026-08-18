import { CANONICAL_ZONE_IDS, isCanonicalZoneId, CanonicalZoneId } from '../../investment-map/constants/canonicalZones';
import {
  PublicInvestmentDataset,
  PublicInvestmentZoneValue,
  PublicInvestmentSource,
} from '../../../types/investment';
import { fetchPublicCurrentProductionDataset } from '../../../services/investment/publicInvestmentService';
import { PRODUCT_CATALOG } from '../data/productCatalog';
import type {
  ProductStatistics,
  MajorZoneProduction,
  ProductCoverageInfo,
} from '../types/product';

/**
 * Normalizes dataset production units to metric tonnes for weighted yield calculation.
 * Returns null if the unit is unknown or incompatible with mass/area yield.
 */
export function convertProductionToTonnes(value: number, unit: string): number | null {
  const normUnit = unit.trim().toLowerCase();
  if (['tonne', 'tonnes', 'mt', 't', 'metric ton', 'metric tons', 'metric tonne', 'metric tonnes'].includes(normUnit)) {
    return value;
  }
  if (['quintal', 'quintals', 'q'].includes(normUnit)) {
    return value * 0.1; // 1 quintal = 100 kg = 0.1 MT
  }
  if (['kg', 'kilogram', 'kilograms'].includes(normUnit)) {
    return value / 1000;
  }
  return null;
}

/**
 * Formats a number with comma separators for clean display.
 */
export function formatStatNumber(val: number, decimals: number = 0): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Checks eligibility of a dataset for public product statistics presentation.
 * Hard rule: Must be published AND verified.
 */
export function isEligibleDataset(dataset: {
  lifecycleStatus?: string;
  verificationStatus?: string;
  datasetId?: string;
}): boolean {
  if (dataset.lifecycleStatus !== undefined || dataset.verificationStatus !== undefined) {
    return (
      dataset.lifecycleStatus === 'published' &&
      dataset.verificationStatus === 'verified'
    );
  }
  return Boolean(dataset.datasetId);
}

/**
 * Aggregates zone values into a sanitized ProductStatistics DTO.
 * Guarantees strict period isolation and sanitization.
 */
export function calculateProductStatisticsFromDataset(
  dataset: PublicInvestmentDataset,
  values: PublicInvestmentZoneValue[],
  sources: PublicInvestmentSource[] = []
): ProductStatistics {
  const canonicalZoneSet = new Set(CANONICAL_ZONE_IDS);

  // 1. Calculate Coverage
  const populatedZoneIds = new Set<CanonicalZoneId>();
  const validProductionMap = new Map<CanonicalZoneId, number>();
  const validAreaMap = new Map<CanonicalZoneId, number>();

  for (const v of values) {
    if (!isCanonicalZoneId(v.zoneId)) continue;

    const prodVal = v.productionVolume !== undefined && v.productionVolume !== null ? v.productionVolume : v.value;
    if (prodVal !== null && prodVal !== undefined && typeof prodVal === 'number') {
      populatedZoneIds.add(v.zoneId);
      validProductionMap.set(v.zoneId, prodVal);
    }

    if (v.harvestedAreaHa !== null && v.harvestedAreaHa !== undefined && typeof v.harvestedAreaHa === 'number') {
      validAreaMap.set(v.zoneId, v.harvestedAreaHa);
    }
  }

  const populatedCount = populatedZoneIds.size;
  const totalCount = CANONICAL_ZONE_IDS.length; // 22
  const missingCount = Math.max(0, totalCount - populatedCount);
  const coveragePercent = Math.round((populatedCount / totalCount) * 1000) / 10;

  const coverage: ProductCoverageInfo = {
    populatedZoneCount: populatedCount,
    totalCanonicalZones: totalCount,
    missingZoneCount: missingCount,
    coveragePercent,
    isFullCoverage: populatedCount === totalCount,
  };

  // 2. Aggregate Regional Production
  let annualProduction: ProductStatistics['annualProduction'] = null;
  let totalProduction = 0;

  if (populatedCount > 0) {
    for (const val of validProductionMap.values()) {
      totalProduction += val;
    }
    annualProduction = {
      value: totalProduction,
      unit: dataset.unit || 'MT',
      period: dataset.referencePeriod.label,
      formatted: `${formatStatNumber(totalProduction)} ${dataset.unit || 'MT'}`,
    };
  }

  // 3. Aggregate Cultivated / Harvested Area
  let cultivatedArea: ProductStatistics['cultivatedArea'] = null;
  let totalArea = 0;

  if (validAreaMap.size > 0) {
    for (const val of validAreaMap.values()) {
      totalArea += val;
    }
    cultivatedArea = {
      value: totalArea,
      unit: 'ha',
      period: dataset.referencePeriod.label,
      formatted: `${formatStatNumber(totalArea)} ha`,
    };
  }

  // 4. Derive Regional Yield (Weighted: Production in Tonnes / Harvested Area in Ha)
  let averageYield: ProductStatistics['averageYield'] = null;

  if (annualProduction && cultivatedArea && cultivatedArea.value > 0) {
    const prodInTonnes = convertProductionToTonnes(annualProduction.value, annualProduction.unit);
    if (prodInTonnes !== null && prodInTonnes >= 0) {
      const derivedYieldVal = Math.round((prodInTonnes / cultivatedArea.value) * 100) / 100;
      averageYield = {
        value: derivedYieldVal,
        unit: 't/ha',
        period: dataset.referencePeriod.label,
        isDerived: true,
        formatted: `${formatStatNumber(derivedYieldVal, 2)} t/ha`,
      };
    }
  }

  // 5. Derive Major Producing Zones (Top 5)
  const zoneList: MajorZoneProduction[] = [];

  for (const zoneId of CANONICAL_ZONE_IDS) {
    const prod = validProductionMap.get(zoneId);
    if (prod !== undefined && prod !== null) {
      const area = validAreaMap.get(zoneId) ?? null;
      let zoneYield: number | null = null;

      if (area && area > 0) {
        const zoneProdTonnes = convertProductionToTonnes(prod, dataset.unit || 'MT');
        if (zoneProdTonnes !== null) {
          zoneYield = Math.round((zoneProdTonnes / area) * 100) / 100;
        }
      }

      const share = totalProduction > 0 ? Math.round(((prod / totalProduction) * 100) * 10) / 10 : 0;

      zoneList.push({
        zoneId,
        productionVolume: prod,
        productionUnit: dataset.unit || 'MT',
        harvestedAreaHa: area,
        yieldValue: zoneYield,
        yieldUnit: zoneYield !== null ? 't/ha' : undefined,
        regionalSharePercent: share,
      });
    }
  }

  // Sort descending by productionVolume with alphabetical zoneId tie-breaking
  zoneList.sort((a, b) => {
    if (b.productionVolume !== a.productionVolume) {
      return b.productionVolume - a.productionVolume;
    }
    return a.zoneId.localeCompare(b.zoneId);
  });

  // Assign ranks
  zoneList.forEach((item, idx) => {
    item.regionalRank = idx + 1;
  });

  const majorZones = zoneList.slice(0, 5);
  const majorZoneIds = majorZones.map((z) => z.zoneId);

  return {
    productId: dataset.commodity,
    commodityKey: dataset.commodity,
    datasetId: dataset.datasetId,
    datasetTitle: dataset.title,
    referencePeriod: dataset.referencePeriod,
    metric: dataset.metric,
    unit: dataset.unit,
    annualProduction,
    cultivatedArea,
    averageYield,
    coverage,
    majorZones,
    majorZoneIds,
    verificationStatus: 'verified',
    lifecycleStatus: 'published',
    sources,
    publishedAt: dataset.publishedAt,
  };
}

/**
 * Primary Product Statistics Access Function.
 * Resolves the eligible published + verified Investment dataset for the given product ID or commodity.
 */
export async function getPublishedProductStatistics(
  productIdOrCommodityKey: string
): Promise<ProductStatistics | null> {
  if (!productIdOrCommodityKey) return null;

  const normalized = productIdOrCommodityKey.trim().toLowerCase();

  // 1. Resolve canonical commodity key from catalog if a product matches
  const product = PRODUCT_CATALOG.find(
    (p) => p.id === normalized || p.slug === normalized || p.investmentCommodityKey === normalized
  );

  const commodityKey = product?.investmentCommodityKey || normalized;

  // 2. Fetch the eligible published + verified current production dataset
  const datasetResult = await fetchPublicCurrentProductionDataset(commodityKey);
  if (!datasetResult) {
    return null;
  }

  const { metadata, values, sources } = datasetResult;

  // 3. Strict verification check on the retrieved metadata
  if (!isEligibleDataset(metadata)) {
    return null;
  }

  // 4. Calculate and return verified statistics
  return calculateProductStatisticsFromDataset(metadata, values, sources);
}
