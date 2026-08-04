import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  Mail,
  Building2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

export const AdminSignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { user, firebaseUser, signIn, loading, authError, clearError, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/admin';
  const activeUser = user || firebaseUser;

  useEffect(() => {
    if (activeUser) {
      navigate('/admin', { replace: true });
    }
  }, [activeUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter your staff email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(trimmedEmail, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      // Error is caught and set in AuthContext / local state
    } finally {
      setSubmitting(false);
    }
  };

  const getErrorMessage = () => {
    if (localError) return localError;
    if (authError) {
      const translated = t(authError);
      return translated !== authError ? translated : t('auth_invalid_credentials');
    }
    return null;
  };

  const activeError = getErrorMessage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-500" />

      {/* Top Header Controls (Language switch & return link) */}
      <div className="absolute top-4 left-4 right-4 max-w-5xl mx-auto flex items-center justify-between z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1 px-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('nav_home') || 'Public Website'}</span>
        </Link>

        {/* Language selector */}
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mt-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-lg backdrop-blur-sm mb-4">
          <Building2 className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('bureau_title') || 'Oromia Agricultural Bureau'}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
          {t('auth_staff_sign_in') || 'Staff Authentication & Access Portal'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl py-8 px-5 sm:px-10 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800">

          {!isFirebaseConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-sm">
                <Info className="w-4 h-4 shrink-0" />
                <span>{t('auth_firebase_config_missing') || 'Firebase Config Required'}</span>
              </div>
              <p>
                Environment variables are missing in <code className="bg-slate-200 dark:bg-slate-950 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-300">.env</code>. Configure <code className="bg-slate-200 dark:bg-slate-950 px-1 py-0.5 rounded">VITE_FIREBASE_*</code> keys to authenticate against Firebase.
              </p>
            </div>
          )}

          {activeError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-800 dark:text-red-200 mb-0.5">
                  Authentication Error
                </div>
                <div>{activeError}</div>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                {t('auth_email') || 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@oromiaagri.gov.et"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('auth_password') || 'Password'}
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                >
                  {t('auth_forgot_password') || 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth_hide_password') || 'Hide password' : t('auth_show_password') || 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remembered Session Explanation */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Firebase securely persists your authentication session across browser reloads until you explicitly sign out.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {submitting || loading ? (
                <span>{t('auth_signing_in') || 'Signing in...'}</span>
              ) : (
                <>
                  <span>{t('auth_sign_in') || 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Development / Prototype Checkpoint Banner */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Milestone 2.1A Checkpoint Notice</span>
              </div>
              <p>
                This form connects directly to Firebase Authentication. Staff authorization and Firestore security rules will be enforced in subsequent steps.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              ← {t('auth_back_to_login') ? 'Return to Home' : 'Return to Public Website'}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
