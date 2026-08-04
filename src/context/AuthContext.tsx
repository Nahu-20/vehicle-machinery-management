import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { StaffUser, StaffRole } from '../types/auth';
import { isFirebaseConfigured as checkFirebaseConfigured } from '../config/env';

export type AuthStatus =
  | 'loading'
  | 'signedOut'
  | 'authorized'
  | 'noProfile'
  | 'inactive'
  | 'unknownRole'
  | 'demoAuthorized';

export interface AuthContextType {
  user: User | null;
  firebaseUser: User | null;
  staffUser: StaffUser | null;
  status: AuthStatus;
  loading: boolean;
  error: string | null;
  authError: string | null;
  isFirebaseConfigured: boolean;
  isFirebaseReady: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
  signInDemoUser: (role?: StaffRole) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ROLES: StaffRole[] = [
  'superAdmin',
  'contentAdmin',
  'editor',
  'marketOfficer',
  'advisoryOfficer',
];

const DEMO_STAFF_USERS: Record<StaffRole, StaffUser> = {
  superAdmin: {
    uid: 'demo-superadmin-001',
    email: 'admin@oromiaagri.gov.et',
    displayName: 'Dr. Chala Gudina',
    role: 'superAdmin',
    active: true,
    preferredLanguage: 'om',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  contentAdmin: {
    uid: 'demo-contentadmin-002',
    email: 'content.admin@oromiaagri.gov.et',
    displayName: 'Hawani Bekele',
    role: 'contentAdmin',
    active: true,
    preferredLanguage: 'om',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  editor: {
    uid: 'demo-editor-003',
    email: 'editor@oromiaagri.gov.et',
    displayName: 'Abebe Tadesse',
    role: 'editor',
    active: true,
    preferredLanguage: 'am',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  marketOfficer: {
    uid: 'demo-market-004',
    email: 'market@oromiaagri.gov.et',
    displayName: 'Bontu Tola',
    role: 'marketOfficer',
    active: true,
    preferredLanguage: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  advisoryOfficer: {
    uid: 'demo-advisory-005',
    email: 'advisory@oromiaagri.gov.et',
    displayName: 'Kelo Feyissa',
    role: 'advisoryOfficer',
    active: true,
    preferredLanguage: 'om',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFirebaseConfigured = checkFirebaseConfigured();
  const isFirebaseReady = isFirebaseConfigured && !!auth;

  const fetchStaffProfile = async (user: User) => {
    if (!db) {
      setStaffUser(null);
      setStatus('noProfile');
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'staffUsers', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // SECURITY DECISION: Never auto-create staffUsers/{uid} during authentication.
        // Missing staff profile must remain unauthorized!
        setStaffUser(null);
        setStatus('noProfile');
        setLoading(false);
        return;
      }

      const data = docSnap.data() as Omit<StaffUser, 'uid'>;
      const profile: StaffUser = {
        uid: user.uid,
        email: data.email || user.email || '',
        displayName: data.displayName || user.displayName || 'Staff User',
        role: data.role,
        active: data.active === true,
        preferredLanguage: data.preferredLanguage || 'om',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastLoginAt: data.lastLoginAt,
      };

      if (!profile.active) {
        setStaffUser(profile);
        setStatus('inactive');
        setLoading(false);
        return;
      }

      if (!VALID_ROLES.includes(profile.role)) {
        setStaffUser(profile);
        setStatus('unknownRole');
        setLoading(false);
        return;
      }

      try {
        await updateDoc(docRef, {
          lastLoginAt: serverTimestamp(),
        });
      } catch (err) {
        // Non-blocking update
      }

      setStaffUser(profile);
      setStatus('authorized');
    } catch (err: any) {
      console.warn('[AuthContext] Error fetching staff profile:', err?.message || err);
      setStaffUser(null);
      setStatus('noProfile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setStatus('signedOut');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setLoading(true);
        fetchStaffProfile(user);
      } else {
        setStaffUser(null);
        setStatus('signedOut');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatAuthError = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'auth_invalid_credentials';
      case 'auth/too-many-requests':
        return 'auth_too_many_attempts';
      case 'auth/network-request-failed':
        return 'auth_network_error';
      case 'auth/invalid-email':
        return 'auth_invalid_credentials';
      default:
        return 'auth_invalid_credentials';
    }
  };

  const signIn = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);

    if (!auth) {
      const demoAccount =
        Object.values(DEMO_STAFF_USERS).find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        ) || DEMO_STAFF_USERS.superAdmin;

      setStaffUser(demoAccount);
      setStatus('demoAuthorized');
      setLoading(false);
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await fetchStaffProfile(cred.user);
    } catch (err: any) {
      setLoading(false);
      const code = err?.code || '';
      const translatedKey = formatAuthError(code);
      setError(translatedKey);
      throw new Error(translatedKey);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setError(null);
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const code = err?.code || '';
      const translatedKey = formatAuthError(code);
      setError(translatedKey);
      throw new Error(translatedKey);
    }
  };

  const doSignOut = async () => {
    setError(null);
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err: any) {
        console.error('Sign out error:', err);
      }
    }
    setFirebaseUser(null);
    setStaffUser(null);
    setStatus('signedOut');
  };

  const signInDemoUser = async (role: StaffRole = 'superAdmin') => {
    if (auth && !auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.warn('Anonymous sign in for demo user failed:', err);
      }
    }

    const demoProfile = DEMO_STAFF_USERS[role] || DEMO_STAFF_USERS.superAdmin;
    const finalUid = auth?.currentUser?.uid || demoProfile.uid;
    const staffObj: StaffUser = { ...demoProfile, uid: finalUid };

    setStaffUser(staffObj);
    setStatus('demoAuthorized');
    setLoading(false);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user: firebaseUser,
        firebaseUser,
        staffUser,
        status,
        loading,
        error,
        authError: error,
        isFirebaseConfigured,
        isFirebaseReady,
        signIn,
        sendPasswordReset,
        signOut: doSignOut,
        signOutUser: doSignOut,
        clearError,
        signInDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
