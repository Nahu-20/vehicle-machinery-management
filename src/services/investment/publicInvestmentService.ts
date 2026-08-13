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

export async function fetchPublicZoneProfile(
  zoneId: CanonicalZoneId
): Promise<PublicInvestmentZoneProfile | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentZoneProfiles', zoneId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as InvestmentZoneProfile;
  return toPublicZoneProfile(data);
}

export async function fetchPublicCurrentDataset(
  commodity: string,
  metric: string
): Promise<{ metadata: PublicInvestmentDataset; values: PublicInvestmentZoneValue[] } | null> {
  if (!db) return null;

  // Query current published and verified dataset for commodity and metric
  const q = query(
    collection(db, 'investmentDatasets'),
    where('commodity', '==', commodity),
    where('metric', '==', metric),
    where('lifecycleStatus', '==', 'published'),
    where('verificationStatus', '==', 'verified'),
    where('isCurrent', '==', true)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const datasetData = snap.docs[0].data() as InvestmentDataset;
  const publicMeta = toPublicDataset(datasetData);
  if (!publicMeta) return null;

  // Fetch zone values for this dataset
  const valuesSnap = await getDocs(collection(db, 'investmentDatasets', datasetData.datasetId, 'values'));
  const rawValues = valuesSnap.docs.map((d) => d.data() as InvestmentZoneValue);

  const publicValues = rawValues.map((v) => toPublicZoneValue(v, rawValues));

  return {
    metadata: publicMeta,
    values: publicValues,
  };
}

export async function fetchPublicSource(sourceId: string): Promise<PublicInvestmentSource | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentSources', sourceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as InvestmentSource;
  return toPublicSource(data);
}

export async function fetchPublicOpportunity(
  opportunityId: string
): Promise<PublicInvestmentOpportunity | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentOpportunities', opportunityId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as InvestmentOpportunity;
  return toPublicOpportunity(data);
}

export async function fetchPublicMapConfig(): Promise<PublicInvestmentMapConfig | null> {
  if (!db) return null;
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
}
