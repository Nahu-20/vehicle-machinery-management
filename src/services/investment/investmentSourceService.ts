import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { InvestmentSource, InvestmentDataset } from '../../types/investment';
import { StaffUser } from '../../types/auth';

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
  >
): Promise<InvestmentSource> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_source',
      actorUid: actor.uid,
      payload: input,
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to create source "${input.sourceId}"`);
  }

  return resData.data as InvestmentSource;
}
