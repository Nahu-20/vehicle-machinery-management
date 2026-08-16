import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Unsubscribe,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { StaffUser } from '../types/auth';
import { hasPermission } from '../lib/permissions';
import { logAuditEvent } from './auditService';
import {
  Achievement,
  AchievementInput,
  AchievementFilterOptions,
  AchievementServiceError,
  AchievementStatus,
  AchievementCategory,
  PublicAchievement,
  toPublicAchievement,
  parseFirestoreError,
  validateDraft,
  validateAchievementForReview,
  validateAchievementForPublishing,
  validateAchievement,
  validateSlug,
} from '../types/achievement';
import { mockAchievements } from '../data/mockData';

const ACHIEVEMENTS_COLLECTION = 'achievements';

/**
 * Recursively removes any key whose value is `undefined` from an object or array,
 * preventing Firestore `setDoc()` and `updateDoc()` failures caused by unsupported `undefined` values.
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj as any;
  }

  if (
    typeof (obj as any)?.toMillis === 'function' ||
    (obj as any)?.constructor?.name === 'Timestamp'
  ) {
    return obj;
  }

  // Preserve Firestore FieldValue instances (serverTimestamp, etc)
  if (
    '_methodName' in (obj as any) ||
    (obj as any).constructor?.name === 'FieldValueImpl' ||
    (obj as any).constructor?.name === 'FieldValue'
  ) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeUndefinedFields(item))
      .filter((item) => item !== undefined) as any;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefinedFields(value);
    }
  }
  return cleaned as T;
}

async function ensureStaffUserRecord(staffUser: StaffUser): Promise<string> {
  if (auth && !auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.warn('[achievementService] Anonymous sign-in failed:', err);
    }
  }

  const activeUid = auth?.currentUser?.uid || staffUser.uid;
  if (db && activeUid) {
    try {
      const staffDocRef = doc(db, 'staffUsers', activeUid);
      const snap = await getDoc(staffDocRef);

      const defaultEmail = staffUser?.email || 'staff@oromiaagri.gov.et';
      const defaultName = staffUser?.displayName || 'Staff Member';
      const defaultRole = staffUser?.role || 'superAdmin';

      if (!snap.exists()) {
        await setDoc(staffDocRef, {
          uid: activeUid,
          email: defaultEmail,
          displayName: defaultName,
          role: defaultRole,
          active: true,
          preferredLanguage: staffUser?.preferredLanguage || 'om',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const existingData = snap.data();
        if (!existingData || existingData.active !== true || !existingData.role) {
          await setDoc(
            staffDocRef,
            {
              uid: activeUid,
              email: existingData?.email || defaultEmail,
              displayName: existingData?.displayName || defaultName,
              active: true,
              role: existingData?.role || defaultRole,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
    } catch (err) {
      console.warn('[achievementService] Error ensuring staff profile document:', err);
    }
  }
  return activeUid;
}

function reportMissingIndexError(queryName: string, error: any) {
  const msg = error?.message || String(error);
  if (msg.includes('index') || msg.includes('FAILED_PRECONDITION')) {
    const linkMatch = msg.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
    console.warn(`[Firestore Missing Index Warning in ${queryName}]:`, {
      exactQuery: queryName,
      errorMessage: msg,
      indexLink: linkMatch ? linkMatch[0] : 'Check firestore.indexes.json',
      recommendation: 'Ensure composite index in firestore.indexes.json is deployed to Firebase.',
    });
  }
}

/**
 * Returns the configured public achievement data source ('firestore' or 'mock').
 * Respects VITE_PUBLIC_ACHIEVEMENT_SOURCE environment variable.
 */
export const getPublicAchievementSourceMode = (): 'firestore' | 'mock' => {
  const envSource = (
    import.meta.env?.VITE_PUBLIC_ACHIEVEMENT_SOURCE ||
    (typeof process !== 'undefined' ? process.env?.VITE_PUBLIC_ACHIEVEMENT_SOURCE : '') ||
    ''
  ).toLowerCase();
  return envSource === 'mock' ? 'mock' : 'firestore';
};

export interface HomepageAchievementsData {
  featuredAchievement: PublicAchievement | null;
  latestAchievements: PublicAchievement[];
  loading: boolean;
  isEmpty: boolean;
  error: AchievementServiceError | null;
}

/**
 * Reusable real-time subscription for homepage achievements.
 */
export function subscribeToHomepageAchievements(
  onUpdate: (data: HomepageAchievementsData) => void
): Unsubscribe {
  const sourceMode = getPublicAchievementSourceMode();

  if (sourceMode === 'mock') {
    const validMock = mockAchievements
      .map((m) => validateAchievement(m, m.slug))
      .filter((a): a is Achievement => a !== null && a.status === 'published');

    const now = Date.now();
    const validPublished = validMock.filter((a) => {
      if (!a.publishedAt) return true; // mock items without timestamp are visible
      const pTime = Date.parse(a.publishedAt);
      return isNaN(pTime) || pTime <= now;
    });

    const featured = validPublished.find((a) => a.featured) || validPublished[0] || null;
    const latest = validPublished
      .filter((a) => a.slug !== featured?.slug)
      .slice(0, 3);

    onUpdate({
      featuredAchievement: featured ? toPublicAchievement(featured) : null,
      latestAchievements: latest.map(toPublicAchievement),
      loading: false,
      isEmpty: !featured && latest.length === 0,
      error: null,
    });
    return () => {};
  }

  // Firestore mode
  let featuredDoc: Achievement | null = null;
  let latestDocs: Achievement[] = [];
  let featuredLoaded = false;
  let latestLoaded = false;
  let currentError: AchievementServiceError | null = null;
  let unsubFeatured: (() => void) | null = null;
  let unsubLatest: (() => void) | null = null;

  const emit = () => {
    const now = Date.now();
    const isValidPublic = (a: Achievement | null): a is Achievement => {
      if (!a) return false;
      if (a.status !== 'published') return false;
      if (!a.publishedAt) return false;
      const pTime = Date.parse(a.publishedAt);
      return !isNaN(pTime) && pTime <= now;
    };

    const validFeatured = isValidPublic(featuredDoc) ? toPublicAchievement(featuredDoc) : null;
    const validLatest = latestDocs.filter(isValidPublic).map(toPublicAchievement);

    onUpdate({
      featuredAchievement: validFeatured,
      latestAchievements: validLatest.slice(0, 3),
      loading: !(featuredLoaded && latestLoaded),
      isEmpty: featuredLoaded && latestLoaded && !validFeatured && validLatest.length === 0,
      error: currentError,
    });
  };

  const setupFeaturedFallback = () => {
    const fallbackQuery = query(
      collection(db, ACHIEVEMENTS_COLLECTION),
      where('status', '==', 'published')
    );
    unsubFeatured = onSnapshot(
      fallbackQuery,
      (snap) => {
        featuredLoaded = true;
        const nowMs = Date.now();
        const achievements = snap.docs
          .map((d) => validateAchievement(d.data(), d.id))
          .filter((a): a is Achievement => {
            if (!a || a.status !== 'published' || !a.publishedAt) return false;
            const p = parseTimestampMillis(a.publishedAt);
            return p !== null && p <= nowMs && a.featured === true;
          })
          .sort((a, b) => {
            const pA = parseTimestampMillis(a.publishedAt) || 0;
            const pB = parseTimestampMillis(b.publishedAt) || 0;
            return pB - pA;
          });
        featuredDoc = achievements[0] || null;
        emit();
      },
      (err) => {
        featuredLoaded = true;
        currentError = parseFirestoreError(err);
        emit();
      }
    );
  };

  const setupLatestFallback = () => {
    const fallbackQuery = query(
      collection(db, ACHIEVEMENTS_COLLECTION),
      where('status', '==', 'published')
    );
    unsubLatest = onSnapshot(
      fallbackQuery,
      (snap) => {
        latestLoaded = true;
        const nowMs = Date.now();
        const achievements = snap.docs
          .map((d) => validateAchievement(d.data(), d.id))
          .filter((a): a is Achievement => {
            if (!a || a.status !== 'published' || !a.publishedAt) return false;
            const p = parseTimestampMillis(a.publishedAt);
            return p !== null && p <= nowMs;
          })
          .sort((a, b) => {
            const pA = parseTimestampMillis(a.publishedAt) || 0;
            const pB = parseTimestampMillis(b.publishedAt) || 0;
            return pB - pA;
          });
        latestDocs = achievements.slice(0, 4);
        emit();
      },
      (err) => {
        latestLoaded = true;
        currentError = parseFirestoreError(err);
        emit();
      }
    );
  };

  const featuredQuery = query(
    collection(db, ACHIEVEMENTS_COLLECTION),
    where('status', '==', 'published'),
    where('featured', '==', true),
    orderBy('publishedAt', 'desc'),
    limit(1)
  );

  const latestQuery = query(
    collection(db, ACHIEVEMENTS_COLLECTION),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    limit(4)
  );

  unsubFeatured = onSnapshot(
    featuredQuery,
    (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        featuredDoc = validateAchievement(docSnap.data(), docSnap.id);
      } else {
        featuredDoc = null;
      }
      featuredLoaded = true;
      emit();
    },
    (err) => {
      reportMissingIndexError('subscribeToHomepageAchievements.featured', err);
      setupFeaturedFallback();
    }
  );

  unsubLatest = onSnapshot(
    latestQuery,
    (snap) => {
      latestDocs = snap.docs
        .map((docSnap) => validateAchievement(docSnap.data(), docSnap.id))
        .filter((a): a is Achievement => a !== null);
      latestLoaded = true;
      emit();
    },
    (err) => {
      reportMissingIndexError('subscribeToHomepageAchievements.latest', err);
      setupLatestFallback();
    }
  );

  return () => {
    if (unsubFeatured) unsubFeatured();
    if (unsubLatest) unsubLatest();
  };
}

/**
 * Direct document get for a published achievement by slug.
 * Returns null if record is missing, non-published, or scheduled in the future.
 */
export async function getPublishedAchievementBySlug(slug: string): Promise<PublicAchievement | null> {
  const cleanSlug = (slug || '').trim().toLowerCase();
  const slugCheck = validateSlug(cleanSlug);
  if (!slugCheck.valid) return null;

  const sourceMode = getPublicAchievementSourceMode();

  if (sourceMode === 'mock') {
    const rawMock = mockAchievements.find((a) => a.slug === cleanSlug);
    if (!rawMock) return null;
    const validated = validateAchievement(rawMock, cleanSlug);
    if (!validated) return null;
    if (validated.status !== 'published') return null;
    if (validated.publishedAt) {
      const pTime = Date.parse(validated.publishedAt);
      if (!isNaN(pTime) && pTime > Date.now()) return null;
    }
    return toPublicAchievement(validated);
  }

  try {
    const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    const validated = validateAchievement(data, snap.id);
    if (!validated) return null;

    if (validated.status !== 'published') return null;
    if (!validated.publishedAt) return null;

    const pTime = Date.parse(validated.publishedAt);
    if (isNaN(pTime) || pTime > Date.now()) return null;

    return toPublicAchievement(validated);
  } catch (error: any) {
    console.error('[achievementService] Error getting published achievement by slug:', error);
    return null;
  }
}

/**
 * Fetch list of published achievements (public view).
 */
export async function getPublishedAchievements(
  filter?: AchievementFilterOptions
): Promise<PublicAchievement[]> {
  const sourceMode = getPublicAchievementSourceMode();

  if (sourceMode === 'mock') {
    let result = mockAchievements
      .map((m) => validateAchievement(m, m.slug))
      .filter((a): a is Achievement => a !== null && a.status === 'published');

    if (filter?.category && filter.category !== 'all') {
      result = result.filter((a) => a.category === filter.category);
    }
    if (filter?.searchQuery?.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.title.om.toLowerCase().includes(q) ||
          a.title.en.toLowerCase().includes(q) ||
          a.summary.om.toLowerCase().includes(q)
      );
    }
    return result.map(toPublicAchievement);
  }

  try {
    let q = query(
      collection(db, ACHIEVEMENTS_COLLECTION),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );

    if (filter?.category && filter.category !== 'all') {
      q = query(
        collection(db, ACHIEVEMENTS_COLLECTION),
        where('status', '==', 'published'),
        where('category', '==', filter.category),
        orderBy('publishedAt', 'desc')
      );
    }

    const snap = await getDocs(q);
    const now = Date.now();

    const validDocs = snap.docs
      .map((docSnap) => validateAchievement(docSnap.data(), docSnap.id))
      .filter((a): a is Achievement => {
        if (!a) return false;
        if (a.status !== 'published') return false;
        if (!a.publishedAt) return false;
        const pTime = Date.parse(a.publishedAt);
        return !isNaN(pTime) && pTime <= now;
      });

    return validDocs.map(toPublicAchievement);
  } catch (error: any) {
    reportMissingIndexError('getPublishedAchievements', error);
    try {
      const colRef = collection(db, ACHIEVEMENTS_COLLECTION);
      const fallbackConstraints: any[] = [where('status', '==', 'published')];
      if (filter?.category && filter.category !== 'all') {
        fallbackConstraints.push(where('category', '==', filter.category));
      }
      const fallbackQuery = query(colRef, ...fallbackConstraints);
      const snap = await getDocs(fallbackQuery);
      const now = Date.now();

      const validDocs = snap.docs
        .map((docSnap) => validateAchievement(docSnap.data(), docSnap.id))
        .filter((a): a is Achievement => {
          if (!a) return false;
          if (a.status !== 'published') return false;
          if (!a.publishedAt) return false;
          const pTime = Date.parse(a.publishedAt);
          return !isNaN(pTime) && pTime <= now;
        })
        .sort((a, b) => {
          const pA = Date.parse(a.publishedAt) || 0;
          const pB = Date.parse(b.publishedAt) || 0;
          return pB - pA;
        });

      return validDocs.map(toPublicAchievement);
    } catch (fallbackErr: any) {
      throw parseFirestoreError(fallbackErr);
    }
  }
}

function parseTimestampMillis(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const p = Date.parse(val);
    return isNaN(p) ? 0 : p;
  }
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.seconds === 'number') return val.seconds * 1000;
  return 0;
}

/**
  * Helper to build constraints for Firestore admin achievement queries.
  * Ensures 'all' is never passed directly as a status or category equality constraint.
  */
export function buildAdminAchievementQuery(
  filters: AchievementFilterOptions
): any[] {
  const constraints: any[] = [];

  if (filters.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status));
  }

  if (filters.category && filters.category !== 'all') {
    constraints.push(where('category', '==', filters.category));
  }

  if (filters.featuredOnly) {
    constraints.push(where('featured', '==', true));
  }

  constraints.push(orderBy('updatedAt', 'desc'));

  return constraints;
}

export interface AdminAchievementPaginatedResult {
  achievements: Achievement[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
  totalCount: number;
}

/**
 * Fetch admin achievements with cursor pagination, count aggregation and filters.
 */
export async function getAdminAchievementsPaginated(
  filters: AchievementFilterOptions,
  pageSize: number = 20,
  startAfterDoc?: QueryDocumentSnapshot | null,
  pageNumber: number = 1
): Promise<AdminAchievementPaginatedResult> {
  const sourceMode = getPublicAchievementSourceMode();

  const status = filters.status && filters.status !== 'all' ? filters.status : undefined;
  const category = filters.category && filters.category !== 'all' ? filters.category : undefined;
  const searchQuery = (filters.searchQuery || '').trim().toLowerCase();

  const matchesFilterAndSearch = (a: Achievement): boolean => {
    if (status && a.status !== status) return false;
    if (category && a.category !== category) return false;

    if (searchQuery) {
      const titleOm = (a.title?.om || '').toLowerCase();
      const titleAm = (a.title?.am || '').toLowerCase();
      const titleEn = (a.title?.en || '').toLowerCase();
      const slug = (a.slug || '').toLowerCase();
      const summaryOm = (a.summary?.om || '').toLowerCase();
      const summaryAm = (a.summary?.am || '').toLowerCase();
      const summaryEn = (a.summary?.en || '').toLowerCase();
      const officeOm = (a.responsibleOffice?.om || '').toLowerCase();
      const officeAm = (a.responsibleOffice?.am || '').toLowerCase();
      const officeEn = (a.responsibleOffice?.en || '').toLowerCase();
      const createdByEmail = (a.createdByEmail || '').toLowerCase();
      const createdByName = (a.createdByName || '').toLowerCase();
      const tags = Array.isArray(a.tags) ? a.tags.join(' ').toLowerCase() : '';

      const isMatch =
        titleOm.includes(searchQuery) ||
        titleAm.includes(searchQuery) ||
        titleEn.includes(searchQuery) ||
        slug.includes(searchQuery) ||
        summaryOm.includes(searchQuery) ||
        summaryAm.includes(searchQuery) ||
        summaryEn.includes(searchQuery) ||
        officeOm.includes(searchQuery) ||
        officeAm.includes(searchQuery) ||
        officeEn.includes(searchQuery) ||
        createdByEmail.includes(searchQuery) ||
        createdByName.includes(searchQuery) ||
        tags.includes(searchQuery);

      if (!isMatch) return false;
    }

    return true;
  };

  const sortAchievements = (list: Achievement[]): Achievement[] => {
    return list.sort((a, b) => {
      const timeA = parseTimestampMillis(a.updatedAt) || parseTimestampMillis(a.createdAt) || 0;
      const timeB = parseTimestampMillis(b.updatedAt) || parseTimestampMillis(b.createdAt) || 0;
      return timeB - timeA;
    });
  };

  if (sourceMode === 'mock') {
    let mockList = mockAchievements
      .map((m) => validateAchievement(m, m.slug))
      .filter((a): a is Achievement => a !== null)
      .filter(matchesFilterAndSearch);

    mockList = sortAchievements(mockList);

    const totalCount = mockList.length;
    const offset = (pageNumber - 1) * pageSize;
    const paginated = mockList.slice(offset, offset + pageSize);

    return {
      achievements: paginated,
      lastDoc: null,
      hasMore: totalCount > offset + pageSize,
      totalCount,
    };
  }

  try {
    const colRef = collection(db, ACHIEVEMENTS_COLLECTION);
    const baseConstraints: any[] = [];

    if (status) {
      baseConstraints.push(where('status', '==', status));
    }
    if (category) {
      baseConstraints.push(where('category', '==', category));
    }

    if (!searchQuery) {
      let pageQuery: any;
      if (startAfterDoc) {
        pageQuery = query(
          colRef,
          ...baseConstraints,
          orderBy('updatedAt', 'desc'),
          startAfter(startAfterDoc),
          limit(pageSize)
        );
      } else {
        pageQuery = query(
          colRef,
          ...baseConstraints,
          orderBy('updatedAt', 'desc'),
          limit(pageSize)
        );
      }

      const countQuery = query(colRef, ...baseConstraints);
      const countSnap = await getCountFromServer(countQuery);
      const totalCount = countSnap.data().count;

      const snap = await getDocs(pageQuery);
      const achievements: Achievement[] = snap.docs
        .map((docSnap) => validateAchievement(docSnap.data(), docSnap.id))
        .filter((a): a is Achievement => a !== null);

      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      const hasMore = snap.docs.length === pageSize;

      return {
        achievements,
        lastDoc,
        hasMore,
        totalCount,
      };
    }

    // Client-side text filtering fallback
    const qSnap = await getDocs(colRef);
    let allAchievements: Achievement[] = qSnap.docs
      .map((docSnap) => validateAchievement(docSnap.data(), docSnap.id))
      .filter((a): a is Achievement => a !== null)
      .filter(matchesFilterAndSearch);

    allAchievements = sortAchievements(allAchievements);

    const totalCount = allAchievements.length;
    const offset = (pageNumber - 1) * pageSize;
    const paginated = allAchievements.slice(offset, offset + pageSize);

    return {
      achievements: paginated,
      lastDoc: null,
      hasMore: totalCount > offset + pageSize,
      totalCount,
    };
  } catch (error: any) {
    reportMissingIndexError('getAdminAchievementsPaginated', error);
    try {
      const colRef = collection(db, ACHIEVEMENTS_COLLECTION);
      const qSnap = await getDocs(colRef);
      let allAchievements: Achievement[] = qSnap.docs
        .map((docSnap) => validateAchievement(docSnap.data(), docSnap.id))
        .filter((a): a is Achievement => a !== null)
        .filter(matchesFilterAndSearch);

      allAchievements = sortAchievements(allAchievements);

      const totalCount = allAchievements.length;
      const offset = (pageNumber - 1) * pageSize;
      const paginated = allAchievements.slice(offset, offset + pageSize);

      return {
        achievements: paginated,
        lastDoc: null,
        hasMore: totalCount > offset + pageSize,
        totalCount,
      };
    } catch (fallbackErr: any) {
      throw parseFirestoreError(fallbackErr);
    }
  }
}

/**
 * Paginated public achievements list.
 */
export async function getPublishedAchievementsPaginated(
  filter?: AchievementFilterOptions,
  limitCount = 10,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ achievements: PublicAchievement[]; lastDocSnapshot: QueryDocumentSnapshot | null; hasMore: boolean }> {
  const sourceMode = getPublicAchievementSourceMode();

  if (sourceMode === 'mock') {
    const all = await getPublishedAchievements(filter);
    return {
      achievements: all.slice(0, limitCount),
      lastDocSnapshot: null,
      hasMore: all.length > limitCount,
    };
  }

  try {
    let qConstraints: any[] = [
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
    ];

    if (filter?.category && filter.category !== 'all') {
      qConstraints = [
        where('status', '==', 'published'),
        where('category', '==', filter.category),
        orderBy('publishedAt', 'desc'),
      ];
    }

    if (lastDoc) {
      qConstraints.push(startAfter(lastDoc));
    }
    qConstraints.push(limit(limitCount + 1));

    const q = query(collection(db, ACHIEVEMENTS_COLLECTION), ...qConstraints);
    const snap = await getDocs(q);

    const docs = snap.docs;
    const hasMore = docs.length > limitCount;
    const resultDocs = hasMore ? docs.slice(0, limitCount) : docs;

    const now = Date.now();
    const achievements = resultDocs
      .map((docSnap) => validateAchievement(docSnap.data(), docSnap.id))
      .filter((a): a is Achievement => {
        if (!a) return false;
        if (a.status !== 'published') return false;
        if (!a.publishedAt) return false;
        const pTime = Date.parse(a.publishedAt);
        return !isNaN(pTime) && pTime <= now;
      })
      .map(toPublicAchievement);

    const lastSnap = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

    return {
      achievements,
      lastDocSnapshot: lastSnap,
      hasMore,
    };
  } catch (error: any) {
    reportMissingIndexError('getPublishedAchievementsPaginated', error);
    try {
      const colRef = collection(db, ACHIEVEMENTS_COLLECTION);
      const fallbackConstraints: any[] = [where('status', '==', 'published')];
      if (filter?.category && filter.category !== 'all') {
        fallbackConstraints.push(where('category', '==', filter.category));
      }
      const fallbackQuery = query(colRef, ...fallbackConstraints);
      const snap = await getDocs(fallbackQuery);
      const now = Date.now();

      let validDocs = snap.docs
        .map((docSnap) => validateAchievement(docSnap.data(), docSnap.id))
        .filter((a): a is Achievement => {
          if (!a || a.status !== 'published' || !a.publishedAt) return false;
          const pTime = Date.parse(a.publishedAt);
          return !isNaN(pTime) && pTime <= now;
        })
        .sort((a, b) => {
          const pA = Date.parse(a.publishedAt) || 0;
          const pB = Date.parse(b.publishedAt) || 0;
          return pB - pA;
        });

      if (filter?.searchQuery) {
        const sq = filter.searchQuery.toLowerCase();
        validDocs = validDocs.filter((a) => {
          const tOm = (a.title.om || '').toLowerCase();
          const tEn = (a.title.en || '').toLowerCase();
          const tAm = (a.title.am || '').toLowerCase();
          const sOm = (a.summary.om || '').toLowerCase();
          return tOm.includes(sq) || tEn.includes(sq) || tAm.includes(sq) || sOm.includes(sq);
        });
      }

      const hasMore = validDocs.length > limitCount;
      const paginatedDocs = validDocs.slice(0, limitCount);

      return {
        achievements: paginatedDocs.map(toPublicAchievement),
        lastDocSnapshot: null,
        hasMore,
      };
    } catch (fallbackErr: any) {
      throw parseFirestoreError(fallbackErr);
    }
  }
}

/**
 * Admin direct lookup by slug. Active staff can view any status.
 */
export async function getAchievementBySlugForAdmin(
  slug: string,
  staffUser?: StaffUser
): Promise<Achievement | null> {
  const cleanSlug = (slug || '').trim().toLowerCase();
  const slugCheck = validateSlug(cleanSlug);
  if (!slugCheck.valid) return null;

  try {
    const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    return validateAchievement(snap.data(), snap.id);
  } catch (error: any) {
    console.error('[achievementService] Error getting achievement by slug for admin:', error);
    throw parseFirestoreError(error);
  }
}

/**
 * Create a new achievement draft in Firestore.
 */
export async function createAchievementDraft(
  input: AchievementInput,
  staffUser: StaffUser
): Promise<{ success: boolean; slug: string; version?: number; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return {
      success: false,
      slug: '',
      code: 'STAFF_INACTIVE',
      error: 'Your staff account is inactive or disabled.',
    };
  }

  if (!hasPermission(staffUser, 'achievement.create')) {
    return {
      success: false,
      slug: input.slug || '',
      code: 'PERMISSION_DENIED',
      error: 'You do not have permission to create achievement records.',
    };
  }

  const slugCheck = validateSlug(input.slug);
  if (!slugCheck.valid) {
    return {
      success: false,
      slug: input.slug,
      code: 'INVALID_SLUG',
      error: slugCheck.error || 'Invalid slug format.',
    };
  }

  const draftVal = validateDraft(input);
  if (!draftVal.valid) {
    return {
      success: false,
      slug: input.slug,
      code: 'VALIDATION_FAILED',
      error: draftVal.errors.join(' '),
    };
  }

  const cleanSlug = input.slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return {
        success: false,
        slug: cleanSlug,
        code: 'SLUG_EXISTS',
        error: `An achievement with the URL slug "${cleanSlug}" already exists in the database.`,
      };
    }

    const newDocData = removeUndefinedFields({
      slug: cleanSlug,
      title: input.title,
      summary: input.summary,
      content: input.content || [],
      category: input.category || 'other',
      tags: input.tags || [],
      featured: Boolean(input.featured),
      achievementDate: input.achievementDate || null,
      responsibleOffice: input.responsibleOffice,
      location: input.location || null,
      metrics: input.metrics || [],
      beforeAfter: input.beforeAfter || null,
      gallery: input.gallery || [],
      featuredImage: input.featuredImage || null,
      featuredImageSource: input.featuredImageSource || 'none',
      featuredImageAssetId: input.featuredImageAssetId || null,
      featuredImageManaged: input.featuredImageManaged || null,
      featuredImageStaging: input.featuredImageStaging || null,
      imageAlt: input.imageAlt,
      imagePosition: input.imagePosition || 'center',
      status: 'draft',
      createdAt: serverTimestamp(),
      createdByUid: activeUid,
      createdByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
      createdByName: staffUser.displayName || 'Staff Member',
      updatedAt: serverTimestamp(),
      updatedByUid: activeUid,
      updatedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
      updatedByName: staffUser.displayName || 'Staff Member',
      version: 1,
    });

    await setDoc(docRef, newDocData);

    const titleLabel = input.title?.en || input.title?.om || input.title?.am || cleanSlug;
    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'achievements',
      action: 'created',
      result: 'success',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore: null,
      versionAfter: 1,
      previousStatus: null,
      newStatus: 'draft',
    });

    return { success: true, slug: cleanSlug, version: 1 };
  } catch (error: any) {
    console.error('[achievementService] Error creating achievement draft:', error);
    const parsed = parseFirestoreError(error);

    await logAuditEvent({
      actorUid: staffUser?.uid || 'unknown',
      actorEmail: staffUser?.email || 'unknown',
      actorDisplayName: staffUser?.displayName || 'Staff Member',
      actorRole: staffUser?.role || 'staff',
      module: 'achievements',
      action: 'created',
      result: error?.message?.includes('Permission') ? 'denied' : 'failed',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      errorCode: parsed.code,
      reason: parsed.message,
    });

    return {
      success: false,
      slug: cleanSlug,
      code: parsed.code,
      error: parsed.message,
    };
  }
}

/**
 * Update an existing achievement draft in Firestore using a transaction.
 */
export async function updateAchievementDraft(
  slug: string,
  input: AchievementInput,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string; version?: number }> {
  if (!staffUser || !staffUser.active) {
    return {
      success: false,
      code: 'STAFF_INACTIVE',
      error: 'Your staff account is inactive or disabled.',
    };
  }

  if (!hasPermission(staffUser, 'achievement.edit')) {
    return {
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'You do not have permission to edit achievements.',
    };
  }

  const slugCheck = validateSlug(slug);
  if (!slugCheck.valid) {
    return { success: false, code: 'INVALID_SLUG', error: 'Invalid achievement slug.' };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);

    let versionBefore = 1;
    let versionAfter = 2;
    let currentStatus: AchievementStatus = 'draft';

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new AchievementServiceError(
          'ACHIEVEMENT_NOT_FOUND',
          `Achievement with slug "${cleanSlug}" was not found.`
        );
      }

      const existingData = snap.data();
      const currentVersion = typeof existingData.version === 'number' ? existingData.version : 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new AchievementServiceError(
          'VERSION_CONFLICT',
          'This achievement was updated by another user or session. Please refresh to load the latest version.'
        );
      }

      if (existingData.status === 'published' && !hasPermission(staffUser, 'achievement.publish')) {
        throw new AchievementServiceError(
          'PERMISSION_DENIED',
          'Editors cannot edit published achievements. Content Administrator authorization is required.'
        );
      }

      if (existingData.status === 'archived' && staffUser.role === 'editor') {
        throw new AchievementServiceError(
          'PERMISSION_DENIED',
          'Editors cannot edit archived achievements.'
        );
      }

      const newVersion = currentVersion + 1;
      versionBefore = currentVersion;
      versionAfter = newVersion;
      currentStatus = existingData.status || 'draft';

      const updateData: Record<string, any> = removeUndefinedFields({
        title: input.title,
        summary: input.summary,
        content: input.content || [],
        category: input.category || 'other',
        tags: input.tags || [],
        featured: Boolean(input.featured),
        achievementDate: input.achievementDate || null,
        responsibleOffice: input.responsibleOffice,
        location: input.location || null,
        metrics: input.metrics || [],
        beforeAfter: input.beforeAfter !== undefined ? input.beforeAfter : (existingData.beforeAfter || null),
        gallery: input.gallery !== undefined ? input.gallery : (existingData.gallery || []),
        featuredImage: input.featuredImage || null,
        featuredImageSource: input.featuredImageSource || existingData.featuredImageSource || 'none',
        featuredImageAssetId: input.featuredImageAssetId || existingData.featuredImageAssetId || null,
        featuredImageManaged: input.featuredImageManaged || existingData.featuredImageManaged || null,
        featuredImageStaging: input.featuredImageStaging !== undefined ? input.featuredImageStaging : (existingData.featuredImageStaging || null),
        imageAlt: input.imageAlt,
        imagePosition: input.imagePosition || 'center',
        updatedAt: serverTimestamp(),
        updatedByUid: activeUid,
        updatedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        updatedByName: staffUser.displayName || 'Staff Member',
        version: newVersion,
      });

      transaction.update(docRef, updateData);
    });

    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'achievements',
      action: 'updated',
      result: 'success',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: input.title?.en || input.title?.om || cleanSlug,
      source: 'dashboard_ui',
      versionBefore,
      versionAfter,
      previousStatus: currentStatus,
      newStatus: currentStatus,
    });

    return { success: true, version: versionAfter };
  } catch (error: any) {
    console.error('[achievementService] Error updating achievement draft:', error);
    const parsed = parseFirestoreError(error);

    await logAuditEvent({
      actorUid: staffUser?.uid || 'unknown',
      actorEmail: staffUser?.email || 'unknown',
      actorDisplayName: staffUser?.displayName || 'Staff Member',
      actorRole: staffUser?.role || 'staff',
      module: 'achievements',
      action: 'updated',
      result: 'failed',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      errorCode: parsed.code,
      reason: parsed.message,
    });

    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Submit achievement for review.
 */
export async function submitAchievementForReview(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string; version?: number }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Staff account inactive.' };
  }

  if (!hasPermission(staffUser, 'achievement.review')) {
    return { success: false, code: 'PERMISSION_DENIED', error: 'Permission denied for review submission.' };
  }

  const cleanSlug = slug.trim().toLowerCase();
  const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    let versionAfter = 1;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new AchievementServiceError('ACHIEVEMENT_NOT_FOUND', 'Achievement not found.');
      }
      const existing = snap.data();
      const currentVersion = existing.version || 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new AchievementServiceError('VERSION_CONFLICT', 'Version conflict.');
      }

      const valRes = validateAchievementForReview(existing);
      if (!valRes.valid) {
        throw new AchievementServiceError(
          'INVALID_ACHIEVEMENT',
          `Review validation failed: ${valRes.errors.join(' ')}`
        );
      }

      versionAfter = currentVersion + 1;

      transaction.update(docRef, removeUndefinedFields({
        status: 'review',
        submittedForReviewByUid: activeUid,
        submittedForReviewByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        submittedForReviewByName: staffUser.displayName || 'Staff Member',
        submittedForReviewAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedByUid: activeUid,
        updatedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        updatedByName: staffUser.displayName || 'Staff Member',
        version: versionAfter,
      }));
    });

    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email || 'staff@oromiaagri.gov.et',
      actorDisplayName: staffUser.displayName || 'Staff Member',
      actorRole: staffUser.role,
      module: 'achievements',
      action: 'submitted_for_review',
      result: 'success',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      versionBefore: expectedVersion || (versionAfter - 1),
      versionAfter,
      previousStatus: 'draft',
      newStatus: 'review',
    });

    return { success: true, version: versionAfter };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Return achievement to draft.
 */
export async function returnAchievementToDraft(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string; version?: number }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Staff account inactive.' };
  }

  const cleanSlug = slug.trim().toLowerCase();
  const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    let versionAfter = 1;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new AchievementServiceError('ACHIEVEMENT_NOT_FOUND', 'Achievement not found.');
      }
      const existing = snap.data();
      const currentVersion = existing.version || 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new AchievementServiceError('VERSION_CONFLICT', 'Version conflict.');
      }

      versionAfter = currentVersion + 1;

      transaction.update(docRef, removeUndefinedFields({
        status: 'draft',
        updatedAt: serverTimestamp(),
        updatedByUid: activeUid,
        updatedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        updatedByName: staffUser.displayName || 'Staff Member',
        version: versionAfter,
      }));
    });

    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email || 'staff@oromiaagri.gov.et',
      actorDisplayName: staffUser.displayName || 'Staff Member',
      actorRole: staffUser.role,
      module: 'achievements',
      action: 'returned_to_draft',
      result: 'success',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      versionAfter,
      previousStatus: 'review',
      newStatus: 'draft',
    });

    return { success: true, version: versionAfter };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Publish an achievement. Strictly reserved for Content Admin or Super Admin.
 */
export async function publishAchievement(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string; version?: number }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Staff account inactive.' };
  }

  if (!hasPermission(staffUser, 'achievement.publish')) {
    return {
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'Only Content Administrators or Super Admins can publish achievements.',
    };
  }

  const cleanSlug = slug.trim().toLowerCase();
  const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    let versionAfter = 1;
    let prevStatus = 'draft';

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new AchievementServiceError('ACHIEVEMENT_NOT_FOUND', 'Achievement not found.');
      }
      const existing = snap.data();
      const currentVersion = existing.version || 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new AchievementServiceError('VERSION_CONFLICT', 'Version conflict.');
      }

      const valRes = validateAchievementForPublishing(existing);
      if (!valRes.valid) {
        throw new AchievementServiceError(
          'PUBLISH_VALIDATION_FAILED',
          `Publishing validation failed: ${valRes.errors.join(' ')}`
        );
      }

      prevStatus = existing.status || 'draft';
      versionAfter = currentVersion + 1;

      transaction.update(docRef, removeUndefinedFields({
        status: 'published',
        publishedAt: serverTimestamp(),
        publishedByUid: activeUid,
        publishedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        publishedByName: staffUser.displayName || 'Staff Member',
        updatedAt: serverTimestamp(),
        updatedByUid: activeUid,
        updatedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        updatedByName: staffUser.displayName || 'Staff Member',
        version: versionAfter,
      }));
    });

    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email || 'staff@oromiaagri.gov.et',
      actorDisplayName: staffUser.displayName || 'Staff Member',
      actorRole: staffUser.role,
      module: 'achievements',
      action: 'published',
      result: 'success',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      versionBefore: expectedVersion || (versionAfter - 1),
      versionAfter,
      previousStatus: prevStatus,
      newStatus: 'published',
    });

    return { success: true, version: versionAfter };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Unpublish an achievement.
 */
export async function unpublishAchievement(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string; version?: number }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Staff account inactive.' };
  }

  if (!hasPermission(staffUser, 'achievement.publish')) {
    return { success: false, code: 'PERMISSION_DENIED', error: 'Permission denied to unpublish.' };
  }

  const cleanSlug = slug.trim().toLowerCase();
  const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    let versionAfter = 1;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new AchievementServiceError('ACHIEVEMENT_NOT_FOUND', 'Achievement not found.');
      }
      const existing = snap.data();
      const currentVersion = existing.version || 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new AchievementServiceError('VERSION_CONFLICT', 'Version conflict.');
      }

      versionAfter = currentVersion + 1;

      transaction.update(docRef, removeUndefinedFields({
        status: 'unpublished',
        unpublishedByUid: activeUid,
        unpublishedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        unpublishedByName: staffUser.displayName || 'Staff Member',
        unpublishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedByUid: activeUid,
        updatedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        updatedByName: staffUser.displayName || 'Staff Member',
        version: versionAfter,
      }));
    });

    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email || 'staff@oromiaagri.gov.et',
      actorDisplayName: staffUser.displayName || 'Staff Member',
      actorRole: staffUser.role,
      module: 'achievements',
      action: 'unpublished',
      result: 'success',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      versionAfter,
      previousStatus: 'published',
      newStatus: 'unpublished',
    });

    return { success: true, version: versionAfter };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Archive an achievement.
 */
export async function archiveAchievement(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string; version?: number }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Staff account inactive.' };
  }

  if (!hasPermission(staffUser, 'achievement.publish') && staffUser.role !== 'contentAdmin' && staffUser.role !== 'superAdmin') {
    return { success: false, code: 'PERMISSION_DENIED', error: 'Permission denied to archive.' };
  }

  const cleanSlug = slug.trim().toLowerCase();
  const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    let versionAfter = 1;
    let prevStatus = 'draft';

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new AchievementServiceError('ACHIEVEMENT_NOT_FOUND', 'Achievement not found.');
      }
      const existing = snap.data();
      const currentVersion = existing.version || 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new AchievementServiceError('VERSION_CONFLICT', 'Version conflict.');
      }

      prevStatus = existing.status || 'draft';
      versionAfter = currentVersion + 1;

      transaction.update(docRef, removeUndefinedFields({
        status: 'archived',
        archivedByUid: activeUid,
        archivedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        archivedByName: staffUser.displayName || 'Staff Member',
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedByUid: activeUid,
        updatedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        updatedByName: staffUser.displayName || 'Staff Member',
        version: versionAfter,
      }));
    });

    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email || 'staff@oromiaagri.gov.et',
      actorDisplayName: staffUser.displayName || 'Staff Member',
      actorRole: staffUser.role,
      module: 'achievements',
      action: 'archived',
      result: 'success',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      versionAfter,
      previousStatus: prevStatus,
      newStatus: 'archived',
    });

    return { success: true, version: versionAfter };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Move achievement to trash.
 */
export async function moveAchievementToTrash(
  slug: string,
  reason: string | undefined,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string; version?: number }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Staff account inactive.' };
  }

  if (!hasPermission(staffUser, 'achievement.trash')) {
    return { success: false, code: 'PERMISSION_DENIED', error: 'Permission denied to trash.' };
  }

  const cleanSlug = slug.trim().toLowerCase();
  const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    let versionAfter = 1;
    let prevStatus = 'draft';

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new AchievementServiceError('ACHIEVEMENT_NOT_FOUND', 'Achievement not found.');
      }
      const existing = snap.data();

      if (existing.status === 'published' && !hasPermission(staffUser, 'achievement.publish')) {
        throw new AchievementServiceError(
          'PERMISSION_DENIED',
          'Editors cannot trash published achievements.'
        );
      }

      const currentVersion = existing.version || 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new AchievementServiceError('VERSION_CONFLICT', 'Version conflict.');
      }

      prevStatus = existing.status || 'draft';
      versionAfter = currentVersion + 1;

      transaction.update(docRef, removeUndefinedFields({
        status: 'trashed',
        statusBeforeTrash: prevStatus,
        trashedByUid: activeUid,
        trashedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        trashedByName: staffUser.displayName || 'Staff Member',
        trashedAt: serverTimestamp(),
        trashReason: reason || 'Moved to trash by user',
        updatedAt: serverTimestamp(),
        updatedByUid: activeUid,
        updatedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        updatedByName: staffUser.displayName || 'Staff Member',
        version: versionAfter,
      }));
    });

    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email || 'staff@oromiaagri.gov.et',
      actorDisplayName: staffUser.displayName || 'Staff Member',
      actorRole: staffUser.role,
      module: 'achievements',
      action: 'moved_to_trash',
      result: 'success',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      versionAfter,
      previousStatus: prevStatus,
      newStatus: 'trashed',
    });

    return { success: true, version: versionAfter };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Restore achievement from trash.
 */
export async function restoreAchievement(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string; version?: number }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Staff account inactive.' };
  }

  if (!hasPermission(staffUser, 'achievement.restore')) {
    return { success: false, code: 'PERMISSION_DENIED', error: 'Permission denied to restore.' };
  }

  const cleanSlug = slug.trim().toLowerCase();
  const docRef = doc(db, ACHIEVEMENTS_COLLECTION, cleanSlug);

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    let versionAfter = 1;
    let restoreTargetStatus: AchievementStatus = 'draft';

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new AchievementServiceError('ACHIEVEMENT_NOT_FOUND', 'Achievement not found.');
      }
      const existing = snap.data();
      const currentVersion = existing.version || 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new AchievementServiceError('VERSION_CONFLICT', 'Version conflict.');
      }

      const prevStatus = existing.statusBeforeTrash || 'draft';
      restoreTargetStatus = prevStatus === 'published' && !hasPermission(staffUser, 'achievement.publish')
        ? 'draft'
        : prevStatus;

      versionAfter = currentVersion + 1;

      transaction.update(docRef, removeUndefinedFields({
        status: restoreTargetStatus,
        statusBeforeTrash: null,
        restoredByUid: activeUid,
        restoredByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        restoredByName: staffUser.displayName || 'Staff Member',
        restoredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedByUid: activeUid,
        updatedByEmail: staffUser.email || 'staff@oromiaagri.gov.et',
        updatedByName: staffUser.displayName || 'Staff Member',
        version: versionAfter,
      }));
    });

    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email || 'staff@oromiaagri.gov.et',
      actorDisplayName: staffUser.displayName || 'Staff Member',
      actorRole: staffUser.role,
      module: 'achievements',
      action: 'restored',
      result: 'success',
      targetType: 'achievement',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      versionAfter,
      previousStatus: 'trashed',
      newStatus: restoreTargetStatus,
    });

    return { success: true, version: versionAfter };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Permanently delete achievement from trash. Strictly reserved for Super Admin via trusted backend endpoint.
 */
export async function permanentlyDeleteAchievement(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active || (staffUser.role !== 'superAdmin' && !hasPermission(staffUser, 'achievement.delete'))) {
    return {
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'Permanent deletion is strictly reserved for Super Administrators.',
    };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    let idToken: string | null = null;
    try {
      if (auth?.currentUser) {
        idToken = await auth.currentUser.getIdToken();
      }
    } catch (_) {}

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const res = await fetch('/api/achievements/delete', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        slug: cleanSlug,
        staffUid: staffUser.uid,
        expectedVersion,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        code: data.code || 'DELETE_FAILED',
        error: data.error || 'Failed to permanently delete achievement.',
      };
    }

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

export const restoreAchievementFromTrash = restoreAchievement;

