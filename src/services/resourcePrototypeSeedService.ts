import { doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { StaffUser } from '../types/auth';
import {
  buildPrototypeResourceDocs,
  countPrototypeResources,
  PROTOTYPE_RESOURCES_SEED_VERSION,
} from '../data/resourcePrototypeSeedData';

const BATCH_LIMIT = 400;

export interface ResourceSeedResult {
  success: boolean;
  seedVersion: string;
  resourcesWritten: number;
  openPublicPdfs: number;
  oboaPrototypes: number;
  sources: number;
  message: string;
}

export async function seedPrototypeResourcesData(actor: StaffUser): Promise<ResourceSeedResult> {
  if (!db) throw new Error('Firestore is not initialized');
  if (!auth?.currentUser) throw new Error('Sign in as staff before seeding resources');
  if (!actor?.uid || actor.active !== true) throw new Error('Active staff required');

  const nowIso = new Date().toISOString();
  const docs = buildPrototypeResourceDocs(actor.uid, nowIso);
  const stats = countPrototypeResources();

  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const slice = docs.slice(i, i + BATCH_LIMIT);
    for (const resource of slice) {
      batch.set(doc(db, 'resources', resource.resourceId), resource);
    }
    await batch.commit();
  }

  return {
    success: true,
    seedVersion: PROTOTYPE_RESOURCES_SEED_VERSION,
    resourcesWritten: docs.length,
    openPublicPdfs: stats.openPublicPdfs,
    oboaPrototypes: stats.oboaPrototypes,
    sources: stats.sources,
    message: `Wrote ${docs.length} source-attributed Resources & Manuals (${PROTOTYPE_RESOURCES_SEED_VERSION}): ${stats.openPublicPdfs} open public PDFs + ${stats.oboaPrototypes} OBoA manuals across ${stats.sources} named sources.`,
  };
}
