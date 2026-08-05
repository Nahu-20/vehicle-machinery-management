import {
  MEDIA_MAX_IMAGE_BYTES,
  MEDIA_MIN_IMAGE_WIDTH,
  MEDIA_MIN_IMAGE_HEIGHT,
  MEDIA_MAX_IMAGE_WIDTH,
  MEDIA_MAX_IMAGE_HEIGHT,
  MEDIA_ALLOWED_IMAGE_TYPES,
  MediaAllowedImageType,
  ValidatedMediaFile,
  MediaUploadError,
} from '../types/media';
import { sanitizeMediaFileName } from './mediaSanitizer';

/**
 * Verifies the binary magic numbers of an image file.
 */
export async function verifyImageSignature(
  file: File
): Promise<MediaAllowedImageType> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length < 12) {
      throw new MediaUploadError(
        'signature-mismatch',
        'File header is too short to verify binary image signature.'
      );
    }

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'image/png';
    }

    // WebP: RIFF (bytes 0..3) + WEBP (bytes 8..11)
    const isRiff =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;
    const isWebp =
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;

    if (isRiff && isWebp) {
      return 'image/webp';
    }

    throw new MediaUploadError(
      'signature-mismatch',
      'File binary header does not match any supported image format (JPEG, PNG, WebP).'
    );
  } catch (err) {
    if (err instanceof MediaUploadError) throw err;
    throw new MediaUploadError(
      'signature-mismatch',
      'Failed to inspect file binary header.',
      err
    );
  }
}

/**
 * Decodes image dimensions using createImageBitmap or HTMLImageElement.
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  // 1. Prefer createImageBitmap if available
  if (
    typeof window !== 'undefined' &&
    typeof window.createImageBitmap === 'function'
  ) {
    try {
      const bitmap = await window.createImageBitmap(file);
      const width = bitmap.width;
      const height = bitmap.height;
      if (typeof bitmap.close === 'function') {
        bitmap.close();
      }
      if (width > 0 && height > 0) {
        return { width, height };
      }
    } catch {
      // Fallback to HTMLImageElement below
    }
  }

  // 2. Fallback to HTMLImageElement
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(
        new MediaUploadError(
          'invalid-image',
          'Image decoding is not supported in non-browser environments.'
        )
      );
    }

    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      return reject(
        new MediaUploadError(
          'invalid-image',
          'Failed to create temporary object URL for image decoding.'
        )
      );
    }

    const img = new Image();

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
      }
    };

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      cleanup();
      if (!width || !height || width <= 0 || height <= 0) {
        return reject(
          new MediaUploadError(
            'invalid-image',
            'Image missing valid width or height dimensions.'
          )
        );
      }
      resolve({ width, height });
    };

    img.onerror = () => {
      cleanup();
      reject(
        new MediaUploadError(
          'invalid-image',
          'Corrupted or unparseable image file.'
        )
      );
    };

    img.src = objectUrl;
  });
}

/**
 * Comprehensive client-side validation for News featured images.
 * Orders:
 * 1. File existence
 * 2. Size > 0
 * 3. Size <= 8 MiB
 * 4. Claimed MIME type check
 * 5. Magic byte signature check
 * 6-7. Decode & dimension extraction
 * 8. Dimension limit verification
 */
export async function validateNewsFeaturedImage(
  file: File | null | undefined
): Promise<ValidatedMediaFile> {
  // 1. Confirm file exists
  if (!file) {
    throw new MediaUploadError(
      'invalid-file',
      'No file was selected for upload.'
    );
  }

  // 2. Confirm size is greater than zero
  if (file.size <= 0) {
    throw new MediaUploadError(
      'empty-file',
      'Selected file is empty (0 bytes).'
    );
  }

  // 3. Confirm size is no more than 8 MiB
  if (file.size > MEDIA_MAX_IMAGE_BYTES) {
    throw new MediaUploadError(
      'file-too-large',
      `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum limit of 8 MB.`
    );
  }

  // 4. Confirm MIME type
  const claimedType = file.type as MediaAllowedImageType;
  if (
    !claimedType ||
    !MEDIA_ALLOWED_IMAGE_TYPES.includes(claimedType)
  ) {
    throw new MediaUploadError(
      'unsupported-file-type',
      `Unsupported file type '${file.type || 'unknown'}'. Only JPEG, PNG, and WebP images are allowed.`
    );
  }

  // 5. Inspect magic bytes signature
  const detectedSignatureType = await verifyImageSignature(file);
  if (detectedSignatureType !== claimedType) {
    throw new MediaUploadError(
      'signature-mismatch',
      `File extension/type '${claimedType}' does not match binary content signature '${detectedSignatureType}'.`
    );
  }

  // 6 & 7. Decode image & read dimensions
  const { width, height } = await getImageDimensions(file);

  // 8. Dimension limits
  if (width < MEDIA_MIN_IMAGE_WIDTH || height < MEDIA_MIN_IMAGE_HEIGHT) {
    throw new MediaUploadError(
      'image-too-small',
      `Image dimensions (${width}x${height}px) are below minimum requirements (${MEDIA_MIN_IMAGE_WIDTH}x${MEDIA_MIN_IMAGE_HEIGHT}px).`
    );
  }

  if (width > MEDIA_MAX_IMAGE_WIDTH || height > MEDIA_MAX_IMAGE_HEIGHT) {
    throw new MediaUploadError(
      'image-too-large',
      `Image dimensions (${width}x${height}px) exceed maximum allowed limits (${MEDIA_MAX_IMAGE_WIDTH}x${MEDIA_MAX_IMAGE_HEIGHT}px).`
    );
  }

  // 9. Return normalized validated metadata
  const sanitizedFileName = sanitizeMediaFileName(file.name);

  return {
    file,
    originalFileName: file.name || 'image',
    sanitizedFileName,
    contentType: claimedType,
    size: file.size,
    width,
    height,
  };
}
