import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { AchievementStatus } from '../../../types/achievement';

interface TrashConfirmModalProps {
  isOpen: boolean;
  achievementTitle: string;
  achievementSlug: string;
  currentStatus: AchievementStatus;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const TrashConfirmModal: React.FC<TrashConfirmModalProps> = ({
  isOpen,
  achievementTitle,
  achievementSlug,
  currentStatus,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isPublished = currentStatus === 'published';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Move Achievement to Trash</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">/{achievementSlug}</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isPublished && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                <strong>Warning:</strong> This achievement is currently <strong>Published</strong>. Moving it to trash will immediately unpublish it and hide it from the public directory.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to move <strong>"{achievementTitle}"</strong> to trash? You can restore it later if needed.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Reason for Trashing (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Obsolete metric data, duplicate record, or administrative revision..."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Trashing...' : 'Move to Trash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
