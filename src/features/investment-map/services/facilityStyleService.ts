import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style.js';
import { FeatureLike } from 'ol/Feature.js';
import { InfrastructureCategory, LocationPrecision } from '../../../types/investment';

export interface FacilityMarkerStyleOptions {
  isSelected: boolean;
  isHovered: boolean;
  isDark: boolean;
}

export const CATEGORY_COLORS: Record<InfrastructureCategory, { bg: string; border: string; label: string }> = {
  warehouse: { bg: '#2563eb', border: '#1d4ed8', label: 'Warehouse & Grain Storage' },
  cold_storage: { bg: '#0891b2', border: '#0e7490', label: 'Cold Storage & Chain' },
  processing: { bg: '#ea580c', border: '#c2410c', label: 'Agro-Processing Facility' },
  irrigation: { bg: '#0284c7', border: '#0369a1', label: 'Irrigation & Water Scheme' },
  collection_center: { bg: '#0d9488', border: '#0f766e', label: 'Aggregation & Collection' },
  market: { bg: '#16a34a', border: '#15803d', label: 'Primary Agricultural Market' },
  livestock_market: { bg: '#d97706', border: '#b45309', label: 'Livestock Trading Center' },
  laboratory: { bg: '#9333ea', border: '#7e22ce', label: 'Testing & Soil Laboratory' },
  veterinary: { bg: '#e11d48', border: '#be123c', label: 'Veterinary & Clinic Post' },
  input_distribution: { bg: '#65a30d', border: '#4d7c0f', label: 'Seed & Input Distribution' },
  road: { bg: '#4b5563', border: '#374151', label: 'Feeder Road & Transport' },
  electricity: { bg: '#ca8a04', border: '#a16207', label: 'Power & Rural Electrification' },
  logistics: { bg: '#4f46e5', border: '#4338ca', label: 'Logistics Hub & Freight' },
  other: { bg: '#64748b', border: '#475569', label: 'Other Infrastructure' },
};

export const CATEGORY_ICONS: Record<InfrastructureCategory, string> = {
  warehouse: '🏭',
  cold_storage: '❄️',
  processing: '⚙️',
  irrigation: '💧',
  collection_center: '📦',
  market: '🛒',
  livestock_market: '🐂',
  laboratory: '🔬',
  veterinary: '🩺',
  input_distribution: '🌱',
  road: '🛣️',
  electricity: '⚡',
  logistics: '🚚',
  other: '📍',
};

export function getFacilityColor(category: InfrastructureCategory): string {
  return (CATEGORY_COLORS[category] || CATEGORY_COLORS.other).bg;
}

export function getPrecisionLabel(precision: LocationPrecision): string {
  switch (precision) {
    case 'exact':
      return 'Exact Location (Cadastral / GIS)';
    case 'approximate':
      return 'Approximate Location (Survey)';
    case 'zone_centroid':
      return 'Zone-Level Centroid (Protected)';
    default:
      return 'Location';
  }
}

/**
 * Creates OpenLayers Style for an Infrastructure Facility Feature
 */
export function getFacilityFeatureStyle(
  feature: FeatureLike,
  options: FacilityMarkerStyleOptions
): Style[] {
  const category = (feature.get('category') as InfrastructureCategory) || 'other';
  const precision = (feature.get('locationPrecision') as LocationPrecision) || 'exact';
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;

  const { isSelected, isHovered, isDark } = options;

  const radius = isSelected ? 12 : isHovered ? 10 : 8;
  const strokeColor = isSelected
    ? '#f59e0b'
    : isDark
    ? '#ffffff'
    : '#1e293b';
  const strokeWidth = isSelected ? 3.5 : precision === 'approximate' ? 2 : 1.75;
  const lineDash = precision === 'approximate' ? [3, 3] : precision === 'zone_centroid' ? [4, 2] : undefined;

  // Primary circular marker style
  const primaryStyle = new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({
        color: colors.bg,
      }),
      stroke: new Stroke({
        color: strokeColor,
        width: strokeWidth,
        lineDash,
      }),
    }),
    zIndex: isSelected ? 100 : isHovered ? 80 : 50,
  });

  // Selected outer halo ring
  if (isSelected) {
    const haloStyle = new Style({
      image: new CircleStyle({
        radius: radius + 6,
        stroke: new Stroke({
          color: 'rgba(245, 158, 11, 0.45)',
          width: 6,
        }),
      }),
      zIndex: 90,
    });
    return [haloStyle, primaryStyle];
  }

  // Zone centroid precision marker: add an outer reference indicator ring
  if (precision === 'zone_centroid') {
    const zoneHalo = new Style({
      image: new CircleStyle({
        radius: radius + 4,
        stroke: new Stroke({
          color: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)',
          width: 1.5,
          lineDash: [2, 2],
        }),
      }),
      zIndex: 45,
    });
    return [zoneHalo, primaryStyle];
  }

  return [primaryStyle];
}
