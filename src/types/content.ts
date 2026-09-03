import type { AboutCmsMeta, AboutCmsStatus, AboutLocalizedText } from './about';

/**
 * The four sections of the Bureau's information architecture that had no
 * pages: Agricultural Initiatives, Plans/Programs & Projects, Opportunities
 * & Engagement, and the expanded Resource & Statistics.
 *
 * They share one shape — a titled, dated, optionally-linked entry filed under
 * a topic — so they share one collection and one admin screen rather than
 * four near-identical copies. `topic` is the sub-page it appears on, matching
 * the link ids in src/data/siteNavigation.ts.
 */
export type ContentSectionId = 'initiatives' | 'plans' | 'opportunities' | 'resources';

export const CONTENT_SECTION_IDS: ContentSectionId[] = [
  'initiatives',
  'plans',
  'opportunities',
  'resources',
];

/** Human label keys for the section pickers, resolved through i18n. */
export const CONTENT_SECTION_LABEL_KEY: Record<ContentSectionId, string> = {
  initiatives: 'nav_group_initiatives_crops',
  plans: 'nav_plans',
  opportunities: 'nav_group_opportunities',
  resources: 'nav_group_data',
};

export interface ContentEntry extends AboutCmsMeta {
  id: string;
  sectionId: ContentSectionId;
  /** Sub-page this belongs to — a link id from siteNavigation, e.g. 'opp-tenders'. */
  topicId: string;
  slug: string;
  title: AboutLocalizedText;
  summary: AboutLocalizedText;
  body: AboutLocalizedText;
  /** Optional outward link (a tender portal, a dataset, a dashboard). */
  externalUrl?: string | null;
  /** Optional attachment for download-centre style entries. */
  fileUrl?: string | null;
  /** ISO date the entry is effective from, e.g. a tender opening. */
  effectiveDate?: string | null;
  /** ISO date it stops being current, e.g. a tender deadline. */
  expiresAt?: string | null;
  featured?: boolean;
}

export type { AboutCmsStatus as ContentStatus, AboutLocalizedText as ContentLocalizedText };

/** A not-yet-saved entry: the editable fields, without the audit metadata
 *  that saveContentEntry stamps on. */
export type NewContentEntry = Omit<ContentEntry, keyof AboutCmsMeta> &
  Pick<AboutCmsMeta, 'status' | 'displayOrder'>;

export function emptyContentEntry(
  sectionId: ContentSectionId,
  topicId: string,
): NewContentEntry {
  return {
    id: '',
    sectionId,
    topicId,
    slug: '',
    title: { om: '', am: '', en: '' },
    summary: { om: '', am: '', en: '' },
    body: { om: '', am: '', en: '' },
    externalUrl: null,
    fileUrl: null,
    effectiveDate: null,
    expiresAt: null,
    displayOrder: 0,
    featured: false,
    status: 'draft',
  };
}
