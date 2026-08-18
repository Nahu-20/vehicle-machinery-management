import React from 'react';
import {
  CheckCircle2,
  UserCheck,
  Wrench,
  PackageSearch,
  Ban,
  Archive,
  type LucideIcon,
} from 'lucide-react';
import type {
  FleetAssetStatus,
  FleetDriverStatus,
  FleetFaultSeverity,
  FleetWorkOrderStatus,
} from '../types/fleet';
import {
  COMPLIANCE_LABELS,
  COMPLIANCE_PILL_CLASSES,
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_PILL_CLASSES,
  LICENCE_LABELS,
  LICENCE_PILL_CLASSES,
  SEVERITY_PILL_CLASSES,
  STATUS_PILL_CLASSES,
  type ComplianceSeverity,
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

export const STATUS_LABELS: Record<FleetAssetStatus, string> = {
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

export const PILL_BASE =
  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider whitespace-nowrap';

/**
 * A glyph per status, alongside the colour.
 *
 * The dot underneath was already there so the pill survived greyscale, but a dot
 * only says "this is a status", not which one. The glyph is the part someone
 * scanning a column of thirty rows actually reads — the colour tells them where
 * to look and the shape tells them what they are looking at.
 */
const STATUS_ICON: Record<FleetAssetStatus, LucideIcon> = {
  available: CheckCircle2,
  assigned: UserCheck,
  in_maintenance: Wrench,
  awaiting_parts: PackageSearch,
  out_of_service: Ban,
  disposed: Archive,
};

export const StatusPill: React.FC<{ status: FleetAssetStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const Icon = STATUS_ICON[status];
  return (
    <span className={`${PILL_BASE} ${STATUS_PILL_CLASSES[status]} ${className}`}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
};

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
 * Where one document stands.
 *
 * 'Not recorded' gets a pill of its own rather than an empty cell, because an
 * empty cell reads as nothing to worry about and that is the exact mistake this
 * vocabulary exists to stop.
 */
export const CompliancePill: React.FC<{ severity: ComplianceSeverity; detail?: string }> = ({
  severity,
  detail,
}) => (
  <span className={`${PILL_BASE} ${COMPLIANCE_PILL_CLASSES[severity]}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
    {detail ? `${COMPLIANCE_LABELS[severity]} · ${detail}` : COMPLIANCE_LABELS[severity]}
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

/* ------------------------------------------------------------------ charts */

/*
 * Drawn by hand, in SVG and CSS, rather than by adding a charting library.
 *
 * Three reasons. The shapes needed here are a bar, a column and a sparkline, and
 * a library that draws those also ships axes, legends, tooltips and a rendering
 * layer this module will never use — on a portal that already carries Mapbox.
 * The horizontal bar in particular already existed in four hand-written copies
 * across this repo, so the choice was never library-or-nothing, it was
 * one-copy-or-four. And a chart nobody can read is worse than a table, so each
 * of these carries a text label and an aria-label; the dashboard readiness bar
 * was the only graphic in the module that had one before.
 */

/**
 * A proportion, as a horizontal bar.
 *
 * Consolidates the idiom from the fleet dashboard's readiness column and the
 * three copies outside this module (AlertsRiskRadar, ProgramCard,
 * ProgramDossierModal). Tone is passed rather than derived, because what counts
 * as good differs per caller: high availability is good, high fuel spend is not.
 */
export const FleetBar: React.FC<{
  value: number;
  max: number;
  label: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
  className?: string;
}> = ({ value, max, label, tone = 'neutral', className = '' }) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fill = {
    good: 'bg-emerald-500',
    warn: 'bg-amber-500',
    bad: 'bg-red-500',
    neutral: 'bg-slate-400 dark:bg-slate-500',
  }[tone];

  return (
    <div
      className={`h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden ${className}`}
      role="img"
      aria-label={label}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${fill}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export interface ColumnDatum {
  label: string;
  value: number;
  /** Shown under the column when there is room. Falls back to `label`. */
  shortLabel?: string;
}

/**
 * A run of columns over time.
 *
 * Zero-baselined deliberately. A chart that starts its axis at the smallest
 * value makes a 5% wobble look like a collapse, which is exactly the mistake
 * that gets a fleet officer asked why spending "doubled" when it did not.
 */
export const FleetColumnChart: React.FC<{
  data: ColumnDatum[];
  /** Formats the value for the tooltip and the accessible description. */
  format?: (value: number) => string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
  height?: number;
  caption: string;
}> = ({ data, format = (v) => v.toLocaleString(), tone = 'neutral', height = 120, caption }) => {
  const max = Math.max(...data.map((d) => d.value), 0);
  const fill = {
    good: 'bg-emerald-500',
    warn: 'bg-amber-500',
    bad: 'bg-red-500',
    neutral: 'bg-emerald-600/80 dark:bg-emerald-500/70',
  }[tone];

  if (data.length === 0 || max <= 0) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
        Nothing to chart yet.
      </div>
    );
  }

  return (
    <figure
      role="img"
      aria-label={`${caption}. ${data.map((d) => `${d.label}: ${format(d.value)}`).join('; ')}`}
    >
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 min-w-0 flex flex-col justify-end h-full group">
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {format(d.value)}
            </div>
            <div
              className={`w-full rounded-t-md transition-all duration-500 ${fill}`}
              // A floor of 2px so an occupied-but-tiny month is still visibly
              // different from a month with nothing in it.
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
              title={`${d.label}: ${format(d.value)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d) => (
          <div
            key={d.label}
            className="flex-1 min-w-0 text-[10px] text-slate-500 dark:text-slate-400 text-center truncate"
          >
            {d.shortLabel ?? d.label}
          </div>
        ))}
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
};

/**
 * A trend line, small enough to sit inside a table row.
 *
 * No axis and no scale: it answers "which way is this going", not "by how much".
 * The number beside it answers that, which is why this is never shown alone.
 */
export const FleetSparkline: React.FC<{
  values: number[];
  label: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
  width?: number;
  height?: number;
}> = ({ values, label, tone = 'neutral', width = 96, height = 24 }) => {
  const stroke = {
    good: 'stroke-emerald-500',
    warn: 'stroke-amber-500',
    bad: 'stroke-red-500',
    neutral: 'stroke-slate-400',
  }[tone];

  if (values.length < 2) {
    return (
      <span className="text-[10px] text-slate-400 dark:text-slate-500" title={label}>
        not enough history
      </span>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      // Inset by 2px top and bottom so the stroke is not clipped at the extremes.
      const y = height - 2 - ((v - min) / span) * (height - 4);
      return `${(i * step).toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={stroke}
      />
    </svg>
  );
};

/* ------------------------------------------------------ form vocabulary */

/*
 * These two strings were written out in six page files, identical every time,
 * and SELECT_CLASSES in two more. That is not a style choice repeated; it is one
 * style choice that six files would have to agree to change. Hoisted so the next
 * person adjusting a focus ring adjusts it once.
 */

export const INPUT =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500';

export const LABEL =
  'block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

export const SELECT_CLASSES =
  'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500';

/* ------------------------------------------------------------- formatters */

/**
 * A date, written the way the Bureau writes one.
 *
 * Five near-identical copies of this existed across the fleet pages, two of them
 * called fmtDate and three fmtDay, differing only in whether they returned '—'
 * or ''. Same function, three names, two behaviours.
 */
export function fmtDay(ts?: { toDate?: () => Date } | null, fallback = '—'): string {
  if (!ts?.toDate) return fallback;
  return ts.toDate().toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtDateTime(ts?: { toDate?: () => Date } | null, fallback = '—'): string {
  if (!ts?.toDate) return fallback;
  return ts.toDate().toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Money, always with its unit. There is no currency formatter in this repo. */
export function etb(value: number): string {
  return `${Math.round(value).toLocaleString()} ETB`;
}

/* --------------------------------------------------------- page furniture */

/**
 * Loading, and the two banner tones.
 *
 * Every page hand-wrote these — twelve loading divs and two flavours of error
 * box, drifting in padding and wording. They say nothing a component cannot.
 */
export const FleetLoading: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div
    className="p-12 text-center text-xs text-slate-500 dark:text-slate-400"
    role="status"
    aria-live="polite"
  >
    {label}
  </div>
);

export const FleetBanner: React.FC<{
  tone: 'error' | 'warn' | 'info' | 'success';
  children: React.ReactNode;
  icon?: LucideIcon;
}> = ({ tone, children, icon: Icon }) => {
  const skin = {
    error: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
    info: 'border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 text-xs flex items-start gap-2 ${skin}`} role="alert">
      {Icon && <Icon className="w-4 h-4 shrink-0 mt-0.5" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
};

/**
 * A segmented filter strip.
 *
 * Answers "what is out right now" in one click, where the register previously
 * needed a dropdown hunted through five options. Counts sit in the tab because a
 * filter that turns out to be empty should say so before it is chosen, not
 * after.
 */
export interface FleetTab<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export function FleetTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: FleetTab<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-1 overflow-x-auto scrollbar-none"
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
              on
                ? 'bg-emerald-600 text-white border-transparent'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-2 ${on ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

