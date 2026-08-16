import React from 'react';
import { RefreshCw, AlertTriangle, X } from 'lucide-react';

interface AlertVersionConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AlertVersionConflictModal: React.FC<AlertVersionConflictModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 dark:border-amber-900/60 space-y-5 relative animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Version Conflict Detected
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Record modified by another staff member
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Another staff officer or administrator updated this alert document while you were viewing it. To prevent accidental overwrite, your request was safely blocked.
        </p>

        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
          Please refresh the alert list to load the latest document version before performing further state actions.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRefresh();
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Latest Version</span>
          </button>
        </div>
      </div>
    </div>
  );
};
