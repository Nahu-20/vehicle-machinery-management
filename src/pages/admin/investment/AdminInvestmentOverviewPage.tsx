import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getDashboardSummaryCounts,
  DashboardSummaryCounts,
} from '../../../services/investment/investmentDashboardService';
import { getAuditLogs } from '../../../services/investment/investmentAuditService';
import { InvestmentAuditLog } from '../../../types/investment';
import { seedPrototypeInvestmentMapData, seedPrototypeInfrastructureData } from '../../../services/investment/investmentPrototypeSeedService';

export function AdminInvestmentOverviewPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [counts, setCounts] = useState<DashboardSummaryCounts | null>(null);
  const [recentLogs, setRecentLogs] = useState<InvestmentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const canManageDatasets = hasPermission(staffUser, 'investment.datasets.manage');
  const canManageSources = hasPermission(staffUser, 'investment.sources.manage');
  const canManageOpps = hasPermission(staffUser, 'investment.opportunities.manage');
  const canPublish = hasPermission(staffUser, 'investment.publish');
  const canSeedPrototype =
    canManageDatasets &&
    (staffUser?.role === 'superAdmin' || staffUser?.role === 'contentAdmin');

  const fetchData = async () => {
    setLoading(true);
    try {
      const summaryCounts = await getDashboardSummaryCounts();
      setCounts(summaryCounts);

      const logs = await getAuditLogs(8);
      setRecentLogs(logs);
    } catch (err) {
      console.error('Failed to load dashboard overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!staffUser || !canSeedPrototype || seeding) return;
    const params = new URLSearchParams(window.location.search);
    const seedThematic = params.get('seedPrototype') === '1';
    const seedInfra = params.get('seedInfrastructure') === '1';
    if (!seedThematic && !seedInfra) return;
    let cancelled = false;
    (async () => {
      setSeeding(true);
      setSeedError(null);
      setSeedMessage(null);
      try {
        const messages: string[] = [];
        if (seedThematic) {
          const result = await seedPrototypeInvestmentMapData(staffUser);
          messages.push(result.message);
          params.delete('seedPrototype');
        }
        if (seedInfra) {
          const result = await seedPrototypeInfrastructureData(staffUser);
          messages.push(result.message);
          params.delete('seedInfrastructure');
        }
        if (cancelled) return;
        setSeedMessage(messages.join(' '));
        await fetchData();
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
        window.history.replaceState({}, '', next);
      } catch (err: any) {
        if (!cancelled) setSeedError(err?.message || String(err));
      } finally {
        if (!cancelled) setSeeding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffUser, canSeedPrototype]);

  const handleSeedPrototype = async () => {
    if (!staffUser || !canSeedPrototype) return;
    const ok = window.confirm(
      'Seed published coffee/wheat/maize production, suitability, and investment-potential datasets for all 22 zones?\n\nThis writes source-attributed prototype estimates to Firestore for the public /investment map.'
    );
    if (!ok) return;

    setSeeding(true);
    setSeedError(null);
    setSeedMessage(null);
    try {
      const result = await seedPrototypeInvestmentMapData(staffUser);
      setSeedMessage(result.message);
      await fetchData();
    } catch (err: any) {
      setSeedError(err?.message || String(err));
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedInfrastructure = async () => {
    if (!staffUser || !canSeedPrototype) return;
    const ok = window.confirm(
      'Seed ~66 published agricultural facilities across all 22 zones (warehouses, markets, processing, irrigation, livestock, labs)?\n\nCoordinates are approximate town-vicinity pins with OBoA-attributed sources.'
    );
    if (!ok) return;

    setSeeding(true);
    setSeedError(null);
    setSeedMessage(null);
    try {
      const result = await seedPrototypeInfrastructureData(staffUser);
      setSeedMessage(result.message);
      await fetchData();
    } catch (err: any) {
      setSeedError(err?.message || String(err));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Investment Workspace Status
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time totals derived from authoritative Firestore investment collections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {canSeedPrototype && (
            <button
              type="button"
              onClick={handleSeedPrototype}
              disabled={seeding || !staffUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-100 transition-colors disabled:opacity-50"
              title="Write 9 published datasets × 22 zones for the public map"
            >
              <Sparkles className={`w-3.5 h-3.5 ${seeding ? 'animate-pulse' : ''}`} />
              <span>{seeding ? 'Seeding…' : 'Seed prototype map data'}</span>
            </button>
          )}

          {canSeedPrototype && (
            <button
              type="button"
              onClick={handleSeedInfrastructure}
              disabled={seeding || !staffUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-sky-300 dark:border-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 text-sky-900 dark:text-sky-100 transition-colors disabled:opacity-50"
              title="Write ~66 published facilities across all 22 zones"
            >
              <MapPin className={`w-3.5 h-3.5 ${seeding ? 'animate-pulse' : ''}`} />
              <span>{seeding ? 'Seeding…' : 'Seed prototype facilities'}</span>
            </button>
          )}

          {canManageDatasets && (
            <Link
              to="/admin/investment/datasets/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Dataset</span>
            </Link>
          )}

          {canManageSources && (
            <Link
              to="/admin/investment/sources"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Source</span>
            </Link>
          )}
        </div>
      </div>

      {(seedMessage || seedError) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            seedError
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
          }`}
        >
          {seedError || seedMessage}
          {!seedError && (
            <span className="block mt-1 text-xs opacity-80">
              Open{' '}
              <Link className="underline font-medium" to="/investment">
                /investment
              </Link>{' '}
              for thematic layers, or toggle the facilities layer for infrastructure pins.
            </span>
          )}
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Zone Profiles */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Zone Profiles
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {counts?.zoneProfilesCount ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Canonical zones: 22</span>
            <Link
              to="/admin/investment/zones"
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Manage zones</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Datasets */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Datasets
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {counts?.datasetsCount ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">All lifecycle states</span>
            <Link
              to="/admin/investment/datasets"
              className="font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Published Datasets */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Published Datasets
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {counts?.publishedDatasetsCount ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Verified & active</span>
            <Link
              to="/admin/investment/datasets?lifecycleStatus=published"
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View published</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pending Verification
              </span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {counts?.pendingVerificationCount ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Unverified entities</span>
            <Link
              to="/admin/investment/datasets?verificationStatus=unverified"
              className="font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Review unverified</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Sources */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Data Sources
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {counts?.sourcesCount ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Provenance documentation</span>
            <Link
              to="/admin/investment/sources"
              className="font-semibold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Sources directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Opportunities */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Opportunities
              </span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {counts?.opportunitiesCount ?? 0}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Promotional profiles</span>
            <Link
              to="/admin/investment/opportunities"
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Manage opportunities</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Log (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Authoritative Audit Activity Feed
              </h3>
            </div>
            <Link
              to="/admin/investment/activity"
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              View complete log
            </Link>
          </div>

          <div className="mt-4">
            {recentLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                No investment activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentLogs.map((log) => (
                  <div key={log.id} className="py-3 text-xs flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {log.summary}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Actor: {log.actorEmail} ({log.actorRole})
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <time className="text-slate-400 dark:text-slate-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </time>
                      {log.newVersion !== undefined && (
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          v{log.newVersion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staff Authorization Matrix Diagnostic (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Active Authorization Capabilities
            </h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Current staff session privileges evaluated by centralized A1 RBAC engine:
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-700 dark:text-slate-300">View Investment Data</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Granted</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-700 dark:text-slate-300">Manage Datasets</span>
              <span
                className={`font-semibold ${
                  canManageDatasets ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {canManageDatasets ? 'Granted' : 'Denied'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-700 dark:text-slate-300">Manage Sources</span>
              <span
                className={`font-semibold ${
                  canManageSources ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {canManageSources ? 'Granted' : 'Denied'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-700 dark:text-slate-300">Manage Opportunities</span>
              <span
                className={`font-semibold ${
                  canManageOpps ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {canManageOpps ? 'Granted' : 'Denied'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-700 dark:text-slate-300">Publish Content</span>
              <span
                className={`font-semibold ${
                  canPublish ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {canPublish ? 'Granted' : 'Denied'}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            All mutations route exclusively through backend boundary endpoint <code className="font-mono text-emerald-700 dark:text-emerald-400">/api/investment/mutate</code>. Direct client SDK writes to <code className="font-mono text-slate-700 dark:text-slate-300">investmentAuditLogs</code> remain hard-blocked.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminInvestmentOverviewPage;
