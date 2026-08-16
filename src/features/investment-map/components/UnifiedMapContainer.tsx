import React, { useState, useCallback } from 'react';
import { GisValidationResult } from '../types/gis';
import { CommodityKey, ThematicMetric } from '../types/thematic';
import { OpenLayersMapContainer } from './OpenLayersMapContainer';
import { SvgMapContainer } from './SvgMapContainer';
import { MapboxMapContainer } from './MapboxMapContainer';
import { Layers, MapPin, Sparkles, Globe2, AlertCircle } from 'lucide-react';

interface UnifiedMapContainerProps {
  height?: string;
  selectedZoneId?: string | null;
  selectedCommodity?: CommodityKey | null;
  selectedMetric?: ThematicMetric;
  onSelectZone?: (zoneId: string | null) => void;
  onGisVerified?: (result: GisValidationResult) => void;
  className?: string;
}

export const UnifiedMapContainer: React.FC<UnifiedMapContainerProps> = ({
  height = '650px',
  selectedZoneId,
  selectedCommodity,
  selectedMetric = 'production',
  onSelectZone,
  onGisVerified,
  className = '',
}) => {
  // Primary GIS Renderer: 'openlayers' | Compatibility Fallback: 'svg'
  // Basemap Renderer: 'mapbox' — requires VITE_MAPBOX_TOKEN
  type MapEngine = 'openlayers' | 'svg' | 'mapbox';

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
      {/* Map Engine Selector Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F0F7EE] dark:bg-[#111613] p-2 rounded-2xl border border-[#E2EFE0] dark:border-white/10">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#0A1912] dark:text-[#f5f6f3]">
          <Layers className="w-4 h-4 text-[#075B36] dark:text-[#A3E635] shrink-0" />
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
                ? 'bg-[#F0F7EE] dark:bg-[#0D110F] text-[#9CA3AF] dark:text-gray-600 border border-[#E2EFE0] dark:border-white/5 cursor-not-allowed'
                : engine === 'mapbox'
                ? 'bg-[#075B36] text-white shadow-xs cursor-pointer'
                : 'bg-white dark:bg-[#161d18] text-[#56635B] dark:text-[#a5aba6] hover:text-[#0A1912] dark:hover:text-white border border-[#E2EFE0] dark:border-white/10 cursor-pointer'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Mapbox (Basemap Engine)</span>
          </button>

          <button
            onClick={() => setEngine('openlayers')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              engine === 'openlayers'
                ? 'bg-[#075B36] text-white shadow-xs'
                : 'bg-white dark:bg-[#161d18] text-[#56635B] dark:text-[#a5aba6] hover:text-[#0A1912] dark:hover:text-white border border-[#E2EFE0] dark:border-white/10'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>OpenLayers (Primary GIS Engine)</span>
            <span className="bg-[#A3E635]/25 text-[#0A1912] dark:bg-[#A3E635]/15 dark:text-[#A3E635] text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
              Primary
            </span>
          </button>

          <button
            onClick={() => setEngine('svg')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              engine === 'svg'
                ? 'bg-[#075B36] text-white shadow-xs'
                : 'bg-white dark:bg-[#161d18] text-[#56635B] dark:text-[#a5aba6] hover:text-[#0A1912] dark:hover:text-white border border-[#E2EFE0] dark:border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vector SVG (Compatibility Mode)</span>
          </button>
        </div>
      </div>

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
          onSelectZone={onSelectZone}
          onGisVerified={onGisVerified}
          onError={handleOpenLayersError}
        />
      ) : (
        <SvgMapContainer
          height={height}
          selectedZoneId={selectedZoneId}
          selectedCommodity={selectedCommodity}
          selectedMetric={selectedMetric}
          onSelectZone={onSelectZone}
          onGisVerified={onGisVerified}
        />
      )}
    </div>
  );
};
