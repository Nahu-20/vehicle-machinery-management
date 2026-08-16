import { MediaUploadError } from '../types/media';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

/**
 * Checks if a string is a valid UUID (v4/v1-v5 compliant).
 */
export function isValidUuid(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  return UUID_REGEX.test(uuid.trim());
}

/**
 * Generates a standard UUID v4.
 */
export function generateMediaId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is not present
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Builds and validates a private staging path for media uploads.
 * Output: media/staging/{uid}/{mediaId}
 */
export function buildStagingMediaPath(uid: string, mediaId: string): string {
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new MediaUploadError(
      'invalid-file',
      'Path validation failed: User ID cannot be empty.'
    );
  }

  if (!mediaId || typeof mediaId !== 'string' || mediaId.trim().length === 0) {
    throw new MediaUploadError(
      'invalid-file',
      'Path validation failed: Media ID cannot be empty.'
    );
  }

  const cleanUid = uid.trim();
  const cleanMediaId = mediaId.trim();

  // Validate for null bytes or control characters
  // eslint-disable-next-line no-control-regex
  const hasControlChars = /[\x00-\x1F\x7F]/.test(cleanUid) || /[\x00-\x1F\x7F]/.test(cleanMediaId);
  if (hasControlChars) {
    throw new MediaUploadError(
      'invalid-file',
      'Path validation failed: Path components contain control characters or null bytes.'
    );
  }

  // Reject slashes, backslashes
  if (
    cleanUid.includes('/') ||
    cleanUid.includes('\\') ||
    cleanMediaId.includes('/') ||
    cleanMediaId.includes('\\')
  ) {
    throw new MediaUploadError(
      'invalid-file',
      'Path validation failed: Slashes and backslashes are forbidden in path parameters.'
    );
  }

  // Reject path traversal segments "." or ".." or relative directory components
  if (
    cleanUid === '.' ||
    cleanUid === '..' ||
    cleanMediaId === '.' ||
    cleanMediaId === '..' ||
    cleanUid.includes('..') ||
    cleanMediaId.includes('..')
  ) {
    throw new MediaUploadError(
      'invalid-file',
      'Path validation failed: Path traversal sequences are forbidden.'
    );
  }

  // Validate mediaId format strictly as UUID
  if (!isValidUuid(cleanMediaId)) {
    throw new MediaUploadError(
      'invalid-file',
      `Path validation failed: Media ID must be a valid UUID. Received: '${cleanMediaId}'`
    );
  }

  return `media/staging/${cleanUid}/${cleanMediaId}`;
}
