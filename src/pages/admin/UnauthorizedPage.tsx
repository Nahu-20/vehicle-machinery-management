import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldAlert,
  LogOut,
  ArrowLeft,
  UserX,
  Lock,
  Mail,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStaffAuthorization } from '../../hooks/useStaffAuthorization';
import { useLanguage } from '../../context/LanguageContext';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { signOut, signOutUser, firebaseUser, user } = useAuth();
  const { authorizationStatus, authorizationError, staffUser } = useStaffAuthorization();

  const stateStatus = (location.state as any)?.status || authorizationStatus;
  const stateError = (location.state as any)?.error || authorizationError;

  const activeEmail = staffUser?.email || firebaseUser?.email || user?.email || 'N/A';

  const handleSignOut = async () => {
    try {
      if (signOut) {
        await signOut();
      } else if (signOutUser) {
        await signOutUser();
      }
      navigate('/admin/login', { replace: true });
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const getStatusContent = () => {
    switch (stateStatus) {
      case 'profileMissing':
        return {
          title: t('auth_unauthorized_profile_missing_title') || 'Staff Profile Missing',
          badge: 'Unregistered Staff UID',
          description:
            t('auth_unauthorized_profile_missing_desc') ||
            'Your Firebase login was successful, but no matching staff profile document was found in staffUsers/{uid}. Please contact your bureau IT administrator to register your staff document.',
        };
      case 'inactive':
        return {
          title: t('auth_unauthorized_inactive_title') || 'Account Inactive',
          badge: 'Disabled Access',
          description:
            t('auth_unauthorized_inactive_desc') ||
            'Your staff account has been set to inactive status (active === false). Please contact your administrator if you believe this is an error.',
        };
      case 'unknownRole':
        return {
          title: t('auth_unauthorized_unknown_role_title') || 'Unsupported Staff Role',
          badge: 'Role Error',
          description:
            t('auth_unauthorized_unknown_role_desc') ||
            'Your staff profile does not possess a recognized bureau role (superAdmin, contentAdmin, editor, marketOfficer, advisoryOfficer).',
        };
      case 'malformedProfile':
        return {
          title: t('auth_unauthorized_malformed_title') || 'Malformed Staff Profile',
          badge: 'Invalid Profile Structure',
          description:
            t('auth_unauthorized_malformed_desc') ||
            'Your staff profile document in Firestore is missing required fields or has an invalid structure.',
        };
      case 'authorizationError':
        return {
          title: t('auth_unauthorized_error_title') || 'Firestore Authorization Failure',
          badge: 'Permission Denied',
          description:
            stateError ||
            t('auth_unauthorized_error_desc') ||
            'Firestore security rules denied access to your staff profile.',
        };
      case 'serviceError':
        return {
          title: t('auth_unauthorized_service_error_title') || 'Database Service Unavailable',
          badge: 'Database Offline',
          description:
            stateError ||
            t('auth_unauthorized_service_error_desc') ||
            'Unable to communicate with the database service.',
        };
      case 'error':
      default:
        return {
          title: t('auth_unauthorized_error_title') || 'Authorization Verification Error',
          badge: 'Service Alert',
          description:
            stateError ||
            t('auth_unauthorized_error_desc') ||
            'An unexpected error occurred while verifying your staff authorization status. Please try signing out and signing in again.',
        };
    }
  };

  const statusInfo = getStatusContent();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-rose-600" />

      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 max-w-5xl mx-auto flex items-center justify-between z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1 px-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('nav_home') || 'Public Website'}</span>
        </Link>

        <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {(['om', 'am', 'en'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                language === lang
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mt-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 shadow-lg backdrop-blur-sm mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {statusInfo.title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
          {t('bureau_title') || 'Oromia Agricultural Bureau'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">

          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 text-xs font-bold uppercase tracking-wider">
              {statusInfo.badge}
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {statusInfo.description}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Signed-In Email Account</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-slate-100 break-all font-mono">
              {activeEmail}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 leading-relaxed space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-200">
              <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Contact Administrator Guidance</span>
            </div>
            <p>
              To request staff authorization or role updates, please email your bureau IT administrator at <code className="bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded font-mono text-blue-950 dark:text-blue-200">admin@oromiaagri.gov.et</code> with your staff ID and department details.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('auth_sign_out') || 'Sign Out & Return to Login'}</span>
            </button>

            <Link
              to="/"
              className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Website</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
