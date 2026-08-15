import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UnifiedMapContainer } from '../../features/investment-map/components/UnifiedMapContainer';
import { ZoneProfilePanel } from '../../features/investment-map/components/ZoneProfilePanel';
import { ThematicSelectorBar } from '../../features/investment-map/components/ThematicSelectorBar';
import { CommodityKey, ThematicMetric } from '../../features/investment-map/types/thematic';
import { GisValidationResult } from '../../features/investment-map/types/gis';
import { loadAndValidateOromiaGeoJSON, getZoneFeatureById } from '../../features/investment-map/services/gisLoader';
import { Compass, ShieldCheck } from 'lucide-react';

const SUPPORTED_MAP_COMMODITIES: CommodityKey[] = ['coffee', 'wheat', 'maize'];
const SUPPORTED_METRICS: ThematicMetric[] = ['production', 'suitability', 'investment_potential'];

function parseCommodity(value: string | null): CommodityKey | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return SUPPORTED_MAP_COMMODITIES.includes(normalized as CommodityKey)
    ? (normalized as CommodityKey)
    : null;
}

function parseMetric(value: string | null): ThematicMetric {
  if (!value) return 'production';
  const normalized = value.trim().toLowerCase();
  return SUPPORTED_METRICS.includes(normalized as ThematicMetric)
    ? (normalized as ThematicMetric)
    : 'production';
}

export const PublicInvestmentMapShell: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const zoneParam = searchParams.get('zone');
  const commodityParam = searchParams.get('commodity');
  const metricParam = searchParams.get('metric');

  const [gisResult, setGisResult] = useState<GisValidationResult | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zoneParam);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityKey | null>(
    () => parseCommodity(commodityParam) ?? 'coffee'
  );
  const [selectedMetric, setSelectedMetric] = useState<ThematicMetric>(() =>
    parseMetric(metricParam)
  );

  // Sync selectedZoneId when URL search parameter changes
  useEffect(() => {
    if (zoneParam !== selectedZoneId) {
      setSelectedZoneId(zoneParam);
    }
  }, [zoneParam]);

  // Sync commodity / metric from URL (product deep-links)
  useEffect(() => {
    const nextCommodity = parseCommodity(commodityParam);
    if (nextCommodity && nextCommodity !== selectedCommodity) {
      setSelectedCommodity(nextCommodity);
    }
  }, [commodityParam]);

  useEffect(() => {
    const nextMetric = parseMetric(metricParam);
    if (nextMetric !== selectedMetric) {
      setSelectedMetric(nextMetric);
    }
  }, [metricParam]);

  const syncSearchParams = useCallback(
    (next: { zone?: string | null; commodity?: CommodityKey | null; metric?: ThematicMetric }) => {
      const params = new URLSearchParams(searchParams);
      const zone = next.zone !== undefined ? next.zone : selectedZoneId;
      const commodity =
        next.commodity !== undefined ? next.commodity : selectedCommodity;
      const metric = next.metric !== undefined ? next.metric : selectedMetric;

      if (zone) params.set('zone', zone);
      else params.delete('zone');

      if (commodity) params.set('commodity', commodity);
      else params.delete('commodity');

      if (metric) params.set('metric', metric);
      else params.delete('metric');

      setSearchParams(params, { replace: true });
    },
    [searchParams, selectedZoneId, selectedCommodity, selectedMetric, setSearchParams]
  );

  const handleGisVerified = useCallback((res: GisValidationResult) => {
    setGisResult(res);
  }, []);

  const handleSelectZone = useCallback(
    (zoneId: string | null) => {
      setSelectedZoneId(zoneId);
      syncSearchParams({ zone: zoneId });
    },
    [syncSearchParams]
  );

  const handleSelectCommodity = useCallback(
    (commodity: CommodityKey | null) => {
      setSelectedCommodity(commodity);
      syncSearchParams({ commodity });
    },
    [syncSearchParams]
  );

  const handleSelectMetric = useCallback(
    (metric: ThematicMetric) => {
      setSelectedMetric(metric);
      syncSearchParams({ metric });
    },
    [syncSearchParams]
  );

  const handleClearSelection = useCallback(() => {
    handleSelectZone(null);
  }, [handleSelectZone]);

  const selectedFeature = getZoneFeatureById(gisResult?.data, selectedZoneId);

  return (
    <div className="space-y-6">
      {/* MAP TITLE & SUBTITLE */}
      <div className="bg-white dark:bg-[#0E241B] rounded-3xl p-6 sm:p-8 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347622] dark:text-[#A3E635]">
            <Compass className="w-4 h-4 shrink-0" />
            <span>Interactive Oromia GIS Map Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063D2A] dark:text-white tracking-tight">
            Official Public Investment Map
          </h2>
          <p className="text-sm text-[#4E5E53] dark:text-emerald-100/80 leading-relaxed">
            Select any of Oromia's 22 administrative zones on the interactive map to inspect GIS candidate boundaries, commodity potentials, and zone identity details.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/40 text-xs font-semibold text-[#063D2A] dark:text-emerald-200 shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#347622] dark:text-[#A3E635]" />
          <span>Candidate GIS (22 Zones Verified)</span>
        </div>
      </div>

      {/* AGRICULTURAL POTENTIAL THEMATIC SELECTOR BAR */}
      <ThematicSelectorBar
        selectedCommodity={selectedCommodity}
        selectedMetric={selectedMetric}
        onSelectCommodity={handleSelectCommodity}
        onSelectMetric={handleSelectMetric}
        titleEyebrow="AGRICULTURAL POTENTIAL MAP"
      />

      {/* MAP & ZONE PROFILE PANEL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MAP CONTAINER (LEFT / TOP - 7 OR 8 COLS) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <UnifiedMapContainer
            height="620px"
            selectedZoneId={selectedZoneId}
            selectedCommodity={selectedCommodity}
            selectedMetric={selectedMetric}
            onSelectZone={handleSelectZone}
            onGisVerified={handleGisVerified}
            className="rounded-3xl overflow-hidden shadow-sm border border-[#063D2A]/10 dark:border-emerald-800/30"
          />
        </div>

        {/* ZONE PROFILE PANEL (RIGHT / BOTTOM - 5 OR 4 COLS) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <ZoneProfilePanel
            selectedFeature={selectedFeature}
            selectedCommodity={selectedCommodity}
            selectedMetric={selectedMetric}
            onClearSelection={handleClearSelection}
            isPublic={true}
          />
        </div>
      </div>
    </div>
  );
};
