import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  InvestmentZoneProfile,
  InvestmentDataset,
  InvestmentZoneValue,
  InvestmentSource,
  InvestmentOpportunity,
  InvestmentMapConfig,
  PublicInvestmentZoneProfile,
  PublicInvestmentDataset,
  PublicInvestmentZoneValue,
  PublicInvestmentSource,
  PublicInvestmentOpportunity,
  PublicInvestmentMapConfig,
  toPublicZoneProfile,
  toPublicDataset,
  toPublicZoneValue,
  toPublicSource,
  toPublicOpportunity,
} from '../../types/investment';
import { CanonicalZoneId } from '../../features/investment-map/constants/canonicalZones';

// In-Memory Test Store Adapter for Standalone Testing & Offline Verification
interface PublicInvestmentTestStore {
  datasets: InvestmentDataset[];
  values: Record<string, InvestmentZoneValue[]>; // datasetId -> zone values
  sources: InvestmentSource[];
  zoneProfiles?: InvestmentZoneProfile[];
  opportunities?: InvestmentOpportunity[];
  mapConfig?: InvestmentMapConfig;
}

let testStore: PublicInvestmentTestStore | null = null;

export function setPublicInvestmentTestStore(store: PublicInvestmentTestStore | null) {
  testStore = store;
}

export function resetPublicInvestmentTestStore() {
  testStore = null;
}

/**
 * Deterministic Dataset Comparator
 * 1. startYear descending
 * 2. endYear descending
 * 3. isCurrent === true first
 * 4. publishedAt descending
 * 5. datasetId ascending (lexicographical tie-break)
 */
export function compareDatasetRecency(a: InvestmentDataset, b: InvestmentDataset): number {
  const aStart = a.referencePeriod?.startYear ?? a.referenceYear ?? 0;
  const bStart = b.referencePeriod?.startYear ?? b.referenceYear ?? 0;
  if (bStart !== aStart) return bStart - aStart;

  const aEnd = a.referencePeriod?.endYear ?? aStart;
  const bEnd = b.referencePeriod?.endYear ?? bStart;
  if (bEnd !== aEnd) return bEnd - aEnd;

  if (a.isCurrent !== b.isCurrent) {
    return a.isCurrent ? -1 : 1;
  }

  const aPub = a.publishedAt || a.updatedAt || '';
  const bPub = b.publishedAt || b.updatedAt || '';
  if (bPub !== aPub) return bPub.localeCompare(aPub);

  return a.datasetId.localeCompare(b.datasetId);
}

export async function fetchPublicZoneProfile(
  zoneId: CanonicalZoneId
): Promise<PublicInvestmentZoneProfile | null> {
  if (testStore) {
    const profile = testStore.zoneProfiles?.find((p) => p.zoneId === zoneId);
    if (!profile) return null;
    return toPublicZoneProfile(profile);
  }

  if (!db) return null;
  try {
    const ref = doc(db, 'investmentZoneProfiles', zoneId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as InvestmentZoneProfile;
    return toPublicZoneProfile(data);
  } catch (err) {
    console.warn(`[publicInvestmentService] Failed to fetch zone profile for ${zoneId}:`, err);
    return null;
  }
}

export async function fetchPublicCurrentDataset(
  commodity: string,
  metric: string
): Promise<{ metadata: PublicInvestmentDataset; values: PublicInvestmentZoneValue[]; sources: PublicInvestmentSource[] } | null> {
  const normCommodity = commodity.trim().toLowerCase();
  const normMetric = metric.trim().toLowerCase();

  let eligibleDatasets: InvestmentDataset[] = [];
  let valuesMap: Record<string, InvestmentZoneValue[]> = {};
  let sourcesList: InvestmentSource[] = [];

  if (testStore) {
    eligibleDatasets = testStore.datasets.filter(
      (d) =>
        d.commodity?.toLowerCase() === normCommodity &&
        (d.metric?.toLowerCase() === normMetric || (normMetric === 'production' && d.category === 'production')) &&
        d.lifecycleStatus === 'published' &&
        d.verificationStatus === 'verified'
    );
    valuesMap = testStore.values;
    sourcesList = testStore.sources;
  } else if (db) {
    try {
      // Query published + verified datasets for commodity
      const q = query(
        collection(db, 'investmentDatasets'),
        where('commodity', '==', normCommodity),
        where('lifecycleStatus', '==', 'published'),
        where('verificationStatus', '==', 'verified')
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        eligibleDatasets = snap.docs
          .map((d) => d.data() as InvestmentDataset)
          .filter(
            (d) =>
              d.metric?.toLowerCase() === normMetric ||
              (normMetric === 'production' && d.category === 'production')
          );
      }
    } catch (err) {
      console.warn(`[publicInvestmentService] Failed to query datasets for ${normCommodity}:`, err);
      return null;
    }
  } else {
    return null;
  }

  if (eligibleDatasets.length === 0) {
    return null;
  }

  // Deterministic sorting to resolve the current dataset
  eligibleDatasets.sort(compareDatasetRecency);
  const selectedDataset = eligibleDatasets[0];

  const publicMeta = toPublicDataset(selectedDataset);
  if (!publicMeta) return null;

  // Fetch zone values for the selected dataset
  let rawValues: InvestmentZoneValue[] = [];
  if (testStore) {
    rawValues = valuesMap[selectedDataset.datasetId] || [];
  } else if (db) {
    try {
      const valuesSnap = await getDocs(collection(db, 'investmentDatasets', selectedDataset.datasetId, 'values'));
      rawValues = valuesSnap.docs.map((d) => d.data() as InvestmentZoneValue);
    } catch (err) {
      console.warn(`[publicInvestmentService] Failed to fetch values for dataset ${selectedDataset.datasetId}:`, err);
      return null;
    }
  }

  const publicValues = rawValues.map((v) => toPublicZoneValue(v, rawValues));

  // Fetch sanitized sources
  const publicSources: PublicInvestmentSource[] = [];
  if (Array.isArray(selectedDataset.sourceIds) && selectedDataset.sourceIds.length > 0) {
    for (const sId of selectedDataset.sourceIds) {
      const src = await fetchPublicSource(sId);
      if (src) publicSources.push(src);
    }
  }

  return {
    metadata: publicMeta,
    values: publicValues,
    sources: publicSources,
  };
}

/**
 * Specifically resolves the current published + verified production dataset for a commodity
 */
export async function fetchPublicCurrentProductionDataset(
  commodity: string
): Promise<{ metadata: PublicInvestmentDataset; values: PublicInvestmentZoneValue[]; sources: PublicInvestmentSource[] } | null> {
  return fetchPublicCurrentDataset(commodity, 'production');
}

export async function fetchPublicSource(sourceId: string): Promise<PublicInvestmentSource | null> {
  if (testStore) {
    const src = testStore.sources.find((s) => s.sourceId === sourceId);
    if (!src) return null;
    return toPublicSource(src);
  }

  if (!db) return null;
  try {
    const ref = doc(db, 'investmentSources', sourceId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as InvestmentSource;
    return toPublicSource(data);
  } catch (err) {
    console.warn(`[publicInvestmentService] Failed to fetch source ${sourceId}:`, err);
    return null;
  }
}

export async function fetchPublicOpportunity(
  opportunityId: string
): Promise<PublicInvestmentOpportunity | null> {
  if (testStore) {
    const opp = testStore.opportunities?.find((o) => o.opportunityId === opportunityId);
    if (!opp) return null;
    return toPublicOpportunity(opp);
  }

  if (!db) return null;
  try {
    const ref = doc(db, 'investmentOpportunities', opportunityId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as InvestmentOpportunity;
    return toPublicOpportunity(data);
  } catch (err) {
    console.warn(`[publicInvestmentService] Failed to fetch opportunity ${opportunityId}:`, err);
    return null;
  }
}

export async function fetchPublicMapConfig(): Promise<PublicInvestmentMapConfig | null> {
  if (testStore && testStore.mapConfig) {
    const data = testStore.mapConfig;
    return {
      defaultCommodity: data.defaultCommodity,
      defaultMetric: data.defaultMetric,
      featuredCommodities: data.featuredCommodities,
      currentDatasetIds: data.currentDatasetIds || {},
    };
  }

  if (!db) return null;
  try {
    const ref = doc(db, 'investmentMapConfig', 'default');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as InvestmentMapConfig;
    return {
      defaultCommodity: data.defaultCommodity,
      defaultMetric: data.defaultMetric,
      featuredCommodities: data.featuredCommodities,
      currentDatasetIds: data.currentDatasetIds || {},
    };
  } catch (err) {
    console.warn(`[publicInvestmentService] Failed to fetch map config:`, err);
    return null;
  }
}

