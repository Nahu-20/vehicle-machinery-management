/**
 * About OAB CMS models — governed source of truth for public About pages.
 */

export type AboutCmsStatus = 'draft' | 'review' | 'published' | 'archived';

/** Strict localized string for institutional About content. */
export interface AboutLocalizedText {
  om: string;
  am: string;
  en: string;
}

export interface AboutCmsMeta {
  status: AboutCmsStatus;
  version: number;
  displayOrder: number;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName?: string;
  publishedAt?: string | null;
  publishedBy?: string | null;
  publishedByName?: string | null;
}

export function emptyLocalized(fallback = ''): AboutLocalizedText {
  return { om: fallback, am: fallback, en: fallback };
}

export function isLocalizedComplete(value?: AboutLocalizedText | null): boolean {
  if (!value) return false;
  return Boolean(value.om?.trim() && value.am?.trim() && value.en?.trim());
}

export interface AboutLandingSectionConfig {
  id: string;
  label: string;
  enabled: boolean;
  displayOrder: number;
}

export interface AboutOverviewDoc extends AboutCmsMeta {
  id: 'main';
  eyebrow: AboutLocalizedText;
  headline: AboutLocalizedText;
  summary: AboutLocalizedText;
  heroImageUrl?: string;
  heroImageAlt: AboutLocalizedText;
  mobileImageUrl?: string;
  primaryCtaLabel: AboutLocalizedText;
  primaryCtaHref: string;
  secondaryCtaLabel: AboutLocalizedText;
  secondaryCtaHref: string;
  discoverTitle: AboutLocalizedText;
  discoverSubtitle: AboutLocalizedText;
  messageSectionTitle: AboutLocalizedText;
  introHeading?: AboutLocalizedText;
  introBody?: AboutLocalizedText;
  introImageUrl?: string;
  sections: AboutLandingSectionConfig[];
  enabled: boolean;
}

export interface AboutHistoryMilestone extends AboutCmsMeta {
  id: string;
  yearLabel: string;
  title: AboutLocalizedText;
  description: AboutLocalizedText;
  longContent?: AboutLocalizedText;
  group: string;
  imageUrl?: string;
  imageAlt?: AboutLocalizedText;
  source?: AboutLocalizedText;
  documentUrl?: string;
  featured: boolean;
  isPlaceholder: boolean;
}

export interface AboutMandateBlock extends AboutCmsMeta {
  id: string;
  kind: 'mandate' | 'mission' | 'vision' | 'objective' | 'value' | 'legal';
  title: AboutLocalizedText;
  body: AboutLocalizedText;
  iconKey?: string;
  active: boolean;
  isPlaceholder: boolean;
}

export type AboutOrgNodeType =
  | 'government'
  | 'bureau'
  | 'bureau-head'
  | 'deputy'
  | 'directorate'
  | 'department'
  | 'zone'
  | 'woreda'
  | 'kebele'
  | 'extension'
  | 'farmer'
  | 'other';

export interface AboutOrgNode extends AboutCmsMeta {
  id: string;
  parentId: string | null;
  title: AboutLocalizedText;
  type: AboutOrgNodeType;
  description?: AboutLocalizedText;
  responsibilities?: AboutLocalizedText[];
  leaderId?: string;
  leaderName?: AboutLocalizedText;
  contact?: string;
  href?: string;
  active: boolean;
  isPlaceholder: boolean;
}

export type AboutLeaderLevel = 'bureau-head' | 'deputy' | 'senior' | 'directorate';
export type AboutLeaderTenure = 'current' | 'former';

export interface AboutLeader extends AboutCmsMeta {
  id: string;
  slug: string;
  name: AboutLocalizedText;
  title: AboutLocalizedText;
  areaOfResponsibility?: AboutLocalizedText;
  biography?: AboutLocalizedText;
  education?: AboutLocalizedText;
  background?: AboutLocalizedText;
  photoUrl?: string;
  photoAlt?: AboutLocalizedText;
  level: AboutLeaderLevel;
  tenure: AboutLeaderTenure;
  termStart?: string;
  termEnd?: string;
  linkedInUrl?: string;
  email?: string;
  officeContact?: string;
  featured: boolean;
  publicProfileEnabled: boolean;
  isPlaceholder: boolean;
}

export interface AboutLeadershipMessage extends AboutCmsMeta {
  id: string;
  title: AboutLocalizedText;
  leaderId: string;
  leaderName: AboutLocalizedText;
  leaderTitle: AboutLocalizedText;
  excerpt: AboutLocalizedText;
  body: AboutLocalizedText;
  dateLabel?: string;
  source?: AboutLocalizedText;
  photoUrl?: string;
  signatureImageUrl?: string;
  heroImageUrl?: string;
  language: 'om' | 'am' | 'en' | 'all';
  featured: boolean;
  isPlaceholder: boolean;
}

export interface AboutDepartment extends AboutCmsMeta {
  id: string;
  slug: string;
  name: AboutLocalizedText;
  shortMandate: AboutLocalizedText;
  description: AboutLocalizedText;
  responsibilities: AboutLocalizedText[];
  leaderId?: string;
  leaderName?: AboutLocalizedText;
  contact?: string;
  heroImageUrl?: string;
  iconName: string;
  relatedProgramIds?: string[];
  relatedServiceIds?: string[];
  relatedDocumentIds?: string[];
  active: boolean;
  isPlaceholder: boolean;
}

export interface AboutServiceChainStep extends AboutCmsMeta {
  id: string;
  title: AboutLocalizedText;
  description: AboutLocalizedText;
  iconName?: string;
  imageUrl?: string;
  enabled: boolean;
}

export interface AboutStakeholder extends AboutCmsMeta {
  id: string;
  title: AboutLocalizedText;
  description: AboutLocalizedText;
  enabled: boolean;
}

export interface AboutStatistic extends AboutCmsMeta {
  id: string;
  label: AboutLocalizedText;
  value: string;
  displayValue?: string;
  unit?: AboutLocalizedText;
  category: string;
  year?: number;
  source?: AboutLocalizedText;
  methodology?: AboutLocalizedText;
  featured: boolean;
  isPlaceholder: boolean;
  updatedAtStat?: string;
}

export type AboutPartnerCategory =
  | 'federal'
  | 'regional'
  | 'university'
  | 'research'
  | 'development'
  | 'ngo'
  | 'private'
  | 'international'
  | 'other';

export interface AboutPartner extends AboutCmsMeta {
  id: string;
  name: AboutLocalizedText;
  description: AboutLocalizedText;
  category: AboutPartnerCategory;
  websiteUrl?: string;
  logoUrl?: string;
  active: boolean;
  isPlaceholder: boolean;
}

export type AboutDocumentCategory =
  | 'strategy'
  | 'policy'
  | 'annual-report'
  | 'guideline'
  | 'proclamation'
  | 'plan'
  | 'regulation'
  | 'manual'
  | 'publication'
  | 'other';

export interface AboutStrategicDocument extends AboutCmsMeta {
  id: string;
  title: AboutLocalizedText;
  description: AboutLocalizedText;
  category: AboutDocumentCategory;
  year?: number;
  language: string;
  fileSize?: string;
  fileType?: string;
  publicationDateLabel?: string;
  downloadUrl?: string;
  storagePath?: string;
  sourceOwner?: string;
  featured: boolean;
  isPlaceholder: boolean;
}

export interface AboutPageSettings extends AboutCmsMeta {
  id: 'main';
  landingSectionIds: string[];
  featuredMessageId?: string | null;
  featuredHistoryIds: string[];
  featuredStatisticIds: string[];
  featuredDepartmentIds: string[];
  navRouteIds: string[];
  metaTitle?: AboutLocalizedText;
  metaDescription?: AboutLocalizedText;
  socialImageUrl?: string;
}

export interface AboutCmsCounts {
  history: { published: number; draft: number; review: number; archived: number };
  leaders: { published: number; current: number; draft: number };
  departments: { published: number; draft: number };
  orgNodes: { published: number; draft: number };
  statistics: { published: number; draft: number };
  partners: { published: number; draft: number };
  documents: { published: number; draft: number };
  messages: { published: number; draft: number; featuredId?: string | null };
  overviewStatus: AboutCmsStatus | 'missing';
  awaitingReview: number;
}

/** Landing discover cards remain config-driven (routes), not CMS entities. */
export interface AboutDiscoverCard {
  id: string;
  title: AboutLocalizedText;
  description: AboutLocalizedText;
  href: string;
  iconName: string;
  displayOrder: number;
}
