import React, { useState, useCallback } from 'react';
import { UnifiedMapContainer } from '../features/investment-map/components/UnifiedMapContainer';
import { ZoneProfilePanel } from '../features/investment-map/components/ZoneProfilePanel';
import { ThematicSelectorBar } from '../features/investment-map/components/ThematicSelectorBar';
import { DemoDataBanner } from '../features/investment-map/components/DemoDataBanner';
import { MapLegend } from '../features/investment-map/components/MapLegend';
import { CommodityKey, ThematicMetric } from '../features/investment-map/types/thematic';
import {
  Layers,
  ShieldAlert,
  Cpu,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Info,
  Building2,
  Globe2,
  FileCheck2,
  ExternalLink,
  MousePointerClick,
  XCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GisValidationResult } from '../features/investment-map/types/gis';
import { OFFICIAL_GIS_METADATA, getZoneFeatureById } from '../features/investment-map/services/gisLoader';
import { useSelectedZone } from '../features/investment-map/hooks/useSelectedZone';

export const InvestmentMapLabPage: React.FC = () => {
  const [mountMap, setMountMap] = useState<boolean>(true);
  const [remountCount, setRemountCount] = useState<number>(0);
  const [gisResult, setGisResult] = useState<GisValidationResult | null>(null);

  // Milestone M6A Product Thematic Map State
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityKey | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<ThematicMetric>('production');

  const handleGisVerified = useCallback((res: GisValidationResult) => {
    setGisResult(res);
  }, []);

  // M4/M5 Canonical Selection Engine Hook
  const { selectedZoneId, selectZone, clearSelection } = useSelectedZone();

  // Selected Zone Feature Lookup
  const selectedFeature = getZoneFeatureById(gisResult?.data, selectedZoneId);

  const handleRemount = () => {
    setMountMap(false);
    setTimeout(() => {
      setMountMap(true);
      setRemountCount((prev) => prev + 1);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header navigation & title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              <Cpu className="w-4 h-4" />
              <span>GIS Technical Laboratory — Milestone M5 Shell</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Oromia Agricultural Investment Map & Zone Profile Shell
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Interactive MapLibre GL Candidate ADM2 Map & Investment Profile Shell
            </p>
          </div>

          <Link
            to="/investment"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-2xs transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Portal</span>
          </Link>
        </div>

        {/* Candidate Status Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-amber-950 dark:text-amber-200 text-sm space-y-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-base text-amber-950 dark:text-amber-100">
                  Candidate GIS — Technical Validation Passed
                </span>
                <span className="bg-amber-500/20 text-amber-950 dark:text-amber-300 font-mono text-xs px-2.5 py-0.5 rounded-full border border-amber-500/40 font-semibold">
                  Formal Bureau GIS Acceptance Pending
                </span>
              </div>
              <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                {OFFICIAL_GIS_METADATA.caveat}
              </p>
            </div>
          </div>

          {/* Key Dataset Provenance Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-amber-500/20 text-xs font-mono">
            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <span className="text-amber-800 dark:text-amber-400 block text-[10px] uppercase font-sans font-semibold">Source</span>
              <span className="font-bold truncate block" title={OFFICIAL_GIS_METADATA.sourceOrganization}>
                UN-OCHA FIS / CSA
              </span>
            </div>

            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <span className="text-amber-800 dark:text-amber-400 block text-[10px] uppercase font-sans font-semibold">Dataset Version</span>
              <span className="font-bold block">{OFFICIAL_GIS_METADATA.version} (2025/2026)</span>
            </div>

            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <span className="text-amber-800 dark:text-amber-400 block text-[10px] uppercase font-sans font-semibold">Boundary Ref</span>
              <span className="font-bold block">{OFFICIAL_GIS_METADATA.boundaryReferenceDate}</span>
            </div>

            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <span className="text-amber-800 dark:text-amber-400 block text-[10px] uppercase font-sans font-semibold">Oromia Units</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">22 ADM2 Records</span>
            </div>

            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <span className="text-amber-800 dark:text-amber-400 block text-[10px] uppercase font-sans font-semibold">License</span>
              <span className="font-bold truncate block" title={OFFICIAL_GIS_METADATA.licenseTitle}>
                CC BY-IGO
              </span>
            </div>

            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <span className="text-amber-800 dark:text-amber-400 block text-[10px] uppercase font-sans font-semibold">Runtime Checksum</span>
              <span className="font-bold block truncate" title={OFFICIAL_GIS_METADATA.runtimeChecksum}>
                {OFFICIAL_GIS_METADATA.runtimeChecksum.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar & Canvas Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Map Canvas Controls & Verification State</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Engine: <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{mountMap ? 'Active OpenLayers GIS' : 'Unmounted'}</span> | Candidate Units: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">22 Polygons</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMountMap(!mountMap)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {mountMap ? 'Unmount Map Canvas' : 'Mount Map Canvas'}
            </button>

            <button
              onClick={handleRemount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Simulate Route Change</span>
            </button>
          </div>
        </div>

        {/* M6A Product Thematic Map Controls & Demo Banner */}
        <div className="space-y-3">
          <ThematicSelectorBar
            selectedCommodity={selectedCommodity}
            selectedMetric={selectedMetric}
            onSelectCommodity={setSelectedCommodity}
            onSelectMetric={setSelectedMetric}
          />
          {selectedCommodity && <DemoDataBanner />}
        </div>

        {/* Desktop Split View: Map (~68%) + Zone Profile Panel (~32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Viewport Container (~68% width on desktop) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 sm:p-3 shadow-xs space-y-3">
            <div className="flex items-center justify-between px-2 pt-1 pb-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Oromia Administrative Map (22 Candidate ADM2 Zones)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Click polygon to view profile
              </span>
            </div>

            {mountMap ? (
              <div className="space-y-3">
                <UnifiedMapContainer
                  height="650px"
                  onGisVerified={handleGisVerified}
                  selectedZoneId={selectedZoneId}
                  selectedCommodity={selectedCommodity}
                  selectedMetric={selectedMetric}
                  onSelectZone={(zoneId) => selectZone(zoneId)}
                />
                <MapLegend
                  selectedCommodity={selectedCommodity}
                  selectedMetric={selectedMetric}
                />
              </div>
            ) : (
              <div className="h-[650px] w-full rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50 flex flex-col items-center justify-center text-slate-500 text-sm">
                <Layers className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Map canvas unmounted safely from DOM.</p>
                <p className="text-xs text-slate-400 mt-1">Click "Mount Map Canvas" to re-initialize OpenLayers GIS.</p>
              </div>
            )}
          </div>

          {/* Zone Profile Panel (~32% width on desktop, sticky & independently scrollable) */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 max-h-[750px] overflow-y-auto pr-0.5 custom-scrollbar">
            <ZoneProfilePanel
              selectedFeature={selectedFeature}
              selectedCommodity={selectedCommodity}
              selectedMetric={selectedMetric}
              onClearSelection={clearSelection}
            />
          </div>
        </div>

        {/* Special Inspection Regression Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Special Inspection 1: Shager City (ET0420)</span>
              </div>
              <button
                onClick={() => selectZone('shager_city')}
                className="bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30 cursor-pointer transition-colors shrink-0"
              >
                Select Shager City
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Formally designated as <strong className="text-slate-900 dark:text-slate-100">Shager City</strong> in the UN-OCHA COD-AB v04 release (replacing legacy 2021 Finfine Special Zone). Canonical <code className="font-mono font-bold text-emerald-700 dark:text-emerald-400">zone_id: shager_city</code>.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                <Globe2 className="w-4 h-4 shrink-0" />
                <span>Special Inspection 2: East Borena (ET0422)</span>
              </div>
              <button
                onClick={() => selectZone('east_borena')}
                className="bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30 cursor-pointer transition-colors shrink-0"
              >
                Select East Borena
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Newly established administrative zone in southern Oromia, distinct from Borena (<code className="font-mono font-bold text-emerald-700 dark:text-emerald-400">ET0412</code>). Canonical <code className="font-mono font-bold text-emerald-700 dark:text-emerald-400">zone_id: east_borena</code>.
            </p>
          </div>
        </div>

        {/* Detailed 22 ADM2 Feature Inventory Verification Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>ADM2 Candidate Inventory & Selection Synchronizer (22 Units)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every candidate polygon verified. Clicking any row updates the unified selection state and Zone Profile Panel.
              </p>
            </div>

            {gisResult && (
              <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {gisResult.featureCount} Features | Extent: [{gisResult.bbox[0].toFixed(2)}°, {gisResult.bbox[1].toFixed(2)}°] to [{gisResult.bbox[2].toFixed(2)}°, {gisResult.bbox[3].toFixed(2)}°]
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">PCODE</th>
                  <th className="px-3 py-2.5">Source English Name</th>
                  <th className="px-3 py-2.5">Canonical zone_id</th>
                  <th className="px-3 py-2.5">Geometry</th>
                  <th className="px-3 py-2.5">Afaan Oromo Name</th>
                  <th className="px-3 py-2.5">Amharic Name</th>
                  <th className="px-3 py-2.5">Selection Status</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-mono">
                {gisResult?.data?.features.map((f) => {
                  const p = f.properties;
                  const isSelected = p.zone_id === selectedZoneId;
                  return (
                    <tr
                      key={p.pcode}
                      onClick={() => selectZone(p.zone_id)}
                      className={
                        isSelected
                          ? 'bg-emerald-500/15 dark:bg-emerald-950/60 hover:bg-emerald-500/25 transition-colors cursor-pointer border-l-4 border-l-emerald-600 dark:border-l-emerald-400 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer'
                      }
                    >
                      <td className="px-3 py-2 text-emerald-700 dark:text-emerald-400 font-bold">{p.pcode}</td>
                      <td className="px-3 py-2 font-sans font-semibold text-slate-900 dark:text-slate-100">
                        {p.name_en}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{p.zone_id}</td>
                      <td className="px-3 py-2 text-slate-500">{f.geometry.type}</td>
                      <td className="px-3 py-2 font-sans text-slate-700 dark:text-slate-300">{p.name_om}</td>
                      <td className="px-3 py-2 font-sans text-slate-700 dark:text-slate-300">{p.name_am}</td>
                      <td className="px-3 py-2">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-sans px-2 py-0.5 rounded shadow-2xs font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SELECTED</span>
                          </span>
                        ) : (
                          <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-sans px-2 py-0.5 rounded">
                            Unselected
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectZone(p.zone_id);
                          }}
                          className={`text-[10px] font-sans font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Required Attribution & Disclaimer Footer Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Map Attribution & Regulatory Disclaimer</span>
            </div>
            <a
              href="https://data.humdata.org/dataset/cod-ab-eth"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline text-[11px] font-semibold"
            >
              <span>View Source Dataset on HDX</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Attribution:</strong> {OFFICIAL_GIS_METADATA.attribution} | License: {OFFICIAL_GIS_METADATA.licenseTitle}
          </p>

          <p className="leading-relaxed text-slate-500 dark:text-slate-400 italic">
            <strong className="not-italic text-slate-800 dark:text-slate-200">Disclaimer:</strong> {OFFICIAL_GIS_METADATA.disclaimer}. {OFFICIAL_GIS_METADATA.caveat}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestmentMapLabPage;
