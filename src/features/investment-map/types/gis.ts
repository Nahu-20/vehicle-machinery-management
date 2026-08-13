export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
}

export interface MapInitError {
  message: string;
  code?: string;
}

export interface OromiaZoneProperties {
  zone_id: string;
  prototype_id: string;
  pcode: string;
  name_en: string;
  name_om: string;
  name_am: string;
  name_om_verification: 'verified' | 'pending_bureau_signoff';
  name_am_verification: 'verified' | 'pending_bureau_signoff';
  source_dataset_id: string;
  source_organization: string;
  admin_level: string;
  area_sqkm?: number;
  valid_on?: string;
}

export interface OromiaZoneFeature {
  type: 'Feature';
  id: string;
  properties: OromiaZoneProperties;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface OromiaGeoJSONCollection {
  type: 'FeatureCollection';
  name: string;
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: OromiaZoneFeature[];
}

export interface GisValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  featureCount: number;
  uniqueZoneIdsCount: number;
  uniquePcodesCount: number;
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  data?: OromiaGeoJSONCollection;
}

export interface GisMetadata {
  datasetId: string;
  datasetTitle: string;
  version: string;
  boundaryReferenceDate: string;
  sourceOrganization: string;
  licenseTitle: string;
  runtimeChecksum: string;
  attribution: string;
  disclaimer: string;
  caveat: string;
}
