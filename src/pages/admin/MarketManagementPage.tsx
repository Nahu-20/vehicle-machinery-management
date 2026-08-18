import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { hasPermission } from '../../lib/permissions';
import {
  MARKET_CENTRES,
  MARKET_CENTRE_BY_ID,
  MARKET_COMMODITIES,
  MARKET_COMMODITY_BY_KEY,
  MARKET_COMMODITY_GROUP_LABELS,
  MARKET_UNITS,
  type MarketUnitKey,
} from '../../features/market/constants/marketCommodities';
import { enterableUnits, seriesHistory } from '../../features/market/constants/marketVocabulary';
import {
  isDemoMarket,
  listLatestPrices,
  listObservations,
  MarketPriceOutlierError,
  recordPrice,
} from '../../features/market/services/marketService';
import type { MarketPriceObservation, MarketPricePoint } from '../../features/market/types/market';
import { CANONICAL_ZONE_METADATA } from '../../features/investment-map/constants/canonicalZones';

const INPUT =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40';
const LABEL = 'block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const MarketManagementPage: React.FC = () => {
  const { staffUser } = useAuth();
  const { getLocalizedText } = useLanguage();
  const canManageMarket = hasPermission(staffUser, 'market.manage');

  const [points, setPoints] = useState<MarketPricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [commodityKey, setCommodityKey] = useState(MARKET_COMMODITIES[0].commodityKey);
  const [marketId, setMarketId] = useState(MARKET_CENTRES[0].marketId);
  const [price, setPrice] = useState('');
  const [unitKey, setUnitKey] = useState<MarketUnitKey>(MARKET_COMMODITIES[0].canonicalUnit);
  const [observedAt, setObservedAt] = useState(todayIso());

  // The unusual-move warning. Holding it as state rather than folding it into
  // `error` is what lets the page offer to record the figure anyway: the
  // officer is being asked to look again, not being refused.
  const [outlier, setOutlier] = useState<MarketPriceOutlierError | null>(null);

  // Every observation, kept so a row can show its own history without a second
  // round trip per series.
  const [observations, setObservations] = useState<MarketPriceObservation[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listObservations();
      setObservations(all);
      setPoints(await listLatestPrices());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load prices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The units on offer follow the commodity: grain may be entered per kilogram
  // or per quintal, an ox only ever per head. Changing commodity therefore has
  // to re-pick the unit, or the form would keep a selection that no longer
  // applies and the service would refuse it on submit.
  const unitOptions = useMemo(() => enterableUnits(commodityKey), [commodityKey]);
  useEffect(() => {
    if (!unitOptions.includes(unitKey)) {
      setUnitKey(MARKET_COMMODITY_BY_KEY[commodityKey]?.canonicalUnit ?? unitOptions[0]);
    }
  }, [commodityKey, unitOptions, unitKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser || busy) return;

    const parsed = Number(price);
    if (!price.trim() || !Number.isFinite(parsed)) {
      return setError('Enter the price as a number.');
    }

    setBusy(true);
    setError(null);
    try {
      await recordPrice(
        {
          commodityKey,
          marketId,
          price: parsed,
          unitKey,
          observedAt: new Date(`${observedAt}T00:00:00`),
          // Only true on a second submit, after the warning has been read.
          confirmUnusual: Boolean(outlier),
        },
        staffUser
      );
      setOutlier(null);
      const name = getLocalizedText(MARKET_COMMODITY_BY_KEY[commodityKey].name);
      const centre = getLocalizedText(MARKET_CENTRE_BY_ID[marketId].name);
      setNotice(`${name} at ${centre} recorded.`);
      setPrice('');
      setShowForm(false);
      await load();
    } catch (err) {
      if (err instanceof MarketPriceOutlierError) {
        // Not an error banner: the form stays filled and the button becomes a
        // deliberate confirmation.
        setOutlier(err);
      } else {
        setError(err instanceof Error ? err.message : 'Could not record the price.');
      }
    } finally {
      setBusy(false);
    }
  };

  const rows = useMemo(
    () =>
      [...points].sort((a, b) => {
        const ac = getLocalizedText(MARKET_COMMODITY_BY_KEY[a.commodityKey]?.name ?? '');
        const bc = getLocalizedText(MARKET_COMMODITY_BY_KEY[b.commodityKey]?.name ?? '');
        return ac.localeCompare(bc);
      }),
    [points, getLocalizedText]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-500" />
            <span>Market Price Index Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publish weekly regional grain and livestock commodity prices across Oromia zones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {canManageMarket && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Record price</span>
            </button>
          )}
        </div>
      </div>

      {isDemoMarket() && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-2xl p-3 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            Firebase is not configured, so prices are held in this browser only and disappear
            when you reload. Set the VITE_FIREBASE_* values to record them for real.
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-2xl p-3 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl p-3 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {showForm && canManageMarket && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <div>
            <label className={LABEL}>Commodity</label>
            <select
              value={commodityKey}
              onChange={(e) => {
                setCommodityKey(e.target.value);
                setOutlier(null);
              }}
              className={INPUT}
            >
              {(
                Object.keys(
                  MARKET_COMMODITY_GROUP_LABELS
                ) as (keyof typeof MARKET_COMMODITY_GROUP_LABELS)[]
              ).map((group) => (
                <optgroup
                  key={group}
                  label={getLocalizedText(MARKET_COMMODITY_GROUP_LABELS[group])}
                >
                  {MARKET_COMMODITIES.filter((c) => c.group === group).map((c) => (
                    <option key={c.commodityKey} value={c.commodityKey}>
                      {getLocalizedText(c.name)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL}>Market centre</label>
            <select
              value={marketId}
              onChange={(e) => {
                setMarketId(e.target.value);
                setOutlier(null);
              }}
              className={INPUT}
            >
              {MARKET_CENTRES.map((m) => (
                <option key={m.marketId} value={m.marketId}>
                  {getLocalizedText(m.name)} — {CANONICAL_ZONE_METADATA[m.zoneId].displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL}>Seen on</label>
            <input
              type="date"
              value={observedAt}
              max={todayIso()}
              onChange={(e) => setObservedAt(e.target.value)}
              className={INPUT}
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              The day it was seen at the market, not today.
            </p>
          </div>

          <div>
            <label className={LABEL}>Price (ETB)</label>
            <input
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setOutlier(null);
              }}
              inputMode="decimal"
              placeholder="9200"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Per</label>
            <select
              value={unitKey}
              onChange={(e) => setUnitKey(e.target.value as MarketUnitKey)}
              className={INPUT}
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {getLocalizedText(MARKET_UNITS[u].label)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Stored per{' '}
              {getLocalizedText(
                MARKET_UNITS[MARKET_COMMODITY_BY_KEY[commodityKey].canonicalUnit].label
              )}
              , converted for you.
            </p>
          </div>

          {outlier && (
            <div className="md:col-span-2 lg:col-span-3 bg-amber-500/10 border border-amber-500/40 text-amber-800 dark:text-amber-300 rounded-2xl p-4 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Check this figure</p>
                <p>{outlier.message}</p>
                <p className="text-[11px] opacity-80">
                  Most often this is a unit: {(outlier.price / 100).toLocaleString()} per quintal
                  and {outlier.price.toLocaleString()} per kilogram are the same slip. If the price
                  really did move, record it again and it will be saved.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-end justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setOutlier(null);
                setShowForm(false);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow text-white ${
                outlier
                  ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/50'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50'
              }`}
            >
              {busy ? 'Recording…' : outlier ? 'Record it anyway' : 'Record price'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
          Regional Commodity Prices ({rows.length})
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No prices recorded yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {canManageMarket
                ? 'Record one and it will appear here, and on the public site.'
                : 'A market officer has not published any prices yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Commodity</th>
                  <th className="px-6 py-3.5">Market Center</th>
                  <th className="px-6 py-3.5">Zone</th>
                  <th className="px-6 py-3.5">Price (ETB)</th>
                  <th className="px-6 py-3.5">Change</th>
                  <th className="px-6 py-3.5">Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {rows.map((p) => {
                  const commodity = MARKET_COMMODITY_BY_KEY[p.commodityKey];
                  const centre = MARKET_CENTRE_BY_ID[p.marketId];
                  const key = `${p.commodityKey}::${p.marketId}`;
                  const isOpen = expanded === key;
                  const history = isOpen
                    ? seriesHistory(observations, p.commodityKey, p.marketId)
                    : [];

                  return (
                    <React.Fragment key={p.observationId}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : key)}
                          className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Show every price recorded for this commodity at this market"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {commodity ? getLocalizedText(commodity.name) : p.commodityKey}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {centre ? getLocalizedText(centre.name) : p.marketId}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {CANONICAL_ZONE_METADATA[p.zoneId as keyof typeof CANONICAL_ZONE_METADATA]
                          ?.displayName ?? p.zoneId}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {p.priceETB.toLocaleString()} /{' '}
                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                          {getLocalizedText(MARKET_UNITS[p.unitKey].label)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.trend === 'new' ? (
                          <span className="text-slate-400 font-bold uppercase text-[11px]">
                            First price
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              p.trend === 'up'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : p.trend === 'down'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {p.trend === 'up' ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : p.trend === 'down' ? (
                              <TrendingDown className="w-3.5 h-3.5" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                            {p.changePercent != null
                              ? `${p.changePercent > 0 ? '+' : ''}${p.changePercent}%`
                              : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {p.observedAt.toDate().toLocaleDateString()}
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-slate-50/60 dark:bg-slate-950/40">
                        <td colSpan={6} className="px-6 py-4">
                          <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                            Every price recorded for this series
                          </p>
                          {history.length <= 1 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Only one price so far. A second gives it a direction.
                            </p>
                          ) : (
                            <ul className="space-y-1.5">
                              {history.map((o, i) => {
                                // Ordered newest first, so the comparison is
                                // against the next item along, not the previous.
                                const earlier = history[i + 1];
                                const move = earlier
                                  ? ((o.priceETB - earlier.priceETB) / earlier.priceETB) * 100
                                  : null;
                                return (
                                  <li
                                    key={o.observationId}
                                    className="flex items-center justify-between gap-4 text-xs"
                                  >
                                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                                      {o.observedAt.toDate().toLocaleDateString()}
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                                      {o.priceETB.toLocaleString()} ETB
                                    </span>
                                    <span
                                      className={`font-bold tabular-nums w-16 text-right ${
                                        move == null
                                          ? 'text-slate-400'
                                          : move > 0
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : move < 0
                                          ? 'text-red-600 dark:text-red-400'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {move == null
                                        ? 'first'
                                        : `${move > 0 ? '+' : ''}${Math.round(move * 10) / 10}%`}
                                    </span>
                                    <span className="text-slate-400 dark:text-slate-500 truncate flex-1 text-right">
                                      {o.recordedByName}
                                      {o.enteredUnitKey !== o.unitKey && (
                                        <span className="ml-2 text-[11px] italic">
                                          entered {o.enteredPriceETB.toLocaleString()}/
                                          {o.enteredUnitKey}
                                        </span>
                                      )}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
