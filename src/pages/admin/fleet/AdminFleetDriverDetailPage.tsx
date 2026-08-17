import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Phone,
  IdCard,
  MapPin,
  Truck,
  History,
  AlertTriangle,
  ShieldAlert,
  UserX,
  UserCheck,
  Info,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getDriverById,
  listAssignmentsForDriver,
  setDriverStatus,
} from '../../../features/fleet/services/fleetDriverService';
import type {
  FleetAssignment,
  FleetDriver,
  FleetDriverStatus,
} from '../../../features/fleet/types/fleet';
import {
  DRIVER_STATUS_LABELS,
  daysUntil,
  licenceState,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  FleetPanel,
  FleetButton,
  FleetEmptyState,
  DriverStatusPill,
  LicencePill,
  INPUT,
  LABEL,
  fmtDay,
  FleetLoading,
  FleetBanner,
} from '../../../features/fleet/components/FleetUI';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';


const EMPLOYMENT_LABELS: Record<FleetDriver['employment'], string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  seconded: 'Seconded',
  daily: 'Daily',
};


/** What a driver may be moved to from where they are now. */
const NEXT_STATUSES: Record<FleetDriverStatus, FleetDriverStatus[]> = {
  active: ['suspended', 'inactive'],
  suspended: ['active', 'inactive'],
  inactive: ['active'],
};

const STATUS_ACTION_LABELS: Record<FleetDriverStatus, string> = {
  active: 'Reinstate',
  suspended: 'Suspend',
  inactive: 'Record as left',
};

/**
 * One driver: who they are, what they are holding, and everything they have held.
 *
 * The history only shows sign-outs recorded against this driver record. Rows
 * from before the directory existed carry a typed name and no id, and matching
 * on the string would be a guess — two people can share a name, and a register
 * that guesses is worse than one that admits the gap.
 */
export function AdminFleetDriverDetailPage() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();

  const { staffUser } = useStaffAuthorizationContext();
  const canManage = hasPermission(staffUser, 'fleet.driver.manage');

  const [driver, setDriver] = useState<FleetDriver | null>(null);
  const [assignments, setAssignments] = useState<FleetAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<FleetDriverStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const load = useCallback(async () => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    try {
      const [d, history] = await Promise.all([
        getDriverById(driverId),
        listAssignmentsForDriver(driverId).catch(() => [] as FleetAssignment[]),
      ]);
      if (!d) {
        setError(`Driver ${driverId} was not found.`);
        return;
      }
      setDriver(d);
      setAssignments(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the driver.');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = useMemo(() => assignments.filter((a) => a.status !== 'returned'), [assignments]);
  const closed = useMemo(() => assignments.filter((a) => a.status === 'returned'), [assignments]);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver || !staffUser || !statusTarget || busy) return;

    setBusy(true);
    setError(null);
    try {
      await setDriverStatus(
        driver.driverId,
        statusTarget,
        driver.version,
        staffUser,
        statusReason.trim() || undefined
      );
      setNotice(
        open.length > 0
          ? `${driver.fullName} is now ${DRIVER_STATUS_LABELS[statusTarget].toLowerCase()}. ${
              open.length
            } machine(s) are still signed out to them — this does not bring them back, so record the return when they arrive.`
          : `${driver.fullName} is now ${DRIVER_STATUS_LABELS[statusTarget].toLowerCase()}.`
      );
      setStatusTarget(null);
      setStatusReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the status.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <FleetPanel title="Loading driver…">
        <FleetLoading />
      </FleetPanel>
    );
  }

  if (!driver) {
    return (
      <div className="space-y-6">
        <FleetButton variant="secondary" icon={ArrowLeft} onClick={() => navigate('/admin/fleet/drivers')}>
          Back to drivers
        </FleetButton>
        <FleetPanel title="Not found">
          <div className="p-8 text-xs text-slate-500 dark:text-slate-400">
            {error ?? `Driver ${driverId} was not found.`}
          </div>
        </FleetPanel>
      </div>
    );
  }

  const state = licenceState(driver);
  const days = daysUntil(driver.licenceExpiry);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FleetButton
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate('/admin/fleet/drivers')}
        >
          Back to drivers
        </FleetButton>

        <div className="flex flex-wrap items-center gap-3">
          {canManage &&
            NEXT_STATUSES[driver.status].map((next) => (
              <FleetButton
                key={next}
                variant={next === 'inactive' ? 'danger' : 'secondary'}
                icon={next === 'active' ? UserCheck : UserX}
                onClick={() => {
                  setStatusTarget(next);
                  setStatusReason('');
                  setError(null);
                }}
              >
                {STATUS_ACTION_LABELS[next]}
              </FleetButton>
            ))}
          {canManage && (
            <Link to={`/admin/fleet/drivers/${driver.driverId}/edit`}>
              <FleetButton icon={Pencil}>Edit</FleetButton>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <FleetBanner tone="error" icon={AlertTriangle}><span>{error}</span></FleetBanner>
      )}

      {notice && (
        <FleetBanner tone="success" icon={Info}><span>{notice}</span></FleetBanner>
      )}

      {/* ---- identity */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-start gap-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
            {driver.photoUrl ? (
              <img
                src={driver.photoUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-lg font-extrabold text-slate-400 dark:text-slate-500">
                {driver.fullName
                  .split(' ')
                  .slice(-2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {driver.fullName}
              </h1>
              <DriverStatusPill status={driver.status} />
              <LicencePill
                state={state}
                detail={
                  state === 'expiring' && days !== null
                    ? `${days} days left`
                    : state === 'lapsed' && days !== null
                    ? `${Math.abs(days)} days ago`
                    : undefined
                }
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono font-bold">{driver.driverId}</span>
              <span>{EMPLOYMENT_LABELS[driver.employment]}</span>
              {driver.employeeNumber && <span className="font-mono">{driver.employeeNumber}</span>}
              {driver.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3 h-3 shrink-0" />
                  {driver.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3 h-3 shrink-0" />
                {CANONICAL_ZONE_METADATA[driver.zoneId]?.displayName ?? driver.zoneId}
                {driver.stationedAt ? ` · ${driver.stationedAt}` : ''}
              </span>
              {driver.licenceNumber && (
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <IdCard className="w-3 h-3 shrink-0" />
                  {driver.licenceNumber}
                  {driver.licenceGrade ? ` · grade ${driver.licenceGrade}` : ''}
                  {driver.licenceExpiry ? ` · to ${fmtDay(driver.licenceExpiry)}` : ''}
                </span>
              )}
            </div>

            {driver.notes && (
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                {typeof driver.notes === 'string' ? driver.notes : driver.notes.en}
              </p>
            )}
          </div>
        </div>

        {state === 'lapsed' && driver.status === 'active' && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This licence has lapsed. No pickup, truck, motorcycle or bus can be issued to{' '}
              {driver.fullName} until it is renewed. Field machinery can still be issued, with a
              warning.
            </span>
          </div>
        )}
      </div>

      {/* ---- change status */}
      {statusTarget && (
        <FleetPanel
          title={`${STATUS_ACTION_LABELS[statusTarget]} ${driver.fullName}`}
          description="Changing a status here does not recall anything. A machine already signed out stays signed out until someone receives it back on a reading."
        >
          <form onSubmit={handleStatusChange} className="p-6 space-y-5">
            <div>
              <label className={LABEL}>Reason</label>
              <input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Recorded on the audit trail — say why, in your own words."
                className={INPUT}
              />
            </div>
            <div className="flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => setStatusTarget(null)}>
                Cancel
              </FleetButton>
              <FleetButton
                type="submit"
                variant={statusTarget === 'inactive' ? 'danger' : 'primary'}
                disabled={busy}
              >
                {busy ? 'Saving…' : `Confirm — ${DRIVER_STATUS_LABELS[statusTarget]}`}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
      )}

      {/* ---- currently holding */}
      <FleetPanel
        title={`Holding now — ${open.length}`}
        description="Machines signed out to this driver and not yet returned."
      >
        {open.length === 0 ? (
          <FleetEmptyState
            icon={Truck}
            title="Nothing signed out"
            message="This driver is not holding a machine at the moment."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {open.map((a) => (
              <div key={a.assignmentId} className="p-5 flex flex-wrap items-center gap-4">
                <Link
                  to={`/admin/fleet/register/${a.assetId}`}
                  className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  {a.assetId}
                </Link>
                <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 min-w-[200px]">
                  {typeof a.purpose === 'string' ? a.purpose : a.purpose?.en ?? '—'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Out {fmtDay(a.issuedAt)}
                  {a.dueAt ? ` · due back ${fmtDay(a.dueAt)}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </FleetPanel>

      {/* ---- history */}
      <FleetPanel
        title={`Sign-out history — ${closed.length}`}
        description="Machines this driver has taken out and returned."
      >
        {closed.length === 0 ? (
          <FleetEmptyState
            icon={History}
            title="No returned sign-outs"
            message="Nothing has been issued to and returned by this driver yet. Sign-outs recorded before the directory existed carry a typed name rather than a driver record, so they are not listed here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3">Machine</th>
                  <th className="px-6 py-3">Purpose</th>
                  <th className="px-6 py-3">Out</th>
                  <th className="px-6 py-3">Back</th>
                  <th className="px-6 py-3 text-right">Meter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {closed.map((a) => (
                  <tr
                    key={a.assignmentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <Link
                        to={`/admin/fleet/register/${a.assetId}`}
                        className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {a.assetId}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {typeof a.purpose === 'string' ? a.purpose : a.purpose?.en ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {fmtDay(a.issuedAt)}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {fmtDay(a.returnedAt)}
                    </td>
                    <td className="px-6 py-3 text-xs text-right font-mono text-slate-600 dark:text-slate-300">
                      {a.meterIn != null
                        ? `${a.meterOut.toLocaleString()} → ${a.meterIn.toLocaleString()}`
                        : a.meterOut.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FleetPanel>
    </div>
  );
}

export default AdminFleetDriverDetailPage;
