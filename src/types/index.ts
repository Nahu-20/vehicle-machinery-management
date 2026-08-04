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
}

export interface Publication {
  id: string;
  titleKey: string;
  descriptionKey: string;
  type: 'calendar' | 'guidance' | 'manual' | 'policy' | 'video' | 'form';
  fileSize?: string;
  language: string;
  downloadUrl: string;
  format: 'PDF' | 'MP4' | 'DOCX';
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
