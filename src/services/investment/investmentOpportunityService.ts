import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  InvestmentOpportunity,
  LifecycleStatus,
  PublicInvestmentOpportunity,
  toPublicOpportunity,
  validateZoneId,
  VerificationStatus,
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
  return snap.docs
    .map((d) => d.data() as InvestmentOpportunity)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export function slugifyOpportunityTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function createOpportunity(
  actor: StaffUser,
  input: Partial<InvestmentOpportunity> &
    Pick<
      InvestmentOpportunity,
      'opportunityId' | 'title' | 'slug' | 'zoneIds' | 'summary' | 'description' | 'responsibleOffice'
    >,
  expectedVersion?: number
): Promise<InvestmentOpportunity> {
  for (const zid of input.zoneIds || []) {
    if (!validateZoneId(zid)) {
      throw new Error(`Invalid zone ID in opportunity: "${zid}"`);
    }
  }

  const res = await callInvestmentCallable<InvestmentOpportunity>(
    'save_opportunity',
    {
      ...input,
      opportunityType: input.opportunityType || 'general',
      commodityKeys: input.commodityKeys || [],
      sourceIds: input.sourceIds || [],
      lifecycleStatus: (input.lifecycleStatus || 'published') as LifecycleStatus,
      verificationStatus: (input.verificationStatus || 'verified') as VerificationStatus,
    },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to create opportunity');
  }
  return res.data;
}

export async function updateOpportunity(
  actor: StaffUser,
  input: Partial<InvestmentOpportunity> & { opportunityId: string },
  expectedVersion?: number
): Promise<InvestmentOpportunity> {
  if (Array.isArray(input.zoneIds)) {
    for (const zid of input.zoneIds) {
      if (!validateZoneId(zid)) {
        throw new Error(`Invalid zone ID in opportunity: "${zid}"`);
      }
    }
  }

  const res = await callInvestmentCallable<InvestmentOpportunity>(
    'save_opportunity',
    input,
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to update opportunity');
  }
  return res.data;
}

export async function deleteOpportunity(
  actor: StaffUser,
  opportunityId: string,
  expectedVersion?: number
): Promise<{ success: boolean; deletedId: string }> {
  const res = await callInvestmentCallable<{ deletedId: string }>(
    'delete_entity',
    { entityType: 'opportunity', entityId: opportunityId },
    expectedVersion,
    actor
  );
  return {
    success: res.success,
    deletedId: res.deletedId || res.data?.deletedId || opportunityId,
  };
}

/** Public list: published + verified only. */
export async function listPublicOpportunities(): Promise<PublicInvestmentOpportunity[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'investmentOpportunities'),
      where('lifecycleStatus', '==', 'published'),
      where('verificationStatus', '==', 'verified')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => toPublicOpportunity(d.data() as InvestmentOpportunity))
      .filter((o): o is PublicInvestmentOpportunity => o !== null)
      .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  } catch (err) {
    console.warn('[listPublicOpportunities] query failed:', err);
    return [];
  }
}
