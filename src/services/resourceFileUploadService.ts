import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { auth, storage } from '../lib/firebase';
import { ResourceFormat } from '../types/resource';

const MAX_BYTES = 80 * 1024 * 1024;

const ACCEPT_BY_FORMAT: Record<ResourceFormat, string[]> = {
  PDF: ['application/pdf', '.pdf'],
  DOCX: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    '.docx',
    '.doc',
  ],
  XLSX: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    '.xlsx',
    '.xls',
  ],
  ZIP: ['application/zip', 'application/x-zip-compressed', '.zip'],
  MP4: ['video/mp4', '.mp4'],
};

export function acceptAttrForFormat(format: ResourceFormat): string {
  return ACCEPT_BY_FORMAT[format].join(',');
}

export function formatBytesLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function contentTypeForFile(file: File, format: ResourceFormat): string {
  if (file.type) return file.type;
  switch (format) {
    case 'PDF':
      return 'application/pdf';
    case 'DOCX':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'XLSX':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ZIP':
      return 'application/zip';
    case 'MP4':
      return 'video/mp4';
    default:
      return 'application/octet-stream';
  }
}

function assertAllowedFile(file: File, format: ResourceFormat): void {
  if (file.size <= 0) throw new Error('Empty file');
  if (file.size > MAX_BYTES) throw new Error('File exceeds 80 MB limit');
  const allowed = ACCEPT_BY_FORMAT[format];
  const lower = file.name.toLowerCase();
  const okExt = allowed.some((a) => a.startsWith('.') && lower.endsWith(a));
  const okMime = file.type && allowed.includes(file.type);
  if (!okExt && !okMime) {
    throw new Error(`Selected file does not match format ${format}`);
  }
}

export interface ResourceUploadResult {
  downloadUrl: string;
  storagePath: string;
  fileSizeLabel: string;
  fileName: string;
}

export async function uploadResourceFile(
  resourceId: string,
  file: File,
  format: ResourceFormat,
  onProgress?: (percent: number) => void
): Promise<ResourceUploadResult> {
  if (!storage) throw new Error('Firebase Storage is not configured');
  if (!auth?.currentUser) throw new Error('Sign in required to upload');
  assertAllowedFile(file, format);

  const safeId = resourceId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'resource';
  const fileId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)}`;
  const storagePath = `resources/files/${safeId}/${fileId}`;
  const objectRef = ref(storage, storagePath);
  const contentType = contentTypeForFile(file, format);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(objectRef, file, {
      contentType,
      customMetadata: {
        resourceId: safeId,
        originalFileName: file.name,
        uploadedBy: auth!.currentUser!.uid,
      },
    });
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      (err) => reject(err),
      () => resolve()
    );
  });

  const downloadUrl = await getDownloadURL(objectRef);
  return {
    downloadUrl,
    storagePath,
    fileSizeLabel: formatBytesLabel(file.size),
    fileName: file.name,
  };
}

export async function deleteResourceStorageFile(storagePath: string): Promise<void> {
  if (!storage || !storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (err: any) {
    if (err?.code === 'storage/object-not-found') return;
    throw err;
  }
}
