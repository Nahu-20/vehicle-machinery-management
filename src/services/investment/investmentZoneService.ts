import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import {
  InvestmentZoneProfile,
  validateZoneId,
} from '../../types/investment';
import { StaffUser } from '../../types/auth';
import {
  CanonicalZoneId,
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
  CanonicalZoneInfo,
} from '../../features/investment-map/constants/canonicalZones';

export interface ZoneDirectoryRow {
  zoneInfo: CanonicalZoneInfo;
  profile: InvestmentZoneProfile | null;
  statusLabel: string; // 'Not created' | 'draft' | 'published'
  verificationStatus: string; // 'unverified' | 'pending' | 'verified' | 'rejected'
  updatedAt: string | null;
}

export async function getZoneProfile(zoneId: CanonicalZoneId): Promise<InvestmentZoneProfile | null> {
  if (!validateZoneId(zoneId)) {
    throw new Error(`Invalid canonical zone_id: "${zoneId}"`);
  }
  if (!db) return null;

  const ref = doc(db, 'investmentZoneProfiles', zoneId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InvestmentZoneProfile;
}

export async function getAllZoneProfiles(): Promise<InvestmentZoneProfile[]> {
  if (!db) return [];
  const colRef = collection(db, 'investmentZoneProfiles');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => d.data() as InvestmentZoneProfile);
}

export async function getAllZoneDirectoryRows(): Promise<ZoneDirectoryRow[]> {
  const profiles = await getAllZoneProfiles();
  const profileMap = new Map<string, InvestmentZoneProfile>();
  for (const p of profiles) {
    if (p.zoneId) profileMap.set(p.zoneId, p);
  }

  return CANONICAL_ZONE_IDS.map((zid) => {
    const info = CANONICAL_ZONE_METADATA[zid];
    const profile = profileMap.get(zid) || null;

    return {
      zoneInfo: info,
      profile,
      statusLabel: profile ? profile.status : 'Not created',
      verificationStatus: profile ? profile.verificationStatus : 'unverified',
      updatedAt: profile ? profile.updatedAt : null,
    };
  });
}

export async function createOrUpdateZoneProfile(
  actor: StaffUser,
  input: {
    zoneId: CanonicalZoneId;
    overview: InvestmentZoneProfile['overview'];
    featuredCommodities: InvestmentZoneProfile['featuredCommodities'];
    infrastructureSummary?: InvestmentZoneProfile['infrastructureSummary'];
    opportunitySummary?: InvestmentZoneProfile['opportunitySummary'];
    responsibleOffice: string;
    verificationStatus?: InvestmentZoneProfile['verificationStatus'];
  },
  expectedVersion?: number
): Promise<InvestmentZoneProfile> {
  if (!validateZoneId(input.zoneId)) {
    throw new Error(`Invalid canonical zone_id: "${input.zoneId}"`);
  }

  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_zone_profile',
      actorUid: actor.uid,
      expectedVersion,
      payload: input,
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to save zone profile for ${input.zoneId}`);
  }

  return resData.data as InvestmentZoneProfile;
}

export async function publishZoneProfile(
  actor: StaffUser,
  zoneId: CanonicalZoneId,
  expectedVersion: number
): Promise<InvestmentZoneProfile> {
  if (!validateZoneId(zoneId)) {
    throw new Error(`Invalid canonical zone_id: "${zoneId}"`);
  }

  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'publish_zone_profile',
      actorUid: actor.uid,
      expectedVersion,
      payload: { zoneId },
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || `Failed to publish zone profile for ${zoneId}`);
  }

  return resData.data as InvestmentZoneProfile;
}
