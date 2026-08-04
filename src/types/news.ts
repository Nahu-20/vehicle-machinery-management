import { Timestamp } from 'firebase/firestore';

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
  | 'archived';

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
    };

export interface NewsArticle {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: NewsContentBlock[];

  category: NewsCategory;
  tags: string[];

  featuredImage: string;
  imageAlt: LocalizedText;

  responsibleOffice: LocalizedText;
  authorName?: LocalizedText;

  status: NewsStatus;
  featured: boolean;

  publishedAt?: any; // Timestamp, Date, or string
  republishedAt?: any;
  scheduledFor?: any;

  createdAt: any;
  createdBy: string;
  createdByEmail: string;

  updatedAt: any;
  updatedBy: string;
  updatedByEmail: string;

  publishedBy?: string;
  publishedByEmail?: string;

  version: number;
}

export interface NewsArticleInput {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  content: NewsContentBlock[];
  category: NewsCategory;
  tags: string[];
  featuredImage: string;
  imageAlt: LocalizedText;
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

  if (!article.featuredImage || !article.featuredImage.trim()) {
    errors.push('Featured image URL is required.');
  }

  if (!article.imageAlt?.om || !article.imageAlt.om.trim()) {
    errors.push('Featured image alternative text (Afaan Oromo) is required.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Runtime validator for a raw NewsArticle object read from Firestore
 */
export function validateNewsArticle(data: any, docSlug: string): NewsArticle | null {
  if (!data || typeof data !== 'object') return null;

  const slug = typeof data.slug === 'string' && data.slug.trim() ? data.slug.trim() : docSlug;
  if (!slug) return null;

  const validStatuses: NewsStatus[] = ['draft', 'review', 'published', 'unpublished', 'archived'];
  const status: NewsStatus = validStatuses.includes(data.status) ? data.status : 'draft';

  const validCategories: NewsCategory[] = ['news', 'training', 'event', 'tender', 'announcement'];
  const category: NewsCategory = validCategories.includes(data.category) ? data.category : 'news';

  const title: LocalizedText = isValidLocalizedText(data.title)
    ? data.title
    : {
        om: typeof data.title === 'string' ? data.title : '',
        am: '',
        en: typeof data.title === 'string' ? data.title : '',
      };

  const excerpt: LocalizedText = isValidLocalizedText(data.excerpt)
    ? data.excerpt
    : {
        om: typeof data.excerpt === 'string' ? data.excerpt : '',
        am: '',
        en: typeof data.excerpt === 'string' ? data.excerpt : '',
      };

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

  return {
    slug,
    title,
    excerpt,
    content,
    category,
    tags: Array.isArray(data.tags) ? data.tags.filter((t: any) => typeof t === 'string') : [],
    featuredImage: typeof data.featuredImage === 'string' ? data.featuredImage : '',
    imageAlt,
    responsibleOffice,
    authorName: isValidLocalizedText(data.authorName) ? data.authorName : undefined,
    status,
    featured: Boolean(data.featured),
    publishedAt: data.publishedAt || null,
    republishedAt: data.republishedAt || null,
    scheduledFor: data.scheduledFor || null,
    createdAt: data.createdAt || null,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : '',
    updatedAt: data.updatedAt || null,
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : '',
    updatedByEmail: typeof data.updatedByEmail === 'string' ? data.updatedByEmail : '',
    publishedBy: typeof data.publishedBy === 'string' ? data.publishedBy : undefined,
    publishedByEmail: typeof data.publishedByEmail === 'string' ? data.publishedByEmail : undefined,
    version: typeof data.version === 'number' ? data.version : 1,
  };
}

export function parseFirestoreError(error: any): { code: string; message: string } {
  if (error instanceof NewsServiceError) {
    return { code: error.code, message: error.message };
  }
  const msg = error?.message || String(error);
  if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
    return {
      code: 'PERMISSION_DENIED',
      message: 'Permission denied: Your staff account or role lacks authorization for this operation.',
    };
  }
  if (msg.includes('not-found') || msg.includes('No document to update')) {
    return {
      code: 'NEWS_NOT_FOUND',
      message: 'The requested news article was not found or has been removed.',
    };
  }
  if (msg.includes('already-exists')) {
    return {
      code: 'SLUG_ALREADY_EXISTS',
      message: 'An article with this URL slug already exists in Firestore.',
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: msg || 'An unexpected database error occurred.',
  };
}
