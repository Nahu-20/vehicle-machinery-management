import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type {
  FleetAssetStatus,
  FleetDriverStatus,
  FleetFaultSeverity,
  FleetWorkOrderStatus,
} from '../types/fleet';
import {
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_PILL_CLASSES,
  LICENCE_LABELS,
  LICENCE_PILL_CLASSES,
  SEVERITY_PILL_CLASSES,
  STATUS_PILL_CLASSES,
  type LicenceState,
} from '../constants/fleetVocabulary';

/**
 * Shared presentation pieces for the fleet module.
 *
 * These exist so every fleet page renders a status the same way. The pill in
 * particular is used on the dashboard, the register and the asset page, and a
 * clerk who learns that amber means "in the garage" in one place should not
 * have to relearn it in another.
 *
 * Styling follows the admin area's slate/emerald vocabulary rather than the
 * public site's forest/lime, because that is where this module lives.
 */

const STATUS_LABELS: Record<FleetAssetStatus, string> = {
  available: 'Available',
  assigned: 'In use',
  in_maintenance: 'In garage',
  awaiting_parts: 'Awaiting parts',
  out_of_service: 'Out of service',
  disposed: 'Disposed',
};

const SEVERITY_LABELS: Record<FleetFaultSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  grounded: 'Grounded',
};

const WORK_ORDER_LABELS: Record<FleetWorkOrderStatus, string> = {
  reported: 'Reported',
  triaged: 'Triaged',
  in_progress: 'In progress',
  awaiting_parts: 'Awaiting parts',
  completed: 'Completed',
  verified: 'Verified',
  cancelled: 'Cancelled',
};

const PILL_BASE =
  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider whitespace-nowrap';

export const StatusPill: React.FC<{ status: FleetAssetStatus; className?: string }> = ({
  status,
  className = '',
}) => (
  <span className={`${PILL_BASE} ${STATUS_PILL_CLASSES[status]} ${className}`}>
    {/* A shape as well as a hue, so the status survives being printed in
        greyscale or read by someone who cannot distinguish the colours. */}
    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
    {STATUS_LABELS[status]}
  </span>
);

export const SeverityPill: React.FC<{ severity: FleetFaultSeverity }> = ({ severity }) => (
  <span className={`${PILL_BASE} ${SEVERITY_PILL_CLASSES[severity]}`}>
    {SEVERITY_LABELS[severity]}
  </span>
);

export const WorkOrderPill: React.FC<{ status: FleetWorkOrderStatus }> = ({ status }) => {
  const tone =
    status === 'verified'
      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      : status === 'cancelled'
      ? 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30'
      : status === 'awaiting_parts'
      ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30'
      : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
  return <span className={`${PILL_BASE} ${tone}`}>{WORK_ORDER_LABELS[status]}</span>;
};

export const DriverStatusPill: React.FC<{ status: FleetDriverStatus }> = ({ status }) => (
  <span className={`${PILL_BASE} ${DRIVER_STATUS_PILL_CLASSES[status]}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
    {DRIVER_STATUS_LABELS[status]}
  </span>
);

/**
 * Where a licence stands.
 *
 * `none` gets its own grey pill rather than being left blank, because a blank
 * cell reads as "fine" and the whole reason this state is named is that it is
 * not.
 */
export const LicencePill: React.FC<{ state: LicenceState; detail?: string }> = ({
  state,
  detail,
}) => (
  <span className={`${PILL_BASE} ${LICENCE_PILL_CLASSES[state]}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
    {detail ? `${LICENCE_LABELS[state]} · ${detail}` : LICENCE_LABELS[state]}
  </span>
);

/**
 * Headline figure card, matching AdminDashboardPage's stat treatment.
 *
 * `tone` exists so the numbers that demand action — grounded machines, overdue
 * returns — can be picked out of a row of otherwise neutral counts.
 */
export const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}> = ({ label, value, icon: Icon, hint, tone = 'neutral' }) => {
  const iconTone = {
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    good: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
    warn: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
    bad: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400',
  }[tone];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{value}</div>
        {hint && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{hint}</div>
        )}
      </div>
      <div className={`p-3.5 rounded-2xl shrink-0 ${iconTone}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

/** Section heading used above tables and panels. */
export const FleetPanel: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, action, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {children}
  </div>
);

/**
 * Empty state.
 *
 * Written to say what to do next rather than only that nothing is here — an
 * empty register on day one is the normal case for this module, not an error.
 */
export const FleetEmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  message: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, message, action }) => (
  <div className="p-12 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/** Primary action button, matching the admin area's emerald treatment. */
export const FleetButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger';
    icon?: LucideIcon;
  }
> = ({ variant = 'primary', icon: Icon, children, className = '', ...rest }) => {
  const tone = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent disabled:bg-emerald-600/50',
    secondary:
      'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent disabled:bg-red-600/50',
  }[variant];

  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors disabled:cursor-not-allowed ${tone} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};
