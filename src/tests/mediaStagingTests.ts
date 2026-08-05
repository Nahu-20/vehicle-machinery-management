import { sanitizeMediaFileName } from '../utils/mediaSanitizer';
import { buildStagingMediaPath, isValidUuid, generateMediaId } from '../utils/mediaPath';
import { validateNewsFeaturedImage, verifyImageSignature } from '../utils/mediaValidator';
import { normalizeStorageError } from '../services/mediaStagingService';
import { MediaUploadError } from '../types/media';

export interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  message: string;
}

export async function runAllMediaStagingUnitTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let testId = 1;

  // Helper to record pass/fail
  const record = (name: string, condition: boolean, message: string) => {
    results.push({
      id: testId++,
      name,
      passed: condition,
      message,
    });
  };

  // --- 1. FILENAME SANITIZER TESTS ---
  try {
    const res1 = sanitizeMediaFileName('normal-article-hero.jpg');
    record('Sanitizer: Normal JPEG filename', res1 === 'normal-article-hero.jpg', `Output: ${res1}`);

    const res2 = sanitizeMediaFileName('C:\\Users\\Admin\\Desktop\\photo_test.png');
    record('Sanitizer: Windows path prefix stripped', res2 === 'photo_test.png', `Output: ${res2}`);

    const res3 = sanitizeMediaFileName('../../etc/passwd.webp');
    record('Sanitizer: Path traversal stripped', res3 === 'passwd.webp', `Output: ${res3}`);

    const res4 = sanitizeMediaFileName('bad\x00file\x1F.jpg');
    record('Sanitizer: Control characters removed', res4 === 'badfile.jpg', `Output: ${res4}`);

    const longName = 'a'.repeat(300) + '.jpeg';
    const res5 = sanitizeMediaFileName(longName);
    record('Sanitizer: Extremely long filename limited to <= 180 chars', res5.length <= 180 && res5.endsWith('.jpeg'), `Length: ${res5.length}`);

    const res6 = sanitizeMediaFileName('');
    record('Sanitizer: Empty filename fallback', res6 === 'image', `Output: ${res6}`);

    const res7 = sanitizeMediaFileName('   multiple    spaces   file  .png  ');
    record('Sanitizer: Collapses repeated whitespace', res7 === 'multiple spaces file.png', `Output: ${res7}`);
  } catch (err: any) {
    record('Sanitizer test suite execution', false, err.message);
  }

  // --- 2. PATH BUILDER TESTS ---
  try {
    const validUuid = '123e4567-e89b-42d3-a456-426614174000';
    const path = buildStagingMediaPath('user_abc123', validUuid);
    record('Path Builder: Valid UUID path', path === 'media/staging/user_abc123/123e4567-e89b-42d3-a456-426614174000', `Path: ${path}`);

    let errCaught = false;
    try {
      buildStagingMediaPath('', validUuid);
    } catch {
      errCaught = true;
    }
    record('Path Builder: Empty UID rejected', errCaught, 'Successfully threw error for empty UID');

    errCaught = false;
    try {
      buildStagingMediaPath('user/admin', validUuid);
    } catch {
      errCaught = true;
    }
    record('Path Builder: Slash injection rejected', errCaught, 'Successfully threw error for slash in UID');

    errCaught = false;
    try {
      buildStagingMediaPath('user_123', 'not-a-valid-uuid');
    } catch {
      errCaught = true;
    }
    record('Path Builder: Invalid UUID rejected', errCaught, 'Successfully threw error for non-UUID mediaId');

    const generatedId = generateMediaId();
    record('Path Builder: generateMediaId returns valid UUID', isValidUuid(generatedId), `Generated: ${generatedId}`);
  } catch (err: any) {
    record('Path Builder test suite execution', false, err.message);
  }

  // --- 3. FILE VALIDATOR & SIGNATURE TESTS ---
  try {
    // Valid Mock JPEG (FF D8 FF)
    const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const mockJpegFile = new File([jpegBytes], 'test.jpg', { type: 'image/jpeg' });
    const sig1 = await verifyImageSignature(mockJpegFile);
    record('Validator: Detects valid JPEG signature', sig1 === 'image/jpeg', `Detected: ${sig1}`);

    // Valid Mock PNG (89 50 4E 47 0D 0A 1A 0A)
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
    const mockPngFile = new File([pngBytes], 'test.png', { type: 'image/png' });
    const sig2 = await verifyImageSignature(mockPngFile);
    record('Validator: Detects valid PNG signature', sig2 === 'image/png', `Detected: ${sig2}`);

    // Valid Mock WebP (RIFF .... WEBP)
    const webpBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
    const mockWebpFile = new File([webpBytes], 'test.webp', { type: 'image/webp' });
    const sig3 = await verifyImageSignature(mockWebpFile);
    record('Validator: Detects valid WebP signature', sig3 === 'image/webp', `Detected: ${sig3}`);

    // Signature mismatch
    let mismatchCaught = false;
    try {
      const mockFakeJpeg = new File([pngBytes], 'fake.jpg', { type: 'image/jpeg' });
      await validateNewsFeaturedImage(mockFakeJpeg);
    } catch (err: any) {
      if (err instanceof MediaUploadError && err.code === 'signature-mismatch') {
        mismatchCaught = true;
      }
    }
    record('Validator: Catches claimed JPEG with PNG signature', mismatchCaught, 'Correctly threw signature-mismatch');

    // Zero-byte file
    let zeroByteCaught = false;
    try {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
      await validateNewsFeaturedImage(emptyFile);
    } catch (err: any) {
      if (err instanceof MediaUploadError && err.code === 'empty-file') {
        zeroByteCaught = true;
      }
    }
    record('Validator: Rejects zero-byte empty file', zeroByteCaught, 'Correctly threw empty-file error');

    // Oversized file (> 8MB)
    let oversizedCaught = false;
    try {
      const bigBuffer = new Uint8Array(8 * 1024 * 1024 + 100);
      const oversizedFile = new File([bigBuffer], 'huge.jpg', { type: 'image/jpeg' });
      await validateNewsFeaturedImage(oversizedFile);
    } catch (err: any) {
      if (err instanceof MediaUploadError && err.code === 'file-too-large') {
        oversizedCaught = true;
      }
    }
    record('Validator: Rejects file over 8 MiB', oversizedCaught, 'Correctly threw file-too-large error');

    // Unsupported MIME (SVG)
    let svgCaught = false;
    try {
      const svgFile = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' });
      await validateNewsFeaturedImage(svgFile);
    } catch (err: any) {
      if (err instanceof MediaUploadError && err.code === 'unsupported-file-type') {
        svgCaught = true;
      }
    }
    record('Validator: Rejects SVG file', svgCaught, 'Correctly threw unsupported-file-type error');
  } catch (err: any) {
    record('File Validator test suite execution', false, err.message);
  }

  // --- 4. ERROR NORMALIZATION TESTS ---
  try {
    const err1 = normalizeStorageError({ code: 'storage/unauthorized' });
    record('Error Normalizer: storage/unauthorized -> permission-denied', err1.code === 'permission-denied', err1.message);

    const err2 = normalizeStorageError({ code: 'storage/canceled' });
    record('Error Normalizer: storage/canceled -> upload-canceled', err2.code === 'upload-canceled', err2.message);

    const err3 = normalizeStorageError({ code: 'storage/quota-exceeded' });
    record('Error Normalizer: storage/quota-exceeded -> quota-exceeded', err3.code === 'quota-exceeded', err3.message);

    const err4 = normalizeStorageError({ code: 'storage/object-not-found' });
    record('Error Normalizer: storage/object-not-found -> object-not-found', err4.code === 'object-not-found', err4.message);
  } catch (err: any) {
    record('Error Normalizer test suite execution', false, err.message);
  }

  return results;
}
