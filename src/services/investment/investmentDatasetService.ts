import { db } from '../../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import {
  InvestmentDataset,
  InvestmentZoneValue,
  InvestmentMethodology,
} from '../../types/investment';
import { StaffUser } from '../../types/auth';
import { CANONICAL_ZONE_IDS, CanonicalZoneId } from '../../features/investment-map/constants/canonicalZones';
import { callInvestmentCallable } from './investmentMutationClient';

export async function getDataset(datasetId: string): Promise<InvestmentDataset | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentDatasets', datasetId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InvestmentDataset;
}

export async function getAllDatasets(): Promise<InvestmentDataset[]> {
  if (!db) return [];
  const colRef = collection(db, 'investmentDatasets');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as InvestmentDataset);
}

export async function getZoneValues(datasetId: string): Promise<InvestmentZoneValue[]> {
  if (!db) return [];
  const colRef = collection(db, 'investmentDatasets', datasetId, 'values');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as InvestmentZoneValue);
}

export interface DatasetCoverage {
  populatedCount: number;
  totalZones: number;
  populatedZoneIds: CanonicalZoneId[];
  missingZoneIds: CanonicalZoneId[];
}

export async function getDatasetCoverage(datasetId: string): Promise<DatasetCoverage> {
  const dataset = await getDataset(datasetId);
  const metric = dataset?.metric || 'production';
  const values = await getZoneValues(datasetId);

  const populatedZoneIds = values
    .filter((v) => {
      if (metric === 'production') {
        return v.productionVolume !== null && v.productionVolume !== undefined;
      } else {
        return v.value !== null && v.value !== undefined;
      }
    })
    .map((v) => v.zoneId as CanonicalZoneId);

  const missingZoneIds = CANONICAL_ZONE_IDS.filter(
    (zid) => !populatedZoneIds.includes(zid)
  );

  return {
    populatedCount: populatedZoneIds.length,
    totalZones: CANONICAL_ZONE_IDS.length,
    populatedZoneIds,
    missingZoneIds,
  };
}

export async function createDataset(
  actor: StaffUser,
  input: Omit<
    InvestmentDataset,
    'version' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'publishedAt' | 'publishedBy' | 'lifecycleStatus' | 'isCurrent'
  >
): Promise<InvestmentDataset> {
  const res = await callInvestmentCallable<InvestmentDataset>(
    'save_dataset_draft',
    input,
    undefined,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to create dataset');
  }
  return res.data;
}

export async function setZoneValues(
  actor: StaffUser,
  datasetId: string,
  values: InvestmentZoneValue[],
  expectedVersion?: number,
  requestId?: string
): Promise<{ success: boolean; count: number; newVersion: number }> {
  const res = await callInvestmentCallable<{ count: number; newVersion: number }>(
    'update_dataset_values',
    { datasetId, values, requestId },
    expectedVersion,
    actor
  );
  return {
    success: res.success,
    count: res.count || res.data?.count || values.length,
    newVersion: res.newVersion || res.data?.newVersion || (expectedVersion || 1) + 1,
  };
}

export async function publishDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number,
  _methodology?: InvestmentMethodology | null
): Promise<InvestmentDataset> {
  const res = await callInvestmentCallable<InvestmentDataset>(
    'publish_dataset',
    { datasetId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to publish dataset');
  }
  return res.data;
}

export async function submitDatasetForReview(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number
): Promise<InvestmentDataset> {
  const res = await callInvestmentCallable<InvestmentDataset>(
    'submit_dataset_review',
    { datasetId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to submit dataset for review');
  }
  return res.data;
}

export async function returnDatasetToDraft(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number
): Promise<InvestmentDataset> {
  const res = await callInvestmentCallable<InvestmentDataset>(
    'return_dataset_draft',
    { datasetId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to return dataset to draft');
  }
  return res.data;
}

export async function unpublishDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number
): Promise<InvestmentDataset> {
  const res = await callInvestmentCallable<InvestmentDataset>(
    'unpublish_dataset',
    { datasetId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to unpublish dataset');
  }
  return res.data;
}

export async function verifyDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number,
  notes?: string
): Promise<InvestmentDataset> {
  const res = await callInvestmentCallable<InvestmentDataset>(
    'verify_dataset',
    { datasetId, notes },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to verify dataset');
  }
  return res.data;
}

export async function rejectDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number,
  notes?: string
): Promise<InvestmentDataset> {
  const res = await callInvestmentCallable<InvestmentDataset>(
    'reject_dataset',
    { datasetId, reason: notes, notes },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to reject dataset');
  }
  return res.data;
}

export async function attachSourceToDataset(
  actor: StaffUser,
  datasetId: string,
  sourceId: string,
  expectedVersion?: number
): Promise<InvestmentDataset> {
  const current = await getDataset(datasetId);
  if (!current) throw new Error(`Dataset "${datasetId}" not found`);
  const currentSources = Array.isArray(current.sourceIds) ? [...current.sourceIds] : [];
  if (!currentSources.includes(sourceId)) {
    currentSources.push(sourceId);
  }
  const res = await callInvestmentCallable<InvestmentDataset>(
    'save_dataset_draft',
    { ...current, sourceIds: currentSources },
    expectedVersion ?? current.version,
    actor
  );
  if (!res.data) throw new Error(res.error || 'Failed to attach source');
  return res.data;
}

export async function removeSourceFromDataset(
  actor: StaffUser,
  datasetId: string,
  sourceId: string,
  expectedVersion?: number
): Promise<InvestmentDataset> {
  const current = await getDataset(datasetId);
  if (!current) throw new Error(`Dataset "${datasetId}" not found`);
  const currentSources = (Array.isArray(current.sourceIds) ? current.sourceIds : []).filter(
    (s) => s !== sourceId
  );
  const res = await callInvestmentCallable<InvestmentDataset>(
    'save_dataset_draft',
    { ...current, sourceIds: currentSources },
    expectedVersion ?? current.version,
    actor
  );
  if (!res.data) throw new Error(res.error || 'Failed to remove source');
  return res.data;
}

export async function attachMethodologyToDataset(
  actor: StaffUser,
  datasetId: string,
  methodologyId: string,
  expectedVersion?: number
): Promise<InvestmentDataset> {
  const current = await getDataset(datasetId);
  if (!current) throw new Error(`Dataset "${datasetId}" not found`);
  const res = await callInvestmentCallable<InvestmentDataset>(
    'save_dataset_draft',
    { ...current, methodologyId },
    expectedVersion ?? current.version,
    actor
  );
  if (!res.data) throw new Error(res.error || 'Failed to attach methodology');
  return res.data;
}

export async function removeMethodologyFromDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion?: number
): Promise<InvestmentDataset> {
  const current = await getDataset(datasetId);
  if (!current) throw new Error(`Dataset "${datasetId}" not found`);
  const { methodologyId: _removed, ...rest } = current;
  const res = await callInvestmentCallable<InvestmentDataset>(
    'save_dataset_draft',
    rest,
    expectedVersion ?? current.version,
    actor
  );
  if (!res.data) throw new Error(res.error || 'Failed to remove methodology');
  return res.data;
}
