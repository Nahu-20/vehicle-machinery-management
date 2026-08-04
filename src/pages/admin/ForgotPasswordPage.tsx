import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

export const ForgotPasswordPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { sendPasswordReset, authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please enter your staff email address.');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordReset(trimmedEmail);
      setSubmitted(true);
    } catch (err) {
      // Handled by AuthContext or local state
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-500" />

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 max-w-5xl mx-auto flex items-center justify-between z-20">
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1 px-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('auth_back_to_login') || 'Back to Sign In'}</span>
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mt-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-lg backdrop-blur-sm mb-4">
          <Building2 className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('auth_forgot_password') || 'Forgot Password'}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
          {t('bureau_title') || 'Oromia Agricultural Bureau'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl py-8 px-5 sm:px-10 shadow-xl rounded-3xl border border-slate-200 dark:border-slate-800">

          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Reset Link Dispatched
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('auth_reset_email_sent') ||
                  'If an account exists for this email address, a password reset link has been sent. Please check your inbox.'}
              </p>
              <div className="pt-4">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('auth_back_to_login') || 'Back to Sign In'}</span>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Enter your staff email address below to receive an automated password reset link.
              </p>

              {(localError || authError) && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-800 dark:text-red-200 mb-0.5">
                      Request Failed
                    </div>
                    <div>{localError || (authError && t(authError)) || 'An error occurred.'}</div>
                  </div>
                </div>
              )}

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

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {submitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{t('auth_send_reset_link') || 'Send Reset Link'}</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/admin/login"
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  ← {t('auth_back_to_login') || 'Back to Sign In'}
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
