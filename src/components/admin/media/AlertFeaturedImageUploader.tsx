import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  X,
  RotateCcw,
  Trash2,
  ExternalLink,
  FileText,
  Lock,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  ValidatedMediaFile,
  MediaUploadError,
  MEDIA_MAX_IMAGE_BYTES,
  MEDIA_MIN_IMAGE_WIDTH,
  MEDIA_MIN_IMAGE_HEIGHT,
  MEDIA_MAX_IMAGE_WIDTH,
  MEDIA_MAX_IMAGE_HEIGHT,
  StagedMediaReference,
  ManagedFeaturedImage,
  MediaAsset,
} from '../../../types/media';
import { validateNewsFeaturedImage as validateAlertFeaturedImage } from '../../../utils/mediaValidator';
import {
  startAlertImageStagingUpload,
  deleteOwnedStagingMedia,
  StagingUploadController,
} from '../../../services/mediaStagingService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, storage, auth } from '../../../lib/firebase';
import { LanguageCode, translations } from '../../../i18n/translations';

export type UploaderState =
  | 'idle'
  | 'validating'
  | 'ready'
  | 'uploading'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'removing';

export interface AlertFeaturedImageUploaderProps {
  authenticatedUid: string;
  currentLanguage: LanguageCode;
  existingExternalImageUrl?: string;
  stagedImage?: StagedMediaReference | null;
  disabled?: boolean;
  readOnly?: boolean;
  onStagedImageChange: (staged: StagedMediaReference | null) => void;
  onExternalImageChange: (url: string) => void;
  onManagedReady?: (mediaId: string, managedImage: ManagedFeaturedImage) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onError?: (err: Error) => void;
}

export const AlertFeaturedImageUploader: React.FC<AlertFeaturedImageUploaderProps> = ({
  authenticatedUid,
  currentLanguage,
  existingExternalImageUrl = '',
  stagedImage = null,
  disabled = false,
  readOnly = false,
  onStagedImageChange,
  onExternalImageChange,
  onManagedReady,
  onDirtyChange,
  onError,
}) => {
  const t = translations[currentLanguage] || translations.om;

  const [mediaAssetRecord, setMediaAssetRecord] = useState<MediaAsset | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Helper to trigger media processing via backend server endpoint
  const triggerProcessing = useCallback(
    async (mId: string, ownerUid: string, sPath: string, force = false) => {
      setIsProcessingMedia(true);
      setProcessingError(null);
      try {
        const res = await fetch('/api/media/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId: mId,
            ownerUid,
            sourceStoragePath: sPath,
            module: 'alert',
            purpose: 'featured-image',
            forceRetry: force,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'IMAGE_PROCESSING_FAILED');
        }

        if (data.asset) {
          setMediaAssetRecord(data.asset);
          if (data.asset.status === 'ready' || data.asset.status === 'public') {
            const managedImg: ManagedFeaturedImage = {
              source: 'managed',
              mediaId: data.asset.mediaId,
              urls: {
                hero: `/api/media/alert/${data.asset.mediaId}/hero`,
                card: `/api/media/alert/${data.asset.mediaId}/card`,
                thumbnail: `/api/media/alert/${data.asset.mediaId}/thumbnail`,
              },
              width: {
                hero: data.asset.variants?.hero?.width || 1600,
                card: data.asset.variants?.card?.width || 960,
                thumbnail: data.asset.variants?.thumbnail?.width || 480,
              },
              height: {
                hero: data.asset.variants?.hero?.height || 900,
                card: data.asset.variants?.card?.height || 600,
                thumbnail: data.asset.variants?.thumbnail?.height || 300,
              },
              contentType: 'image/webp',
            };
            onManagedReady?.(data.asset.mediaId, managedImg);
            onDirtyChange?.(true);
          }
        }
      } catch (err: any) {
        console.error('Trigger alert media processing failed:', err);
        setProcessingError(err?.message || 'IMAGE_PROCESSING_FAILED');
      } finally {
        setIsProcessingMedia(false);
      }
    },
    [onManagedReady, onDirtyChange]
  );

  // Subscribe to mediaAssets/{mediaId} document changes when stagedImage is present
  useEffect(() => {
    if (!stagedImage || !stagedImage.mediaId || !db) {
      setMediaAssetRecord(null);
      setIsProcessingMedia(false);
      setProcessingError(null);
      return;
    }

    const assetRef = doc(db, 'mediaAssets', stagedImage.mediaId);
    const unsub = onSnapshot(
      assetRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as MediaAsset;
          setMediaAssetRecord(data);
          if (data.status === 'processing' || data.status === 'uploaded') {
            setIsProcessingMedia(true);
            setProcessingError(null);
          } else if (data.status === 'ready' || data.status === 'public') {
            setIsProcessingMedia(false);
            setProcessingError(null);

            const managedImg: ManagedFeaturedImage = {
              source: 'managed',
              mediaId: data.mediaId,
              urls: {
                hero: `/api/media/alert/${data.mediaId}/hero`,
                card: `/api/media/alert/${data.mediaId}/card`,
                thumbnail: `/api/media/alert/${data.mediaId}/thumbnail`,
              },
              width: {
                hero: data.variants?.hero?.width || 1600,
                card: data.variants?.card?.width || 960,
                thumbnail: data.variants?.thumbnail?.width || 480,
              },
              height: {
                hero: data.variants?.hero?.height || 900,
                card: data.variants?.card?.height || 600,
                thumbnail: data.variants?.thumbnail?.height || 300,
              },
              contentType: 'image/webp',
            };

            onManagedReady?.(data.mediaId, managedImg);
            onDirtyChange?.(true);
          } else if (data.status === 'failed') {
            setIsProcessingMedia(false);
            setProcessingError(data.failureCode || 'IMAGE_PROCESSING_FAILED');
          }
        } else {
          triggerProcessing(stagedImage.mediaId, stagedImage.ownerUid, stagedImage.storagePath);
        }
      },
      (err) => {
        console.warn('mediaAssets subscription info:', err);
        triggerProcessing(stagedImage.mediaId, stagedImage.ownerUid, stagedImage.storagePath);
      }
    );

    return () => unsub();
  }, [stagedImage?.mediaId, stagedImage?.ownerUid, stagedImage?.storagePath, triggerProcessing]);

  const handleRetryProcessing = useCallback(() => {
    if (stagedImage) {
      triggerProcessing(stagedImage.mediaId, stagedImage.ownerUid, stagedImage.storagePath, true);
    }
  }, [stagedImage, triggerProcessing]);

  const [activeTab, setActiveTab] = useState<'staged' | 'external'>(
    stagedImage ? 'staged' : existingExternalImageUrl ? 'external' : 'staged'
  );

  const [uploaderState, setUploaderState] = useState<UploaderState>(
    stagedImage ? 'completed' : 'idle'
  );
  const [validatedFile, setValidatedFile] = useState<ValidatedMediaFile | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [privateBlobUrl, setPrivateBlobUrl] = useState<string | null>(null);
  const [isLoadingPrivateBlob, setIsLoadingPrivateBlob] = useState<boolean>(false);
  const [privateBlobError, setPrivateBlobError] = useState<string | null>(null);

  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [bytesTransferred, setBytesTransferred] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState<boolean>(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState<boolean>(false);
  const [externalInputUrl, setExternalInputUrl] = useState<string>(existingExternalImageUrl);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const controllerRef = useRef<StagingUploadController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current && controllerRef.current.getCurrentState().state === 'uploading') {
        controllerRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setExternalInputUrl(existingExternalImageUrl);
  }, [existingExternalImageUrl]);

  useEffect(() => {
    if (!stagedImage) {
      setPrivateBlobUrl(null);
      setIsLoadingPrivateBlob(false);
      setPrivateBlobError(null);
      return;
    }

    const currentAuthUid = auth?.currentUser?.uid;
    const isOwner =
      !stagedImage.ownerUid ||
      stagedImage.ownerUid === 'system_admin' ||
      (authenticatedUid && stagedImage.ownerUid === authenticatedUid) ||
      (currentAuthUid && stagedImage.ownerUid === currentAuthUid) ||
      Boolean(authenticatedUid) ||
      Boolean(currentAuthUid);

    if (!isOwner) {
      setPrivateBlobUrl(null);
      setIsLoadingPrivateBlob(false);
      setPrivateBlobError(
        t.media_preview_unavailable || 'This image is awaiting media processing.'
      );
      return;
    }

    setPrivateBlobUrl(`/api/media/alert/${stagedImage.mediaId}/card`);
    setIsLoadingPrivateBlob(false);
  }, [stagedImage, authenticatedUid, t.media_preview_unavailable]);

  const revokeLocalPreview = useCallback(() => {
    if (localPreviewUrl) {
      try {
        URL.revokeObjectURL(localPreviewUrl);
      } catch {
        // ignore
      }
      setLocalPreviewUrl(null);
    }
  }, [localPreviewUrl]);

  useEffect(() => {
    return () => {
      revokeLocalPreview();
    };
  }, [revokeLocalPreview]);

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleStartUpload = useCallback(
    async (validated: ValidatedMediaFile, oldStagedRef?: StagedMediaReference | null) => {
      setErrorMessage(null);
      setErrorCode(null);
      setUploaderState('uploading');
      setProgressPercent(0);

      try {
        const controller = await startAlertImageStagingUpload({
          file: validated.file,
          authenticatedUid,
          onProgress: (percent, upload) => {
            if (isMountedRef.current) {
              setProgressPercent(percent);
              setBytesTransferred(upload.bytesTransferred);
              setTotalBytes(upload.totalBytes);
            }
          },
          onStateChange: (st) => {
            if (isMountedRef.current) {
              setUploaderState(st as UploaderState);
            }
          },
        });

        controllerRef.current = controller;

        const result = await controller.completion;

        if (!isMountedRef.current) return;

        const newStagedRef: StagedMediaReference = {
          mediaId: result.mediaId,
          ownerUid: result.ownerUid,
          storagePath: result.storagePath,
          originalFileName: result.originalFileName,
          contentType: result.contentType,
          size: result.size,
          width: result.width,
          height: result.height,
          status: 'staged',
          uploadedAt: new Date().toISOString(),
        };

        setUploaderState('completed');
        onStagedImageChange(newStagedRef);
        onDirtyChange?.(true);

        const serverAsset = (result as any).asset;
        if (serverAsset && (serverAsset.status === 'ready' || serverAsset.status === 'public')) {
          const managedImg: ManagedFeaturedImage = {
            source: 'managed',
            mediaId: serverAsset.mediaId,
            urls: {
              hero: `/api/media/alert/${serverAsset.mediaId}/hero`,
              card: `/api/media/alert/${serverAsset.mediaId}/card`,
              thumbnail: `/api/media/alert/${serverAsset.mediaId}/thumbnail`,
            },
            width: {
              hero: serverAsset.variants?.hero?.width || 1600,
              card: serverAsset.variants?.card?.width || 960,
              thumbnail: serverAsset.variants?.thumbnail?.width || 480,
            },
            height: {
              hero: serverAsset.variants?.hero?.height || 900,
              card: serverAsset.variants?.card?.height || 600,
              thumbnail: serverAsset.variants?.thumbnail?.height || 300,
            },
            contentType: 'image/webp',
          };
          onManagedReady?.(serverAsset.mediaId, managedImg);
        } else {
          triggerProcessing(result.mediaId, result.ownerUid, result.storagePath);
        }

        if (oldStagedRef && oldStagedRef.mediaId && oldStagedRef.ownerUid === authenticatedUid) {
          deleteOwnedStagingMedia({
            authenticatedUid,
            mediaId: oldStagedRef.mediaId,
            storagePath: oldStagedRef.storagePath,
          }).catch((delErr) => {
            console.warn('[AlertFeaturedImageUploader] Failed to clean up replaced staged image:', delErr);
          });
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        const mediaErr = err instanceof MediaUploadError ? err : null;
        const code = mediaErr?.code || err?.code || 'unknown-storage-error';
        const msg = mediaErr?.message || err?.message || 'Upload failed.';

        if (code === 'upload-canceled') {
          setUploaderState('canceled');
        } else {
          setUploaderState('failed');
          setErrorCode(code);
          setErrorMessage(msg);
          onError?.(err instanceof Error ? err : new Error(msg));
        }
      }
    },
    [authenticatedUid, onStagedImageChange, onDirtyChange, onError, triggerProcessing, onManagedReady]
  );

  const processSelectedFile = useCallback(
    async (file: File) => {
      if (disabled || readOnly) return;

      setErrorMessage(null);
      setErrorCode(null);
      setUploaderState('validating');

      try {
        const validated = await validateAlertFeaturedImage(file);
        if (!isMountedRef.current) return;

        setValidatedFile(validated);

        revokeLocalPreview();
        const localUrl = URL.createObjectURL(file);
        setLocalPreviewUrl(localUrl);

        await handleStartUpload(validated, stagedImage);
      } catch (err: any) {
        if (!isMountedRef.current) return;
        const mediaErr = err instanceof MediaUploadError ? err : null;
        const code = mediaErr?.code || 'invalid-file';
        const msg = mediaErr?.message || err?.message || 'File validation failed.';

        setUploaderState('failed');
        setErrorCode(code);
        setErrorMessage(msg);
        onError?.(err instanceof Error ? err : new Error(msg));
      }
    },
    [disabled, readOnly, revokeLocalPreview, handleStartUpload, stagedImage, onError]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || readOnly) return;
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOver) setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (disabled || readOnly) return;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      setUploaderState('failed');
      setErrorCode('invalid-file');
      setErrorMessage('Please select only one image file at a time.');
      return;
    }

    processSelectedFile(files[0]);
  };

  const handleRequestRemove = async () => {
    setConfirmRemoveOpen(true);
  };

  const executeRemove = async () => {
    setConfirmRemoveOpen(false);
    setUploaderState('removing');

    if (stagedImage && stagedImage.mediaId && authenticatedUid && stagedImage.ownerUid === authenticatedUid) {
      try {
        await deleteOwnedStagingMedia({
          authenticatedUid,
          mediaId: stagedImage.mediaId,
          storagePath: stagedImage.storagePath,
        });
      } catch (err) {
        console.warn('[AlertFeaturedImageUploader] Warning deleting staging file:', err);
      }
    }

    revokeLocalPreview();
    setPrivateBlobUrl(null);
    setValidatedFile(null);
    onStagedImageChange(null);
    setUploaderState('idle');
    onDirtyChange?.(true);
  };

  const handleExternalUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExternalInputUrl(val);
    onExternalImageChange(val);
    onDirtyChange?.(true);
  };

  const renderPreviewBox = () => {
    if (localPreviewUrl) {
      return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-amber-500/30 shadow-md aspect-[16/9] max-h-[360px]">
          <img
            src={localPreviewUrl}
            alt={validatedFile?.sanitizedFileName || 'Staged alert image preview'}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Local Alert Image Preview
          </div>
        </div>
      );
    }

    if (privateBlobUrl && stagedImage) {
      return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-amber-500/30 shadow-md aspect-[16/9] max-h-[360px]">
          <img
            src={privateBlobUrl}
            alt={stagedImage.originalFileName || 'Staged alert image'}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Private Staging Preview
          </div>
        </div>
      );
    }

    if (stagedImage) {
      return (
        <div className="w-full aspect-[16/9] max-h-[360px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-300 relative overflow-hidden">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 mb-3 shadow-inner">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-slate-200 mb-1">
            Private Staging Image
          </p>
          <div className="mt-2 text-[11px] font-mono text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            {stagedImage.originalFileName} • {formatBytes(stagedImage.size)}
          </div>
        </div>
      );
    }

    if (existingExternalImageUrl) {
      return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 aspect-[16/9] max-h-[360px]">
          <img
            src={existingExternalImageUrl}
            alt="External alert image"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Alert Featured Media
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Attach an emergency field photograph or instructional graphic for this agricultural advisory.
          </p>
        </div>

        {!readOnly && (
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-medium self-start sm:self-auto">
            <button
              type="button"
              disabled={disabled || uploaderState === 'uploading'}
              onClick={() => setActiveTab('staged')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'staged'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              Upload Image
            </button>

            <button
              type="button"
              disabled={disabled || uploaderState === 'uploading'}
              onClick={() => setActiveTab('external')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'external'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              External URL
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || readOnly || uploaderState === 'uploading'}
      />

      {activeTab === 'staged' && (
        <div className="space-y-4">
          {(stagedImage || localPreviewUrl) && uploaderState !== 'uploading' && uploaderState !== 'validating' && (
            <div className="space-y-3">
              {renderPreviewBox()}

              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    <FileText className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {validatedFile?.sanitizedFileName || stagedImage?.originalFileName || 'Staged Image'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatBytes(validatedFile?.size || stagedImage?.size || 0)} •{' '}
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Staged Media</span>
                    </p>
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Replace Image
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={executeRemove}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {(uploaderState === 'uploading' || uploaderState === 'validating') && (
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-xs font-bold text-slate-200">
                    {uploaderState === 'validating' ? 'Validating image...' : 'Uploading staged image...'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {progressPercent}%
                </span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-2 rounded-full bg-slate-800 overflow-hidden"
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {uploaderState === 'failed' && errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-red-800 dark:text-red-300">Upload Failed</p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {!stagedImage && !localPreviewUrl && uploaderState !== 'uploading' && uploaderState !== 'validating' && (
            <div
              role="button"
              tabIndex={disabled || readOnly ? -1 : 0}
              onClick={() => {
                if (!disabled && !readOnly) fileInputRef.current?.click();
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full min-h-[160px] p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer select-none ${
                dragOver
                  ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-4 ring-amber-500/20 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 hover:border-amber-500/70 hover:bg-amber-50/30 dark:hover:bg-slate-800/70'
              } ${disabled || readOnly ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <div className="p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mb-3 border border-amber-200 dark:border-amber-800/60 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>

              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Drag and drop alert cover image, or browse
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                JPEG, PNG, or WebP (Max 8 MB, min 800x450px)
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'external' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              External Image URL (must be HTTPS)
            </label>
            <input
              type="url"
              value={externalInputUrl}
              onChange={handleExternalUrlInputChange}
              disabled={disabled || readOnly}
              placeholder="https://example.com/images/alert-cover.jpg"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
            />
          </div>

          {externalInputUrl.trim() && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Preview:</span>
              <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 aspect-[16/9] max-h-[300px]">
                <img
                  src={externalInputUrl.trim()}
                  alt="External alert preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
