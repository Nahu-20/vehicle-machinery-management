import React from 'react';
import { RefreshCw, AlertTriangle, X } from 'lucide-react';

interface VersionConflictModalProps {
  isOpen: boolean;
  achievementTitle?: string;
  achievementSlug?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const VersionConflictModal: React.FC<VersionConflictModalProps> = ({
  isOpen,
  achievementTitle,
  achievementSlug,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-100 dark:border-amber-950 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Version Conflict Detected</h3>
              {achievementSlug && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">/{achievementSlug}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This achievement record {achievementTitle ? `("${achievementTitle}") ` : ''}was updated by another staff member or session while you were viewing it.
          </p>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200">
            To prevent accidental overwrites or stale state transitions, please refresh your view to load the latest document version before performing further actions.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRefresh();
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
