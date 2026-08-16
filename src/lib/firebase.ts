import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getFirebaseConfig, getFirebaseConfigStatus } from '../config/env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let storageEmulatorConnected = false;

const config = getFirebaseConfig();

if (config) {
  try {
    const appConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.firebaseStorageBucket || undefined,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    };

    app = getApps().length > 0 ? getApp() : initializeApp(appConfig);
    auth = getAuth(app);

    // Initialize Firestore with autoDetectLongPolling to work reliably in iframe/proxy environments
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      });
    } catch {
      db = getFirestore(app);
    }

    // Initialize Storage safely only if firebaseStorageBucket is configured
    if (config.firebaseStorageBucket) {
      try {
        storage = getStorage(app);

        // Optional Storage emulator connection
        if (
          storage &&
          !storageEmulatorConnected &&
          import.meta.env?.VITE_USE_FIREBASE_EMULATOR === 'true' &&
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ) {
          try {
            connectStorageEmulator(storage, '127.0.0.1', 9199);
            storageEmulatorConnected = true;
            if (import.meta.env?.DEV) {
              console.info('[Firebase Storage] Connected to Storage emulator at 127.0.0.1:9199');
            }
          } catch (emulatorErr) {
            console.warn('[Firebase Storage] Emulator connection skipped or failed:', emulatorErr);
          }
        }
      } catch (storageErr) {
        console.warn('Firebase Storage initialization warning:', storageErr);
        storage = null;
      }
    } else {
      storage = null;
    }

    // Non-blocking connection validation
    if (db) {
      getDoc(doc(db, 'test', 'connection'))
        .then(() => {
          if (import.meta.env?.DEV) {
            console.info('[Firestore] Connected successfully to Cloud Firestore.');
          }
        })
        .catch((error) => {
          const errMsg = error instanceof Error ? error.message : String(error);
          if (
            errMsg.includes('offline') ||
            errMsg.includes('unavailable') ||
            errMsg.includes('timeout') ||
            errMsg.includes('failed-precondition') ||
            (error && typeof error === 'object' && 'code' in error && (error as any).code === 'unavailable')
          ) {
            console.info('[Firestore] Operating in offline/cached fallback mode.');
          }
        });
    }
  } catch (err) {
    console.error('Failed to initialize Firebase SDK:', err);
  }
} else {
  const status = getFirebaseConfigStatus();
  console.info(
    `Firebase environment variables not set. Missing: ${status.missingKeys.join(', ')}. Administrative features will run in demonstration mode.`
  );
}

// Development-only diagnostic for Firebase Storage
export interface StorageDiagnostic {
  projectId: string | null;
  storageBucket: string | null;
  storageConfigured: boolean;
  storageInitialized: boolean;
  storageEmulatorEnabled: boolean;
}

export const getStorageDiagnostic = (): StorageDiagnostic => {
  const currentConfig = getFirebaseConfig();
  const bucket = currentConfig?.firebaseStorageBucket || currentConfig?.storageBucket || null;
  const isConfigured = Boolean(bucket && bucket.trim().length > 0);
  const isInitialized = storage !== null;
  const emulatorEnabled =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    import.meta.env?.VITE_USE_FIREBASE_EMULATOR === 'true';

  return {
    projectId: currentConfig?.projectId || null,
    storageBucket: bucket && bucket.length > 0 ? bucket : null,
    storageConfigured: isConfigured,
    storageInitialized: isInitialized,
    storageEmulatorEnabled: emulatorEnabled,
  };
};

if (import.meta.env?.DEV) {
  const diag = getStorageDiagnostic();
  console.info('[Firebase Storage Diagnostic]', diag);
}

export { app, auth, db, storage };

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
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
