import React, { useMemo } from 'react';
import { ArrowRightLeft, LogOut, LogIn, Wrench, CheckCircle2, History } from 'lucide-react';
import type {
  FleetAsset,
  FleetAssignment,
  FleetStatusEvent,
  FleetTimelineEntry,
  FleetWorkOrder,
} from '../types/fleet';
import { formatMeter } from '../constants/fleetVocabulary';
import { StatusPill, SeverityPill, FleetEmptyState } from './FleetUI';

/**
 * One vehicle's working history.
 *
 * Status, assignments and repairs are three collections, but nobody asking
 * "what has this tractor been doing" wants three tables to reconcile by date.
 * They are merged into a single descending timeline: when it went out and to
 * whom, when it came back and on what reading, when it was grounded, how long it
 * sat waiting on a part, and when it was signed back into service.
 *
 * Built from records rather than stored as a narrative, so it cannot drift from
 * what actually happened.
 */

function text(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'en' in (v as any)) return String((v as any).en ?? '');
  return '';
}

export function buildTimeline(
  asset: FleetAsset,
  statusEvents: FleetStatusEvent[],
  assignments: FleetAssignment[],
  workOrders: FleetWorkOrder[]
): FleetTimelineEntry[] {
  const entries: FleetTimelineEntry[] = [];

  for (const e of statusEvents) {
    entries.push({
      id: `st-${e.eventId}`,
      kind: 'status',
      at: e.at,
      title: `Status changed to ${e.to.replace('_', ' ')}`,
      detail: e.reason,
      actorName: e.actorName,
      statusTo: e.to,
    });
  }

  for (const a of assignments) {
    entries.push({
      id: `is-${a.assignmentId}`,
      kind: 'assignment',
      at: a.issuedAt,
      title: `Issued to ${a.assignedToName}`,
      detail: text(a.purpose),
      actorName: a.assignedToName,
      meter: a.meterOut,
    });

    if (a.returnedAt) {
      // Hours or kilometres actually worked on that trip — the figure a manager
      // wants and the one a paper book never adds up.
      const used = a.meterIn != null ? a.meterIn - a.meterOut : null;
      entries.push({
        id: `rt-${a.assignmentId}`,
        kind: 'assignment',
        at: a.returnedAt,
        title: `Returned by ${a.assignedToName}`,
        detail:
          used != null && asset.meterType !== 'none'
            ? `Worked ${formatMeter(used, asset.meterType)} this trip`
            : undefined,
        actorName: a.assignedToName,
        meter: a.meterIn ?? undefined,
      });
    }
  }

  for (const w of workOrders) {
    entries.push({
      id: `wo-${w.workOrderId}`,
      kind: 'work_order',
      at: w.reportedAt,
      title: `Fault reported${w.severity === 'grounded' ? ' — grounded' : ''}`,
      detail: text(w.faultDescription),
      actorName: w.reportedByName,
      severity: w.severity,
      meter: w.meterAtReport,
    });

    if (w.completedAt) {
      entries.push({
        id: `wc-${w.workOrderId}`,
        kind: 'work_order',
        at: w.completedAt,
        title: 'Repair completed',
        detail: w.totalCost ? `${w.totalCost.toLocaleString()} ETB in parts and labour` : undefined,
        actorName: w.assignedTechnician,
      });
    }

    if (w.verifiedAt) {
      entries.push({
        id: `wv-${w.workOrderId}`,
        kind: 'work_order',
        at: w.verifiedAt,
        title: 'Repair verified, returned to service',
        detail: w.assignedGarage,
      });
    }
  }

  return entries.sort((a, b) => b.at.toMillis() - a.at.toMillis());
}

const KIND_ICON = {
  status: ArrowRightLeft,
  assignment: LogOut,
  work_order: Wrench,
};

function iconFor(entry: FleetTimelineEntry) {
  if (entry.kind === 'assignment') return entry.id.startsWith('rt-') ? LogIn : LogOut;
  if (entry.kind === 'work_order') return entry.id.startsWith('wv-') ? CheckCircle2 : Wrench;
  return KIND_ICON.status;
}

function toneFor(entry: FleetTimelineEntry): string {
  if (entry.severity === 'grounded') return 'bg-red-500/15 text-red-600 dark:text-red-400';
  if (entry.kind === 'work_order') {
    return entry.id.startsWith('wv-')
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  }
  if (entry.kind === 'assignment') return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
  return 'bg-slate-500/15 text-slate-600 dark:text-slate-400';
}

function fmt(ts: { toDate?: () => Date }): string {
  if (!ts?.toDate) return '';
  return ts.toDate().toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AssetTimeline: React.FC<{
  asset: FleetAsset;
  statusEvents: FleetStatusEvent[];
  assignments: FleetAssignment[];
  workOrders: FleetWorkOrder[];
}> = ({ asset, statusEvents, assignments, workOrders }) => {
  const entries = useMemo(
    () => buildTimeline(asset, statusEvents, assignments, workOrders),
    [asset, statusEvents, assignments, workOrders]
  );

  if (entries.length === 0) {
    return (
      <FleetEmptyState
        icon={History}
        title="Nothing recorded yet"
        message="Issues, returns, faults and status changes will appear here as they happen."
      />
    );
  }

  return (
    <ol className="p-6 space-y-0">
      {entries.map((entry, i) => {
        const Icon = iconFor(entry);
        const last = i === entries.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* The rail, drawn between markers rather than behind the last one. */}
            {!last && (
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-700"
              />
            )}

            <span
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toneFor(entry)}`}
            >
              <Icon className="w-4 h-4" />
            </span>

            <div className="min-w-0 flex-1 -mt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {entry.title}
                </span>
                {entry.statusTo && <StatusPill status={entry.statusTo} />}
                {entry.severity && entry.id.startsWith('wo-') && (
                  <SeverityPill severity={entry.severity} />
                )}
              </div>

              {entry.detail && (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{entry.detail}</p>
              )}

              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {fmt(entry.at)}
                {entry.actorName ? ` · ${entry.actorName}` : ''}
                {entry.meter != null && asset.meterType !== 'none'
                  ? ` · ${formatMeter(entry.meter, asset.meterType)}`
                  : ''}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default AssetTimeline;
