import React from 'react';
import { InvestmentZoneValue } from '../../../types/investment';
import { CANONICAL_ZONE_IDS } from '../../../features/investment-map/constants/canonicalZones';
import { ShieldCheck, AlertCircle, BarChart2 } from 'lucide-react';

interface QualitySummaryCardProps {
  zoneValues: InvestmentZoneValue[];
  metric?: string;
  className?: string;
}

export function QualitySummaryCard({
  zoneValues,
  metric = 'production',
  className = '',
}: QualitySummaryCardProps) {
  const isProd = metric === 'production';

  // Aggregate quality flags across all 22 canonical zones
  const counts = {
    measured: 0,
    estimated: 0,
    projected: 0,
    unverified: 0,
    missing: 0,
  };

  const populatedZoneIds = new Set<string>();

  zoneValues.forEach((zv) => {
    const raw = isProd ? zv.productionVolume : zv.value;
    const isPopulated = raw !== null && raw !== undefined && typeof raw === 'number' && !isNaN(raw);

    if (isPopulated) {
      populatedZoneIds.add(zv.zoneId);
      const flag = zv.qualityFlag || 'unverified';
      if (flag === 'measured') counts.measured += 1;
      else if (flag === 'estimated') counts.estimated += 1;
      else if (flag === 'projected') counts.projected += 1;
      else counts.unverified += 1;
    }
  });

  // Any canonical zone not in populatedZoneIds counts as missing
  counts.missing = CANONICAL_ZONE_IDS.length - populatedZoneIds.size;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Zone Data Quality Summary
          </h3>
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          22 Canonical Zones
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
        <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
            Measured
          </span>
          <span className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-200 mt-1 block">
            {counts.measured}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 block">
            Estimated
          </span>
          <span className="text-lg font-bold font-mono text-blue-900 dark:text-blue-200 mt-1 block">
            {counts.estimated}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
            Projected
          </span>
          <span className="text-lg font-bold font-mono text-amber-900 dark:text-amber-200 mt-1 block">
            {counts.projected}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 block">
            Unverified
          </span>
          <span className="text-lg font-bold font-mono text-purple-900 dark:text-purple-200 mt-1 block">
            {counts.unverified}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
            Missing
          </span>
          <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-1 block">
            {counts.missing}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
        Data quality classification (qualityFlag) is distinct from dataset governance lifecycle state (verificationStatus).
      </p>
    </div>
  );
}
