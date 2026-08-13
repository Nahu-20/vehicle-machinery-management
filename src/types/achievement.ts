import { Timestamp } from 'firebase/firestore';
import { ManagedFeaturedImage, StagedMediaReference } from './media';

export type AchievementStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'unpublished'
  | 'archived'
  | 'trashed';

export type AchievementCategory =
  | 'productivity'
  | 'irrigation'
  | 'livestock'
  | 'extension'
  | 'mechanization'
  | 'natural-resources'
  | 'market-access'
  | 'youth-and-women'
  | 'other';

export interface LocalizedText {
  om: string;
  am: string;
  en: string;
}

export interface AchievementMetric {
  id: string;
  label: LocalizedText;
  value: string;
  unit?: LocalizedText;
  description?: LocalizedText;
}

export interface AchievementContentBlock {
  id: string;
  type:
    | 'paragraph'
    | 'heading'
    | 'quote'
    | 'bullet-list'
    | 'numbered-list';
  content: LocalizedText;
  items?: {
    om: string[];
    am: string[];
    en: string[];
  };
  level?: 2 | 3;
  source?: LocalizedText;
}

export interface AchievementBeforeAfter {
  before: LocalizedText;
  after: LocalizedText;
  beforeImage?: string | null;
  afterImage?: string | null;
  beforeDescription?: LocalizedText;
  afterDescription?: LocalizedText;
}

export interface AchievementGalleryItem {
  id: string;
  imageSource: 'external' | 'managed';
  image?: string | null;
  imageAssetId?: string | null;
  alt: LocalizedText;
  caption?: LocalizedText;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export interface Achievement {
  slug: string;

  title: LocalizedText;
  summary: LocalizedText;

  content: AchievementContentBlock[];

  category: AchievementCategory;

  tags: string[];

  status: AchievementStatus;

  featured: boolean;

  achievementDate?: string | null;

  responsibleOffice: LocalizedText;

  location?: LocalizedText;

  metrics: AchievementMetric[];

  beforeAfter?: AchievementBeforeAfter | null;

  gallery?: AchievementGalleryItem[];

  featuredImageSource: 'external' | 'managed' | 'none';

  featuredImage?: string | null;

  featuredImageAssetId?: string | null;

  featuredImageManaged?: ManagedFeaturedImage | null;

  featuredImageStaging?: StagedMediaReference | null;

  imageAlt: LocalizedText;

  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';

  createdAt: any;
  updatedAt: any;

  publishedAt?: any;

  createdByUid: string;
  createdByEmail: string;
  createdByName: string;

  updatedByUid: string;
  updatedByEmail: string;
  updatedByName: string;

  publishedByUid?: string | null;
  publishedByEmail?: string | null;
  publishedByName?: string | null;

  submittedForReviewByUid?: string | null;
  submittedForReviewByEmail?: string | null;
  submittedForReviewByName?: string | null;
  submittedForReviewAt?: any;

  unpublishedByUid?: string | null;
  unpublishedByEmail?: string | null;
  unpublishedByName?: string | null;
  unpublishedAt?: any;

  archivedByUid?: string | null;
  archivedByEmail?: string | null;
  archivedByName?: string | null;
  archivedAt?: any;

  restoredByUid?: string | null;
  restoredByEmail?: string | null;
  restoredByName?: string | null;
  restoredAt?: any;

  trashedByUid?: string | null;
  trashedByEmail?: string | null;
  trashedByName?: string | null;
  trashedAt?: any;
  trashReason?: string;

  statusBeforeTrash?: AchievementStatus | null;

  version: number;
}

export interface PublicAchievement {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  content: AchievementContentBlock[];
  category: AchievementCategory;
  tags: string[];
  featured: boolean;
  achievementDate?: string | null;
  responsibleOffice: LocalizedText;
  location?: LocalizedText;
  metrics: AchievementMetric[];
  beforeAfter?: AchievementBeforeAfter | null;
  gallery?: AchievementGalleryItem[];
  featuredImageSource: 'external' | 'managed' | 'none';
  featuredImage?: string | null;
  featuredImageAssetId?: string | null;
  featuredImageManaged?: ManagedFeaturedImage | null;
  imageAlt: LocalizedText;
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  publishedAt?: string | null;
}

export function toPublicAchievement(a: Achievement): PublicAchievement {
  return {
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    content: a.content || [],
    category: a.category,
    tags: a.tags || [],
    featured: Boolean(a.featured),
    achievementDate: a.achievementDate || null,
    responsibleOffice: a.responsibleOffice,
    location: a.location,
    metrics: a.metrics || [],
    beforeAfter: a.beforeAfter
      ? {
          before: a.beforeAfter.before || a.beforeAfter.beforeDescription || createEmptyLocalizedText(),
          after: a.beforeAfter.after || a.beforeAfter.afterDescription || createEmptyLocalizedText(),
          beforeImage: a.beforeAfter.beforeImage || null,
          afterImage: a.beforeAfter.afterImage || null,
          beforeDescription: a.beforeAfter.beforeDescription || a.beforeAfter.before || createEmptyLocalizedText(),
          afterDescription: a.beforeAfter.afterDescription || a.beforeAfter.after || createEmptyLocalizedText(),
        }
      : null,
    gallery: Array.isArray(a.gallery)
      ? a.gallery.map((g) => ({
          id: g.id,
          imageSource: g.imageSource || 'external',
          image: g.image || null,
          imageAssetId: g.imageAssetId || null,
          alt: g.alt || createEmptyLocalizedText(),
          caption: g.caption || null,
          position: g.position || 'center',
        }))
      : [],
    featuredImageSource: a.featuredImageSource || 'none',
    featuredImage: a.featuredImage || null,
    featuredImageAssetId: a.featuredImageAssetId || null,
    featuredImageManaged: a.featuredImageManaged || null,
    imageAlt: a.imageAlt,
    imagePosition: a.imagePosition || 'center',
    publishedAt: a.publishedAt || null,
  };
}

export interface AchievementInput {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  content: AchievementContentBlock[];
  category: AchievementCategory;
  tags?: string[];
  featured?: boolean;
  achievementDate?: string | null;
  responsibleOffice: LocalizedText;
  location?: LocalizedText;
  metrics: AchievementMetric[];
  beforeAfter?: AchievementBeforeAfter | null;
  gallery?: AchievementGalleryItem[];
  featuredImageSource?: 'external' | 'managed' | 'none';
  featuredImage?: string | null;
  featuredImageAssetId?: string | null;
  featuredImageManaged?: ManagedFeaturedImage | null;
  featuredImageStaging?: StagedMediaReference | null;
  imageAlt: LocalizedText;
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export interface AchievementFilterOptions {
  status?: AchievementStatus | 'all';
  category?: AchievementCategory | 'all';
  searchQuery?: string;
  featuredOnly?: boolean;
}

export type AchievementErrorCode =
  | 'ACHIEVEMENT_NOT_FOUND'
  | 'INVALID_ACHIEVEMENT'
  | 'INVALID_SLUG'
  | 'SLUG_ALREADY_EXISTS'
  | 'VERSION_CONFLICT'
  | 'PERMISSION_DENIED'
  | 'INVALID_STATUS_TRANSITION'
  | 'PUBLISH_VALIDATION_FAILED'
  | 'NETWORK_ERROR'
  | 'INDEX_REQUIRED'
  | 'UNKNOWN_ACHIEVEMENT_ERROR';

export class AchievementServiceError extends Error {
  public readonly code: AchievementErrorCode;
  public readonly details?: unknown;

  constructor(code: AchievementErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AchievementServiceError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AchievementServiceError.prototype);
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function createEmptyLocalizedText(): LocalizedText {
  return { om: '', am: '', en: '' };
}

export function isValidLocalizedText(val: any): val is LocalizedText {
  return (
    val !== null &&
    typeof val === 'object' &&
    typeof val.om === 'string' &&
    typeof val.am === 'string' &&
    typeof val.en === 'string'
  );
}

export function sanitizeSlug(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[/\\]/g, '') // Remove slashes/backslashes
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required.' };
  }
  const clean = slug.trim();

  // Reject slash, backslash injection, and path traversal
  if (clean.includes('/') || clean.includes('\\') || clean === '.' || clean === '..') {
    return { valid: false, error: 'Slug contains forbidden path characters.' };
  }

  if (clean.length < 3 || clean.length > 100) {
    return { valid: false, error: 'Slug must be between 3 and 100 characters.' };
  }
  const regex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!regex.test(clean)) {
    return {
      valid: false,
      error: 'Slug must contain only lowercase ASCII letters, numbers, and single hyphens.',
    };
  }
  return { valid: true };
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

  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `achievement-${dateStr}-${randomSuffix}`;
}

export function validateBeforeAfter(
  ba: any,
  isPublishing: boolean = false
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (ba === undefined || ba === null) {
    return { valid: true, errors: [] };
  }
  if (typeof ba !== 'object' || Array.isArray(ba)) {
    return { valid: false, errors: ['beforeAfter must be a valid object.'] };
  }

  const beforeLoc = ba.before || ba.beforeDescription;
  const afterLoc = ba.after || ba.afterDescription;

  if (isPublishing) {
    if (!beforeLoc || typeof beforeLoc !== 'object' || !beforeLoc.om || !beforeLoc.om.trim()) {
      errors.push('beforeAfter.before (Afaan Oromo) is required for publishing.');
    }
    if (!afterLoc || typeof afterLoc !== 'object' || !afterLoc.om || !afterLoc.om.trim()) {
      errors.push('beforeAfter.after (Afaan Oromo) is required for publishing.');
    }
  }

  const checkUrl = (urlVal: any, fieldName: string) => {
    if (urlVal !== undefined && urlVal !== null && urlVal !== '') {
      if (typeof urlVal !== 'string') {
        errors.push(`${fieldName} must be a string URL.`);
      } else {
        const u = urlVal.trim();
        if (/^(javascript|data|blob|file):/i.test(u) || (!u.startsWith('http://') && !u.startsWith('https://'))) {
          errors.push(`${fieldName} must be a valid public HTTP or HTTPS URL.`);
        }
      }
    }
  };

  checkUrl(ba.beforeImage, 'beforeAfter.beforeImage');
  checkUrl(ba.afterImage, 'beforeAfter.afterImage');

  return { valid: errors.length === 0, errors };
}

export function validateGallery(
  gallery: any,
  isPublishing: boolean = false
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (gallery === undefined || gallery === null) {
    return { valid: true, errors: [] };
  }
  if (!Array.isArray(gallery)) {
    return { valid: false, errors: ['gallery must be an array.'] };
  }

  if (gallery.length > 12) {
    errors.push('Gallery cannot exceed 12 items.');
  }

  const seenIds = new Set<string>();

  for (let i = 0; i < gallery.length; i++) {
    const item = gallery[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`Gallery item at index ${i} is malformed.`);
      continue;
    }

    if (!item.id || typeof item.id !== 'string' || !item.id.trim()) {
      errors.push(`Each gallery item must have a valid stable string ID.`);
    } else if (seenIds.has(item.id.trim())) {
      errors.push(`Duplicate gallery item ID found: "${item.id.trim()}".`);
    } else {
      seenIds.add(item.id.trim());
    }

    if (item.position !== undefined && item.position !== null && item.position !== '') {
      if (!['center', 'top', 'bottom', 'left', 'right'].includes(item.position)) {
        errors.push(`Gallery item "${item.id || i}" has an invalid position.`);
      }
    }

    if (isPublishing) {
      if (!item.alt || typeof item.alt !== 'object' || !item.alt.om || !item.alt.om.trim()) {
        errors.push(`Gallery item "${item.id || i}" requires alternative text in Afaan Oromo.`);
      }
    }

    if (item.imageSource === 'external' || !item.imageSource) {
      const url = typeof item.image === 'string' ? item.image.trim() : '';
      if (!url) {
        errors.push(`Gallery item "${item.id || i}" requires a valid image URL.`);
      } else if (/^(javascript|data|blob|file):/i.test(url) || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        errors.push(`Gallery item "${item.id || i}" image URL must be a valid public HTTP/HTTPS URL.`);
      }
    } else if (item.imageSource === 'managed') {
      const url = typeof item.image === 'string' ? item.image.trim() : '';
      const isPublicRef = url.startsWith('/api/media/achievement/') || url.startsWith('https://') || url.startsWith('http://');
      if (!isPublicRef) {
        errors.push(`Managed gallery item "${item.id || i}" must have a processed public media reference for publication.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateDraft(achievement: any): ValidationResult {
  const errors: string[] = [];

  if (achievement.slug) {
    const slugCheck = validateSlug(achievement.slug);
    if (!slugCheck.valid) {
      errors.push(slugCheck.error || 'Invalid slug.');
    }
  }

  const titleOm = (achievement.title?.om || '').trim();
  const titleEn = (achievement.title?.en || '').trim();
  const titleAm = (achievement.title?.am || '').trim();

  if (!titleOm && !titleEn && !titleAm) {
    errors.push('Title is required in at least one language.');
  }

  const baVal = validateBeforeAfter(achievement.beforeAfter, false);
  if (!baVal.valid) {
    errors.push(...baVal.errors);
  }

  const galVal = validateGallery(achievement.gallery, false);
  if (!galVal.valid) {
    errors.push(...galVal.errors);
  }

  return { valid: errors.length === 0, errors };
}

export function validateAchievementForReview(achievement: any): ValidationResult {
  const errors: string[] = [];

  const slugCheck = validateSlug(achievement.slug);
  if (!slugCheck.valid) {
    errors.push(slugCheck.error || 'Invalid slug.');
  }

  if (!achievement.title?.om || !achievement.title.om.trim()) {
    errors.push('Afaan Oromo title is required for review.');
  }

  if (!achievement.summary?.om || !achievement.summary.om.trim()) {
    errors.push('Afaan Oromo summary is required for review.');
  }

  const validCategories: AchievementCategory[] = [
    'productivity',
    'irrigation',
    'livestock',
    'extension',
    'mechanization',
    'natural-resources',
    'market-access',
    'youth-and-women',
    'other',
  ];

  if (!achievement.category || !validCategories.includes(achievement.category)) {
    errors.push('Valid category is required.');
  }

  if (!achievement.responsibleOffice?.om || !achievement.responsibleOffice.om.trim()) {
    errors.push('Responsible office (Afaan Oromo) is required.');
  }

  if (!achievement.content || !Array.isArray(achievement.content) || achievement.content.length === 0) {
    errors.push('At least one content block is required.');
  } else {
    const hasMeaningfulBlock = achievement.content.some((b: any) => {
      if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote') {
        return Boolean(b.content?.om && b.content.om.trim());
      }
      if (b.type === 'bullet-list' || b.type === 'numbered-list') {
        return Boolean(b.items?.om && Array.isArray(b.items.om) && b.items.om.some((i: string) => i && i.trim()));
      }
      return false;
    });

    if (!hasMeaningfulBlock) {
      errors.push('At least one content block must contain Afaan Oromo text.');
    }
  }

  const baVal = validateBeforeAfter(achievement.beforeAfter, false);
  if (!baVal.valid) {
    errors.push(...baVal.errors);
  }

  const galVal = validateGallery(achievement.gallery, false);
  if (!galVal.valid) {
    errors.push(...galVal.errors);
  }

  return { valid: errors.length === 0, errors };
}

export const validateForReview = validateAchievementForReview;

export function validateAchievementForPublishing(achievement: any): ValidationResult {
  const reviewRes = validateAchievementForReview(achievement);
  const errors = [...reviewRes.errors];

  // Featured image validation
  const hasManagedImage =
    (achievement.featuredImageSource === 'managed' &&
      (!achievement.featuredImageStaging ||
        achievement.featuredImageAssetId === achievement.featuredImageStaging.mediaId ||
        Boolean(achievement.featuredImageAssetId))) ||
    Boolean(achievement.featuredImageManaged) ||
    (typeof achievement.featuredImage === 'string' &&
      achievement.featuredImage.startsWith('/api/media/achievement/'));

  if (hasManagedImage) {
    // Valid managed image
  } else if (achievement.featuredImageStaging) {
    errors.push(
      'This uploaded image is still private and must be processed before the achievement can be published.'
    );
  } else if (!achievement.featuredImage || !achievement.featuredImage.trim()) {
    errors.push('Featured image URL is required.');
  }

  if (!achievement.imageAlt?.om || !achievement.imageAlt.om.trim()) {
    errors.push('Featured image alternative text (Afaan Oromo) is required.');
  }

  // Metrics validation
  if (Array.isArray(achievement.metrics)) {
    const metricIds = new Set<string>();
    for (const metric of achievement.metrics) {
      if (!metric.id || typeof metric.id !== 'string') {
        errors.push('Each metric must have a valid stable string ID.');
      } else if (metricIds.has(metric.id)) {
        errors.push(`Duplicate metric ID found: "${metric.id}". Metric IDs must be unique.`);
      } else {
        metricIds.add(metric.id);
      }

      if (!metric.label || !metric.label.om || !metric.label.om.trim()) {
        errors.push('Each metric must have a label in Afaan Oromo.');
      }

      if (metric.value === undefined || metric.value === null || typeof metric.value !== 'string') {
        errors.push('Each metric must have a string value.');
      }
    }
  }

  // Achievement date validation if supplied
  if (achievement.achievementDate !== undefined && achievement.achievementDate !== null) {
    if (typeof achievement.achievementDate !== 'string') {
      errors.push('Achievement date must be a valid ISO string or date string if supplied.');
    }
  }

  const baVal = validateBeforeAfter(achievement.beforeAfter, true);
  if (!baVal.valid) {
    errors.push(...baVal.errors);
  }

  const galVal = validateGallery(achievement.gallery, true);
  if (!galVal.valid) {
    errors.push(...galVal.errors);
  }

  return { valid: errors.length === 0, errors };
}

export const validateForPublishing = validateAchievementForPublishing;

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

export function validateAchievement(data: any, docSlug?: string): Achievement | null {
  if (!data || typeof data !== 'object') return null;

  const slug =
    typeof data.slug === 'string' && data.slug.trim()
      ? data.slug.trim()
      : (docSlug || '');
  if (!slug) return null;

  const validStatuses: AchievementStatus[] = [
    'draft',
    'review',
    'published',
    'unpublished',
    'archived',
    'trashed',
  ];
  const status: AchievementStatus = validStatuses.includes(data.status)
    ? data.status
    : 'draft';

  const validCategories: AchievementCategory[] = [
    'productivity',
    'irrigation',
    'livestock',
    'extension',
    'mechanization',
    'natural-resources',
    'market-access',
    'youth-and-women',
    'other',
  ];
  const category: AchievementCategory = validCategories.includes(data.category)
    ? data.category
    : 'other';

  const title: LocalizedText = isValidLocalizedText(data.title)
    ? data.title
    : {
        om: typeof data.title === 'string' ? data.title : '',
        am: '',
        en: typeof data.title === 'string' ? data.title : '',
      };

  const summary: LocalizedText = isValidLocalizedText(data.summary)
    ? data.summary
    : isValidLocalizedText(data.excerpt)
    ? data.excerpt
    : {
        om: typeof data.summary === 'string' ? data.summary : '',
        am: '',
        en: typeof data.summary === 'string' ? data.summary : '',
      };

  const content: AchievementContentBlock[] = Array.isArray(data.content)
    ? data.content.map((block: any, idx: number) => {
        const id = block.id || `block-${idx}`;
        const blockType = block.type || 'paragraph';
        const blockContent = isValidLocalizedText(block.content)
          ? block.content
          : createEmptyLocalizedText();

        if (blockType === 'heading') {
          return {
            id,
            type: 'heading',
            level: block.level === 3 ? 3 : 2,
            content: blockContent,
          };
        }
        if (blockType === 'quote') {
          return {
            id,
            type: 'quote',
            content: blockContent,
            source: isValidLocalizedText(block.source) ? block.source : undefined,
          };
        }
        if (blockType === 'bullet-list' || blockType === 'numbered-list' || blockType === 'list') {
          return {
            id,
            type: blockType === 'numbered-list' ? 'numbered-list' : 'bullet-list',
            content: blockContent,
            items: block.items || { om: [], am: [], en: [] },
          };
        }
        return {
          id,
          type: 'paragraph',
          content: blockContent,
        };
      })
    : [];

  const responsibleOffice: LocalizedText = isValidLocalizedText(data.responsibleOffice)
    ? data.responsibleOffice
    : {
        om:
          typeof data.responsibleOffice === 'string'
            ? data.responsibleOffice
            : 'Waajjira Qonnaa Oromiyaa',
        am: 'የኦሮሚያ ግብርና ቢሮ',
        en: 'Oromia Agricultural Bureau',
      };

  const imageAlt: LocalizedText = isValidLocalizedText(data.imageAlt)
    ? data.imageAlt
    : createEmptyLocalizedText();

  const metrics: AchievementMetric[] = Array.isArray(data.metrics)
    ? data.metrics.map((m: any, idx: number) => ({
        id: typeof m.id === 'string' && m.id ? m.id : `metric-${idx + 1}`,
        label: isValidLocalizedText(m.label) ? m.label : createEmptyLocalizedText(),
        value: typeof m.value === 'string' ? m.value : String(m.value || ''),
        unit: isValidLocalizedText(m.unit) ? m.unit : undefined,
        description: isValidLocalizedText(m.description) ? m.description : undefined,
      }))
    : [];

  let beforeAfter: AchievementBeforeAfter | null = null;
  if (data.beforeAfter && typeof data.beforeAfter === 'object') {
    const ba = data.beforeAfter;
    const beforeLoc = isValidLocalizedText(ba.before)
      ? ba.before
      : isValidLocalizedText(ba.beforeDescription)
      ? ba.beforeDescription
      : createEmptyLocalizedText();
    const afterLoc = isValidLocalizedText(ba.after)
      ? ba.after
      : isValidLocalizedText(ba.afterDescription)
      ? ba.afterDescription
      : createEmptyLocalizedText();
    beforeAfter = {
      before: beforeLoc,
      after: afterLoc,
      beforeImage: typeof ba.beforeImage === 'string' ? ba.beforeImage : null,
      afterImage: typeof ba.afterImage === 'string' ? ba.afterImage : null,
      beforeDescription: isValidLocalizedText(ba.beforeDescription) ? ba.beforeDescription : beforeLoc,
      afterDescription: isValidLocalizedText(ba.afterDescription) ? ba.afterDescription : afterLoc,
    };
  }

  let gallery: AchievementGalleryItem[] = [];
  if (Array.isArray(data.gallery)) {
    gallery = data.gallery
      .map((item: any, idx: number) => {
        if (typeof item === 'string') {
          return {
            id: `gallery-${idx + 1}`,
            imageSource: 'external' as const,
            image: item,
            alt: createEmptyLocalizedText(),
            position: 'center' as const,
          };
        }
        if (item && typeof item === 'object') {
          return {
            id: typeof item.id === 'string' && item.id ? item.id : `gallery-${idx + 1}`,
            imageSource: item.imageSource === 'managed' ? 'managed' : 'external',
            image: typeof item.image === 'string' ? item.image : null,
            imageAssetId: typeof item.imageAssetId === 'string' ? item.imageAssetId : null,
            alt: isValidLocalizedText(item.alt) ? item.alt : createEmptyLocalizedText(),
            caption: isValidLocalizedText(item.caption) ? item.caption : undefined,
            position: ['center', 'top', 'bottom', 'left', 'right'].includes(item.position)
              ? item.position
              : 'center',
          };
        }
        return null;
      })
      .filter((g): g is AchievementGalleryItem => g !== null);
  }

  let featuredImageStaging: StagedMediaReference | null = null;
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
        originalFileName:
          typeof s.originalFileName === 'string' ? s.originalFileName : 'image',
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
    summary,
    content,
    category,
    tags: Array.isArray(data.tags)
      ? data.tags.filter((t: any) => typeof t === 'string')
      : [],
    status,
    featured: Boolean(data.featured),
    achievementDate: typeof data.achievementDate === 'string' ? data.achievementDate : null,
    responsibleOffice,
    location: isValidLocalizedText(data.location) ? data.location : undefined,
    metrics,
    beforeAfter,
    gallery,
    featuredImageSource:
      data.featuredImageSource ||
      (data.featuredImageManaged ? 'managed' : featuredImageStaging ? 'external' : 'none'),
    featuredImage: typeof data.featuredImage === 'string' ? data.featuredImage : null,
    featuredImageAssetId:
      typeof data.featuredImageAssetId === 'string'
        ? data.featuredImageAssetId
        : data.featuredImageManaged?.mediaId || null,
    featuredImageManaged: data.featuredImageManaged || null,
    featuredImageStaging,
    imageAlt,
    imagePosition: ['center', 'top', 'bottom', 'left', 'right'].includes(data.imagePosition)
      ? data.imagePosition
      : 'center',
    createdAt: normalizeTimestampToISO(data.createdAt),
    updatedAt: normalizeTimestampToISO(data.updatedAt),
    publishedAt: normalizeTimestampToISO(data.publishedAt),
    createdByUid:
      typeof data.createdByUid === 'string'
        ? data.createdByUid
        : typeof data.createdBy === 'string'
        ? data.createdBy
        : '',
    createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : '',
    createdByName: typeof data.createdByName === 'string' ? data.createdByName : '',
    updatedByUid:
      typeof data.updatedByUid === 'string'
        ? data.updatedByUid
        : typeof data.updatedBy === 'string'
        ? data.updatedBy
        : '',
    updatedByEmail: typeof data.updatedByEmail === 'string' ? data.updatedByEmail : '',
    updatedByName: typeof data.updatedByName === 'string' ? data.updatedByName : '',
    publishedByUid: typeof data.publishedByUid === 'string' ? data.publishedByUid : null,
    publishedByEmail: typeof data.publishedByEmail === 'string' ? data.publishedByEmail : null,
    publishedByName: typeof data.publishedByName === 'string' ? data.publishedByName : null,
    submittedForReviewByUid:
      typeof data.submittedForReviewByUid === 'string'
        ? data.submittedForReviewByUid
        : null,
    submittedForReviewByEmail:
      typeof data.submittedForReviewByEmail === 'string'
        ? data.submittedForReviewByEmail
        : null,
    submittedForReviewByName:
      typeof data.submittedForReviewByName === 'string'
        ? data.submittedForReviewByName
        : null,
    submittedForReviewAt: normalizeTimestampToISO(data.submittedForReviewAt),
    statusBeforeTrash: validStatuses.includes(data.statusBeforeTrash)
      ? data.statusBeforeTrash
      : null,
    trashedAt: normalizeTimestampToISO(data.trashedAt),
    trashedByUid: typeof data.trashedByUid === 'string' ? data.trashedByUid : null,
    trashedByEmail: typeof data.trashedByEmail === 'string' ? data.trashedByEmail : null,
    trashedByName: typeof data.trashedByName === 'string' ? data.trashedByName : null,
    trashReason: typeof data.trashReason === 'string' ? data.trashReason : undefined,
    version: typeof data.version === 'number' ? data.version : 1,
  };
}

export function parseFirestoreError(error: any): AchievementServiceError {
  if (error instanceof AchievementServiceError) {
    return error;
  }
  const msg = error?.message || String(error);
  if (
    msg.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions')
  ) {
    return new AchievementServiceError(
      'PERMISSION_DENIED',
      'Permission denied: Your staff account or role lacks authorization for this operation.'
    );
  }
  if (msg.includes('not-found') || msg.includes('No document to update')) {
    return new AchievementServiceError(
      'ACHIEVEMENT_NOT_FOUND',
      'The requested achievement record was not found or has been removed.'
    );
  }
  if (msg.includes('already-exists')) {
    return new AchievementServiceError(
      'SLUG_ALREADY_EXISTS',
      'An achievement with this URL slug already exists in Firestore.'
    );
  }
  if (msg.includes('FAILED_PRECONDITION') || msg.includes('index')) {
    return new AchievementServiceError(
      'INDEX_REQUIRED',
      'The database query requires a composite index in firestore.indexes.json.'
    );
  }
  return new AchievementServiceError(
    'UNKNOWN_ACHIEVEMENT_ERROR',
    msg || 'An unexpected database error occurred.'
  );
}
