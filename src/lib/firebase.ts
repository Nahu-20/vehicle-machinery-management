import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirebaseConfig, getFirebaseConfigStatus } from '../config/env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
let storageEmulatorConnected = false;
let functionsEmulatorConnected = false;

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

    // Initialize Firestore with forceLongPolling to work reliably and instantly in iframe/proxy sandbox environments
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
      });
    } catch {
      db = getFirestore(app);
    }

    try {
      functions = getFunctions(app, 'us-central1');
      if (typeof window !== 'undefined' && !functionsEmulatorConnected) {
        // Point callable functions to current window origin (or emulator if dev)
        const host = window.location.hostname;
        const port = window.location.port ? parseInt(window.location.port, 10) : (window.location.protocol === 'https:' ? 443 : 80);
        connectFunctionsEmulator(functions, host, port);
        functionsEmulatorConnected = true;
      }
    } catch (funcErr) {
      console.warn('[Firebase Functions] Initialization warning:', funcErr);
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

export { app, auth, db, storage, functions };

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
