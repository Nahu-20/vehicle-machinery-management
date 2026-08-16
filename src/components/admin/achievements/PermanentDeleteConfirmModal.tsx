import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface PermanentDeleteConfirmModalProps {
  isOpen: boolean;
  achievementTitle: string;
  achievementSlug: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const PermanentDeleteConfirmModal: React.FC<PermanentDeleteConfirmModalProps> = ({
  isOpen,
  achievementTitle,
  achievementSlug,
  onClose,
  onConfirm,
}) => {
  const [typedSlug, setTypedSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = typedSlug.trim().toLowerCase() === achievementSlug.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      setTypedSlug('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Permanent deletion failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-red-100 dark:border-red-950 bg-red-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Permanently Delete Achievement</h3>
              <p className="text-xs opacity-90 font-mono mt-0.5">/{achievementSlug}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl text-xs text-red-900 dark:text-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <strong>IRREVERSIBLE ACTION:</strong> Permanent deletion strictly removes this document from the database. This action cannot be undone.
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Target record: <strong>"{achievementTitle}"</strong>
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Type <span className="font-mono text-red-600 dark:text-red-400 select-all">{achievementSlug}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedSlug}
              onChange={(e) => setTypedSlug(e.target.value)}
              placeholder={achievementSlug}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
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
              disabled={!isConfirmed || isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isSubmitting ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
