/**
 * Sanitizes an uploaded filename for safe display and metadata storage.
 * Note: Never use sanitized filenames as Firebase Storage object keys.
 */
export function sanitizeMediaFileName(fileName: string | null | undefined): string {
  if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
    return 'image';
  }

  // 1. Remove path prefixes (both POSIX / and Windows \)
  let name = fileName.replace(/^.*[\\/]/, '');

  // 2. Remove null bytes and control characters (ASCII 0-31, 127)
  // eslint-disable-next-line no-control-regex
  name = name.replace(/[\x00-\x1F\x7F]/g, '');

  // 3. Remove slashes and backslashes if any remained
  name = name.replace(/[/\\]/g, '');

  // 4. Extract Extension safely
  const lastDot = name.lastIndexOf('.');
  let ext = '';
  let baseName = name;

  if (lastDot > 0 && lastDot < name.length - 1) {
    baseName = name.substring(0, lastDot);
    ext = name.substring(lastDot + 1).toLowerCase().trim();
  }

  // Sanitize extension - allow alphanumeric only, max 10 chars
  ext = ext.replace(/[^a-z0-9]/g, '');
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    // If unknown or empty, clear extension (or keep if simple alphanumeric)
    if (ext.length > 8) ext = '';
  }

  // 5. Sanitize baseName: keep safe alphanumeric, spaces, hyphens, underscores
  baseName = baseName.replace(/[^a-zA-Z0-9_\-\s]/g, '');

  // 6. Collapse repeated whitespace
  baseName = baseName.replace(/\s+/g, ' ').trim();

  // 7. Fall back to 'image' if baseName is empty
  if (!baseName || baseName.length === 0) {
    baseName = 'image';
  }

  // 8. Limit length to max 180 chars including extension
  const maxBaseLen = ext ? 180 - ext.length - 1 : 180;
  if (baseName.length > maxBaseLen) {
    baseName = baseName.substring(0, maxBaseLen).trim();
  }

  return ext ? `${baseName}.${ext}` : baseName;
}
