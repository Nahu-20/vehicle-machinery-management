/**
 * About OAB CMS — Firestore-backed governance layer.
 * Public site must only read status === 'published' (and active/current where applicable).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StaffUser } from '../types/auth';
import { hasPermission } from '../lib/permissions';
import { logAuditEvent } from './auditService';
import type {
  AboutCmsStatus,
  AboutCmsMeta,
  AboutLocalizedText,
  AboutOverviewDoc,
  AboutHistoryMilestone,
  AboutMandateBlock,
  AboutOrgNode,
  AboutLeader,
  AboutLeadershipMessage,
  AboutDepartment,
  AboutServiceChainStep,
  AboutStakeholder,
  AboutStatistic,
  AboutPartner,
  AboutStrategicDocument,
  AboutPageSettings,
  AboutCmsCounts,
  AboutLandingSectionConfig,
} from '../types/about';
import { emptyLocalized } from '../types/about';

export const ABOUT_COLLECTIONS = {
  overview: 'aboutOverview',
  history: 'aboutHistory',
  mandate: 'aboutMandateBlocks',
  org: 'aboutOrgNodes',
  leaders: 'aboutLeaders',
  messages: 'aboutLeadershipMessages',
  departments: 'aboutDepartments',
  serviceChain: 'aboutServiceSteps',
  stakeholders: 'aboutStakeholders',
  statistics: 'aboutStatistics',
  partners: 'aboutPartners',
  documents: 'aboutDocuments',
  settings: 'aboutSettings',
} as const;

const nowIso = () => new Date().toISOString();

function actorFields(user: StaffUser, existing?: Partial<AboutCmsMeta>, isCreate = false) {
  const ts = nowIso();
  if (isCreate) {
    return {
      createdAt: ts,
      createdBy: user.uid,
      createdByName: user.displayName,
      updatedAt: ts,
      updatedBy: user.uid,
      updatedByName: user.displayName,
      version: 1,
      publishedAt: null,
      publishedBy: null,
      publishedByName: null,
    };
  }
  return {
    ...existing,
    updatedAt: ts,
    updatedBy: user.uid,
    updatedByName: user.displayName,
    version: (existing?.version || 1) + 1,
  };
}

export function slugifyAbout(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function wouldCreateOrgCycle(
  nodes: AboutOrgNode[],
  nodeId: string,
  newParentId: string | null,
): boolean {
  if (!newParentId) return false;
  if (newParentId === nodeId) return true;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cursor: string | null = newParentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === nodeId) return true;
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = byId.get(cursor)?.parentId ?? null;
  }
  return false;
}

function assertAboutWrite(user: StaffUser, status: AboutCmsStatus, isCreate: boolean) {
  if (status === 'published' && !hasPermission(user, 'about.publish')) {
    throw new Error('about.publish permission required to publish About content.');
  }
  if (isCreate) {
    if (!hasPermission(user, 'about.create') && !hasPermission(user, 'about.edit')) {
      throw new Error('about.create permission required.');
    }
    return;
  }
  if (
    !hasPermission(user, 'about.edit') &&
    !hasPermission(user, 'about.publish') &&
    !hasPermission(user, 'about.review')
  ) {
    throw new Error('about.edit permission required.');
  }
}

async function listCollection<T>(col: string): Promise<T[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, col));
  return snap.docs.map((d) => ({ ...(d.data() as object), id: d.id } as unknown as T));
}

async function listPublished<T extends { status: AboutCmsStatus; displayOrder?: number }>(
  col: string,
): Promise<T[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, col), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ ...(d.data() as object), id: d.id } as unknown as T))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (err) {
    console.warn(`[aboutCms] listPublished ${col}`, err);
    return [];
  }
}

async function upsertDoc(
  col: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  await setDoc(doc(db, col, id), { ...data, id }, { merge: true });
}

async function removeDoc(col: string, id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  await deleteDoc(doc(db, col, id));
}

async function auditAbout(
  user: StaffUser,
  action: 'created' | 'updated' | 'published' | 'archived' | 'submitted_for_review' | 'returned_to_draft',
  targetType: string,
  targetId: string,
  targetLabel: string,
  previousStatus?: string,
  newStatus?: string,
) {
  try {
    await logAuditEvent({
      actorUid: user.uid,
      actorEmail: user.email,
      actorDisplayName: user.displayName,
      actorRole: user.role,
      module: 'about',
      action,
      result: 'success',
      targetType,
      targetId,
      targetLabel,
      previousStatus,
      newStatus,
      source: 'dashboard_ui',
    });
  } catch (err) {
    console.warn('[aboutCms] audit failed', err);
  }
}

export function defaultLandingSections(): AboutLandingSectionConfig[] {
  return [
    { id: 'hero', label: 'Hero', enabled: true, displayOrder: 1 },
    { id: 'stats', label: 'OAB at a Glance', enabled: true, displayOrder: 2 },
    { id: 'discover', label: 'Discover OAB', enabled: true, displayOrder: 3 },
    { id: 'message', label: 'Leadership Message', enabled: true, displayOrder: 4 },
    { id: 'investment', label: 'Investment Bridge', enabled: true, displayOrder: 5 },
    { id: 'cta', label: 'Closing CTA', enabled: true, displayOrder: 6 },
  ];
}

export function createDefaultOverview(): Omit<AboutOverviewDoc, keyof AboutCmsMeta> & {
  status: AboutCmsStatus;
  version: number;
  displayOrder: number;
} {
  return {
    id: 'main',
    status: 'draft',
    version: 1,
    displayOrder: 0,
    eyebrow: emptyLocalized('About OAB'),
    headline: emptyLocalized(
      'Building a productive, resilient and modern agricultural sector for Oromia.',
    ),
    summary: emptyLocalized(
      'Official overview text will appear here after OAB approval and publication.',
    ),
    heroImageAlt: emptyLocalized('Agricultural landscape in Oromia'),
    primaryCtaLabel: emptyLocalized('Explore Our Work'),
    primaryCtaHref: '/about/how-we-serve',
    secondaryCtaLabel: emptyLocalized('Our History'),
    secondaryCtaHref: '/about/history',
    discoverTitle: emptyLocalized('Discover OAB'),
    discoverSubtitle: emptyLocalized(
      'Get to know our institution, structure, leadership and impact.',
    ),
    messageSectionTitle: emptyLocalized('Message from Leadership'),
    sections: defaultLandingSections(),
    enabled: true,
  };
}

// ——— Overview ———
export async function getAboutOverviewAdmin(): Promise<AboutOverviewDoc | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, ABOUT_COLLECTIONS.overview, 'main'));
  if (!snap.exists()) return null;
  return { ...(snap.data() as AboutOverviewDoc), id: 'main' };
}

export async function getPublishedAboutOverview(): Promise<AboutOverviewDoc | null> {
  const docu = await getAboutOverviewAdmin();
  if (!docu || docu.status !== 'published' || docu.enabled === false) return null;
  return docu;
}

export async function saveAboutOverview(
  user: StaffUser,
  data: Partial<AboutOverviewDoc>,
  expectedVersion?: number,
): Promise<AboutOverviewDoc> {
  const existing = await getAboutOverviewAdmin();
  if (existing && expectedVersion != null && existing.version !== expectedVersion) {
    throw new Error(
      `Version conflict: overview was updated by another editor (v${existing.version}). Refresh and try again.`,
    );
  }
  const isCreate = !existing;
  const base = existing || ({ ...createDefaultOverview(), ...actorFields(user, undefined, true) } as AboutOverviewDoc);
  const next: AboutOverviewDoc = {
    ...base,
    ...data,
    id: 'main',
    ...actorFields(user, base, isCreate),
    status: data.status || base.status || 'draft',
  } as AboutOverviewDoc;
  assertAboutWrite(user, next.status, isCreate);
  if (next.status === 'published') {
    next.publishedAt = nowIso();
    next.publishedBy = user.uid;
    next.publishedByName = user.displayName;
  }
  await upsertDoc(ABOUT_COLLECTIONS.overview, 'main', next as unknown as Record<string, unknown>);
  await auditAbout(
    user,
    isCreate ? 'created' : next.status === 'published' ? 'published' : 'updated',
    'aboutOverview',
    'main',
    'About Overview',
    existing?.status,
    next.status,
  );
  return next;
}

// ——— Generic collection helpers ———
type EntityName =
  | 'history'
  | 'mandate'
  | 'org'
  | 'leaders'
  | 'messages'
  | 'departments'
  | 'serviceChain'
  | 'stakeholders'
  | 'statistics'
  | 'partners'
  | 'documents';

const COL: Record<EntityName, string> = {
  history: ABOUT_COLLECTIONS.history,
  mandate: ABOUT_COLLECTIONS.mandate,
  org: ABOUT_COLLECTIONS.org,
  leaders: ABOUT_COLLECTIONS.leaders,
  messages: ABOUT_COLLECTIONS.messages,
  departments: ABOUT_COLLECTIONS.departments,
  serviceChain: ABOUT_COLLECTIONS.serviceChain,
  stakeholders: ABOUT_COLLECTIONS.stakeholders,
  statistics: ABOUT_COLLECTIONS.statistics,
  partners: ABOUT_COLLECTIONS.partners,
  documents: ABOUT_COLLECTIONS.documents,
};

export async function listAboutAdmin<T>(entity: EntityName): Promise<T[]> {
  const items = await listCollection<T & { displayOrder?: number }>(COL[entity]);
  return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

export async function listAboutPublished<T extends { status: AboutCmsStatus }>(
  entity: EntityName,
): Promise<T[]> {
  return listPublished<T>(COL[entity]);
}

export async function getAboutById<T>(entity: EntityName, id: string): Promise<T | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, COL[entity], id));
  if (!snap.exists()) return null;
  return { ...(snap.data() as object), id: snap.id } as T;
}

export async function saveAboutEntity<T extends AboutCmsMeta & { id: string }>(
  user: StaffUser,
  entity: EntityName,
  data: T,
  options?: { expectedVersion?: number; label?: string },
): Promise<T> {
  const existing = await getAboutById<T>(entity, data.id);
  if (existing && options?.expectedVersion != null && existing.version !== options.expectedVersion) {
    throw new Error(
      `Version conflict on ${entity}/${data.id} (v${existing.version}). Refresh and try again.`,
    );
  }
  const isCreate = !existing;
  const next = {
    ...existing,
    ...data,
    ...actorFields(user, existing || undefined, isCreate),
    id: data.id,
  } as T;

  assertAboutWrite(user, next.status, isCreate);

  if (next.status === 'published') {
    next.publishedAt = nowIso();
    next.publishedBy = user.uid;
    next.publishedByName = user.displayName;
  }

  // Featured message exclusivity
  if (entity === 'messages' && (next as unknown as AboutLeadershipMessage).featured && next.status === 'published') {
    const all = await listAboutAdmin<AboutLeadershipMessage>('messages');
    await Promise.all(
      all
        .filter((m) => m.id !== next.id && m.featured)
        .map(async (m) => {
          await upsertDoc(COL.messages, m.id, { ...m, featured: false, updatedAt: nowIso() });
        }),
    );
  }

  await upsertDoc(COL[entity], data.id, next as unknown as Record<string, unknown>);
  await auditAbout(
    user,
    isCreate ? 'created' : next.status === 'published' ? 'published' : 'updated',
    entity,
    data.id,
    options?.label || data.id,
    existing?.status,
    next.status,
  );
  return next;
}

export async function setAboutEntityStatus(
  user: StaffUser,
  entity: EntityName,
  id: string,
  status: AboutCmsStatus,
  label?: string,
): Promise<void> {
  const existing = await getAboutById<AboutCmsMeta & { id: string }>(entity, id);
  if (!existing) throw new Error('Record not found');
  assertAboutWrite(user, status, false);
  const next = {
    ...existing,
    status,
    ...actorFields(user, existing, false),
  };
  if (status === 'published') {
    next.publishedAt = nowIso();
    next.publishedBy = user.uid;
    next.publishedByName = user.displayName;
  }
  await upsertDoc(COL[entity], id, next as unknown as Record<string, unknown>);
  const action =
    status === 'published'
      ? 'published'
      : status === 'archived'
        ? 'archived'
        : status === 'review'
          ? 'submitted_for_review'
          : 'returned_to_draft';
  await auditAbout(user, action, entity, id, label || id, existing.status, status);
}

export async function deleteAboutEntity(
  user: StaffUser,
  entity: EntityName,
  id: string,
  label?: string,
): Promise<void> {
  // Prefer archive — hard delete only for drafts
  const existing = await getAboutById<AboutCmsMeta & { id: string }>(entity, id);
  if (!existing) return;
  if (existing.status === 'published') {
    await setAboutEntityStatus(user, entity, id, 'archived', label);
    return;
  }
  await removeDoc(COL[entity], id);
  await auditAbout(user, 'archived', entity, id, label || id, existing.status, 'archived');
}

export async function saveOrgNode(
  user: StaffUser,
  node: AboutOrgNode,
  expectedVersion?: number,
): Promise<AboutOrgNode> {
  if (
    !hasPermission(user, 'about.structure.manage') &&
    !hasPermission(user, 'about.edit') &&
    !hasPermission(user, 'about.publish')
  ) {
    throw new Error('about.structure.manage permission required.');
  }
  const all = await listAboutAdmin<AboutOrgNode>('org');
  if (wouldCreateOrgCycle(all, node.id, node.parentId)) {
    throw new Error('Invalid hierarchy: this parent would create a cycle.');
  }
  return saveAboutEntity(user, 'org', node, {
    expectedVersion,
    label: node.title?.en || node.id,
  });
}

export async function getAboutSettings(): Promise<AboutPageSettings | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, ABOUT_COLLECTIONS.settings, 'main'));
  if (!snap.exists()) return null;
  return { ...(snap.data() as AboutPageSettings), id: 'main' };
}

export async function saveAboutSettings(
  user: StaffUser,
  data: Partial<AboutPageSettings>,
): Promise<AboutPageSettings> {
  if (!hasPermission(user, 'about.edit') && !hasPermission(user, 'about.publish')) {
    throw new Error('about.edit permission required to update About settings.');
  }
  const existing = await getAboutSettings();
  const next = {
    id: 'main' as const,
    status: 'published' as AboutCmsStatus,
    version: (existing?.version || 0) + 1,
    displayOrder: 0,
    landingSectionIds: data.landingSectionIds || existing?.landingSectionIds || defaultLandingSections().map((s) => s.id),
    featuredMessageId: data.featuredMessageId ?? existing?.featuredMessageId ?? null,
    featuredHistoryIds: data.featuredHistoryIds || existing?.featuredHistoryIds || [],
    featuredStatisticIds: data.featuredStatisticIds || existing?.featuredStatisticIds || [],
    featuredDepartmentIds: data.featuredDepartmentIds || existing?.featuredDepartmentIds || [],
    navRouteIds: data.navRouteIds || existing?.navRouteIds || [],
    metaTitle: data.metaTitle || existing?.metaTitle,
    metaDescription: data.metaDescription || existing?.metaDescription,
    socialImageUrl: data.socialImageUrl || existing?.socialImageUrl,
    ...actorFields(user, existing || undefined, !existing),
  } as AboutPageSettings;
  await upsertDoc(ABOUT_COLLECTIONS.settings, 'main', next as unknown as Record<string, unknown>);
  await auditAbout(user, 'updated', 'aboutSettings', 'main', 'About Settings');
  return next;
}

export async function getAboutCmsCounts(): Promise<AboutCmsCounts> {
  const [
    history,
    leaders,
    departments,
    orgNodes,
    statistics,
    partners,
    documents,
    messages,
    overview,
  ] = await Promise.all([
    listAboutAdmin<AboutHistoryMilestone>('history'),
    listAboutAdmin<AboutLeader>('leaders'),
    listAboutAdmin<AboutDepartment>('departments'),
    listAboutAdmin<AboutOrgNode>('org'),
    listAboutAdmin<AboutStatistic>('statistics'),
    listAboutAdmin<AboutPartner>('partners'),
    listAboutAdmin<AboutStrategicDocument>('documents'),
    listAboutAdmin<AboutLeadershipMessage>('messages'),
    getAboutOverviewAdmin(),
  ]);

  const countBy = <T extends { status: AboutCmsStatus }>(items: T[], status: AboutCmsStatus) =>
    items.filter((i) => i.status === status).length;

  const awaitingReview =
    countBy(history, 'review') +
    countBy(leaders, 'review') +
    countBy(departments, 'review') +
    countBy(statistics, 'review') +
    countBy(partners, 'review') +
    countBy(documents, 'review') +
    countBy(messages, 'review') +
    (overview?.status === 'review' ? 1 : 0);

  return {
    history: {
      published: countBy(history, 'published'),
      draft: countBy(history, 'draft'),
      review: countBy(history, 'review'),
      archived: countBy(history, 'archived'),
    },
    leaders: {
      published: countBy(leaders, 'published'),
      current: leaders.filter((l) => l.status === 'published' && l.tenure === 'current').length,
      draft: countBy(leaders, 'draft'),
    },
    departments: {
      published: countBy(departments, 'published'),
      draft: countBy(departments, 'draft'),
    },
    orgNodes: {
      published: countBy(orgNodes, 'published'),
      draft: countBy(orgNodes, 'draft'),
    },
    statistics: {
      published: countBy(statistics, 'published'),
      draft: countBy(statistics, 'draft'),
    },
    partners: {
      published: countBy(partners, 'published'),
      draft: countBy(partners, 'draft'),
    },
    documents: {
      published: countBy(documents, 'published'),
      draft: countBy(documents, 'draft'),
    },
    messages: {
      published: countBy(messages, 'published'),
      draft: countBy(messages, 'draft'),
      featuredId: messages.find((m) => m.featured && m.status === 'published')?.id ?? null,
    },
    overviewStatus: overview?.status || 'missing',
    awaitingReview,
  };
}

export async function listRecentlyUpdatedAbout(max = 8): Promise<
  Array<{ entity: string; id: string; label: string; updatedAt: string; status: AboutCmsStatus }>
> {
  const packs = await Promise.all([
    listAboutAdmin<AboutHistoryMilestone>('history').then((items) =>
      items.map((i) => ({
        entity: 'history',
        id: i.id,
        label: i.title?.en || i.yearLabel || i.id,
        updatedAt: i.updatedAt,
        status: i.status,
      })),
    ),
    listAboutAdmin<AboutLeader>('leaders').then((items) =>
      items.map((i) => ({
        entity: 'leadership',
        id: i.id,
        label: i.name?.en || i.slug,
        updatedAt: i.updatedAt,
        status: i.status,
      })),
    ),
    listAboutAdmin<AboutDepartment>('departments').then((items) =>
      items.map((i) => ({
        entity: 'departments',
        id: i.id,
        label: i.name?.en || i.slug,
        updatedAt: i.updatedAt,
        status: i.status,
      })),
    ),
    listAboutAdmin<AboutStatistic>('statistics').then((items) =>
      items.map((i) => ({
        entity: 'statistics',
        id: i.id,
        label: i.label?.en || i.id,
        updatedAt: i.updatedAt,
        status: i.status,
      })),
    ),
  ]);
  return packs
    .flat()
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, max);
}

// Public helpers used by aboutService
export async function listPublishedLeadersCurrent(): Promise<AboutLeader[]> {
  const leaders = await listAboutPublished<AboutLeader>('leaders');
  return leaders.filter((l) => l.tenure === 'current' && l.publicProfileEnabled !== false);
}

export async function listPublishedDepartmentsActive(): Promise<AboutDepartment[]> {
  const deps = await listAboutPublished<AboutDepartment>('departments');
  return deps.filter((d) => d.active !== false);
}

export async function getFeaturedLeadershipMessage(): Promise<AboutLeadershipMessage | null> {
  const messages = await listAboutPublished<AboutLeadershipMessage>('messages');
  return messages.find((m) => m.featured) || messages[0] || null;
}

export type { AboutLocalizedText };
