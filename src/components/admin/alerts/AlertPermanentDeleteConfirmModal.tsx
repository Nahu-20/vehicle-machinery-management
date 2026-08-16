import React, { useState } from 'react';
import { AgriculturalAlert } from '../../../types/agriculturalAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { ShieldAlert, Trash2, X } from 'lucide-react';

interface AlertPermanentDeleteConfirmModalProps {
  alert: AgriculturalAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
}

export const AlertPermanentDeleteConfirmModal: React.FC<AlertPermanentDeleteConfirmModalProps> = ({
  alert,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const { getLocalizedText } = useLanguage();
  const [typedSlug, setTypedSlug] = useState('');

  if (!isOpen || !alert) return null;

  const isMatched = typedSlug.trim() === alert.slug;
  const titleText = getLocalizedText(alert.title) || alert.slug;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched) return;
    await onConfirm();
    setTypedSlug('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-5 relative animate-in zoom-in-95 duration-150"
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
          <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Permanently Delete Alert?
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
              Irreversible SuperAdmin Action
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1.5 leading-relaxed">
          <p className="font-bold">
            Warning: This document and all stored history references for this alert will be permanently removed from Firestore database storage.
          </p>
          <p>This action cannot be undone.</p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
            {titleText}
          </p>
          <p className="font-mono text-slate-500">
            Target Slug: <strong>{alert.slug}</strong> (v{alert.version})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Type <span className="font-mono text-rose-600 dark:text-rose-400">{alert.slug}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedSlug}
              onChange={(e) => setTypedSlug(e.target.value)}
              placeholder={alert.slug}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatched || isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Deleting...' : 'Permanently Delete'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
