import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  StaffUser,
  StaffRole,
  SupportedLanguage,
  validateStaffProfile,
  StaffProfileValidationResult,
} from '../types/auth';
import { VALID_STAFF_ROLES } from '../auth/permissions';

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

function mapStaffDoc(uid: string, data: Record<string, any>): StaffUser {
  return {
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    role: data.role as StaffRole,
    active: data.active === true,
    preferredLanguage: (data.preferredLanguage as SupportedLanguage) || 'om',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastLoginAt: data.lastLoginAt,
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

/** List all staff profiles. Firestore rules allow list for superAdmin only. */
export async function listStaffUsers(): Promise<StaffUser[]> {
  if (!db) throw new Error('Firestore is not initialized');
  if (!auth?.currentUser) throw new Error('Sign in required');

  try {
    const snap = await getDocs(collection(db, 'staffUsers'));
    return snap.docs
      .map((d) => mapStaffDoc(d.id, d.data() as Record<string, any>))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch (error) {
    const normalized = normalizeFirestoreError(error);
    throw new Error(normalized.message);
  }
}

export interface ProvisionStaffInput {
  uid: string;
  email: string;
  displayName: string;
  role: StaffRole;
  preferredLanguage?: SupportedLanguage;
  active?: boolean;
}

function assertValidProvisionInput(input: ProvisionStaffInput): void {
  const uid = input.uid.trim();
  if (!uid || uid.length < 10) {
    throw new Error('Firebase Auth UID is required (paste the Auth user UID).');
  }
  const email = input.email.trim().toLowerCase();
  if (!email.includes('@')) throw new Error('A valid email is required.');
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error('Display name is required.');
  if (!VALID_STAFF_ROLES.includes(input.role)) {
    throw new Error(`Unrecognized role: ${input.role}`);
  }
}

/**
 * Create or overwrite a staffUsers/{uid} profile.
 * Does NOT create the Firebase Auth account — create that in Console first,
 * then provision the matching Firestore profile here.
 */
export async function provisionStaffProfile(input: ProvisionStaffInput): Promise<StaffUser> {
  if (!db) throw new Error('Firestore is not initialized');
  if (!auth?.currentUser) throw new Error('Sign in required');
  assertValidProvisionInput(input);

  const uid = input.uid.trim();
  const now = serverTimestamp();
  const existing = await getDoc(doc(db, 'staffUsers', uid));

  const profile = {
    uid,
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName.trim(),
    role: input.role,
    active: input.active !== false,
    preferredLanguage: input.preferredLanguage || ('om' as SupportedLanguage),
    createdAt: existing.exists() ? existing.data()?.createdAt || now : now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'staffUsers', uid), profile, { merge: true });
  return mapStaffDoc(uid, {
    ...profile,
    createdAt: existing.data()?.createdAt,
    updatedAt: new Date().toISOString(),
  });
}

export interface UpdateStaffInput {
  displayName?: string;
  role?: StaffRole;
  active?: boolean;
  preferredLanguage?: SupportedLanguage;
  email?: string;
}

/**
 * SuperAdmin update of another staff profile (role / active / name).
 * Guards against self-lockout and demoting the last active superAdmin.
 */
export async function updateStaffProfile(
  actor: StaffUser,
  targetUid: string,
  patch: UpdateStaffInput,
  allStaffSnapshot: StaffUser[]
): Promise<StaffUser> {
  if (!db) throw new Error('Firestore is not initialized');
  if (!auth?.currentUser) throw new Error('Sign in required');
  if (actor.role !== 'superAdmin') {
    throw new Error('Only superAdmin can change staff roles or active status.');
  }

  const targetRef = doc(db, 'staffUsers', targetUid);
  const snap = await getDoc(targetRef);
  if (!snap.exists()) throw new Error(`No staff profile at staffUsers/${targetUid}`);

  const current = mapStaffDoc(targetUid, snap.data() as Record<string, any>);
  const nextRole = patch.role ?? current.role;
  const nextActive = typeof patch.active === 'boolean' ? patch.active : current.active;

  if (targetUid === actor.uid) {
    if (nextRole !== 'superAdmin') {
      throw new Error('You cannot demote your own superAdmin role.');
    }
    if (nextActive === false) {
      throw new Error('You cannot deactivate your own account.');
    }
  }

  if (current.role === 'superAdmin' && (nextRole !== 'superAdmin' || nextActive === false)) {
    const otherActiveSuperAdmins = allStaffSnapshot.filter(
      (s) => s.uid !== targetUid && s.role === 'superAdmin' && s.active
    );
    if (otherActiveSuperAdmins.length === 0) {
      throw new Error('Cannot remove the last active superAdmin.');
    }
  }

  if (patch.role && !VALID_STAFF_ROLES.includes(patch.role)) {
    throw new Error(`Unrecognized role: ${patch.role}`);
  }

  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (typeof patch.displayName === 'string') {
    const name = patch.displayName.trim();
    if (!name) throw new Error('Display name cannot be empty.');
    updates.displayName = name;
  }
  if (typeof patch.email === 'string') {
    const email = patch.email.trim().toLowerCase();
    if (!email.includes('@')) throw new Error('Invalid email.');
    updates.email = email;
  }
  if (patch.role) updates.role = patch.role;
  if (typeof patch.active === 'boolean') updates.active = patch.active;
  if (patch.preferredLanguage) updates.preferredLanguage = patch.preferredLanguage;

  await updateDoc(targetRef, updates);

  return {
    ...current,
    displayName: (updates.displayName as string) || current.displayName,
    email: (updates.email as string) || current.email,
    role: nextRole,
    active: nextActive,
    preferredLanguage: (updates.preferredLanguage as SupportedLanguage) || current.preferredLanguage,
    updatedAt: new Date().toISOString(),
  };
}
