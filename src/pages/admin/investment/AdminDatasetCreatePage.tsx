import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Database, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import { createDataset } from '../../../services/investment/investmentDatasetService';
import { CommodityKey } from '../../../types/investment';

export function AdminDatasetCreatePage() {
  const { staffUser } = useStaffAuthorizationContext();
  const navigate = useNavigate();

  const canManageDatasets = hasPermission(staffUser, 'investment.datasets.manage');

  const [title, setTitle] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [category, setCategory] = useState<'production' | 'suitability' | 'investment_potential' | 'infrastructure'>('production');
  const [commodity, setCommodity] = useState<CommodityKey>('coffee');
  const [metric, setMetric] = useState('production');
  const [unit, setUnit] = useState('tonne');
  const [periodType, setPeriodType] = useState<'year' | 'season' | 'fiscal_year' | 'multi_year'>('year');
  const [periodLabel, setPeriodLabel] = useState('2024/2025 Meher Season');
  const [startYear, setStartYear] = useState<number>(2024);
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate ID from title if user hasn't edited ID manually
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (slug) {
      setDatasetId(`ds_${commodity}_${slug}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser) {
      setError('Unauthenticated session');
      return;
    }

    if (!title.trim() || !datasetId.trim()) {
      setError('Title and Dataset ID are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createDataset(staffUser, {
        datasetId: datasetId.trim(),
        title: title.trim(),
        category,
        commodity,
        metric,
        unit,
        referencePeriod: {
          type: periodType,
          label: periodLabel,
          startYear,
        },
        description: description.trim(),
        sourceIds: [], // required before publication, but optional for draft
        verificationStatus: 'unverified',
      });

      // Navigate to detail page on success
      navigate(`/admin/investment/datasets/${datasetId.trim()}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create dataset draft.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageDatasets) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-rose-600">
        You do not have permission to create datasets (`investment.datasets.manage` required).
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/investment/datasets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Datasets</span>
        </Link>
      </div>

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Create Dataset Metadata
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Define dataset parameters before populating zone-level statistics.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Dataset Title */}
          <div className="md:col-span-2 space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Dataset Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Oromia Coffee Production 2024/2025"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Dataset ID */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Dataset ID (Unique) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ds_coffee_prod_2025"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Commodity */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Commodity <span className="text-rose-500">*</span>
            </label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value as CommodityKey)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 capitalize"
            >
              <option value="coffee">Coffee</option>
              <option value="maize">Maize</option>
              <option value="wheat">Wheat</option>
              <option value="avocado">Avocado</option>
              <option value="sesame">Sesame</option>
              <option value="teff">Teff</option>
              <option value="livestock">Livestock</option>
              <option value="dairy">Dairy</option>
              <option value="horticulture">Horticulture</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="production">Production Statistics</option>
              <option value="suitability">Agro-Ecological Suitability</option>
              <option value="investment_potential">Investment Potential Index</option>
              <option value="infrastructure">Infrastructure Mapping</option>
            </select>
          </div>

          {/* Metric */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="production">Production Volume</option>
              <option value="yield">Yield Rate</option>
              <option value="harvested_area">Harvested Area</option>
              <option value="suitability">Suitability Score (0-100)</option>
              <option value="investment_potential">Investment Potential Score (0-100)</option>
              <option value="count">Count / Total</option>
            </select>
          </div>

          {/* Unit */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Measurement Unit</label>
            <input
              type="text"
              required
              placeholder="e.g. tonne, kg, quintal, hectare, score"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Reference Period Label */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Reference Period Label
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2024/2025 Meher Season"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Start Year */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Start Year</label>
            <input
              type="number"
              required
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value, 10) || 2024)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Period Type */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Period Type</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="year">Calendar Year</option>
              <option value="season">Agricultural Season</option>
              <option value="fiscal_year">Fiscal Year</option>
              <option value="multi_year">Multi-Year Average</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Description & Context</label>
            <textarea
              rows={3}
              placeholder="Enter descriptive metadata, methodology notes or scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Initial save creates a <strong className="text-slate-700 dark:text-slate-300">Draft</strong> record. Zone statistics values can be populated in Milestone A2B.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Creating...' : 'Create Draft Dataset'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminDatasetCreatePage;
