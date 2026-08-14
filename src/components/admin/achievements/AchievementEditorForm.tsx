import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStaffAuthorization } from '../../../hooks/useStaffAuthorization';
import { useToast } from '../../../context/ToastContext';
import {
  AchievementInput,
  Achievement,
  AchievementStatus,
  AchievementCategory,
  createEmptyLocalizedText,
  generateSlugFromTitles,
  validateSlug,
  validateDraft,
  validateAchievementForReview,
  LocalizedText,
} from '../../../types/achievement';
import { LocalizedTextFields } from '../news/LocalizedTextFields';
import { AchievementContentBlockEditor } from './AchievementContentBlockEditor';
import { AchievementMetricsBuilder } from './AchievementMetricsBuilder';
import { AchievementBeforeAfterBuilder } from './AchievementBeforeAfterBuilder';
import { AchievementFeaturedImageUploader } from './AchievementFeaturedImageUploader';
import { AchievementGalleryUploader } from './AchievementGalleryUploader';
import { AchievementStatusBadge } from './AchievementStatusBadge';
import { TrashConfirmModal } from './TrashConfirmModal';
import { PermanentDeleteConfirmModal } from './PermanentDeleteConfirmModal';
import { UnsavedChangesDialog } from '../news/UnsavedChangesDialog';
import {
  saveAchievementDraftRecovery,
  getAchievementDraftRecovery,
  clearAchievementDraftRecovery,
} from '../../../services/achievementDraftRecoveryService';
import {
  createAchievementDraft,
  updateAchievementDraft,
  submitAchievementForReview,
  returnAchievementToDraft,
  publishAchievement,
  unpublishAchievement,
  archiveAchievement,
  moveAchievementToTrash,
  restoreAchievement,
  permanentlyDeleteAchievement,
  getAchievementBySlugForAdmin,
} from '../../../services/achievementService';
import {
  Save,
  Eye,
  Send,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Sparkles,
  Info,
  FileText,
  BarChart3,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Clock,
  RotateCcw,
  EyeOff,
  Archive,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface AchievementEditorFormProps {
  initialAchievement?: Achievement | null;
  isEditMode?: boolean;
}

export const AchievementEditorForm: React.FC<AchievementEditorFormProps> = ({
  initialAchievement,
  isEditMode = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { staffUser, hasPermission } = useStaffAuthorization();
  const { showToast } = useToast();

  const [achievement, setAchievement] = useState<Achievement | null>(initialAchievement || null);

  useEffect(() => {
    if (initialAchievement) {
      setAchievement(initialAchievement);
      if (initialAchievement.version) {
        currentVersionRef.current = initialAchievement.version;
      }
    }
  }, [initialAchievement]);

  const currentStatus: AchievementStatus = achievement?.status || initialAchievement?.status || 'draft';

  const isSubmittingRef = useRef(false);
  const currentVersionRef = useRef<number>(initialAchievement?.version || achievement?.version || 1);

  const canCreate = hasPermission('achievement.create');
  const canEdit = hasPermission('achievement.edit');
  const canReview = hasPermission('achievement.review');
  const canPublish = hasPermission('achievement.publish');
  const canTrash = hasPermission('achievement.trash');
  const canRestore = hasPermission('achievement.restore');
  const canDelete = hasPermission('achievement.delete');

  useEffect(() => {
    if (staffUser && (achievement || isEditMode)) {
      console.log('[Achievement Action Diagnostic]', {
        role: staffUser.role,
        status: currentStatus,
        version: currentVersionRef.current,
        canReview,
        canPublish,
        canTrash,
      });
    }
  }, [staffUser, currentStatus, canReview, canPublish, canTrash, achievement, isEditMode]);

  const initialFormState: AchievementInput = React.useMemo(() => {
    if (initialAchievement) {
      return {
        slug: initialAchievement.slug,
        title: initialAchievement.title || createEmptyLocalizedText(),
        summary: initialAchievement.summary || createEmptyLocalizedText(),
        content: initialAchievement.content || [],
        category: initialAchievement.category || 'other',
        tags: initialAchievement.tags || [],
        featured: Boolean(initialAchievement.featured),
        achievementDate: initialAchievement.achievementDate || new Date().toISOString().slice(0, 10),
        responsibleOffice: initialAchievement.responsibleOffice || createEmptyLocalizedText(),
        location: initialAchievement.location || createEmptyLocalizedText(),
        metrics: initialAchievement.metrics || [],
        beforeAfter: initialAchievement.beforeAfter || null,
        gallery: initialAchievement.gallery || [],
        featuredImageSource: initialAchievement.featuredImageSource || 'none',
        featuredImage: initialAchievement.featuredImage || '',
        featuredImageAssetId: initialAchievement.featuredImageAssetId || null,
        featuredImageManaged: initialAchievement.featuredImageManaged || null,
        featuredImageStaging: initialAchievement.featuredImageStaging || null,
        imageAlt: initialAchievement.imageAlt || createEmptyLocalizedText(),
        imagePosition: initialAchievement.imagePosition || 'center',
      };
    }
    return {
      slug: '',
      title: createEmptyLocalizedText(),
      summary: createEmptyLocalizedText(),
      content: [
        {
          id: `blk_${Date.now()}_1`,
          type: 'paragraph',
          content: createEmptyLocalizedText(),
        },
      ],
      category: 'productivity',
      tags: [],
      featured: false,
      achievementDate: new Date().toISOString().slice(0, 10),
      responsibleOffice: {
        om: 'Biiroo Qonnaa Oromiyaa',
        am: 'የኦሮሚያ ግብርና ቢሮ',
        en: 'Oromia Agricultural Bureau',
      },
      location: createEmptyLocalizedText(),
      metrics: [],
      beforeAfter: null,
      gallery: [],
      featuredImageSource: 'external',
      featuredImage: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80',
      imageAlt: createEmptyLocalizedText(),
      imagePosition: 'center',
    };
  }, [initialAchievement]);

  const [formData, setFormData] = useState<AchievementInput>(initialFormState);
  const [baselineForm, setBaselineForm] = useState<string>(() => JSON.stringify(initialFormState));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'metrics' | 'media'>('basic');

  // Recovery Prompt state
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any | null>(null);

  const currentKeyId = isEditMode && (achievement?.slug || initialAchievement?.slug) ? (achievement?.slug || initialAchievement?.slug) : formData.slug || 'new';

  const dirty = JSON.stringify(formData) !== baselineForm;

  const refreshAchievementRecord = async (targetSlug: string) => {
    if (!staffUser) return;
    try {
      const updated = await getAchievementBySlugForAdmin(targetSlug, staffUser);
      if (updated) {
        setAchievement(updated);
        if (updated.version) {
          currentVersionRef.current = updated.version;
        }
      }
    } catch (err) {
      console.error('[AchievementEditorForm] Failed to refresh achievement record:', err);
    }
  };

  // Check draft recovery on mount
  useEffect(() => {
    if (!staffUser?.uid) return;
    const existingRecovery = getAchievementDraftRecovery(staffUser.uid, currentKeyId || 'new');
    if (existingRecovery && existingRecovery.formData) {
      setRecoveryData(existingRecovery);
      setShowRecoveryPrompt(true);
    }
  }, [staffUser?.uid, currentKeyId]);

  // Auto-save draft recovery to sessionStorage on edits
  useEffect(() => {
    if (!staffUser?.uid || !dirty) return;
    const timer = setTimeout(() => {
      saveAchievementDraftRecovery(
        staffUser.uid,
        currentKeyId || 'new',
        formData,
        location.pathname,
        currentVersionRef.current
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, dirty, staffUser?.uid, currentKeyId, location.pathname]);

  const handleApplyRecovery = () => {
    if (recoveryData && recoveryData.formData) {
      setFormData(recoveryData.formData);
      showToast('Restored unsaved working draft from your previous browser session.', 'info', 'Draft Restored');
    }
    setShowRecoveryPrompt(false);
  };

  const handleDiscardRecovery = () => {
    if (staffUser?.uid) {
      clearAchievementDraftRecovery(staffUser.uid, currentKeyId || 'new');
    }
    setShowRecoveryPrompt(false);
  };

  const handleGenerateSlug = () => {
    const generated = generateSlugFromTitles(formData.title);
    setFormData((prev) => ({ ...prev, slug: generated }));
  };

  const handleSaveDraft = async (redirectAfterSave?: boolean): Promise<{ success: boolean; slug: string }> => {
    if (!staffUser) {
      showToast('Staff session required.', 'error', 'Authentication Error');
      return { success: false, slug: '' };
    }

    // Auto-generate slug if blank
    let activeSlug = formData.slug.trim();
    if (!activeSlug) {
      activeSlug = generateSlugFromTitles(formData.title);
      setFormData((prev) => ({ ...prev, slug: activeSlug }));
    }

    const slugCheck = validateSlug(activeSlug);
    if (!slugCheck.valid) {
      setValidationErrors([slugCheck.error || 'Invalid slug format.']);
      showToast(slugCheck.error || 'Invalid slug.', 'error', 'Validation Failure');
      return { success: false, slug: '' };
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      if (!isEditMode) {
        // Create draft
        const res = await createAchievementDraft(
          { ...formData, slug: activeSlug },
          staffUser
        );

        if (res.success) {
          clearAchievementDraftRecovery(staffUser.uid, activeSlug);
          if (res.version) currentVersionRef.current = res.version;
          setBaselineForm(JSON.stringify({ ...formData, slug: activeSlug }));

          await refreshAchievementRecord(res.slug);
          showToast(`Achievement draft "${activeSlug}" created successfully.`, 'success', 'Draft Created');

          if (redirectAfterSave) {
            navigate(`/admin/achievements/${res.slug}/edit`);
          }
          return { success: true, slug: res.slug };
        } else {
          setValidationErrors([res.error || 'Failed to create draft in Firestore.']);
          showToast(res.error || 'Save failed.', 'error', 'Creation Error');
          return { success: false, slug: '' };
        }
      } else {
        // Update draft
        const targetSlug = achievement?.slug || initialAchievement?.slug || activeSlug;
        const res = await updateAchievementDraft(
          targetSlug,
          formData,
          staffUser,
          currentVersionRef.current
        );

        if (res.success) {
          clearAchievementDraftRecovery(staffUser.uid, targetSlug);
          if (res.version) currentVersionRef.current = res.version;
          setBaselineForm(JSON.stringify(formData));

          await refreshAchievementRecord(targetSlug);
          showToast('Achievement draft updated successfully.', 'success', 'Draft Saved');

          return { success: true, slug: targetSlug };
        } else {
          setValidationErrors([res.error || 'Failed to update draft in Firestore.']);
          showToast(res.error || 'Update failed.', 'error', 'Save Failure');
          return { success: false, slug: '' };
        }
      }
    } catch (err: any) {
      setValidationErrors([err?.message || 'An unexpected error occurred during save.']);
      showToast(err?.message || 'Save error.', 'error', 'System Error');
      return { success: false, slug: '' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndPreview = async () => {
    const saveRes = await handleSaveDraft(false);
    if (saveRes.success && saveRes.slug) {
      navigate(`/admin/achievements/${saveRes.slug}/preview`);
    }
  };

  const handleSubmitForReview = async () => {
    if (!staffUser || !isEditMode) return;
    const targetSlug = achievement?.slug || initialAchievement?.slug || formData.slug;
    if (!targetSlug) return;

    // Validate review readiness
    const valRes = validateAchievementForReview(formData);
    if (!valRes.valid) {
      setValidationErrors(valRes.errors);
      showToast('Please complete required fields before submitting for review.', 'warning', 'Review Validation Failed');
      return;
    }

    if (dirty) {
      const saveRes = await handleSaveDraft(false);
      if (!saveRes.success) return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);
    try {
      const res = await submitAchievementForReview(
        targetSlug,
        staffUser,
        currentVersionRef.current
      );

      if (res.success) {
        showToast('Achievement has been submitted for editorial review.', 'success', 'Submitted for Review');
        const newVersion = res.version || (currentVersionRef.current + 1);
        currentVersionRef.current = newVersion;
        setAchievement((prev) => (prev ? { ...prev, status: 'review', version: newVersion } : null));
        await refreshAchievementRecord(targetSlug);
      } else {
        setValidationErrors([res.error || 'Failed to submit for review.']);
        showToast(res.error || 'Failed to submit.', 'error', 'Submission Error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Submission error.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToDraft = async () => {
    if (!staffUser || !isEditMode) return;
    const targetSlug = achievement?.slug || initialAchievement?.slug || formData.slug;
    if (!targetSlug) return;

    setIsSubmitting(true);
    try {
      const res = await returnAchievementToDraft(
        targetSlug,
        staffUser,
        currentVersionRef.current
      );

      if (res.success) {
        showToast('Achievement returned to draft.', 'success', 'Returned to Draft');
        const newVersion = res.version || (currentVersionRef.current + 1);
        currentVersionRef.current = newVersion;
        setAchievement((prev) => (prev ? { ...prev, status: 'draft', version: newVersion } : null));
        await refreshAchievementRecord(targetSlug);
      } else {
        showToast(res.error || 'Failed to return to draft.', 'error', 'Error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error returning to draft.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!staffUser || !isEditMode) return;
    const targetSlug = achievement?.slug || initialAchievement?.slug || formData.slug;
    if (!targetSlug) return;

    if (dirty) {
      const saveRes = await handleSaveDraft(false);
      if (!saveRes.success) return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);
    try {
      const res = await publishAchievement(
        targetSlug,
        staffUser,
        currentVersionRef.current
      );

      if (res.success) {
        showToast('Achievement published live successfully.', 'success', 'Published Live');
        const newVersion = res.version || (currentVersionRef.current + 1);
        currentVersionRef.current = newVersion;
        setAchievement((prev) => (prev ? { ...prev, status: 'published', version: newVersion } : null));
        await refreshAchievementRecord(targetSlug);
      } else {
        setValidationErrors([res.error || 'Failed to publish achievement.']);
        showToast(res.error || 'Failed to publish.', 'error', 'Publishing Error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Publishing error.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpublish = async () => {
    if (!staffUser || !isEditMode) return;
    const targetSlug = achievement?.slug || initialAchievement?.slug || formData.slug;
    if (!targetSlug) return;

    setIsSubmitting(true);
    try {
      const res = await unpublishAchievement(
        targetSlug,
        staffUser,
        currentVersionRef.current
      );

      if (res.success) {
        showToast('Achievement unpublished.', 'info', 'Unpublished');
        const newVersion = res.version || (currentVersionRef.current + 1);
        currentVersionRef.current = newVersion;
        setAchievement((prev) => (prev ? { ...prev, status: 'unpublished', version: newVersion } : null));
        await refreshAchievementRecord(targetSlug);
      } else {
        showToast(res.error || 'Failed to unpublish.', 'error', 'Error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Unpublishing error.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!staffUser || !isEditMode) return;
    const targetSlug = achievement?.slug || initialAchievement?.slug || formData.slug;
    if (!targetSlug) return;

    setIsSubmitting(true);
    try {
      const res = await archiveAchievement(
        targetSlug,
        staffUser,
        currentVersionRef.current
      );

      if (res.success) {
        showToast('Achievement archived.', 'info', 'Archived');
        const newVersion = res.version || (currentVersionRef.current + 1);
        currentVersionRef.current = newVersion;
        setAchievement((prev) => (prev ? { ...prev, status: 'archived', version: newVersion } : null));
        await refreshAchievementRecord(targetSlug);
      } else {
        showToast(res.error || 'Failed to archive.', 'error', 'Error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Archive error.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTrash = async (reason: string) => {
    if (!staffUser || !isEditMode) return;
    const targetSlug = achievement?.slug || initialAchievement?.slug || formData.slug;
    if (!targetSlug) return;

    setIsSubmitting(true);
    try {
      const res = await moveAchievementToTrash(
        targetSlug,
        reason,
        staffUser,
        currentVersionRef.current
      );

      if (res.success) {
        showToast('Achievement moved to trash.', 'info', 'Moved to Trash');
        const newVersion = res.version || (currentVersionRef.current + 1);
        currentVersionRef.current = newVersion;
        setAchievement((prev) => (prev ? { ...prev, status: 'trashed', version: newVersion } : null));
        await refreshAchievementRecord(targetSlug);
      } else {
        showToast(res.error || 'Failed to move to trash.', 'error', 'Error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Trash error.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!staffUser || !isEditMode) return;
    const targetSlug = achievement?.slug || initialAchievement?.slug || formData.slug;
    if (!targetSlug) return;

    setIsSubmitting(true);
    try {
      const res = await restoreAchievement(
        targetSlug,
        staffUser,
        currentVersionRef.current
      );

      if (res.success) {
        showToast('Achievement restored from trash.', 'success', 'Restored');
        const newVersion = res.version || (currentVersionRef.current + 1);
        currentVersionRef.current = newVersion;
        await refreshAchievementRecord(targetSlug);
      } else {
        showToast(res.error || 'Failed to restore.', 'error', 'Error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Restore error.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!staffUser || !isEditMode) return;
    const targetSlug = achievement?.slug || initialAchievement?.slug || formData.slug;
    if (!targetSlug) return;

    setIsSubmitting(true);
    try {
      const res = await permanentlyDeleteAchievement(
        targetSlug,
        staffUser
      );

      if (res.success) {
        showToast('Achievement permanently deleted.', 'info', 'Permanently Deleted');
        navigate('/admin/achievements');
      } else {
        showToast(res.error || 'Failed to delete permanently.', 'error', 'Error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Delete error.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (dirty) {
      setPendingNavigationPath('/admin/achievements');
      setShowUnsavedDialog(true);
    } else {
      navigate('/admin/achievements');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Unsaved Recovery Prompt */}
      {showRecoveryPrompt && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Unsaved Session Draft Detected</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                You have unsaved working changes from a previous browser session ({recoveryData?.lastUpdated ? new Date(recoveryData.lastUpdated).toLocaleTimeString() : 'Recent'}).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDiscardRecovery}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleApplyRecovery}
              className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors"
            >
              Restore Draft
            </button>
          </div>
        </div>
      )}

      {/* Top Header / Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isEditMode ? 'Edit Achievement' : 'Create New Achievement'}
              </h1>
              <AchievementStatusBadge status={currentStatus} />
              {dirty && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? `Slug: ${achievement?.slug || initialAchievement?.slug || formData.slug} | Version v${currentVersionRef.current}`
                : 'Author multi-language agricultural achievements with localized metrics and media.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Public Page (if published) */}
          {isEditMode && currentStatus === 'published' && (
            <a
              href={`/achievements/${achievement?.slug || initialAchievement?.slug || formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Public Page</span>
            </a>
          )}

          {/* Save Draft */}
          {(currentStatus === 'draft' || currentStatus === 'review' || currentStatus === 'unpublished' || !isEditMode) && (canCreate || canEdit) && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveDraft(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-600" />}
              <span>Save Draft</span>
            </button>
          )}

          {/* Save & Preview */}
          {currentStatus !== 'trashed' && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveAndPreview}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              <Eye className="w-4 h-4 text-blue-500" />
              <span>Save &amp; Preview</span>
            </button>
          )}

          {/* Submit for Review: ONLY when status === 'draft' */}
          {isEditMode && currentStatus === 'draft' && (canReview || canEdit) && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitForReview}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Submit for Review</span>
            </button>
          )}

          {/* Return to Draft: when status === 'review' or status === 'archived' */}
          {isEditMode && (currentStatus === 'review' || currentStatus === 'archived') && (canReview || canEdit) && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleReturnToDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Return to Draft</span>
            </button>
          )}

          {/* Publish Live / Republish: when status === 'review' or status === 'unpublished' */}
          {isEditMode && (currentStatus === 'review' || currentStatus === 'unpublished') && canPublish && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Live</span>
            </button>
          )}

          {/* Unpublish: when status === 'published' */}
          {isEditMode && currentStatus === 'published' && canPublish && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleUnpublish}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <EyeOff className="w-4 h-4" />
              <span>Unpublish</span>
            </button>
          )}

          {/* Archive: when status === 'published' || status === 'review' || status === 'unpublished' */}
          {isEditMode && (currentStatus === 'published' || currentStatus === 'review' || currentStatus === 'unpublished') && (canPublish || staffUser?.role === 'superAdmin') && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleArchive}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold rounded-xl transition-colors border border-purple-200 dark:border-purple-800"
            >
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
          )}

          {/* Move to Trash: when status !== 'trashed' */}
          {isEditMode && currentStatus !== 'trashed' && canTrash && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowTrashModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold rounded-xl transition-colors border border-rose-200 dark:border-rose-800"
            >
              <Trash2 className="w-4 h-4" />
              <span>Trash</span>
            </button>
          )}

          {/* Restore from Trash: when status === 'trashed' */}
          {isEditMode && currentStatus === 'trashed' && canRestore && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRestore}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore Achievement</span>
            </button>
          )}

          {/* Permanent Delete: when status === 'trashed' */}
          {isEditMode && currentStatus === 'trashed' && canDelete && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Permanently</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation Errors Banner */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Please correct the following errors:</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-400 space-y-1 pl-2">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-2xl shadow-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'basic'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Basic &amp; Metadata</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'content'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Story Content ({formData.content?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'metrics'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Impact Metrics &amp; Before/After ({formData.metrics?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'media'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Managed Media &amp; Gallery ({formData.gallery?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Basic & Metadata */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Localized Titles &amp; Summary</span>
            </h3>

            <LocalizedTextFields
              label="Achievement Title"
              value={formData.title}
              onChange={(title) => setFormData((prev) => ({ ...prev, title }))}
              requiredOm={true}
              placeholderOm="Mata duree milkaa'inaa..."
              placeholderAm="የስኬት ርዕስ..."
              placeholderEn="Achievement title..."
            />

            <LocalizedTextFields
              label="Achievement Summary"
              value={formData.summary}
              onChange={(summary) => setFormData((prev) => ({ ...prev, summary }))}
              requiredOm={true}
              multiline={true}
              rows={3}
              placeholderOm="Gabaasa gabaabaa milkaa'inaa..."
              placeholderAm="የስኬት አጭር መግለጫ..."
              placeholderEn="Executive summary of achievement..."
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Category &amp; Identifiers</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slug field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    URL Slug <span className="text-rose-500">*</span>
                  </label>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-generate
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={isEditMode}
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g. wheat-productivity-arsoota-2025"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white disabled:opacity-60"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value as AchievementCategory }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                >
                  <option value="productivity">Crop Productivity &amp; Food Security</option>
                  <option value="irrigation">Irrigation &amp; Water Management</option>
                  <option value="livestock">Livestock &amp; Dairy Sector</option>
                  <option value="extension">Agricultural Extension &amp; Training</option>
                  <option value="mechanization">Agricultural Mechanization</option>
                  <option value="natural-resources">Natural Resource Conservation</option>
                  <option value="market-access">Market Access &amp; Trade</option>
                  <option value="youth-and-women">Youth &amp; Women Empowerment</option>
                  <option value="other">Other Agriculture Initiatives</option>
                </select>
              </div>

              {/* Achievement Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Achievement Date
                </label>
                <input
                  type="date"
                  value={formData.achievementDate || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, achievementDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Featured Achievement
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Highlight on homepage carousel and top spot.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <LocalizedTextFields
              label="Responsible Bureau / Office"
              value={formData.responsibleOffice}
              onChange={(responsibleOffice) => setFormData((prev) => ({ ...prev, responsibleOffice }))}
              placeholderOm="Biiroo Qonnaa Oromiyaa..."
              placeholderAm="የኦሮሚያ ግብርና ቢሮ..."
              placeholderEn="Oromia Agricultural Bureau..."
            />

            <LocalizedTextFields
              label="Location / Zone / Woreda Details"
              value={formData.location || createEmptyLocalizedText()}
              onChange={(location) => setFormData((prev) => ({ ...prev, location }))}
              placeholderOm="Godina, Aanaa, fi Naannoo..."
              placeholderAm="ዞን፣ ወረዳ እና አካባቢ..."
              placeholderEn="Zone, Woreda, and specific location..."
            />
          </div>
        </div>
      )}

      {/* Tab 2: Story Content Blocks */}
      {activeTab === 'content' && (
        <AchievementContentBlockEditor
          blocks={formData.content || []}
          onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
        />
      )}

      {/* Tab 3: Impact Metrics & Before/After */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <AchievementMetricsBuilder
            metrics={formData.metrics || []}
            onChange={(metrics) => setFormData((prev) => ({ ...prev, metrics }))}
          />

          <AchievementBeforeAfterBuilder
            beforeAfter={formData.beforeAfter || null}
            onChange={(beforeAfter) => setFormData((prev) => ({ ...prev, beforeAfter }))}
          />
        </div>
      )}

      {/* Tab 4: Managed Media & Gallery */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <AchievementFeaturedImageUploader
            authenticatedUid={staffUser?.uid || 'system_admin'}
            source={formData.featuredImageSource || 'none'}
            externalUrl={formData.featuredImage || ''}
            stagedImage={formData.featuredImageStaging}
            imageAlt={formData.imageAlt}
            imagePosition={formData.imagePosition || 'center'}
            onSourceChange={(featuredImageSource) => setFormData((prev) => ({ ...prev, featuredImageSource }))}
            onExternalUrlChange={(featuredImage) => setFormData((prev) => ({ ...prev, featuredImage }))}
            onStagedImageChange={(featuredImageStaging) => setFormData((prev) => ({ ...prev, featuredImageStaging }))}
            onManagedReady={(mediaId, managed) => {
              setFormData((prev) => ({
                ...prev,
                featuredImageAssetId: mediaId,
                featuredImageManaged: managed,
                featuredImage: managed.urls.hero,
              }));
            }}
            onAltChange={(imageAlt) => setFormData((prev) => ({ ...prev, imageAlt }))}
            onPositionChange={(imagePosition) => setFormData((prev) => ({ ...prev, imagePosition }))}
          />

          <AchievementGalleryUploader
            authenticatedUid={staffUser?.uid || 'system_admin'}
            items={formData.gallery || []}
            onChange={(gallery) => setFormData((prev) => ({ ...prev, gallery }))}
          />
        </div>
      )}

      {/* Modals for Trash and Permanent Delete */}
      <TrashConfirmModal
        isOpen={showTrashModal}
        achievementTitle={formData.title.en || formData.title.om || 'Achievement'}
        achievementSlug={achievement?.slug || initialAchievement?.slug || formData.slug}
        currentStatus={currentStatus}
        onClose={() => setShowTrashModal(false)}
        onConfirm={handleConfirmTrash}
      />

      <PermanentDeleteConfirmModal
        isOpen={showDeleteModal}
        achievementTitle={formData.title.en || formData.title.om || 'Achievement'}
        achievementSlug={achievement?.slug || initialAchievement?.slug || formData.slug}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmPermanentDelete}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onConfirm={() => {
          setShowUnsavedDialog(false);
          if (pendingNavigationPath) {
            navigate(pendingNavigationPath);
          }
        }}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </div>
  );
};
