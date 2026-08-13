import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
  InvestmentOpportunity,
  validateZoneId,
} from '../../types/investment';
import { StaffUser } from '../../types/auth';

export async function getOpportunity(opportunityId: string): Promise<InvestmentOpportunity | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentOpportunities', opportunityId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InvestmentOpportunity;
}

export async function getAllOpportunities(): Promise<InvestmentOpportunity[]> {
  if (!db) return [];
  const colRef = collection(db, 'investmentOpportunities');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as InvestmentOpportunity);
}

export async function createOpportunity(
  actor: StaffUser,
  input: Omit<
    InvestmentOpportunity,
    'version' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'publishedAt' | 'publishedBy' | 'lifecycleStatus'
  >
): Promise<InvestmentOpportunity> {
  for (const zid of input.zoneIds) {
    if (!validateZoneId(zid)) {
      throw new Error(`Invalid zone ID in opportunity: "${zid}"`);
    }
  }

  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_opportunity',
      actorUid: actor.uid,
      payload: input,
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to create opportunity "${input.opportunityId}"`);
  }

  return resData.data as InvestmentOpportunity;
}
