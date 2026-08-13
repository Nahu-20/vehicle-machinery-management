import { LocalizedText } from './news';
import { ManagedFeaturedImage, StagedMediaReference } from './media';

export type AlertStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'unpublished'
  | 'expired'
  | 'archived'
  | 'trashed';

export type AlertSeverity =
  | 'info'
  | 'advisory'
  | 'warning'
  | 'critical';

export type AlertCategory =
  | 'weather'
  | 'pest'
  | 'crop-disease'
  | 'livestock-disease'
  | 'input-supply'
  | 'irrigation'
  | 'market'
  | 'food-safety'
  | 'emergency'
  | 'general';

export interface AlertRecommendedAction {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface AlertGeographicTarget {
  regionWide: boolean;
  zones: string[];
  woredas: string[];
  kebeles?: string[];
}

export interface AlertSubjectTarget {
  crops: string[];
  livestock: string[];
  other?: string[];
}

export interface AgriculturalAlert {
  slug: string;

  title: LocalizedText;
  summary: LocalizedText;
  body: LocalizedText;

  category: AlertCategory;
  severity: AlertSeverity;

  status: AlertStatus;

  featured: boolean;
  pinned: boolean;

  geographicTarget: AlertGeographicTarget;
  subjectTarget: AlertSubjectTarget;

  recommendedActions: AlertRecommendedAction[];

  sourceOffice: LocalizedText;

  contactPhone?: string | null;
  contactEmail?: string | null;

  effectiveFrom: any; // Firestore Timestamp, ISO string, or Date
  expiresAt?: any | null; // Firestore Timestamp, ISO string, or Date

  featuredImageSource: 'external' | 'managed' | 'none';

  featuredImage?: string | null;
  featuredImageAssetId?: string | null;
  featuredImageManaged?: ManagedFeaturedImage | null;
  featuredImageStaging?: StagedMediaReference | null;

  imageAlt: LocalizedText;

  createdAt: any;
  updatedAt: any;
  publishedAt?: any | null;

  createdByUid: string;
  createdByEmail: string;
  createdByName: string;

  updatedByUid: string;
  updatedByEmail: string;
  updatedByName: string;

  publishedByUid?: string | null;
  publishedByEmail?: string | null;
  publishedByName?: string | null;

  statusBeforeTrash?: AlertStatus | null;

  trashedAt?: any | null;
  trashedByUid?: string | null;
  trashedByEmail?: string | null;
  trashedByName?: string | null;

  trashReason?: string | null;

  version: number;
}

export interface PublicAgriculturalAlert {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  body: LocalizedText;
  category: AlertCategory;
  severity: AlertSeverity;
  featured: boolean;
  pinned: boolean;
  geographicTarget: AlertGeographicTarget;
  subjectTarget: AlertSubjectTarget;
  recommendedActions: AlertRecommendedAction[];
  sourceOffice: LocalizedText;
  contactPhone?: string | null;
  contactEmail?: string | null;
  effectiveFrom: any;
  expiresAt?: any | null;
  featuredImage?: string | null;
  featuredImageManaged?: ManagedFeaturedImage | null;
  imageAlt: LocalizedText;
  publishedAt?: any | null;
}

export type AlertErrorCode =
  | 'ALERT_NOT_FOUND'
  | 'INVALID_ALERT'
  | 'INVALID_SLUG'
  | 'SLUG_ALREADY_EXISTS'
  | 'VERSION_CONFLICT'
  | 'PERMISSION_DENIED'
  | 'INVALID_STATUS_TRANSITION'
  | 'PUBLISH_VALIDATION_FAILED'
  | 'ALERT_EXPIRED'
  | 'INDEX_REQUIRED'
  | 'NETWORK_ERROR'
  | 'SERVICE_ERROR'
  | 'UNKNOWN_ALERT_ERROR';

export class AlertServiceError extends Error {
  public readonly code: AlertErrorCode;
  public readonly details?: unknown;

  constructor(code: AlertErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AlertServiceError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AlertServiceError.prototype);
  }
}

export interface AlertValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate alert slug format (lowercase alphanumeric and hyphens, 3-100 chars)
 */
export function validateAlertSlug(slug: string): AlertValidationResult {
  const errors: string[] = [];
  if (!slug || typeof slug !== 'string') {
    errors.push('Alert slug is required.');
  } else {
    const trimmed = slug.trim();
    if (trimmed.length < 3 || trimmed.length > 100) {
      errors.push('Slug must be between 3 and 100 characters long.');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
      errors.push('Slug must contain only lowercase letters, numbers, and single hyphens.');
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Helper to convert a timestamp value into milliseconds for time comparisons
 */
export function toMillis(val: any): number | null {
  if (!val) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? null : parsed;
  }
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'object' && typeof val.toMillis === 'function') {
    return val.toMillis();
  }
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return val.seconds * 1000;
  }
  return null;
}

/**
 * Check whether an alert is currently publicly active
 */
export function isAlertPubliclyActive(alert: AgriculturalAlert | PublicAgriculturalAlert, now: number = Date.now()): boolean {
  if ('status' in alert && alert.status !== 'published') {
    return false;
  }
  const effMs = toMillis(alert.effectiveFrom);
  if (effMs === null || effMs > now) {
    return false;
  }
  const expMs = toMillis(alert.expiresAt);
  if (expMs !== null && expMs <= now) {
    return false;
  }
  return true;
}

/**
 * Draft validation: allows incomplete content safely
 */
export function validateAlertDraft(alert: Partial<AgriculturalAlert>): AlertValidationResult {
  const errors: string[] = [];
  if (alert.slug) {
    const slugCheck = validateAlertSlug(alert.slug);
    if (!slugCheck.valid) {
      errors.push(...slugCheck.errors);
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Review validation: requires essential structure
 */
export function validateAlertForReview(alert: Partial<AgriculturalAlert>): AlertValidationResult {
  const errors: string[] = [];

  // Slug check
  if (!alert.slug) {
    errors.push('Alert slug is required for review.');
  } else {
    const slugCheck = validateAlertSlug(alert.slug);
    if (!slugCheck.valid) {
      errors.push(...slugCheck.errors);
    }
  }

  // Localized title (Afaan Oromo required)
  const titleOm = alert.title?.om?.trim();
  if (!titleOm) {
    errors.push('Title in Afaan Oromo (om) is required for review.');
  }

  // Localized summary (Afaan Oromo required)
  const summaryOm = alert.summary?.om?.trim();
  if (!summaryOm) {
    errors.push('Summary in Afaan Oromo (om) is required for review.');
  }

  // Localized body (Afaan Oromo required)
  const bodyOm = alert.body?.om?.trim();
  if (!bodyOm) {
    errors.push('Body in Afaan Oromo (om) is required for review.');
  }

  // Category
  const validCategories: AlertCategory[] = [
    'weather',
    'pest',
    'crop-disease',
    'livestock-disease',
    'input-supply',
    'irrigation',
    'market',
    'food-safety',
    'emergency',
    'general',
  ];
  if (!alert.category || !validCategories.includes(alert.category)) {
    errors.push('A valid alert category is required for review.');
  }

  // Severity
  const validSeverities: AlertSeverity[] = ['info', 'advisory', 'warning', 'critical'];
  if (!alert.severity || !validSeverities.includes(alert.severity)) {
    errors.push('A valid alert severity level is required for review.');
  }

  // Source Office
  const officeOm = alert.sourceOffice?.om?.trim();
  if (!officeOm) {
    errors.push('Source office in Afaan Oromo is required for review.');
  }

  // EffectiveFrom
  if (!alert.effectiveFrom) {
    errors.push('Effective date (effectiveFrom) is required for review.');
  }

  // Geographic targeting
  if (!alert.geographicTarget) {
    errors.push('Geographic target configuration is required for review.');
  } else {
    const geo = alert.geographicTarget;
    if (!geo.regionWide && (!geo.zones || geo.zones.length === 0) && (!geo.woredas || geo.woredas.length === 0)) {
      errors.push('Geographic target must specify regionWide=true or include at least one zone or woreda.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Publication validation: strict rules for public exposure
 */
export function validateAlertForPublishing(alert: Partial<AgriculturalAlert>): AlertValidationResult {
  const reviewResult = validateAlertForReview(alert);
  const errors = [...reviewResult.errors];

  // Dates check
  const effMs = toMillis(alert.effectiveFrom);
  if (effMs === null) {
    errors.push('Effective date (effectiveFrom) must be a valid date/timestamp.');
  }

  const expMs = toMillis(alert.expiresAt);
  if (expMs !== null && effMs !== null) {
    if (expMs <= effMs) {
      errors.push('Expiration date (expiresAt) must be strictly after effective date (effectiveFrom).');
    }
  }

  // Recommended actions requirement for elevated risk
  if (alert.severity === 'warning' || alert.severity === 'critical') {
    if (!alert.recommendedActions || !Array.isArray(alert.recommendedActions) || alert.recommendedActions.length === 0) {
      errors.push(`At least one recommended action is required for alerts with severity "${alert.severity}".`);
    }
  }

  // Validate recommended actions max 10 & unique IDs
  if (alert.recommendedActions && Array.isArray(alert.recommendedActions)) {
    if (alert.recommendedActions.length > 10) {
      errors.push('Maximum of 10 recommended actions allowed per alert.');
    }
    const ids = new Set<string>();
    for (const action of alert.recommendedActions) {
      if (!action.id || typeof action.id !== 'string') {
        errors.push('Each recommended action must have a valid ID string.');
      } else if (ids.has(action.id)) {
        errors.push(`Duplicate recommended action ID found: "${action.id}".`);
      } else {
        ids.add(action.id);
      }

      const actionTitleOm = action.title?.om?.trim();
      if (!actionTitleOm) {
        errors.push('Each recommended action title in Afaan Oromo is required.');
      }
    }
  }

  // Contact fields format validation if provided
  if (alert.contactEmail && typeof alert.contactEmail === 'string' && alert.contactEmail.trim().length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alert.contactEmail.trim())) {
      errors.push('Contact email format is invalid.');
    }
  }

  if (alert.contactPhone && typeof alert.contactPhone === 'string' && alert.contactPhone.trim().length > 0) {
    if (!/^\+?[0-9\s-]{7,20}$/.test(alert.contactPhone.trim())) {
      errors.push('Contact phone format is invalid.');
    }
  }

  // Image validation if managed or external
  if (alert.featuredImageSource === 'external') {
    if (!alert.featuredImage || typeof alert.featuredImage !== 'string' || !alert.featuredImage.trim().startsWith('https://')) {
      errors.push('External featured image must be a valid https:// URL.');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateAgriculturalAlert(alert: Partial<AgriculturalAlert>, isPublishing: boolean = false): AlertValidationResult {
  if (isPublishing) {
    return validateAlertForPublishing(alert);
  }
  return validateAlertForReview(alert);
}

/**
 * DTO Converter: Strip sensitive internal fields before public exposure
 */
export function toPublicAlert(alert: AgriculturalAlert): PublicAgriculturalAlert {
  return {
    slug: alert.slug,
    title: alert.title,
    summary: alert.summary,
    body: alert.body,
    category: alert.category,
    severity: alert.severity,
    featured: Boolean(alert.featured),
    pinned: Boolean(alert.pinned),
    geographicTarget: alert.geographicTarget || { regionWide: true, zones: [], woredas: [] },
    subjectTarget: alert.subjectTarget || { crops: [], livestock: [] },
    recommendedActions: alert.recommendedActions || [],
    sourceOffice: alert.sourceOffice,
    contactPhone: alert.contactPhone || null,
    contactEmail: alert.contactEmail || null,
    effectiveFrom: alert.effectiveFrom,
    expiresAt: alert.expiresAt || null,
    featuredImage: alert.featuredImage || null,
    featuredImageManaged: alert.featuredImageManaged || null,
    imageAlt: alert.imageAlt || { om: '', am: '', en: '' },
    publishedAt: alert.publishedAt || null,
  };
}
