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
import { Layers, MapPin, Sparkles, AlertCircle } from 'lucide-react';

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
  className = '',
}) => {
  // Primary GIS Renderer: 'openlayers' | Compatibility Fallback: 'svg'
  const [engine, setEngine] = useState<'openlayers' | 'svg'>('openlayers');
  const [fallbackNotice, setFallbackNotice] = useState<boolean>(false);

  const handleOpenLayersError = useCallback(() => {
    setFallbackNotice(true);
    setEngine('svg');
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Map Engine Selector Header Controls (Diagnostics only when explicitly enabled) */}
      {showEngineSelector && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>GIS Map Rendering Engine:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEngine('openlayers')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                engine === 'openlayers'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>OpenLayers (Primary GIS Engine)</span>
              <span className="bg-emerald-500/30 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded font-mono font-medium">
                Primary
              </span>
            </button>

            <button
              onClick={() => setEngine('svg')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                engine === 'svg'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
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
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-xl p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>OpenLayers map unavailable. Compatibility map activated.</span>
          </div>
          <button
            onClick={() => setFallbackNotice(false)}
            className="text-amber-700 dark:text-amber-400 hover:underline font-semibold text-[11px] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Render Selected Map Engine */}
      {engine === 'openlayers' ? (
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

