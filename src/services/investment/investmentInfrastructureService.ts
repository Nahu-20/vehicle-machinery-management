import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { InvestmentInfrastructure } from '../../types/investment';
import { StaffUser } from '../../types/auth';

export async function getInfrastructureRecord(recordId: string): Promise<InvestmentInfrastructure | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentInfrastructure', recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InvestmentInfrastructure;
}

export async function getAllInfrastructure(): Promise<InvestmentInfrastructure[]> {
  if (!db) return [];
  const colRef = collection(db, 'investmentInfrastructure');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as InvestmentInfrastructure);
}

export async function saveInfrastructure(
  actor: StaffUser,
  input: Omit<InvestmentInfrastructure, 'version' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<InvestmentInfrastructure> {
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_infrastructure',
      actorUid: actor.uid,
      payload: input,
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to save infrastructure record "${input.recordId}"`);
  }

  return resData.data as InvestmentInfrastructure;
}
