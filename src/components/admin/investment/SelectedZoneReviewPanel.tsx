import React from 'react';
import { InvestmentDataset, InvestmentZoneValue } from '../../../types/investment';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';
import { MapPin, Info, CheckCircle2, AlertCircle, TrendingUp, BarChart3, HelpCircle } from 'lucide-react';

interface SelectedZoneReviewPanelProps {
  zoneId: string | null;
  dataset: InvestmentDataset;
  zoneValues: InvestmentZoneValue[];
  onSelectZone?: (zoneId: string) => void;
}

export function SelectedZoneReviewPanel({
  zoneId,
  dataset,
  zoneValues,
  onSelectZone,
}: SelectedZoneReviewPanelProps) {
  if (!zoneId) {
    return (
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 space-y-2">
        <MapPin className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 animate-pulse" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No Zone Selected</p>
        <p className="text-[11px] text-slate-400">
          Click any zone on the admin thematic map or select from the zone table below to inspect individual record values and quality metrics.
        </p>
      </div>
    );
  }

  const zoneMeta = CANONICAL_ZONE_METADATA[zoneId];
  const zv = zoneValues.find((v) => v.zoneId === zoneId);
  const isProd = dataset.metric === 'production';
  const rawVal = zv ? (isProd ? zv.productionVolume : zv.value) : null;
  const isPopulated = rawVal !== null && rawVal !== undefined && typeof rawVal === 'number';

  const renderQualityFlagBadge = (flag?: string) => {
    switch (flag) {
      case 'measured':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Measured
          </span>
        );
      case 'estimated':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Estimated
          </span>
        );
      case 'projected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Projected
          </span>
        );
      case 'unverified':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            Unverified
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Missing / No Flag
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
      {/* Zone Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider block">
            {zoneMeta?.pcode || zoneId}
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {zoneMeta?.displayName || zoneId}
          </h3>
        </div>

        <div className="text-right">
          {renderQualityFlagBadge(zv?.qualityFlag)}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
        <span className="text-[10px] font-bold uppercase text-slate-400 block">
          Primary Metric: {dataset.metric?.replace('_', ' ')}
        </span>
        <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
          {isPopulated ? (
            <span>
              {rawVal.toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">{dataset.unit}</span>
            </span>
          ) : (
            <span className="text-slate-400 italic font-sans font-normal text-xs">No Data (null)</span>
          )}
        </div>
      </div>

      {/* Additional Production Metrics if present */}
      {isProd && zv && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Harvested Area</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {zv.harvestedAreaHa !== undefined && zv.harvestedAreaHa !== null ? `${zv.harvestedAreaHa.toLocaleString()} ha` : '—'}
            </span>
          </div>

          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Yield</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {zv.yieldPerHa !== undefined && zv.yieldPerHa !== null ? `${zv.yieldPerHa} Q/ha` : '—'}
            </span>
          </div>

          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Trend</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {zv.trendPercent !== undefined && zv.trendPercent !== null ? `${zv.trendPercent > 0 ? '+' : ''}${zv.trendPercent}%` : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Internal Notes / Methodology Comments */}
      {zv?.notes ? (
        <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-700 dark:text-amber-400">
            Data Quality Notes
          </span>
          <p className="text-[11px] italic">{zv.notes}</p>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 italic">No specific quality notes provided for this zone record.</p>
      )}
    </div>
  );
}
