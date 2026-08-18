import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { InvestmentMethodology } from '../../types/investment';
import { StaffUser } from '../../types/auth';
import { callInvestmentCallable } from './investmentMutationClient';

export async function getMethodology(methodologyId: string): Promise<InvestmentMethodology | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentMethodologies', methodologyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InvestmentMethodology;
}

export async function getAllMethodologies(): Promise<InvestmentMethodology[]> {
  if (!db) return [];
  const colRef = collection(db, 'investmentMethodologies');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as InvestmentMethodology);
}

export async function saveMethodology(
  actor: StaffUser,
  input: Partial<InvestmentMethodology> & { methodologyId: string },
  expectedVersion?: number
): Promise<InvestmentMethodology> {
  const res = await callInvestmentCallable<InvestmentMethodology>(
    'save_methodology',
    input,
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to save methodology');
  }
  return res.data;
}

export async function deleteMethodology(
  actor: StaffUser,
  methodologyId: string,
  expectedVersion?: number
): Promise<{ success: boolean; deletedId: string }> {
  const res = await callInvestmentCallable<{ deletedId: string }>(
    'delete_methodology',
    { methodologyId },
    expectedVersion,
    actor
  );
  return {
    success: res.success,
    deletedId: res.deletedId || res.data?.deletedId || methodologyId,
  };
}
