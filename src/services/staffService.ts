import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  StaffUser,
  SupportedLanguage,
  validateStaffProfile,
  StaffProfileValidationResult,
} from '../types/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Operation Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface NormalizedFirestoreError {
  errorStatus: 'authorizationError' | 'serviceError';
  code: string;
  message: string;
}

export function normalizeFirestoreError(error: any): NormalizedFirestoreError {
  const code = error?.code || '';
  const msg = error?.message || String(error || '');

  if (
    code === 'permission-denied' ||
    msg.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions')
  ) {
    return {
      errorStatus: 'authorizationError',
      code: 'permission-denied',
      message: 'Firestore permission denied: Your account lacks authorization to read staffUsers/{uid}.',
    };
  }

  if (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    msg.includes('unavailable') ||
    msg.includes('network') ||
    msg.includes('offline')
  ) {
    return {
      errorStatus: 'serviceError',
      code: code || 'unavailable',
      message: 'Firestore service unavailable or network connection failed.',
    };
  }

  return {
    errorStatus: 'serviceError',
    code: code || 'unknown_error',
    message: msg || 'An unexpected database service error occurred.',
  };
}

/**
 * Subscribe in real-time to a staff profile in Firestore (staffUsers/{uid}).
 *
 * Real-time updates ensure that disabling a staff user or changing their role
 * takes effect immediately in the app without requiring a manual page refresh.
 */
export function subscribeToStaffProfile(
  uid: string,
  onUpdate: (result: StaffProfileValidationResult) => void,
  onError: (err: NormalizedFirestoreError) => void
): Unsubscribe {
  if (!uid) {
    onUpdate({
      valid: false,
      errorStatus: 'profileMissing',
      errorMessage: 'No authenticated UID provided.',
    });
    return () => {};
  }

  const path = `staffUsers/${uid}`;
  const docRef = doc(db, path);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate({
          valid: false,
          errorStatus: 'profileMissing',
          errorMessage: `No staff profile document found in Firestore at staffUsers/${uid}.`,
        });
        return;
      }

      const data = snapshot.data();
      const validation = validateStaffProfile(data, uid);
      onUpdate(validation);
    },
    (error) => {
      console.warn(`[staffService] Real-time subscription error at ${path}:`, error);
      const normalized = normalizeFirestoreError(error);
      onError(normalized);
    }
  );
}

/**
 * Fetch a staff profile once by UID.
 */
export function getStaffProfile(uid: string): Promise<StaffProfileValidationResult> {
  const path = `staffUsers/${uid}`;
  const docRef = doc(db, path);

  return getDoc(docRef)
    .then((snapshot) => {
      if (!snapshot.exists()) {
        return {
          valid: false,
          errorStatus: 'profileMissing' as const,
          errorMessage: `No staff profile document found at staffUsers/${uid}.`,
        };
      }
      return validateStaffProfile(snapshot.data(), uid);
    })
    .catch((error) => {
      console.warn(`[staffService] Error fetching staff profile at ${path}:`, error?.message || error);
      const normalized = normalizeFirestoreError(error);
      return {
        valid: false,
        errorStatus: normalized.errorStatus,
        errorMessage: normalized.message,
      };
    });
}

/**
 * Allow staff members to update ONLY their own preferred UI language.
 * Role, active status, UID, and email remain strictly protected.
 */
export function updateOwnPreferredLanguage(
  uid: string,
  language: SupportedLanguage
): Promise<void> {
  const path = `staffUsers/${uid}`;
  const docRef = doc(db, path);

  return updateDoc(docRef, {
    preferredLanguage: language,
    updatedAt: serverTimestamp(),
  }).catch((error) => {
    handleFirestoreError(error, OperationType.UPDATE, path);
  });
}
