import React, { useEffect, useState } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import { getMapConfig, saveMapConfig } from '../../../services/investment/investmentConfigService';
import { InvestmentMapConfig, CommodityKey } from '../../../types/investment';

export function AdminMapConfigPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [config, setConfig] = useState<InvestmentMapConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form edit states
  const [defaultCommodity, setDefaultCommodity] = useState<CommodityKey>('coffee');
  const [defaultMetric, setDefaultMetric] = useState('production');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canManageConfig = hasPermission(staffUser, 'investment.config.manage');

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const cfg = await getMapConfig();
      setConfig(cfg);
      if (cfg) {
        setDefaultCommodity(cfg.defaultCommodity || 'coffee');
        setDefaultMetric(cfg.defaultMetric || 'production');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load map configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser) return;

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const updated = await saveMapConfig(
        staffUser,
        {
          defaultCommodity,
          defaultMetric,
          featuredCommodities: ['coffee', 'maize', 'wheat', 'avocado', 'sesame'],
          enabledDatasets: config?.enabledDatasets || [],
          currentDatasetIds: config?.currentDatasetIds || {},
          status: 'published',
        },
        config?.version
      );

      setConfig(updated);
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save map configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Published Map Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Default commodity selection, active dataset bindings, and public thematic layer settings.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
          <Settings className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
          <p>Loading map configuration from Firestore...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      ) : !config ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No map configuration created yet.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            The default map configuration document (`investmentMapConfig/default`) has not been initialized.
          </p>

          {canManageConfig && (
            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Initialize Default Configuration</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Map configuration updated successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Default Commodity</label>
              <select
                disabled={!canManageConfig}
                value={defaultCommodity}
                onChange={(e) => setDefaultCommodity(e.target.value as CommodityKey)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="coffee">Coffee</option>
                <option value="maize">Maize</option>
                <option value="wheat">Wheat</option>
                <option value="avocado">Avocado</option>
                <option value="sesame">Sesame</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Default Metric</label>
              <select
                disabled={!canManageConfig}
                value={defaultMetric}
                onChange={(e) => setDefaultMetric(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="production">Production Volume</option>
                <option value="yield">Yield Rate</option>
                <option value="suitability">Suitability Score</option>
                <option value="investment_potential">Investment Potential Score</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">Metadata & Version</div>
            <div className="text-slate-500 font-mono">
              Document Version: v{config.version} | Last Updated: {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : 'N/A'}
            </div>
          </div>

          {canManageConfig && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Config...' : 'Save Configuration'}</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default AdminMapConfigPage;
