export * from './news';
export {
  validateZoneId,
  validateZoneValue,
  validateDatasetForPublishing,
  toPublicZoneProfile,
  toPublicDataset,
  toPublicZoneValue,
  toPublicSource,
  toPublicOpportunity,
} from './investment';
export type {
  InvestmentZoneProfile,
  InvestmentDataset,
  InvestmentZoneValue,
  InvestmentSource,
  InvestmentMethodology,
  InvestmentOpportunity,
  InvestmentInfrastructure,
  InvestmentMapConfig,
  InvestmentAuditLog,
  PublicInvestmentZoneProfile,
  PublicInvestmentDataset,
  PublicInvestmentZoneValue,
  PublicInvestmentSource,
  PublicInvestmentOpportunity,
  PublicInvestmentMapConfig,
  InvestmentOpportunityFeature,
  InvestmentZonePotential,
  VerificationStatus,
  LifecycleStatus,
  DatasetCategory,
  CommodityKey,
  DatasetUnit,
  InvestmentValidationResult,
} from './investment';
export type LanguageCode = 'om' | 'am' | 'en';

export type LocalizedText = {
  om?: string;
  am?: string;
  en?: string;
} | string;

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flagEmoji?: string;
}

export interface NavigationItem {
  id: string;
  labelKey: string;
  href: string;
  iconName?: string;
  badge?: string;
  children?: NavigationItem[];
}

export interface Service {
  id: string;
  iconName: string;
  titleKey: string;
  descriptionKey: string;
  category: 'extension' | 'market' | 'crop' | 'livestock' | 'irrigation' | 'inputs';
  linkUrl: string;
  isPopular?: boolean;
}

export interface Program {
  id: string;
  titleKey: string;
  descriptionKey: string;
  categoryKey: string;
  targetArea: string;
  beneficiaries: string;
  imageUrl: string;
  status: 'active' | 'upcoming' | 'ongoing';
  badgeKey?: string;
  directorate?: string;
  keyObjectives?: string[];
  interventions?: string[];
  milestones?: { year: string; target: string; progress: number }[];
  partners?: string[];
  commodities?: string[];
  zones?: string[];
  impactMetric?: { value: string; label: string };
  enrollmentSteps?: string[];
}

export type NewsContentBlock =
  | {
      type: 'paragraph';
      content: LocalizedText;
    }
  | {
      type: 'heading';
      level: 2 | 3;
      content: LocalizedText;
    }
  | {
      type: 'image';
      src: string;
      alt: LocalizedText;
      caption?: LocalizedText;
    }
  | {
      type: 'quote';
      content: LocalizedText;
      source?: LocalizedText;
    }
  | {
      type: 'list';
      ordered: boolean;
      items: LocalizedText[];
    }
  | {
      type: 'highlight';
      title?: LocalizedText;
      content: LocalizedText;
    }
  | {
      type: 'relatedLink';
      title: LocalizedText;
      url: string;
    };

export interface NewsArticle {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  fullContent: NewsContentBlock[];
  category: 'news' | 'training' | 'tender' | 'event';
  featuredImage: string;
  imageAlt: LocalizedText;
  publishedAt: string;
  updatedAt?: string;
  author: LocalizedText;
  responsibleOffice?: LocalizedText;
  readingTime: string;
  tags: string[];
  relatedArticleIds: string[];
  featured?: boolean;
  status: 'published' | 'draft';
  translations?: Partial<Record<LanguageCode, boolean>>;
  
  // Legacy / convenience fields for backward compatibility
  titleKey?: string;
  summaryKey?: string;
  contentKey?: string;
  date?: string;
  imageUrl?: string;
  readTime?: string;
}

export interface Announcement {
  id: string;
  titleKey: string;
  date: string;
  category: 'tender' | 'training' | 'notice' | 'vacancy';
  downloadUrl?: string;
  isImportant?: boolean;
}

export type AlertSeverity = 'critical' | 'warning' | 'advisory' | 'info';
export type AlertCategory = 'weather' | 'crop' | 'pest' | 'livestock' | 'irrigation' | 'general';
export type AlertStatus = 'active' | 'expired';

export interface AgriculturalAlert {
  id: string;
  slug: string;
  titleKey: string;
  summaryKey: string;
  fullDescriptionKey?: string;
  severity: AlertSeverity;
  category: AlertCategory;
  date: string;
  expirationDate: string;
  updatedDate?: string;
  affectedArea: string;
  affectedZones: string[];
  affectedWoredas: string[];
  actionRequiredKey: string;
  recommendedActions?: string[];
  responsibleOffice: string;
  status: AlertStatus;
  isDismissible?: boolean;
}

export interface Office {
  id: string;
  nameKey: string;
  zoneKey: string;
  woreda?: string;
  headName: string;
  phone: string;
  email: string;
  address: string;
  operatingHours: string;
  region?: 'central' | 'east' | 'west' | 'south';
  extensionLead?: string;
  hotline?: string;
  city?: string;
  gpsCoords?: string;
}

export interface Publication {
  id: string;
  titleKey: string;
  descriptionKey: string;
  type: 'calendar' | 'guidance' | 'manual' | 'policy' | 'video' | 'form' | 'research' | 'poster';
  fileSize?: string;
  language: string;
  downloadUrl: string;
  format: 'PDF' | 'MP4' | 'DOCX' | 'XLSX' | 'ZIP';
  // Enhanced metadata fields
  category?: 'crop' | 'pest' | 'livestock' | 'irrigation' | 'policy' | 'form' | 'multimedia' | 'ftc';
  defaultTitle?: string;
  defaultDescription?: string;
  publishedDate?: string;
  updatedDate?: string;
  version?: string;
  pagesOrDuration?: string;
  authorOrOffice?: string;
  targetAudience?: string[];
  tags?: string[];
  featured?: boolean;
  downloadsCount?: number;
  tableOfContents?: string[];
  previewSummary?: string;
  coverImage?: string;
  videoEmbedUrl?: string;
  videoDuration?: string;
  formInstructions?: string[];
}

export interface MarketPrice {
  id: string;
  commodityKey?: string;
  commodity?: LocalizedText;
  market: LocalizedText;
  zone: LocalizedText;
  unit: LocalizedText;
  priceETB: number;
  changePercent: number;
  updatedDate: string;
  trend: 'up' | 'down' | 'stable';
}

export interface WeatherInfo {
  location: string;
  temperatureC: number;
  conditionKey: string;
  humidity: number;
  windKmH: number;
  rainfallMm: number;
  forecast: Array<{
    dayKey: string;
    tempHigh: number;
    tempLow: number;
    conditionKey: string;
    iconName: string;
  }>;
  plantingAdviceKey: string;
  rainfallAdvisoryKey: string;
}

export interface FeedbackFormState {
  fullName: string;
  phoneOrEmail: string;
  zone: string;
  category: string;
  message: string;
}

export interface AchievementMetric {
  label: LocalizedText;
  value: string;
  change?: string;
  unit?: LocalizedText;
}

export type AchievementContentBlock =
  | {
      type: 'paragraph';
      content: LocalizedText;
    }
  | {
      type: 'heading';
      level: 2 | 3;
      content: LocalizedText;
    }
  | {
      type: 'image';
      src: string;
      alt: LocalizedText;
      caption?: LocalizedText;
    }
  | {
      type: 'quote';
      content: LocalizedText;
      source?: LocalizedText;
    }
  | {
      type: 'list';
      ordered: boolean;
      items: LocalizedText[];
    }
  | {
      type: 'metrics';
      items: AchievementMetric[];
    };

export interface BeforeAfterItem {
  id: string;
  projectTitle: LocalizedText;
  beforeImage: string;
  afterImage: string;
  beforeDescription: LocalizedText;
  afterDescription: LocalizedText;
  metrics: AchievementMetric[];
  zone: LocalizedText;
  period: string;
}

export interface ProgramImpact {
  id: string;
  programKey: string;
  title: LocalizedText;
  initiativesCount: string;
  summary: LocalizedText;
  image: string;
  iconName: string;
}

export interface ImpactReport {
  id: string;
  title: LocalizedText;
  year: string;
  format: 'PDF' | 'DOCX' | 'XLSX';
  fileSize: string;
  downloadUrl: string;
}

export interface AchievementMilestone {
  id: string;
  year: string;
  title: LocalizedText;
  description: LocalizedText;
  program: LocalizedText;
  zone: LocalizedText;
  thumbnail?: string;
  achievementSlug?: string;
}

export interface Achievement {
  id: string;
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  fullContent: AchievementContentBlock[];
  category: 'crop' | 'livestock' | 'irrigation' | 'resource' | 'training' | 'empowerment';
  program: LocalizedText;
  zone: LocalizedText;
  woreda?: LocalizedText;
  year: string;
  implementationPeriod: string;
  featuredImage: string;
  imageAlt: LocalizedText;
  gallery?: string[];
  metrics: AchievementMetric[];
  beforeAfter?: BeforeAfterItem;
  responsibleOffice: LocalizedText;
  reportIds?: string[];
  relatedAchievementIds?: string[];
  featured?: boolean;
  status: 'published' | 'draft';
  publishedAt: string;
  updatedAt?: string;
  titleKey?: string;
  summaryKey?: string;
}

