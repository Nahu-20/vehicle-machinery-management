export const MEDIA_MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MiB

export const MEDIA_MIN_IMAGE_WIDTH = 800;
export const MEDIA_MIN_IMAGE_HEIGHT = 450;

export const MEDIA_MAX_IMAGE_WIDTH = 8000;
export const MEDIA_MAX_IMAGE_HEIGHT = 8000;

export const MEDIA_ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type MediaAllowedImageType = (typeof MEDIA_ALLOWED_IMAGE_TYPES)[number];

export type MediaModule = 'news';

export type MediaPurpose = 'featured-image';

export type MediaUploadState =
  | 'validating'
  | 'ready'
  | 'uploading'
  | 'paused'
  | 'completed'
  | 'canceled'
  | 'failed';

export interface ValidatedMediaFile {
  file: File;
  originalFileName: string;
  sanitizedFileName: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
  width: number;
  height: number;
}

export interface StagingMediaUpload {
  mediaId: string;
  ownerUid: string;
  storagePath: string;
  module: 'news';
  purpose: 'featured-image';
  originalFileName: string;
  sanitizedFileName: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
  state: MediaUploadState;
  bytesTransferred: number;
  totalBytes: number;
  progressPercent: number;
}

export interface NewsStagedImageReference {
  mediaId: string;
  ownerUid: string;
  storagePath: string;
  originalFileName: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
  status: 'staged';
  uploadedAt?: string;
}

export type MediaAssetStatus =
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'promotion_pending'
  | 'public'
  | 'retired'
  | 'failed'
  | 'cleanup_pending'
  | 'deleted';

export type MediaVariantName = 'hero' | 'card' | 'thumbnail';

export interface MediaVariant {
  name: MediaVariantName;
  storagePath: string;
  contentType: 'image/webp';
  width: number;
  height: number;
  size: number;
  generation: string;
  checksum?: string;
}

export interface MediaAsset {
  mediaId: string;

  module: 'news';
  purpose: 'featured-image';

  ownerUid: string;

  sourceStoragePath: string;
  sourceGeneration: string;

  originalFileName: string;
  originalContentType: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;

  status: MediaAssetStatus;

  variants: {
    hero?: MediaVariant;
    card?: MediaVariant;
    thumbnail?: MediaVariant;
  };

  articleSlug?: string;

  failureCode?: MediaProcessingFailureCode | string;
  processingAttempts: number;

  createdAt: any;
  processingStartedAt?: any;
  processedAt?: any;
  promotedAt?: any;
  retiredAt?: any;
  deletedAt?: any;

  createdByUid: string;
  updatedAt: any;

  sourceEventId?: string;
  promotionRequestId?: string;
}

export type MediaProcessingFailureCode =
  | 'SOURCE_NOT_FOUND'
  | 'INVALID_PATH'
  | 'METADATA_MISMATCH'
  | 'UNSUPPORTED_IMAGE'
  | 'INVALID_IMAGE'
  | 'INVALID_DIMENSIONS'
  | 'ANIMATED_IMAGE_NOT_ALLOWED'
  | 'IMAGE_PROCESSING_FAILED'
  | 'VARIANT_UPLOAD_FAILED'
  | 'RETRY_LIMIT_EXCEEDED'
  | 'PROCESSING_BACKEND_PERMISSION_DENIED'
  | 'MEDIA_STATUS_READ_DENIED'
  | 'PROCESSING_TRIGGER_NOT_INVOKED'
  | 'SOURCE_OBJECT_READ_DENIED'
  | 'FIRESTORE_WRITE_DENIED'
  | 'PROCESSED_OBJECT_WRITE_DENIED';

export type MediaErrorCode =
  | 'storage-not-configured'
  | 'authentication-required'
  | 'permission-denied'
  | 'invalid-file'
  | 'empty-file'
  | 'file-too-large'
  | 'unsupported-file-type'
  | 'signature-mismatch'
  | 'invalid-image'
  | 'image-too-small'
  | 'image-too-large'
  | 'upload-canceled'
  | 'retry-limit-exceeded'
  | 'quota-exceeded'
  | 'checksum-failed'
  | 'object-not-found'
  | 'network-error'
  | 'unknown-storage-error';

export class MediaUploadError extends Error {
  public readonly code: MediaErrorCode;
  public readonly details?: unknown;

  constructor(code: MediaErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'MediaUploadError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, MediaUploadError.prototype);
  }
}
