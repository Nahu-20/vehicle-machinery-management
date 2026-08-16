import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onConfirmLeave: () => void;
  onCancel: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onConfirmLeave,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Unsaved Changes Warning</span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          You have unsaved changes in this news article draft. Leaving this page now will discard all unsaved edits made during this session.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Continue Editing
          </button>
          <button
            type="button"
            onClick={onConfirmLeave}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
};
