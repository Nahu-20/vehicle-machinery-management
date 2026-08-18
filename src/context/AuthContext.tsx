import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseDemoMode } from '../lib/firebase';
import { StaffUser, StaffRole } from '../types/auth';
import { isFirebaseConfigured as checkFirebaseConfigured } from '../config/env';
import { clearAllDraftRecoveriesForUser } from '../services/newsDraftRecoveryService';
import { logAuditEvent, getSessionId } from '../services/auditService';

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
  'fleetOfficer',
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
  fleetOfficer: {
    uid: 'demo-fleetofficer-001',
    email: 'fleet@oromiaagri.gov.et',
    displayName: 'Obbo Tashoomaa Waaqjiraa',
    role: 'fleetOfficer',
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
    if (!db || isFirebaseDemoMode) {
      setStaffUser(null);
      setStatus('noProfile');
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'staffUsers', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        /*
         * No staff record: refuse, do not create one.
         *
         * This used to auto-provision a document with role 'superAdmin' and
         * active: true for any authenticated user who lacked one. Combined with
         * firestore.rules allowing a create against your own uid, and with
         * Firebase's email/password sign-up being open by default, that meant
         * anyone who could register an account was handed administrator rights
         * on the whole portal — no invitation, no approval, no UI needed.
         *
         * It reads like a convenience for provisioning the first admin, and that
         * is what it was. But the first admin only needs provisioning once, in
         * the Firebase console, and everyone after that is either invited or is
         * not supposed to be here. Failing closed costs one manual document and
         * removes a privilege-escalation path.
         *
         * Provisioning steps are in StaffManagementPage and the setup docs.
         */
        //
        // Both sides of the merge removed the auto-provisioning independently.
        // His audit entry is the durable record; the console warning is what a
        // developer running locally actually sees, since the audit write is
        // swallowed on failure by design.
        logAuditEvent({
          actorUid: user.uid,
          actorEmail: user.email || '',
          actorDisplayName: user.displayName || 'Unregistered User',
          actorRole: 'unknown',
          module: 'authentication',
          action: 'authorization_denied',
          result: 'denied',
          targetType: 'staff_account',
          targetId: user.uid,
          targetLabel: user.displayName || 'Unregistered User',
          source: 'dashboard_ui',
          reason: `No canonical staff profile found in Firestore at staffUsers/${user.uid}. Self-provisioning denied.`,
        });
        console.warn(
          `[AuthContext] ${user.uid} signed in with no staffUsers document. ` +
            'Access refused. Create the record in Firestore to grant access.'
        );
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
        logAuditEvent({
          actorUid: user.uid,
          actorEmail: profile.email,
          actorDisplayName: profile.displayName,
          actorRole: profile.role,
          module: 'authentication',
          action: 'authorization_denied',
          result: 'denied',
          targetType: 'staff_account',
          targetId: user.uid,
          targetLabel: profile.displayName,
          source: 'dashboard_ui',
          reason: 'Staff account is set to inactive status.',
        });
        setStaffUser(profile);
        setStatus('inactive');
        setLoading(false);
        return;
      }

      if (!VALID_ROLES.includes(profile.role)) {
        logAuditEvent({
          actorUid: user.uid,
          actorEmail: profile.email,
          actorDisplayName: profile.displayName,
          actorRole: profile.role || 'unknown',
          module: 'authentication',
          action: 'authorization_denied',
          result: 'denied',
          targetType: 'staff_account',
          targetId: user.uid,
          targetLabel: profile.displayName,
          source: 'dashboard_ui',
          reason: `Unrecognized staff role: ${profile.role}`,
        });
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

      logAuditEvent({
        actorUid: user.uid,
        actorEmail: profile.email,
        actorDisplayName: profile.displayName,
        actorRole: profile.role,
        module: 'authentication',
        action: 'session_started',
        result: 'success',
        targetType: 'staff_session',
        targetId: getSessionId(),
        targetLabel: `Session started for ${profile.displayName}`,
        source: 'dashboard_ui',
      });

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

    // `auth` is no longer null when Firebase is unconfigured — it points at a
    // placeholder project so the public site does not blank out. Demo mode has
    // to be asked about explicitly now, or this falls through to a real sign-in
    // against a project that does not exist and the admin becomes unreachable.
    if (!auth || isFirebaseDemoMode) {
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
      logAuditEvent({
        actorUid: 'anonymous',
        actorEmail: email,
        actorDisplayName: email,
        actorRole: 'unknown',
        module: 'authentication',
        action: 'password_reset_requested',
        result: 'success',
        targetType: 'password_reset',
        targetId: email,
        targetLabel: `Password reset requested for ${email}`,
        source: 'dashboard_ui',
      });
    } catch (err: any) {
      const code = err?.code || '';
      const translatedKey = formatAuthError(code);
      setError(translatedKey);
      throw new Error(translatedKey);
    }
  };

  const doSignOut = async () => {
    setError(null);
    if (staffUser?.uid) {
      clearAllDraftRecoveriesForUser(staffUser.uid);
      logAuditEvent({
        actorUid: staffUser.uid,
        actorEmail: staffUser.email,
        actorDisplayName: staffUser.displayName,
        actorRole: staffUser.role,
        module: 'authentication',
        action: 'session_ended',
        result: 'success',
        targetType: 'staff_session',
        targetId: getSessionId(),
        targetLabel: `Session ended for ${staffUser.displayName}`,
        source: 'dashboard_ui',
      });
    }
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
    setLoading(true);
    let currentAuthUser = auth?.currentUser || null;

    if (auth && !currentAuthUser) {
      try {
        const cred = await signInAnonymously(auth);
        currentAuthUser = cred.user;
      } catch (err) {
        console.warn('Anonymous sign in for demo user failed:', err);
      }
    }

    const demoProfile = DEMO_STAFF_USERS[role] || DEMO_STAFF_USERS.superAdmin;
    const finalUid = currentAuthUser?.uid || demoProfile.uid;
    const staffObj: StaffUser = { ...demoProfile, uid: finalUid };

    if (db && currentAuthUser) {
      try {
        const staffDocRef = doc(db, 'staffUsers', finalUid);
        await setDoc(
          staffDocRef,
          {
            uid: finalUid,
            email: staffObj.email,
            displayName: staffObj.displayName,
            role: staffObj.role,
            active: true,
            preferredLanguage: staffObj.preferredLanguage || 'om',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('[AuthContext] Error syncing demo staff profile to Firestore:', err);
      }
    }

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
