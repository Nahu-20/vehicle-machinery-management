import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface FacilityVersionConflictModalProps {
  isOpen: boolean;
  onReload: () => void;
  onClose: () => void;
  currentVersion?: number;
}

export function FacilityVersionConflictModal({
  isOpen,
  onReload,
  onClose,
  currentVersion,
}: FacilityVersionConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="conflict-modal-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Version Conflict Detected
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Optimistic Concurrency Control (OCC) Protection
            </p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs space-y-2 leading-relaxed">
          <p>
            This infrastructure facility was modified by another staff member or process while you were editing (current local baseline: version {currentVersion || 'unknown'}).
          </p>
          <p className="font-semibold">
            To prevent overwriting newer changes, your mutation was safely prevented.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer"
          >
            Review Unsaved Draft
          </button>

          <button
            type="button"
            onClick={onReload}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Latest Version
          </button>
        </div>
      </div>
    </div>
  );
}
