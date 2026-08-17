import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Clock,
  RefreshCw,
  Save,
  AlertTriangle,
  Info,
  Truck,
  Users,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import { listAssets, updateAsset } from '../../../features/fleet/services/fleetService';
import {
  listDrivers,
  updateDriver,
} from '../../../features/fleet/services/fleetDriverService';
import type {
  FleetAsset,
  FleetDriver,
} from '../../../features/fleet/types/fleet';
import {
  assessAssetCompliance,
  assessDriverCompliance,
  COMPLIANCE_ORDER,
  worstSeverity,
  type ComplianceItem,
  type ComplianceKind,
  type ComplianceSeverity,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  StatCard,
  FleetPanel,
  FleetButton,
  FleetEmptyState,
  CompliancePill,
} from '../../../features/fleet/components/FleetUI';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';

const INPUT =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500';
const LABEL =
  'block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

const fmtDay = (ts?: { toDate?: () => Date } | null): string =>
  ts?.toDate
    ? ts.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'not recorded';

function fromDateInput(value: string): Timestamp | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

/** One thing to chase, whether it belongs to a vehicle or a person. */
interface Row {
  key: string;
  subjectKind: 'asset' | 'driver';
  subjectId: string;
  title: string;
  subtitle: string;
  href: string;
  zoneLabel: string;
  items: ComplianceItem[];
  worst: ComplianceSeverity;
  asset?: FleetAsset;
  driver?: FleetDriver;
}

/**
 * Everything the Bureau has to renew, on one page.
 *
 * Vehicles and drivers together rather than on separate screens. The office
 * chasing an insurance renewal and the office chasing a licence renewal are the
 * same office doing the same job, and splitting them by which collection the
 * record happens to live in is a fact about the database, not about the work.
 *
 * The severities come from pure functions in fleetVocabulary, so what this page
 * shows and what the issue form refuses cannot drift apart.
 */
export function AdminFleetCompliancePage() {
  const { staffUser } = useStaffAuthorizationContext();
  const canManageAssets = hasPermission(staffUser, 'fleet.asset.manage');
  const canManageDrivers = hasPermission(staffUser, 'fleet.driver.manage');

  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showOk, setShowOk] = useState(false);

  /** Which renewal form is open, and what it holds. One at a time. */
  const [renewing, setRenewing] = useState<{ row: Row; item: ComplianceItem } | null>(null);
  const [newExpiry, setNewExpiry] = useState('');
  const [reference, setReference] = useState('');
  const [insurer, setInsurer] = useState('');
  const [cost, setCost] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, d] = await Promise.all([
        listAssets(),
        listDrivers().catch(() => [] as FleetDriver[]),
      ]);
      setAssets(a);
      setDrivers(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the compliance register.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo<Row[]>(() => {
    const assetRows: Row[] = assets
      .map((a) => {
        const items = assessAssetCompliance(a);
        return {
          key: `asset:${a.assetId}`,
          subjectKind: 'asset' as const,
          subjectId: a.assetId,
          title: a.assetId,
          subtitle: [a.make, a.model].filter(Boolean).join(' ') + (a.plateNumber ? ` · ${a.plateNumber}` : ''),
          href: `/admin/fleet/register/${encodeURIComponent(a.assetId)}`,
          zoneLabel: CANONICAL_ZONE_METADATA[a.zoneId]?.displayName ?? a.zoneId,
          items,
          worst: worstSeverity(items),
          asset: a,
        };
      })
      .filter((r) => r.items.length > 0);

    const driverRows: Row[] = drivers
      .map((d) => {
        const items = assessDriverCompliance(d);
        return {
          key: `driver:${d.driverId}`,
          subjectKind: 'driver' as const,
          subjectId: d.driverId,
          title: d.fullName,
          subtitle: `${d.driverId}${d.phone ? ` · ${d.phone}` : ''}`,
          href: `/admin/fleet/drivers/${encodeURIComponent(d.driverId)}`,
          zoneLabel: CANONICAL_ZONE_METADATA[d.zoneId]?.displayName ?? d.zoneId,
          items,
          worst: worstSeverity(items),
          driver: d,
        };
      })
      .filter((r) => r.items.length > 0);

    // Worst first, then by how overdue, then by name. A renewal list read from
    // the top should start with what is already costing the Bureau something.
    return [...assetRows, ...driverRows].sort((x, y) => {
      const byWorst = COMPLIANCE_ORDER[x.worst] - COMPLIANCE_ORDER[y.worst];
      if (byWorst !== 0) return byWorst;
      const xd = Math.min(...x.items.map((i) => i.days ?? Number.MAX_SAFE_INTEGER));
      const yd = Math.min(...y.items.map((i) => i.days ?? Number.MAX_SAFE_INTEGER));
      if (xd !== yd) return xd - yd;
      return x.title.localeCompare(y.title);
    });
  }, [assets, drivers]);

  const counts = useMemo(() => {
    const c = { lapsed: 0, unknown: 0, due_soon: 0, ok: 0 };
    for (const r of rows) c[r.worst] += 1;
    return c;
  }, [rows]);

  const visible = useMemo(() => (showOk ? rows : rows.filter((r) => r.worst !== 'ok')), [rows, showOk]);

  const openRenewal = (row: Row, item: ComplianceItem) => {
    setRenewing({ row, item });
    setNewExpiry('');
    setReference(
      item.kind === 'insurance'
        ? row.asset?.insurancePolicyNumber ?? ''
        : item.kind === 'inspection'
        ? row.asset?.inspectionCertificateNumber ?? ''
        : row.driver?.licenceNumber ?? ''
    );
    setInsurer(row.asset?.insurer ?? '');
    setCost(row.asset?.insuranceCost ? String(row.asset.insuranceCost) : '');
    setError(null);
    setNotice(null);
  };

  const canRenew = (row: Row) => (row.subjectKind === 'asset' ? canManageAssets : canManageDrivers);

  const submitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewing || !staffUser || busy) return;
    const { row, item } = renewing;

    const expiry = fromDateInput(newExpiry);
    if (!expiry) return setError('Enter the date the new document runs to.');
    if (expiry.toDate().getTime() < Date.now()) {
      return setError('That date has already passed. Recording it would leave this still lapsed.');
    }
    if (!reference.trim()) {
      // Enforced because a date with no number is exactly the half-record that
      // makes the register look checked when nobody can produce the document.
      return setError(
        item.kind === 'licence'
          ? 'The licence number is needed — an expiry with no number is not a document anyone can produce.'
          : 'The policy or certificate number is needed alongside the date.'
      );
    }

    setBusy(true);
    setError(null);
    try {
      if (row.subjectKind === 'asset' && row.asset) {
        const changes =
          item.kind === 'insurance'
            ? {
                insuranceExpiry: expiry,
                insurancePolicyNumber: reference.trim(),
                insurer: insurer.trim() || undefined,
                insuranceCost: cost.trim() ? Number(cost) : undefined,
              }
            : {
                inspectionExpiry: expiry,
                inspectionCertificateNumber: reference.trim(),
              };
        await updateAsset(row.asset.assetId, changes, row.asset.version, staffUser);
      } else if (row.driver) {
        const d = row.driver;
        await updateDriver(
          {
            driverId: d.driverId,
            fullName: d.fullName,
            phone: d.phone,
            employeeNumber: d.employeeNumber,
            employment: d.employment,
            licenceNumber: reference.trim(),
            licenceGrade: d.licenceGrade,
            licenceExpiry: expiry,
            zoneId: d.zoneId,
            stationedAt: d.stationedAt,
            photoUrl: d.photoUrl,
            notes: d.notes,
            expectedVersion: d.version,
          },
          staffUser
        );
      }

      setNotice(`${item.label} for ${row.title} now runs to ${fmtDay(expiry)}.`);
      setRenewing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the renewal.');
    } finally {
      setBusy(false);
    }
  };

  const detailFor = (item: ComplianceItem): string | undefined => {
    if (item.severity === 'unknown') return undefined;
    if (item.days === null) return undefined;
    if (item.severity === 'lapsed') return `${Math.abs(item.days)}d ago`;
    if (item.severity === 'due_soon') return `${item.days}d`;
    return fmtDay(item.expiry);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Lapsed"
          value={counts.lapsed}
          icon={ShieldAlert}
          tone={counts.lapsed > 0 ? 'bad' : 'good'}
          hint="Expired and still in service"
        />
        <StatCard
          label="Not recorded"
          value={counts.unknown}
          icon={HelpCircle}
          tone={counts.unknown > 0 ? 'warn' : 'good'}
          hint="Nobody has entered a date"
        />
        <StatCard
          label="Expiring"
          value={counts.due_soon}
          icon={Clock}
          tone={counts.due_soon > 0 ? 'warn' : 'neutral'}
          hint="Within 30 days"
        />
        <StatCard
          label="In order"
          value={counts.ok}
          icon={ShieldCheck}
          tone="good"
          hint="Nothing to do"
        />
      </div>

      {counts.unknown > 0 && (
        <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-900/60 p-4 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Not recorded is not the same as in order.</strong> {counts.unknown} record(s)
            have a document with no date held against them at all. Until somebody enters one, the
            Bureau does not know whether they are covered — and a vehicle in that state used to be
            counted as compliant.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      {/* ---- the renewal form */}
      {renewing && (
        <FleetPanel
          title={`Record renewal — ${renewing.item.label} for ${renewing.row.title}`}
          description={`Currently ${
            renewing.item.severity === 'unknown'
              ? 'not recorded at all'
              : `running to ${fmtDay(renewing.item.expiry)}`
          }. This replaces the date rather than adding to a history — the previous one is on the audit trail.`}
        >
          <form onSubmit={submitRenewal} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL}>Now runs to *</label>
              <input
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>
                {renewing.item.kind === 'insurance'
                  ? 'Policy number *'
                  : renewing.item.kind === 'inspection'
                  ? 'Certificate number *'
                  : 'Licence number *'}
              </label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={`${INPUT} font-mono`}
              />
            </div>

            {renewing.item.kind === 'insurance' && (
              <>
                <div>
                  <label className={LABEL}>Insurer</label>
                  <input
                    value={insurer}
                    onChange={(e) => setInsurer(e.target.value)}
                    placeholder="Ethiopian Insurance Corporation"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Premium</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="ETB"
                    className={INPUT}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    What this renewal cost. Kept apart from repair spend.
                  </p>
                </div>
              </>
            )}

            <div className="md:col-span-2 flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => setRenewing(null)}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={Save} disabled={busy}>
                {busy ? 'Saving…' : 'Record renewal'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
      )}

      {/* ---- the list */}
      <FleetPanel
        title={`Needs attention — ${rows.length - counts.ok}`}
        description="Vehicles and drivers together: insurance, roadworthiness and driving licences are one renewal job."
        action={
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showOk}
                onChange={(e) => setShowOk(e.target.checked)}
                className="accent-emerald-600"
              />
              Show those in order
            </label>
            <FleetButton variant="secondary" icon={RefreshCw} onClick={() => void load()}>
              Refresh
            </FleetButton>
          </div>
        }
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
        ) : visible.length === 0 ? (
          <FleetEmptyState
            icon={ShieldCheck}
            title={showOk ? 'Nothing carries documents' : 'Nothing to chase'}
            message={
              showOk
                ? 'No road vehicles or drivers are on the register yet, so there is nothing to keep current.'
                : 'Every insurance policy, roadworthiness certificate and driving licence is recorded and in date.'
            }
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((row) => (
              <div key={row.key} className="p-5 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                    {row.subjectKind === 'asset' ? (
                      <Truck className="w-4 h-4" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={row.href}
                      className={`text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline ${
                        row.subjectKind === 'asset' ? 'font-mono' : ''
                      }`}
                    >
                      {row.title}
                    </Link>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {row.subtitle} · {row.zoneLabel}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {row.items
                    .filter((i) => showOk || i.severity !== 'ok')
                    .map((item) => (
                      <div key={item.kind} className="flex flex-wrap items-center justify-end gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.label}
                        </span>
                        <CompliancePill severity={item.severity} detail={detailFor(item)} />
                        {canRenew(row) && item.severity !== 'ok' && (
                          <FleetButton variant="secondary" onClick={() => openRenewal(row, item)}>
                            Renew
                          </FleetButton>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </FleetPanel>
    </div>
  );
}

export default AdminFleetCompliancePage;
