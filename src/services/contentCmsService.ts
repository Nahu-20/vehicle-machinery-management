/**
 * Section content CMS — Firestore-backed, for the four sections of the
 * Bureau's IA that had no pages of their own.
 *
 * This deliberately mirrors the governance shape of aboutCmsService (draft →
 * review → published → archived, localised text, optimistic version checks,
 * audit on every write) rather than refactoring that file: it is a teammate's
 * work that landed on upstream/main days ago and is still moving, so
 * rewriting it here would be a merge conflict waiting to happen. The shared
 * vocabulary lives in src/types/about.ts, which both import.
 *
 * One collection serves all four sections, keyed by `sectionId` — the entries
 * have identical shape, so four collections would only mean four copies of
 * the same rules and the same admin screen.
 *
 * The public site must only ever read status === 'published'.
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
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { StaffUser } from '../types/auth';
import { hasPermission } from '../lib/permissions';
import { logAuditEvent } from './auditService';
import type { AboutCmsMeta, AboutCmsStatus } from '../types/about';
import type { ContentEntry, ContentSectionId } from '../types/content';

export const CONTENT_COLLECTION = 'sectionContent';

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

export function slugifyContent(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function assertContentWrite(user: StaffUser, status: AboutCmsStatus, isCreate: boolean) {
  if (status === 'published' && !hasPermission(user, 'content.publish')) {
    throw new Error('content.publish permission required to publish section content.');
  }
  if (isCreate) {
    if (!hasPermission(user, 'content.create') && !hasPermission(user, 'content.edit')) {
      throw new Error('content.create permission required.');
    }
    return;
  }
  if (!hasPermission(user, 'content.edit') && !hasPermission(user, 'content.publish')) {
    throw new Error('content.edit permission required.');
  }
}

async function audit(
  user: StaffUser,
  action: 'created' | 'updated' | 'published' | 'archived' | 'submitted_for_review' | 'returned_to_draft',
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
      module: 'content',
      action,
      result: 'success',
      targetType: 'sectionContent',
      targetId,
      targetLabel,
      previousStatus,
      newStatus,
      source: 'dashboard_ui',
    });
  } catch (err) {
    console.warn('[contentCms] audit failed', err);
  }
}

const byOrder = (a: ContentEntry, b: ContentEntry) =>
  (a.displayOrder || 0) - (b.displayOrder || 0);

/** Everything in a section, whatever its status — admin only. */
export async function listContentAdmin(sectionId?: ContentSectionId): Promise<ContentEntry[]> {
  if (!db) return [];
  try {
    const base = collection(db, CONTENT_COLLECTION);
    const snap = await getDocs(
      sectionId ? query(base, where('sectionId', '==', sectionId)) : base,
    );
    return snap.docs
      .map((d) => ({ ...(d.data() as object), id: d.id } as ContentEntry))
      .sort(byOrder);
  } catch (err) {
    console.warn('[contentCms] listContentAdmin', err);
    return [];
  }
}

/** Published entries only — the shape the public site is allowed to read. */
export async function listContentPublished(
  sectionId: ContentSectionId,
  topicId?: string,
): Promise<ContentEntry[]> {
  if (!db) return [];
  try {
    const clauses = [
      where('sectionId', '==', sectionId),
      where('status', '==', 'published'),
    ];
    if (topicId) clauses.push(where('topicId', '==', topicId));
    const snap = await getDocs(query(collection(db, CONTENT_COLLECTION), ...clauses));
    const now = Date.now();
    return snap.docs
      .map((d) => ({ ...(d.data() as object), id: d.id } as ContentEntry))
      // An expired tender or call is not current content.
      .filter((e) => !e.expiresAt || new Date(e.expiresAt).getTime() >= now)
      .sort(byOrder);
  } catch (err) {
    console.warn('[contentCms] listContentPublished', err);
    return [];
  }
}

export async function getContentById(id: string): Promise<ContentEntry | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, CONTENT_COLLECTION, id));
  if (!snap.exists()) return null;
  return { ...(snap.data() as object), id: snap.id } as ContentEntry;
}

export async function saveContentEntry(
  user: StaffUser,
  data: ContentEntry,
  options?: { expectedVersion?: number },
): Promise<ContentEntry> {
  if (!db) throw new Error('Firestore is not configured.');

  const existing = await getContentById(data.id);
  if (existing && options?.expectedVersion != null && existing.version !== options.expectedVersion) {
    throw new Error(
      `Version conflict on ${data.id} (v${existing.version}). Refresh and try again.`,
    );
  }

  const isCreate = !existing;
  const next = {
    ...existing,
    ...data,
    ...actorFields(user, existing || undefined, isCreate),
    id: data.id,
  } as ContentEntry;

  assertContentWrite(user, next.status, isCreate);

  if (next.status === 'published') {
    next.publishedAt = nowIso();
    next.publishedBy = user.uid;
    next.publishedByName = user.displayName;
  }

  await setDoc(doc(db, CONTENT_COLLECTION, data.id), { ...next, id: data.id }, { merge: true });
  await audit(
    user,
    isCreate ? 'created' : next.status === 'published' ? 'published' : 'updated',
    data.id,
    next.title?.en || next.slug || data.id,
    existing?.status,
    next.status,
  );
  return next;
}

export async function setContentStatus(
  user: StaffUser,
  id: string,
  status: AboutCmsStatus,
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  const existing = await getContentById(id);
  if (!existing) throw new Error('Record not found');
  assertContentWrite(user, status, false);

  const next = { ...existing, status, ...actorFields(user, existing, false) } as ContentEntry;
  if (status === 'published') {
    next.publishedAt = nowIso();
    next.publishedBy = user.uid;
    next.publishedByName = user.displayName;
  }
  await setDoc(doc(db, CONTENT_COLLECTION, id), next, { merge: true });

  const action =
    status === 'published'
      ? 'published'
      : status === 'archived'
        ? 'archived'
        : status === 'review'
          ? 'submitted_for_review'
          : 'returned_to_draft';
  await audit(user, action, id, next.title?.en || id, existing.status, status);
}

/** Published content is archived rather than destroyed; drafts are removed. */
export async function deleteContentEntry(user: StaffUser, id: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.');
  const existing = await getContentById(id);
  if (!existing) return;
  if (existing.status === 'published') {
    await setContentStatus(user, id, 'archived');
    return;
  }
  await deleteDoc(doc(db, CONTENT_COLLECTION, id));
  await audit(user, 'archived', id, existing.title?.en || id, existing.status, 'deleted');
}

export async function getContentCounts(): Promise<Record<ContentSectionId, number>> {
  const all = await listContentAdmin();
  return all.reduce(
    (acc, entry) => {
      acc[entry.sectionId] = (acc[entry.sectionId] || 0) + 1;
      return acc;
    },
    { initiatives: 0, plans: 0, opportunities: 0, resources: 0 } as Record<ContentSectionId, number>,
  );
}
