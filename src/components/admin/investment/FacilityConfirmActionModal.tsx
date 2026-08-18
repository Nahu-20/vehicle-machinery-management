import React, { useState } from 'react';
import {
  AlertTriangle,
  Send,
  ShieldCheck,
  ShieldAlert,
  Globe2,
  EyeOff,
  Archive,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';

export type FacilityActionType =
  | 'submit_review'
  | 'verify'
  | 'reject'
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'restore'
  | 'delete';

interface FacilityConfirmActionModalProps {
  isOpen: boolean;
  actionType: FacilityActionType | null;
  facilityTitle: string;
  facilityId: string;
  isProcessing: boolean;
  onConfirm: (payload?: { reason?: string }) => void;
  onClose: () => void;
}

export function FacilityConfirmActionModal({
  isOpen,
  actionType,
  facilityTitle,
  facilityId,
  isProcessing,
  onConfirm,
  onClose,
}: FacilityConfirmActionModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !actionType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (actionType === 'reject') {
      if (!rejectionReason || rejectionReason.trim().length < 5) {
        setError('Rejection reason must be at least 5 characters long.');
        return;
      }
      onConfirm({ reason: rejectionReason.trim() });
      return;
    }

    if (actionType === 'delete') {
      if (deleteConfirmationText.trim() !== 'DELETE') {
        setError('Please type DELETE in capital letters to confirm permanent deletion.');
        return;
      }
      onConfirm();
      return;
    }

    onConfirm();
  };

  const getModalConfig = () => {
    switch (actionType) {
      case 'submit_review':
        return {
          title: 'Submit Facility for Editorial Review',
          subtitle: `Facility: ${facilityTitle} (${facilityId})`,
          icon: Send,
          iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950',
          confirmBtnText: 'Submit for Review',
          confirmBtnClass: 'bg-purple-700 hover:bg-purple-800 text-white',
          description:
            'Submitting locks this facility record for editorial verification by authorized content verifiers. The record will not be directly editable while in review.',
        };
      case 'verify':
        return {
          title: 'Verify Infrastructure Facility',
          subtitle: `Facility: ${facilityTitle} (${facilityId})`,
          icon: ShieldCheck,
          iconColor: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950',
          confirmBtnText: 'Approve & Verify',
          confirmBtnClass: 'bg-teal-700 hover:bg-teal-800 text-white',
          description:
            'Confirm that you have reviewed the asset location, capacity metrics, and attached authoritative source documentation. Verification approves the record for publication.',
        };
      case 'reject':
        return {
          title: 'Reject Facility Draft',
          subtitle: `Facility: ${facilityTitle} (${facilityId})`,
          icon: ShieldAlert,
          iconColor: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950',
          confirmBtnText: 'Reject with Notes',
          confirmBtnClass: 'bg-rose-700 hover:bg-rose-800 text-white',
          description:
            'Provide internal feedback for the author. The facility remains in review until returned to draft for corrections.',
        };
      case 'publish':
        return {
          title: 'Publish Facility Live',
          subtitle: `Facility: ${facilityTitle} (${facilityId})`,
          icon: Globe2,
          iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950',
          confirmBtnText: 'Publish Live',
          confirmBtnClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
          description:
            'Publishing makes this verified infrastructure asset eligible for public views. It locks direct content mutation until unpublished.',
        };
      case 'unpublish':
        return {
          title: 'Unpublish Infrastructure Facility',
          subtitle: `Facility: ${facilityTitle} (${facilityId})`,
          icon: EyeOff,
          iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950',
          confirmBtnText: 'Unpublish Facility',
          confirmBtnClass: 'bg-amber-700 hover:bg-amber-800 text-white',
          description:
            'Unpublishing withdraws this facility from live public visibility and unlocks it for staff edits. Content changes will require re-verification.',
        };
      case 'archive':
        return {
          title: 'Archive Infrastructure Facility',
          subtitle: `Facility: ${facilityTitle} (${facilityId})`,
          icon: Archive,
          iconColor: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
          confirmBtnText: 'Archive Record',
          confirmBtnClass: 'bg-slate-700 hover:bg-slate-800 text-white',
          description:
            'Archiving deactivates this record. It can be restored to draft later if needed.',
        };
      case 'restore':
        return {
          title: 'Restore Facility to Draft',
          subtitle: `Facility: ${facilityTitle} (${facilityId})`,
          icon: RotateCcw,
          iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950',
          confirmBtnText: 'Restore to Draft',
          confirmBtnClass: 'bg-blue-700 hover:bg-blue-800 text-white',
          description:
            'Restoring places this facility back in draft status with pending verification for updates.',
        };
      case 'delete':
        return {
          title: 'Permanently Delete Facility',
          subtitle: `Facility: ${facilityTitle} (${facilityId})`,
          icon: Trash2,
          iconColor: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950',
          confirmBtnText: 'Permanently Delete',
          confirmBtnClass: 'bg-rose-700 hover:bg-rose-800 text-white',
          description:
            'CRITICAL WARNING: This permanently deletes this infrastructure record and cannot be undone. Restricted strictly to Super Administrators.',
        };
      default:
        return {
          title: 'Confirm Action',
          subtitle: facilityTitle,
          icon: AlertTriangle,
          iconColor: 'text-slate-600 bg-slate-100',
          confirmBtnText: 'Confirm',
          confirmBtnClass: 'bg-emerald-700 text-white',
          description: 'Are you sure you want to perform this action?',
        };
    }
  };

  const config = getModalConfig();
  const IconComp = config.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.iconColor}`}
            >
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="confirm-action-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {config.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-mono mt-0.5">
                {config.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description Body */}
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {config.description}
        </p>

        {/* Form specific inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {actionType === 'reject' && (
            <div className="space-y-1.5">
              <label
                htmlFor="rejection-reason-input"
                className="font-bold text-slate-700 dark:text-slate-300 block"
              >
                Rejection Reason & Correction Guidance <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="rejection-reason-input"
                rows={3}
                required
                placeholder="Explain required corrections (e.g. verify coordinates precision, add commissioning date)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">
                Internal feedback for staff editors (minimum 5 characters).
              </span>
            </div>
          )}

          {actionType === 'delete' && (
            <div className="space-y-1.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              <label
                htmlFor="delete-confirm-input"
                className="font-bold text-rose-800 dark:text-rose-200 block"
              >
                Type DELETE to confirm irreversible removal <span className="text-rose-500">*</span>
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                required
                placeholder="DELETE"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full p-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className={`px-4 py-2 rounded-lg font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50 ${config.confirmBtnClass}`}
            >
              {isProcessing ? 'Processing Mutation...' : config.confirmBtnText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
