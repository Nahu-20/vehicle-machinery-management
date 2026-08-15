import { Timestamp } from 'firebase/firestore';
import { NewsStagedImageReference } from './media';

export type { NewsStagedImageReference };

export type LocalizedText = {
  om: string;
  am: string;
  en: string;
};

export type NewsStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'unpublished'
  | 'archived'
  | 'trashed';

export type NewsCategory =
  | 'news'
  | 'training'
  | 'event'
  | 'tender'
  | 'announcement';

export type NewsContentBlock =
  | {
      id: string;
      type: 'paragraph';
      content: LocalizedText;
    }
  | {
      id: string;
      type: 'heading';
      level: 2 | 3;
      content: LocalizedText;
    }
  | {
      id: string;
      type: 'quote';
      content: LocalizedText;
      source?: LocalizedText;
    }
  | {
      id: string;
      type: 'list';
      ordered: boolean;
      items: LocalizedText[];
    }
  | {
      id: string;
      type: 'highlight';
      content: LocalizedText;
      title?: LocalizedText;
    }
  | {
      id: string;
      type: 'image';
      src: string;
      alt: LocalizedText;
      caption?: LocalizedText;
    }
  | {
      id: string;
      type: 'relatedLink';
      title: LocalizedText;
      url: string;
    };

export interface NewsManagedFeaturedImage {
  source: 'managed';
  mediaId: string;

  urls: {
    hero: string;
    card: string;
    thumbnail: string;
  };

  width: {
    hero: number;
    card: number;
    thumbnail: number;
  };

  height: {
    hero: number;
    card: number;
    thumbnail: number;
  };

  contentType: 'image/webp';
}

export interface NewsArticle {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: NewsContentBlock[];

  category: NewsCategory;
  tags: string[];

  featuredImage: string;
  featuredImageSource?: 'external' | 'managed' | 'none';
  featuredImageAssetId?: string | null;
  featuredImageManaged?: NewsManagedFeaturedImage | null;
  featuredImageStaging?: NewsStagedImageReference | null;
  imageAlt: LocalizedText;
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';

  responsibleOffice: LocalizedText;
  authorName?: LocalizedText;

  date?: string;
  readTime?: string;
  readingTime?: string;

  status: NewsStatus;
  featured: boolean;

  publishedAt?: any; // Timestamp, Date, or string
  republishedAt?: any;
  scheduledFor?: any;

  createdAt: any;
  createdBy: string;
  createdByEmail: string;
  createdByName?: string;

  updatedAt: any;
  updatedBy: string;
  updatedByEmail: string;
  updatedByName?: string;

  submittedForReviewByUid?: string;
  submittedForReviewByEmail?: string;
  submittedForReviewByName?: string;
  submittedForReviewAt?: any;

  publishedBy?: string;
  publishedByEmail?: string;
  publishedByName?: string;

  unpublishedByUid?: string;
  unpublishedByEmail?: string;
  unpublishedByName?: string;
  unpublishedAt?: any;

  archivedByUid?: string;
  archivedByEmail?: string;
  archivedByName?: string;
  archivedAt?: any;

  restoredByUid?: string;
  restoredByEmail?: string;
  restoredByName?: string;
  restoredAt?: any;

  trashedByUid?: string;
  trashedByEmail?: string;
  trashedByName?: string;
  trashedAt?: any;
  trashReason?: string;
  statusBeforeTrash?: NewsStatus;
  previousStatusBeforeTrash?: NewsStatus;

  version: number;
}

export type NewsAuditAction =
  | 'created'
  | 'updated'
  | 'submitted_for_review'
  | 'returned_to_draft'
  | 'published'
  | 'unpublished'
  | 'republished'
  | 'archived'
  | 'moved_to_trash'
  | 'restored'
  | 'permanently_deleted';

export interface NewsAuditLog {
  id: string;
  articleSlug: string;
  articleTitle?: LocalizedText;
  action: NewsAuditAction;
  actorUid: string;
  actorEmail: string;
  actorDisplayName: string;
  actorRole: string;
  previousStatus?: NewsStatus;
  newStatus?: NewsStatus;
  versionBefore?: number;
  versionAfter?: number;
  changedFields?: string[];
  reason?: string;
  occurredAt: any;
  metadata?: Record<string, unknown>;
}

export interface NewsArticleInput {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: NewsContentBlock[];
  category: NewsCategory;
  tags: string[];
  featuredImage: string;
  featuredImageSource?: 'external' | 'managed' | 'none';
  featuredImageAssetId?: string | null;
  featuredImageManaged?: NewsManagedFeaturedImage | null;
  featuredImageStaging?: NewsStagedImageReference | null;
  imageAlt: LocalizedText;
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  responsibleOffice: LocalizedText;
  authorName?: LocalizedText;
  featured: boolean;
  scheduledFor?: any;
}

export interface NewsFilterOptions {
  status?: NewsStatus | 'all';
  category?: NewsCategory | 'all';
  featured?: boolean;
  searchQuery?: string;
  sortBy?: 'updatedAt' | 'publishedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Normalized Error Class
 */
export class NewsServiceError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'NewsServiceError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Helper to convert any timestamp representation safely to a JS Date.
 */
export function timestampToDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') {
    try {
      return val.toDate();
    } catch {
      return null;
    }
  }
  if (typeof val === 'number') {
    return new Date(val);
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? null : new Date(parsed);
  }
  return null; // unresolved serverTimestamp
}

export function timestampToMillis(val: any): number | null {
  const date = timestampToDate(val);
  return date ? date.getTime() : null;
}

export function formatFirestoreTimestamp(val: any, locale: string = 'en-US'): string {
  const date = timestampToDate(val);
  if (!date) return '—';
  try {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Helper to create empty LocalizedText
 */
export function createEmptyLocalizedText(): LocalizedText {
  return { om: '', am: '', en: '' };
}

/**
 * Validate LocalizedText structure
 */
export function isValidLocalizedText(data: any): data is LocalizedText {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.om === 'string' &&
    typeof data.am === 'string' &&
    typeof data.en === 'string'
  );
}

/**
 * Generate slug from titles based on priority:
 * 1. Afaan Oromo (om)
 * 2. English (en)
 * 3. Amharic (am) - fallback to stable news-YYYYMMDD-<rand> if non-ASCII
 */
export function sanitizeSlug(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateSlugFromTitles(title: LocalizedText): string {
  const omTitle = (title?.om || '').trim();
  const enTitle = (title?.en || '').trim();

  const sourceStr = omTitle || enTitle;
  if (sourceStr) {
    const slug = sanitizeSlug(sourceStr);
    if (slug.length >= 3) {
      return slug.slice(0, 80).replace(/-+$/, '');
    }
  }

  // Stable fallback for Amharic-only or empty ASCII titles
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `news-${dateStr}-${randomSuffix}`;
}

/**
 * Validate slug rules:
 * - Lowercase ASCII letters, numbers, hyphens
 * - No leading or trailing hyphens, no repeated hyphens
 * - Length 3-100 characters
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required.' };
  }
  const clean = slug.trim();
  if (clean.length < 3 || clean.length > 100) {
    return { valid: false, error: 'Slug must be between 3 and 100 characters.' };
  }
  const regex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!regex.test(clean)) {
    return { valid: false, error: 'Slug must contain only lowercase ASCII letters, numbers, and single hyphens.' };
  }
  return { valid: true };
}

/**
 * Normalize article form for dirty-state comparison
 */
export function normalizeArticleForm(formData: any): any {
  if (!formData) return null;

  const normalizeLocText = (loc: any) => ({
    om: (loc?.om || '').trim(),
    am: (loc?.am || '').trim(),
    en: (loc?.en || '').trim(),
  });

  const normalizeBlocks = (blocks: any[]) => {
    if (!Array.isArray(blocks)) return [];
    return blocks.map((b) => {
      const type = b.type || 'paragraph';
      if (type === 'heading') {
        return {
          type: 'heading',
          level: b.level === 3 ? 3 : 2,
          content: normalizeLocText(b.content),
        };
      }
      if (type === 'quote') {
        return {
          type: 'quote',
          content: normalizeLocText(b.content),
          source: b.source ? normalizeLocText(b.source) : { om: '', am: '', en: '' },
        };
      }
      if (type === 'list') {
        return {
          type: 'list',
          ordered: Boolean(b.ordered),
          items: Array.isArray(b.items) ? b.items.map(normalizeLocText) : [],
        };
      }
      if (type === 'highlight') {
        return {
          type: 'highlight',
          content: normalizeLocText(b.content),
        };
      }
      return {
        type: 'paragraph',
        content: normalizeLocText(b.content),
      };
    });
  };

  const tags = Array.isArray(formData.tags)
    ? [...formData.tags].map((t) => String(t).trim().toLowerCase()).filter(Boolean).sort()
    : [];

  return {
    slug: (formData.slug || '').trim().toLowerCase(),
    title: normalizeLocText(formData.title),
    excerpt: normalizeLocText(formData.excerpt),
    category: formData.category || 'news',
    tags,
    featuredImage: (formData.featuredImage || '').trim(),
    featuredImageSource: formData.featuredImageSource || (formData.featuredImageManaged ? 'managed' : (formData.featuredImageStaging ? 'external' : 'none')),
    featuredImageAssetId: formData.featuredImageAssetId || formData.featuredImageManaged?.mediaId || null,
    featuredImageManaged: formData.featuredImageManaged || null,
    featuredImageStaging: formData.featuredImageStaging && typeof formData.featuredImageStaging === 'object'
      ? {
          mediaId: String(formData.featuredImageStaging.mediaId || ''),
          ownerUid: String(formData.featuredImageStaging.ownerUid || ''),
          storagePath: String(formData.featuredImageStaging.storagePath || ''),
          originalFileName: String(formData.featuredImageStaging.originalFileName || ''),
          contentType: String(formData.featuredImageStaging.contentType || ''),
          size: Number(formData.featuredImageStaging.size) || 0,
          width: Number(formData.featuredImageStaging.width) || 0,
          height: Number(formData.featuredImageStaging.height) || 0,
          status: 'staged' as const,
          uploadedAt: formData.featuredImageStaging.uploadedAt ? String(formData.featuredImageStaging.uploadedAt) : undefined,
        }
      : null,
    imageAlt: normalizeLocText(formData.imageAlt),
    responsibleOffice: normalizeLocText(formData.responsibleOffice),
    authorName: formData.authorName ? normalizeLocText(formData.authorName) : { om: '', am: '', en: '' },
    featured: Boolean(formData.featured),
    content: normalizeBlocks(formData.content),
  };
}

export function isFormDirty(currentForm: any, baselineForm: any): boolean {
  if (!currentForm || !baselineForm) return false;
  const normCurrent = normalizeArticleForm(currentForm);
  const normBaseline = normalizeArticleForm(baselineForm);
  return JSON.stringify(normCurrent) !== JSON.stringify(normBaseline);
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDraft(article: any): ValidationResult {
  const errors: string[] = [];

  const slugCheck = validateSlug(article.slug);
  if (!slugCheck.valid) {
    errors.push(slugCheck.error || 'Invalid slug.');
  }

  const titleOm = (article.title?.om || '').trim();
  const titleEn = (article.title?.en || '').trim();
  const titleAm = (article.title?.am || '').trim();

  if (!titleOm && !titleEn && !titleAm) {
    errors.push('Title is required in at least one language.');
  }

  return { valid: errors.length === 0, errors };
}

export function validateForReview(article: any): ValidationResult {
  const errors: string[] = [];

  const slugCheck = validateSlug(article.slug);
  if (!slugCheck.valid) {
    errors.push(slugCheck.error || 'Invalid slug.');
  }

  if (!article.title?.om || !article.title.om.trim()) {
    errors.push('Afaan Oromo title is required for review.');
  }

  if (!article.excerpt?.om || !article.excerpt.om.trim()) {
    errors.push('Afaan Oromo summary/excerpt is required for review.');
  }

  if (!article.category) {
    errors.push('Category is required.');
  }

  if (!article.responsibleOffice?.om || !article.responsibleOffice.om.trim()) {
    errors.push('Responsible office (Afaan Oromo) is required.');
  }

  if (!article.content || !Array.isArray(article.content) || article.content.length === 0) {
    errors.push('At least one content block is required.');
  } else {
    const hasMeaningfulBlock = article.content.some((b: any) => {
      if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote' || b.type === 'highlight') {
        return Boolean(b.content?.om && b.content.om.trim());
      }
      if (b.type === 'list') {
        return Boolean(b.items && b.items.some((i: any) => i.om && i.om.trim()));
      }
      return false;
    });

    if (!hasMeaningfulBlock) {
      errors.push('At least one content block must contain Afaan Oromo text.');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateForPublishing(article: any): ValidationResult {
  const reviewRes = validateForReview(article);
  const errors = [...reviewRes.errors];

  const hasManagedImage =
    (article.featuredImageSource === 'managed' &&
      (!article.featuredImageStaging ||
        article.featuredImageAssetId === article.featuredImageStaging.mediaId ||
        Boolean(article.featuredImageAssetId))) ||
    Boolean(article.featuredImageManaged) ||
    (typeof article.featuredImage === 'string' && article.featuredImage.startsWith('/api/media/news/'));

  if (hasManagedImage) {
    // Managed image is processed and ready for publication (allowed even when featuredImageStaging is present)
  } else if (article.featuredImageStaging) {
    errors.push(
      'This uploaded image is still private and must be processed before the article can be published.'
    );
  } else if (!article.featuredImage || !article.featuredImage.trim()) {
    errors.push('Featured image URL is required.');
  }

  if (!article.imageAlt?.om || !article.imageAlt.om.trim()) {
    errors.push('Featured image alternative text (Afaan Oromo) is required.');
  }

  return { valid: errors.length === 0, errors };
}

export function normalizeTimestampToISO(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? null : val;
  }
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val?.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val?.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  return null;
}

export function parseTimestampMillis(val: any): number | null {
  if (!val) return null;
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  if (typeof val?.toMillis === 'function') {
    return val.toMillis();
  }
  if (typeof val?.toDate === 'function') {
    return val.toDate().getTime();
  }
  if (typeof val?.seconds === 'number') {
    return val.seconds * 1000;
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  if (typeof val === 'string') {
    const t = Date.parse(val);
    return isNaN(t) ? null : t;
  }
  if (typeof val === 'number') {
    return val;
  }
  return null;
}

/**
 * Runtime validator for a raw NewsArticle object read from Firestore
 */
export function validateNewsArticle(data: any, docSlug: string): NewsArticle | null {
  if (!data || typeof data !== 'object') return null;

  const invalidFields: Array<{ name: string; expected: string; actual: string }> = [];

  const slug = typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : docSlug;
  if (typeof data.slug !== 'string' || !data.slug.trim()) {
    invalidFields.push({ name: 'slug', expected: 'non-empty string', actual: typeof data.slug });
  }

  const validStatuses: NewsStatus[] = ['draft', 'review', 'published', 'unpublished', 'archived', 'trashed'];
  const status: NewsStatus = validStatuses.includes(data.status) ? data.status : 'draft';
  if (!validStatuses.includes(data.status)) {
    invalidFields.push({ name: 'status', expected: validStatuses.join('|'), actual: String(data.status) });
  }

  const validCategories: NewsCategory[] = ['news', 'training', 'event', 'tender', 'announcement'];
  const category: NewsCategory = validCategories.includes(data.category) ? data.category : 'news';
  if (!validCategories.includes(data.category)) {
    invalidFields.push({ name: 'category', expected: validCategories.join('|'), actual: String(data.category) });
  }

  if (!isValidLocalizedText(data.title) && typeof data.title !== 'string') {
    invalidFields.push({ name: 'title', expected: 'LocalizedText or string', actual: typeof data.title });
  }
  const title: LocalizedText = isValidLocalizedText(data.title)
    ? data.title
    : {
        om: typeof data.title === 'string' ? data.title : '',
        am: '',
        en: typeof data.title === 'string' ? data.title : '',
      };

  if (!isValidLocalizedText(data.excerpt) && typeof data.excerpt !== 'string') {
    invalidFields.push({ name: 'excerpt', expected: 'LocalizedText or string', actual: typeof data.excerpt });
  }
  const excerpt: LocalizedText = isValidLocalizedText(data.excerpt)
    ? data.excerpt
    : {
        om: typeof data.excerpt === 'string' ? data.excerpt : '',
        am: '',
        en: typeof data.excerpt === 'string' ? data.excerpt : '',
      };

  if (!Array.isArray(data.content)) {
    invalidFields.push({ name: 'content', expected: 'Array of content blocks', actual: typeof data.content });
  }
  const content: NewsContentBlock[] = Array.isArray(data.content)
    ? data.content.map((block: any, idx: number) => {
        const id = block.id || `block-${idx}`;
        const blockType = block.type || 'paragraph';

        if (blockType === 'heading') {
          return {
            id,
            type: 'heading',
            level: block.level === 3 ? 3 : 2,
            content: isValidLocalizedText(block.content) ? block.content : createEmptyLocalizedText(),
          };
        }
        if (blockType === 'quote') {
          return {
            id,
            type: 'quote',
            content: isValidLocalizedText(block.content) ? block.content : createEmptyLocalizedText(),
            source: isValidLocalizedText(block.source) ? block.source : undefined,
          };
        }
        if (blockType === 'list') {
          return {
            id,
            type: 'list',
            ordered: Boolean(block.ordered),
            items: Array.isArray(block.items)
              ? block.items.map((it: any) => (isValidLocalizedText(it) ? it : createEmptyLocalizedText()))
              : [],
          };
        }
        if (blockType === 'highlight') {
          return {
            id,
            type: 'highlight',
            content: isValidLocalizedText(block.content) ? block.content : createEmptyLocalizedText(),
          };
        }
        return {
          id,
          type: 'paragraph',
          content: isValidLocalizedText(block.content) ? block.content : createEmptyLocalizedText(),
        };
      })
    : [];

  if (!isValidLocalizedText(data.responsibleOffice) && typeof data.responsibleOffice !== 'string') {
    invalidFields.push({ name: 'responsibleOffice', expected: 'LocalizedText or string', actual: typeof data.responsibleOffice });
  }
  const responsibleOffice: LocalizedText = isValidLocalizedText(data.responsibleOffice)
    ? data.responsibleOffice
    : {
        om: typeof data.responsibleOffice === 'string' ? data.responsibleOffice : 'Waajjira Qonnaa Oromiyaa',
        am: 'የኦሮሚያ ግብርና ቢሮ',
        en: 'Oromia Agricultural Bureau',
      };

  const imageAlt: LocalizedText = isValidLocalizedText(data.imageAlt)
    ? data.imageAlt
    : createEmptyLocalizedText();

  if (typeof data.featured !== 'boolean' && data.featured !== undefined) {
    invalidFields.push({ name: 'featured', expected: 'boolean', actual: typeof data.featured });
  }

  const publishedAtISO = normalizeTimestampToISO(data.publishedAt);
  if (data.status === 'published' && !publishedAtISO) {
    invalidFields.push({ name: 'publishedAt', expected: 'valid Timestamp/Date/ISO string', actual: String(data.publishedAt) });
  }

  const createdAtISO = normalizeTimestampToISO(data.createdAt);
  if (data.createdAt && !createdAtISO) {
    invalidFields.push({ name: 'createdAt', expected: 'valid Timestamp/Date/ISO string', actual: String(data.createdAt) });
  }

  const updatedAtISO = normalizeTimestampToISO(data.updatedAt);
  if (data.updatedAt && !updatedAtISO) {
    invalidFields.push({ name: 'updatedAt', expected: 'valid Timestamp/Date/ISO string', actual: String(data.updatedAt) });
  }

  if (typeof data.version !== 'number' && data.version !== undefined) {
    invalidFields.push({ name: 'version', expected: 'number', actual: typeof data.version });
  }

  const isDev = Boolean(import.meta.env?.DEV);
  if (isDev && invalidFields.length > 0) {
    console.warn('[newsValidator] Diagnostic for document:', {
      documentId: docSlug,
      invalidFieldNames: invalidFields.map((f) => f.name),
      expectedType: invalidFields.map((f) => f.expected).join('; '),
      actualTypeCategory: invalidFields.map((f) => f.actual).join('; '),
      validationResult: 'NORMALIZED_WITH_FALLBACKS',
    });
  }

  let featuredImageStaging: NewsStagedImageReference | null = null;
  if (data.featuredImageStaging && typeof data.featuredImageStaging === 'object') {
    const s = data.featuredImageStaging;
    if (
      typeof s.mediaId === 'string' &&
      typeof s.ownerUid === 'string' &&
      typeof s.storagePath === 'string' &&
      s.status === 'staged'
    ) {
      featuredImageStaging = {
        mediaId: s.mediaId,
        ownerUid: s.ownerUid,
        storagePath: s.storagePath,
        originalFileName: typeof s.originalFileName === 'string' ? s.originalFileName : 'image',
        contentType: typeof s.contentType === 'string' ? s.contentType : 'image/jpeg',
        size: typeof s.size === 'number' ? s.size : 0,
        width: typeof s.width === 'number' ? s.width : 0,
        height: typeof s.height === 'number' ? s.height : 0,
        status: 'staged',
        uploadedAt: typeof s.uploadedAt === 'string' ? s.uploadedAt : undefined,
      };
    }
  }

  return {
    slug,
    title,
    excerpt,
    content,
    category,
    tags: Array.isArray(data.tags) ? data.tags.filter((t: any) => typeof t === 'string') : [],
    featuredImage: typeof data.featuredImage === 'string' ? data.featuredImage : '',
    featuredImageSource: data.featuredImageSource || (data.featuredImageManaged ? 'managed' : (featuredImageStaging ? 'external' : 'none')),
    featuredImageAssetId: typeof data.featuredImageAssetId === 'string' ? data.featuredImageAssetId : (data.featuredImageManaged?.mediaId || null),
    featuredImageManaged: data.featuredImageManaged || null,
    featuredImageStaging,
    imageAlt,
    imagePosition: ['center', 'top', 'bottom', 'left', 'right'].includes(data.imagePosition)
      ? data.imagePosition
      : 'center',
    responsibleOffice,
    authorName: isValidLocalizedText(data.authorName) ? data.authorName : undefined,
    status,
    featured: Boolean(data.featured),
    publishedAt: publishedAtISO,
    republishedAt: normalizeTimestampToISO(data.republishedAt),
    scheduledFor: normalizeTimestampToISO(data.scheduledFor),
    createdAt: createdAtISO,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : '',
    createdByName: typeof data.createdByName === 'string' ? data.createdByName : undefined,
    updatedAt: updatedAtISO,
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : '',
    updatedByEmail: typeof data.updatedByEmail === 'string' ? data.updatedByEmail : '',
    updatedByName: typeof data.updatedByName === 'string' ? data.updatedByName : undefined,
    submittedForReviewByUid: typeof data.submittedForReviewByUid === 'string' ? data.submittedForReviewByUid : undefined,
    submittedForReviewByEmail: typeof data.submittedForReviewByEmail === 'string' ? data.submittedForReviewByEmail : undefined,
    submittedForReviewByName: typeof data.submittedForReviewByName === 'string' ? data.submittedForReviewByName : undefined,
    submittedForReviewAt: normalizeTimestampToISO(data.submittedForReviewAt),
    publishedBy: typeof data.publishedBy === 'string' ? data.publishedBy : undefined,
    publishedByEmail: typeof data.publishedByEmail === 'string' ? data.publishedByEmail : undefined,
    publishedByName: typeof data.publishedByName === 'string' ? data.publishedByName : undefined,
    unpublishedByUid: typeof data.unpublishedByUid === 'string' ? data.unpublishedByUid : undefined,
    unpublishedByEmail: typeof data.unpublishedByEmail === 'string' ? data.unpublishedByEmail : undefined,
    unpublishedByName: typeof data.unpublishedByName === 'string' ? data.unpublishedByName : undefined,
    unpublishedAt: normalizeTimestampToISO(data.unpublishedAt),
    archivedByUid: typeof data.archivedByUid === 'string' ? data.archivedByUid : undefined,
    archivedByEmail: typeof data.archivedByEmail === 'string' ? data.archivedByEmail : undefined,
    archivedByName: typeof data.archivedByName === 'string' ? data.archivedByName : undefined,
    archivedAt: normalizeTimestampToISO(data.archivedAt),
    restoredByUid: typeof data.restoredByUid === 'string' ? data.restoredByUid : undefined,
    restoredByEmail: typeof data.restoredByEmail === 'string' ? data.restoredByEmail : undefined,
    restoredByName: typeof data.restoredByName === 'string' ? data.restoredByName : undefined,
    restoredAt: normalizeTimestampToISO(data.restoredAt),
    trashedByUid: typeof data.trashedByUid === 'string' ? data.trashedByUid : undefined,
    trashedByEmail: typeof data.trashedByEmail === 'string' ? data.trashedByEmail : undefined,
    trashedByName: typeof data.trashedByName === 'string' ? data.trashedByName : undefined,
    trashedAt: normalizeTimestampToISO(data.trashedAt),
    trashReason: typeof data.trashReason === 'string' ? data.trashReason : undefined,
    statusBeforeTrash: validStatuses.includes(data.statusBeforeTrash) ? data.statusBeforeTrash : undefined,
    version: typeof data.version === 'number' ? data.version : 1,
  };
}

export function parseFirestoreError(error: any): NewsServiceError {
  if (error instanceof NewsServiceError) {
    return error;
  }
  const msg = error?.message || String(error);
  if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
    return new NewsServiceError(
      'PERMISSION_DENIED',
      'Permission denied: Your staff account or role lacks authorization for this operation.'
    );
  }
  if (msg.includes('not-found') || msg.includes('No document to update')) {
    return new NewsServiceError(
      'NEWS_NOT_FOUND',
      'The requested news article was not found or has been removed.'
    );
  }
  if (msg.includes('already-exists')) {
    return new NewsServiceError(
      'SLUG_ALREADY_EXISTS',
      'An article with this URL slug already exists in Firestore.'
    );
  }
  return new NewsServiceError(
    'UNKNOWN_ERROR',
    msg || 'An unexpected database error occurred.'
  );
}
