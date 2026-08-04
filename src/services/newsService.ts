import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StaffUser } from '../types/auth';
import {
  NewsArticle,
  NewsArticleInput,
  NewsFilterOptions,
  NewsServiceError,
  parseFirestoreError,
  validateDraft,
  validateForReview,
  validateForPublishing,
  validateNewsArticle,
  validateSlug,
} from '../types/news';
import { mockNews } from '../data/mockData';

const NEWS_COLLECTION = 'newsArticles';

/**
 * Returns the configured public news data source ('firestore' or 'mock').
 * Strictly respects VITE_PUBLIC_NEWS_SOURCE.
 */
export const getPublicNewsSourceMode = (): 'firestore' | 'mock' => {
  const envSource = (import.meta.env.VITE_PUBLIC_NEWS_SOURCE || '').toLowerCase();
  return envSource === 'mock' ? 'mock' : 'firestore';
};

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
    const docRef = doc(db, NEWS_COLLECTION, slug.trim());
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const article = validateNewsArticle(snap.data(), snap.id);
      if (article && article.status === 'published') {
        return article;
      }
    }
    return null;
  } catch (error) {
    console.warn(`[newsService] Error reading published article (${slug}):`, error);
    return null;
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
    const q = query(colRef, where('status', '==', 'published'));
    const snap = await getDocs(q);

    let articles: NewsArticle[] = snap.docs
      .map((docSnap) => validateNewsArticle(docSnap.data(), docSnap.id))
      .filter((a): a is NewsArticle => a !== null && a.status === 'published');

    if (categoryFilter && categoryFilter !== 'all') {
      articles = articles.filter((a) => a.category === categoryFilter);
    }

    articles.sort((a, b) => {
      const timeA = Date.parse(a.publishedAt || a.updatedAt || a.createdAt || '0');
      const timeB = Date.parse(b.publishedAt || b.updatedAt || b.createdAt || '0');
      return timeB - timeA;
    });

    return articles;
  } catch (error) {
    console.warn('[newsService] Error querying published news articles:', error);
    return [];
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
      createdBy: staffUser.uid,
      createdByEmail: staffUser.email,
      updatedAt: serverTimestamp(),
      updatedBy: staffUser.uid,
      updatedByEmail: staffUser.email,
      version: 1,
    };

    await setDoc(docRef, newDocData);
    return { success: true, slug: cleanSlug };
  } catch (error: any) {
    console.error('[newsService] Error creating news draft:', error);
    const parsed = parseFirestoreError(error);
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
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

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
        updatedBy: staffUser.uid,
        updatedByEmail: staffUser.email,
        version: currentVersion + 1,
      };

      transaction.update(docRef, updateData);
    });

    return { success: true };
  } catch (error: any) {
    console.error('[newsService] Error updating news draft:', error);
    const parsed = parseFirestoreError(error);
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
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

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

      transaction.update(docRef, {
        status: 'review',
        updatedAt: serverTimestamp(),
        updatedBy: staffUser.uid,
        updatedByEmail: staffUser.email,
        version: currentVersion + 1,
      });
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
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

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

      const updateFields: Record<string, any> = {
        status: 'published',
        publishedBy: staffUser.uid,
        publishedByEmail: staffUser.email,
        updatedAt: serverTimestamp(),
        updatedBy: staffUser.uid,
        updatedByEmail: staffUser.email,
        version: currentVersion + 1,
      };

      if (isFirstPublish) {
        updateFields.publishedAt = serverTimestamp();
      } else {
        updateFields.republishedAt = serverTimestamp();
      }

      transaction.update(docRef, updateFields);
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
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

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

      transaction.update(docRef, {
        status: 'unpublished',
        updatedAt: serverTimestamp(),
        updatedBy: staffUser.uid,
        updatedByEmail: staffUser.email,
        version: currentVersion + 1,
      });
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
    const docRef = doc(db, NEWS_COLLECTION, cleanSlug);

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

      transaction.update(docRef, {
        status: 'archived',
        updatedAt: serverTimestamp(),
        updatedBy: staffUser.uid,
        updatedByEmail: staffUser.email,
        version: currentVersion + 1,
      });
    });

    return { success: true };
  } catch (error: any) {
    const parsed = parseFirestoreError(error);
    return { success: false, code: parsed.code, error: parsed.message };
  }
}
