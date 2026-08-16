import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  StaffUser,
  StaffRole,
  Permission,
  StaffAuthorizationStatus,
  SupportedLanguage,
} from '../types/auth';
import {
  getPermissionsForRole,
  hasPermission as checkHasPermission,
  hasRole as checkHasRole,
} from '../auth/permissions';
import {
  subscribeToStaffProfile,
  getStaffProfile,
  updateOwnPreferredLanguage,
  NormalizedFirestoreError,
} from '../services/staffService';
import { getFirebaseConfig } from '../config/env';

export interface StaffAuthorizationContextType {
  staffUser: StaffUser | null;
  role: StaffRole | null;
  permissions: Permission[];
  authorizationLoading: boolean;
  authorizationStatus: StaffAuthorizationStatus;
  authorizationError: string | null;
  hasRole: (roles: StaffRole | StaffRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  refreshStaffProfile: () => Promise<void>;
  updateLanguagePreference: (lang: SupportedLanguage) => Promise<void>;
}

export const StaffAuthorizationContext = createContext<StaffAuthorizationContextType | undefined>(
  undefined
);

/**
 * Safe development-only diagnostic logger
 * Contains: Firebase project ID, authenticated UID, profile document path, normalized error code, authorization status
 * Does NOT log tokens, passwords, API keys, or full configuration.
 */
function logStaffAuthDiagnostic(
  uid: string,
  errorCode: string,
  status: StaffAuthorizationStatus
) {
  const firebaseConfig = getFirebaseConfig();
  const projectId = firebaseConfig?.projectId || 'N/A';
  console.log('[StaffAuth Diagnostic]', {
    projectId,
    uid,
    profilePath: `staffUsers/${uid}`,
    errorCode,
    authorizationStatus: status,
  });
}

export const StaffAuthorizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, firebaseUser, loading: authLoading, isFirebaseConfigured, status: authStatus, staffUser: authStaffUser } = useAuth();

  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [authorizationLoading, setAuthorizationLoading] = useState<boolean>(true);
  const [authorizationStatus, setAuthorizationStatus] = useState<StaffAuthorizationStatus>(
    'loading'
  );
  const [authorizationError, setAuthorizationError] = useState<string | null>(null);

  const activeAuthUser = user || firebaseUser;

  const resetState = useCallback((status: StaffAuthorizationStatus, errorMsg: string | null = null) => {
    setStaffUser(null);
    setRole(null);
    setPermissions([]);
    setAuthorizationStatus(status);
    setAuthorizationError(errorMsg);
    setAuthorizationLoading(false);
  }, []);

  useEffect(() => {
    // 1. Wait for AuthContext to resolve session
    if (authLoading) {
      setAuthorizationLoading(true);
      setAuthorizationStatus('loading');
      return;
    }

    // 2. Demo authorized mode handling
    if (authStatus === 'demoAuthorized' && authStaffUser) {
      setStaffUser(authStaffUser);
      setRole(authStaffUser.role);
      setPermissions(getPermissionsForRole(authStaffUser.role));
      setAuthorizationStatus('authorized');
      setAuthorizationError(null);
      setAuthorizationLoading(false);
      logStaffAuthDiagnostic(authStaffUser.uid, 'none', 'authorized');
      return;
    }

    // 3. Signed out user
    if (!activeAuthUser) {
      resetState('signedOut');
      return;
    }

    setAuthorizationLoading(true);

    // 4. Real-time Firestore Profile Subscription
    let isSubscribed = true;

    const unsubscribe = subscribeToStaffProfile(
      activeAuthUser.uid,
      (result) => {
        if (!isSubscribed) return;

        if (result.valid && result.profile) {
          if (!result.profile.active) {
            resetState('inactive', 'This staff account is set to inactive status (active === false).');
            logStaffAuthDiagnostic(activeAuthUser.uid, 'none', 'inactive');
            return;
          }
          setStaffUser(result.profile);
          setRole(result.profile.role);
          setPermissions(getPermissionsForRole(result.profile.role));
          setAuthorizationStatus('authorized');
          setAuthorizationError(null);
          setAuthorizationLoading(false);
          logStaffAuthDiagnostic(activeAuthUser.uid, 'none', 'authorized');
        } else {
          // SECURITY DECISION: Invalid or missing staff profile MUST remain unauthorized!
          const status = result.errorStatus || 'profileMissing';
          const errMsg = result.errorMessage || 'Staff user profile not found. Access denied.';
          resetState(status, errMsg);
          logStaffAuthDiagnostic(activeAuthUser.uid, 'none', status);
        }
      },
      (normErr: NormalizedFirestoreError) => {
        if (!isSubscribed) return;
        console.warn('[StaffAuthorizationContext] Firestore listener error:', normErr.message);
        resetState(normErr.errorStatus, normErr.message);
        logStaffAuthDiagnostic(activeAuthUser.uid, normErr.code, normErr.errorStatus);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [authLoading, authStatus, authStaffUser, activeAuthUser, isFirebaseConfigured, resetState]);

  const refreshStaffProfile = useCallback(async () => {
    if (!activeAuthUser || !isFirebaseConfigured) return;
    setAuthorizationLoading(true);
    try {
      const result = await getStaffProfile(activeAuthUser.uid);
      if (result.valid && result.profile) {
        if (!result.profile.active) {
          resetState('inactive', 'This staff account is inactive.');
          logStaffAuthDiagnostic(activeAuthUser.uid, 'none', 'inactive');
          return;
        }
        setStaffUser(result.profile);
        setRole(result.profile.role);
        setPermissions(getPermissionsForRole(result.profile.role));
        setAuthorizationStatus('authorized');
        setAuthorizationError(null);
        logStaffAuthDiagnostic(activeAuthUser.uid, 'none', 'authorized');
      } else {
        const status = result.errorStatus || 'profileMissing';
        const errMsg = result.errorMessage || 'Staff profile not found.';
        resetState(status, errMsg);
        logStaffAuthDiagnostic(activeAuthUser.uid, 'none', status);
      }
    } catch (err: any) {
      resetState('serviceError', err.message || 'Error refreshing staff profile.');
      logStaffAuthDiagnostic(activeAuthUser.uid, 'unknown_error', 'serviceError');
    } finally {
      setAuthorizationLoading(false);
    }
  }, [activeAuthUser, isFirebaseConfigured, resetState]);

  const updateLanguagePreference = useCallback(
    async (lang: SupportedLanguage) => {
      if (staffUser) {
        setStaffUser({ ...staffUser, preferredLanguage: lang });
        if (isFirebaseConfigured && staffUser.uid) {
          try {
            await updateOwnPreferredLanguage(staffUser.uid, lang);
          } catch (err) {
            console.error('Failed to persist language preference:', err);
          }
        }
      }
    },
    [staffUser, isFirebaseConfigured]
  );

  const hasRole = useCallback(
    (roles: StaffRole | StaffRole[]) => {
      return checkHasRole(staffUser, roles);
    },
    [staffUser]
  );

  const hasPermission = useCallback(
    (permission: Permission) => {
      return checkHasPermission(staffUser, permission);
    },
    [staffUser]
  );

  return (
    <StaffAuthorizationContext.Provider
      value={{
        staffUser,
        role,
        permissions,
        authorizationLoading,
        authorizationStatus,
        authorizationError,
        hasRole,
        hasPermission,
        refreshStaffProfile,
        updateLanguagePreference,
      }}
    >
      {children}
    </StaffAuthorizationContext.Provider>
  );
};

export const useStaffAuthorizationContext = () => {
  const context = useContext(StaffAuthorizationContext);
  if (!context) {
    throw new Error('useStaffAuthorizationContext must be used within StaffAuthorizationProvider');
  }
  return context;
};
