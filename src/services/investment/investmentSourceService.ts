import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { InvestmentSource, InvestmentDataset } from '../../types/investment';
import { StaffUser } from '../../types/auth';
import { callInvestmentCallable } from './investmentMutationClient';

export async function getSource(sourceId: string): Promise<InvestmentSource | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentSources', sourceId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InvestmentSource;
}

export async function getAllSources(): Promise<InvestmentSource[]> {
  if (!db) return [];
  const colRef = collection(db, 'investmentSources');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as InvestmentSource);
}

export async function getDatasetsUsingSource(sourceId: string): Promise<InvestmentDataset[]> {
  if (!db) return [];
  const colRef = collection(db, 'investmentDatasets');
  const snap = await getDocs(colRef);
  const allDs = snap.docs.map((d) => d.data() as InvestmentDataset);
  return allDs.filter((ds) => ds.sourceIds && Array.isArray(ds.sourceIds) && ds.sourceIds.includes(sourceId));
}

export async function createSource(
  actor: StaffUser,
  input: Omit<
    InvestmentSource,
    'version' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'status'
  >,
  expectedVersion?: number
): Promise<InvestmentSource> {
  const res = await callInvestmentCallable<InvestmentSource>(
    'save_source',
    input,
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to create source');
  }
  return res.data;
}

export async function deleteSource(
  actor: StaffUser,
  sourceId: string,
  expectedVersion?: number
): Promise<{ success: boolean; deletedId: string }> {
  const res = await callInvestmentCallable<{ deletedId: string }>(
    'delete_source',
    { sourceId },
    expectedVersion,
    actor
  );
  return {
    success: res.success,
    deletedId: res.deletedId || res.data?.deletedId || sourceId,
  };
}
