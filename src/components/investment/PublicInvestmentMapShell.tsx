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
import { Compass, ShieldCheck, Building2, MapPin } from 'lucide-react';

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

  // Real verified published thematic dataset state
  const [thematicResult, setThematicResult] = useState<PublicThematicDatasetResult | null>(null);
  const [isLoadingThematic, setIsLoadingThematic] = useState<boolean>(false);

  // Public Infrastructure Facilities State
  const [facilities, setFacilities] = useState<PublicInvestmentFacility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState<boolean>(true);
  const [infrastructureError, setInfrastructureError] = useState<string | null>(null);
  const [showInfrastructure, setShowInfrastructure] = useState<boolean>(
    () => (infraParam === '0' || infraParam === 'false' ? false : true)
  );
  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState<InfrastructureCategory | 'all'>(
    () => (infraCategoryParam as InfrastructureCategory) || 'all'
  );
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(facilityParam);
  const [activeSideTab, setActiveSideTab] = useState<'zone' | 'facilities'>('zone');

  // Load published facilities from authoritative public service
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingFacilities(true);
    setInfrastructureError(null);

    fetchPublicFacilities()
      .then((data) => {
        if (!isCancelled) {
          setFacilities(data);
        }
      })
      .catch((err) => {
        console.error('[PublicInvestmentMapShell] Failed to load infrastructure facilities:', err);
        if (!isCancelled) {
          setInfrastructureError('Unable to load infrastructure facilities. Thematic map data remains available.');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingFacilities(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Load published thematic dataset whenever commodity or metric changes
  useEffect(() => {
    let isCancelled = false;
    if (!selectedCommodity) {
      setThematicResult(null);
      return;
    }

    setIsLoadingThematic(true);
    fetchPublicThematicDataset(selectedCommodity, selectedMetric)
      .then((result) => {
        if (!isCancelled) {
          setThematicResult(result);
        }
      })
      .catch((err) => {
        console.error('[PublicInvestmentMapShell] Failed to load thematic dataset:', err);
        if (!isCancelled) {
          setThematicResult(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingThematic(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedCommodity, selectedMetric]);

  // Sync selectedZoneId when URL search parameter changes
  useEffect(() => {
    if (zoneParam !== selectedZoneId) {
      setSelectedZoneId(zoneParam);
    }
  }, [zoneParam]);

  // Sync selectedFacilityId from URL
  useEffect(() => {
    if (facilityParam !== selectedFacilityId) {
      setSelectedFacilityId(facilityParam);
      if (facilityParam) {
        setActiveSideTab('facilities');
      }
    }
  }, [facilityParam]);

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
      const infraCat = next.infraCategory !== undefined ? next.infraCategory : selectedFacilityCategory;

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
    [searchParams, selectedZoneId, selectedCommodity, selectedMetric, selectedFacilityId, showInfrastructure, selectedFacilityCategory, setSearchParams]
  );

  const handleGisVerified = useCallback((res: GisValidationResult) => {
    setGisResult(res);
  }, []);

  const handleSelectZone = useCallback(
    (zoneId: string | null) => {
      setSelectedZoneId(zoneId);
      syncSearchParams({ zone: zoneId });
      if (zoneId) {
        setActiveSideTab('zone');
      }
    },
    [syncSearchParams]
  );

  const handleSelectFacility = useCallback(
    (facilityId: string | null) => {
      setSelectedFacilityId(facilityId);
      syncSearchParams({ facility: facilityId });
      if (facilityId) {
        setActiveSideTab('facilities');
        // Auto-select the zone containing the facility if not already set
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
      // Clear facility selection if the currently selected facility is no longer eligible under the new category
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

  // Selected Facility DTO
  const selectedFacility = useMemo(() => {
    if (!selectedFacilityId) return null;
    return facilities.find((f) => f.facilityId === selectedFacilityId) || null;
  }, [facilities, selectedFacilityId]);

  return (
    <div className="space-y-6">
      {/* MAP TITLE & SUBTITLE */}
      <div className="bg-white dark:bg-[#0E241B] rounded-3xl p-6 sm:p-8 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347622] dark:text-[#A3E635]">
            <Compass className="w-4 h-4 shrink-0" />
            <span>Interactive Oromia GIS & Infrastructure Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063D2A] dark:text-white tracking-tight">
            Official Public Investment Map
          </h2>
          <p className="text-sm text-[#4E5E53] dark:text-emerald-100/80 leading-relaxed">
            Explore Oromia's 22 administrative zones, verified agricultural commodity production zones, and verified infrastructure facilities (agro-industrial parks, warehouses, power substations, dry ports, and irrigation networks).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#FAF9F5] dark:bg-[#081811] border border-[#063D2A]/10 dark:border-emerald-800/40 text-xs font-semibold text-[#063D2A] dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-[#347622] dark:text-[#A3E635]" />
            <span>Official GIS (22 Administrative Zones)</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40 text-xs font-semibold text-blue-800 dark:text-blue-200">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{facilities.length} Verified Facilities</span>
          </div>
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

      {/* INFRASTRUCTURE ERROR ALERT (IF ANY) */}
      {infrastructureError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
          <span>{infrastructureError}</span>
        </div>
      )}

      {/* INFRASTRUCTURE CONTROLS BAR */}
      <InfrastructureFilterControls
        showInfrastructure={showInfrastructure}
        onToggleShowInfrastructure={handleToggleShowInfrastructure}
        selectedCategory={selectedFacilityCategory}
        onSelectCategory={handleSelectCategory}
        facilities={facilities}
        isLoading={isLoadingFacilities}
      />

      {/* MAP & SIDE PANEL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MAP CONTAINER (LEFT / TOP - 7 OR 8 COLS) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <UnifiedMapContainer
            height="640px"
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
            className="rounded-3xl overflow-hidden shadow-sm border border-[#063D2A]/10 dark:border-emerald-800/30"
          />
        </div>

        {/* SIDE PANELS (RIGHT / BOTTOM - 5 OR 4 COLS) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Side Tab Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveSideTab('zone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSideTab === 'zone'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Zone Profile {selectedZoneId ? `(${selectedZoneId})` : ''}</span>
            </button>
            <button
              onClick={() => setActiveSideTab('facilities')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSideTab === 'facilities'
                  ? 'bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Facilities ({facilities.length})</span>
            </button>
          </div>

          {/* Active Tab View */}
          {activeSideTab === 'zone' ? (
            <div className="space-y-4">
              <ZoneProfilePanel
                selectedFeature={selectedFeature}
                selectedCommodity={selectedCommodity}
                selectedMetric={selectedMetric}
                thematicResult={thematicResult}
                onClearSelection={handleClearSelection}
                isPublic={true}
              />

              {/* Quick Facility Card under Zone if a facility is selected in this zone */}
              {selectedFacility && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Selected Facility in this Zone
                  </div>
                  <FacilityDetailCard
                    facility={selectedFacility}
                    onClose={() => handleSelectFacility(null)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
};

