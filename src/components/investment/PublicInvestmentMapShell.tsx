import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UnifiedMapContainer } from '../../features/investment-map/components/UnifiedMapContainer';
import { ZoneProfilePanel } from '../../features/investment-map/components/ZoneProfilePanel';
import { ThematicSelectorBar } from '../../features/investment-map/components/ThematicSelectorBar';
import { CommodityKey, ThematicMetric } from '../../features/investment-map/types/thematic';
import { GisValidationResult } from '../../features/investment-map/types/gis';
import { getZoneFeatureById } from '../../features/investment-map/services/gisLoader';
import {
  fetchPublicThematicDataset,
  PublicThematicDatasetResult,
} from '../../features/investment-map/services/publicThematicInvestmentService';
import {
  PublicInvestmentFacility,
  InfrastructureCategory,
} from '../../types/investment';
import { fetchPublicFacilities } from '../../services/investment/publicInfrastructureService';
import { InfrastructureFilterControls } from '../../features/investment-map/components/InfrastructureFilterControls';
import { PublicFacilityListPanel } from '../../features/investment-map/components/PublicFacilityListPanel';
import { FacilityDetailCard } from '../../features/investment-map/components/FacilityDetailCard';
import { Building2, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const zoneParam = searchParams.get('zone');
  const commodityParam = searchParams.get('commodity');
  const metricParam = searchParams.get('metric');
  const facilityParam = searchParams.get('facility');
  const infraParam = searchParams.get('infrastructure');
  const infraCategoryParam = searchParams.get('infraCategory');

  const [gisResult, setGisResult] = useState<GisValidationResult | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(zoneParam);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityKey | null>(
    () => parseCommodity(commodityParam) ?? 'coffee'
  );
  const [selectedMetric, setSelectedMetric] = useState<ThematicMetric>(() =>
    parseMetric(metricParam)
  );

  const [thematicResult, setThematicResult] = useState<PublicThematicDatasetResult | null>(null);
  const [isLoadingThematic, setIsLoadingThematic] = useState<boolean>(false);

  const [facilities, setFacilities] = useState<PublicInvestmentFacility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState<boolean>(true);
  const [infrastructureError, setInfrastructureError] = useState<string | null>(null);
  const [showInfrastructure, setShowInfrastructure] = useState<boolean>(
    () => (infraParam === '0' || infraParam === 'false' ? false : true)
  );
  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState<
    InfrastructureCategory | 'all'
  >(() => (infraCategoryParam as InfrastructureCategory) || 'all');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(facilityParam);
  const [activeSideTab, setActiveSideTab] = useState<'zone' | 'facilities'>('zone');

  useEffect(() => {
    let isCancelled = false;
    setIsLoadingFacilities(true);
    setInfrastructureError(null);

    fetchPublicFacilities()
      .then((data) => {
        if (!isCancelled) setFacilities(data);
      })
      .catch((err) => {
        console.error('[PublicInvestmentMapShell] Failed to load infrastructure facilities:', err);
        if (!isCancelled) {
          setInfrastructureError(
            t('investment_map_infra_error') ||
              'Infrastructure layer unavailable. Thematic zone data still works.'
          );
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingFacilities(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [t]);

  useEffect(() => {
    let isCancelled = false;
    if (!selectedCommodity) {
      setThematicResult(null);
      return;
    }

    setIsLoadingThematic(true);
    fetchPublicThematicDataset(selectedCommodity, selectedMetric)
      .then((result) => {
        if (!isCancelled) setThematicResult(result);
      })
      .catch((err) => {
        console.error('[PublicInvestmentMapShell] Failed to load thematic dataset:', err);
        if (!isCancelled) setThematicResult(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingThematic(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedCommodity, selectedMetric]);

  useEffect(() => {
    if (zoneParam !== selectedZoneId) setSelectedZoneId(zoneParam);
  }, [zoneParam]);

  useEffect(() => {
    if (facilityParam !== selectedFacilityId) {
      setSelectedFacilityId(facilityParam);
      if (facilityParam) setActiveSideTab('facilities');
    }
  }, [facilityParam]);

  useEffect(() => {
    const nextCommodity = parseCommodity(commodityParam);
    if (nextCommodity && nextCommodity !== selectedCommodity) {
      setSelectedCommodity(nextCommodity);
    }
  }, [commodityParam]);

  useEffect(() => {
    const nextMetric = parseMetric(metricParam);
    if (nextMetric !== selectedMetric) setSelectedMetric(nextMetric);
  }, [metricParam]);

  const syncSearchParams = useCallback(
    (next: {
      zone?: string | null;
      commodity?: CommodityKey | null;
      metric?: ThematicMetric;
      facility?: string | null;
      infrastructure?: boolean;
      infraCategory?: InfrastructureCategory | 'all';
    }) => {
      const params = new URLSearchParams(searchParams);
      const zone = next.zone !== undefined ? next.zone : selectedZoneId;
      const commodity =
        next.commodity !== undefined ? next.commodity : selectedCommodity;
      const metric = next.metric !== undefined ? next.metric : selectedMetric;
      const facility = next.facility !== undefined ? next.facility : selectedFacilityId;
      const infra = next.infrastructure !== undefined ? next.infrastructure : showInfrastructure;
      const infraCat =
        next.infraCategory !== undefined ? next.infraCategory : selectedFacilityCategory;

      if (zone) params.set('zone', zone);
      else params.delete('zone');

      if (commodity) params.set('commodity', commodity);
      else params.delete('commodity');

      if (metric) params.set('metric', metric);
      else params.delete('metric');

      if (facility) params.set('facility', facility);
      else params.delete('facility');

      if (!infra) params.set('infrastructure', '0');
      else params.delete('infrastructure');

      if (infraCat && infraCat !== 'all') params.set('infraCategory', infraCat);
      else params.delete('infraCategory');

      setSearchParams(params, { replace: true });
    },
    [
      searchParams,
      selectedZoneId,
      selectedCommodity,
      selectedMetric,
      selectedFacilityId,
      showInfrastructure,
      selectedFacilityCategory,
      setSearchParams,
    ]
  );

  const handleGisVerified = useCallback((res: GisValidationResult) => {
    setGisResult(res);
  }, []);

  const handleSelectZone = useCallback(
    (zoneId: string | null) => {
      setSelectedZoneId(zoneId);
      syncSearchParams({ zone: zoneId });
      if (zoneId) setActiveSideTab('zone');
    },
    [syncSearchParams]
  );

  const handleSelectFacility = useCallback(
    (facilityId: string | null) => {
      setSelectedFacilityId(facilityId);
      syncSearchParams({ facility: facilityId });
      if (facilityId) {
        setActiveSideTab('facilities');
        const matched = facilities.find((f) => f.facilityId === facilityId);
        if (matched && matched.zoneId && matched.zoneId !== selectedZoneId) {
          setSelectedZoneId(matched.zoneId);
          syncSearchParams({ zone: matched.zoneId, facility: facilityId });
        }
      }
    },
    [facilities, selectedZoneId, syncSearchParams]
  );

  const handleToggleShowInfrastructure = useCallback(
    (show: boolean) => {
      setShowInfrastructure(show);
      syncSearchParams({ infrastructure: show });
    },
    [syncSearchParams]
  );

  const handleSelectCategory = useCallback(
    (category: InfrastructureCategory | 'all') => {
      setSelectedFacilityCategory(category);
      let nextFacilityId = selectedFacilityId;
      if (selectedFacilityId && category !== 'all') {
        const curFac = facilities.find((f) => f.facilityId === selectedFacilityId);
        if (curFac && curFac.category !== category) {
          nextFacilityId = null;
          setSelectedFacilityId(null);
        }
      }
      syncSearchParams({ infraCategory: category, facility: nextFacilityId });
    },
    [facilities, selectedFacilityId, syncSearchParams]
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

  const selectedFacility = useMemo(() => {
    if (!selectedFacilityId) return null;
    return facilities.find((f) => f.facilityId === selectedFacilityId) || null;
  }, [facilities, selectedFacilityId]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Compact intro — no card chrome */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-1">
        <div className="max-w-2xl">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#063D2A] dark:text-white">
            {t('investment_map_shell_title') || 'Public investment map'}
          </h2>
          <p className="mt-1.5 text-sm text-[#4E5E53] dark:text-emerald-100/70 leading-relaxed">
            {t('investment_map_shell_desc') ||
              'Select a commodity and metric, then click a zone. Toggle facilities to see verified warehouses, cold storage, and processing sites.'}
          </p>
        </div>
        <p className="text-xs font-semibold text-[#5A6B61] dark:text-emerald-200/50 shrink-0 tabular-nums">
          {isLoadingFacilities
            ? t('investment_map_loading_facilities') || 'Loading facilities…'
            : `${facilities.length} ${t('investment_map_facilities_count') || 'verified facilities'}`}
        </p>
      </div>

      <ThematicSelectorBar
        selectedCommodity={selectedCommodity}
        selectedMetric={selectedMetric}
        onSelectCommodity={handleSelectCommodity}
        onSelectMetric={handleSelectMetric}
        titleEyebrow={t('investment_map_thematic_eyebrow') || 'COMMODITY LAYER'}
        isPublic
        isThematicActive={Boolean(selectedCommodity && thematicResult && !isLoadingThematic)}
      />

      {infrastructureError && (
        <p className="text-xs text-amber-800 dark:text-amber-200/90 border-l-2 border-amber-500 pl-3 py-1">
          {infrastructureError}
        </p>
      )}

      <InfrastructureFilterControls
        showInfrastructure={showInfrastructure}
        onToggleShowInfrastructure={handleToggleShowInfrastructure}
        selectedCategory={selectedFacilityCategory}
        onSelectCategory={handleSelectCategory}
        facilities={facilities}
        isLoading={isLoadingFacilities}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
        <div className="lg:col-span-8 xl:col-span-9">
          <UnifiedMapContainer
            height="min(72vh, 720px)"
            selectedZoneId={selectedZoneId}
            selectedCommodity={selectedCommodity}
            selectedMetric={selectedMetric}
            thematicResult={thematicResult}
            isLoadingThematic={isLoadingThematic}
            facilities={facilities}
            showInfrastructure={showInfrastructure}
            selectedFacilityId={selectedFacilityId}
            selectedCategory={selectedFacilityCategory}
            isLoadingFacilities={isLoadingFacilities}
            onSelectZone={handleSelectZone}
            onSelectFacility={handleSelectFacility}
            onGisVerified={handleGisVerified}
            allowDemoData={false}
            className="overflow-hidden border border-[#063D2A]/12 dark:border-emerald-800/30"
          />
        </div>

        <aside className="lg:col-span-4 xl:col-span-3 space-y-3 lg:sticky lg:top-36">
          <div
            className="flex border-b border-[#063D2A]/10 dark:border-emerald-900/40"
            role="tablist"
            aria-label="Map detail panels"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeSideTab === 'zone'}
              onClick={() => setActiveSideTab('zone')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors ${
                activeSideTab === 'zone'
                  ? 'text-[#063D2A] dark:text-[#A3E635] border-b-2 border-[#347622] dark:border-[#A3E635] -mb-px'
                  : 'text-[#5A6B61] dark:text-emerald-100/50 hover:text-[#063D2A] dark:hover:text-emerald-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {t('investment_map_panel_zone') || 'Zone'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSideTab === 'facilities'}
              onClick={() => setActiveSideTab('facilities')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors ${
                activeSideTab === 'facilities'
                  ? 'text-[#063D2A] dark:text-[#A3E635] border-b-2 border-[#347622] dark:border-[#A3E635] -mb-px'
                  : 'text-[#5A6B61] dark:text-emerald-100/50 hover:text-[#063D2A] dark:hover:text-emerald-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              {t('investment_map_panel_facilities') || 'Facilities'}
            </button>
          </div>

          {activeSideTab === 'zone' ? (
            <div className="space-y-3">
              <ZoneProfilePanel
                selectedFeature={selectedFeature}
                selectedCommodity={selectedCommodity}
                selectedMetric={selectedMetric}
                thematicResult={thematicResult}
                onClearSelection={handleClearSelection}
                isPublic={true}
              />
              {selectedFacility && (
                <FacilityDetailCard
                  facility={selectedFacility}
                  onClose={() => handleSelectFacility(null)}
                />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedFacility ? (
                <FacilityDetailCard
                  facility={selectedFacility}
                  onClose={() => handleSelectFacility(null)}
                />
              ) : null}
              <PublicFacilityListPanel
                facilities={facilities}
                selectedFacilityId={selectedFacilityId}
                onSelectFacility={handleSelectFacility}
                filterCategory={selectedFacilityCategory}
                filterZoneId={selectedZoneId}
                isLoading={isLoadingFacilities}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
