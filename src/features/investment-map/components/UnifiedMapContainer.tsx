import React, { useState, useCallback } from 'react';
import { GisValidationResult } from '../types/gis';
import { CommodityKey, ThematicMetric } from '../types/thematic';
import { PublicThematicDatasetResult } from '../services/publicThematicInvestmentService';
import {
  PublicInvestmentFacility,
  InfrastructureCategory,
} from '../../../types/investment';
import { OpenLayersMapContainer } from './OpenLayersMapContainer';
import { SvgMapContainer } from './SvgMapContainer';
import { MapboxMapContainer } from './MapboxMapContainer';
import { Layers, MapPin, Sparkles, Globe2, AlertCircle } from 'lucide-react';

interface UnifiedMapContainerProps {
  height?: string;
  selectedZoneId?: string | null;
  selectedCommodity?: CommodityKey | null;
  selectedMetric?: ThematicMetric;
  thematicResult?: PublicThematicDatasetResult | null;
  isLoadingThematic?: boolean;
  facilities?: PublicInvestmentFacility[];
  showInfrastructure?: boolean;
  selectedFacilityId?: string | null;
  selectedCategory?: InfrastructureCategory | 'all';
  isLoadingFacilities?: boolean;
  onSelectZone?: (zoneId: string) => void;
  onSelectFacility?: (facilityId: string) => void;
  onGisVerified?: (result: GisValidationResult) => void;
  allowDemoData?: boolean;
  showEngineSelector?: boolean;
  /**
   * Which palette the engine toggle and banners wear.
   *
   * The public site and the admin area deliberately use different colours -
   * forest and lime out front, slate and emerald behind the login. This is one
   * component rendered in both, so the chrome has to follow the page it sits on
   * or it reads as pasted in from somewhere else.
   *
   * Only the chrome changes. The map itself is identical.
   */
  variant?: 'public' | 'admin';
  className?: string;
}

export const UnifiedMapContainer: React.FC<UnifiedMapContainerProps> = ({
  height = '650px',
  selectedZoneId,
  selectedCommodity,
  selectedMetric = 'production',
  thematicResult,
  isLoadingThematic = false,
  facilities = [],
  showInfrastructure = false,
  selectedFacilityId,
  selectedCategory = 'all',
  isLoadingFacilities = false,
  onSelectZone,
  onSelectFacility,
  onGisVerified,
  allowDemoData = false,
  showEngineSelector = false,
  variant = 'public',
  className = '',
}) => {
  // Primary GIS Renderer: 'openlayers' | Compatibility Fallback: 'svg'
  // Basemap Renderer: 'mapbox' — requires VITE_MAPBOX_TOKEN
  type MapEngine = 'openlayers' | 'svg' | 'mapbox';

  const isAdmin = variant === 'admin';

  const ui = isAdmin
    ? {
        bar: 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700',
        heading: 'text-slate-700 dark:text-slate-200',
        headingIcon: 'text-emerald-600 dark:text-emerald-400',
        active: 'bg-emerald-700 text-white shadow-xs',
        idle:
          'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700',
        disabled:
          'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed',
        badge:
          'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
      }
    : {
        bar: 'bg-[#F0F7EE] dark:bg-[#111613] border-[#E2EFE0] dark:border-white/10',
        heading: 'text-[#0A1912] dark:text-[#f5f6f3]',
        headingIcon: 'text-[#075B36] dark:text-[#A3E635]',
        active: 'bg-[#075B36] text-white shadow-xs',
        idle:
          'bg-white dark:bg-[#161d18] text-[#56635B] dark:text-[#a5aba6] hover:text-[#0A1912] dark:hover:text-white border border-[#E2EFE0] dark:border-white/10',
        disabled:
          'bg-[#F0F7EE] dark:bg-[#0D110F] text-[#9CA3AF] dark:text-gray-600 border border-[#E2EFE0] dark:border-white/5 cursor-not-allowed',
        badge: 'bg-[#A3E635]/25 text-[#0A1912] dark:bg-[#A3E635]/15 dark:text-[#A3E635]',
      };

  // Mapbox leads because it carries terrain and place-name context the other two
  // cannot, but it depends on an external token, so a failure hands back to
  // OpenLayers rather than leaving an empty frame.
  const mapboxAvailable = Boolean(import.meta.env?.VITE_MAPBOX_TOKEN);
  const [engine, setEngine] = useState<MapEngine>(mapboxAvailable ? 'mapbox' : 'openlayers');
  const [fallbackNotice, setFallbackNotice] = useState<boolean>(false);
  const [mapboxFailed, setMapboxFailed] = useState<boolean>(false);

  const handleOpenLayersError = useCallback(() => {
    setFallbackNotice(true);
    setEngine('svg');
  }, []);

  const handleMapboxError = useCallback(() => {
    setMapboxFailed(true);
    setEngine('openlayers');
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Map Engine Selector. Diagnostics only, when explicitly enabled. */}
      {showEngineSelector && (
        <div className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl border ${ui.bar}`}>
          <div className={`flex items-center gap-2 text-xs font-extrabold ${ui.heading}`}>
            <Layers className={`w-4 h-4 shrink-0 ${ui.headingIcon}`} />
            <span>GIS Map Rendering Engine:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEngine('mapbox')}
              disabled={!mapboxAvailable}
              title={
                mapboxAvailable
                  ? 'Satellite-grade basemap with terrain and place names'
                  : 'Set VITE_MAPBOX_TOKEN to enable the Mapbox engine'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                !mapboxAvailable
                  ? ui.disabled
                  : engine === 'mapbox'
                  ? `${ui.active} cursor-pointer`
                  : `${ui.idle} cursor-pointer`
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Mapbox (Basemap Engine)</span>
            </button>

            <button
              onClick={() => setEngine('openlayers')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                engine === 'openlayers' ? ui.active : ui.idle
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>OpenLayers (Primary GIS Engine)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${ui.badge}`}>
                Primary
              </span>
            </button>

            <button
              onClick={() => setEngine('svg')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                engine === 'svg' ? ui.active : ui.idle
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vector SVG (Compatibility Mode)</span>
            </button>
          </div>
        </div>
      )}

      {/* Fallback Notification Banner */}
      {fallbackNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-2xl p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>OpenLayers map unavailable. Compatibility map activated.</span>
          </div>
          <button
            onClick={() => setFallbackNotice(false)}
            className="text-amber-700 dark:text-amber-400 hover:underline font-bold text-[11px] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mapbox Failure Notification Banner */}
      {mapboxFailed && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-2xl p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Mapbox basemap unavailable. OpenLayers engine activated.</span>
          </div>
          <button
            onClick={() => setMapboxFailed(false)}
            className="text-amber-700 dark:text-amber-400 hover:underline font-bold text-[11px] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Render Selected Map Engine */}
      {engine === 'mapbox' ? (
        <MapboxMapContainer
          height={height}
          selectedZoneId={selectedZoneId}
          selectedCommodity={selectedCommodity}
          selectedMetric={selectedMetric}
          onSelectZone={onSelectZone}
          onGisVerified={onGisVerified}
          onError={handleMapboxError}
        />
      ) : engine === 'openlayers' ? (
        <OpenLayersMapContainer
          height={height}
          selectedZoneId={selectedZoneId}
          selectedCommodity={selectedCommodity}
          selectedMetric={selectedMetric}
          thematicResult={thematicResult}
          isLoadingThematic={isLoadingThematic}
          facilities={facilities}
          showInfrastructure={showInfrastructure}
          selectedFacilityId={selectedFacilityId}
          selectedCategory={selectedCategory}
          isLoadingFacilities={isLoadingFacilities}
          onSelectZone={onSelectZone}
          onSelectFacility={onSelectFacility}
          onGisVerified={onGisVerified}
          onError={handleOpenLayersError}
          allowDemoData={allowDemoData}
        />
      ) : (
        <SvgMapContainer
          height={height}
          selectedZoneId={selectedZoneId}
          selectedCommodity={selectedCommodity}
          selectedMetric={selectedMetric}
          thematicResult={thematicResult}
          onSelectZone={onSelectZone}
          onGisVerified={onGisVerified}
          allowDemoData={allowDemoData}
        />
      )}
    </div>
  );
};

