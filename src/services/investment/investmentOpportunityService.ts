import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
  InvestmentOpportunity,
  validateZoneId,
} from '../../types/investment';
import { StaffUser } from '../../types/auth';
import { callInvestmentCallable } from './investmentMutationClient';

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
  >,
  expectedVersion?: number
): Promise<InvestmentOpportunity> {
  for (const zid of input.zoneIds) {
    if (!validateZoneId(zid)) {
      throw new Error(`Invalid zone ID in opportunity: "${zid}"`);
    }
  }

  const res = await callInvestmentCallable<InvestmentOpportunity>(
    'save_opportunity',
    input,
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to create opportunity');
  }
  return res.data;
}

export async function deleteOpportunity(
  actor: StaffUser,
  opportunityId: string,
  expectedVersion?: number
): Promise<{ success: boolean; deletedId: string }> {
  const res = await callInvestmentCallable<{ deletedId: string }>(
    'delete_opportunity',
    { opportunityId },
    expectedVersion,
    actor
  );
  return {
    success: res.success,
    deletedId: res.deletedId || res.data?.deletedId || opportunityId,
  };
}
