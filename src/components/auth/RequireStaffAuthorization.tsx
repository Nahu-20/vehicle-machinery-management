import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStaffAuthorization } from '../../hooks/useStaffAuthorization';
import { useLanguage } from '../../context/LanguageContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface RequireStaffAuthorizationProps {
  children: React.ReactNode;
}

export const RequireStaffAuthorization: React.FC<RequireStaffAuthorizationProps> = ({
  children,
}) => {
  const { authorizationLoading, authorizationStatus, authorizationError } =
    useStaffAuthorization();
  const location = useLocation();
  const { t } = useLanguage();

  if (authorizationLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <div className="font-bold text-sm tracking-wide">
            {t('auth_verifying_staff') || 'Verifying Staff Authorization...'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Checking staffUsers profile & active permissions...
          </p>
        </div>
      </div>
    );
  }

  if (authorizationStatus === 'signedOut') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (authorizationStatus !== 'authorized') {
    return (
      <Navigate
        to="/admin/unauthorized"
        state={{
          status: authorizationStatus,
          error: authorizationError,
          from: location,
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};
