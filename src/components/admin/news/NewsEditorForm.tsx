import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStaffAuthorization } from '../../../hooks/useStaffAuthorization';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  NewsArticleInput,
  NewsArticle,
  createEmptyLocalizedText,
  generateSlugFromTitles,
  validateSlug,
  normalizeArticleForm,
  isFormDirty,
  validateForPublishing,
  validateForReview,
  validateDraft,
  formatFirestoreTimestamp,
} from '../../../types/news';
import { LocalizedTextFields } from './LocalizedTextFields';
import { NewsMetadataFields } from './NewsMetadataFields';
import { NewsContentBlockEditor } from './NewsContentBlockEditor';
import { NewsStatusBadge } from './NewsStatusBadge';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import {
  saveDraftRecovery,
  getDraftRecovery,
  clearDraftRecovery,
} from '../../../services/newsDraftRecoveryService';
import {
  createNewsDraft,
  updateNewsDraft,
  submitNewsForReview,
  publishNewsArticle,
  unpublishNewsArticle,
  archiveNewsArticle,
} from '../../../services/newsService';
import {
  Save,
  Eye,
  Send,
  CheckCircle2,
  EyeOff,
  Archive,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

interface NewsEditorFormProps {
  initialArticle?: NewsArticle | null;
  isEditMode?: boolean;
}

export const NewsEditorForm: React.FC<NewsEditorFormProps> = ({
  initialArticle,
  isEditMode = false,
}) => {
  const navigate = useNavigate();
  const { staffUser, hasPermission, role, authorizationStatus } = useStaffAuthorization();
  const { showToast } = useToast();
  const { language } = useLanguage();

  const isSubmittingRef = useRef(false);

  // Initialize form state
  const initialFormState: NewsArticleInput = React.useMemo(() => {
    if (initialArticle) {
      return {
        slug: initialArticle.slug,
        title: initialArticle.title || createEmptyLocalizedText(),
        excerpt: initialArticle.excerpt || createEmptyLocalizedText(),
        content: initialArticle.content || [],
        category: initialArticle.category || 'news',
        tags: initialArticle.tags || [],
        featuredImage: initialArticle.featuredImage || '',
        featuredImageSource: initialArticle.featuredImageSource || (initialArticle.featuredImageManaged ? 'managed' : 'external'),
        featuredImageAssetId: initialArticle.featuredImageAssetId || null,
        featuredImageManaged: initialArticle.featuredImageManaged || null,
        featuredImageStaging: initialArticle.featuredImageStaging || null,
        imageAlt: initialArticle.imageAlt || createEmptyLocalizedText(),
        responsibleOffice: initialArticle.responsibleOffice || createEmptyLocalizedText(),
        authorName: initialArticle.authorName || createEmptyLocalizedText(),
        featured: Boolean(initialArticle.featured),
      };
    }
    return {
      slug: '',
      title: createEmptyLocalizedText(),
      excerpt: createEmptyLocalizedText(),
      content: [
        {
          id: `blk_${Date.now()}_1`,
          type: 'paragraph',
          content: createEmptyLocalizedText(),
        },
      ],
      category: 'news',
      tags: [],
      featuredImage: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80',
      imageAlt: createEmptyLocalizedText(),
      responsibleOffice: {
        om: 'Biiroo Qonnaa Oromiyaa',
        am: 'የኦሮሚያ ግብርና ቢሮ',
        en: 'Oromia Agricultural Bureau',
      },
      authorName: createEmptyLocalizedText(),
      featured: false,
    };
  }, [initialArticle]);

  const [formData, setFormData] = useState<NewsArticleInput>(initialFormState);
  const [baselineForm, setBaselineForm] = useState<any>(() => normalizeArticleForm(initialFormState));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);

  // Dynamic version state to prevent stale optimistic concurrency checks
  const currentVersionRef = useRef<number>(initialArticle?.version || 1);
  useEffect(() => {
    if (initialArticle?.version) {
      currentVersionRef.current = initialArticle.version;
    }
  }, [initialArticle?.version]);

  // Recovery Prompt state
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any | null>(null);

  // Confirmation Modals state
  const [confirmPublishModal, setConfirmPublishModal] = useState(false);
  const [confirmUnpublishModal, setConfirmUnpublishModal] = useState(false);
  const [confirmArchiveModal, setConfirmArchiveModal] = useState(false);

  const currentKeyId = isEditMode && initialArticle ? initialArticle.slug : formData.slug || 'new';

  const location = useLocation();
  const hasRestoredRef = useRef(false);

  // Compute dirty status by comparing normalized structures
  const dirty = isFormDirty(formData, baselineForm);

  // Check draft recovery on mount or location change
  useEffect(() => {
    if (!staffUser?.uid || hasRestoredRef.current) return;

    // Order 1: Matching preview/recovery state passed via location state
    if (location.state?.fromPreview && location.state?.previewData) {
      setFormData(location.state.previewData);
      hasRestoredRef.current = true;
      showToast('Form state restored from preview.', 'info');
      return;
    }

    // Order 2: Same-user sessionStorage draft recovery data
    const existingRecovery = getDraftRecovery(staffUser.uid, currentKeyId);
    if (existingRecovery && existingRecovery.formData) {
      if (location.state?.fromPreview) {
        setFormData(existingRecovery.formData);
        hasRestoredRef.current = true;
        showToast('Form state restored from recovery draft.', 'info');
      } else {
        const recNorm = normalizeArticleForm(existingRecovery.formData);
        const initNorm = normalizeArticleForm(initialFormState);
        if (JSON.stringify(recNorm) !== JSON.stringify(initNorm)) {
          setRecoveryData(existingRecovery);
          setShowRecoveryPrompt(true);
        }
      }
    }
  }, [staffUser?.uid, currentKeyId, location.state, initialFormState, showToast]);

  // Window beforeunload listener when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  // Auto-save draft recovery copy to sessionStorage on form changes
  useEffect(() => {
    if (dirty && staffUser?.uid) {
      saveDraftRecovery(
        staffUser.uid,
        currentKeyId,
        formData,
        window.location.pathname,
        initialArticle?.version
      );
    }
  }, [formData, dirty, staffUser?.uid, currentKeyId, initialArticle?.version]);

  // Real-time permission/account active watcher
  useEffect(() => {
    if (authorizationStatus === 'inactive' || (staffUser && !staffUser.active)) {
      if (dirty && staffUser?.uid) {
        saveDraftRecovery(
          staffUser.uid,
          currentKeyId,
          formData,
          window.location.pathname,
          initialArticle?.version
        );
      }
      showToast('Account deactivated. Unsaved changes have been backed up.', 'error');
    }
  }, [authorizationStatus, staffUser, dirty, currentKeyId, formData, initialArticle?.version, showToast]);

  // Re-run publication validation immediately when formData changes if validation errors were active
  useEffect(() => {
    if (validationErrors.length > 0) {
      const pubCheck = validateForPublishing(formData);
      if (pubCheck.valid) {
        setValidationErrors([]);
      } else {
        setValidationErrors(pubCheck.errors);
      }
    }
  }, [formData]);

  // Auto-generate slug for new articles when empty
  const handleTitleChange = (newTitle: any) => {
    const updated = { ...formData, title: newTitle };
    if (!isEditMode && (!formData.slug || formData.slug === generateSlugFromTitles(formData.title))) {
      const autoSlug = generateSlugFromTitles(newTitle);
      updated.slug = autoSlug;
    }
    setFormData(updated);
    setValidationErrors([]);
  };

  const handleRestoreRecovery = () => {
    if (recoveryData?.formData) {
      setFormData(recoveryData.formData);
      showToast('Unsaved draft restored from session storage.', 'info');
    }
    setShowRecoveryPrompt(false);
  };

  const handleDiscardRecovery = () => {
    if (staffUser?.uid) {
      clearDraftRecovery(staffUser.uid, currentKeyId);
    }
    setShowRecoveryPrompt(false);
    showToast('Session recovery copy discarded.', 'info');
  };

  const currentStatus = initialArticle?.status || 'draft';
  const isPublished = currentStatus === 'published';
  const isEditorRole = role === 'editor';
  const isReadOnlyEditorOnPublished = isPublished && isEditorRole;

  const canPublish = hasPermission('content.publish');
  const canCreate = hasPermission('content.create');
  const canEdit = hasPermission('content.edit');

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!staffUser || isSubmittingRef.current) return;

    // Validate slug
    const slugCheck = validateSlug(formData.slug);
    if (!slugCheck.valid) {
      setValidationErrors([slugCheck.error || 'Invalid slug']);
      showToast('Please fix the URL slug before saving.', 'error');
      return;
    }

    // Validate draft minimal fields
    const draftCheck = validateDraft(formData);
    if (!draftCheck.valid) {
      setValidationErrors(draftCheck.errors);
      showToast('Draft validation failed.', 'error');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      if (isEditMode && initialArticle) {
        const res = await updateNewsDraft(initialArticle.slug, formData, staffUser, currentVersionRef.current);
        if (res.success) {
          if (res.version) {
            currentVersionRef.current = res.version;
          } else {
            currentVersionRef.current += 1;
          }
          showToast('Draft updated successfully.', 'success');
          setBaselineForm(normalizeArticleForm(formData));
          clearDraftRecovery(staffUser.uid, initialArticle.slug);
        } else {
          showToast(res.error || 'Failed to update draft.', 'error');
        }
      } else {
        const res = await createNewsDraft(formData, staffUser);
        if (res.success) {
          if (res.version) {
            currentVersionRef.current = res.version;
          }
          showToast('New draft saved successfully.', 'success');
          setBaselineForm(normalizeArticleForm(formData));
          clearDraftRecovery(staffUser.uid, res.slug);
          navigate(`/admin/news/${res.slug}/edit`);
        } else {
          showToast(res.error || 'Failed to create draft.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving draft.', 'error');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Submit for Review Handler
  const handleSubmitForReview = async () => {
    if (!staffUser || !initialArticle || isSubmittingRef.current) return;

    const revCheck = validateForReview(formData);
    if (!revCheck.valid) {
      setValidationErrors(revCheck.errors);
      showToast('Validation failed. Please fix required fields before submitting for review.', 'error');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // First update edits using current ref version
      const updateRes = await updateNewsDraft(initialArticle.slug, formData, staffUser, currentVersionRef.current);
      if (!updateRes.success) {
        showToast(updateRes.error || 'Failed to save edits prior to submission.', 'error');
        return;
      }
      if (updateRes.version) {
        currentVersionRef.current = updateRes.version;
      } else {
        currentVersionRef.current += 1;
      }

      const res = await submitNewsForReview(initialArticle.slug, staffUser, currentVersionRef.current);
      if (res.success) {
        showToast('Article submitted for administrator review.', 'success');
        setBaselineForm(normalizeArticleForm(formData));
        clearDraftRecovery(staffUser.uid, initialArticle.slug);
        navigate('/admin/news');
      } else {
        showToast(res.error || 'Failed to submit article for review.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Submission failed.', 'error');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Publish Handler
  const handleExecutePublish = async () => {
    if (!staffUser || isSubmittingRef.current) return;

    const pubCheck = validateForPublishing(formData);
    if (!pubCheck.valid) {
      setValidationErrors(pubCheck.errors);
      showToast('Publishing validation failed. Please correct all errors.', 'error');
      setConfirmPublishModal(false);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setValidationErrors([]);
    setConfirmPublishModal(false);

    try {
      const targetSlug = isEditMode && initialArticle ? initialArticle.slug : formData.slug;

      if (!isEditMode) {
        const createRes = await createNewsDraft(formData, staffUser);
        if (!createRes.success) {
          showToast(createRes.error || 'Failed to save draft before publishing.', 'error');
          return;
        }
        if (createRes.version) currentVersionRef.current = createRes.version;
      } else {
        const updateRes = await updateNewsDraft(targetSlug, formData, staffUser, currentVersionRef.current);
        if (!updateRes.success) {
          showToast(updateRes.error || 'Failed to update article before publishing.', 'error');
          return;
        }
        if (updateRes.version) {
          currentVersionRef.current = updateRes.version;
        } else {
          currentVersionRef.current += 1;
        }
      }

      const res = await publishNewsArticle(targetSlug, staffUser);
      if (res.success) {
        showToast('News article published successfully! It is now live on the public portal.', 'success');
        setBaselineForm(normalizeArticleForm(formData));
        clearDraftRecovery(staffUser.uid, targetSlug);
        navigate('/admin/news');
      } else {
        showToast(res.error || 'Failed to publish article.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Publish operation failed.', 'error');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Unpublish Handler
  const handleExecuteUnpublish = async () => {
    if (!staffUser || !initialArticle || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setConfirmUnpublishModal(false);

    try {
      const res = await unpublishNewsArticle(initialArticle.slug, staffUser, currentVersionRef.current);
      if (res.success) {
        showToast('Article unpublished. It is no longer visible to the public.', 'info');
        setBaselineForm(normalizeArticleForm(formData));
        clearDraftRecovery(staffUser.uid, initialArticle.slug);
        navigate('/admin/news');
      } else {
        showToast(res.error || 'Failed to unpublish article.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Unpublish operation failed.', 'error');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Archive Handler
  const handleExecuteArchive = async () => {
    if (!staffUser || !initialArticle || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setConfirmArchiveModal(false);

    try {
      const res = await archiveNewsArticle(initialArticle.slug, staffUser, currentVersionRef.current);
      if (res.success) {
        showToast('Article archived.', 'info');
        setBaselineForm(normalizeArticleForm(formData));
        clearDraftRecovery(staffUser.uid, initialArticle.slug);
        navigate('/admin/news');
      } else {
        showToast(res.error || 'Failed to archive article.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Archive operation failed.', 'error');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleBackToDirectory = () => {
    if (dirty) {
      setPendingNavigationPath('/admin/news');
      setShowUnsavedDialog(true);
    } else {
      navigate('/admin/news');
    }
  };

  const getSaveAndPreviewLabel = () => {
    if (language === 'om') return "Olkaa'ii & Dur-ilaali";
    if (language === 'am') return 'አስቀምጥ እና ቅድመ እይታ';
    return 'Save & Preview';
  };

  const handleSaveAndPreview = async () => {
    if (!staffUser || isSubmittingRef.current) return;

    // 1. Validate slug
    const slugCheck = validateSlug(formData.slug);
    if (!slugCheck.valid) {
      setValidationErrors([slugCheck.error || 'Invalid slug']);
      showToast('Please fix the URL slug before previewing.', 'error');
      return;
    }

    // 2. Validate draft minimal fields
    const draftCheck = validateDraft(formData);
    if (!draftCheck.valid) {
      setValidationErrors(draftCheck.errors);
      showToast('Draft validation failed.', 'error');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      if (isEditMode && initialArticle) {
        const res = await updateNewsDraft(initialArticle.slug, formData, staffUser, initialArticle.version);
        if (res.success) {
          showToast('Draft saved. Opening preview...', 'success');
          setBaselineForm(normalizeArticleForm(formData));
          clearDraftRecovery(staffUser.uid, initialArticle.slug);
          navigate(`/admin/news/${initialArticle.slug}/preview`);
        } else {
          showToast(res.error || 'Failed to save draft before preview.', 'error');
        }
      } else {
        const res = await createNewsDraft(formData, staffUser);
        if (res.success) {
          showToast('New draft saved. Opening preview...', 'success');
          setBaselineForm(normalizeArticleForm(formData));
          clearDraftRecovery(staffUser.uid, res.slug);
          navigate(`/admin/news/${res.slug}/preview`);
        } else {
          showToast(res.error || 'Failed to create draft before preview.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving draft before preview.', 'error');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (isReadOnlyEditorOnPublished) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        <div className="bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl flex items-start gap-4">
          <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Read-Only Access — Article is Published
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Editors cannot directly edit live, published articles. To request modifications, contact a Content Administrator or Super Admin.
            </p>
            <button
              onClick={() => navigate('/admin/news')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl mt-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to News List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Recovery Prompt Modal */}
      {showRecoveryPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <RefreshCw className="w-6 h-6 animate-spin-slow" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Unsaved Changes Recovered</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              We found an unsaved session recovery draft from{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {recoveryData?.lastUpdated ? new Date(recoveryData.lastUpdated).toLocaleTimeString() : 'earlier session'}
              </span>
              . Would you like to restore your unsaved edits or discard them?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleDiscardRecovery}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Discard Recovery
              </button>
              <button
                onClick={handleRestoreRecovery}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
              >
                Restore Unsaved Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {confirmPublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Article Publication</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to publish this article live to the public website?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmPublishModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePublish}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Publish Live Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmUnpublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <EyeOff className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Unpublish</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will remove the article from the public portal immediately. It will remain in the CMS as an unpublished document.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmUnpublishModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteUnpublish}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Unpublish Article</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Archive className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Archive</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to archive this article?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmArchiveModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteArchive}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Archive Article</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToDirectory}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to News List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                {isEditMode ? 'Edit News Article' : 'Create Multilingual News Draft'}
              </h1>
              <NewsStatusBadge status={currentStatus} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              {dirty ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold">Unsaved changes</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">All changes saved</span>
              )}
              {initialArticle?.version && (
                <span className="text-slate-400 dark:text-slate-600">• Version {initialArticle.version}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save & Preview Button */}
          <button
            type="button"
            onClick={handleSaveAndPreview}
            disabled={isSubmitting}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-blue-500" />
            )}
            <span>{getSaveAndPreviewLabel()}</span>
          </button>

          {/* Save Draft Button */}
          {(canCreate || canEdit) && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Draft</span>
            </button>
          )}

          {/* Submit for Review (Editor) */}
          {isEditorRole && currentStatus === 'draft' && isEditMode && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Submit for Review</span>
            </button>
          )}

          {/* Publish / Unpublish / Archive (Content Admin / Super Admin) */}
          {canPublish && (
            <>
              {currentStatus !== 'published' ? (
                <button
                  type="button"
                  onClick={() => setConfirmPublishModal(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#075D3A] hover:bg-emerald-800 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Publish Live
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmUnpublishModal(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Unpublish
                </button>
              )}

              {currentStatus !== 'archived' && isEditMode && (
                <button
                  type="button"
                  onClick={() => setConfirmArchiveModal(true)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Validation Errors Banner */}
      {validationErrors.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Validation Errors ({validationErrors.length})</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-300 space-y-1 pl-2">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="space-y-6">
        {/* Article Titles (Multilingual) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Article Headline / Title</span>
          </h2>

          <LocalizedTextFields
            label="Multilingual Title"
            value={formData.title}
            onChange={handleTitleChange}
            requiredOm
            placeholderOm="Mata-duree oduu Afaan Oromootiin..."
            placeholderAm="የዜናው ርዕስ በአማርኛ..."
            placeholderEn="News headline in English..."
            helpText="Afaan Oromo headline is required before publishing."
          />

          {/* URL Slug Field */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              URL Slug <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.slug}
                disabled={isEditMode}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. climate-smart-farming-training"
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border ${
                  isEditMode
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500'
                }`}
              />
              {isEditMode && (
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Immutable
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {isEditMode
                ? 'The URL slug is immutable after creation to maintain external links.'
                : 'Lowercase ASCII letters, numbers, and hyphens only (e.g. my-article-title).'}
            </p>
          </div>
        </div>

        {/* Excerpt / Summary */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Summary & Excerpt</span>
          </h2>

          <LocalizedTextFields
            label="Multilingual Summary"
            value={formData.excerpt}
            onChange={(val) => {
              setFormData({ ...formData, excerpt: val });
              setValidationErrors([]);
            }}
            multiline
            rows={3}
            requiredOm
            placeholderOm="Gudunfaa oduu fi qabxilee ijoo Afaan Oromootiin..."
            placeholderAm="የዜናው አጭር መግለጫ..."
            placeholderEn="Brief summary for card preview..."
            helpText="Displayed on news directory cards and search engines."
          />
        </div>

        {/* Article Metadata */}
        <NewsMetadataFields
          input={formData}
          onChange={(updated) => {
            setFormData(updated);
            setValidationErrors([]);
          }}
          isEditMode={isEditMode}
          authenticatedUid={staffUser?.uid || ''}
          currentLanguage={language}
        />

        {/* Content Block Editor */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <NewsContentBlockEditor
            blocks={formData.content}
            onChange={(blocks) => {
              setFormData({ ...formData, content: blocks });
              setValidationErrors([]);
            }}
          />
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onConfirmLeave={() => {
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
