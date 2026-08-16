import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

/**
 * RequireAuthentication Route Guard
 *
 * Milestone 2.1A Authentication Checkpoint.
 *
 * CRITICAL SECURITY NOTICE:
 * This guard verifies ONLY that a valid Firebase Authentication session exists.
 * Authentication alone DOES NOT grant staff authorization.
 *
 * Final staff authorization (verifying staffUsers/{uid}, active status, staff roles,
 * permissions, and Firestore security rules) will be implemented in Milestone 2.1B+.
 */
interface RequireAuthenticationProps {
  children?: React.ReactNode;
}

export const RequireAuthentication: React.FC<RequireAuthenticationProps> = ({ children }) => {
  const { user, firebaseUser, loading } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  const activeUser = user || firebaseUser;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <div className="font-bold text-sm tracking-wide">
            {t('auth_loading') || 'Authenticating...'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Restoring authentication session...
          </p>
        </div>
      </div>
    );
  }

  if (!activeUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : null;
};
