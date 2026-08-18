import { CanonicalZoneId, CANONICAL_ZONE_IDS, isCanonicalZoneId } from '../features/investment-map/constants/canonicalZones';
import { StaffRole } from './auth';

export type { CanonicalZoneId };

// ---------------------------------------------------------------------------
// Legacy M6A Prototype Compatibility Types
// ---------------------------------------------------------------------------

export interface InvestmentOpportunityFeature {
  id: string;
  type: string;
  titleKey: string;
  descriptionKey: string;
  ctaKey: string;
  iconName: string;
  route: string;
  isPrimaryMap?: boolean;
  badgeKey?: string;
}

export interface InvestmentZonePotential {
  id: string;
  zoneName: string;
  oromoName?: string;
  amharicName?: string;
  suitableCrops?: string[];
  majorCrops?: string[];
  infrastructureRating?: string;
  waterAvailability?: string;
  labourAvailability?: string;
  investmentScore?: number;
  color?: string;
  svgPath?: string;
  labelX?: number;
  labelY?: number;
  agroZone?: string;
  annualProduction?: string;
  irrigationAccess?: string;
  keyProjects?: string[];
  investmentOpportunities?: string[];
  verifiedNotice?: string;
}

export interface InvestmentValidationResult {
  valid: boolean;
  errors: string[];
}

export type ValidationResult = InvestmentValidationResult;

// ---------------------------------------------------------------------------
// Core Statuses & Enums
// ---------------------------------------------------------------------------

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type LifecycleStatus = 'draft' | 'review' | 'published' | 'unpublished' | 'archived';
export type InvestmentLifecycleStatus = LifecycleStatus;

export type DatasetCategory =
  | 'production'
  | 'suitability'
  | 'investment-potential'
  | 'investment_potential'
  | 'infrastructure'
  | 'climate'
  | 'irrigation'
  | 'market'
  | 'livestock'
  | 'horticulture';

export type CommodityKey = 'coffee' | 'wheat' | 'maize' | (string & {});

export type DatasetUnit = 'tonne' | 'kg' | 'quintal' | 'hectare' | 'percent' | 'score' | 'count' | (string & {});

export type ReferencePeriodType = 'year' | 'season' | 'fiscal_year' | 'multi_year';

export interface ReferencePeriod {
  type: ReferencePeriodType;
  label: string; // e.g. "2024/2025" or "Meher 2024"
  startYear: number;
  endYear?: number;
  seasonName?: string;
}

export interface MultilingualString {
  en: string;
  om?: string;
  am?: string;
}

// ---------------------------------------------------------------------------
// Domain Entity 1: Zone Profile (investmentZoneProfiles/{zoneId})
// ---------------------------------------------------------------------------

export interface InvestmentZoneProfile {
  zoneId: CanonicalZoneId;
  overview: MultilingualString;
  featuredCommodities: CommodityKey[];
  infrastructureSummary?: MultilingualString;
  opportunitySummary?: MultilingualString;
  responsibleOffice: string;
  verificationStatus: VerificationStatus;
  status: LifecycleStatus;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string | null;
  publishedBy?: string | null;
  archivedAt?: string | null;
  archivedBy?: string | null;
}

// ---------------------------------------------------------------------------
// Domain Entity 2: Dataset Metadata (investmentDatasets/{datasetId})
// ---------------------------------------------------------------------------

export interface InvestmentDataset {
  datasetId: string;
  title: string;
  category: DatasetCategory;
  commodity: CommodityKey;
  metric: string; // 'production' | 'suitability' | 'investment_potential' | string
  unit: DatasetUnit;
  referencePeriod: ReferencePeriod;
  referenceYear?: number;
  sourceIds: string[]; // Minimum 1 source ID required for publication
  methodologyId?: string; // Required for suitability and investment-potential
  description?: string;
  notes?: string;
  verificationStatus: VerificationStatus;
  lifecycleStatus: LifecycleStatus;
  isCurrent: boolean; // Indicates current primary dataset for commodity/metric pair
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string | null;
  publishedBy?: string | null;
  archivedAt?: string | null;
  archivedBy?: string | null;
}

// ---------------------------------------------------------------------------
// Domain Entity 3: Dataset Value (investmentDatasets/{datasetId}/values/{zoneId})
// ---------------------------------------------------------------------------

export interface InvestmentZoneValue {
  zoneId: CanonicalZoneId;
  value: number | null; // Null/undefined signifies unmeasured; 0 is valid numeric zero
  productionVolume?: number | null;
  productionUnit?: string;
  harvestedAreaHa?: number | null;
  yieldValue?: number | null;
  yieldUnit?: string;
  trendPercent?: number | null;
  notes?: string;
  qualityFlag: 'measured' | 'estimated' | 'projected' | 'unverified';
  version: number;
  updatedAt: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// Domain Entity 4: Source (investmentSources/{sourceId})
// ---------------------------------------------------------------------------

export interface InvestmentSource {
  sourceId: string;
  title: string;
  organization: string;
  documentTitle?: string;
  publicationDate?: string;
  referencePeriod?: string;
  url?: string;
  fileReference?: string;
  methodologyNotes?: string;
  contactInfo?: string;
  license?: string;
  verificationStatus: VerificationStatus;
  status: LifecycleStatus;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// Domain Entity 5: Methodology (investmentMethodologies/{methodologyId})
// ---------------------------------------------------------------------------

export interface InvestmentMethodologyComponent {
  name: string;
  weight?: number;
  description?: string;
}

export interface InvestmentMethodology {
  methodologyId: string;
  title: string;
  description: string;
  versionLabel: string;
  components: InvestmentMethodologyComponent[];
  weights?: Record<string, number>;
  calculationNotes?: string;
  limitations?: string;
  sourceIds: string[];
  verificationStatus: VerificationStatus;
  status: LifecycleStatus;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// Domain Entity 6: Opportunity (investmentOpportunities/{opportunityId})
// ---------------------------------------------------------------------------

export interface InvestmentOpportunityRange {
  minUsd?: number;
  maxUsd?: number;
  notes?: string;
}

export interface InvestmentOpportunityLandInfo {
  totalHa?: number;
  tenureType?: string;
  notes?: string;
}

export interface InvestmentOpportunity {
  opportunityId: string;
  title: string;
  slug: string;
  zoneIds: CanonicalZoneId[];
  commodityKeys: CommodityKey[];
  opportunityType: string;
  summary: string;
  description: string;
  estimatedInvestmentRange?: InvestmentOpportunityRange; // Only populated if verified
  landInformation?: InvestmentOpportunityLandInfo; // Only populated if verified
  responsibleOffice: string;
  contactIds?: string[];
  sourceIds: string[];
  verificationStatus: VerificationStatus;
  lifecycleStatus: LifecycleStatus;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string | null;
  publishedBy?: string | null;
}

// ---------------------------------------------------------------------------
// Domain Entity 7: Infrastructure (investmentInfrastructure/{recordId})
// ---------------------------------------------------------------------------

export type InfrastructureCategory =
  | 'road'
  | 'electricity'
  | 'irrigation'
  | 'warehouse'
  | 'cold_storage'
  | 'processing'
  | 'collection_center'
  | 'market'
  | 'livestock_market'
  | 'laboratory'
  | 'veterinary'
  | 'input_distribution'
  | 'logistics'
  | 'other';

export type FacilityOperationalStatus =
  | 'operational'
  | 'under_construction'
  | 'planned'
  | 'temporarily_closed'
  | 'inactive';

export type FacilityOwnership =
  | 'government'
  | 'cooperative'
  | 'private'
  | 'ppp'
  | 'ngo_development_partner'
  | 'other';

export type InfrastructureUnit =
  | 'MT'
  | 'tonnes'
  | 'tonnes_per_day'
  | 'm3'
  | 'hectares'
  | 'MW'
  | 'kW'
  | 'km'
  | 'count'
  | 'percent';

export interface FacilityCapacity {
  metricKey: string;
  label?: MultilingualString;
  numericValue: number | null;
  unit: InfrastructureUnit | null;
  referencePeriod?: string | null;
}

export type CapacityMetric = FacilityCapacity;

export type LocationPrecision = 'exact' | 'approximate' | 'zone_centroid';

export interface InvestmentFacility {
  facilityId: string;
  zoneId: CanonicalZoneId;
  category: InfrastructureCategory;
  title: MultilingualString;
  description?: MultilingualString;
  locationDescription?: MultilingualString;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  locationPrecision: LocationPrecision;
  operationalStatus: FacilityOperationalStatus;
  ownership?: FacilityOwnership;
  operatorName?: string;
  capacities: FacilityCapacity[];
  commodityKeys?: CommodityKey[];
  commissioningYear?: number | null;
  assessmentDate?: string | null;
  referencePeriod?: string | null;
  sourceIds: string[];
  lifecycleStatus: InvestmentLifecycleStatus;
  verificationStatus: VerificationStatus;
  internalNotes?: string;
  rejectionReason?: string;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  submittedForReviewAt?: string;
  submittedForReviewBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  publishedAt?: string;
  publishedBy?: string;
}

// Backward compatibility alias for legacy code
export type InvestmentInfrastructure = InvestmentFacility;

export function normalizeInfrastructureCategory(rawCategory: string): InfrastructureCategory {
  if (rawCategory === 'cold-storage') {
    return 'cold_storage';
  }
  const validCategories: InfrastructureCategory[] = [
    'road',
    'electricity',
    'irrigation',
    'warehouse',
    'cold_storage',
    'processing',
    'collection_center',
    'market',
    'livestock_market',
    'laboratory',
    'veterinary',
    'input_distribution',
    'logistics',
    'other',
  ];
  if (validCategories.includes(rawCategory as InfrastructureCategory)) {
    return rawCategory as InfrastructureCategory;
  }
  return 'other';
}

// ---------------------------------------------------------------------------
// Domain Entity 8: Map Config (investmentMapConfig/default)
// ---------------------------------------------------------------------------

export interface InvestmentMapConfig {
  id: 'default';
  defaultCommodity: CommodityKey;
  defaultMetric: string;
  featuredCommodities: CommodityKey[];
  enabledDatasets: string[];
  currentDatasetIds: Record<string, string>; // e.g., "coffee:production" -> "ds_coffee_prod_2025"
  publicLayerConfig?: Record<string, unknown>;
  version: number;
  status: LifecycleStatus;
  updatedAt: string;
  updatedBy: string;
}

// ---------------------------------------------------------------------------
// Domain Entity 9: Audit Log (investmentAuditLogs/{logId})
// ---------------------------------------------------------------------------

export interface InvestmentAuditLog {
  id: string;
  actorUid: string;
  actorRole: StaffRole;
  actorEmail: string;
  entityType:
    | 'zoneProfile'
    | 'dataset'
    | 'datasetValue'
    | 'source'
    | 'methodology'
    | 'opportunity'
    | 'infrastructure'
    | 'mapConfig';
  entityId: string;
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'publish'
    | 'unpublish'
    | 'verify'
    | 'reject'
    | 'archive';
  previousVersion?: number;
  newVersion?: number;
  changedFields?: string[];
  summary: string;
  timestamp: string;
  requestId?: string;
}

// ---------------------------------------------------------------------------
// Sanitized Public DTOs
// ---------------------------------------------------------------------------

export interface PublicInvestmentZoneProfile {
  zoneId: CanonicalZoneId;
  overview: MultilingualString;
  featuredCommodities: CommodityKey[];
  infrastructureSummary?: MultilingualString;
  opportunitySummary?: MultilingualString;
  responsibleOffice: string;
  verificationStatus: 'verified';
  publishedAt: string;
}

export interface PublicInvestmentDataset {
  datasetId: string;
  title: string;
  category: DatasetCategory;
  commodity: CommodityKey;
  metric: string;
  unit: DatasetUnit;
  referencePeriod: ReferencePeriod;
  sourceIds: string[];
  methodologyId?: string;
  publishedAt: string;
}

export interface PublicInvestmentZoneValue {
  zoneId: CanonicalZoneId;
  value: number | null;
  productionVolume?: number | null;
  productionUnit?: string;
  harvestedAreaHa?: number | null;
  yieldValue?: number | null;
  yieldUnit?: string;
  trendPercent?: number | null;
  qualityFlag: string;
  regionalRank: number | null; // Derived dynamically
  regionalSharePercent: number | null; // Derived dynamically
}

export interface PublicInvestmentSource {
  sourceId: string;
  title: string;
  organization: string;
  documentTitle?: string;
  publicationDate?: string;
  url?: string;
  license?: string;
}

export interface PublicInvestmentOpportunity {
  opportunityId: string;
  title: string;
  slug: string;
  zoneIds: CanonicalZoneId[];
  commodityKeys: CommodityKey[];
  opportunityType: string;
  summary: string;
  description: string;
  estimatedInvestmentRange?: InvestmentOpportunityRange;
  landInformation?: InvestmentOpportunityLandInfo;
  responsibleOffice: string;
  publishedAt: string;
}

export interface PublicInvestmentFacility {
  facilityId: string;
  zoneId: CanonicalZoneId;
  category: InfrastructureCategory;
  title: MultilingualString;
  description?: MultilingualString;
  locationDescription?: MultilingualString;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  locationPrecision: LocationPrecision;
  operationalStatus: FacilityOperationalStatus;
  ownership?: FacilityOwnership;
  operatorName?: string;
  capacities: FacilityCapacity[];
  commodityKeys?: CommodityKey[];
  commissioningYear?: number | null;
  assessmentDate?: string | null;
  referencePeriod?: string | null;
  sourceIds: string[];
  publishedAt: string;
}

export interface PublicInvestmentMapConfig {
  defaultCommodity: CommodityKey;
  defaultMetric: string;
  featuredCommodities: CommodityKey[];
  currentDatasetIds: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Validation & DTO Helper Functions
// ---------------------------------------------------------------------------

export function validateZoneId(zoneId: unknown): zoneId is CanonicalZoneId {
  return isCanonicalZoneId(zoneId);
}

export function validateZoneValue(metric: string, val: InvestmentZoneValue): ValidationResult {
  const errors: string[] = [];

  if (!validateZoneId(val.zoneId)) {
    errors.push(`Invalid canonical zone_id: "${val.zoneId}". Must be one of the 22 frozen ADM2 zone IDs.`);
  }

  if (metric === 'production') {
    if (val.productionVolume !== null && val.productionVolume !== undefined && val.productionVolume < 0) {
      errors.push('productionVolume cannot be negative.');
    }
    if (val.harvestedAreaHa !== null && val.harvestedAreaHa !== undefined && val.harvestedAreaHa < 0) {
      errors.push('harvestedAreaHa cannot be negative.');
    }
    if (val.yieldValue !== null && val.yieldValue !== undefined && val.yieldValue < 0) {
      errors.push('yieldValue cannot be negative.');
    }
  } else if (metric === 'suitability' || metric === 'investment_potential') {
    if (val.value !== null && val.value !== undefined) {
      if (val.value < 0 || val.value > 100) {
        errors.push(`${metric} score must be between 0 and 100 (got ${val.value}).`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDatasetForPublishing(
  dataset: InvestmentDataset,
  methodology?: InvestmentMethodology | null
): ValidationResult {
  const errors: string[] = [];

  // Source requirement: dataset.sourceIds.length >= 1
  if (!dataset.sourceIds || !Array.isArray(dataset.sourceIds) || dataset.sourceIds.length === 0) {
    errors.push('Dataset cannot be published without at least one valid sourceId.');
  }

  // Methodology hard rule for suitability and investment-potential
  if (dataset.metric === 'suitability' || dataset.metric === 'investment_potential') {
    if (!dataset.methodologyId || dataset.methodologyId.trim() === '') {
      errors.push(`Datasets with metric "${dataset.metric}" require a valid methodologyId before publication.`);
    } else if (!methodology) {
      errors.push(`Documented methodology "${dataset.methodologyId}" was not found or is invalid.`);
    } else if (methodology.verificationStatus !== 'verified') {
      errors.push(`Associated methodology "${dataset.methodologyId}" must be verified before dataset publication.`);
    }
  }

  // Verification requirement for public serving
  if (dataset.verificationStatus !== 'verified') {
    errors.push('Dataset must have verificationStatus === "verified" before publication.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function toPublicZoneProfile(profile: InvestmentZoneProfile): PublicInvestmentZoneProfile | null {
  if (profile.status !== 'published' || profile.verificationStatus !== 'verified') {
    return null;
  }
  return {
    zoneId: profile.zoneId,
    overview: profile.overview,
    featuredCommodities: profile.featuredCommodities,
    infrastructureSummary: profile.infrastructureSummary,
    opportunitySummary: profile.opportunitySummary,
    responsibleOffice: profile.responsibleOffice,
    verificationStatus: 'verified',
    publishedAt: profile.publishedAt || profile.updatedAt,
  };
}

export function toPublicDataset(dataset: InvestmentDataset): PublicInvestmentDataset | null {
  if (dataset.lifecycleStatus !== 'published' || dataset.verificationStatus !== 'verified') {
    return null;
  }
  return {
    datasetId: dataset.datasetId,
    title: dataset.title,
    category: dataset.category,
    commodity: dataset.commodity,
    metric: dataset.metric,
    unit: dataset.unit,
    referencePeriod: dataset.referencePeriod,
    sourceIds: dataset.sourceIds,
    methodologyId: dataset.methodologyId,
    publishedAt: dataset.publishedAt || dataset.updatedAt,
  };
}

export function toPublicZoneValue(
  val: InvestmentZoneValue,
  allValuesInDataset: InvestmentZoneValue[] = []
): PublicInvestmentZoneValue {
  // Derive regional share & rank dynamically
  let regionalRank: number | null = null;
  let regionalSharePercent: number | null = null;

  const validValues = allValuesInDataset.filter(
    (v) => (v.value !== null && v.value !== undefined) || (v.productionVolume !== null && v.productionVolume !== undefined)
  );

  const numericVal = val.productionVolume !== undefined && val.productionVolume !== null ? val.productionVolume : val.value;

  if (numericVal !== null && numericVal !== undefined && validValues.length > 0) {
    // Sort descending with deterministic tie breaking
    const sorted = [...validValues].sort((a, b) => {
      const valA = a.productionVolume !== undefined && a.productionVolume !== null ? a.productionVolume : (a.value ?? -1);
      const valB = b.productionVolume !== undefined && b.productionVolume !== null ? b.productionVolume : (b.value ?? -1);
      if (valB !== valA) return valB - valA;
      return a.zoneId.localeCompare(b.zoneId);
    });

    const rankIdx = sorted.findIndex((item) => item.zoneId === val.zoneId);
    if (rankIdx !== -1) {
      regionalRank = rankIdx + 1;
    }

    const totalVolume = sorted.reduce((sum, item) => {
      const v = item.productionVolume !== undefined && item.productionVolume !== null ? item.productionVolume : (item.value ?? 0);
      return sum + v;
    }, 0);

    if (totalVolume > 0) {
      regionalSharePercent = Math.round(((numericVal / totalVolume) * 100) * 10) / 10;
    }
  }

  return {
    zoneId: val.zoneId,
    value: val.value ?? null,
    productionVolume: val.productionVolume ?? null,
    productionUnit: val.productionUnit,
    harvestedAreaHa: val.harvestedAreaHa ?? null,
    yieldValue: val.yieldValue ?? null,
    yieldUnit: val.yieldUnit,
    trendPercent: val.trendPercent ?? null,
    qualityFlag: val.qualityFlag,
    regionalRank,
    regionalSharePercent,
  };
}

export function toPublicSource(source: InvestmentSource): PublicInvestmentSource | null {
  if (source.status !== 'published' || source.verificationStatus !== 'verified') {
    return null;
  }
  return {
    sourceId: source.sourceId,
    title: source.title,
    organization: source.organization,
    documentTitle: source.documentTitle,
    publicationDate: source.publicationDate,
    url: source.url,
    license: source.license,
  };
}

export function toPublicOpportunity(opp: InvestmentOpportunity): PublicInvestmentOpportunity | null {
  if (opp.lifecycleStatus !== 'published' || opp.verificationStatus !== 'verified') {
    return null;
  }
  return {
    opportunityId: opp.opportunityId,
    title: opp.title,
    slug: opp.slug,
    zoneIds: opp.zoneIds,
    commodityKeys: opp.commodityKeys,
    opportunityType: opp.opportunityType,
    summary: opp.summary,
    description: opp.description,
    estimatedInvestmentRange: opp.estimatedInvestmentRange,
    landInformation: opp.landInformation,
    responsibleOffice: opp.responsibleOffice,
    publishedAt: opp.publishedAt || opp.updatedAt,
  };
}

export function toPublicFacility(facility: InvestmentFacility): PublicInvestmentFacility | null {
  if (facility.lifecycleStatus !== 'published' || facility.verificationStatus !== 'verified') {
    return null;
  }

  // Location precision privacy enforcement:
  // - exact: exposes approved exact lat/lng
  // - approximate: exposes approved approximate lat/lng
  // - zone_centroid: does NOT expose private exact coordinates, sets coordinates to null
  let publicCoordinates: { lat: number; lng: number } | null = null;
  if (facility.locationPrecision === 'exact' || facility.locationPrecision === 'approximate') {
    if (
      facility.coordinates &&
      Number.isFinite(facility.coordinates.lat) &&
      Number.isFinite(facility.coordinates.lng)
    ) {
      publicCoordinates = {
        lat: facility.coordinates.lat,
        lng: facility.coordinates.lng,
      };
    }
  } else if (facility.locationPrecision === 'zone_centroid') {
    publicCoordinates = null;
  }

  return {
    facilityId: facility.facilityId,
    zoneId: facility.zoneId,
    category: facility.category,
    title: facility.title,
    description: facility.description,
    locationDescription: facility.locationDescription,
    coordinates: publicCoordinates,
    locationPrecision: facility.locationPrecision,
    operationalStatus: facility.operationalStatus,
    ownership: facility.ownership,
    operatorName: facility.operatorName,
    capacities: Array.isArray(facility.capacities)
      ? facility.capacities.map((c) => ({
          metricKey: c.metricKey,
          label: c.label,
          numericValue: c.numericValue !== undefined && c.numericValue !== null ? c.numericValue : null,
          unit: c.unit || null,
          referencePeriod: c.referencePeriod || null,
        }))
      : [],
    commodityKeys: facility.commodityKeys,
    commissioningYear: facility.commissioningYear ?? null,
    assessmentDate: facility.assessmentDate ?? null,
    referencePeriod: facility.referencePeriod ?? null,
    sourceIds: Array.isArray(facility.sourceIds) ? [...facility.sourceIds] : [],
    publishedAt: facility.publishedAt || facility.updatedAt,
  };
}

