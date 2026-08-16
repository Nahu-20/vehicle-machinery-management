import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
  InvestmentDataset,
  InvestmentZoneValue,
  InvestmentMethodology,
} from '../../types/investment';
import { StaffUser } from '../../types/auth';
import { CANONICAL_ZONE_IDS, CanonicalZoneId } from '../../features/investment-map/constants/canonicalZones';

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
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_dataset',
      actorUid: actor.uid,
      payload: input,
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to create dataset "${input.datasetId}"`);
  }

  return resData.data as InvestmentDataset;
}

export async function setZoneValues(
  actor: StaffUser,
  datasetId: string,
  values: InvestmentZoneValue[],
  expectedVersion?: number,
  requestId?: string
): Promise<{ success: boolean; count: number; newVersion: number }> {
  const dataset = await getDataset(datasetId);
  const metric = dataset?.metric || 'production';

  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'set_dataset_values',
      actorUid: actor.uid,
      expectedVersion: expectedVersion !== undefined ? expectedVersion : dataset?.version,
      payload: { datasetId, metric, values, requestId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    const err: any = new Error(resData.error || `Failed to set zone values for dataset "${datasetId}"`);
    err.code = resData.code;
    throw err;
  }

  return { success: true, count: resData.count, newVersion: resData.newVersion };
}

export async function publishDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number,
  _methodology?: InvestmentMethodology | null
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'publish_dataset',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to publish dataset "${datasetId}"`);
  }

  return resData.data as InvestmentDataset;
}

export async function submitDatasetForReview(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'submit_dataset_for_review',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to submit dataset "${datasetId}" for review`);
  }

  return resData.data as InvestmentDataset;
}

export async function returnDatasetToDraft(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'return_dataset_to_draft',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to return dataset "${datasetId}" to draft`);
  }

  return resData.data as InvestmentDataset;
}

export async function unpublishDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'unpublish_dataset',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to unpublish dataset "${datasetId}"`);
  }

  return resData.data as InvestmentDataset;
}

export async function verifyDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mark_dataset_verified',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to verify dataset "${datasetId}"`);
  }

  return resData.data as InvestmentDataset;
}

export async function rejectDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion: number,
  notes?: string
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mark_dataset_rejected',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId, notes },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to reject dataset "${datasetId}"`);
  }

  return resData.data as InvestmentDataset;
}

export async function attachSourceToDataset(
  actor: StaffUser,
  datasetId: string,
  sourceId: string,
  expectedVersion?: number
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'attach_source',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId, sourceId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to attach source "${sourceId}" to dataset "${datasetId}"`);
  }

  return resData.data as InvestmentDataset;
}

export async function removeSourceFromDataset(
  actor: StaffUser,
  datasetId: string,
  sourceId: string,
  expectedVersion?: number
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'remove_source',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId, sourceId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to remove source "${sourceId}" from dataset "${datasetId}"`);
  }

  return resData.data as InvestmentDataset;
}

export async function attachMethodologyToDataset(
  actor: StaffUser,
  datasetId: string,
  methodologyId: string,
  expectedVersion?: number
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'attach_methodology',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId, methodologyId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to attach methodology "${methodologyId}" to dataset "${datasetId}"`);
  }

  return resData.data as InvestmentDataset;
}

export async function removeMethodologyFromDataset(
  actor: StaffUser,
  datasetId: string,
  expectedVersion?: number
): Promise<InvestmentDataset> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'remove_methodology',
      actorUid: actor.uid,
      expectedVersion,
      payload: { datasetId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to remove methodology from dataset "${datasetId}"`);
  }

  return resData.data as InvestmentDataset;
}
