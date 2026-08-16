import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { InvestmentMethodology } from '../../types/investment';
import { StaffUser } from '../../types/auth';

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
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_methodology',
      actorUid: actor.uid,
      expectedVersion,
      payload: input,
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to save methodology "${input.methodologyId}"`);
  }

  return resData.data as InvestmentMethodology;
}
