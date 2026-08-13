import React from 'react';
import { AgriculturalAlert, toMillis } from '../../../types/agriculturalAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface AlertRestoreConfirmModalProps {
  alert: AgriculturalAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
}

export const AlertRestoreConfirmModal: React.FC<AlertRestoreConfirmModalProps> = ({
  alert,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const { getLocalizedText } = useLanguage();

  if (!isOpen || !alert) return null;

  const previousStatus = alert.statusBeforeTrash || 'draft';
  const titleText = getLocalizedText(alert.title) || alert.slug;

  const expMs = toMillis(alert.expiresAt);
  const isExpiredInPast = expMs !== null && expMs <= Date.now();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative animate-in zoom-in-95 duration-150"
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
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Restore Alert from Trash?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Slug: /{alert.slug}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <p className="font-bold text-slate-900 dark:text-white line-clamp-2">
            {titleText}
          </p>
          <p className="text-slate-500">
            Will be restored to state: <strong className="uppercase font-bold text-slate-800 dark:text-slate-200">{previousStatus}</strong>
          </p>
        </div>

        {isExpiredInPast && previousStatus === 'published' && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Note: This alert’s expiration date ({new Date(expMs!).toLocaleDateString()}) is in the past. Although restored to published status, it will naturally appear as Expired rather than Active.
            </p>
          </div>
        )}

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
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Restoring...' : 'Confirm Restore'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
