import React from 'react';
import {
  FileEdit,
  Clock,
  Globe2,
  EyeOff,
  Archive,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Activity,
  Hammer,
  Calendar,
  PowerOff,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  InvestmentLifecycleStatus,
  VerificationStatus,
  FacilityOperationalStatus,
} from '../../../types/investment';

// ==========================================
// 1. CMS Lifecycle Badge
// ==========================================
export function LifecycleStatusBadge({
  status,
  size = 'sm',
}: {
  status?: InvestmentLifecycleStatus | string;
  size?: 'sm' | 'md';
}) {
  const normStatus = status || 'draft';
  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1';

  switch (normStatus) {
    case 'published':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 ${sizeClasses} whitespace-nowrap`}
          title="Published: Content is live in the investment CMS"
        >
          <Globe2 className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Published</span>
        </span>
      );
    case 'review':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 ${sizeClasses} whitespace-nowrap`}
          title="In Review: Locked for editorial verification"
        >
          <Clock className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>In Review</span>
        </span>
      );
    case 'unpublished':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 ${sizeClasses} whitespace-nowrap`}
          title="Unpublished: Withdrawn from live view and editable"
        >
          <EyeOff className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Unpublished</span>
        </span>
      );
    case 'archived':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ${sizeClasses} whitespace-nowrap`}
          title="Archived: Archived for record keeping"
        >
          <Archive className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Archived</span>
        </span>
      );
    case 'draft':
    default:
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 ${sizeClasses} whitespace-nowrap`}
          title="Draft: Work in progress"
        >
          <FileEdit className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Draft</span>
        </span>
      );
  }
}

// ==========================================
// 2. Verification Status Badge
// ==========================================
export function VerificationStatusBadge({
  status,
  size = 'sm',
}: {
  status?: VerificationStatus | string;
  size?: 'sm' | 'md';
}) {
  const normStatus = status || 'pending';
  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1';

  switch (normStatus) {
    case 'verified':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 ${sizeClasses} whitespace-nowrap`}
          title="Verified: Data verified against authoritative sources"
        >
          <ShieldCheck className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Verified</span>
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 ${sizeClasses} whitespace-nowrap`}
          title="Rejected: Needs correction before publication"
        >
          <ShieldAlert className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Rejected</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 ${sizeClasses} whitespace-nowrap`}
          title="Verification Pending: Awaiting review by authorized verifier"
        >
          <AlertCircle className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Pending Verification</span>
        </span>
      );
  }
}

// ==========================================
// 3. Physical Operational Status Badge
// ==========================================
export function OperationalStatusBadge({
  status,
  size = 'sm',
}: {
  status?: FacilityOperationalStatus | string;
  size?: 'sm' | 'md';
}) {
  const normStatus = status || 'operational';
  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1';

  switch (normStatus) {
    case 'operational':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ${sizeClasses} whitespace-nowrap`}
          title="Physical Asset: Currently fully operational"
        >
          <Activity className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Operational</span>
        </span>
      );
    case 'under_construction':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ${sizeClasses} whitespace-nowrap`}
          title="Physical Asset: Under active construction or expansion"
        >
          <Hammer className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Under Construction</span>
        </span>
      );
    case 'planned':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ${sizeClasses} whitespace-nowrap`}
          title="Physical Asset: Planned development or pipeline project"
        >
          <Calendar className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Planned</span>
        </span>
      );
    case 'temporarily_closed':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md border border-orange-200 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 ${sizeClasses} whitespace-nowrap`}
          title="Physical Asset: Temporarily closed for maintenance or seasonal pause"
        >
          <PowerOff className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Temporarily Closed</span>
        </span>
      );
    case 'inactive':
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 ${sizeClasses} whitespace-nowrap`}
          title="Physical Asset: Inactive or decommissioned"
        >
          <PowerOff className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          <span>Inactive</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ${sizeClasses} capitalize whitespace-nowrap`}
        >
          <span>{normStatus.replace(/_/g, ' ')}</span>
        </span>
      );
  }
}

// ==========================================
// 4. Public Visibility Safety Indicator
// ==========================================
export function PublicVisibilityBadge({
  lifecycleStatus,
  verificationStatus,
  size = 'sm',
}: {
  lifecycleStatus?: InvestmentLifecycleStatus | string;
  verificationStatus?: VerificationStatus | string;
  size?: 'sm' | 'md';
}) {
  const isPubliclyLive =
    lifecycleStatus === 'published' && verificationStatus === 'verified';

  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1';

  if (isPubliclyLive) {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 ${sizeClasses} whitespace-nowrap`}
        title="Public Safety Gate Passed: Published & Verified"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Publicly Live</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 ${sizeClasses} whitespace-nowrap`}
      title="Restricted: Hidden from public view until published AND verified"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      <span>Private (Staff Only)</span>
    </span>
  );
}
