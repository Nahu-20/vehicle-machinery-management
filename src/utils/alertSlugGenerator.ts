import { LocalizedText } from '../types/news';
import { validateAlertSlug } from '../types/agriculturalAlert';

/**
 * Normalizes an arbitrary text string into a clean, URL-safe slug.
 * Rules:
 * - trim whitespace
 * - lowercase Latin characters
 * - normalize repeated whitespace
 * - convert spaces to hyphens
 * - remove unsupported punctuation
 * - collapse repeated hyphens
 * - remove leading/trailing hyphens
 * - reject slash and backslash
 * - reject "." and ".."
 * - max length 90 chars (to leave room for -2, -3 suffixes)
 */
export function normalizeSlugString(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let str = input.trim().toLowerCase();

  // Normalize Unicode diacritics where possible
  try {
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    // ignore if normalize NFD unsupported
  }

  // Replace slashes, backslashes, periods with spaces or empty
  str = str.replace(/[/\\]/g, ' ').replace(/\.+/g, '');

  // Convert non-alphanumeric characters (excluding hyphens and spaces) to empty
  str = str.replace(/[^a-z0-9\s-]/g, '');

  // Convert spaces and underscores to single hyphens
  str = str.replace(/[\s_]+/g, '-');

  // Collapse multiple hyphens
  str = str.replace(/-+/g, '-');

  // Strip leading and trailing hyphens
  str = str.replace(/^-+|-+$/g, '');

  // Enforce max length of 90
  if (str.length > 90) {
    str = str.slice(0, 90).replace(/-+$/g, '');
  }

  return str;
}

/**
 * Generates a safe, non-empty fallback slug when localized text cannot produce
 * a valid Latin slug (e.g. pure Ethiopic script or empty title).
 * Example output: "alert-20260808-a1b2c3"
 */
export function generateFallbackAlertSlug(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = Math.random().toString(36).substring(2, 8);
  return `alert-${dateStr}-${randomHex}`;
}

export function generateUniqueSlugSuffix(): string {
  return Math.random().toString(36).substring(2, 6);
}

/**
 * Derives a candidate slug from a localized title object according to the strict priority policy:
 * 1. Afaan Oromo title (`title.om`)
 * 2. English title (`title.en`)
 * 3. Amharic title (`title.am`)
 *
 * Appends a unique identifier suffix to ensure a unique identifier for any generation.
 */
export function generateAlertSlugCandidate(
  title: LocalizedText | string,
  providedSuffix?: string
): string {
  let rawText = '';

  if (typeof title === 'string') {
    rawText = title;
  } else if (title && typeof title === 'object') {
    const omText = title.om?.trim() || '';
    const enText = title.en?.trim() || '';
    const amText = title.am?.trim() || '';

    rawText = omText || enText || amText;
  }

  const normalized = normalizeSlugString(rawText);

  if (!normalized) {
    return generateFallbackAlertSlug();
  }

  const suffix = providedSuffix || generateUniqueSlugSuffix();
  const candidate = appendSlugSuffix(normalized, suffix);

  // Validate candidate slug
  const validation = validateAlertSlug(candidate);

  if (validation.valid) {
    return candidate;
  }

  return generateFallbackAlertSlug();
}

/**
 * Derives a candidate slug with a suffix (integer or alphanumeric) for duplicate resolution or uniqueness.
 * e.g., "heavy-rain-fall" + "2" -> "heavy-rain-fall-2"
 * e.g., "heavy-rain-fall" + "x7k9" -> "heavy-rain-fall-x7k9"
 */
export function appendSlugSuffix(baseSlug: string, suffix: number | string): string {
  const cleanBase = normalizeSlugString(baseSlug) || 'alert';
  const suffixed = `${cleanBase}-${suffix}`;
  if (suffixed.length > 100) {
    const truncatedBase = cleanBase.slice(0, 100 - (`-${suffix}`).length).replace(/-+$/g, '');
    return `${truncatedBase}-${suffix}`;
  }
  return suffixed;
}
