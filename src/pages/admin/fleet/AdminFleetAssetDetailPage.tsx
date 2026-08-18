import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Fuel,
  ShieldAlert,
  Archive,
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
  FleetDriver,
  FleetFuelLog,
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
  assessDriverForAsset,
  assessAssetCompliance,
  licenceState,
  computeConsumption,
  compareToOwnAverage,
  FUEL_UNIT_LABEL,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  StatusPill,
  SeverityPill,
  WorkOrderPill,
  FleetPanel,
  FleetButton,
  FleetEmptyState,
  LicencePill,
  CompliancePill,
  INPUT,
  LABEL,
  fmtDay as fmtDate,
  FleetLoading,
  FleetBanner,
} from '../../../features/fleet/components/FleetUI';
import {
  changeAssetStatus,
  type ChangeAssetStatusResult,
} from '../../../features/fleet/services/fleetStatusService';
import { listDrivers } from '../../../features/fleet/services/fleetDriverService';
import {
  listFuelLogs,
  recordFuelFill,
} from '../../../features/fleet/services/fleetFuelService';
import { AssetImage } from '../../../features/fleet/components/AssetImage';
import { AssetTimeline } from '../../../features/fleet/components/AssetTimeline';
import {
  reportFault,
  listWorkOrdersForAsset,
} from '../../../features/fleet/services/fleetWorkOrderService';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';


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


/** The forms on this page. Exactly one may be open at a time. */
type PanelName = 'issue' | 'return' | 'fault' | 'status' | 'retire' | 'fuel' | 'service' | null;

export function AdminFleetAssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { staffUser } = useStaffAuthorizationContext();

  const canManage = hasPermission(staffUser, 'fleet.asset.manage');
  const canAssign = hasPermission(staffUser, 'fleet.assign');
  const canMaintain = hasPermission(staffUser, 'fleet.maintenance.manage');
  const canFuel = hasPermission(staffUser, 'fleet.fuel.record');
  // Held by superAdmin alone. firestore.rules enforces the same thing server
  // side by refusing any write that sets the status to 'disposed' from anyone
  // else, so hiding the button is courtesy rather than the control itself.
  const canRetire = hasPermission(staffUser, 'fleet.asset.retire');

  const [asset, setAsset] = useState<FleetAsset | null>(null);
  const [assignments, setAssignments] = useState<FleetAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /*
   * Which panel is open, as one value rather than seven booleans.
   *
   * They were independent, so nothing stopped three being open at once, and a
   * form renders where it sits in the markup rather than next to the button
   * that opens it — the fault form is most of a screen below its toolbar
   * button, which reads as the button doing nothing at all.
   *
   * One at a time, and the open one scrolls itself into view.
   */
  const [activePanel, setActivePanel] = useState<PanelName>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const togglePanel = useCallback(
    (name: Exclude<PanelName, null>) => setActivePanel((cur) => (cur === name ? null : name)),
    []
  );
  const closePanel = useCallback(() => setActivePanel(null), []);

  useEffect(() => {
    if (!activePanel) return;
    // The panel mounts in the same commit, so the node exists by the time this
    // runs. 'nearest' rather than 'start': a form already on screen should not
    // scroll the header away for no reason.
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activePanel]);

  const showIssue = activePanel === 'issue';
  const showReturn = activePanel === 'return';

  const [holderName, setHolderName] = useState('');
  const [holderRef, setHolderRef] = useState('');
  const [purpose, setPurpose] = useState('');
  const [meterOut, setMeterOut] = useState('');
  const [dueAt, setDueAt] = useState('');

  const [meterIn, setMeterIn] = useState('');
  const [returnFaulty, setReturnFaulty] = useState(false);

  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const showFault = activePanel === 'fault';
  const [faultText, setFaultText] = useState('');
  const [severity, setSeverity] = useState<FleetFaultSeverity>('medium');

  const [statusEvents, setStatusEvents] = useState<FleetStatusEvent[]>([]);
  const showStatus = activePanel === 'status';
  const [nextStatus, setNextStatus] = useState<FleetAssetStatus>('available');
  const [statusReason, setStatusReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Retirement. The confirm box is not decoration: this is the one action in
  // the module with no way back, and the asset id has to be typed rather than
  // clicked so that retiring the wrong machine takes a deliberate mistake.
  const showRetire = activePanel === 'retire';
  const [retireReason, setRetireReason] = useState('');
  const [retireConfirm, setRetireConfirm] = useState('');

  // The directory, loaded once with the page. A few hundred rows at most, and
  // fetching it per keystroke would be slower than holding it.
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [driverId, setDriverId] = useState('');

  const [fuelLogs, setFuelLogs] = useState<FleetFuelLog[]>([]);
  const showFuel = activePanel === 'fuel';
  const [fuelDate, setFuelDate] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [fuelTotal, setFuelTotal] = useState('');
  const [fuelMeter, setFuelMeter] = useState('');
  const [fuelFull, setFuelFull] = useState(true);
  const [fuelStation, setFuelStation] = useState('');
  const [fuelRef, setFuelRef] = useState('');

  const [serviceRecords, setServiceRecords] = useState<FleetServiceRecord[]>([]);
  const showService = activePanel === 'service';
  const [serviceMeter, setServiceMeter] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [serviceNote, setServiceNote] = useState('');
  const [serviceCost, setServiceCost] = useState('');

  const load = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    try {
      const [a, history, faults, events, services, driverRows, fuelRows] = await Promise.all([
        getAssetById(assetId),
        listAssignmentsForAsset(assetId).catch(() => [] as FleetAssignment[]),
        listWorkOrdersForAsset(assetId).catch(() => [] as FleetWorkOrder[]),
        listStatusEvents(assetId).catch(() => [] as FleetStatusEvent[]),
        listServiceRecords(assetId).catch(() => [] as FleetServiceRecord[]),
        // Non-critical: without it the form falls back to a typed name, which
        // is exactly what it did before drivers existed.
        listDrivers({ status: 'active' }).catch(() => [] as FleetDriver[]),
        listFuelLogs(assetId).catch(() => [] as FleetFuelLog[]),
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
        setFuelMeter(a.meterType === 'none' ? '' : String(a.currentMeter));
        setFuelDate(new Date().toISOString().slice(0, 10));
      }
      setAssignments(history);
      setWorkOrders(faults);
      setStatusEvents(events);
      setServiceRecords(services);
      setDrivers(driverRows);
      setFuelLogs(fuelRows);
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

  /**
   * Drivers offered for this machine.
   *
   * The zone the machine sits in comes first, because that is who will actually
   * be standing at the counter, but the rest of the register follows rather than
   * being hidden — machines do get moved between zones, and a picker that
   * silently omits the right person sends the clerk to the free-text box.
   */
  const driverOptions = useMemo(() => {
    if (!asset) return [] as FleetDriver[];
    const here = drivers.filter((d) => d.zoneId === asset.zoneId);
    const elsewhere = drivers.filter((d) => d.zoneId !== asset.zoneId);
    return [...here, ...elsewhere];
  }, [drivers, asset]);

  /** This machine's own fuel record, and whether it is drifting. */
  const fuelPoints = useMemo(
    () => (asset ? computeConsumption(asset, fuelLogs) : []),
    [asset, fuelLogs]
  );
  const fuelTrend = useMemo(
    () => (asset ? compareToOwnAverage(fuelPoints, asset.meterType) : null),
    [fuelPoints, asset]
  );

  const complianceItems = useMemo(
    () => (asset ? assessAssetCompliance(asset) : []),
    [asset]
  );

  const chosenDriver = useMemo(
    () => drivers.find((d) => d.driverId === driverId) ?? null,
    [drivers, driverId]
  );

  /** What the rules say about this pairing, computed as the clerk chooses. */
  const eligibility = useMemo(
    () => (chosenDriver && asset ? assessDriverForAsset(chosenDriver, asset) : null),
    [chosenDriver, asset]
  );

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !staffUser || busy) return;
    const name = chosenDriver ? chosenDriver.fullName : holderName.trim();
    if (!name) return setError('Who is taking the asset?');
    if (!purpose.trim()) return setError('A purpose is required — it is what the register is for.');
    // The same verdict the service will reach, said before the round trip so the
    // clerk is not told 'no' by a failed save.
    if (eligibility && !eligibility.allowed) return setError(eligibility.reason ?? 'Not permitted.');

    setBusy(true);
    setError(null);
    try {
      await issueAsset(
        {
          assetId: asset.assetId,
          expectedVersion: asset.version,
          // Operators in the zones are rarely system users, so the holder is a
          // name plus an optional staff or employee reference. A driver record
          // supplies both, and the name is still written down rather than
          // joined, so this row keeps reading correctly years later.
          assignedToUid: chosenDriver
            ? `driver:${chosenDriver.driverId}`
            : holderRef.trim() || `unlinked:${name}`,
          assignedToName: name,
          driverId: chosenDriver ? chosenDriver.driverId : null,
          purpose: purpose.trim(),
          meterOut: Number(meterOut),
          dueAt: dueAt ? new Date(`${dueAt}T00:00:00`) : null,
        },
        staffUser
      );
      closePanel();
      setHolderName('');
      setHolderRef('');
      setDriverId('');
      setPurpose('');
      setDueAt('');
      setNotice(
        eligibility?.warning
          ? `${asset.assetId} issued to ${name}. ${eligibility.warning}`
          : `${asset.assetId} issued to ${name}.`
      );
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
      closePanel();
      setReturnFaulty(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not receive the asset.');
    } finally {
      setBusy(false);
    }
  };

  const handleRecordFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !staffUser || busy) return;

    const litresValue = Number(fuelLitres);
    if (!Number.isFinite(litresValue) || litresValue <= 0) {
      return setError('Enter the litres put in.');
    }
    const cost = Number(fuelTotal);
    if (!Number.isFinite(cost) || cost < 0) return setError('Enter what it cost.');

    const needsMeter = asset.meterType !== 'none';
    const meter = fuelMeter.trim() ? Number(fuelMeter) : null;
    if (needsMeter && (meter === null || !Number.isFinite(meter))) {
      return setError('The reading at the pump is needed — every later figure rests on it.');
    }

    setBusy(true);
    setError(null);
    try {
      await recordFuelFill(
        {
          assetId: asset.assetId,
          expectedVersion: asset.version,
          filledAt: fuelDate ? new Date(`${fuelDate}T00:00:00`) : new Date(),
          litres: litresValue,
          costPerLitre: fuelPrice.trim() ? Number(fuelPrice) : undefined,
          totalCost: cost,
          meterAtFill: needsMeter ? meter : null,
          fullTank: fuelFull,
          station: fuelStation.trim() || undefined,
          reference: fuelRef.trim() || undefined,
          driverId: asset.custodianDriverId ?? null,
          driverName: asset.custodianName,
        },
        staffUser
      );
      closePanel();
      setFuelLitres('');
      setFuelTotal('');
      setFuelRef('');
      setNotice(
        fuelFull
          ? `${litresValue} L recorded against ${asset.assetId}.`
          : `${litresValue} L recorded as a part-fill — its litres count towards the next full tank.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the fill.');
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
      closePanel();
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
      closePanel();
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

  /**
   * Retire the machine.
   *
   * The only irreversible act in the module: 'disposed' is a terminal status,
   * there is no path back from it, and every page filters disposed assets out.
   * So this asks for two things a misclick cannot supply — a reason, which the
   * timeline keeps, and the asset id typed out.
   *
   * firestore.rules refuses a 'disposed' write from anyone but a super admin
   * regardless of what this page shows, so a fleet officer who reached this
   * form would still be stopped at the server.
   */
  const handleRetire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !staffUser || busy) return;
    if (!retireReason.trim()) {
      return setError('Say why it is being retired — the register keeps the reason.');
    }
    if (retireConfirm.trim() !== asset.assetId) {
      return setError(`Type ${asset.assetId} to confirm.`);
    }

    setBusy(true);
    setError(null);
    try {
      // The same path as any other status change, so an open sign-out is closed
      // and open garage jobs are cancelled rather than left behind pointing at a
      // machine the Bureau no longer owns.
      const outcome = await changeAssetStatus(
        {
          assetId: asset.assetId,
          next: 'disposed',
          expectedVersion: asset.version,
          reason: retireReason.trim(),
        },
        staffUser
      );
      closePanel();
      setRetireReason('');
      setRetireConfirm('');
      const tidied = summarise(outcome).replace(/^Status updated( — )?/, '').replace(/\.$/, '');
      setNotice(
        tidied
          ? `${asset.assetId} is retired — ${tidied}. It stays in the register.`
          : `${asset.assetId} is retired. It stays in the register, out of service.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not retire the asset.');
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
      closePanel();
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
        <FleetLoading />
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
            <FleetButton icon={LogOut} onClick={() => togglePanel('issue')}>
              Issue
            </FleetButton>
          )}
          {canAssign && asset.status === 'assigned' && activeAssignment && (
            <FleetButton icon={LogIn} onClick={() => togglePanel('return')}>
              Receive back
            </FleetButton>
          )}
          {asset.status !== 'disposed' && (
            <FleetButton variant="secondary" icon={Wrench} onClick={() => togglePanel('fault')}>
              Report fault
            </FleetButton>
          )}
          {canFuel && asset.status !== 'disposed' && (
            <FleetButton
              variant="secondary"
              icon={Fuel}
              onClick={() => togglePanel('fuel')}
            >
              Record fill
            </FleetButton>
          )}
          {canMaintain && asset.status !== 'disposed' && asset.meterType !== 'none' && (
            <FleetButton
              variant="secondary"
              icon={Droplets}
              onClick={() => togglePanel('service')}
            >
              Record service
            </FleetButton>
          )}
          {canManage && asset.status !== 'disposed' && (
            <FleetButton
              variant="secondary"
              icon={ArrowRightLeft}
              onClick={() => togglePanel('status')}
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
          {canRetire && asset.status !== 'disposed' && (
            <FleetButton
              variant="danger"
              icon={Archive}
              onClick={() => togglePanel('retire')}
            >
              Retire
            </FleetButton>
          )}
        </div>
      </div>

      {error && (
        <FleetBanner tone="error" icon={AlertTriangle}><span>{error}</span></FleetBanner>
      )}

      {notice && (
        <FleetBanner tone="success" icon={CheckCircle2}><span>{notice}</span></FleetBanner>
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
              {asset.custodianDriverId ? (
                <Link
                  to={`/admin/fleet/drivers/${asset.custodianDriverId}`}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  {asset.custodianName}
                </Link>
              ) : (
                asset.custodianName || '—'
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Insurance
            </div>
            <div className="text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
              {fmtDate(asset.insuranceExpiry)}
            </div>
            {asset.insurancePolicyNumber && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {asset.insurancePolicyNumber}
                {asset.insurer ? ` · ${asset.insurer}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* What it costs to run, when there is enough to say anything. */}
        {fuelTrend && fuelTrend.average !== null && (
          <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Fuel className="w-3.5 h-3.5 shrink-0 text-violet-500" />
              <span className="font-mono font-bold">
                {fuelTrend.average.toFixed(2)} {FUEL_UNIT_LABEL[asset.meterType]}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                over {fuelTrend.measurableFills} measured fill
                {fuelTrend.measurableFills === 1 ? '' : 's'}
              </span>
            </span>
            {fuelTrend.worseByPct !== null && fuelTrend.worseByPct >= 15 && (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                Lately {fuelTrend.worseByPct.toFixed(0)}% worse than its own average
              </span>
            )}
            <Link
              to="/admin/fleet/fuel"
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Fuel →
            </Link>
          </div>
        )}

        {/* Documents, said out loud rather than left to a blank date field.
            An empty date is not the same as a valid one, and this is the page
            somebody opens when they are standing next to the vehicle. */}
        {complianceItems.length > 0 && (
          <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-6 gap-y-2">
            {complianceItems.map((item) => (
              <span key={item.kind} className="inline-flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</span>
                <CompliancePill
                  severity={item.severity}
                  detail={
                    item.severity === 'lapsed' && item.days !== null
                      ? `${Math.abs(item.days)}d ago`
                      : item.severity === 'due_soon' && item.days !== null
                      ? `${item.days}d`
                      : undefined
                  }
                />
              </span>
            ))}
            <Link
              to="/admin/fleet/compliance"
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Compliance →
            </Link>
          </div>
        )}
      </div>

      {/* Issue */}
      {showIssue && (
        <div ref={panelRef}>
        <FleetPanel
          title="Issue this asset"
          description="The meter reading is taken now, at the counter — it is what every later calculation rests on."
        >
          <form onSubmit={handleIssue} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL}>Driver</label>
              <select
                value={driverId}
                onChange={(e) => {
                  setDriverId(e.target.value);
                  setError(null);
                }}
                className={INPUT}
              >
                <option value="">Someone not in the directory…</option>
                {driverOptions.map((d) => (
                  <option key={d.driverId} value={d.driverId}>
                    {d.fullName} · {d.driverId}
                    {d.zoneId !== asset.zoneId
                      ? ` (${CANONICAL_ZONE_METADATA[d.zoneId]?.displayName ?? d.zoneId})`
                      : ''}
                  </option>
                ))}
              </select>
              {chosenDriver && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <LicencePill state={licenceState(chosenDriver)} />
                  {chosenDriver.phone && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {chosenDriver.phone}
                    </span>
                  )}
                  <Link
                    to={`/admin/fleet/drivers/${chosenDriver.driverId}`}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Open record
                  </Link>
                </div>
              )}
            </div>

            {chosenDriver ? (
              <div className="flex items-end">
                {eligibility && !eligibility.allowed ? (
                  <div className="w-full rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{eligibility.reason}</span>
                  </div>
                ) : eligibility?.warning ? (
                  <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{eligibility.warning}</span>
                  </div>
                ) : (
                  <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Nothing on record stops this issue.</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className={LABEL}>Issued to *</label>
                <input
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="Obbo Girmaa Bekele"
                  className={INPUT}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  A typed name records the sign-out but checks no licence, and it
                  will not appear on anyone's driver page. Add them to the
                  directory when there is time.
                </p>
              </div>
            )}

            {!chosenDriver && (
              <div className="md:col-span-2">
                <label className={LABEL}>Staff or employee reference</label>
                <input
                  value={holderRef}
                  onChange={(e) => setHolderRef(e.target.value)}
                  placeholder="Optional — operators often have no system login"
                  className={INPUT}
                />
              </div>
            )}
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
              <FleetButton type="button" variant="secondary" onClick={() => closePanel()}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={LogOut} disabled={busy}>
                {busy ? 'Issuing…' : 'Confirm issue'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
        </div>
      )}

      {/* Return */}
      {showReturn && activeAssignment && (
        <div ref={panelRef}>
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
              <FleetButton type="button" variant="secondary" onClick={() => closePanel()}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={LogIn} disabled={busy}>
                {busy ? 'Receiving…' : 'Confirm return'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
        </div>
      )}

      {showFuel && (
        <div ref={panelRef}>
        <FleetPanel
          title="Record a fill"
          description="From the slip. Consumption is measured between two full tanks, so whether this one filled the tank matters as much as the litres."
        >
          <form onSubmit={handleRecordFuel} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={LABEL}>Litres *</label>
              <input
                type="number"
                step="0.01"
                value={fuelLitres}
                onChange={(e) => {
                  setFuelLitres(e.target.value);
                  const l = Number(e.target.value);
                  const p = Number(fuelPrice);
                  if (l > 0 && p > 0) setFuelTotal(String(Math.round(l * p)));
                }}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Price per litre</label>
              <input
                type="number"
                step="0.01"
                value={fuelPrice}
                onChange={(e) => {
                  setFuelPrice(e.target.value);
                  const l = Number(fuelLitres);
                  const p = Number(e.target.value);
                  if (l > 0 && p > 0) setFuelTotal(String(Math.round(l * p)));
                }}
                placeholder="ETB"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Total cost *</label>
              <input
                type="number"
                value={fuelTotal}
                onChange={(e) => setFuelTotal(e.target.value)}
                placeholder="ETB"
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>Date</label>
              <input
                type="date"
                value={fuelDate}
                onChange={(e) => setFuelDate(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>
                Reading at the pump{' '}
                {asset.meterType !== 'none' ? `(${METER_UNIT_LABEL[asset.meterType]})` : ''}
              </label>
              <input
                type="number"
                value={fuelMeter}
                onChange={(e) => setFuelMeter(e.target.value)}
                disabled={asset.meterType === 'none'}
                className={`${INPUT} disabled:opacity-50`}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {asset.meterType === 'none'
                  ? 'No meter, so this fill can be costed but not rated.'
                  : `Currently ${formatMeter(asset.currentMeter, asset.meterType)}. A higher reading moves the register forward.`}
              </p>
            </div>
            <div>
              <label className={LABEL}>Slip number</label>
              <input
                value={fuelRef}
                onChange={(e) => setFuelRef(e.target.value)}
                placeholder="FS-000000"
                className={`${INPUT} font-mono`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={LABEL}>Station</label>
              <input
                value={fuelStation}
                onChange={(e) => setFuelStation(e.target.value)}
                placeholder="NOC Adama"
                className={INPUT}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-start gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={fuelFull}
                  onChange={(e) => setFuelFull(e.target.checked)}
                  className="accent-emerald-600 mt-0.5"
                />
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  Filled to the top
                </span>
              </label>
            </div>

            <div className="md:col-span-3 flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => closePanel()}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={Fuel} disabled={busy}>
                {busy ? 'Saving…' : 'Record fill'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
        </div>
      )}

      {showService && (
        <div ref={panelRef}>
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
              <FleetButton type="button" variant="secondary" onClick={() => closePanel()}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={Droplets} disabled={busy}>
                {busy ? 'Saving…' : 'Record service'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
        </div>
      )}

      {showRetire && (
        <div ref={panelRef}>
        <FleetPanel
          title="Retire this machine"
          description="The Bureau no longer owns it — sold, scrapped or written off. The record stays; nothing comes back from this status."
        >
          <form onSubmit={handleRetire} className="p-6 space-y-5">
            <FleetBanner tone="error" icon={ShieldAlert}>
              <span>
                Retiring is permanent. {asset.assetId} will drop out of the garage, the map
                and the fuel pages, and cannot be issued to anyone again. If it is only
                unusable for now, use <strong>Change status</strong> and pick Out of service
                instead.
              </span>
            </FleetBanner>
            <div>
              <label className={LABEL}>Why is it being retired? *</label>
              <input
                value={retireReason}
                onChange={(e) => setRetireReason(e.target.value)}
                placeholder="Sold at auction, 12 Aug / Written off after the Bale rollover"
                className={INPUT}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Kept on the timeline. In a year this is the only thing that explains the
                status.
              </p>
            </div>
            <div>
              <label className={LABEL}>Type {asset.assetId} to confirm *</label>
              <input
                value={retireConfirm}
                onChange={(e) => setRetireConfirm(e.target.value)}
                placeholder={asset.assetId}
                className={INPUT}
                autoComplete="off"
              />
            </div>
            <div className="flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => closePanel()}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" variant="danger" icon={Archive} disabled={busy}>
                {busy ? 'Retiring…' : 'Retire permanently'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
        </div>
      )}

      {showStatus && (
        <div ref={panelRef}>
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
                irreversible, so it has its own button and its own confirmation.
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
              <FleetButton type="button" variant="secondary" onClick={() => closePanel()}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={ArrowRightLeft} disabled={busy}>
                {busy ? 'Saving…' : 'Apply status'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
        </div>
      )}

      <FleetPanel
        title="Working history"
        description="Everything this machine has done, newest first — issues, returns, faults, repairs, services, fuel and status changes on one timeline."
      >
        <AssetTimeline
          asset={asset}
          statusEvents={statusEvents}
          assignments={assignments}
          workOrders={workOrders}
          serviceRecords={serviceRecords}
          fuelLogs={fuelLogs}
        />
      </FleetPanel>

      {showFault && (
        <div ref={panelRef}>
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
                <FleetButton type="button" variant="secondary" onClick={() => closePanel()}>
                  Cancel
                </FleetButton>
                <FleetButton type="submit" icon={Wrench} disabled={busy}>
                  {busy ? 'Reporting…' : 'Report fault'}
                </FleetButton>
              </div>
            </div>
          </form>
        </FleetPanel>
        </div>
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
