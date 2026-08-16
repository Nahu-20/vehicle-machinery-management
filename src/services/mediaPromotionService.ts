import {
  ref,
  uploadBytes,
  getBytes,
  deleteObject,
  getMetadata,
} from 'firebase/storage';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import {
  MediaAsset,
  MediaAssetStatus,
  MediaVariant,
} from '../types/media';
import { NewsManagedFeaturedImage } from '../types/news';
import { StaffUser } from '../types/auth';
import { logAuditEvent } from './auditService';
import { localMediaStore } from './localMediaStore';

export interface PromoteMediaOptions {
  mediaId: string;
  articleSlug: string;
  requestId: string;
  staffUser: StaffUser;
}

/**
 * Promotes processed news media variants to public paths for a published article.
 */
export async function promoteNewsMediaAsset(
  options: PromoteMediaOptions
): Promise<NewsManagedFeaturedImage> {
  const { mediaId, articleSlug, requestId, staffUser } = options;

  if (!staffUser || !staffUser.active) {
    throw new Error('Authentication required or staff inactive');
  }

  let asset: MediaAsset | null = null;
  if (db) {
    try {
      const assetRef = doc(db, 'mediaAssets', mediaId);
      const snap = await getDoc(assetRef);
      if (snap.exists()) {
        asset = snap.data() as MediaAsset;
      }
    } catch (err: any) {
      console.warn('[mediaPromotionService] Firestore read mediaAssets notice:', err?.message || err);
    }
  }

  if (!asset) {
    asset = localMediaStore.assets.get(mediaId) || null;
  }

  // Define processed and promoted paths
  const variants: ('hero' | 'card' | 'thumbnail')[] = ['hero', 'card', 'thumbnail'];

  // 1. Attempt to copy processed variants to public Storage paths (non-blocking)
  if (storage) {
    for (const v of variants) {
      const processedPath = `media/processed/news/${mediaId}/${v}.webp`;
      const publicPath = `media/public/news/${articleSlug}/${mediaId}/${v}.webp`;

      const processedRef = ref(storage, processedPath);
      const publicRef = ref(storage, publicPath);

      try {
        const bytes = await getBytes(processedRef);
        await uploadBytes(publicRef, bytes, {
          contentType: 'image/webp',
          cacheControl: 'public, max-age=3600, s-maxage=86400',
          customMetadata: {
            mediaId,
            articleSlug,
            variant: v,
            promotedAt: new Date().toISOString(),
            promotionRequestId: requestId,
          },
        });
      } catch (err: any) {
        console.warn(`[mediaPromotionService] Non-critical: Storage copy to media/public for '${v}' skipped:`, err?.message || err);
        // Public media delivery occurs via server API endpoint /api/media/news/... which reads media/processed/ or localMediaStore
      }
    }
  }

  // 2. Update MediaAsset document state in Firestore (non-blocking)
  if (db) {
    try {
      const assetRef = doc(db, 'mediaAssets', mediaId);
      await updateDoc(assetRef, {
        status: 'public' as MediaAssetStatus,
        articleSlug,
        promotedAt: serverTimestamp(),
        promotionRequestId: requestId,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.warn('[mediaPromotionService] Non-critical: Firestore mediaAssets update skipped:', err?.message || err);
    }
  }

  // 3. Log Authoritative Audit Event
  await logAuditEvent({
    actorUid: staffUser.uid,
    actorEmail: staffUser.email,
    actorDisplayName: staffUser.displayName,
    actorRole: staffUser.role,
    module: 'media',
    action: 'media_promoted',
    result: 'success',
    targetType: 'mediaAsset',
    targetId: mediaId,
    targetLabel: `Media ${mediaId}`,
    source: 'dashboard_ui',
    metadata: {
      articleSlug,
      requestId,
    },
  });

  const managedImage: NewsManagedFeaturedImage = {
    source: 'managed',
    mediaId,
    urls: {
      hero: `/api/media/news/${mediaId}/hero`,
      card: `/api/media/news/${mediaId}/card`,
      thumbnail: `/api/media/news/${mediaId}/thumbnail`,
    },
    width: {
      hero: asset?.variants?.hero?.width || 1600,
      card: asset?.variants?.card?.width || 960,
      thumbnail: asset?.variants?.thumbnail?.width || 480,
    },
    height: {
      hero: asset?.variants?.hero?.height || 900,
      card: asset?.variants?.card?.height || 600,
      thumbnail: asset?.variants?.thumbnail?.height || 300,
    },
    contentType: 'image/webp',
  };

  return managedImage;
}

/**
 * Retires a public media asset when an article is unpublished, archived, or replaced.
 */
export async function retireNewsMediaAsset(
  mediaId: string,
  staffUser: StaffUser,
  reason?: string
): Promise<void> {
  if (!db) return;

  const assetRef = doc(db, 'mediaAssets', mediaId);
  const snap = await getDoc(assetRef);
  if (!snap.exists()) return;

  await updateDoc(assetRef, {
    status: 'retired' as MediaAssetStatus,
    retiredAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logAuditEvent({
    actorUid: staffUser.uid,
    actorEmail: staffUser.email,
    actorDisplayName: staffUser.displayName,
    actorRole: staffUser.role,
    module: 'media',
    action: 'media_retired',
    result: 'success',
    targetType: 'mediaAsset',
    targetId: mediaId,
    targetLabel: `Media ${mediaId}`,
    source: 'dashboard_ui',
    reason: reason || 'Article status change or media replacement',
  });
}

/**
 * Replaces a managed featured image on a published article smoothly.
 */
export async function replaceNewsMediaAsset(options: {
  oldMediaId: string | null;
  newMediaId: string;
  articleSlug: string;
  requestId: string;
  staffUser: StaffUser;
}): Promise<NewsManagedFeaturedImage> {
  const { oldMediaId, newMediaId, articleSlug, requestId, staffUser } = options;

  // 1. Promote new asset first
  const newManagedImage = await promoteNewsMediaAsset({
    mediaId: newMediaId,
    articleSlug,
    requestId,
    staffUser,
  });

  // 2. Only after new asset is promoted, retire old asset if exists
  if (oldMediaId && oldMediaId !== newMediaId) {
    await retireNewsMediaAsset(oldMediaId, staffUser, `Replaced by ${newMediaId}`);

    await logAuditEvent({
      actorUid: staffUser.uid,
      actorEmail: staffUser.email,
      actorDisplayName: staffUser.displayName,
      actorRole: staffUser.role,
      module: 'media',
      action: 'media_replaced',
      result: 'success',
      targetType: 'mediaAsset',
      targetId: newMediaId,
      targetLabel: `Media ${newMediaId}`,
      source: 'dashboard_ui',
      metadata: {
        oldMediaId,
        newMediaId,
        articleSlug,
      },
    });
  }

  return newManagedImage;
}

/**
 * Deletes media variants and staging objects permanently during article purge.
 */
export async function deleteNewsMediaAssetPermanently(
  mediaId: string,
  staffUser: StaffUser
): Promise<void> {
  if (!db || !storage) return;

  if (staffUser.role !== 'superAdmin') {
    throw new Error('Permission denied: Only SuperAdmin can permanently delete media assets');
  }

  const assetRef = doc(db, 'mediaAssets', mediaId);
  const snap = await getDoc(assetRef);
  if (!snap.exists()) return;

  const asset = snap.data() as MediaAsset;

  await updateDoc(assetRef, {
    status: 'cleanup_pending' as MediaAssetStatus,
    updatedAt: serverTimestamp(),
  });

  const variants = ['hero', 'card', 'thumbnail'];
  const deletePathSafe = async (p: string) => {
    try {
      await deleteObject(ref(storage, p));
    } catch {
      // ignore object-not-found
    }
  };

  // Delete public variants
  if (asset.articleSlug) {
    for (const v of variants) {
      await deletePathSafe(`media/public/news/${asset.articleSlug}/${mediaId}/${v}.webp`);
    }
  }

  // Delete processed variants
  for (const v of variants) {
    await deletePathSafe(`media/processed/news/${mediaId}/${v}.webp`);
  }

  // Delete staging source
  if (asset.sourceStoragePath) {
    await deletePathSafe(asset.sourceStoragePath);
  }

  // Update record to deleted
  await updateDoc(assetRef, {
    status: 'deleted' as MediaAssetStatus,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logAuditEvent({
    actorUid: staffUser.uid,
    actorEmail: staffUser.email,
    actorDisplayName: staffUser.displayName,
    actorRole: staffUser.role,
    module: 'media',
    action: 'media_cleanup_completed',
    result: 'success',
    targetType: 'mediaAsset',
    targetId: mediaId,
    targetLabel: `Media ${mediaId}`,
    source: 'dashboard_ui',
  });
}
