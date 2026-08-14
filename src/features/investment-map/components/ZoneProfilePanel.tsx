import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  ShieldAlert,
  Sprout,
  BarChart3,
  Sun,
  Sparkles,
  Truck,
  Briefcase,
  FileCheck,
  XCircle,
  TrendingUp,
  Award,
  PieChart,
  AlertTriangle,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { OromiaZoneFeature } from '../types/gis';
import { ZoneProfileEmptyState } from './ZoneProfileEmptyState';
import { CommodityKey, ThematicMetric } from '../types/thematic';
import {
  SUPPORTED_COMMODITIES,
  SUPPORTED_METRICS,
} from '../data/demoThematicData';
import {
  getDemoZoneCommodityMetrics,
  getDerivedProductionStats,
  classifyThematicValue,
  THEMATIC_CLASS_LABELS,
} from '../services/thematicService';

export interface ZoneProfilePanelProps {
  selectedFeature: OromiaZoneFeature | null;
  selectedCommodity?: CommodityKey | null;
  selectedMetric?: ThematicMetric;
  onClearSelection?: () => void;
  isPublic?: boolean;
  className?: string;
}

export const ZoneProfilePanel: React.FC<ZoneProfilePanelProps> = ({
  selectedFeature,
  selectedCommodity: rawCommodity,
  selectedMetric = 'production',
  onClearSelection,
  isPublic = false,
  className = '',
}) => {
  const selectedCommodity = isPublic ? null : rawCommodity;
  if (!selectedFeature) {
    return <ZoneProfileEmptyState className={className} />;
  }

  const { properties } = selectedFeature;
  const zid = properties.zone_id;

  const commodityObj = SUPPORTED_COMMODITIES.find((c) => c.key === selectedCommodity);
  const metricObj = SUPPORTED_METRICS.find((m) => m.key === selectedMetric);

  const demoMetrics = selectedCommodity ? getDemoZoneCommodityMetrics(zid, selectedCommodity) : null;
  const derivedStats = selectedCommodity ? getDerivedProductionStats(zid, selectedCommodity) : null;

  const rawSuitabilityVal = demoMetrics?.suitability?.score;
  const suitabilityClassRes = selectedCommodity
    ? classifyThematicValue(selectedCommodity, 'suitability', rawSuitabilityVal)
    : null;

  const rawPotentialVal = demoMetrics?.investmentPotential?.score;
  const potentialClassRes = selectedCommodity
    ? classifyThematicValue(selectedCommodity, 'investment_potential', rawPotentialVal)
    : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${properties.zone_id}-${selectedCommodity || 'all'}-${selectedMetric}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        aria-live="polite"
        aria-label={`Agricultural Investment Profile for ${properties.name_en}`}
        className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs ${className}`}
      >
        {/* 1. Zone Identity Header */}
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {selectedCommodity
                    ? `${commodityObj?.labelEn} — ${metricObj?.labelEn} Profile`
                    : 'Administrative Zone Profile'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mt-1 uppercase">
                {properties.name_en}
              </h2>
            </div>

            {onClearSelection && (
              <button
                onClick={onClearSelection}
                title="Deselect zone"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <XCircle className="w-4 h-4" />
                <span>Clear Selection</span>
              </button>
            )}
          </div>

          {/* Identity Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md font-bold">
              PCODE {properties.pcode}
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md">
              zone_id: {properties.zone_id}
            </span>
            {selectedCommodity && (
              <span className="bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>DEMO DATA — NOT OFFICIAL OAB DATA</span>
              </span>
            )}
          </div>

          {/* Candidate GIS & Status Indicator */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">
                {selectedCommodity ? 'Synthetic Development Fixtures Active' : 'Candidate GIS — Technical Validation Passed'}
              </p>
              <p className="text-[11px] text-amber-900/90 dark:text-amber-300/90 leading-normal">
                {selectedCommodity
                  ? 'Values displayed are synthetic development test fixtures created for interface validation.'
                  : 'Formal Bureau GIS acceptance pending. Afaan Oromo / Amharic naming signoff pending.'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Metric-Specific Profile Hierarchy */}
        {selectedCommodity && (
          <div className="space-y-4">
            {/* A. PRODUCTION METRIC PROFILE (WHEN SELECTED METRIC IS PRODUCTION) */}
            {selectedMetric === 'production' && derivedStats && (
              <div className="space-y-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase font-mono">
                      {commodityObj?.labelEn}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {commodityObj?.labelEn} Production Statistics
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Ref Year: 2024/2025 • Primary Measurement Context
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                    DEMO DATA
                  </span>
                </div>

                {/* Primary Production KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-emerald-600" />
                      <span>Production Vol</span>
                    </span>
                    <p className="text-base font-black text-slate-900 dark:text-slate-50 font-mono">
                      {derivedStats.volumeMT !== null ? `${derivedStats.volumeMT.toLocaleString()} MT` : 'No Data'}
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Class: {THEMATIC_CLASS_LABELS[derivedStats.classification]}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans flex items-center gap-1">
                      <Award className="w-3 h-3 text-emerald-600" />
                      <span>Oromia Rank</span>
                    </span>
                    <p className="text-base font-black text-slate-900 dark:text-slate-50 font-mono">
                      {derivedStats.regionalRank !== null ? `#${derivedStats.regionalRank} of 22` : 'N/A'}
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Regional ADM2 Position
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans flex items-center gap-1">
                      <PieChart className="w-3 h-3 text-emerald-600" />
                      <span>Oromia Share</span>
                    </span>
                    <p className="text-base font-black text-slate-900 dark:text-slate-50 font-mono">
                      {derivedStats.regionalSharePercent !== null ? `${derivedStats.regionalSharePercent}%` : 'N/A'}
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Of Regional Production
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Harvested Area</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {derivedStats.harvestedAreaHa !== null ? `${derivedStats.harvestedAreaHa.toLocaleString()} ha` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Avg Yield</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {derivedStats.yieldPerHa !== null ? `${derivedStats.yieldPerHa} tons/ha` : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-sans flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      <span>YoY Trend</span>
                    </span>
                    <p className={`text-sm font-bold font-mono ${
                      derivedStats.trendPercent && derivedStats.trendPercent > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {derivedStats.trendPercent !== null
                        ? `${derivedStats.trendPercent > 0 ? '+' : ''}${derivedStats.trendPercent}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Secondary Context (Suitability & Potential) */}
                <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    Secondary Decision-Support Context
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Suitability Score</p>
                          <p className="text-[10px] text-slate-500 font-mono">Class: {suitabilityClassRes?.classLabel || 'N/A'}</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        {suitabilityClassRes?.rawValue !== null && suitabilityClassRes?.rawValue !== undefined
                          ? `${suitabilityClassRes.rawValue}/100`
                          : 'No Data'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Investment Potential</p>
                          <p className="text-[10px] text-slate-500 font-mono">Class: {potentialClassRes?.classLabel || 'N/A'}</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        {potentialClassRes?.rawValue !== null && potentialClassRes?.rawValue !== undefined
                          ? `${potentialClassRes.rawValue}/100`
                          : 'No Data'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* B. SUITABILITY METRIC PROFILE (WHEN SELECTED METRIC IS SUITABILITY) */}
            {selectedMetric === 'suitability' && (
              <div className="space-y-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs uppercase font-mono">
                      {commodityObj?.labelEn}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {commodityObj?.labelEn} Agronomic Suitability Model
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Methodology: Development Score Model • Not an approved OAB methodology
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                    DEMO DATA
                  </span>
                </div>

                {/* Primary Suitability Score Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase font-mono flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5" />
                      <span>Suitability Score</span>
                    </span>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-50 font-mono">
                      {suitabilityClassRes?.rawValue !== null && suitabilityClassRes?.rawValue !== undefined
                        ? `${suitabilityClassRes.rawValue} / 100`
                        : 'No Data'}
                    </p>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block font-mono">
                      Class: {suitabilityClassRes?.classLabel || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Methodology Status</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      Development Score Model
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-mono">
                      Not an approved OAB methodology. For demonstration purposes only.
                    </p>
                  </div>
                </div>

                {/* Future Factor Models (Placeholders) */}
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px] font-mono flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      <span>Future Agronomic Factor Models (Placeholders)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">No invented factor values</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                    {[
                      'Rainfall Fit',
                      'Temperature Fit',
                      'Elevation Fit',
                      'Soil Fit',
                      'Water Availability',
                    ].map((factor) => (
                      <div key={factor} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 block">{factor}</span>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 italic">
                          Placeholder / Unmodeled
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secondary Context (Production) */}
                {derivedStats && (
                  <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span>Secondary Context: Volume = {derivedStats.volumeMT !== null ? `${derivedStats.volumeMT.toLocaleString()} MT` : 'No Data'}</span>
                    <span>Oromia Rank = {derivedStats.regionalRank !== null ? `#${derivedStats.regionalRank}` : 'N/A'}</span>
                  </div>
                )}
              </div>
            )}

            {/* C. INVESTMENT POTENTIAL METRIC PROFILE (WHEN SELECTED METRIC IS INVESTMENT POTENTIAL) */}
            {selectedMetric === 'investment_potential' && (
              <div className="space-y-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase font-mono">
                      {commodityObj?.labelEn}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {commodityObj?.labelEn} Investment Potential Model
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Methodology: Development Composite Model • Not an approved OAB methodology
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                    DEMO DATA
                  </span>
                </div>

                {/* Primary Potential Score Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase font-mono flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Investment Potential Score</span>
                    </span>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-50 font-mono">
                      {potentialClassRes?.rawValue !== null && potentialClassRes?.rawValue !== undefined
                        ? `${potentialClassRes.rawValue} / 100`
                        : 'No Data'}
                    </p>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block font-mono">
                      Class: {potentialClassRes?.classLabel || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Methodology Status</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      Development Composite Score
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-mono">
                      Not an approved OAB methodology. For demonstration purposes only.
                    </p>
                  </div>
                </div>

                {/* Future Component Models (Placeholders) */}
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px] font-mono flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Future Investment Component Models (Placeholders)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">No invented component scores</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                    {[
                      'Agricultural Base',
                      'Infrastructure',
                      'Market Access',
                      'Processing Capacity',
                      'Irrigation',
                      'Electricity',
                      'Supplier Network',
                    ].map((comp) => (
                      <div key={comp} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] text-slate-500 block">{comp}</span>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 italic">
                          Placeholder / Unmodeled
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secondary Context (Production) */}
                {derivedStats && (
                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span>Secondary Context: Volume = {derivedStats.volumeMT !== null ? `${derivedStats.volumeMT.toLocaleString()} MT` : 'No Data'}</span>
                    <span>Oromia Rank = {derivedStats.regionalRank !== null ? `#${derivedStats.regionalRank}` : 'N/A'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. General Profile Information Architecture (Infrastructure & Opportunities) */}
        <div className="space-y-6">
          {/* Section 1: Agricultural Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>1. Zone Agricultural Overview</span>
            </h3>
            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 space-y-1.5 text-xs">
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {selectedCommodity
                  ? `Demonstrating synthetic prototype data for ${commodityObj?.labelEn} in ${properties.name_en}.`
                  : 'No verified agricultural overview has been published for this zone yet.'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Official texts will be published via the Investment CMS.
              </p>
            </div>
          </div>

          {/* Section 2: Infrastructure Status */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>2. Zone Infrastructure Status</span>
            </h3>

            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              {[
                'Road network',
                'Irrigation schemes',
                'Power grid',
                'Storage hubs',
                'Cold chain',
                'Agro-processing',
                'Market centers',
              ].map((category) => (
                <span
                  key={category}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 px-2.5 py-1 rounded-md"
                >
                  {category}
                </span>
              ))}
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex items-center justify-between">
              <span>Official infrastructure dataset:</span>
              <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">Not connected / Demo state</span>
            </div>
          </div>

          {/* Section 3: Available Opportunities */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>3. Verified Investment Opportunities</span>
            </h3>

            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex items-center justify-between">
              <span>Investment opportunities catalog:</span>
              <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">Not connected / Demo state</span>
            </div>
          </div>

          {/* Section 4: Data Sources & Dataset Metadata (Requirement 2 Explicit Labeling) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>4. Dataset Metadata & Provenance</span>
            </h3>

            <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="text-slate-500 font-sans">Dataset</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {isPublic ? 'Candidate Administrative Boundaries (22 Zones)' : 'Synthetic Development Fixture'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="text-slate-500 font-sans">Verification</span>
                <span className={`font-bold ${isPublic ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {isPublic ? 'Passed GIS Validation' : 'Demo / Unverified'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="text-slate-500 font-sans">Source</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {isPublic ? 'UN-OCHA COD-AB v04' : 'No official source connected'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="text-slate-500 font-sans">Boundary Base</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  UN-OCHA COD-AB v04
                </span>
              </div>

              {!isPublic && (
                <div className="pt-1 text-[10px] text-amber-700 dark:text-amber-400 font-sans font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>DEMO DATA — NOT OFFICIAL OAB DATA</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

