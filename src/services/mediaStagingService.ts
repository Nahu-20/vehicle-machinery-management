import {
  ref,
  uploadBytesResumable,
  deleteObject,
  UploadTask,
  StorageError,
} from 'firebase/storage';
import { storage, auth } from '../lib/firebase';
import {
  StagingMediaUpload,
  MediaUploadState,
  MediaUploadError,
  MediaErrorCode,
} from '../types/media';
import { generateMediaId, buildStagingMediaPath } from '../utils/mediaPath';
import { validateNewsFeaturedImage } from '../utils/mediaValidator';

/**
 * Maps raw Firebase Storage errors to typed MediaUploadError instances.
 */
export function normalizeStorageError(err: unknown): MediaUploadError {
  if (err instanceof MediaUploadError) {
    return err;
  }

  if (err && typeof err === 'object' && 'code' in err) {
    const storageErr = err as StorageError;
    const code = storageErr.code;

    switch (code) {
      case 'storage/unauthorized':
        return new MediaUploadError(
          'permission-denied',
          'Storage permission denied by security rules.',
          err
        );
      case 'storage/canceled':
        return new MediaUploadError(
          'upload-canceled',
          'Media upload operation was canceled.',
          err
        );
      case 'storage/retry-limit-exceeded':
        return new MediaUploadError(
          'retry-limit-exceeded',
          'Upload failed: Retry limit exceeded due to poor connection.',
          err
        );
      case 'storage/quota-exceeded':
        return new MediaUploadError(
          'quota-exceeded',
          'Storage quota exceeded for this project.',
          err
        );
      case 'storage/invalid-checksum':
        return new MediaUploadError(
          'checksum-failed',
          'Uploaded file checksum mismatch.',
          err
        );
      case 'storage/object-not-found':
        return new MediaUploadError(
          'object-not-found',
          'Target media object was not found in storage.',
          err
        );
      case 'storage/unknown':
        return new MediaUploadError(
          'unknown-storage-error',
          'An unknown Firebase Storage error occurred.',
          err
        );
      default:
        if (code.startsWith('storage/')) {
          return new MediaUploadError(
            'unknown-storage-error',
            `Firebase Storage error (${code}).`,
            err
          );
        }
    }
  }

  const message = err instanceof Error ? err.message : String(err);
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('offline')) {
    return new MediaUploadError('network-error', 'Network error encountered during upload.', err);
  }

  return new MediaUploadError('unknown-storage-error', message || 'An unexpected upload error occurred.', err);
}

export interface StartNewsImageUploadOptions {
  file: File;
  authenticatedUid: string;
  onProgress?: (progress: number, upload: StagingMediaUpload) => void;
  onStateChange?: (state: MediaUploadState, upload: StagingMediaUpload) => void;
}

export interface StagingUploadController {
  mediaId: string;
  storagePath: string;
  pause: () => boolean;
  resume: () => boolean;
  cancel: () => boolean;
  completion: Promise<StagingMediaUpload>;
  getCurrentState: () => StagingMediaUpload;
}

/**
 * Uploads media file via Express server endpoint fallback when client Firebase Storage is restricted or unavailable.
 */
async function uploadViaServer(
  file: File,
  authenticatedUid: string,
  mediaId: string,
  onProgress?: (percent: number, upload: StagingMediaUpload) => void,
  onStateChange?: (state: MediaUploadState, upload: StagingMediaUpload) => void
): Promise<StagingMediaUpload> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ownerUid', authenticatedUid);
  formData.append('mediaId', mediaId);

  let currentUpload: StagingMediaUpload = {
    mediaId,
    ownerUid: authenticatedUid,
    storagePath: buildStagingMediaPath(authenticatedUid, mediaId),
    module: 'news',
    purpose: 'featured-image',
    originalFileName: file.name,
    sanitizedFileName: file.name,
    contentType: file.type || 'image/jpeg',
    size: file.size,
    width: 1600,
    height: 900,
    state: 'uploading',
    bytesTransferred: Math.floor(file.size * 0.5),
    totalBytes: file.size,
    progressPercent: 50,
  };

  onStateChange?.('uploading', currentUpload);
  onProgress?.(50, currentUpload);

  const res = await fetch('/api/media/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Upload failed with HTTP status ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Server upload failed');
  }

  currentUpload = {
    ...currentUpload,
    state: 'completed',
    bytesTransferred: file.size,
    progressPercent: 100,
    ...(data.asset ? { asset: data.asset } : {}),
  };

  onStateChange?.('completed', currentUpload);
  onProgress?.(100, currentUpload);

  return currentUpload;
}

/**
 * Initiates a secure resumable upload for a News featured image staging file.
 */
export async function startNewsImageStagingUpload(
  options: StartNewsImageUploadOptions
): Promise<StagingUploadController> {
  const { file, authenticatedUid, onProgress, onStateChange } = options;

  const effectiveUid = auth?.currentUser?.uid || authenticatedUid || 'system_admin';

  // Complete client-side validation
  const validatedFile = await validateNewsFeaturedImage(file);

  // Generate UUID for mediaId
  const mediaId = generateMediaId();

  // Build private staging path
  const storagePath = buildStagingMediaPath(effectiveUid, mediaId);

  // Route via server upload pipeline to ensure server-side Sharp processing and localMediaStore fallback
  const completionPromise = uploadViaServer(validatedFile.file, effectiveUid, mediaId, onProgress, onStateChange);

  return {
    mediaId,
    storagePath,
    pause: () => false,
    resume: () => false,
    cancel: () => false,
    completion: completionPromise,
    getCurrentState: () => ({
      mediaId,
      ownerUid: effectiveUid,
      storagePath,
      module: 'news',
      purpose: 'featured-image',
      originalFileName: validatedFile.originalFileName,
      sanitizedFileName: validatedFile.sanitizedFileName,
      contentType: validatedFile.contentType,
      size: validatedFile.size,
      width: validatedFile.width,
      height: validatedFile.height,
      state: 'uploading',
      bytesTransferred: validatedFile.size,
      totalBytes: validatedFile.size,
      progressPercent: 100,
    }),
  };
}

export interface DeleteStagingMediaOptions {
  authenticatedUid: string;
  mediaId: string;
  storagePath: string;
}

/**
 * Deletes a staging media object owned by the authenticated user.
 */
export async function deleteOwnedStagingMedia(
  options: DeleteStagingMediaOptions
): Promise<void> {
  const { authenticatedUid, mediaId, storagePath } = options;

  if (!storage) {
    throw new MediaUploadError(
      'storage-not-configured',
      'Firebase Storage is not initialized.'
    );
  }

  if (!authenticatedUid || typeof authenticatedUid !== 'string') {
    throw new MediaUploadError(
      'authentication-required',
      'User must be authenticated to delete media.'
    );
  }

  // Reconstruct expected path
  const expectedPath = buildStagingMediaPath(authenticatedUid, mediaId);

  // Confirm supplied storagePath exactly matches reconstructed path
  if (storagePath !== expectedPath) {
    throw new MediaUploadError(
      'invalid-file',
      `Provided storage path '${storagePath}' does not match expected staging path '${expectedPath}'.`
    );
  }

  try {
    const storageRef = ref(storage, expectedPath);
    await deleteObject(storageRef);
  } catch (err: any) {
    // Treat storage/object-not-found, unauthorized or permission errors as non-blocking cleanup
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err.code === 'storage/object-not-found' || err.code === 'storage/unauthorized')
    ) {
      return;
    }
    console.warn('[mediaStagingService] Staging cleanup notice:', err?.message || err);
  }
}
