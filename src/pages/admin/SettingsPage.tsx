import React from 'react';
import { Settings, CheckCircle2, AlertTriangle, ShieldCheck, Database, Server, Key } from 'lucide-react';
import { getFirebaseConfigStatus } from '../../config/env';

export const SettingsPage: React.FC = () => {
  const status = getFirebaseConfigStatus();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          <span>Bureau System & Firebase Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review Firebase environment configuration, rules status, and platform security flags.
        </p>
      </div>

      {/* Firebase Config Status */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Firebase SDK Initialization Status</span>
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              status.configured
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {status.configured ? 'Configured (Production Mode)' : 'Unconfigured (Demo Mode)'}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="font-semibold text-slate-700 dark:text-slate-300">Expected Environment Variables:</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'VITE_FIREBASE_API_KEY',
              'VITE_FIREBASE_AUTH_DOMAIN',
              'VITE_FIREBASE_PROJECT_ID',
              'VITE_FIREBASE_STORAGE_BUCKET',
              'VITE_FIREBASE_MESSAGING_SENDER_ID',
              'VITE_FIREBASE_APP_ID',
            ].map((key) => {
              const isMissing = status.missingKeys.includes(key);
              return (
                <div
                  key={key}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{key}</span>
                  {isMissing ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Missing</span>
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Set</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Security Rules Verification */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Security Rules Policy Summary</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>firestore.rules</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Default deny policy. Restricts <code className="text-emerald-500 font-mono">staffUsers</code> read/write to active staff and superAdmins. Denies self-assigned role updates.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-500" />
              <span>storage.rules</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Denies arbitrary public uploads. Outlines structured path gates for news images, achievement media, and public publications for future CMS steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
