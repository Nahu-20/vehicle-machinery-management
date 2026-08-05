import {
  ref,
  uploadBytesResumable,
  deleteObject,
  UploadTask,
  StorageError,
} from 'firebase/storage';
import { storage } from '../lib/firebase';
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
 * Initiates a secure resumable upload for a News featured image staging file.
 */
export async function startNewsImageStagingUpload(
  options: StartNewsImageUploadOptions
): Promise<StagingUploadController> {
  const { file, authenticatedUid, onProgress, onStateChange } = options;

  // 1. Require initialized Storage
  if (!storage) {
    throw new MediaUploadError(
      'storage-not-configured',
      'Firebase Storage is not initialized or configured.'
    );
  }

  // 2. Require authenticated UID
  if (!authenticatedUid || typeof authenticatedUid !== 'string' || authenticatedUid.trim().length === 0) {
    throw new MediaUploadError(
      'authentication-required',
      'User must be authenticated to upload media.'
    );
  }

  // 3. Complete client-side validation
  const validatedFile = await validateNewsFeaturedImage(file);

  // 4. Generate UUID for mediaId
  const mediaId = generateMediaId();

  // 5. Build private staging path
  const storagePath = buildStagingMediaPath(authenticatedUid, mediaId);

  // 6. Create Storage reference
  const storageRef = ref(storage, storagePath);

  // Initial State Record
  let currentUpload: StagingMediaUpload = {
    mediaId,
    ownerUid: authenticatedUid,
    storagePath,
    module: 'news',
    purpose: 'featured-image',
    originalFileName: validatedFile.originalFileName,
    sanitizedFileName: validatedFile.sanitizedFileName,
    contentType: validatedFile.contentType,
    size: validatedFile.size,
    width: validatedFile.width,
    height: validatedFile.height,
    state: 'ready',
    bytesTransferred: 0,
    totalBytes: validatedFile.size,
    progressPercent: 0,
  };

  const updateState = (newState: MediaUploadState, extraProps?: Partial<StagingMediaUpload>) => {
    currentUpload = {
      ...currentUpload,
      ...extraProps,
      state: newState,
    };
    if (onStateChange) {
      try {
        onStateChange(newState, currentUpload);
      } catch {
        // ignore callback errors
      }
    }
  };

  // 7. Start uploadBytesResumable with strict metadata
  const uploadMetadata = {
    contentType: validatedFile.contentType,
    cacheControl: 'private,no-store',
    customMetadata: {
      mediaId,
      ownerUid: authenticatedUid,
      module: 'news' as const,
      purpose: 'featured-image' as const,
      originalFileName: validatedFile.sanitizedFileName,
      uploadedFrom: 'admin-news-editor',
      schemaVersion: '1',
    },
  };

  let uploadTask: UploadTask;
  try {
    uploadTask = uploadBytesResumable(storageRef, validatedFile.file, uploadMetadata);
    updateState('uploading');
  } catch (err) {
    const normalized = normalizeStorageError(err);
    updateState('failed');
    throw normalized;
  }

  let isCanceledByUser = false;

  const completionPromise = new Promise<StagingMediaUpload>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const total = snapshot.totalBytes || validatedFile.size || 1;
        const transferred = snapshot.bytesTransferred || 0;
        const rawPercent = (transferred / total) * 100;
        const clampedPercent = Math.min(100, Math.max(0, Math.round(rawPercent * 100) / 100));

        let newState: MediaUploadState = 'uploading';
        if (snapshot.state === 'paused') {
          newState = 'paused';
        } else if (snapshot.state === 'running') {
          newState = 'uploading';
        }

        currentUpload = {
          ...currentUpload,
          bytesTransferred: transferred,
          totalBytes: total,
          progressPercent: clampedPercent,
          state: newState,
        };

        if (onProgress) {
          try {
            onProgress(clampedPercent, currentUpload);
          } catch {
            // ignore
          }
        }
        if (onStateChange && currentUpload.state !== newState) {
          try {
            onStateChange(newState, currentUpload);
          } catch {
            // ignore
          }
        }
      },
      (error) => {
        if (isCanceledByUser || error.code === 'storage/canceled') {
          updateState('canceled');
          const cancelErr = new MediaUploadError('upload-canceled', 'Upload was canceled by user.');
          reject(cancelErr);
        } else {
          updateState('failed');
          const normalized = normalizeStorageError(error);
          reject(normalized);
        }
      },
      async () => {
        // Upload completed successfully
        updateState('completed', {
          bytesTransferred: validatedFile.size,
          progressPercent: 100,
        });
        if (onProgress) {
          try {
            onProgress(100, currentUpload);
          } catch {
            // ignore
          }
        }
        resolve(currentUpload);
      }
    );
  });

  return {
    mediaId,
    storagePath,
    pause: () => {
      if (uploadTask && currentUpload.state === 'uploading') {
        const success = uploadTask.pause();
        if (success) updateState('paused');
        return success;
      }
      return false;
    },
    resume: () => {
      if (uploadTask && currentUpload.state === 'paused') {
        const success = uploadTask.resume();
        if (success) updateState('uploading');
        return success;
      }
      return false;
    },
    cancel: () => {
      if (
        uploadTask &&
        (currentUpload.state === 'uploading' || currentUpload.state === 'paused')
      ) {
        isCanceledByUser = true;
        const success = uploadTask.cancel();
        updateState('canceled');
        return success;
      }
      return false;
    },
    completion: completionPromise,
    getCurrentState: () => ({ ...currentUpload }),
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
    // Treat storage/object-not-found as an idempotent successful cleanup
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === 'storage/object-not-found'
    ) {
      return;
    }
    throw normalizeStorageError(err);
  }
}
