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
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#EFF8F2] dark:bg-[#12281D] p-2 rounded-2xl border border-[#DDE8E1] dark:border-emerald-900/60">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#063D2A] dark:text-emerald-100">
          <Layers className="w-4 h-4 text-[#087A4B] dark:text-[#A3E635] shrink-0" />
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
                ? 'bg-[#F6F7F3] dark:bg-[#0F1F17] text-[#9AA69F] dark:text-emerald-300/30 border border-[#DDE8E1] dark:border-emerald-900/40 cursor-not-allowed'
                : engine === 'mapbox'
                ? 'bg-[#087A4B] text-white shadow-xs cursor-pointer'
                : 'bg-white dark:bg-[#183627] text-[#637069] dark:text-emerald-300/80 hover:text-[#063D2A] dark:hover:text-white border border-[#DDE8E1] dark:border-emerald-800/60 cursor-pointer'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Mapbox (Basemap Engine)</span>
          </button>

          <button
            onClick={() => setEngine('openlayers')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              engine === 'openlayers'
                ? 'bg-[#087A4B] text-white shadow-xs'
                : 'bg-white dark:bg-[#183627] text-[#637069] dark:text-emerald-300/80 hover:text-[#063D2A] dark:hover:text-white border border-[#DDE8E1] dark:border-emerald-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>OpenLayers (Primary GIS Engine)</span>
            <span className="bg-[#A3E635]/25 text-[#063D2A] dark:bg-[#A3E635]/15 dark:text-[#A3E635] text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
              Primary
            </span>
          </button>

          <button
            onClick={() => setEngine('svg')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              engine === 'svg'
                ? 'bg-[#087A4B] text-white shadow-xs'
                : 'bg-white dark:bg-[#183627] text-[#637069] dark:text-emerald-300/80 hover:text-[#063D2A] dark:hover:text-white border border-[#DDE8E1] dark:border-emerald-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vector SVG (Compatibility Mode)</span>
          </button>
        </div>
      </div>

      {/* Fallback Notification Banner */}
      {fallbackNotice && (
        <div className="bg-[#D7A928]/10 border border-[#D7A928]/40 text-[#7A5B0B] dark:text-[#D7A928] rounded-2xl p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D7A928] shrink-0" />
            <span>OpenLayers map unavailable. Compatibility map activated.</span>
          </div>
          <button
            onClick={() => setFallbackNotice(false)}
            className="text-[#7A5B0B] dark:text-[#D7A928] hover:underline font-bold text-[11px] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mapbox Failure Notification Banner */}
      {mapboxFailed && (
        <div className="bg-[#D7A928]/10 border border-[#D7A928]/40 text-[#7A5B0B] dark:text-[#D7A928] rounded-2xl p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D7A928] shrink-0" />
            <span>Mapbox basemap unavailable. OpenLayers engine activated.</span>
          </div>
          <button
            onClick={() => setMapboxFailed(false)}
            className="text-[#7A5B0B] dark:text-[#D7A928] hover:underline font-bold text-[11px] shrink-0"
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
