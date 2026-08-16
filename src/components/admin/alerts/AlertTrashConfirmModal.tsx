import React, { useState } from 'react';
import { AgriculturalAlert, isAlertPubliclyActive } from '../../../types/agriculturalAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { AlertSeverityBadge } from './AlertSeverityBadge';
import { AlertStatusBadge } from './AlertStatusBadge';
import { Trash2, AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface AlertTrashConfirmModalProps {
  alert: AgriculturalAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const AlertTrashConfirmModal: React.FC<AlertTrashConfirmModalProps> = ({
  alert,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const { getLocalizedText } = useLanguage();
  const [reason, setReason] = useState('');

  if (!isOpen || !alert) return null;

  const isActiveNow = isAlertPubliclyActive(alert);
  const isCriticalActive = isActiveNow && alert.severity === 'critical';
  const titleText = getLocalizedText(alert.title) || alert.slug;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(reason.trim() || undefined);
    setReason('');
  };

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
          <div className={`p-3 rounded-2xl ${isCriticalActive ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border border-rose-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'}`}>
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Move Alert to Trash?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Slug: /{alert.slug}
            </p>
          </div>
        </div>

        {/* Warning Banner for Active / Critical alerts */}
        {isCriticalActive ? (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 space-y-1 text-xs font-medium">
            <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>CRITICAL ALERT IS CURRENTLY PUBLICLY ACTIVE!</span>
            </div>
            <p className="leading-relaxed">
              Trashing this alert will immediately remove it from public view across Oromia portals. Ensure replacement coverage if pest or emergency warnings remain active.
            </p>
          </div>
        ) : isActiveNow ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Alert is currently live</span>
            </div>
            <p>Trashing this published alert will remove it from public portal listings.</p>
          </div>
        ) : null}

        {/* Details Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <p className="font-bold text-slate-900 dark:text-white line-clamp-2">
            {titleText}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <AlertSeverityBadge severity={alert.severity} size="sm" />
            <AlertStatusBadge status={alert.status} size="sm" />
            <span className="text-[11px] font-mono text-slate-500">v{alert.version}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Reason for Trashing (Optional)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Superseded by updated regional weather advisory"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Trashing...' : 'Move to Trash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
