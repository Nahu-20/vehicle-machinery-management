import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Pencil,
  LogOut,
  LogIn,
  AlertTriangle,
  Wrench,
  History,
  Gauge,
  CheckCircle2,
  Droplets,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAssetById,
  listStatusEvents,
  listServiceRecords,
  recordService,
} from '../../../features/fleet/services/fleetService';
import {
  issueAsset,
  returnAsset,
  listAssignmentsForAsset,
  isOverdue,
} from '../../../features/fleet/services/fleetAssignmentService';
import type {
  FleetAsset,
  FleetAssignment,
  FleetFaultSeverity,
  FleetWorkOrder,
  FleetServiceRecord,
  FleetStatusEvent,
  FleetAssetStatus,
} from '../../../features/fleet/types/fleet';
import {
  formatMeter,
  isServiceDue,
  isIssuable,
  meterUntilService,
  METER_UNIT_LABEL,
  MANUAL_ASSET_STATUSES,
  humanise,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  StatusPill,
  SeverityPill,
  WorkOrderPill,
  FleetPanel,
  FleetButton,
  FleetEmptyState,
} from '../../../features/fleet/components/FleetUI';
import {
  changeAssetStatus,
  type ChangeAssetStatusResult,
} from '../../../features/fleet/services/fleetStatusService';
import { AssetImage } from '../../../features/fleet/components/AssetImage';
import { AssetTimeline } from '../../../features/fleet/components/AssetTimeline';
import {
  reportFault,
  listWorkOrdersForAsset,
} from '../../../features/fleet/services/fleetWorkOrderService';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';

const INPUT =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500';
const LABEL =
  'block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

/**
 * What a status change did beyond the status.
 *
 * Closing a colleague's sign-out or opening a job in the garage are other
 * people's work appearing out of nowhere, so the person who caused it is told
 * plainly rather than left to notice on another page.
 */
function summarise(outcome: ChangeAssetStatusResult): string {
  const parts: string[] = ['Status updated'];
  if (outcome.closedAssignmentId) parts.push('the open sign-out was closed');
  if (outcome.raisedWorkOrderId) parts.push('a job was raised under Garage & Repairs');
  if (outcome.cancelledWorkOrders > 0) {
    parts.push(
      `${outcome.cancelledWorkOrders} open garage job${
        outcome.cancelledWorkOrders === 1 ? ' was' : 's were'
      } cancelled`
    );
  }
  return parts.length === 1 ? `${parts[0]}.` : `${parts[0]} — ${parts.slice(1).join(', ')}.`;
}

function fmtDate(ts?: { toDate?: () => Date } | null): string {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminFleetAssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { staffUser } = useStaffAuthorizationContext();

  const canManage = hasPermission(staffUser, 'fleet.asset.manage');
  const canAssign = hasPermission(staffUser, 'fleet.assign');
  const canMaintain = hasPermission(staffUser, 'fleet.maintenance.manage');

  const [asset, setAsset] = useState<FleetAsset | null>(null);
  const [assignments, setAssignments] = useState<FleetAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showIssue, setShowIssue] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const [holderName, setHolderName] = useState('');
  const [holderRef, setHolderRef] = useState('');
  const [purpose, setPurpose] = useState('');
  const [meterOut, setMeterOut] = useState('');
  const [dueAt, setDueAt] = useState('');

  const [meterIn, setMeterIn] = useState('');
  const [returnFaulty, setReturnFaulty] = useState(false);

  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const [showFault, setShowFault] = useState(false);
  const [faultText, setFaultText] = useState('');
  const [severity, setSeverity] = useState<FleetFaultSeverity>('medium');

  const [statusEvents, setStatusEvents] = useState<FleetStatusEvent[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [nextStatus, setNextStatus] = useState<FleetAssetStatus>('available');
  const [statusReason, setStatusReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const [serviceRecords, setServiceRecords] = useState<FleetServiceRecord[]>([]);
  const [showService, setShowService] = useState(false);
  const [serviceMeter, setServiceMeter] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [serviceNote, setServiceNote] = useState('');
  const [serviceCost, setServiceCost] = useState('');

  const load = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const [a, history, faults, events, services] = await Promise.all([
        getAssetById(assetId),
        listAssignmentsForAsset(assetId).catch(() => [] as FleetAssignment[]),
        listWorkOrdersForAsset(assetId).catch(() => [] as FleetWorkOrder[]),
        listStatusEvents(assetId).catch(() => [] as FleetStatusEvent[]),
        listServiceRecords(assetId).catch(() => [] as FleetServiceRecord[]),
      ]);
      if (!a) {
        setError(`Asset ${assetId} was not found.`);
      } else {
        setAsset(a);
        setMeterOut(String(a.currentMeter));
        setMeterIn(String(a.currentMeter));
        // The reading it was serviced at is almost always the reading it is on
        // now, so that is offered rather than an empty box to retype.
        setServiceMeter(String(a.currentMeter));
        setServiceDate(new Date().toISOString().slice(0, 10));
      }
      setAssignments(history);
      setWorkOrders(faults);
      setStatusEvents(events);
      setServiceRecords(services);
      // Not a.status: the current status is often one the dropdown does not
      // offer, and defaulting to a value that is not in the list leaves the
      // select showing the first option while the state says another.
      if (a) {
        setNextStatus(
          MANUAL_ASSET_STATUSES.includes(a.status) ? a.status : MANUAL_ASSET_STATUSES[0]
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the asset.');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeAssignment = assignments.find((a) => a.status === 'active') ?? null;

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !staffUser || busy) return;
    if (!holderName.trim()) return setError('Who is taking the asset?');
    if (!purpose.trim()) return setError('A purpose is required — it is what the register is for.');

    setBusy(true);
    setError(null);
    try {
      await issueAsset(
        {
          assetId: asset.assetId,
          expectedVersion: asset.version,
          // Operators in the zones are rarely system users, so the holder is a
          // name plus an optional staff or employee reference.
          assignedToUid: holderRef.trim() || `unlinked:${holderName.trim()}`,
          assignedToName: holderName.trim(),
          purpose: purpose.trim(),
          meterOut: Number(meterOut),
          dueAt: dueAt ? new Date(`${dueAt}T00:00:00`) : null,
        },
        staffUser
      );
      setShowIssue(false);
      setHolderName('');
      setHolderRef('');
      setPurpose('');
      setDueAt('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not issue the asset.');
    } finally {
      setBusy(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !staffUser || !activeAssignment || busy) return;

    setBusy(true);
    setError(null);
    try {
      await returnAsset(
        {
          assetId: asset.assetId,
          assignmentId: activeAssignment.assignmentId,
          expectedVersion: asset.version,
          meterIn: Number(meterIn),
          returnToMaintenance: returnFaulty,
        },
        staffUser
      );
      setShowReturn(false);
      setReturnFaulty(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not receive the asset.');
    } finally {
      setBusy(false);
    }
  };

  const handleRecordService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !staffUser || busy) return;

    const reading = Number(serviceMeter);
    if (!Number.isFinite(reading)) {
      return setError('Enter the reading the service was done at.');
    }

    setBusy(true);
    setError(null);
    try {
      await recordService(
        {
          assetId: asset.assetId,
          meterAtService: reading,
          // Local midnight rather than UTC: a service done on the 16th should
          // not appear on the 15th for anyone reading it in Addis.
          servicedAt: serviceDate ? new Date(`${serviceDate}T00:00:00`) : new Date(),
          note: serviceNote.trim() || undefined,
          cost: serviceCost.trim() ? Number(serviceCost) : undefined,
        },
        staffUser
      );
      setShowService(false);
      setServiceNote('');
      setServiceCost('');
      setNotice(
        `Service recorded at ${formatMeter(reading, asset.meterType)}. This machine is no longer due.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the service.');
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !staffUser || busy) return;
    if (nextStatus === asset.status) {
      return setError('That is already the current status.');
    }

    setBusy(true);
    setError(null);
    try {
      const outcome = await changeAssetStatus(
        {
          assetId: asset.assetId,
          next: nextStatus,
          expectedVersion: asset.version,
          reason: statusReason.trim() || undefined,
        },
        staffUser
      );
      setShowStatus(false);
      setStatusReason('');
      // Say what else moved. A status change that quietly closed someone's
      // sign-out or opened a garage job should not be silent about it.
      setNotice(summarise(outcome));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the status.');
    } finally {
      setBusy(false);
    }
  };

  const handleReportFault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !staffUser || busy) return;
    if (!faultText.trim()) return setError('Describe the fault.');

    setBusy(true);
    setError(null);
    try {
      await reportFault(
        { assetId: asset.assetId, faultDescription: faultText.trim(), severity },
        staffUser
      );
      setShowFault(false);
      setFaultText('');
      setSeverity('medium');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not report the fault.');
    } finally {
      setBusy(false);
    }
  };
  if (loading) {
    return (
      <FleetPanel title="Loading…">
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
      </FleetPanel>
    );
  }

  if (!asset) {
    return (
      <FleetPanel title="Asset not found">
        <FleetEmptyState
          icon={AlertTriangle}
          title="Not in the register"
          message={error ?? 'That asset does not exist.'}
          action={
            <FleetButton onClick={() => navigate('/admin/fleet/register')}>
              Back to register
            </FleetButton>
          }
        />
      </FleetPanel>
    );
  }

  const due = isServiceDue(asset);
  const remaining = meterUntilService(asset);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FleetButton
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate('/admin/fleet/register')}
        >
          Back to register
        </FleetButton>

        <div className="flex items-center gap-2">
          {canAssign && isIssuable(asset) && (
            <FleetButton icon={LogOut} onClick={() => setShowIssue((v) => !v)}>
              Issue
            </FleetButton>
          )}
          {canAssign && asset.status === 'assigned' && activeAssignment && (
            <FleetButton icon={LogIn} onClick={() => setShowReturn((v) => !v)}>
              Receive back
            </FleetButton>
          )}
          {asset.status !== 'disposed' && (
            <FleetButton variant="secondary" icon={Wrench} onClick={() => setShowFault((v) => !v)}>
              Report fault
            </FleetButton>
          )}
          {canMaintain && asset.status !== 'disposed' && asset.meterType !== 'none' && (
            <FleetButton
              variant="secondary"
              icon={Droplets}
              onClick={() => setShowService((v) => !v)}
            >
              Record service
            </FleetButton>
          )}
          {canManage && asset.status !== 'disposed' && (
            <FleetButton
              variant="secondary"
              icon={ArrowRightLeft}
              onClick={() => setShowStatus((v) => !v)}
            >
              Change status
            </FleetButton>
          )}
          {canManage && (
            <Link to={`/admin/fleet/register/${encodeURIComponent(asset.assetId)}/edit`}>
              <FleetButton variant="secondary" icon={Pencil}>
                Edit
              </FleetButton>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      {/* Identity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <AssetImage
              assetType={asset.assetType}
              imageUrl={asset.imageUrl}
              alt={`${asset.make} ${asset.model}`}
              size="card"
            />
            <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                {asset.assetId}
              </h2>
              <StatusPill status={asset.status} />
              {due && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  <Wrench className="w-3.5 h-3.5" />
                  Service due
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {asset.make} {asset.model}
              {asset.year ? ` · ${asset.year}` : ''}
              {asset.plateNumber ? ` · ${asset.plateNumber}` : ''}
            </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Current reading
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {formatMeter(asset.currentMeter, asset.meterType)}
            </div>
            {remaining !== null && !due && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                service in {formatMeter(remaining, asset.meterType)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Zone</div>
            <div className="text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
              {CANONICAL_ZONE_METADATA[asset.zoneId]?.displayName ?? asset.zoneId}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Station
            </div>
            <div className="text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
              {asset.stationedAt}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Held by
            </div>
            <div className="text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
              {asset.custodianName || '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Insurance
            </div>
            <div className="text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
              {fmtDate(asset.insuranceExpiry)}
            </div>
          </div>
        </div>
      </div>

      {/* Issue */}
      {showIssue && (
        <FleetPanel
          title="Issue this asset"
          description="The meter reading is taken now, at the counter — it is what every later calculation rests on."
        >
          <form onSubmit={handleIssue} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL}>Issued to *</label>
              <input
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Obbo Girmaa Bekele"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Staff or employee reference</label>
              <input
                value={holderRef}
                onChange={(e) => setHolderRef(e.target.value)}
                placeholder="Optional — operators often have no system login"
                className={INPUT}
              />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Purpose *</label>
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ploughing at Boset cooperative"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>
                Meter out {asset.meterType !== 'none' && `(${METER_UNIT_LABEL[asset.meterType]})`}
              </label>
              <input
                type="number"
                value={meterOut}
                onChange={(e) => setMeterOut(e.target.value)}
                disabled={asset.meterType === 'none'}
                className={`${INPUT} font-mono disabled:opacity-50`}
              />
            </div>
            <div>
              <label className={LABEL}>Due back</label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className={INPUT}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => setShowIssue(false)}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={LogOut} disabled={busy}>
                {busy ? 'Issuing…' : 'Confirm issue'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
      )}

      {/* Return */}
      {showReturn && activeAssignment && (
        <FleetPanel
          title="Receive this asset back"
          description={`Issued to ${activeAssignment.assignedToName} at ${formatMeter(
            activeAssignment.meterOut,
            asset.meterType
          )}.`}
        >
          <form onSubmit={handleReturn} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL}>
                Meter in {asset.meterType !== 'none' && `(${METER_UNIT_LABEL[asset.meterType]})`}
              </label>
              <input
                type="number"
                value={meterIn}
                onChange={(e) => setMeterIn(e.target.value)}
                disabled={asset.meterType === 'none'}
                className={`${INPUT} font-mono disabled:opacity-50`}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnFaulty}
                  onChange={(e) => setReturnFaulty(e.target.checked)}
                  className="accent-amber-500"
                />
                Returned with a fault — send to the garage
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => setShowReturn(false)}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={LogIn} disabled={busy}>
                {busy ? 'Receiving…' : 'Confirm return'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
      )}

      {showService && (
        <FleetPanel
          title="Record service"
          description="Logs the work and moves the last-service reading, which is what clears this machine from the service-due list."
        >
          <form onSubmit={handleRecordService} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL}>Reading it was serviced at</label>
              <input
                type="number"
                value={serviceMeter}
                onChange={(e) => setServiceMeter(e.target.value)}
                className={INPUT}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {METER_UNIT_LABEL[asset.meterType]} · currently{' '}
                {formatMeter(asset.currentMeter, asset.meterType)}
                {asset.lastServiceMeter
                  ? `, last serviced at ${formatMeter(asset.lastServiceMeter, asset.meterType)}`
                  : ''}
              </p>
            </div>
            <div>
              <label className={LABEL}>Done on</label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className={INPUT}
              />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>What was done</label>
              <input
                value={serviceNote}
                onChange={(e) => setServiceNote(e.target.value)}
                placeholder="250-hour service — oil, filters, greased"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Cost (optional)</label>
              <input
                type="number"
                value={serviceCost}
                onChange={(e) => setServiceCost(e.target.value)}
                placeholder="ETB"
                className={INPUT}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Kept apart from repair spend, so routine upkeep does not read as a
                machine that keeps breaking.
              </p>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => setShowService(false)}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={Droplets} disabled={busy}>
                {busy ? 'Saving…' : 'Record service'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
      )}

      {showStatus && (
        <FleetPanel
          title="Change status"
          description="Moves the machine and the paperwork together — sending it to the garage raises a job there, and bringing it back closes the open ones."
        >
          <form onSubmit={handleStatusChange} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL}>New status</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as FleetAssetStatus)}
                className={INPUT}
              >
                {MANUAL_ASSET_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {humanise(st)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Assigned is not here: issuing records who has the machine and on what
                reading, which a dropdown cannot. Retiring is not here either — it is
                irreversible and sits with a super admin.
              </p>
            </div>
            <div>
              <label className={LABEL}>Reason</label>
              <input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Withdrawn for the season / correction after stocktake"
                className={INPUT}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Recorded on the timeline. A change with no reason is hard to interpret later.
              </p>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => setShowStatus(false)}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={ArrowRightLeft} disabled={busy}>
                {busy ? 'Saving…' : 'Apply status'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
      )}

      <FleetPanel
        title="Working history"
        description="Everything this machine has done, newest first — issues, returns, faults, repairs and status changes on one timeline."
      >
        <AssetTimeline
          asset={asset}
          statusEvents={statusEvents}
          assignments={assignments}
          workOrders={workOrders}
          serviceRecords={serviceRecords}
        />
      </FleetPanel>

      {showFault && (
        <FleetPanel
          title="Report a fault"
          description="Anyone may report; only the garage moves the job along. A grounded fault takes the machine out of service immediately."
        >
          <form onSubmit={handleReportFault} className="p-6 space-y-5">
            <div>
              <label className={LABEL}>What is wrong? *</label>
              <textarea
                value={faultText}
                onChange={(e) => setFaultText(e.target.value)}
                rows={3}
                placeholder="Hydraulic leak on the left ram; loses pressure under load."
                className={`${INPUT} resize-none`}
              />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="w-full sm:w-64">
                <label className={LABEL}>Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as FleetFaultSeverity)}
                  className={INPUT}
                >
                  <option value="low">Low — cosmetic or minor</option>
                  <option value="medium">Medium — usable, needs attention</option>
                  <option value="high">High — degraded, use with care</option>
                  <option value="grounded">Grounded — cannot work</option>
                </select>
                {severity === 'grounded' && (
                  <p className="mt-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                    This will withdraw the machine from service straight away.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <FleetButton type="button" variant="secondary" onClick={() => setShowFault(false)}>
                  Cancel
                </FleetButton>
                <FleetButton type="submit" icon={Wrench} disabled={busy}>
                  {busy ? 'Reporting…' : 'Report fault'}
                </FleetButton>
              </div>
            </div>
          </form>
        </FleetPanel>
      )}

      <FleetPanel
        title="Repair history"
        description="Every fault reported against this machine, and what it cost to put right."
      >
        {workOrders.length === 0 ? (
          <FleetEmptyState
            icon={Wrench}
            title="No faults recorded"
            message="Nothing has been reported against this asset."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {workOrders.map((wo) => (
              <div key={wo.workOrderId} className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityPill severity={wo.severity} />
                  <WorkOrderPill status={wo.status} />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {fmtDate(wo.reportedAt)}
                    {wo.meterAtReport != null
                      ? ` · at ${formatMeter(wo.meterAtReport, asset.meterType)}`
                      : ''}
                    {wo.totalCost ? ` · ${wo.totalCost.toLocaleString()} ETB` : ''}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-200">
                  {typeof wo.faultDescription === 'string'
                    ? wo.faultDescription
                    : wo.faultDescription?.en ?? '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </FleetPanel>

      {/* History */}
      <FleetPanel
        title="Movement history"
        description="Every issue and return. Rows are never edited after closing — this is what makes the register readable backwards."
      >
        {assignments.length === 0 ? (
          <FleetEmptyState
            icon={History}
            title="Never issued"
            message="This asset has not been signed out yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3">Holder</th>
                  <th className="px-6 py-3">Purpose</th>
                  <th className="px-6 py-3">Out</th>
                  <th className="px-6 py-3">Back</th>
                  <th className="px-6 py-3 text-right">Meter</th>
                  <th className="px-6 py-3 text-right">Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assignments.map((a) => {
                  const used =
                    a.meterIn != null && a.meterOut != null ? a.meterIn - a.meterOut : null;
                  const overdue = isOverdue(a);
                  return (
                    <tr key={a.assignmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {a.assignedToName}
                        </div>
                        {a.status === 'active' && (
                          <span
                            className={`text-[10px] font-bold uppercase ${
                              overdue
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {overdue ? 'Overdue' : 'Out now'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {typeof a.purpose === 'string' ? a.purpose : a.purpose?.en ?? '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {fmtDate(a.issuedAt)}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {a.returnedAt ? fmtDate(a.returnedAt) : fmtDate(a.dueAt) + ' (due)'}
                      </td>
                      <td className="px-6 py-3 text-xs text-right font-mono text-slate-600 dark:text-slate-300">
                        {a.meterOut}
                        {a.meterIn != null ? ` → ${a.meterIn}` : ''}
                      </td>
                      <td className="px-6 py-3 text-xs text-right font-mono font-bold text-slate-700 dark:text-slate-200">
                        {used != null ? (
                          <span className="inline-flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            {formatMeter(used, asset.meterType)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </FleetPanel>
    </div>
  );
}

export default AdminFleetAssetDetailPage;
