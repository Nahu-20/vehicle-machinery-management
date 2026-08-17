import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Fuel,
  Coins,
  Gauge,
  Receipt,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Plus,
  Save,
  Ban,
  Info,
  MapPin,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import { listAssets } from '../../../features/fleet/services/fleetService';
import {
  listFuelLogs,
  recordFuelFill,
  voidFuelFill,
} from '../../../features/fleet/services/fleetFuelService';
import type { FleetAsset, FleetFuelLog } from '../../../features/fleet/types/fleet';
import {
  computeConsumption,
  compareToOwnAverage,
  totalFuelSpend,
  totalFuelLitres,
  higherIsBetter,
  formatMeter,
  FUEL_UNIT_LABEL,
  FUEL_GAP_EXPLANATIONS,
  METER_UNIT_LABEL,
  type FuelTrend,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  StatCard,
  FleetPanel,
  FleetButton,
  FleetEmptyState,
  FleetBar,
  FleetColumnChart,
  FleetSparkline,
} from '../../../features/fleet/components/FleetUI';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';

const INPUT =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500';
const LABEL =
  'block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

const fmtDay = (ts?: { toDate?: () => Date } | null): string =>
  ts?.toDate
    ? ts.toDate().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const etb = (n: number) => `${Math.round(n).toLocaleString()} ETB`;

/** The last twelve months, oldest first. */
function lastTwelveMonths(): { key: string; label: string; short: string; start: Date; end: Date }[] {
  const out = [];
  const now = new Date();
  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      short: start.toLocaleDateString(undefined, { month: 'narrow' }),
      start,
      end,
    });
  }
  return out;
}

/** Everything worked out for one machine, so the panels can share it. */
interface MachineFuel {
  asset: FleetAsset;
  logs: FleetFuelLog[];
  trend: FuelTrend;
  history: number[];
  spend: number;
  litres: number;
}

/**
 * What the fleet burns, and which machines are burning more than they used to.
 *
 * Every figure here starts as a number copied off a printed slip — there is no
 * hardware on these machines. That is worth remembering before treating any of
 * it as a measurement, and it is why the page says out loud where it cannot work
 * something out rather than quietly averaging over the gap.
 */
export function AdminFleetFuelPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const canRecord = hasPermission(staffUser, 'fleet.fuel.record');

  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [logs, setLogs] = useState<FleetFuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [filledAt, setFilledAt] = useState(new Date().toISOString().slice(0, 10));
  const [litres, setLitres] = useState('');
  const [costPerLitre, setCostPerLitre] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [meterAtFill, setMeterAtFill] = useState('');
  const [fullTank, setFullTank] = useState(true);
  const [station, setStation] = useState('');
  const [reference, setReference] = useState('');

  const [voiding, setVoiding] = useState<FleetFuelLog | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, l] = await Promise.all([listAssets(), listFuelLogs()]);
      setAssets(a);
      setLogs(l);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the fuel records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const assetById = useMemo(() => new Map(assets.map((a) => [a.assetId, a])), [assets]);
  const chosenAsset = assetById.get(assetId) ?? null;

  /** Everything derived, per machine, once. */
  const machines = useMemo<MachineFuel[]>(() => {
    const byAsset = new Map<string, FleetFuelLog[]>();
    for (const l of logs) {
      byAsset.set(l.assetId, [...(byAsset.get(l.assetId) ?? []), l]);
    }
    return [...byAsset.entries()]
      .map(([id, rows]) => {
        const asset = assetById.get(id);
        if (!asset) return null;
        const points = computeConsumption(asset, rows);
        return {
          asset,
          logs: rows,
          trend: compareToOwnAverage(points, asset.meterType),
          history: points.filter((p) => p.consumption !== null).map((p) => p.consumption as number),
          spend: totalFuelSpend(rows),
          litres: totalFuelLitres(rows),
        };
      })
      .filter((m): m is MachineFuel => m !== null);
  }, [logs, assetById]);

  const live = useMemo(() => logs.filter((l) => !l.voidedAt), [logs]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return live.filter((l) => l.filledAt.toMillis() >= start);
  }, [live]);

  const byMonth = useMemo(() => {
    const months = lastTwelveMonths();
    return months.map((m) => ({
      label: m.label,
      shortLabel: m.short,
      value: live
        .filter(
          (l) => l.filledAt.toMillis() >= m.start.getTime() && l.filledAt.toMillis() < m.end.getTime()
        )
        .reduce((t, l) => t + l.totalCost, 0),
    }));
  }, [live]);

  const byZone = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of live) map.set(l.zoneId, (map.get(l.zoneId) ?? 0) + l.totalCost);
    return [...map.entries()]
      .map(([zoneId, total]) => ({ zoneId, total }))
      .sort((a, b) => b.total - a.total);
  }, [live]);

  /**
   * Cost per kilometre, road vehicles only.
   *
   * Mixing in tractors would divide birr by hours and call the answer a rate per
   * km, which is not a figure, it is two units in a trench coat.
   */
  const costPerKm = useMemo(() => {
    const road = machines.filter((m) => m.asset.meterType === 'kilometres');
    const points = road.flatMap((m) => computeConsumption(m.asset, m.logs));
    const km = points.reduce((t, p) => t + (p.meterDelta ?? 0), 0);
    const litresUsed = points.reduce((t, p) => t + (p.litresUsed ?? 0), 0);
    if (km <= 0 || litresUsed <= 0) return null;
    const spend = road.reduce((t, m) => t + m.spend, 0);
    const allLitres = road.reduce((t, m) => t + m.litres, 0);
    if (allLitres <= 0) return null;
    // Priced from the litres actually attributed to measured distance, so a
    // part-fill sitting in the tank at the end of the period is not charged to
    // kilometres nobody has driven yet.
    return (spend / allLitres) * (litresUsed / km);
  }, [machines]);

  /** Machines running worse than their own past, worst first. */
  const drifting = useMemo(
    () =>
      machines
        .filter((m) => m.trend.worseByPct !== null && m.trend.worseByPct >= 15)
        .sort((a, b) => (b.trend.worseByPct ?? 0) - (a.trend.worseByPct ?? 0)),
    [machines]
  );

  /** Data-quality items: the register saying what it could not work out. */
  const problems = useMemo(() => {
    const out: { assetId: string; note: string }[] = [];
    for (const m of machines) {
      const points = computeConsumption(m.asset, m.logs);
      const backwards = points.filter((p) => p.reason === 'meter-backwards').length;
      if (backwards > 0) {
        out.push({
          assetId: m.asset.assetId,
          note: `${backwards} reading(s) not above the one before. ${FUEL_GAP_EXPLANATIONS['meter-backwards']}`,
        });
      }
      if (m.asset.meterType !== 'none' && points.some((p) => p.reason === 'no-meter')) {
        out.push({
          assetId: m.asset.assetId,
          note: 'A fill was recorded with no meter reading, so that interval cannot be measured.',
        });
      }
    }
    const stale = machines.filter(
      (m) =>
        m.asset.status !== 'disposed' &&
        Date.now() - Math.max(...m.logs.map((l) => l.filledAt.toMillis())) > 60 * 24 * 3600 * 1000
    );
    for (const m of stale) {
      out.push({ assetId: m.asset.assetId, note: 'No fill recorded in the last 60 days.' });
    }
    return out;
  }, [machines]);

  /* ---- recording */

  const openForm = () => {
    setShowForm(true);
    setAssetId('');
    setFilledAt(new Date().toISOString().slice(0, 10));
    setLitres('');
    setCostPerLitre('');
    setTotalCost('');
    setMeterAtFill('');
    setFullTank(true);
    setStation('');
    setReference('');
    setError(null);
    setNotice(null);
  };

  /** Cost follows litres × price unless somebody has typed a total themselves. */
  const syncTotal = (nextLitres: string, nextPrice: string) => {
    const l = Number(nextLitres);
    const p = Number(nextPrice);
    if (Number.isFinite(l) && Number.isFinite(p) && l > 0 && p > 0) {
      setTotalCost(String(Math.round(l * p)));
    }
  };

  const submitFill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser || busy) return;
    if (!chosenAsset) return setError('Which machine was filled?');

    const l = Number(litres);
    if (!Number.isFinite(l) || l <= 0) return setError('Enter the litres put in.');
    const cost = Number(totalCost);
    if (!Number.isFinite(cost) || cost < 0) return setError('Enter what it cost.');

    const needsMeter = chosenAsset.meterType !== 'none';
    const meter = meterAtFill.trim() ? Number(meterAtFill) : null;
    if (needsMeter && (meter === null || !Number.isFinite(meter))) {
      return setError(
        `${chosenAsset.assetId} has a meter, so the reading at the pump is needed — every later figure rests on it.`
      );
    }

    setBusy(true);
    setError(null);
    try {
      await recordFuelFill(
        {
          assetId: chosenAsset.assetId,
          expectedVersion: chosenAsset.version,
          filledAt: new Date(`${filledAt}T00:00:00`),
          litres: l,
          costPerLitre: costPerLitre.trim() ? Number(costPerLitre) : undefined,
          totalCost: cost,
          meterAtFill: needsMeter ? meter : null,
          fullTank,
          station: station.trim() || undefined,
          reference: reference.trim() || undefined,
          driverId: chosenAsset.custodianDriverId ?? null,
          driverName: chosenAsset.custodianName,
        },
        staffUser
      );
      setNotice(
        fullTank
          ? `${l} L recorded against ${chosenAsset.assetId}.`
          : `${l} L recorded against ${chosenAsset.assetId} as a part-fill — it counts towards the next full tank.`
      );
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the fill.');
    } finally {
      setBusy(false);
    }
  };

  const submitVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiding || !staffUser || busy) return;
    setBusy(true);
    setError(null);
    try {
      await voidFuelFill(voiding.fuelLogId, voidReason, staffUser);
      setNotice(`${voiding.fuelLogId} voided. It stays on the record and out of every figure.`);
      setVoiding(null);
      setVoidReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not void that slip.');
    } finally {
      setBusy(false);
    }
  };

  const maxZone = byZone[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Litres this month"
          value={Math.round(totalFuelLitres(thisMonth)).toLocaleString()}
          icon={Fuel}
          hint={`${thisMonth.length} fill${thisMonth.length === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Spend this month"
          value={etb(totalFuelSpend(thisMonth))}
          icon={Coins}
          hint="Fuel only — repairs are counted apart"
        />
        <StatCard
          label="Cost per km"
          value={costPerKm === null ? '—' : `${costPerKm.toFixed(2)} ETB`}
          icon={Gauge}
          hint="Road vehicles only; tractors are rated per hour"
        />
        <StatCard
          label="Running worse"
          value={drifting.length}
          icon={TrendingDown}
          tone={drifting.length > 0 ? 'warn' : 'good'}
          hint="Against their own past, not each other"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2 max-w-3xl">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            There is no hardware on these machines. Every figure here begins as a number copied
            off a printed slip, and consumption can only be worked out between two full tanks —
            so the register says where it cannot work something out rather than averaging over it.
          </span>
        </p>
        <div className="flex items-center gap-3">
          <FleetButton variant="secondary" icon={RefreshCw} onClick={() => void load()}>
            Refresh
          </FleetButton>
          {canRecord && (
            <FleetButton icon={Plus} onClick={openForm}>
              Record a fill
            </FleetButton>
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
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      {/* ---- record a fill */}
      {showForm && (
        <FleetPanel
          title="Record a fill"
          description="From the slip. The reading at the pump is the number every later figure rests on, so it is worth checking twice."
        >
          <form onSubmit={submitFill} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className={LABEL}>Machine *</label>
              <select
                value={assetId}
                onChange={(e) => {
                  setAssetId(e.target.value);
                  const a = assetById.get(e.target.value);
                  setMeterAtFill(a && a.meterType !== 'none' ? String(a.currentMeter) : '');
                  setError(null);
                }}
                className={INPUT}
              >
                <option value="">Choose…</option>
                {assets
                  .filter((a) => a.status !== 'disposed')
                  .map((a) => (
                    <option key={a.assetId} value={a.assetId}>
                      {a.assetId} — {a.make} {a.model}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Date *</label>
              <input
                type="date"
                value={filledAt}
                onChange={(e) => setFilledAt(e.target.value)}
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>Litres *</label>
              <input
                type="number"
                step="0.01"
                value={litres}
                onChange={(e) => {
                  setLitres(e.target.value);
                  syncTotal(e.target.value, costPerLitre);
                }}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Price per litre</label>
              <input
                type="number"
                step="0.01"
                value={costPerLitre}
                onChange={(e) => {
                  setCostPerLitre(e.target.value);
                  syncTotal(litres, e.target.value);
                }}
                placeholder="ETB"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Total cost *</label>
              <input
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder="ETB"
                className={INPUT}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Filled in from litres × price; type over it if the slip says otherwise.
              </p>
            </div>

            <div>
              <label className={LABEL}>
                Reading at the pump{' '}
                {chosenAsset && chosenAsset.meterType !== 'none'
                  ? `(${METER_UNIT_LABEL[chosenAsset.meterType]})`
                  : ''}
              </label>
              <input
                type="number"
                value={meterAtFill}
                onChange={(e) => setMeterAtFill(e.target.value)}
                disabled={!chosenAsset || chosenAsset.meterType === 'none'}
                className={`${INPUT} disabled:opacity-50`}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {!chosenAsset
                  ? 'Choose a machine first.'
                  : chosenAsset.meterType === 'none'
                  ? 'This machine has no meter, so it can be costed but never rated.'
                  : `Currently ${formatMeter(chosenAsset.currentMeter, chosenAsset.meterType)}.`}
              </p>
            </div>
            <div>
              <label className={LABEL}>Station</label>
              <input
                value={station}
                onChange={(e) => setStation(e.target.value)}
                placeholder="NOC Adama"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Slip number</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="FS-000000"
                className={`${INPUT} font-mono`}
              />
            </div>

            <div className="md:col-span-3">
              <label className="inline-flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fullTank}
                  onChange={(e) => setFullTank(e.target.checked)}
                  className="accent-emerald-600 mt-0.5"
                />
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  <strong>Tank filled to the top.</strong>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Untick for a part-fill. Consumption can only be measured between two full
                    tanks, so a part-fill shows no figure of its own — its litres are carried into
                    the next full one rather than dropped.
                  </span>
                </span>
              </label>
            </div>

            <div className="md:col-span-3 flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" icon={Save} disabled={busy}>
                {busy ? 'Saving…' : 'Record fill'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
      )}

      {/* ---- void */}
      {voiding && (
        <FleetPanel
          title={`Void ${voiding.reference ?? voiding.fuelLogId}`}
          description="The slip stays on the record, struck through, and drops out of every figure. The machine's meter is left where it is."
        >
          <form onSubmit={submitVoid} className="p-6 space-y-5">
            <div>
              <label className={LABEL}>Why *</label>
              <input
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Recorded against the wrong machine"
                className={INPUT}
              />
            </div>
            <div className="flex justify-end gap-3">
              <FleetButton type="button" variant="secondary" onClick={() => setVoiding(null)}>
                Cancel
              </FleetButton>
              <FleetButton type="submit" variant="danger" icon={Ban} disabled={busy}>
                {busy ? 'Saving…' : 'Void this slip'}
              </FleetButton>
            </div>
          </form>
        </FleetPanel>
      )}

      {loading ? (
        <FleetPanel title="Loading fuel records…">
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
        </FleetPanel>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <FleetPanel
              title="Spend by month"
              description="The last twelve months. Zero-baselined, so a small wobble looks like a small wobble."
            >
              <div className="p-6">
                <FleetColumnChart
                  data={byMonth}
                  format={etb}
                  caption="Fuel spend by month over the last twelve months"
                />
              </div>
            </FleetPanel>

            <FleetPanel
              title="Spend by zone"
              description="Where the fuel is going. Bigger zones burn more; the figure is a starting point, not a verdict."
            >
              {byZone.length === 0 ? (
                <FleetEmptyState
                  icon={MapPin}
                  title="Nothing recorded"
                  message="No fills have been logged against any zone yet."
                />
              ) : (
                <div className="p-6 space-y-3.5">
                  {byZone.map((z) => (
                    <div key={z.zoneId}>
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <span className="text-xs text-slate-700 dark:text-slate-200 truncate">
                          {CANONICAL_ZONE_METADATA[z.zoneId as keyof typeof CANONICAL_ZONE_METADATA]
                            ?.displayName ?? z.zoneId}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                          {etb(z.total)}
                        </span>
                      </div>
                      <FleetBar
                        value={z.total}
                        max={maxZone}
                        tone="neutral"
                        label={`${z.zoneId}: ${etb(z.total)}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </FleetPanel>
          </div>

          {/* ---- the panel that earns the feature */}
          <FleetPanel
            title={`Running against its own past — ${drifting.length}`}
            description="Each machine compared with itself, not with the others. Ranking a tractor against a pickup says nothing — the units are inverted and the work is different — but a machine quietly getting thirstier is either developing a fault or losing fuel to somebody."
          >
            {drifting.length === 0 ? (
              <FleetEmptyState
                icon={TrendingDown}
                title="Nothing drifting"
                message="No machine with enough history is running meaningfully worse than it used to. Four measurable fills are needed before any comparison is made."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="px-6 py-3">Machine</th>
                      <th className="px-6 py-3">Trend</th>
                      <th className="px-6 py-3 text-right">Usually</th>
                      <th className="px-6 py-3 text-right">Lately</th>
                      <th className="px-6 py-3 text-right">Worse by</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {drifting.map((m) => {
                      const unit = FUEL_UNIT_LABEL[m.asset.meterType];
                      return (
                        <tr
                          key={m.asset.assetId}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-6 py-3">
                            <Link
                              to={`/admin/fleet/register/${encodeURIComponent(m.asset.assetId)}`}
                              className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              {m.asset.assetId}
                            </Link>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {m.asset.make} {m.asset.model}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <FleetSparkline
                              values={
                                higherIsBetter(m.asset.meterType)
                                  ? m.history
                                  : m.history.map((v) => -v)
                              }
                              tone="bad"
                              label={`${m.asset.assetId} consumption over ${m.history.length} measured intervals`}
                            />
                          </td>
                          <td className="px-6 py-3 text-xs text-right font-mono text-slate-600 dark:text-slate-300">
                            {m.trend.average?.toFixed(2)} {unit}
                          </td>
                          <td className="px-6 py-3 text-xs text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                            {m.trend.recent?.toFixed(2)} {unit}
                          </td>
                          <td className="px-6 py-3 text-xs text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                            {m.trend.worseByPct?.toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </FleetPanel>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <FleetPanel
              title={`Recent fills — ${logs.length}`}
              description="Newest first. Voided slips stay visible and out of the figures."
            >
              {logs.length === 0 ? (
                <FleetEmptyState
                  icon={Receipt}
                  title="No fills recorded"
                  message="Record a fill from here or from a vehicle's page, and the consumption figures build from there."
                  action={
                    canRecord ? (
                      <FleetButton icon={Plus} onClick={openForm}>
                        Record a fill
                      </FleetButton>
                    ) : undefined
                  }
                />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.slice(0, 15).map((l) => (
                    <div
                      key={l.fuelLogId}
                      className={`p-4 flex flex-wrap items-center justify-between gap-3 ${
                        l.voidedAt ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/admin/fleet/register/${encodeURIComponent(l.assetId)}`}
                          className={`font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline ${
                            l.voidedAt ? 'line-through' : ''
                          }`}
                        >
                          {l.assetId}
                        </Link>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {fmtDay(l.filledAt)}
                          {l.station ? ` · ${l.station}` : ''}
                          {l.reference ? ` · ${l.reference}` : ''}
                          {!l.fullTank ? ' · part-fill' : ''}
                        </div>
                        {l.voidedAt && (
                          <div className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                            Voided — {l.voidReason}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={`text-xs font-mono font-bold text-slate-700 dark:text-slate-200 ${
                              l.voidedAt ? 'line-through' : ''
                            }`}
                          >
                            {l.litres.toLocaleString()} L
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {etb(l.totalCost)}
                          </div>
                        </div>
                        {canRecord && !l.voidedAt && (
                          <FleetButton
                            variant="secondary"
                            onClick={() => {
                              setVoiding(l);
                              setVoidReason('');
                            }}
                          >
                            Void
                          </FleetButton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FleetPanel>

            <FleetPanel
              title={`Needs a look — ${problems.length}`}
              description="Where the register could not work something out. Not errors in the maths — gaps in what was written down."
            >
              {problems.length === 0 ? (
                <FleetEmptyState
                  icon={Gauge}
                  title="Nothing unclear"
                  message="Every fill has a usable reading, and every machine has been filled in the last 60 days."
                />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {problems.map((p, i) => (
                    <div key={`${p.assetId}-${i}`} className="p-4 flex items-start gap-3">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div className="min-w-0">
                        <Link
                          to={`/admin/fleet/register/${encodeURIComponent(p.assetId)}`}
                          className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          {p.assetId}
                        </Link>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {p.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FleetPanel>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminFleetFuelPage;
