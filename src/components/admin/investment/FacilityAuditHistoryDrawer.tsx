import React from 'react';
import {
  Clock,
  User,
  ShieldCheck,
  FileEdit,
  Globe2,
  EyeOff,
  Archive,
  RotateCcw,
  Trash2,
  X,
  Layers,
} from 'lucide-react';
import { InvestmentAuditLog } from '../../../types/investment';

interface FacilityAuditHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: InvestmentAuditLog[];
  facilityTitle: string;
  facilityId: string;
  isLoading?: boolean;
}

export function FacilityAuditHistoryDrawer({
  isOpen,
  onClose,
  auditLogs,
  facilityTitle,
  facilityId,
  isLoading = false,
}: FacilityAuditHistoryDrawerProps) {
  if (!isOpen) return null;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'publish_facility':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <Globe2 className="w-3 h-3" /> Published
          </span>
        );
      case 'unpublish_facility':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
            <EyeOff className="w-3 h-3" /> Unpublished
          </span>
        );
      case 'verify_facility':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Verified
          </span>
        );
      case 'submit_facility_review':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Submitted for Review
          </span>
        );
      case 'archive_facility':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
            <Archive className="w-3 h-3" /> Archived
          </span>
        );
      case 'restore_facility':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Restored
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
            <FileEdit className="w-3 h-3" /> {action.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-drawer-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-lg h-full shadow-2xl flex flex-col text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3
                id="audit-drawer-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Governance Audit Log
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Authoritative mutation history for <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{facilityId}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit log drawer"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading authoritative audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No Audit Events Logged</p>
              <p className="text-[11px]">
                Server-side audit trails will appear here upon state transitions and updates.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 py-2">
              {auditLogs.map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });

                return (
                  <div key={log.id} className="relative pl-6 space-y-1.5">
                    {/* Circle marker */}
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-600 dark:border-emerald-500" />

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {getActionBadge(log.action)}
                      <span className="text-[11px] text-slate-400 font-mono">{dateStr}</span>
                    </div>

                    <p className="text-slate-900 dark:text-slate-100 font-medium leading-snug">
                      {log.summary}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {log.actorEmail || log.actorUid}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">
                          {log.actorRole}
                        </span>
                      </span>

                      {typeof log.previousVersion === 'number' && typeof log.newVersion === 'number' && (
                        <span className="font-mono text-[10px] text-slate-400">
                          v{log.previousVersion} → v{log.newVersion}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Immutable trusted backend audit trail
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
