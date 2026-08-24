/**
 * Public About read API — published CMS content only.
 * Prefer empty results over fabricated institutional data.
 */

import { aboutDiscoverCards } from '../data/aboutDiscoverCards';
import {
  getPublishedAboutOverview,
  listAboutPublished,
  listPublishedLeadersCurrent,
  listPublishedDepartmentsActive,
  getFeaturedLeadershipMessage,
  getAboutById,
} from './aboutCmsService';
import type {
  AboutOverviewDoc,
  AboutDiscoverCard,
  AboutStatistic,
  AboutHistoryMilestone,
  AboutMandateBlock,
  AboutOrgNode,
  AboutLeader,
  AboutLeadershipMessage,
  AboutDepartment,
  AboutServiceChainStep,
  AboutStakeholder,
  AboutPartner,
  AboutStrategicDocument,
} from '../types/about';

/** @deprecated Use getAboutLandingAsync — sync stub for gradual migration */
export type AboutLandingContent = Pick<
  AboutOverviewDoc,
  | 'eyebrow'
  | 'headline'
  | 'summary'
  | 'heroImageAlt'
  | 'primaryCtaLabel'
  | 'secondaryCtaLabel'
  | 'discoverTitle'
  | 'discoverSubtitle'
  | 'messageSectionTitle'
> & {
  exploreCta: AboutOverviewDoc['primaryCtaLabel'];
  historyCta: AboutOverviewDoc['secondaryCtaLabel'];
  placeholderBanner: { om: string; am: string; en: string };
};

const EMPTY_BANNER = {
  en: 'Official About content will appear here after OAB publishes it in the CMS.',
  om: 'Qabiyyeen Waa\'ee Biiroo seeraa yeroo CMS irratti maxxanfamu asitti mul\'ata.',
  am: 'ኦፊሴላዊ የስለ ቢሮው ይዘት በCMS ሲታተም እዚህ ይታያል።',
};

function overviewToLanding(o: AboutOverviewDoc): AboutLandingContent {
  return {
    eyebrow: o.eyebrow,
    headline: o.headline,
    summary: o.summary,
    heroImageAlt: o.heroImageAlt,
    primaryCtaLabel: o.primaryCtaLabel,
    secondaryCtaLabel: o.secondaryCtaLabel,
    exploreCta: o.primaryCtaLabel,
    historyCta: o.secondaryCtaLabel,
    discoverTitle: o.discoverTitle,
    discoverSubtitle: o.discoverSubtitle,
    messageSectionTitle: o.messageSectionTitle,
    placeholderBanner: EMPTY_BANNER,
  };
}

export async function getAboutLandingAsync(): Promise<AboutLandingContent | null> {
  const overview = await getPublishedAboutOverview();
  if (!overview) return null;
  return overviewToLanding(overview);
}

export function listDiscoverCards(): AboutDiscoverCard[] {
  return [...aboutDiscoverCards].sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function listHeroStatistics(): Promise<AboutStatistic[]> {
  const stats = await listAboutPublished<AboutStatistic>('statistics');
  return stats.filter((s) => s.featured).slice(0, 4).length
    ? stats.filter((s) => s.featured).slice(0, 4)
    : stats.slice(0, 4);
}

export async function listGlanceStatistics(): Promise<AboutStatistic[]> {
  return listAboutPublished<AboutStatistic>('statistics');
}

export async function listHistoryMilestones(): Promise<AboutHistoryMilestone[]> {
  return listAboutPublished<AboutHistoryMilestone>('history');
}

export async function listMandateBlocks(): Promise<AboutMandateBlock[]> {
  return listAboutPublished<AboutMandateBlock>('mandate');
}

export async function listOrgNodes(): Promise<AboutOrgNode[]> {
  const nodes = await listAboutPublished<AboutOrgNode>('org');
  return nodes.filter((n) => n.active !== false);
}

export function getOrgChildren(nodes: AboutOrgNode[], parentId: string | null): AboutOrgNode[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function listLeaders(): Promise<AboutLeader[]> {
  return listPublishedLeadersCurrent();
}

export async function getLeaderBySlug(slug: string): Promise<AboutLeader | undefined> {
  const leaders = await listAboutPublished<AboutLeader>('leaders');
  return leaders.find((l) => l.slug === slug && l.publicProfileEnabled !== false);
}

export async function getLeadershipMessage(): Promise<AboutLeadershipMessage | null> {
  return getFeaturedLeadershipMessage();
}

export async function listDepartments(): Promise<AboutDepartment[]> {
  return listPublishedDepartmentsActive();
}

export async function getDepartmentBySlug(slug: string): Promise<AboutDepartment | undefined> {
  const deps = await listPublishedDepartmentsActive();
  return deps.find((d) => d.slug === slug);
}

export async function listServiceChain(): Promise<AboutServiceChainStep[]> {
  const steps = await listAboutPublished<AboutServiceChainStep>('serviceChain');
  return steps.filter((s) => s.enabled !== false);
}

export async function listStakeholders(): Promise<AboutStakeholder[]> {
  const items = await listAboutPublished<AboutStakeholder>('stakeholders');
  return items.filter((s) => s.enabled !== false);
}

export async function listPartners(): Promise<AboutPartner[]> {
  const items = await listAboutPublished<AboutPartner>('partners');
  return items.filter((p) => p.active !== false);
}

export async function listStrategicDocuments(): Promise<AboutStrategicDocument[]> {
  return listAboutPublished<AboutStrategicDocument>('documents');
}

export async function getLeaderRecord(id: string): Promise<AboutLeader | null> {
  return getAboutById<AboutLeader>('leaders', id);
}
