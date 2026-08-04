import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  LogOut,
  Building2,
  UserCheck,
  Key,
  Mail,
  CheckCircle2,
  ArrowLeft,
  Info,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

/**
 * AdminAuthCheckpointPage
 *
 * Temporary authenticated landing page for Milestone 2.1A.
 *
 * CRITICAL SECURITY ARCHITECTURE NOTE:
 * This page verifies ONLY that a valid Firebase Authentication session exists.
 *
 * Authentication ALONE does not grant staff authorization.
 * The next steps (Milestone 2.1B+) will require:
 *  1. Verification of staffUsers/{uid} profile existence
 *  2. Verification that active === true
 *  3. Recognized staff role evaluation
 *  4. Centralized permission checks
 *  5. Firestore Security Rules enforcement
 *
 * Sensitive Firebase tokens or internal credentials are intentionally NOT displayed on this page.
 */
export const AdminAuthCheckpointPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { user, firebaseUser, signOut, signOutUser } = useAuth();

  const activeUser = user || firebaseUser;

  const handleSignOut = async () => {
    try {
      if (signOut) {
        await signOut();
      } else if (signOutUser) {
        await signOutUser();
      }
      navigate('/admin/login', { replace: true });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-slate-100 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                {t('bureau_title') || 'Oromia Agricultural Bureau'}
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Milestone 2.1A • Auth Checkpoint
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              {(['om', 'am', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    language === lang
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('auth_sign_out') || 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">

        {/* PROMINENT MANDATORY NOTICE */}
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-lg space-y-3">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-400 font-extrabold text-base">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <span>{t('auth_checkpoint_notice') || 'Authentication Checkpoint Notice'}</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed font-medium">
            Authentication connected. Staff authorization, roles, and granular permissions have NOT yet been implemented.
          </p>
          <div className="pt-2 border-t border-amber-500/20 text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-mono">
            <strong>Next Milestone Requirement:</strong> Full staff authorization requires verifying <code className="bg-amber-500/20 px-1 py-0.5 rounded">staffUsers/{'{uid}'}</code>, active === true, role checks, and Firestore Security Rules.
          </div>
        </div>

        {/* Authenticated User Session Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Firebase Auth Session
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  User session restored and verified by Firebase SDK
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Authenticated</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>User Email</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 break-all">
                {activeUser?.email || 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Firebase User ID (UID)</span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 break-all">
                {activeUser?.uid || 'N/A'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Session Persistence Verification</span>
            </div>
            <p>
              Your authentication token is maintained by Firebase client persistence. Refreshing this browser tab or opening a new tab will retain your session without requiring you to re-enter your password.
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Website</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('auth_sign_out') || 'Sign Out'}</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
