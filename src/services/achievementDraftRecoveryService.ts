/**
 * Recovery service for unsaved achievement drafts.
 * Uses sessionStorage to persist working drafts across browser refreshes.
 */

export interface AchievementDraftRecoveryData {
  formData: any;
  lastUpdated: string; // ISO String
  originalRoute: string;
  savedVersion?: number;
  uid: string;
}

const DRAFT_PREFIX = 'oab-achievement-draft:';

export function getRecoveryStorageKey(uid: string, keyId: string): string {
  const cleanKey = keyId ? keyId.trim() : 'new';
  return `${DRAFT_PREFIX}${uid}:${cleanKey}`;
}

export function saveAchievementDraftRecovery(
  uid: string,
  keyId: string,
  formData: any,
  originalRoute: string,
  savedVersion?: number
): boolean {
  if (!uid || !keyId) return false;

  try {
    const storageKey = getRecoveryStorageKey(uid, keyId);
    const sanitizedData: AchievementDraftRecoveryData = {
      formData: JSON.parse(JSON.stringify(formData)),
      lastUpdated: new Date().toISOString(),
      originalRoute,
      savedVersion,
      uid,
    };

    sessionStorage.setItem(storageKey, JSON.stringify(sanitizedData));
    return true;
  } catch (err) {
    console.warn('[achievementDraftRecoveryService] Failed to write recovery copy:', err);
    return false;
  }
}

export function getAchievementDraftRecovery(uid: string, keyId: string): AchievementDraftRecoveryData | null {
  if (!uid || !keyId) return null;

  try {
    const storageKey = getRecoveryStorageKey(uid, keyId);
    const item = sessionStorage.getItem(storageKey);
    if (!item) return null;

    const parsed: AchievementDraftRecoveryData = JSON.parse(item);
    if (parsed.uid !== uid) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('[achievementDraftRecoveryService] Failed to read recovery copy:', err);
    return null;
  }
}

export function clearAchievementDraftRecovery(uid: string, keyId: string): void {
  if (!uid || !keyId) return;

  try {
    const storageKey = getRecoveryStorageKey(uid, keyId);
    sessionStorage.removeItem(storageKey);
  } catch (err) {
    console.warn('[achievementDraftRecoveryService] Failed to clear draft recovery:', err);
  }
}

export function hasAchievementDraftRecovery(uid: string, keyId: string): boolean {
  return getAchievementDraftRecovery(uid, keyId) !== null;
}
