import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { InvestmentFacility, InvestmentInfrastructure } from '../../types/investment';
import { StaffUser } from '../../types/auth';
import { callInvestmentCallable } from './investmentMutationClient';

export interface MutationApiError extends Error {
  code?: string;
  statusCode?: number;
}

export async function getFacility(facilityId: string): Promise<InvestmentFacility | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentInfrastructure', facilityId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InvestmentFacility;
}

export async function getInfrastructureRecord(recordId: string): Promise<InvestmentInfrastructure | null> {
  return getFacility(recordId);
}

export async function getAllFacilities(): Promise<InvestmentFacility[]> {
  if (!db) return [];
  const colRef = collection(db, 'investmentInfrastructure');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as InvestmentFacility);
}

export async function getAllInfrastructure(): Promise<InvestmentInfrastructure[]> {
  return getAllFacilities();
}

export async function saveFacility(
  actor: StaffUser,
  input: Partial<InvestmentFacility> & { facilityId?: string; zoneId: any },
  expectedVersion?: number
): Promise<InvestmentFacility> {
  const res = await callInvestmentCallable<InvestmentFacility>(
    'save_facility',
    input,
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to save facility');
  }
  return res.data;
}

export async function saveInfrastructure(
  actor: StaffUser,
  input: any
): Promise<InvestmentInfrastructure> {
  return saveFacility(actor, input);
}

export async function submitFacilityForReview(
  actor: StaffUser,
  facilityId: string,
  expectedVersion?: number
): Promise<InvestmentFacility> {
  const res = await callInvestmentCallable<InvestmentFacility>(
    'submit_facility_review',
    { facilityId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to submit facility for review');
  }
  return res.data;
}

export async function returnFacilityToDraft(
  actor: StaffUser,
  facilityId: string,
  expectedVersion?: number
): Promise<InvestmentFacility> {
  const res = await callInvestmentCallable<InvestmentFacility>(
    'return_facility_draft',
    { facilityId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to return facility to draft');
  }
  return res.data;
}

export async function verifyFacility(
  actor: StaffUser,
  facilityId: string,
  expectedVersion?: number
): Promise<InvestmentFacility> {
  const res = await callInvestmentCallable<InvestmentFacility>(
    'verify_facility',
    { facilityId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to verify facility');
  }
  return res.data;
}

export async function rejectFacility(
  actor: StaffUser,
  facilityId: string,
  reason: string,
  expectedVersion?: number
): Promise<InvestmentFacility> {
  const res = await callInvestmentCallable<InvestmentFacility>(
    'reject_facility',
    { facilityId, reason },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to reject facility');
  }
  return res.data;
}

export async function publishFacility(
  actor: StaffUser,
  facilityId: string,
  expectedVersion?: number
): Promise<InvestmentFacility> {
  const res = await callInvestmentCallable<InvestmentFacility>(
    'publish_facility',
    { facilityId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to publish facility');
  }
  return res.data;
}

export async function unpublishFacility(
  actor: StaffUser,
  facilityId: string,
  expectedVersion?: number
): Promise<InvestmentFacility> {
  const res = await callInvestmentCallable<InvestmentFacility>(
    'unpublish_facility',
    { facilityId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to unpublish facility');
  }
  return res.data;
}

export async function archiveFacility(
  actor: StaffUser,
  facilityId: string,
  expectedVersion?: number
): Promise<InvestmentFacility> {
  const res = await callInvestmentCallable<InvestmentFacility>(
    'archive_facility',
    { facilityId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to archive facility');
  }
  return res.data;
}

export async function restoreFacility(
  actor: StaffUser,
  facilityId: string,
  expectedVersion?: number
): Promise<InvestmentFacility> {
  const res = await callInvestmentCallable<InvestmentFacility>(
    'restore_facility',
    { facilityId },
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to restore facility');
  }
  return res.data;
}

export async function deleteFacility(
  actor: StaffUser,
  facilityId: string,
  expectedVersion?: number
): Promise<{ success: boolean; deletedId: string }> {
  const res = await callInvestmentCallable<{ deletedId: string }>(
    'delete_facility',
    { facilityId },
    expectedVersion,
    actor
  );
  return {
    success: res.success,
    deletedId: res.deletedId || res.data?.deletedId || facilityId,
  };
}
