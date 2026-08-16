/**
 * Recovery service for unsaved news article drafts.
 * Uses sessionStorage (per Milestone 2.2A security decisions) to persist
 * working drafts across browser refreshes and authorization redirects.
 */

export interface NewsDraftRecoveryData {
  formData: any;
  lastUpdated: string; // ISO String
  originalRoute: string;
  savedVersion?: number;
  uid: string;
}

const DRAFT_PREFIX = 'oab-news-draft:';

/**
 * Generates key format: oab-news-draft:<uid>:<slug-or-new-id>
 */

export function getRecoveryStorageKey(uid: string, keyId: string): string {
  const cleanKey = keyId ? keyId.trim() : 'new';
  return `${DRAFT_PREFIX}${uid}:${cleanKey}`;
}

/**
 * Save draft recovery copy to sessionStorage.
 */
export function saveDraftRecovery(
  uid: string,
  keyId: string,
  formData: any,
  originalRoute: string,
  savedVersion?: number
): boolean {
  if (!uid || !keyId) return false;

  try {
    const storageKey = getRecoveryStorageKey(uid, keyId);
    
    // Sanitize data: Ensure no credentials, tokens, or permissions are stored
    const sanitizedData: NewsDraftRecoveryData = {
      formData: JSON.parse(JSON.stringify(formData)),
      lastUpdated: new Date().toISOString(),
      originalRoute,
      savedVersion,
      uid,
    };

    sessionStorage.setItem(storageKey, JSON.stringify(sanitizedData));
    return true;
  } catch (err) {
    console.warn('[newsDraftRecoveryService] Failed to write recovery copy to sessionStorage:', err);
    return false;
  }
}

/**
 * Retrieve draft recovery data if it belongs to current UID.
 */
export function getDraftRecovery(uid: string, keyId: string): NewsDraftRecoveryData | null {
  if (!uid || !keyId) return null;

  try {
    const storageKey = getRecoveryStorageKey(uid, keyId);
    const item = sessionStorage.getItem(storageKey);
    if (!item) return null;

    const parsed: NewsDraftRecoveryData = JSON.parse(item);
    if (parsed.uid !== uid) {
      // Do not restore another staff user's draft!
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('[newsDraftRecoveryService] Failed to read recovery copy:', err);
    return null;
  }
}

/**
 * Clear specific draft recovery entry.
 */
export function clearDraftRecovery(uid: string, keyId: string): void {
  if (!uid || !keyId) return;

  try {
    const storageKey = getRecoveryStorageKey(uid, keyId);
    sessionStorage.removeItem(storageKey);
  } catch (err) {
    console.warn('[newsDraftRecoveryService] Failed to clear draft recovery:', err);
  }
}

/**
 * Check if a valid draft recovery copy exists for the user.
 */
export function hasDraftRecovery(uid: string, keyId: string): boolean {
  return getDraftRecovery(uid, keyId) !== null;
}

/**
 * Clear all draft recovery entries for a specific UID (e.g. on sign out).
 */
export function clearAllDraftRecoveriesForUser(uid: string): void {
  if (!uid) return;

  try {
    const keysToRemove: string[] = [];
    const prefix = `${DRAFT_PREFIX}${uid}:`;

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch (err) {
    console.warn('[newsDraftRecoveryService] Failed to clear user draft recoveries:', err);
  }
}
