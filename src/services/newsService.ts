import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
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
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { StaffUser } from '../types/auth';
import { logAuditEvent } from './auditService';

async function ensureStaffUserRecord(staffUser: StaffUser): Promise<string> {
  if (auth && !auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.warn('[newsService] Anonymous sign-in failed:', err);
    }
  }

  const activeUid = auth?.currentUser?.uid || staffUser.uid;
  if (db && activeUid) {
    try {
      const staffDocRef = doc(db, 'staffUsers', activeUid);
      await setDoc(
        staffDocRef,
        {
          uid: activeUid,
          email: staffUser.email || 'staff@oromiaagri.gov.et',
          displayName: staffUser.displayName || 'Staff Member',
          role: staffUser.role || 'superAdmin',
          active: true,
          preferredLanguage: staffUser.preferredLanguage || 'om',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[newsService] Note setting staff profile document:', err);
    }
  }
  return activeUid;
}
import {
  NewsArticle,
  NewsArticleInput,
  NewsFilterOptions,
  NewsServiceError,
  NewsAuditLog,
  NewsAuditAction,
  NewsStatus,
  parseFirestoreError,
  parseTimestampMillis,
  normalizeTimestampToISO,
  validateDraft,
  validateForReview,
  validateForPublishing,
  validateNewsArticle,
  validateSlug,
} from '../types/news';
import { mockNews } from '../data/mockData';

const NEWS_COLLECTION = 'newsArticles';

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
 * Returns the configured public news data source ('firestore' or 'mock').
 * Strictly respects VITE_PUBLIC_NEWS_SOURCE.
 */
export const getPublicNewsSourceMode = (): 'firestore' | 'mock' => {
  const envSource = (import.meta.env.VITE_PUBLIC_NEWS_SOURCE || '').toLowerCase();
  return envSource === 'mock' ? 'mock' : 'firestore';
};

export interface HomepageNewsData {
  featuredArticle: NewsArticle | null;
  latestArticles: NewsArticle[];
  loading: boolean;
  isEmpty: boolean;
  error: NewsServiceError | null;
}

/**
 * Reusable real-time subscription for homepage News & Announcements.
 * Returns 1 featured article and up to 3 latest articles using onSnapshot.
 */
export function subscribeToHomepageNews(
  onUpdate: (data: HomepageNewsData) => void
): Unsubscribe {
  const sourceMode = getPublicNewsSourceMode();

  if (sourceMode === 'mock') {
    const validMock = mockNews
      .map((m) => validateNewsArticle(m, m.slug))
      .filter((a): a is NewsArticle => a !== null && a.status === 'published');

    const now = Date.now();
    const validPublished = validMock.filter((a) => {
      if (!a.publishedAt) return false;
      const pTime = Date.parse(a.publishedAt);
      return !isNaN(pTime) && pTime <= now;
    });

    const featured = validPublished.find((a) => a.featured) || validPublished[0] || null;
    const latest = validPublished
      .filter((a) => a.slug !== featured?.slug)
      .slice(0, 3);

    onUpdate({
      featuredArticle: featured,
      latestArticles: latest,
      loading: false,
      isEmpty: !featured && latest.length === 0,
      error: null,
    });
    return () => {};
  }

  // Firestore mode: Real-time listeners for featured and latest published news
  let featuredDoc: NewsArticle | null = null;
  let latestDocs: NewsArticle[] = [];
  let featuredLoaded = false;
  let latestLoaded = false;
  let currentError: NewsServiceError | null = null;

  const emit = () => {
    const now = Date.now();
    const isValidPublic = (a: NewsArticle | null): a is NewsArticle => {
      if (!a) return false;
      if (a.status !== 'published') return false;
      if (!a.publishedAt) return false;
      const pTime = Date.parse(a.publishedAt);
      return !isNaN(pTime) && pTime <= now;
    };

    const validFeatured = isValidPublic(featuredDoc) ? featuredDoc : null;
    const validLatest = latestDocs
      .filter((a) => isValidPublic(a) && a.slug !== validFeatured?.slug)
      .slice(0, 3);

    onUpdate({
      featuredArticle: validFeatured,
      latestArticles: validLatest,
      loading: !featuredLoaded || !latestLoaded,
      isEmpty: featuredLoaded && latestLoaded && !validFeatured && validLatest.length === 0,
      error: currentError,
    });
  };

  const colRef = collection(db, NEWS_COLLECTION);
  const nowTs = Timestamp.now();

  let unsubFeatured: Unsubscribe | null = null;
  let unsubLatest: Unsubscribe | null = null;

  const setupFeaturedFallback = () => {
    const fallbackQuery = query(colRef, where('status', '==', 'published'));
    unsubFeatured = onSnapshot(
      fallbackQuery,
      (snap) => {
        featuredLoaded = true;
        const nowMs = Date.now();
        const articles = snap.docs
          .map((d) => validateNewsArticle(d.data(), d.id))
          .filter((a): a is NewsArticle => {
            if (!a || a.status !== 'published' || !a.featured || !a.publishedAt) return false;
            const p = parseTimestampMillis(a.publishedAt);
            return p !== null && p <= nowMs;
          })
          .sort((a, b) => {
            const pA = parseTimestampMillis(a.publishedAt) || 0;
            const pB = parseTimestampMillis(b.publishedAt) || 0;
            return pB - pA;
          });
        featuredDoc = articles[0] || null;
        emit();
      },
      (err) => {
        featuredLoaded = true;
        currentError = parseFirestoreError(err);
        emit();
      }
    );
  };

  const featuredQuery = query(
    colRef,
    where('status', '==', 'published'),
    where('featured', '==', true),
    where('publishedAt', '<=', nowTs),
    orderBy('publishedAt', 'desc'),
    limit(1)
  );

  unsubFeatured = onSnapshot(
    featuredQuery,
    (snap) => {
      featuredLoaded = true;
      const docSnap = snap.docs[0];
      featuredDoc = docSnap ? validateNewsArticle(docSnap.data(), docSnap.id) : null;
      emit();
    },
    (err) => {
      console.warn('[newsService] Homepage featured snapshot error:', err);
      reportMissingIndexError('subscribeToHomepageNews:featuredQuery', err);
      setupFeaturedFallback();
    }
  );

  const setupLatestFallback = () => {
    const fallbackQuery = query(colRef, where('status', '==', 'published'));
    unsubLatest = onSnapshot(
      fallbackQuery,
      (snap) => {
        latestLoaded = true;
        const nowMs = Date.now();
        const articles = snap.docs
          .map((d) => validateNewsArticle(d.data(), d.id))
          .filter((a): a is NewsArticle => {
            if (!a || a.status !== 'published' || !a.publishedAt) return false;
            const p = parseTimestampMillis(a.publishedAt);
            return p !== null && p <= nowMs;
          })
          .sort((a, b) => {
            const pA = parseTimestampMillis(a.publishedAt) || 0;
            const pB = parseTimestampMillis(b.publishedAt) || 0;
            return pB - pA;
          });
        latestDocs = articles.slice(0, 4);
        emit();
      },
      (err) => {
        latestLoaded = true;
        currentError = parseFirestoreError(err);
        emit();
      }
    );
  };

  const latestQuery = query(
    colRef,
    where('status', '==', 'published'),
    where('publishedAt', '<=', nowTs),
    orderBy('publishedAt', 'desc'),
    limit(4)
  );

  unsubLatest = onSnapshot(
    latestQuery,
    (snap) => {
      latestLoaded = true;
      latestDocs = snap.docs
        .map((docSnap) => validateNewsArticle(docSnap.data(), docSnap.id))
        .filter((a): a is NewsArticle => a !== null);
      emit();
    },
    (err) => {
      console.warn('[newsService] Homepage latest snapshot error:', err);
      reportMissingIndexError('subscribeToHomepageNews:latestQuery', err);
      setupLatestFallback();
    }
  );

  return () => {
    if (unsubFeatured) unsubFeatured();
    if (unsubLatest) unsubLatest();
  };
}

/**
 * Real-time subscription for admin news directory.
 */
export function subscribeToAdminNews(
  filters: NewsFilterOptions,
  onUpdate: (articles: NewsArticle[]) => void,
  onError: (err: any) => void
): Unsubscribe {
  try {
    const colRef = collection(db, NEWS_COLLECTION);
    const q = query(colRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        let articles: NewsArticle[] = snapshot.docs
          .map((docSnap) => validateNewsArticle(docSnap.data(), docSnap.id))
          .filter((a): a is NewsArticle => a !== null);

        // Apply filters
        if (filters.status && filters.status !== 'all') {
          articles = articles.filter((a) => a.status === filters.status);
        }
        if (filters.category && filters.category !== 'all') {
          articles = articles.filter((a) => a.category === filters.category);
        }
        if (filters.featured !== undefined) {
          articles = articles.filter((a) => a.featured === filters.featured);
        }
        if (filters.searchQuery && filters.searchQuery.trim()) {
          const qLower = filters.searchQuery.toLowerCase().trim();
          articles = articles.filter((a) => {
            const titleOm = (a.title.om || '').toLowerCase();
            const titleAm = (a.title.am || '').toLowerCase();
            const titleEn = (a.title.en || '').toLowerCase();
            const slug = (a.slug || '').toLowerCase();
            return (
              titleOm.includes(qLower) ||
              titleAm.includes(qLower) ||
              titleEn.includes(qLower) ||
              slug.includes(qLower)
            );
          });
        }

        onUpdate(articles);
      },
      (error) => {
        console.warn('[newsService] Admin news snapshot listener error:', error);
        onError(parseFirestoreError(error));
      }
    );
  } catch (err) {
    console.error('[newsService] Failed to establish admin listener:', err);
    onError(parseFirestoreError(err));
    return () => {};
  }
}

/**
 * Get a single news article by slug for Staff/Admin preview & editing.
 */
export async function getNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const slugCheck = validateSlug(slug);
  if (!slugCheck.valid) return null;

  try {
    const docRef = doc(db, NEWS_COLLECTION, slug.trim());
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return validateNewsArticle(snap.data(), snap.id);
    }
    return null;
  } catch (error) {
    console.warn(`[newsService] Error getting news article by slug (${slug}):`, error);
    throw parseFirestoreError(error);
  }
}

/**
 * Get a single published news article for public viewing.
 * Strictly adheres to VITE_PUBLIC_NEWS_SOURCE. No fallbacks in firestore mode!
 */
export async function getPublishedNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const sourceMode = getPublicNewsSourceMode();

  if (sourceMode === 'mock') {
    const foundMock = mockNews.find((m) => m.slug === slug || m.id === slug);
    if (!foundMock) return null;
    return validateNewsArticle(foundMock, foundMock.slug);
  }

  // Firestore mode: Query ONLY Firestore. NEVER fall back to mock data!
  const slugCheck = validateSlug(slug);
  if (!slugCheck.valid) return null;

  try {
    const cleanSlug = slug.trim().toLowerCase();
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    const rawData = snap.data();

    // Confirm slug matches doc ID
    if (rawData.slug !== snap.id) {
      console.warn(`[newsService] Document ID (${snap.id}) does not match slug field (${rawData.slug})`);
      return null;
    }

    // Confirm status == published
    if (rawData.status !== 'published') {
      return null;
    }

    // Confirm publishedAt is valid and <= current time
    const pTime = parseTimestampMillis(rawData.publishedAt);
    if (pTime === null || pTime > Date.now()) {
      console.warn(`[newsService] Article (${snap.id}) publishedAt timestamp is invalid or in the future`);
      return null;
    }

    const article = validateNewsArticle(rawData, snap.id);
    return article;
  } catch (error) {
    console.warn(`[newsService] Error reading published article (${slug}):`, error);
    reportMissingIndexError(`getPublishedNewsArticleBySlug(${slug})`, error);
    return null;
  }
}

export interface PublicNewsPaginatedResult {
  articles: NewsArticle[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
  totalCount: number;
}

/**
 * Fetch public news articles with cursor-based Firestore pagination and count aggregation.
 */
export async function getPublicNewsArticlesPaginated(
  categoryFilter?: string,
  pageSize: number = 9,
  startAfterDoc?: QueryDocumentSnapshot | null
): Promise<PublicNewsPaginatedResult> {
  const sourceMode = getPublicNewsSourceMode();

  if (sourceMode === 'mock') {
    let mockList = mockNews
      .map((m) => validateNewsArticle(m, m.slug))
      .filter((a): a is NewsArticle => a !== null && a.status === 'published');

    if (categoryFilter && categoryFilter !== 'all') {
      mockList = mockList.filter((a) => a.category === categoryFilter);
    }

    const totalCount = mockList.length;
    return {
      articles: mockList.slice(0, pageSize),
      lastDoc: null,
      hasMore: totalCount > pageSize,
      totalCount,
    };
  }

  // Firestore mode
  try {
    const colRef = collection(db, NEWS_COLLECTION);
    const nowTs = Timestamp.now();
    const baseConstraints: any[] = [where('status', '==', 'published')];

    if (categoryFilter && categoryFilter !== 'all') {
      baseConstraints.push(where('category', '==', categoryFilter));
    }

    baseConstraints.push(where('publishedAt', '<=', nowTs));

    // Get total count using Firestore count aggregation
    const countQuery = query(colRef, ...baseConstraints);
    const countSnap = await getCountFromServer(countQuery);
    const totalCount = countSnap.data().count;

    // Page query
    let pageQuery: any;
    if (startAfterDoc) {
      pageQuery = query(
        colRef,
        ...baseConstraints,
        orderBy('publishedAt', 'desc'),
        startAfter(startAfterDoc),
        limit(pageSize)
      );
    } else {
      pageQuery = query(
        colRef,
        ...baseConstraints,
        orderBy('publishedAt', 'desc'),
        limit(pageSize)
      );
    }

    const snap = await getDocs(pageQuery);
    const nowMs = Date.now();
    const articles: NewsArticle[] = [];

    snap.docs.forEach((docSnap) => {
      const art = validateNewsArticle(docSnap.data(), docSnap.id);
      if (art && art.status === 'published' && art.publishedAt) {
        const pTime = parseTimestampMillis(art.publishedAt);
        if (pTime !== null && pTime <= nowMs) {
          articles.push(art);
        }
      }
    });

    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    const hasMore = snap.docs.length === pageSize;

    return {
      articles,
      lastDoc,
      hasMore,
      totalCount,
    };
  } catch (error) {
    console.warn('[newsService] Error querying paginated public news:', error);
    reportMissingIndexError('getPublicNewsArticlesPaginated', error);

    // Fallback if index missing or precondition failed
    try {
      const colRef = collection(db, NEWS_COLLECTION);
      const fallbackConstraints: any[] = [where('status', '==', 'published')];
      if (categoryFilter && categoryFilter !== 'all') {
        fallbackConstraints.push(where('category', '==', categoryFilter));
      }
      const fallbackQuery = query(colRef, ...fallbackConstraints);
      const snap = await getDocs(fallbackQuery);
      const nowMs = Date.now();

      let articles: NewsArticle[] = snap.docs
        .map((docSnap) => validateNewsArticle(docSnap.data(), docSnap.id))
        .filter((a): a is NewsArticle => {
          if (!a || a.status !== 'published' || !a.publishedAt) return false;
          const p = parseTimestampMillis(a.publishedAt);
          return p !== null && p <= nowMs;
        })
        .sort((a, b) => {
          const pA = parseTimestampMillis(a.publishedAt) || 0;
          const pB = parseTimestampMillis(b.publishedAt) || 0;
          return pB - pA;
        });

      const totalCount = articles.length;
      articles = articles.slice(0, pageSize);

      return {
        articles,
        lastDoc: null,
        hasMore: totalCount > pageSize,
        totalCount,
      };
    } catch (fallbackError) {
      console.warn('[newsService] Fallback paginated query failed:', fallbackError);
      return {
        articles: [],
        lastDoc: null,
        hasMore: false,
        totalCount: 0,
      };
    }
  }
}

export interface AdminNewsPaginatedResult {
  articles: NewsArticle[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
  totalCount: number;
}

/**
 * Fetch admin news articles with cursor pagination, count aggregation and filters.
 */
export async function getAdminNewsArticlesPaginated(
  filters: NewsFilterOptions,
  pageSize: number = 20,
  startAfterDoc?: QueryDocumentSnapshot | null,
  pageNumber: number = 1
): Promise<AdminNewsPaginatedResult> {
  const sourceMode = getPublicNewsSourceMode();

  const status = filters.status || 'all';
  const category = filters.category || 'all';
  const searchQuery = (filters.searchQuery || '').trim().toLowerCase();

  const matchesFilterAndSearch = (a: NewsArticle): boolean => {
    if (status !== 'all' && a.status !== status) return false;
    if (category !== 'all' && a.category !== category) return false;

    if (searchQuery) {
      const titleOm = (a.title?.om || '').toLowerCase();
      const titleAm = (a.title?.am || '').toLowerCase();
      const titleEn = (a.title?.en || '').toLowerCase();
      const slug = (a.slug || '').toLowerCase();
      const excerptOm = (a.excerpt?.om || '').toLowerCase();
      const excerptAm = (a.excerpt?.am || '').toLowerCase();
      const excerptEn = (a.excerpt?.en || '').toLowerCase();
      const officeOm = (a.responsibleOffice?.om || '').toLowerCase();
      const officeAm = (a.responsibleOffice?.am || '').toLowerCase();
      const officeEn = (a.responsibleOffice?.en || '').toLowerCase();
      const authorOm = (a.authorName?.om || '').toLowerCase();
      const authorAm = (a.authorName?.am || '').toLowerCase();
      const authorEn = (a.authorName?.en || '').toLowerCase();
      const createdByEmail = (a.createdByEmail || '').toLowerCase();
      const createdByName = (a.createdByName || '').toLowerCase();
      const tags = Array.isArray(a.tags) ? a.tags.join(' ').toLowerCase() : '';

      let contentMatch = false;
      if (Array.isArray(a.content)) {
        for (const block of a.content) {
          if ('content' in block && block.content) {
            const om = (block.content.om || '').toLowerCase();
            const am = (block.content.am || '').toLowerCase();
            const en = (block.content.en || '').toLowerCase();
            if (om.includes(searchQuery) || am.includes(searchQuery) || en.includes(searchQuery)) {
              contentMatch = true;
              break;
            }
          }
        }
      }

      const isMatch =
        titleOm.includes(searchQuery) ||
        titleAm.includes(searchQuery) ||
        titleEn.includes(searchQuery) ||
        slug.includes(searchQuery) ||
        excerptOm.includes(searchQuery) ||
        excerptAm.includes(searchQuery) ||
        excerptEn.includes(searchQuery) ||
        officeOm.includes(searchQuery) ||
        officeAm.includes(searchQuery) ||
        officeEn.includes(searchQuery) ||
        authorOm.includes(searchQuery) ||
        authorAm.includes(searchQuery) ||
        authorEn.includes(searchQuery) ||
        createdByEmail.includes(searchQuery) ||
        createdByName.includes(searchQuery) ||
        tags.includes(searchQuery) ||
        contentMatch;

      if (!isMatch) return false;
    }

    return true;
  };

  const sortArticles = (list: NewsArticle[]): NewsArticle[] => {
    return list.sort((a, b) => {
      const timeA = parseTimestampMillis(a.updatedAt) || parseTimestampMillis(a.createdAt) || 0;
      const timeB = parseTimestampMillis(b.updatedAt) || parseTimestampMillis(b.createdAt) || 0;
      return timeB - timeA;
    });
  };

  if (sourceMode === 'mock') {
    let mockList = mockNews
      .map((m) => validateNewsArticle(m, m.slug))
      .filter((a): a is NewsArticle => a !== null)
      .filter(matchesFilterAndSearch);

    mockList = sortArticles(mockList);

    const totalCount = mockList.length;
    const offset = (pageNumber - 1) * pageSize;
    const paginated = mockList.slice(offset, offset + pageSize);

    return {
      articles: paginated,
      lastDoc: null,
      hasMore: totalCount > offset + pageSize,
      totalCount,
    };
  }

  // Firestore mode
  try {
    const colRef = collection(db, NEWS_COLLECTION);
    const baseConstraints: any[] = [];

    if (status !== 'all') {
      baseConstraints.push(where('status', '==', status));
    }
    if (category !== 'all') {
      baseConstraints.push(where('category', '==', category));
    }

    // Try Firestore indexed query when there's NO text search query
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
      const articles: NewsArticle[] = snap.docs
        .map((docSnap) => validateNewsArticle(docSnap.data(), docSnap.id))
        .filter((a): a is NewsArticle => a !== null);

      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      const hasMore = snap.docs.length === pageSize;

      return {
        articles,
        lastDoc,
        hasMore,
        totalCount,
      };
    }

    // Text search or non-indexed query fallback: Fetch documents & filter in JS
    const qSnap = await getDocs(colRef);
    let allArticles: NewsArticle[] = qSnap.docs
      .map((docSnap) => validateNewsArticle(docSnap.data(), docSnap.id))
      .filter((a): a is NewsArticle => a !== null)
      .filter(matchesFilterAndSearch);

    allArticles = sortArticles(allArticles);

    const totalCount = allArticles.length;
    const offset = (pageNumber - 1) * pageSize;
    const pageArticles = allArticles.slice(offset, offset + pageSize);

    return {
      articles: pageArticles,
      lastDoc: null,
      hasMore: totalCount > offset + pageSize,
      totalCount,
    };
  } catch (error) {
    console.warn('[newsService] Error in getAdminNewsArticlesPaginated, executing in-memory fallback:', error);

    // Fallback: Fetch all documents from Firestore and perform pure client-side filter
    try {
      const colRef = collection(db, NEWS_COLLECTION);
      const snap = await getDocs(colRef);

      let articles: NewsArticle[] = snap.docs
        .map((docSnap) => validateNewsArticle(docSnap.data(), docSnap.id))
        .filter((a): a is NewsArticle => a !== null)
        .filter(matchesFilterAndSearch);

      articles = sortArticles(articles);

      const totalCount = articles.length;
      const offset = (pageNumber - 1) * pageSize;
      const pageArticles = articles.slice(offset, offset + pageSize);

      return {
        articles: pageArticles,
        lastDoc: null,
        hasMore: totalCount > offset + pageSize,
        totalCount,
      };
    } catch (fallbackError) {
      console.warn('[newsService] Fallback admin news query failed:', fallbackError);
      return {
        articles: [],
        lastDoc: null,
        hasMore: false,
        totalCount: 0,
      };
    }
  }
}

/**
 * Fetch all published news articles for the public portal.
 * Strictly adheres to VITE_PUBLIC_NEWS_SOURCE. No fallbacks in firestore mode!
 */
export async function getPublishedNewsArticles(
  categoryFilter?: string
): Promise<NewsArticle[]> {
  const sourceMode = getPublicNewsSourceMode();

  if (sourceMode === 'mock') {
    let mockList = mockNews
      .map((m) => validateNewsArticle(m, m.slug))
      .filter((a): a is NewsArticle => a !== null);
    if (categoryFilter && categoryFilter !== 'all') {
      mockList = mockList.filter((a) => a.category === categoryFilter);
    }
    return mockList;
  }

  // Firestore mode: Query ONLY Firestore. NEVER fall back to mock data!
  try {
    const colRef = collection(db, NEWS_COLLECTION);
    const nowTs = Timestamp.now();
    const baseConstraints: any[] = [where('status', '==', 'published')];
    if (categoryFilter && categoryFilter !== 'all') {
      baseConstraints.push(where('category', '==', categoryFilter));
    }
    baseConstraints.push(
      where('publishedAt', '<=', nowTs),
      orderBy('publishedAt', 'desc')
    );

    const q = query(colRef, ...baseConstraints);
    const snap = await getDocs(q);
    const nowMs = Date.now();

    return snap.docs
      .map((docSnap) => validateNewsArticle(docSnap.data(), docSnap.id))
      .filter((a): a is NewsArticle => {
        if (!a || a.status !== 'published' || !a.publishedAt) return false;
        const pTime = parseTimestampMillis(a.publishedAt);
        return pTime !== null && pTime <= nowMs;
      });
  } catch (error) {
    console.warn('[newsService] Error querying published news articles:', error);
    reportMissingIndexError('getPublishedNewsArticles', error);

    try {
      const colRef = collection(db, NEWS_COLLECTION);
      const fallbackConstraints: any[] = [where('status', '==', 'published')];
      if (categoryFilter && categoryFilter !== 'all') {
        fallbackConstraints.push(where('category', '==', categoryFilter));
      }
      const q = query(colRef, ...fallbackConstraints);
      const snap = await getDocs(q);
      const nowMs = Date.now();

      return snap.docs
        .map((docSnap) => validateNewsArticle(docSnap.data(), docSnap.id))
        .filter((a): a is NewsArticle => {
          if (!a || a.status !== 'published' || !a.publishedAt) return false;
          const pTime = parseTimestampMillis(a.publishedAt);
          return pTime !== null && pTime <= nowMs;
        })
        .sort((a, b) => {
          const pA = parseTimestampMillis(a.publishedAt) || 0;
          const pB = parseTimestampMillis(b.publishedAt) || 0;
          return pB - pA;
        });
    } catch (fallbackError) {
      console.warn('[newsService] Fallback getPublishedNewsArticles failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Create a new news draft article in Firestore (newsArticles/{slug}).
 */
export async function createNewsDraft(
  input: NewsArticleInput,
  staffUser: StaffUser
): Promise<{ success: boolean; slug: string; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return {
      success: false,
      slug: '',
      code: 'STAFF_INACTIVE',
      error: 'Your staff account is inactive or disabled.',
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
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return {
        success: false,
        slug: cleanSlug,
        code: 'SLUG_EXISTS',
        error: `An article with the URL slug "${cleanSlug}" already exists in the database.`,
      };
    }

    const newDocData = {
      slug: cleanSlug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      category: input.category,
      tags: input.tags || [],
      featuredImage: input.featuredImage || '',
      imageAlt: input.imageAlt,
      responsibleOffice: input.responsibleOffice,
      authorName: input.authorName || {
        om: staffUser.displayName,
        am: staffUser.displayName,
        en: staffUser.displayName,
      },
      status: 'draft',
      featured: Boolean(input.featured),
      scheduledFor: input.scheduledFor || null,
      createdAt: serverTimestamp(),
      createdBy: activeUid,
      createdByEmail: staffUser.email,
      createdByName: staffUser.displayName,
      updatedAt: serverTimestamp(),
      updatedBy: activeUid,
      updatedByEmail: staffUser.email,
      updatedByName: staffUser.displayName,
      version: 1,
    };

    await setDoc(docRef, newDocData);

    const titleLabel = input.title?.en || input.title?.om || input.title?.am || cleanSlug;
    await logAuditEvent({
      actorUid: activeUid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'news',
      action: 'created',
      result: 'success',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore: null,
      versionAfter: 1,
      previousStatus: null,
      newStatus: 'draft',
    });

    return { success: true, slug: cleanSlug };
  } catch (error: any) {
    console.error('[newsService] Error creating news draft:', error);
    const parsed = parseFirestoreError(error);

    await logAuditEvent({
      actorUid: staffUser?.uid || 'unknown',
      actorEmail: staffUser?.email || 'unknown',
      actorDisplayName: staffUser?.displayName || 'Staff Member',
      actorRole: staffUser?.role || 'staff',
      module: 'news',
      action: 'created',
      result: error?.message?.includes('Permission') ? 'denied' : 'failed',
      targetType: 'news_article',
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
 * Update an existing news draft in Firestore.
 */
export async function updateNewsDraft(
  slug: string,
  input: NewsArticleInput,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return {
      success: false,
      code: 'STAFF_INACTIVE',
      error: 'Your staff account is inactive or disabled.',
    };
  }

  const slugCheck = validateSlug(slug);
  if (!slugCheck.valid) {
    return { success: false, code: 'INVALID_SLUG', error: 'Invalid article slug.' };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

    let versionBefore = 1;
    let versionAfter = 2;
    let currentStatus = 'draft';

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new NewsServiceError('NEWS_NOT_FOUND', `Article with slug "${cleanSlug}" was not found.`);
      }

      const existingData = snap.data();
      const currentVersion = typeof existingData.version === 'number' ? existingData.version : 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new NewsServiceError(
          'VERSION_CONFLICT',
          'This article was updated by another user or session. Please refresh to load the latest version.'
        );
      }

      // Check Role Policy for editing published articles
      if (existingData.status === 'published' && staffUser.role === 'editor') {
        throw new NewsServiceError(
          'PERMISSION_DENIED',
          'Editors cannot edit published articles. Only Content Administrators or Super Admins can edit published content.'
        );
      }

      if (existingData.status === 'archived' && staffUser.role === 'editor') {
        throw new NewsServiceError(
          'PERMISSION_DENIED',
          'Editors cannot edit archived articles.'
        );
      }

      const newVersion = currentVersion + 1;
      versionBefore = currentVersion;
      versionAfter = newVersion;
      currentStatus = existingData.status || 'draft';

      const updateData: Record<string, any> = {
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        category: input.category,
        tags: input.tags || [],
        featuredImage: input.featuredImage || '',
        imageAlt: input.imageAlt,
        responsibleOffice: input.responsibleOffice,
        authorName: input.authorName || existingData.authorName,
        featured: Boolean(input.featured),
        scheduledFor: input.scheduledFor || null,
        updatedAt: serverTimestamp(),
        updatedBy: activeUid,
        updatedByEmail: staffUser.email,
        updatedByName: staffUser.displayName,
        version: newVersion,
      };

      transaction.update(docRef, updateData);
    });

    const titleLabel = input.title?.en || input.title?.om || input.title?.am || cleanSlug;
    await logAuditEvent({
      actorUid: staffUser.uid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'news',
      action: 'updated',
      result: 'success',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore,
      versionAfter,
      previousStatus: currentStatus,
      newStatus: currentStatus,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[newsService] Error updating news draft:', error);
    const parsed = parseFirestoreError(error);

    await logAuditEvent({
      actorUid: staffUser?.uid || 'unknown',
      actorEmail: staffUser?.email || 'unknown',
      actorDisplayName: staffUser?.displayName || 'Staff Member',
      actorRole: staffUser?.role || 'staff',
      module: 'news',
      action: 'updated',
      result: error?.message?.includes('PERMISSION_DENIED') ? 'denied' : 'failed',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: cleanSlug,
      source: 'dashboard_ui',
      errorCode: parsed.code,
      reason: parsed.message,
    });

    return {
      success: false,
      code: parsed.code,
      error: parsed.message,
    };
  }
}

/**
 * Submit news draft for review (status = 'review').
 */
export async function submitNewsForReview(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive.' };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

    let versionBefore = 1;
    let versionAfter = 2;
    let titleLabel = cleanSlug;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new NewsServiceError('NEWS_NOT_FOUND', 'Article not found.');
      }

      const existingData = snap.data();
      const currentVersion = typeof existingData.version === 'number' ? existingData.version : 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new NewsServiceError('VERSION_CONFLICT', 'Article version conflict. Refresh and retry.');
      }

      if (existingData.status !== 'draft') {
        throw new NewsServiceError(
          'INVALID_TRANSITION',
          `Cannot submit article for review from current status "${existingData.status}".`
        );
      }

      const article = validateNewsArticle(existingData, cleanSlug);
      if (!article) {
        throw new NewsServiceError('VALIDATION_FAILED', 'Malformed article data.');
      }

      const val = validateForReview(article);
      if (!val.valid) {
        throw new NewsServiceError('VALIDATION_FAILED', `Validation failed: ${val.errors.join(' ')}`);
      }

      const newVersion = currentVersion + 1;
      versionBefore = currentVersion;
      versionAfter = newVersion;
      titleLabel = existingData.title?.en || existingData.title?.om || existingData.title?.am || cleanSlug;

      transaction.update(docRef, {
        status: 'review',
        submittedForReviewByUid: activeUid,
        submittedForReviewByEmail: staffUser.email,
        submittedForReviewByName: staffUser.displayName,
        submittedForReviewAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: activeUid,
        updatedByEmail: staffUser.email,
        updatedByName: staffUser.displayName,
        version: newVersion,
      });
    });

    await logAuditEvent({
      actorUid: staffUser.uid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'news',
      action: 'submitted_for_review',
      result: 'success',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore,
      versionAfter,
      previousStatus: 'draft',
      newStatus: 'review',
    });

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    await logAuditEvent({
      actorUid: staffUser?.uid || 'unknown',
      actorEmail: staffUser?.email || 'unknown',
      actorDisplayName: staffUser?.displayName || 'Staff Member',
      actorRole: staffUser?.role || 'staff',
      module: 'news',
      action: 'submitted_for_review',
      result: 'failed',
      targetType: 'news_article',
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
 * Return news article to draft status (status = 'draft').
 */
export async function returnNewsToDraft(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive.' };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

    let versionBefore = 1;
    let versionAfter = 2;
    let previousStatus = 'review';
    let titleLabel = cleanSlug;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new NewsServiceError('NEWS_NOT_FOUND', 'Article not found.');
      }

      const existingData = snap.data();
      const currentVersion = typeof existingData.version === 'number' ? existingData.version : 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new NewsServiceError('VERSION_CONFLICT', 'Article version conflict. Refresh and retry.');
      }

      previousStatus = existingData.status || 'review';
      const newVersion = currentVersion + 1;
      versionBefore = currentVersion;
      versionAfter = newVersion;
      titleLabel = existingData.title?.en || existingData.title?.om || existingData.title?.am || cleanSlug;

      transaction.update(docRef, {
        status: 'draft',
        updatedAt: serverTimestamp(),
        updatedBy: activeUid,
        updatedByEmail: staffUser.email,
        updatedByName: staffUser.displayName,
        version: newVersion,
      });
    });

    await logAuditEvent({
      actorUid: staffUser.uid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'news',
      action: 'returned_to_draft',
      result: 'success',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore,
      versionAfter,
      previousStatus,
      newStatus: 'draft',
    });

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Publish news article (status = 'published').
 */
export async function publishNewsArticle(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive.' };
  }

  // Require Content Admin or Super Admin to publish
  if (staffUser.role !== 'contentAdmin' && staffUser.role !== 'superAdmin') {
    return {
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'Only Content Administrators or Super Admins can publish articles.',
    };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

    let versionBefore = 1;
    let versionAfter = 2;
    let previousStatus = 'review';
    let titleLabel = cleanSlug;
    let isRepublish = false;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new NewsServiceError('NEWS_NOT_FOUND', 'Article not found in database.');
      }

      const existingData = snap.data();
      const currentVersion = typeof existingData.version === 'number' ? existingData.version : 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new NewsServiceError('VERSION_CONFLICT', 'Article version conflict. Refresh and retry.');
      }

      const article = validateNewsArticle(existingData, cleanSlug);
      if (!article) {
        throw new NewsServiceError('VALIDATION_FAILED', 'Malformed article data.');
      }

      const val = validateForPublishing(article);
      if (!val.valid) {
        throw new NewsServiceError('VALIDATION_FAILED', `Cannot publish article: ${val.errors.join(' ')}`);
      }

      const isFirstPublish = !existingData.publishedAt;
      isRepublish = !isFirstPublish && existingData.status === 'unpublished';
      previousStatus = existingData.status || 'review';

      const newVersion = currentVersion + 1;
      versionBefore = currentVersion;
      versionAfter = newVersion;
      titleLabel = existingData.title?.en || existingData.title?.om || existingData.title?.am || cleanSlug;

      const updateFields: Record<string, any> = {
        status: 'published',
        publishedBy: activeUid,
        publishedByEmail: staffUser.email,
        publishedByName: staffUser.displayName,
        updatedAt: serverTimestamp(),
        updatedBy: activeUid,
        updatedByEmail: staffUser.email,
        updatedByName: staffUser.displayName,
        version: newVersion,
      };

      if (isFirstPublish) {
        updateFields.publishedAt = serverTimestamp();
      } else {
        updateFields.republishedAt = serverTimestamp();
      }

      transaction.update(docRef, updateFields);
    });

    await logAuditEvent({
      actorUid: staffUser.uid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'news',
      action: isRepublish ? 'republished' : 'published',
      result: 'success',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore,
      versionAfter,
      previousStatus,
      newStatus: 'published',
    });

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Unpublish news article (status = 'unpublished').
 */
export async function unpublishNewsArticle(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive.' };
  }

  if (staffUser.role !== 'contentAdmin' && staffUser.role !== 'superAdmin') {
    return {
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'Only Content Administrators or Super Admins can unpublish articles.',
    };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

    let versionBefore = 1;
    let versionAfter = 2;
    let titleLabel = cleanSlug;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new NewsServiceError('NEWS_NOT_FOUND', 'Article not found.');
      }

      const existingData = snap.data();
      const currentVersion = typeof existingData.version === 'number' ? existingData.version : 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new NewsServiceError('VERSION_CONFLICT', 'Article version conflict. Refresh and retry.');
      }

      const newVersion = currentVersion + 1;
      versionBefore = currentVersion;
      versionAfter = newVersion;
      titleLabel = existingData.title?.en || existingData.title?.om || existingData.title?.am || cleanSlug;

      transaction.update(docRef, {
        status: 'unpublished',
        unpublishedByUid: activeUid,
        unpublishedByEmail: staffUser.email,
        unpublishedByName: staffUser.displayName,
        unpublishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: activeUid,
        updatedByEmail: staffUser.email,
        updatedByName: staffUser.displayName,
        version: newVersion,
      });
    });

    await logAuditEvent({
      actorUid: staffUser.uid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'news',
      action: 'unpublished',
      result: 'success',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore,
      versionAfter,
      previousStatus: 'published',
      newStatus: 'unpublished',
    });

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Archive news article (status = 'archived').
 */
export async function archiveNewsArticle(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive.' };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

    let versionBefore = 1;
    let versionAfter = 2;
    let previousStatus = 'published';
    let titleLabel = cleanSlug;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new NewsServiceError('NEWS_NOT_FOUND', 'Article not found.');
      }

      const existingData = snap.data();
      const currentVersion = typeof existingData.version === 'number' ? existingData.version : 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new NewsServiceError('VERSION_CONFLICT', 'Article version conflict. Refresh and retry.');
      }

      // Check role policy for published articles
      if (existingData.status === 'published' && staffUser.role === 'editor') {
        throw new NewsServiceError(
          'PERMISSION_DENIED',
          'Editors cannot archive published articles. Content Administrator required.'
        );
      }

      previousStatus = existingData.status || 'published';
      const newVersion = currentVersion + 1;
      versionBefore = currentVersion;
      versionAfter = newVersion;
      titleLabel = existingData.title?.en || existingData.title?.om || existingData.title?.am || cleanSlug;

      transaction.update(docRef, {
        status: 'archived',
        archivedByUid: activeUid,
        archivedByEmail: staffUser.email,
        archivedByName: staffUser.displayName,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: activeUid,
        updatedByEmail: staffUser.email,
        updatedByName: staffUser.displayName,
        version: newVersion,
      });
    });

    await logAuditEvent({
      actorUid: staffUser.uid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'news',
      action: 'archived',
      result: 'success',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore,
      versionAfter,
      previousStatus,
      newStatus: 'archived',
    });

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Move news article to trash (soft delete).
 */
export async function moveNewsToTrash(
  slug: string,
  staffUser: StaffUser,
  reason?: string,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive.' };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

    let versionBefore = 1;
    let versionAfter = 2;
    let previousStatus = 'draft';
    let titleLabel = cleanSlug;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new NewsServiceError('NEWS_NOT_FOUND', `Article with slug "${cleanSlug}" was not found.`);
      }

      const existingData = snap.data();
      const currentVersion = typeof existingData.version === 'number' ? existingData.version : 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new NewsServiceError('VERSION_CONFLICT', 'Article version conflict. Refresh and retry.');
      }

      if (existingData.status === 'trashed') {
        throw new NewsServiceError('ALREADY_TRASHED', 'Article is already in trash.');
      }

      // Check role permissions: if published -> requires contentAdmin or superAdmin
      if (existingData.status === 'published' && staffUser.role !== 'contentAdmin' && staffUser.role !== 'superAdmin') {
        throw new NewsServiceError(
          'PERMISSION_DENIED',
          'Only Content Administrators or Super Admins can move published articles to trash.'
        );
      }

      previousStatus = existingData.status;
      const newVersion = currentVersion + 1;
      versionBefore = currentVersion;
      versionAfter = newVersion;
      titleLabel = existingData.title?.en || existingData.title?.om || existingData.title?.am || cleanSlug;

      transaction.update(docRef, {
        status: 'trashed',
        statusBeforeTrash: previousStatus,
        trashedByUid: activeUid,
        trashedByEmail: staffUser.email,
        trashedByName: staffUser.displayName,
        trashedAt: serverTimestamp(),
        trashReason: (reason || '').trim(),
        updatedAt: serverTimestamp(),
        updatedBy: activeUid,
        updatedByEmail: staffUser.email,
        updatedByName: staffUser.displayName,
        version: newVersion,
      });
    });

    await logAuditEvent({
      actorUid: staffUser.uid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'news',
      action: 'moved_to_trash',
      result: 'success',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore,
      versionAfter,
      previousStatus,
      newStatus: 'trashed',
      reason: (reason || '').trim() || undefined,
    });

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Restore news article from trash.
 */
export async function restoreNewsFromTrash(
  slug: string,
  staffUser: StaffUser,
  expectedVersion?: number
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive.' };
  }

  const cleanSlug = slug.trim().toLowerCase();

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

    let versionBefore = 1;
    let versionAfter = 2;
    let restoredStatus: NewsStatus = 'draft';
    let titleLabel = cleanSlug;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new NewsServiceError('NEWS_NOT_FOUND', `Article with slug "${cleanSlug}" was not found.`);
      }

      const existingData = snap.data();
      const currentVersion = typeof existingData.version === 'number' ? existingData.version : 1;

      if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
        throw new NewsServiceError('VERSION_CONFLICT', 'Article version conflict. Refresh and retry.');
      }

      if (existingData.status !== 'trashed') {
        throw new NewsServiceError('NOT_IN_TRASH', 'Article is not in trash.');
      }

      let targetStatus: NewsStatus = existingData.statusBeforeTrash || 'draft';

      if (
        targetStatus === 'published' &&
        staffUser.role !== 'contentAdmin' &&
        staffUser.role !== 'superAdmin'
      ) {
        targetStatus = 'draft';
      }

      restoredStatus = targetStatus;
      const newVersion = currentVersion + 1;
      versionBefore = currentVersion;
      versionAfter = newVersion;
      titleLabel = existingData.title?.en || existingData.title?.om || existingData.title?.am || cleanSlug;

      transaction.update(docRef, {
        status: targetStatus,
        statusBeforeTrash: null,
        trashedByUid: null,
        trashedByEmail: null,
        trashedByName: null,
        trashedAt: null,
        trashReason: null,
        restoredByUid: activeUid,
        restoredByEmail: staffUser.email,
        restoredByName: staffUser.displayName,
        restoredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: activeUid,
        updatedByEmail: staffUser.email,
        updatedByName: staffUser.displayName,
        version: newVersion,
      });
    });

    await logAuditEvent({
      actorUid: staffUser.uid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'news',
      action: 'restored_from_trash',
      result: 'success',
      targetType: 'news_article',
      targetId: cleanSlug,
      targetLabel: titleLabel,
      source: 'dashboard_ui',
      versionBefore,
      versionAfter,
      previousStatus: 'trashed',
      newStatus: restoredStatus,
    });

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

/**
 * Permanently delete a news article from Firestore (Super Admin only, must be trashed).
 */
export async function permanentlyDeleteNewsArticle(
  slug: string,
  typedSlugConfirmation: string,
  staffUser: StaffUser
): Promise<{ success: boolean; error?: string; code?: string }> {
  if (!staffUser || !staffUser.active) {
    return { success: false, code: 'STAFF_INACTIVE', error: 'Your staff account is inactive.' };
  }

  if (staffUser.role !== 'superAdmin') {
    return {
      success: false,
      code: 'PERMISSION_DENIED',
      error: 'Permanent deletion is strictly restricted to Super Administrators.',
    };
  }

  const cleanSlug = slug.trim().toLowerCase();
  const cleanTyped = typedSlugConfirmation.trim().toLowerCase();

  if (cleanSlug !== cleanTyped) {
    return {
      success: false,
      code: 'CONFIRMATION_MISMATCH',
      error: `Typed slug confirmation "${cleanTyped}" does not match exact article slug "${cleanSlug}".`,
    };
  }

  try {
    const activeUid = await ensureStaffUserRecord(staffUser);
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists()) {
        throw new NewsServiceError('NEWS_NOT_FOUND', 'Article not found in database.');
      }

      const existingData = snap.data();

      if (existingData.status !== 'trashed') {
        throw new NewsServiceError(
          'INVALID_STATE',
          'Only articles currently in Trash can be permanently deleted.'
        );
      }

      transaction.delete(docRef);
    });

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}

export interface NewsAuditLogsResult {
  logs: NewsAuditLog[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Fetch news audit logs for a specific article.
 */
export async function getNewsAuditLogsBySlug(
  slug: string,
  pageSize: number = 20,
  startAfterDoc?: QueryDocumentSnapshot | null
): Promise<NewsAuditLogsResult> {
  try {
    const colRef = collection(db, 'newsAuditLogs');
    const cleanSlug = slug.trim().toLowerCase();
    const constraints: any[] = [where('articleSlug', '==', cleanSlug)];

    let q = startAfterDoc
      ? query(colRef, ...constraints, orderBy('occurredAt', 'desc'), startAfter(startAfterDoc), limit(pageSize))
      : query(colRef, ...constraints, orderBy('occurredAt', 'desc'), limit(pageSize));

    const snap = await getDocs(q);
    const logs: NewsAuditLog[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        articleSlug: d.articleSlug || '',
        articleTitle: d.articleTitle,
        action: d.action,
        actorUid: d.actorUid || '',
        actorEmail: d.actorEmail || '',
        actorDisplayName: d.actorDisplayName || 'Unknown',
        actorRole: d.actorRole || '',
        previousStatus: d.previousStatus,
        newStatus: d.newStatus,
        versionBefore: d.versionBefore,
        versionAfter: d.versionAfter,
        changedFields: d.changedFields || [],
        reason: d.reason || '',
        occurredAt: normalizeTimestampToISO(d.occurredAt),
        metadata: d.metadata || {},
      };
    });

    return {
      logs,
      lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === pageSize,
    };
  } catch (error) {
    console.warn('[newsService] Error fetching audit logs for slug:', slug, error);
    reportMissingIndexError('getNewsAuditLogsBySlug', error);
    return { logs: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Fetch general news audit logs across all articles.
 */
export async function getGeneralNewsAuditLogsPaginated(
  filters: { action?: string; searchSlug?: string },
  pageSize: number = 20,
  startAfterDoc?: QueryDocumentSnapshot | null
): Promise<NewsAuditLogsResult> {
  try {
    const colRef = collection(db, 'newsAuditLogs');
    const constraints: any[] = [];

    if (filters.action && filters.action !== 'all') {
      constraints.push(where('action', '==', filters.action));
    }
    if (filters.searchSlug && filters.searchSlug.trim()) {
      constraints.push(where('articleSlug', '==', filters.searchSlug.trim().toLowerCase()));
    }

    let q = startAfterDoc
      ? query(colRef, ...constraints, orderBy('occurredAt', 'desc'), startAfter(startAfterDoc), limit(pageSize))
      : query(colRef, ...constraints, orderBy('occurredAt', 'desc'), limit(pageSize));

    const snap = await getDocs(q);
    const logs: NewsAuditLog[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        articleSlug: d.articleSlug || '',
        articleTitle: d.articleTitle,
        action: d.action,
        actorUid: d.actorUid || '',
        actorEmail: d.actorEmail || '',
        actorDisplayName: d.actorDisplayName || 'Unknown',
        actorRole: d.actorRole || '',
        previousStatus: d.previousStatus,
        newStatus: d.newStatus,
        versionBefore: d.versionBefore,
        versionAfter: d.versionAfter,
        changedFields: d.changedFields || [],
        reason: d.reason || '',
        occurredAt: normalizeTimestampToISO(d.occurredAt),
        metadata: d.metadata || {},
      };
    });

    return {
      logs,
      lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === pageSize,
    };
  } catch (error) {
    console.warn('[newsService] Error fetching general news audit logs:', error);
    reportMissingIndexError('getGeneralNewsAuditLogsPaginated', error);
    return { logs: [], lastDoc: null, hasMore: false };
  }
}
