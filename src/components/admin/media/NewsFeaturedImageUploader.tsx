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
  NewsStagedImageReference,
  MediaUploadError,
  MEDIA_MAX_IMAGE_BYTES,
  MEDIA_MIN_IMAGE_WIDTH,
  MEDIA_MIN_IMAGE_HEIGHT,
  MEDIA_MAX_IMAGE_WIDTH,
  MEDIA_MAX_IMAGE_HEIGHT,
} from '../../../types/media';
import { validateNewsFeaturedImage } from '../../../utils/mediaValidator';
import {
  startNewsImageStagingUpload,
  deleteOwnedStagingMedia,
  StagingUploadController,
} from '../../../services/mediaStagingService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, storage, auth } from '../../../lib/firebase';
import { MediaAsset } from '../../../types/media';
import { NewsManagedFeaturedImage } from '../../../types/news';
import { ref, getBlob } from 'firebase/storage';
import { NewsImage } from '../../news/NewsImage';
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

export interface NewsFeaturedImageUploaderProps {
  authenticatedUid: string;
  currentLanguage: LanguageCode;
  existingExternalImageUrl?: string;
  stagedImage?: NewsStagedImageReference | null;
  disabled?: boolean;
  readOnly?: boolean;
  onStagedImageChange: (staged: NewsStagedImageReference | null) => void;
  onExternalImageChange: (url: string) => void;
  onManagedReady?: (mediaId: string, managedImage: NewsManagedFeaturedImage) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onError?: (err: Error) => void;
}

export const NewsFeaturedImageUploader: React.FC<NewsFeaturedImageUploaderProps> = ({
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

  // Media Asset record state for tracking backend processing status
  const [mediaAssetRecord, setMediaAssetRecord] = useState<MediaAsset | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

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

            const managedImg: NewsManagedFeaturedImage = {
              source: 'managed',
              mediaId: data.mediaId,
              urls: {
                hero: `/api/media/news/${data.mediaId}/hero`,
                card: `/api/media/news/${data.mediaId}/card`,
                thumbnail: `/api/media/news/${data.mediaId}/thumbnail`,
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
          // If mediaAssets document does not exist yet, trigger initial processing
          triggerProcessing(stagedImage.mediaId, stagedImage.ownerUid, stagedImage.storagePath);
        }
      },
      (err) => {
        console.warn('mediaAssets subscription info:', err);
        // Fallback to trigger processing / fetching asset via endpoint
        triggerProcessing(stagedImage.mediaId, stagedImage.ownerUid, stagedImage.storagePath);
      }
    );

    return () => unsub();
  }, [stagedImage?.mediaId, stagedImage?.ownerUid, stagedImage?.storagePath]);

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
            const managedImg: NewsManagedFeaturedImage = {
              source: 'managed',
              mediaId: data.asset.mediaId,
              urls: {
                hero: `/api/media/news/${data.asset.mediaId}/hero`,
                card: `/api/media/news/${data.asset.mediaId}/card`,
                thumbnail: `/api/media/news/${data.asset.mediaId}/thumbnail`,
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
        console.error('Trigger media processing failed:', err);
        setProcessingError(err?.message || 'IMAGE_PROCESSING_FAILED');
      } finally {
        setIsProcessingMedia(false);
      }
    },
    [onManagedReady, onDirtyChange]
  );

  const handleRetryProcessing = useCallback(() => {
    if (stagedImage) {
      triggerProcessing(stagedImage.mediaId, stagedImage.ownerUid, stagedImage.storagePath, true);
    }
  }, [stagedImage, triggerProcessing]);
  const [activeTab, setActiveTab] = useState<'staged' | 'external'>(
    stagedImage ? 'staged' : existingExternalImageUrl ? 'external' : 'staged'
  );

  // Core Uploader State
  const [uploaderState, setUploaderState] = useState<UploaderState>(
    stagedImage ? 'completed' : 'idle'
  );
  const [validatedFile, setValidatedFile] = useState<ValidatedMediaFile | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [privateBlobUrl, setPrivateBlobUrl] = useState<string | null>(null);
  const [isLoadingPrivateBlob, setIsLoadingPrivateBlob] = useState<boolean>(false);
  const [privateBlobError, setPrivateBlobError] = useState<string | null>(null);

  // Progress metrics
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [bytesTransferred, setBytesTransferred] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);

  // Errors & UI states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState<boolean>(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState<boolean>(false);
  const [externalInputUrl, setExternalInputUrl] = useState<string>(existingExternalImageUrl);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const controllerRef = useRef<StagingUploadController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current && controllerRef.current.state === 'uploading') {
        controllerRef.current.cancel();
      }
    };
  }, []);

  // Update externalInputUrl if prop changes
  useEffect(() => {
    setExternalInputUrl(existingExternalImageUrl);
  }, [existingExternalImageUrl]);

  // Handle Private Blob fetch for stagedImage when user is owner
  useEffect(() => {
    let activeBlobUrl: string | null = null;

    if (!stagedImage) {
      setPrivateBlobUrl(null);
      setIsLoadingPrivateBlob(false);
      setPrivateBlobError(null);
      return;
    }

    // Check if current user is owner or authorized staff user in admin CMS
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

    // Owner fetch private blob
    if (!storage) {
      setPrivateBlobUrl(`/api/media/news/${stagedImage.mediaId}/card`);
      setIsLoadingPrivateBlob(false);
      return;
    }

    let isSubscribed = true;
    setIsLoadingPrivateBlob(true);
    setPrivateBlobError(null);

    const fetchBlob = async () => {
      if (isSubscribed && isMountedRef.current) {
        setPrivateBlobUrl(`/api/media/news/${stagedImage.mediaId}/card`);
        setIsLoadingPrivateBlob(false);
      }
    };

    fetchBlob();

    return () => {
      isSubscribed = false;
      if (activeBlobUrl) {
        try {
          URL.revokeObjectURL(activeBlobUrl);
        } catch {
          // ignore
        }
      }
    };
  }, [stagedImage, authenticatedUid, t.media_preview_unavailable]);

  // Clean up local preview object URL
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

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Safe error display mapper
  const getFriendlyErrorMessage = (code: string | null, defaultMsg: string | null): string => {
    if (!code && !defaultMsg) return 'An unexpected error occurred.';
    switch (code) {
      case 'file-too-large':
        return 'File size exceeds maximum allowed limit of 8 MB.';
      case 'image-too-small':
        return `Image dimensions are below minimum requirements (${MEDIA_MIN_IMAGE_WIDTH}x${MEDIA_MIN_IMAGE_HEIGHT}px).`;
      case 'image-too-large':
        return `Image dimensions exceed maximum allowed limits (${MEDIA_MAX_IMAGE_WIDTH}x${MEDIA_MAX_IMAGE_HEIGHT}px).`;
      case 'unsupported-file-type':
        return 'Unsupported file type. Only JPEG, PNG, and WebP images are allowed.';
      case 'signature-mismatch':
        return 'File signature mismatch. The file content does not match its file extension.';
      case 'permission-denied':
        return 'Permission denied by Firebase Storage rules.';
      case 'quota-exceeded':
        return 'Storage quota exceeded. Please contact system administrator.';
      case 'upload-canceled':
        return 'Upload was canceled.';
      default:
        return defaultMsg || 'Upload failed. Please check your network and retry.';
    }
  };

  // Start the upload process for a validated file
  const handleStartUpload = useCallback(
    async (validated: ValidatedMediaFile, oldStagedRef?: NewsStagedImageReference | null) => {
      setErrorMessage(null);
      setErrorCode(null);
      setUploaderState('uploading');
      setProgressPercent(0);

      try {
        const controller = await startNewsImageStagingUpload({
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

        const newStagedRef: NewsStagedImageReference = {
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
          const managedImg: NewsManagedFeaturedImage = {
            source: 'managed',
            mediaId: serverAsset.mediaId,
            urls: {
              hero: `/api/media/news/${serverAsset.mediaId}/hero`,
              card: `/api/media/news/${serverAsset.mediaId}/card`,
              thumbnail: `/api/media/news/${serverAsset.mediaId}/thumbnail`,
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
          // Immediately trigger media processing for staged image
          triggerProcessing(result.mediaId, result.ownerUid, result.storagePath);
        }

        // Delete old staged image if replacing
        if (oldStagedRef && oldStagedRef.mediaId && oldStagedRef.ownerUid === authenticatedUid) {
          deleteOwnedStagingMedia({
            authenticatedUid,
            mediaId: oldStagedRef.mediaId,
            storagePath: oldStagedRef.storagePath,
          }).catch((delErr) => {
            console.warn('[NewsFeaturedImageUploader] Note: Failed to clean up replaced staged image:', delErr);
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
    [authenticatedUid, onStagedImageChange, onDirtyChange, onError]
  );

  // Handle File Selection
  const processSelectedFile = useCallback(
    async (file: File) => {
      if (disabled || readOnly) return;

      setErrorMessage(null);
      setErrorCode(null);
      setUploaderState('validating');

      try {
        const validated = await validateNewsFeaturedImage(file);
        if (!isMountedRef.current) return;

        setValidatedFile(validated);

        // Create local preview
        revokeLocalPreview();
        const localUrl = URL.createObjectURL(file);
        setLocalPreviewUrl(localUrl);

        // Start upload
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
    // reset input so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and Drop Handlers
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

  const handleKeyDownDropZone = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled && !readOnly && uploaderState !== 'uploading') {
        fileInputRef.current?.click();
      }
    }
  };

  // Pause / Resume / Cancel Controls
  const handlePause = () => {
    if (controllerRef.current && uploaderState === 'uploading') {
      controllerRef.current.pause();
    }
  };

  const handleResume = () => {
    if (controllerRef.current && uploaderState === 'paused') {
      controllerRef.current.resume();
    }
  };

  const handleRequestCancel = () => {
    if (progressPercent > 0) {
      setConfirmCancelOpen(true);
    } else {
      executeCancel();
    }
  };

  const executeCancel = () => {
    if (controllerRef.current) {
      controllerRef.current.cancel();
    }
    setConfirmCancelOpen(false);
    setUploaderState('idle');
    setValidatedFile(null);
    revokeLocalPreview();
  };

  const handleRetry = () => {
    if (validatedFile) {
      handleStartUpload(validatedFile, stagedImage);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove Image Handler
  const handleRequestRemove = () => {
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
        console.warn('[NewsFeaturedImageUploader] Warning deleting staging file:', err);
      }
    }

    revokeLocalPreview();
    setPrivateBlobUrl(null);
    setValidatedFile(null);
    onStagedImageChange(null);
    setUploaderState('idle');
    onDirtyChange?.(true);
  };

  // External URL Change
  const handleExternalUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExternalInputUrl(val);
    onExternalImageChange(val);
    onDirtyChange?.(true);
  };

  // Render Image Preview depending on mode
  const renderPreviewBox = () => {
    // 1. Local Preview during upload/staging
    if (localPreviewUrl) {
      return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-md aspect-[16/9] max-h-[360px]">
          <img
            src={localPreviewUrl}
            alt={validatedFile?.sanitizedFileName || 'Staged preview'}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Local Staging Preview
          </div>
        </div>
      );
    }

    // 2. Private Blob Preview for Owner
    if (privateBlobUrl && stagedImage) {
      return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-md aspect-[16/9] max-h-[360px]">
          <img
            src={privateBlobUrl}
            alt={stagedImage.originalFileName || 'Staged featured image'}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Private Staging Preview (Authenticated)
          </div>
        </div>
      );
    }

    // 3. Loading Private Blob
    if (isLoadingPrivateBlob) {
      return (
        <div className="w-full aspect-[16/9] max-h-[360px] rounded-2xl bg-slate-900/90 border border-slate-700 flex flex-col items-center justify-center p-6 text-center text-slate-300">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
          <span className="text-sm font-medium">Fetching secure private image preview...</span>
        </div>
      );
    }

    // 4. Staged Image present but non-owner or blob load error
    if (stagedImage) {
      return (
        <div className="w-full aspect-[16/9] max-h-[360px] rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-300 relative overflow-hidden">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 mb-3 shadow-inner">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-slate-200 mb-1">
            {t.media_private_staging_notice || 'Private Staging Image'}
          </p>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            {privateBlobError || t.media_preview_unavailable || 'This image is awaiting media processing.'}
          </p>
          <div className="mt-3 text-[11px] font-mono text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            {stagedImage.originalFileName} • {formatBytes(stagedImage.size)} • {stagedImage.width}x{stagedImage.height}px
          </div>
        </div>
      );
    }

    // 5. External Image URL fallback preview
    if (existingExternalImageUrl) {
      return (
        <NewsImage
          src={existingExternalImageUrl}
          alt="External featured image"
          aspect="featured"
        />
      );
    }

    return null;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t.media_upload_title || 'Featured Cover Image'}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({t.media_private_staging_notice || 'Private Staging Supported'})
            </span>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.media_upload_desc || 'Upload or select a high-resolution featured image for this article.'}
          </p>
        </div>

        {/* Tab Selector */}
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
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              {t.media_tab_upload || 'Secure Staged Upload'}
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
              {t.media_tab_external || 'External Image URL'}
            </button>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || readOnly || uploaderState === 'uploading'}
      />

      {/* Mode 1: Staged Upload Mode */}
      {activeTab === 'staged' && (
        <div className="space-y-4">
          {/* Active Staged Image or Local Preview Present */}
          {(stagedImage || localPreviewUrl) && uploaderState !== 'uploading' && uploaderState !== 'validating' && (
            <div className="space-y-3">
              {renderPreviewBox()}

              {/* Image Metadata & Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    <FileText className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {validatedFile?.sanitizedFileName || stagedImage?.originalFileName || 'Staged Image'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatBytes(validatedFile?.size || stagedImage?.size || 0)} •{' '}
                      {validatedFile?.width || stagedImage?.width}x{validatedFile?.height || stagedImage?.height}px •{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Staged (Private)</span>
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
                      {t.media_replace || 'Replace Image'}
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={handleRequestRemove}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.media_remove || 'Remove Image'}
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Media Status Badge */}
              {isProcessingMedia || mediaAssetRecord?.status === 'processing' || mediaAssetRecord?.status === 'uploaded' ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
                    <span className="font-semibold">Image processing is still in progress...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (stagedImage) triggerProcessing(stagedImage.mediaId, stagedImage.ownerUid, stagedImage.storagePath, false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800/80 font-bold text-amber-900 dark:text-amber-200 transition-colors text-[11px]"
                  >
                    Refresh Status
                  </button>
                </div>
              ) : mediaAssetRecord?.status === 'failed' || processingError ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <span className="font-semibold truncate">
                      Processing Failed: {processingError || mediaAssetRecord?.failureCode || 'IMAGE_PROCESSING_FAILED'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetryProcessing}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 font-bold text-white transition-colors text-[11px] shrink-0"
                  >
                    Retry Processing
                  </button>
                </div>
              ) : mediaAssetRecord?.status === 'ready' || mediaAssetRecord?.status === 'public' ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Image processed and ready for publication.</span>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {t.media_publication_blocked_notice ||
                      'This uploaded image is still private and must be processed before the article can be published.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress Card */}
          {(uploaderState === 'uploading' || uploaderState === 'paused' || uploaderState === 'validating') && (
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-xs font-bold text-slate-200">
                    {uploaderState === 'validating'
                      ? t.media_validating || 'Validating image...'
                      : uploaderState === 'paused'
                      ? t.media_paused || 'Upload Paused'
                      : t.media_uploading || 'Uploading...'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-2 rounded-full bg-slate-800 overflow-hidden"
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    uploaderState === 'paused' ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>
                  {formatBytes(bytesTransferred)} / {formatBytes(totalBytes || validatedFile?.size || 0)}
                </span>
                <span>{validatedFile?.sanitizedFileName}</span>
              </div>

              {/* Upload Controls: Pause, Resume, Cancel */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                {uploaderState === 'uploading' && (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    {t.media_pause || 'Pause Upload'}
                  </button>
                )}

                {uploaderState === 'paused' && (
                  <button
                    type="button"
                    onClick={handleResume}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {t.media_resume || 'Resume Upload'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRequestCancel}
                  className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-xs font-medium text-red-300 flex items-center gap-1.5 transition-colors border border-red-800/50"
                >
                  <X className="w-3.5 h-3.5" />
                  {t.media_cancel || 'Cancel Upload'}
                </button>
              </div>
            </div>
          )}

          {/* Error Message Card */}
          {uploaderState === 'failed' && errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-red-800 dark:text-red-300">
                    Upload Validation Failed
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">
                    {getFriendlyErrorMessage(errorCode, errorMessage)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-red-200/60 dark:border-red-900/60">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.media_retry || 'Retry Upload'}
                </button>
              </div>
            </div>
          )}

          {/* Empty Drop Zone when no image selected */}
          {!stagedImage && !localPreviewUrl && uploaderState !== 'uploading' && uploaderState !== 'validating' && (
            <div
              role="button"
              tabIndex={disabled || readOnly ? -1 : 0}
              aria-label="Upload featured image dropzone"
              aria-describedby="featured-image-upload-guidance"
              onClick={() => {
                if (!disabled && !readOnly) fileInputRef.current?.click();
              }}
              onKeyDown={handleKeyDownDropZone}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full min-h-[180px] p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer select-none ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-500/70 hover:bg-emerald-50/30 dark:hover:bg-slate-800/70'
              } ${disabled || readOnly ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>

              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t.media_drag_drop || 'Drag and drop your image here, or browse'}
              </p>

              <p
                id="featured-image-upload-guidance"
                className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed"
              >
                {t.media_accepted_formats || 'Accepted: JPEG, PNG, WebP (Max 8 MB, min 800x450px)'}
              </p>

              <button
                type="button"
                disabled={disabled || readOnly}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors pointer-events-none"
              >
                {t.media_browse || 'Browse Files'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: External Image URL Mode */}
      {activeTab === 'external' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t.media_tab_external || 'External Image URL'}
            </label>
            <input
              type="url"
              value={externalInputUrl}
              onChange={handleExternalUrlInputChange}
              disabled={disabled || readOnly}
              placeholder="https://example.com/images/featured.jpg"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>

          {externalInputUrl.trim() && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Preview:</span>
              <NewsImage src={externalInputUrl.trim()} alt="External featured preview" aspect="featured" />
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog: Cancel Upload */}
      {confirmCancelOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold">Cancel Upload</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.media_confirm_cancel || 'Are you sure you want to cancel the active upload?'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Resume Upload
              </button>
              <button
                type="button"
                onClick={executeCancel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Yes, Cancel Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Remove Staged Image */}
      {confirmRemoveOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold">Remove Staged Image</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.media_confirm_remove || 'Are you sure you want to remove this staged image? This action will clean up the staging object from Storage.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Keep Image
              </button>
              <button
                type="button"
                onClick={executeRemove}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Yes, Remove Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
