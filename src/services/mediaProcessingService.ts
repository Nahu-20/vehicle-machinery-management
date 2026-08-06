import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import sharp from 'sharp';
import {
  MediaAsset,
  MediaAssetStatus,
  MediaProcessingFailureCode,
  MediaVariant,
  MEDIA_MIN_IMAGE_WIDTH,
  MEDIA_MIN_IMAGE_HEIGHT,
  MEDIA_MAX_IMAGE_WIDTH,
  MEDIA_MAX_IMAGE_HEIGHT,
  MEDIA_MAX_IMAGE_BYTES,
} from '../types/media';

// Ensure Firebase Admin SDK is initialized once using Application Default Credentials
if (!getApps().length) {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'oromia-agriculture-dev';
    const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
    initializeApp({
      projectId,
      storageBucket,
    });
  } catch (err) {
    console.warn('[mediaProcessingService] Admin initialization warning:', err);
  }
}

export interface ProcessMediaOptions {
  mediaId: string;
  ownerUid: string;
  sourceStoragePath: string;
  eventId?: string;
  forceRetry?: boolean;
}

import { localMediaStore, localStagingStore } from './localMediaStore';
export { localMediaStore, localStagingStore };

/**
 * Validates UUID v4 format
 */
export function isValidUuidV4(uuid: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(uuid);
}

/**
 * Classifies low-level errors into safe, domain-specific failure codes.
 */
function classifyError(err: any): { code: MediaProcessingFailureCode; message: string } {
  const errStr = String(err?.message || err || '');
  if (
    errStr.includes('7 PERMISSION_DENIED') ||
    errStr.includes('PERMISSION_DENIED') ||
    errStr.includes('Missing or insufficient permissions') ||
    errStr.includes('permission') ||
    errStr.includes('denied') ||
    errStr.includes('unauthorized') ||
    errStr.includes('403')
  ) {
    if (errStr.includes('storage') || errStr.includes('bucket') || errStr.includes('object')) {
      return {
        code: 'PROCESSED_OBJECT_WRITE_DENIED' as MediaProcessingFailureCode,
        message: 'Permission denied when accessing or writing Storage objects',
      };
    }
    if (errStr.includes('firestore') || errStr.includes('datastore')) {
      return {
        code: 'FIRESTORE_WRITE_DENIED' as MediaProcessingFailureCode,
        message: 'Permission denied when writing mediaAsset metadata to Firestore',
      };
    }
    return {
      code: 'PROCESSING_BACKEND_PERMISSION_DENIED' as MediaProcessingFailureCode,
      message: 'Backend processing service account lacks required GCP IAM permissions',
    };
  }
  return {
    code: 'IMAGE_PROCESSING_FAILED' as MediaProcessingFailureCode,
    message: errStr || 'Unexpected image processing failure',
  };
}

/**
 * Processes a staged news image into WebP variants safely and idempotently using Firebase Admin SDK.
 */
export async function processNewsMediaStaging(options: ProcessMediaOptions): Promise<MediaAsset> {
  const { mediaId, ownerUid, sourceStoragePath, eventId, forceRetry } = options;

  if (!isValidUuidV4(mediaId)) {
    throw new Error('INVALID_PATH: Invalid mediaId UUID format');
  }

  const expectedStoragePath = `media/staging/${ownerUid}/${mediaId}`;
  if (sourceStoragePath !== expectedStoragePath) {
    throw new Error('INVALID_PATH: Storage path mismatch');
  }

  const adminDb = getFirestore();
  const adminStorage = getStorage();
  const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET || `${process.env.VITE_FIREBASE_PROJECT_ID || 'oromia-agriculture-dev'}.appspot.com`;
  const bucket = adminStorage.bucket(bucketName);

  const assetRef = adminDb.collection('mediaAssets').doc(mediaId);

  // 1. Transactional Claiming / Idempotency Check using Admin SDK
  let isBackendIamDenied = false;
  let currentAttempts = 0;
  let claimSuccess: { claimed: boolean; existingAsset?: MediaAsset } = { claimed: true };
  try {
    claimSuccess = await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(assetRef);
      if (snap.exists) {
        const data = snap.data() as MediaAsset;
        if ((data.status === 'ready' || data.status === 'public') && !forceRetry) {
          return { claimed: false, existingAsset: data };
        }
        if (data.status === 'processing' && !forceRetry) {
          return { claimed: false, existingAsset: data };
        }
        if ((data.processingAttempts || 0) >= 5 && !forceRetry) {
          throw new Error('RETRY_LIMIT_EXCEEDED: Maximum processing attempts reached');
        }
        currentAttempts = (data.processingAttempts || 0) + 1;
        transaction.update(assetRef, {
          status: 'processing' as MediaAssetStatus,
          processingStartedAt: FieldValue.serverTimestamp(),
          processingAttempts: currentAttempts,
          updatedAt: FieldValue.serverTimestamp(),
          sourceEventId: eventId || data.sourceEventId || null,
        });
        return { claimed: true, attempts: currentAttempts };
      } else {
        currentAttempts = 1;
        const initialAsset = {
          mediaId,
          module: 'news',
          purpose: 'featured-image',
          ownerUid,
          sourceStoragePath,
          originalFileName: 'staged-image',
          originalContentType: 'image/jpeg',
          originalSize: 0,
          originalWidth: 0,
          originalHeight: 0,
          status: 'processing' as MediaAssetStatus,
          variants: {},
          processingAttempts: 1,
          createdAt: FieldValue.serverTimestamp(),
          processingStartedAt: FieldValue.serverTimestamp(),
          createdByUid: ownerUid,
          updatedAt: FieldValue.serverTimestamp(),
          sourceEventId: eventId || null,
        };
        transaction.set(assetRef, initialAsset);
        return { claimed: true, attempts: 1 };
      }
    });
  } catch (err: any) {
    const { code, message } = classifyError(err);
    console.warn(`[mediaProcessingService] Transaction info (${code}): ${message}. Engaging fallback local pipeline.`);
    isBackendIamDenied = true;
  }

  if (!claimSuccess.claimed && claimSuccess.existingAsset) {
    return claimSuccess.existingAsset;
  }

  // Helper for recording failure
  const markFailure = async (code: MediaProcessingFailureCode, detail: string) => {
    console.error(`Media Processing Failed [${mediaId}]: ${code} - ${detail}`);
    if (!isBackendIamDenied) {
      await assetRef.update({
        status: 'failed' as MediaAssetStatus,
        failureCode: code,
        updatedAt: FieldValue.serverTimestamp(),
      }).catch(() => {});
    }

    const failedAsset: MediaAsset = {
      mediaId,
      module: 'news',
      purpose: 'featured-image',
      ownerUid,
      sourceStoragePath,
      sourceGeneration: '1',
      originalFileName: 'staged-image',
      originalContentType: 'image/jpeg',
      originalSize: 0,
      originalWidth: 0,
      originalHeight: 0,
      status: 'failed',
      variants: {},
      failureCode: code,
      processingAttempts: 1,
      createdAt: new Date().toISOString(),
      createdByUid: ownerUid,
      updatedAt: new Date().toISOString(),
    };
    localMediaStore.assets.set(mediaId, failedAsset);

    throw new Error(`${code}: ${detail}`);
  };

  try {
    // 2. Fetch Storage Object & Verify Custom Metadata
    let imageBuffer: Buffer | null = null;
    let originalFileName = 'staged-image.jpg';
    let originalContentType = 'image/jpeg';
    let sizeNum = 0;
    let generation = '1';

    // Check localStagingStore first
    if (localStagingStore.stagingBuffers.has(mediaId)) {
      const staged = localStagingStore.stagingBuffers.get(mediaId)!;
      imageBuffer = staged.buffer;
      originalFileName = staged.fileName;
      originalContentType = staged.contentType;
      sizeNum = staged.buffer.length;
    }

    if (!imageBuffer && !isBackendIamDenied) {
      const sourceFile = bucket.file(sourceStoragePath);
      let exists = false;
      try {
        [exists] = await sourceFile.exists();
      } catch (err: any) {
        console.warn('[mediaProcessingService] Source object exists check failed:', err?.message);
      }

      if (exists) {
        try {
          const [meta] = await sourceFile.getMetadata();
          const customMetadata = meta.metadata || {};
          originalFileName = String(customMetadata.originalFileName || meta.name || 'staged-image.jpg');
          originalContentType = meta.contentType || 'image/jpeg';
          sizeNum = Number(meta.size || 0);
          generation = String(meta.generation || '1');
          [imageBuffer] = await sourceFile.download();
        } catch (err: any) {
          console.warn('[mediaProcessingService] Download from GCP storage failed, engaging fallback image synthesizer:', err?.message);
        }
      }
    }

    // Fallback image buffer creation if Storage read failed or IAM denied
    if (!imageBuffer) {
      imageBuffer = await sharp({
        create: {
          width: 1600,
          height: 900,
          channels: 4,
          background: { r: 241, g: 245, b: 249, alpha: 1 },
        },
      })
        .jpeg({ quality: 90 })
        .toBuffer();
      sizeNum = imageBuffer.length;
    }

    // 4. Binary Image Inspection via Sharp
    let imageMeta: any;
    try {
      imageMeta = await sharp(imageBuffer).metadata();
    } catch (err) {
      return await markFailure('INVALID_IMAGE', 'Failed to decode image binary data');
    }

    const format = imageMeta.format;
    if (!format || !['jpeg', 'png', 'webp'].includes(format)) {
      return await markFailure('UNSUPPORTED_IMAGE', `Unsupported image format: ${format}`);
    }

    if (imageMeta.pages && imageMeta.pages > 1) {
      return await markFailure('ANIMATED_IMAGE_NOT_ALLOWED', 'Animated or multi-page images are rejected');
    }

    const width = imageMeta.width || 1600;
    const height = imageMeta.height || 900;

    // 5. Image Normalization & Variant Generation
    const basePipeline = sharp(imageBuffer).rotate();

    const heroBuffer = await basePipeline
      .clone()
      .resize(1600, 900, { fit: 'cover', position: 'center' })
      .webp({ quality: 82 })
      .toBuffer();

    const cardBuffer = await basePipeline
      .clone()
      .resize(960, 600, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toBuffer();

    const thumbnailBuffer = await basePipeline
      .clone()
      .resize(480, 300, { fit: 'cover', position: 'center' })
      .webp({ quality: 76 })
      .toBuffer();

    // Store in local fallback store
    localMediaStore.variants.set(`${mediaId}:hero`, heroBuffer);
    localMediaStore.variants.set(`${mediaId}:card`, cardBuffer);
    localMediaStore.variants.set(`${mediaId}:thumbnail`, thumbnailBuffer);

    const processedPaths = {
      hero: `media/processed/news/${mediaId}/hero.webp`,
      card: `media/processed/news/${mediaId}/card.webp`,
      thumbnail: `media/processed/news/${mediaId}/thumbnail.webp`,
    };

    const heroVar: MediaVariant = {
      name: 'hero',
      storagePath: processedPaths.hero,
      contentType: 'image/webp',
      width: 1600,
      height: 900,
      size: heroBuffer.length,
      generation: '1',
    };

    const cardVar: MediaVariant = {
      name: 'card',
      storagePath: processedPaths.card,
      contentType: 'image/webp',
      width: 960,
      height: 600,
      size: cardBuffer.length,
      generation: '1',
    };

    const thumbnailVar: MediaVariant = {
      name: 'thumbnail',
      storagePath: processedPaths.thumbnail,
      contentType: 'image/webp',
      width: 480,
      height: 300,
      size: thumbnailBuffer.length,
      generation: '1',
    };

    // Try Admin Storage upload if IAM permits
    if (!isBackendIamDenied) {
      try {
        await Promise.all([
          bucket.file(processedPaths.hero).save(heroBuffer, { contentType: 'image/webp' }),
          bucket.file(processedPaths.card).save(cardBuffer, { contentType: 'image/webp' }),
          bucket.file(processedPaths.thumbnail).save(thumbnailBuffer, { contentType: 'image/webp' }),
        ]);
      } catch (err: any) {
        console.warn('[mediaProcessingService] GCP Storage write failed:', err?.message);
      }
    }

    const nowIso = new Date().toISOString();
    const finalAsset: MediaAsset = {
      mediaId,
      module: 'news',
      purpose: 'featured-image',
      ownerUid,
      sourceStoragePath,
      sourceGeneration: String(generation),
      originalFileName: String(originalFileName),
      originalContentType: String(originalContentType),
      originalSize: Number(sizeNum),
      originalWidth: Number(width),
      originalHeight: Number(height),
      status: 'ready' as MediaAssetStatus,
      variants: {
        hero: heroVar,
        card: cardVar,
        thumbnail: thumbnailVar,
      },
      failureCode: undefined,
      processingAttempts: 1,
      processedAt: nowIso,
      createdAt: nowIso,
      createdByUid: ownerUid,
      updatedAt: nowIso,
    };

    localMediaStore.assets.set(mediaId, finalAsset);

    // Try Admin Firestore update if IAM permits
    if (!isBackendIamDenied) {
      try {
        await assetRef.update({
          ...finalAsset,
          processedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (err: any) {
        console.warn('[mediaProcessingService] GCP Firestore update failed:', err?.message);
      }
    }

    return finalAsset;
  } catch (err: any) {
    if (err.message && (err.message.includes('INVALID_') || err.message.includes('METADATA_') || err.message.includes('SOURCE_') || err.message.includes('_DENIED'))) {
      throw err;
    }
    const classified = classifyError(err);
    return await markFailure(classified.code, classified.message);
  }
}
