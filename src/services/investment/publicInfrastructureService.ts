import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  InvestmentFacility,
  PublicInvestmentFacility,
  toPublicFacility,
  InfrastructureCategory,
  PublicInvestmentSource,
  InvestmentSource,
} from '../../types/investment';
import { CanonicalZoneId, isCanonicalZoneId } from '../../features/investment-map/constants/canonicalZones';
import { fetchPublicSource } from './publicInvestmentService';

// Test Store Adapter for Unit & Integration Verification
export interface PublicInfrastructureTestStore {
  facilities: InvestmentFacility[];
  sources?: InvestmentSource[];
}

let testStore: PublicInfrastructureTestStore | null = null;

export function setPublicInfrastructureTestStore(store: PublicInfrastructureTestStore | null) {
  testStore = store;
  clearFacilityCache();
}

export function resetPublicInfrastructureTestStore() {
  testStore = null;
  clearFacilityCache();
}

// In-Memory Facility Cache to Avoid Redundant Network Requests
let cachedFacilities: PublicInvestmentFacility[] | null = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute

export function clearFacilityCache() {
  cachedFacilities = null;
  lastCacheFetchTime = 0;
}

/**
 * Fetches all published and verified infrastructure facilities.
 * Sanitizes internal fields via toPublicFacility (strips staff IDs, notes, versions, private coordinates).
 * Returns empty array if zero eligible records exist (NO demo data fallback).
 */
export async function fetchPublicFacilities(): Promise<PublicInvestmentFacility[]> {
  const now = Date.now();
  if (cachedFacilities && now - lastCacheFetchTime < CACHE_TTL_MS && !testStore) {
    return cachedFacilities;
  }

  let eligible: PublicInvestmentFacility[] = [];

  if (testStore) {
    eligible = testStore.facilities
      .filter((f) => f.lifecycleStatus === 'published' && f.verificationStatus === 'verified')
      .map((f) => toPublicFacility(f))
      .filter((f): f is PublicInvestmentFacility => f !== null);
    return eligible;
  }

  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(db, 'investmentInfrastructure'),
      where('lifecycleStatus', '==', 'published'),
      where('verificationStatus', '==', 'verified')
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      eligible = snap.docs
        .map((d) => toPublicFacility(d.data() as InvestmentFacility))
        .filter((f): f is PublicInvestmentFacility => f !== null);
    }

    cachedFacilities = eligible;
    lastCacheFetchTime = now;
    return eligible;
  } catch (err) {
    console.warn('[publicInfrastructureService] Failed to query public facilities:', err);
    return [];
  }
}

export const fetchPublishedFacilities = fetchPublicFacilities;


/**
 * Fetches published + verified facilities belonging to a specific canonical zone.
 */
export async function fetchPublicFacilitiesByZone(
  zoneId: CanonicalZoneId
): Promise<PublicInvestmentFacility[]> {
  if (!isCanonicalZoneId(zoneId)) return [];
  const all = await fetchPublicFacilities();
  return all.filter((f) => f.zoneId === zoneId);
}

/**
 * Fetches published + verified facilities matching an infrastructure category.
 */
export async function fetchPublicFacilitiesByCategory(
  category: InfrastructureCategory
): Promise<PublicInvestmentFacility[]> {
  const all = await fetchPublicFacilities();
  return all.filter((f) => f.category === category);
}

/**
 * Fetches a single facility by ID if published and verified.
 */
export async function fetchPublicFacilityById(
  facilityId: string
): Promise<PublicInvestmentFacility | null> {
  if (!facilityId || typeof facilityId !== 'string') return null;

  if (testStore) {
    const fac = testStore.facilities.find((f) => f.facilityId === facilityId);
    if (!fac || fac.lifecycleStatus !== 'published' || fac.verificationStatus !== 'verified') {
      return null;
    }
    return toPublicFacility(fac);
  }

  if (!db) return null;

  try {
    const ref = doc(db, 'investmentInfrastructure', facilityId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const raw = snap.data() as InvestmentFacility;
    return toPublicFacility(raw);
  } catch (err) {
    console.warn(`[publicInfrastructureService] Failed to fetch facility ${facilityId}:`, err);
    return null;
  }
}

/**
 * Fetches verified public source provenance for a facility.
 */
export async function fetchFacilitySources(
  sourceIds: string[]
): Promise<PublicInvestmentSource[]> {
  if (!Array.isArray(sourceIds) || sourceIds.length === 0) return [];

  if (testStore?.sources) {
    return testStore.sources
      .filter((s) => sourceIds.includes(s.sourceId) && s.verificationStatus === 'verified')
      .map((s) => ({
        sourceId: s.sourceId,
        title: s.title,
        organization: s.organization || (s as any).publisher || 'Official Source',
        documentTitle: s.documentTitle,
        publicationDate: s.publicationDate || ((s as any).year ? String((s as any).year) : undefined),
        url: s.url,
        license: s.license,
      }));
  }

  const results: PublicInvestmentSource[] = [];
  for (const sId of sourceIds) {
    const src = await fetchPublicSource(sId);
    if (src) {
      results.push(src);
    }
  }
  return results;
}

export const fetchPublicFacilitySources = fetchFacilitySources;
