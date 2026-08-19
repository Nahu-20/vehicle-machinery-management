import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { BureauResource, ResourceLifecycleStatus } from '../types/resource';
import { Publication } from '../types';
import { StaffUser } from '../types/auth';

function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function resourceToPublication(resource: BureauResource): Publication {
  return {
    id: resource.resourceId,
    titleKey: resource.slug,
    descriptionKey: `${resource.slug}_desc`,
    defaultTitle: resource.title,
    defaultDescription: resource.summary || resource.description || '',
    type: resource.type,
    category: resource.category,
    format: resource.format,
    fileSize: resource.fileSize,
    language: resource.language,
    downloadUrl: resource.downloadUrl || '#',
    publishedDate: resource.publishedDateLabel,
    updatedDate: resource.updatedAt
      ? new Date(resource.updatedAt).toLocaleDateString()
      : undefined,
    version: resource.versionLabel,
    pagesOrDuration: resource.pagesOrDuration,
    authorOrOffice: resource.authorOrOffice,
    targetAudience: resource.targetAudience,
    tags: resource.tags,
    featured: resource.featured,
    downloadsCount: resource.downloadsCount ?? 0,
    tableOfContents: resource.tableOfContents,
    previewSummary: resource.previewSummary || resource.summary,
    coverImage: resource.coverImage,
    videoEmbedUrl: resource.videoEmbedUrl,
    videoDuration: resource.videoDuration,
  };
}

export async function getAllResources(): Promise<BureauResource[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'resources'));
  return snap.docs
    .map((d) => d.data() as BureauResource)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export async function listPublishedResources(): Promise<BureauResource[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'resources'), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as BureauResource)
      .sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
  } catch (err) {
    console.warn('[listPublishedResources]', err);
    return [];
  }
}

export async function getResource(resourceId: string): Promise<BureauResource | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'resources', resourceId));
  if (!snap.exists()) return null;
  return snap.data() as BureauResource;
}

function assertPublishable(input: { status?: ResourceLifecycleStatus; downloadUrl?: string }) {
  if (input.status !== 'published') return;
  const url = (input.downloadUrl || '').trim();
  if (!url || url === '#') {
    throw new Error('Published resources need a download URL or uploaded file.');
  }
}

export async function saveResource(
  actor: StaffUser,
  input: Partial<BureauResource> &
    Pick<BureauResource, 'resourceId' | 'title' | 'type' | 'category' | 'format' | 'language'>,
  expectedVersion?: number
): Promise<BureauResource> {
  if (!db) throw new Error('Firestore is not initialized');
  if (!auth?.currentUser) throw new Error('Sign in required');
  if (!actor?.uid || actor.active !== true) throw new Error('Active staff required');

  const existing = await getResource(input.resourceId);
  if (existing && typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
    throw new Error(
      `Version conflict: expected ${expectedVersion}, got ${existing.version}. Reload and retry.`
    );
  }

  const status = (input.status || existing?.status || 'draft') as ResourceLifecycleStatus;
  const downloadUrl = input.downloadUrl ?? existing?.downloadUrl ?? '#';
  assertPublishable({ status, downloadUrl });

  const nowIso = new Date().toISOString();
  const next: BureauResource = {
    resourceId: input.resourceId,
    slug: input.slug || existing?.slug || slugify(input.title),
    title: input.title.trim(),
    summary: (input.summary ?? existing?.summary ?? '').trim(),
    description: input.description ?? existing?.description,
    type: input.type,
    category: input.category,
    format: input.format,
    language: input.language,
    fileSize: input.fileSize ?? existing?.fileSize,
    downloadUrl,
    storagePath: input.storagePath ?? existing?.storagePath,
    coverImage: input.coverImage ?? existing?.coverImage,
    videoEmbedUrl: input.videoEmbedUrl ?? existing?.videoEmbedUrl,
    videoDuration: input.videoDuration ?? existing?.videoDuration,
    authorOrOffice: input.authorOrOffice ?? existing?.authorOrOffice,
    versionLabel: input.versionLabel ?? existing?.versionLabel,
    pagesOrDuration: input.pagesOrDuration ?? existing?.pagesOrDuration,
    publishedDateLabel: input.publishedDateLabel ?? existing?.publishedDateLabel,
    tags: input.tags ?? existing?.tags ?? [],
    targetAudience: input.targetAudience ?? existing?.targetAudience ?? [],
    tableOfContents: input.tableOfContents ?? existing?.tableOfContents ?? [],
    previewSummary: input.previewSummary ?? existing?.previewSummary,
    featured: input.featured ?? existing?.featured ?? false,
    downloadsCount: input.downloadsCount ?? existing?.downloadsCount ?? 0,
    status,
    sourceOrganization: input.sourceOrganization ?? existing?.sourceOrganization,
    sourceNotes: input.sourceNotes ?? existing?.sourceNotes,
    version: (existing?.version || 0) + 1,
    createdAt: existing?.createdAt || nowIso,
    createdBy: existing?.createdBy || actor.uid,
    updatedAt: nowIso,
    updatedBy: actor.uid,
    publishedAt: status === 'published' ? existing?.publishedAt || nowIso : existing?.publishedAt || null,
    publishedBy: status === 'published' ? existing?.publishedBy || actor.uid : existing?.publishedBy || null,
  };

  await setDoc(doc(db, 'resources', next.resourceId), next);
  return next;
}

export async function deleteResource(resourceId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized');
  await deleteDoc(doc(db, 'resources', resourceId));
}

/** Public +1 download counter (rules allow only this field bump on published docs). */
export async function recordResourceDownload(resourceId: string): Promise<void> {
  if (!db || !resourceId) return;
  // Static catalog ids (pub-*) are not in Firestore
  if (resourceId.startsWith('pub-') || resourceId.startsWith('bundle-')) return;
  try {
    await updateDoc(doc(db, 'resources', resourceId), {
      downloadsCount: increment(1),
    });
  } catch (err) {
    console.warn('[recordResourceDownload]', err);
  }
}

/** Open file and record analytics. Returns false when URL is missing. */
export async function openResourceDownload(
  resourceId: string,
  downloadUrl?: string
): Promise<boolean> {
  const url = (downloadUrl || '').trim();
  void recordResourceDownload(resourceId);
  if (!url || url === '#') return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export { slugify as slugifyResourceTitle };
