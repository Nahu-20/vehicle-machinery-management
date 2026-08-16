import React, { useState } from 'react';
import {
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Search,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  InvestmentDataset,
  InvestmentZoneValue,
} from '../../../types/investment';
import {
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
  CanonicalZoneId,
} from '../../../features/investment-map/constants/canonicalZones';
import { setZoneValues } from '../../../services/investment/investmentDatasetService';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';

interface AdminDatasetValueEditorProps {
  dataset: InvestmentDataset;
  existingValues: InvestmentZoneValue[];
  onSaveSuccess: () => void;
  onCancel: () => void;
}

type DraftZoneValueMap = Record<CanonicalZoneId, Partial<InvestmentZoneValue>>;

export function AdminDatasetValueEditor({
  dataset,
  existingValues,
  onSaveSuccess,
  onCancel,
}: AdminDatasetValueEditorProps) {
  const { staffUser } = useStaffAuthorizationContext();

  // Initialize draft map with all 22 canonical zones
  const initializeDrafts = (): DraftZoneValueMap => {
    const existingMap = new Map<string, InvestmentZoneValue>();
    existingValues.forEach((v) => existingMap.set(v.zoneId, v));

    const drafts: Partial<DraftZoneValueMap> = {};
    CANONICAL_ZONE_IDS.forEach((zid) => {
      const existing = existingMap.get(zid);
      if (existing) {
        drafts[zid] = { ...existing };
      } else {
        drafts[zid] = {
          zoneId: zid,
          value: null,
          productionVolume: null,
          harvestedAreaHa: null,
          yieldValue: null,
          trendPercent: null,
          qualityFlag: 'unverified',
          notes: '',
          version: 0,
        };
      }
    });

    return drafts as DraftZoneValueMap;
  };

  const [drafts, setDrafts] = useState<DraftZoneValueMap>(initializeDrafts);
  const [isDirty, setIsDirty] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'populated' | 'missing'>('all');
  const [batchScope, setBatchScope] = useState<'all' | 'filtered'>('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isProduction = dataset.metric === 'production';
  const isScoreBased = dataset.metric === 'suitability' || dataset.metric === 'investment_potential';
  const isReadOnly =
    dataset.lifecycleStatus === 'review' ||
    dataset.lifecycleStatus === 'published' ||
    dataset.lifecycleStatus === 'archived';

  // Protect against accidental navigation/unload when unsaved changes exist
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Field change handler
  const handleValueChange = (
    zid: CanonicalZoneId,
    field: keyof InvestmentZoneValue,
    val: any
  ) => {
    setIsDirty(true);
    setDrafts((prev) => ({
      ...prev,
      [zid]: {
        ...prev[zid],
        [field]: val,
      },
    }));
  };

  // Helper to auto-calculate yield for production datasets with unit safety & division by zero protection
  const autoCalculateYields = () => {
    if (!isProduction) return;

    // Check if any row already has a yield value
    const hasExistingYields = CANONICAL_ZONE_IDS.some(
      (zid) => drafts[zid].yieldValue !== null && drafts[zid].yieldValue !== undefined
    );

    let overwrite = false;
    if (hasExistingYields) {
      overwrite = window.confirm(
        'Some zones already have yield values entered. Click OK to overwrite existing yields, or Cancel to fill missing yields only.'
      );
    }

    const volUnit = (dataset.unit || '').toLowerCase();
    const isKg = volUnit === 'kg' || volUnit === 'kilogram';

    let countCalculated = 0;

    setDrafts((prev) => {
      const next = { ...prev };
      CANONICAL_ZONE_IDS.forEach((zid) => {
        const row = next[zid];

        // Skip if already has yield and user chose not to overwrite
        if (!overwrite && row.yieldValue !== null && row.yieldValue !== undefined) {
          return;
        }

        if (
          row.productionVolume !== null &&
          row.productionVolume !== undefined &&
          row.harvestedAreaHa !== null &&
          row.harvestedAreaHa !== undefined &&
          row.harvestedAreaHa > 0 // Strict check against division by zero!
        ) {
          // Unit safety: if volume unit is kg, convert to tonnes before dividing by hectares
          const effectiveVolumeInTonnes = isKg
            ? row.productionVolume / 1000
            : row.productionVolume;

          const calculatedYield = Number((effectiveVolumeInTonnes / row.harvestedAreaHa).toFixed(2));
          next[zid] = {
            ...row,
            yieldValue: calculatedYield,
            yieldUnit: isKg ? 'kg/ha' : dataset.unit ? `${dataset.unit}/ha` : 'tonne/ha',
          };
          countCalculated++;
        }
      });
      return next;
    });

    setIsDirty(true);
    setSuccessMsg(`Auto-calculated yield rates for ${countCalculated} zone(s) with valid area and volume values.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Reset all drafts back to original state
  const handleReset = () => {
    setDrafts(initializeDrafts());
    setIsDirty(false);
    setError(null);
    setSuccessMsg(null);
  };

  // Quick action: Set quality flag for selected scope (all 22 zones or filtered zones)
  const setQualityFlagsWithScope = (flag: InvestmentZoneValue['qualityFlag']) => {
    if (!flag) return;

    const targetZoneIds =
      batchScope === 'filtered' ? filteredZoneIds : CANONICAL_ZONE_IDS;

    setDrafts((prev) => {
      const next = { ...prev };
      targetZoneIds.forEach((zid) => {
        next[zid] = {
          ...next[zid],
          qualityFlag: flag,
        };
      });
      return next;
    });

    setIsDirty(true);
    setSuccessMsg(`Set quality flag to "${flag}" for ${targetZoneIds.length} zone(s).`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleCancelClick = () => {
    if (isDirty) {
      const confirmExit = window.confirm(
        'You have unsaved changes in the 22-zone editor. Are you sure you want to cancel and discard your edits?'
      );
      if (!confirmExit) return;
    }
    onCancel();
  };

  // Validate drafts
  const validate = (): string[] => {
    const errs: string[] = [];

    CANONICAL_ZONE_IDS.forEach((zid) => {
      const row = drafts[zid];
      const zoneName = CANONICAL_ZONE_METADATA[zid]?.displayName || zid;

      if (isProduction) {
        if (row.productionVolume !== null && row.productionVolume !== undefined && row.productionVolume < 0) {
          errs.push(`${zoneName}: Production volume cannot be negative.`);
        }
        if (row.harvestedAreaHa !== null && row.harvestedAreaHa !== undefined && row.harvestedAreaHa < 0) {
          errs.push(`${zoneName}: Harvested area cannot be negative.`);
        }
        if (row.yieldValue !== null && row.yieldValue !== undefined && row.yieldValue < 0) {
          errs.push(`${zoneName}: Yield value cannot be negative.`);
        }
      } else if (isScoreBased) {
        if (row.value !== null && row.value !== undefined) {
          if (row.value < 0 || row.value > 100) {
            errs.push(`${zoneName}: Score must be between 0 and 100 (got ${row.value}).`);
          }
        }
      } else {
        if (row.value !== null && row.value !== undefined && row.value < 0) {
          errs.push(`${zoneName}: Metric value cannot be negative.`);
        }
      }
    });

    return errs;
  };

  // Save handler
  const handleSave = async () => {
    if (!staffUser) {
      setError('Staff authorization context missing.');
      return;
    }

    setError(null);
    setSuccessMsg(null);

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    // Collect all 22 canonical zone items (sending explicit null for cleared/unpopulated fields)
    const payloadValues: InvestmentZoneValue[] = [];

    CANONICAL_ZONE_IDS.forEach((zid) => {
      const row = drafts[zid];

      payloadValues.push({
        zoneId: zid,
        value: row.value !== undefined ? row.value : null,
        productionVolume: row.productionVolume !== undefined ? row.productionVolume : null,
        productionUnit: row.productionUnit || dataset.unit || 'tonne',
        harvestedAreaHa: row.harvestedAreaHa !== undefined ? row.harvestedAreaHa : null,
        yieldValue: row.yieldValue !== undefined ? row.yieldValue : null,
        yieldUnit: row.yieldUnit || (dataset.unit ? `${dataset.unit}/ha` : 'tonne/ha'),
        trendPercent: row.trendPercent !== undefined ? row.trendPercent : null,
        qualityFlag: row.qualityFlag || 'unverified',
        notes: row.notes || '',
        version: row.version || 0,
        updatedAt: new Date().toISOString(),
        updatedBy: staffUser.uid,
      });
    });

    setSaving(true);
    try {
      const result = await setZoneValues(staffUser, dataset.datasetId, payloadValues, dataset.version);
      setIsDirty(false);
      setSuccessMsg(`Successfully saved all 22 zone records (Dataset Version v${result.newVersion})!`);
      setTimeout(() => {
        onSaveSuccess();
      }, 1000);
    } catch (err: any) {
      if (err.code === 'VERSION_CONFLICT') {
        setError('This dataset was updated by another user. Please reload the latest values before saving again.');
      } else if (err.code === 'DATASET_LIFECYCLE_LOCKED') {
        setError('This dataset is published or archived and locked from editing.');
      } else {
        setError(err?.message || 'Failed to save zone values.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Filtered zone list
  const filteredZoneIds = CANONICAL_ZONE_IDS.filter((zid) => {
    const meta = CANONICAL_ZONE_METADATA[zid];
    const nameMatch =
      meta.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meta.pcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zid.toLowerCase().includes(searchTerm.toLowerCase());

    if (!nameMatch) return false;

    const row = drafts[zid];
    const isPopulated = isProduction
      ? (row.productionVolume !== null && row.productionVolume !== undefined)
      : (row.value !== null && row.value !== undefined);

    if (filterStatus === 'populated') return isPopulated;
    if (filterStatus === 'missing') return !isPopulated;
    return true;
  });

  const totalPopulated = CANONICAL_ZONE_IDS.filter((zid) => {
    const row = drafts[zid];
    return isProduction
      ? (row.productionVolume !== null && row.productionVolume !== undefined)
      : (row.value !== null && row.value !== undefined);
  }).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-6">
      {/* Header & Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {dataset.datasetId}
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Zone Value Editor (22 Canonical ADM2 Zones)
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            Edit Statistics: {dataset.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Metric type: <strong className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{dataset.metric}</strong> ({dataset.unit || 'N/A'})
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isReadOnly}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isReadOnly ? 'Values Locked' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Review Read-Only Banner */}
      {dataset.lifecycleStatus === 'review' && (
        <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-2.5 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-sm">Values Under Review</div>
              <p className="font-normal text-xs text-amber-800 dark:text-amber-300">
                Return this dataset to draft before changing zone values.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Published/Archived Read-Only Banner */}
      {(dataset.lifecycleStatus === 'published' || dataset.lifecycleStatus === 'archived') && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <div>
            <div className="font-bold">Values Locked ({dataset.lifecycleStatus})</div>
            <p className="text-slate-500 dark:text-slate-400">
              Direct value editing is disabled for {dataset.lifecycleStatus} datasets. Create a new revision or unpublish first.
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{successMsg}</div>
        </div>
      )}

      {/* Controls & Quick Tools Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search zone or pcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All (22)
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('populated')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                filterStatus === 'populated'
                  ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Populated ({totalPopulated})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('missing')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                filterStatus === 'missing'
                  ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Missing ({22 - totalPopulated})
            </button>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {isProduction && (
            <button
              type="button"
              onClick={autoCalculateYields}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              title="Calculates yield = Volume / Area for all rows where both exist"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Auto-Calculate Yields</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold">Batch Quality Flag:</span>
            <select
              value={batchScope}
              onChange={(e) => setBatchScope(e.target.value as 'all' | 'filtered')}
              className="py-1 px-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200"
              title="Select whether batch flag applies to all 22 zones or only currently filtered rows"
            >
              <option value="all">All 22 Zones</option>
              <option value="filtered">
                Visible Rows Only ({filteredZoneIds.length})
              </option>
            </select>
            <select
              onChange={(e) => {
                setQualityFlagsWithScope(e.target.value as any);
                e.target.value = '';
              }}
              className="py-1 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 font-semibold"
              defaultValue=""
            >
              <option value="" disabled>
                Set flag to...
              </option>
              <option value="measured">Measured</option>
              <option value="estimated">Estimated</option>
              <option value="projected">Projected</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Editor Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-mono text-[10px]">
              <th className="p-3 font-semibold w-48">Zone Name & P-Code</th>
              {isProduction ? (
                <>
                  <th className="p-3 font-semibold w-36">Volume ({dataset.unit || 'tonne'})</th>
                  <th className="p-3 font-semibold w-36">Harvested Area (ha)</th>
                  <th className="p-3 font-semibold w-36">Yield ({dataset.unit ? `${dataset.unit}/ha` : 'tonne/ha'})</th>
                  <th className="p-3 font-semibold w-28">Trend (%)</th>
                </>
              ) : (
                <th className="p-3 font-semibold w-40">
                  {isScoreBased ? 'Score Value (0-100)' : `Metric Value (${dataset.unit || ''})`}
                </th>
              )}
              <th className="p-3 font-semibold w-36">Quality Flag</th>
              <th className="p-3 font-semibold">Notes / Source Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredZoneIds.length === 0 ? (
              <tr>
                <td colSpan={isProduction ? 7 : 4} className="p-8 text-center text-slate-500">
                  No canonical zones match the current search or filter options.
                </td>
              </tr>
            ) : (
              filteredZoneIds.map((zid) => {
                const meta = CANONICAL_ZONE_METADATA[zid];
                const row = drafts[zid];

                const isPopulated = isProduction
                  ? row.productionVolume !== null && row.productionVolume !== undefined
                  : row.value !== null && row.value !== undefined;

                return (
                  <tr
                    key={zid}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isPopulated
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-amber-50/20 dark:bg-amber-950/10'
                    }`}
                  >
                    {/* Zone Info */}
                    <td className="p-3 align-top">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {meta.displayName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-slate-400">{meta.pcode}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isPopulated
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {isPopulated ? 'Populated' : 'Missing'}
                        </span>
                      </div>
                    </td>

                    {/* Metric Fields */}
                    {isProduction ? (
                      <>
                        {/* Production Volume */}
                        <td className="p-2 align-top">
                          <input
                            type="number"
                            step="any"
                            disabled={isReadOnly}
                            placeholder="e.g. 12500"
                            value={row.productionVolume ?? ''}
                            onChange={(e) =>
                              handleValueChange(
                                zid,
                                'productionVolume',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                          />
                        </td>

                        {/* Harvested Area */}
                        <td className="p-2 align-top">
                          <input
                            type="number"
                            step="any"
                            disabled={isReadOnly}
                            placeholder="e.g. 8400"
                            value={row.harvestedAreaHa ?? ''}
                            onChange={(e) =>
                              handleValueChange(
                                zid,
                                'harvestedAreaHa',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                          />
                        </td>

                        {/* Yield Value */}
                        <td className="p-2 align-top">
                          <input
                            type="number"
                            step="any"
                            disabled={isReadOnly}
                            placeholder="e.g. 1.48"
                            value={row.yieldValue ?? ''}
                            onChange={(e) =>
                              handleValueChange(
                                zid,
                                'yieldValue',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                          />
                        </td>

                        {/* Trend Percent */}
                        <td className="p-2 align-top">
                          <input
                            type="number"
                            step="any"
                            disabled={isReadOnly}
                            placeholder="e.g. 4.5"
                            value={row.trendPercent ?? ''}
                            onChange={(e) =>
                              handleValueChange(
                                zid,
                                'trendPercent',
                                e.target.value === '' ? null : Number(e.target.value)
                              )
                            }
                            className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                          />
                        </td>
                      </>
                    ) : (
                      /* Single Metric Value Input */
                      <td className="p-2 align-top">
                        <input
                          type="number"
                          step="any"
                          disabled={isReadOnly}
                          min={isScoreBased ? 0 : undefined}
                          max={isScoreBased ? 100 : undefined}
                          placeholder={isScoreBased ? '0 - 100' : 'Value'}
                          value={row.value ?? ''}
                          onChange={(e) =>
                            handleValueChange(
                              zid,
                              'value',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                        />
                      </td>
                    )}

                    {/* Quality Flag Dropdown */}
                    <td className="p-2 align-top">
                      <select
                        disabled={isReadOnly}
                        value={row.qualityFlag || 'unverified'}
                        onChange={(e) => handleValueChange(zid, 'qualityFlag', e.target.value)}
                        className="w-full py-1 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                      >
                        <option value="measured">Measured</option>
                        <option value="estimated">Estimated</option>
                        <option value="projected">Projected</option>
                        <option value="unverified">Unverified</option>
                      </select>
                    </td>

                    {/* Row Notes */}
                    <td className="p-2 align-top">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        placeholder="Optional remarks..."
                        value={row.notes || ''}
                        onChange={(e) => handleValueChange(zid, 'notes', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500">
          Showing {filteredZoneIds.length} of 22 zones | Populated in draft: {totalPopulated} / 22
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save All Zone Values</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDatasetValueEditor;
