import React, { useState } from 'react';
import { AlertOctagon, X, Lock } from 'lucide-react';

interface PermanentDeleteConfirmModalProps {
  isOpen: boolean;
  articleTitle: string;
  articleSlug: string;
  onClose: () => void;
  onConfirm: (typedConfirmation: string) => Promise<void>;
}

export const PermanentDeleteConfirmModal: React.FC<PermanentDeleteConfirmModalProps> = ({
  isOpen,
  articleTitle,
  articleSlug,
  onClose,
  onConfirm,
}) => {
  const [typedSlug, setTypedSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTyped = typedSlug.trim().toLowerCase();
    const cleanExact = articleSlug.trim().toLowerCase();

    if (cleanTyped !== cleanExact) {
      setError(`Typed slug "${cleanTyped}" does not match exact slug "${cleanExact}".`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(cleanTyped);
      setTypedSlug('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to permanently delete article.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMatched = typedSlug.trim().toLowerCase() === articleSlug.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-red-100 dark:border-red-950 bg-red-100/60 dark:bg-red-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-red-950 dark:text-red-200 text-sm">
                PERMANENT DELETION (SUPER ADMIN ONLY)
              </h3>
              <p className="text-xs text-red-800 dark:text-red-400 font-mono mt-0.5">
                /{articleSlug}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-900 dark:text-red-300 space-y-1">
            <p className="font-bold">
              ⚠️ CRITICAL WARNING: THIS ACTION IS PERMANENT AND IRREVERSIBLE.
            </p>
            <p>
              This news article and all its content blocks will be completely removed from Firestore. An immutable server audit record will log this deletion event.
            </p>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300">
            Article Title: <strong>"{articleTitle}"</strong>
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              To confirm, type the exact article slug <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-red-600 font-mono select-all">{articleSlug}</code> below:
            </label>
            <div className="relative">
              <input
                type="text"
                value={typedSlug}
                onChange={(e) => {
                  setTypedSlug(e.target.value);
                  setError(null);
                }}
                placeholder={articleSlug}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
              />
              {isMatched && (
                <Lock className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatched || isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Deleting Document...' : 'Permanently Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
