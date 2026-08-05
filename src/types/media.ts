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
