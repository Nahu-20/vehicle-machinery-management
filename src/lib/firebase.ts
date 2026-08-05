import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirebaseConfig, getFirebaseConfigStatus } from '../config/env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

const config = getFirebaseConfig();

if (config) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Connection validation as required by skill guidelines
    if (db) {
      getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (
          errMsg.includes('offline') ||
          errMsg.includes('unavailable') ||
          (error && typeof error === 'object' && 'code' in error && (error as any).code === 'unavailable')
        ) {
          console.warn('Firebase client is operating in offline or fallback mode.');
        } else {
          console.warn('Firebase connection test info:', errMsg);
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
