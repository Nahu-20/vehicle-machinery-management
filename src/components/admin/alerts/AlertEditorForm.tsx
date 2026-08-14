import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AgriculturalAlert,
  AlertCategory,
  AlertSeverity,
  AlertRecommendedAction,
  validateAlertSlug,
  validateAlertDraft,
  validateAlertForReview,
  validateAlertForPublishing,
  toMillis,
} from '../../../types/agriculturalAlert';
import {
  createAlertDraft,
  updateAlertDraft,
  submitAlertForReview,
  returnAlertToDraft,
  publishAlert,
  unpublishAlert,
  archiveAlert,
  moveAlertToTrash,
  getAlertBySlugForAdmin,
  checkAlertSlugExists,
  checkAlertSlugAvailability,
  AlertServiceError,
} from '../../../services/agriculturalAlertService';
import {
  generateAlertSlugCandidate,
  generateUniqueSlugSuffix,
  normalizeSlugString,
  appendSlugSuffix,
} from '../../../utils/alertSlugGenerator';
import { useAuth } from '../../../context/AuthContext';
import { useStaffAuthorization } from '../../../hooks/useStaffAuthorization';
import { useLanguage } from '../../../context/LanguageContext';
import { AlertSeverityBadge } from './AlertSeverityBadge';
import { AlertStatusBadge } from './AlertStatusBadge';
import { AlertVersionConflictModal } from './AlertVersionConflictModal';
import { AlertFeaturedImageUploader } from '../media/AlertFeaturedImageUploader';
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  Trash2,
  Archive,
  RotateCcw,
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  Globe,
  Bell,
  MapPin,
  Tag,
  Clock,
  Building2,
  Phone,
  Mail,
  Loader2,
  Info,
  Lock,
  Sparkles,
  ShieldCheck,
  FileEdit,
  X,
  ListChecks,
} from 'lucide-react';
import { LocalizedText } from '../../../types/news';
import { StagedMediaReference, ManagedFeaturedImage } from '../../../types/media';

interface AlertEditorFormProps {
  initialAlert?: AgriculturalAlert | null;
  isEditMode?: boolean;
}

const OROMIA_ZONES = [
  'Arsii',
  'Arsii Dhihaa',
  'Balee',
  'Balee Bahaa',
  'Boraana',
  'Bunnoo Beddellee',
  'Gujii',
  'Gujii Dhihaa',
  'Harargee Bahaa',
  'Harargee Dhihaa',
  'Horo Guduru Wallaggaa',
  'Illuu Abbaa Boor',
  'Jimma',
  'Shawaa Bahaa',
  'Shawaa Dhihaa',
  'Shawaa Kaabaa',
  'Shawaa Kibba Dhihaa',
  'Wallagga Bahaa',
  'Wallagga Dhihaa',
];

const COMMON_CROPS = ['Coffee', 'Maize', 'Wheat', 'Teff', 'Sorghum', 'Barley', 'Pulses', 'Oilseeds', 'Vegetables', 'Fruits'];
const COMMON_LIVESTOCK = ['Cattle / Loon', 'Shoats / Re\'ee & Hoolaa', 'Poultry / Lukkuu', 'Camel / Gaala', 'Equines / Harree & Fardeen'];

export const AlertEditorForm: React.FC<AlertEditorFormProps> = ({
  initialAlert = null,
  isEditMode = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { staffUser, hasPermission } = useStaffAuthorization();
  const { language } = useLanguage();

  const effectiveActor = staffUser || {
    uid: user?.uid || 'demo-superadmin-001',
    email: user?.email || 'admin@oromiaagri.gov.et',
    displayName: user?.displayName || 'Dr. Chala Gudina',
    role: 'superAdmin',
    active: true,
    preferredLanguage: 'om',
  };

  const [activeLangTab, setActiveLangTab] = useState<'om' | 'am' | 'en'>('om');

  // Form Field States
  const [slug, setSlug] = useState<string>(initialAlert?.slug || '');
  const [slugMode, setSlugMode] = useState<'auto' | 'manual'>(isEditMode ? 'manual' : 'auto');
  const [uniquenessState, setUniquenessState] = useState<'idle' | 'checking' | 'available' | 'duplicate' | 'error'>(
    isEditMode ? 'available' : 'idle'
  );
  const [uniquenessErrorMsg, setUniquenessErrorMsg] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [autoAdjustedNotice, setAutoAdjustedNotice] = useState<string | null>(null);

  const [title, setTitle] = useState<LocalizedText>(
    initialAlert?.title || { om: '', am: '', en: '' }
  );
  const [summary, setSummary] = useState<LocalizedText>(
    initialAlert?.summary || { om: '', am: '', en: '' }
  );
  const [body, setBody] = useState<LocalizedText>(
    initialAlert?.body || { om: '', am: '', en: '' }
  );

  const [category, setCategory] = useState<AlertCategory>(
    initialAlert?.category || 'weather'
  );
  const [severity, setSeverity] = useState<AlertSeverity>(
    initialAlert?.severity || 'advisory'
  );

  const [featured, setFeatured] = useState<boolean>(Boolean(initialAlert?.featured));
  const [pinned, setPinned] = useState<boolean>(Boolean(initialAlert?.pinned));

  // Geographic Target
  const [regionWide, setRegionWide] = useState<boolean>(
    initialAlert?.geographicTarget?.regionWide ?? true
  );
  const [selectedZones, setSelectedZones] = useState<string[]>(
    initialAlert?.geographicTarget?.zones || []
  );
  const [woredasInput, setWoredasInput] = useState<string>(
    (initialAlert?.geographicTarget?.woredas || []).join(', ')
  );

  // Subject Target
  const [selectedCrops, setSelectedCrops] = useState<string[]>(
    initialAlert?.subjectTarget?.crops || []
  );
  const [customCropInput, setCustomCropInput] = useState<string>('');

  const [selectedLivestock, setSelectedLivestock] = useState<string[]>(
    initialAlert?.subjectTarget?.livestock || []
  );
  const [customLivestockInput, setCustomLivestockInput] = useState<string>('');

  // Recommended Actions
  const [recommendedActions, setRecommendedActions] = useState<AlertRecommendedAction[]>(
    initialAlert?.recommendedActions || []
  );

  // Source Office & Contact
  const [sourceOffice, setSourceOffice] = useState<LocalizedText>(
    initialAlert?.sourceOffice || {
      om: 'Biiroo Qonnaa Oromiyaa',
      am: 'የኦሮሚያ ግብርና ቢሮ',
      en: 'Oromia Agriculture Bureau',
    }
  );
  const [contactPhone, setContactPhone] = useState<string>(initialAlert?.contactPhone || '');
  const [contactEmail, setContactEmail] = useState<string>(initialAlert?.contactEmail || '');

  // Dates
  const [effectiveFromDate, setEffectiveFromDate] = useState<string>(() => {
    if (initialAlert?.effectiveFrom) {
      const ms = toMillis(initialAlert.effectiveFrom);
      if (ms) return new Date(ms).toISOString().slice(0, 16);
    }
    return new Date().toISOString().slice(0, 16);
  });

  const [expiresAtDate, setExpiresAtDate] = useState<string>(() => {
    if (initialAlert?.expiresAt) {
      const ms = toMillis(initialAlert.expiresAt);
      if (ms) return new Date(ms).toISOString().slice(0, 16);
    }
    return '';
  });

  // Featured Media
  const [featuredImageSource, setFeaturedImageSource] = useState<'external' | 'managed' | 'none'>(
    initialAlert?.featuredImageSource || 'none'
  );
  const [featuredImage, setFeaturedImage] = useState<string>(initialAlert?.featuredImage || '');
  const [featuredImageStaging, setFeaturedImageStaging] = useState<StagedMediaReference | null>(
    initialAlert?.featuredImageStaging || null
  );
  const [featuredImageManaged, setFeaturedImageManaged] = useState<ManagedFeaturedImage | null>(
    initialAlert?.featuredImageManaged || null
  );
  const [imageAlt, setImageAlt] = useState<LocalizedText>(
    initialAlert?.imageAlt || { om: '', am: '', en: '' }
  );

  // Form status & feedback
  const [version, setVersion] = useState<number>(initialAlert?.version || 1);
  const [currentStatus, setCurrentStatus] = useState<string>(initialAlert?.status || 'draft');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [serverSuccessMessage, setServerSuccessMessage] = useState<string | null>(null);
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null);
  const [showVersionConflictModal, setShowVersionConflictModal] = useState<boolean>(false);

  // Async sequence and current slug refs to protect against out-of-order stale async results
  const slugCheckSequenceRef = useRef<number>(0);
  const currentNormalizedSlugRef = useRef<string>('');
  const sessionUniqueSuffixRef = useRef<string>(generateUniqueSlugSuffix());

  // Auto-generate candidate slug in Create Mode when title changes (if in 'auto' mode)
  useEffect(() => {
    if (!isEditMode && slugMode === 'auto') {
      const candidate = generateAlertSlugCandidate(title, sessionUniqueSuffixRef.current);
      setSlug(candidate);
      setAutoAdjustedNotice(null);
    }
  }, [title, isEditMode, slugMode]);

  // Debounced slug uniqueness checking with stale-response protection
  useEffect(() => {
    const targetSlug = slug.trim().toLowerCase();

    // In Edit Mode, if slug matches the original persisted slug, it is available (not conflicting with itself)
    if (isEditMode && initialAlert?.slug && targetSlug === initialAlert.slug.trim().toLowerCase()) {
      setUniquenessState('available');
      setSlugError(null);
      setUniquenessErrorMsg(null);
      return;
    }

    if (!targetSlug) {
      setUniquenessState('idle');
      setSlugError('Alert slug is required.');
      setUniquenessErrorMsg(null);
      return;
    }

    const valResult = validateAlertSlug(targetSlug);
    if (!valResult.valid) {
      setSlugError(valResult.errors[0]);
      setUniquenessState('idle');
      setUniquenessErrorMsg(null);
      return;
    }

    setSlugError(null);
    setUniquenessErrorMsg(null);
    setUniquenessState('checking');

    const sequence = ++slugCheckSequenceRef.current;
    currentNormalizedSlugRef.current = targetSlug;

    const timer = setTimeout(async () => {
      try {
        const exists = await checkAlertSlugExists(targetSlug, effectiveActor);

        // Ignore stale async response if another check was initiated or slug changed
        if (sequence !== slugCheckSequenceRef.current) return;
        if (currentNormalizedSlugRef.current !== targetSlug) return;

        if (exists) {
          if (slugMode === 'auto') {
            // Attempt auto-suffix proposals: heavy-rain-fall-on-tuesday-2, etc.
            let foundUnique = false;
            for (let suffix = 2; suffix <= 10; suffix++) {
              const suffixCandidate = appendSlugSuffix(targetSlug, suffix);
              const suffixExists = await checkAlertSlugExists(suffixCandidate, effectiveActor);

              if (sequence !== slugCheckSequenceRef.current) return;
              if (currentNormalizedSlugRef.current !== targetSlug) return;

              if (!suffixExists) {
                foundUnique = true;
                setSlug(suffixCandidate);
                setAutoAdjustedNotice(`Auto-adjusted to unique slug: /alerts/${suffixCandidate}`);
                setUniquenessState('available');
                setUniquenessErrorMsg(null);
                break;
              }
            }
            if (!foundUnique) {
              setUniquenessState('duplicate');
              setUniquenessErrorMsg('An alert with this slug already exists');
            }
          } else {
            // Manual mode: display duplicate error without modifying user's input
            setUniquenessState('duplicate');
            setUniquenessErrorMsg('An alert with this slug already exists');
          }
        } else {
          setUniquenessState('available');
          setUniquenessErrorMsg(null);
        }
      } catch (err: any) {
        if (sequence !== slugCheckSequenceRef.current) return;
        if (currentNormalizedSlugRef.current !== targetSlug) return;

        // Graceful resolution: database transaction enforces unique slug upon save
        setUniquenessState('available');
        setUniquenessErrorMsg(null);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [slug, slugMode, isEditMode, staffUser, initialAlert?.slug]);

  // Helper to construct current alert object state
  const buildAlertPayload = (): Partial<AgriculturalAlert> => {
    const woredas = woredasInput
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    return {
      slug: slug.trim().toLowerCase(),
      title,
      summary,
      body,
      category,
      severity,
      featured,
      pinned,
      geographicTarget: {
        regionWide,
        zones: regionWide ? [] : selectedZones,
        woredas: regionWide ? [] : woredas,
      },
      subjectTarget: {
        crops: selectedCrops,
        livestock: selectedLivestock,
      },
      recommendedActions,
      sourceOffice,
      contactPhone: contactPhone.trim() || null,
      contactEmail: contactEmail.trim() || null,
      effectiveFrom: effectiveFromDate ? new Date(effectiveFromDate).toISOString() : new Date().toISOString(),
      expiresAt: expiresAtDate ? new Date(expiresAtDate).toISOString() : null,
      featuredImageSource,
      featuredImage: featuredImage.trim() || null,
      featuredImageStaging,
      featuredImageManaged,
      imageAlt,
    };
  };

  // Safe error handler
  const handleServiceError = (err: any, fallbackMessage: string) => {
    console.error('[AlertEditorForm] Error:', err);
    if (err instanceof AlertServiceError) {
      if (err.code === 'VERSION_CONFLICT') {
        setShowVersionConflictModal(true);
      } else {
        setServerErrorMessage(err.message);
      }
    } else {
      setServerErrorMessage(err?.message || fallbackMessage);
    }
  };

  // Helper to validate slug readiness before persistence in Create Mode
  const checkCanSaveSlug = (): boolean => {
    if (isEditMode) return true;

    if (slug && slug.trim()) {
      const slugCheck = validateAlertSlug(slug.trim());
      if (!slugCheck.valid) {
        setServerErrorMessage(`Invalid alert slug: ${slugCheck.errors.join(' ')}`);
        return false;
      }
    }

    if (uniquenessState === 'duplicate' && slugMode === 'manual') {
      setServerErrorMessage(uniquenessErrorMsg || 'An alert with this slug already exists. Please adjust the slug or switch to Auto mode.');
      return false;
    }

    return true;
  };

  // Action 1: Save Draft
  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setValidationErrors([]);
    setServerErrorMessage(null);
    setServerSuccessMessage(null);

    if (!checkCanSaveSlug()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = buildAlertPayload();

      if (!isEditMode) {
        const created = await createAlertDraft(payload, effectiveActor);
        setServerSuccessMessage(`Alert draft "${created.slug}" created successfully!`);
        setIsDirty(false);
        navigate(`/admin/alerts/${created.slug}/edit`, { replace: true });
      } else {
        const updated = await updateAlertDraft(slug, payload, version, effectiveActor);
        setVersion(updated.version);
        setCurrentStatus(updated.status);
        setServerSuccessMessage(`Draft updated successfully (v${updated.version}).`);
        setIsDirty(false);
      }
    } catch (err) {
      handleServiceError(err, 'Failed to save alert draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 2: Save & Preview
  const handleSaveAndPreview = async () => {
    setIsSubmitting(true);
    setValidationErrors([]);
    setServerErrorMessage(null);

    if (!checkCanSaveSlug()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = buildAlertPayload();
      let targetSlug = slug.trim().toLowerCase();

      if (!isEditMode) {
        const created = await createAlertDraft(payload, effectiveActor);
        targetSlug = created.slug;
      } else {
        const updated = await updateAlertDraft(slug, payload, version, effectiveActor);
        setVersion(updated.version);
      }

      setIsDirty(false);
      navigate(`/admin/alerts/${targetSlug}/preview`);
    } catch (err) {
      handleServiceError(err, 'Failed to save and preview alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 3: Submit for Review
  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    setValidationErrors([]);
    setServerErrorMessage(null);

    if (!checkCanSaveSlug()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = buildAlertPayload();

      // First ensure draft is saved
      let targetSlug = slug.trim().toLowerCase();
      let currentVer = version;

      if (!isEditMode) {
        const created = await createAlertDraft(payload, effectiveActor);
        targetSlug = created.slug;
        currentVer = created.version;
      } else {
        const updated = await updateAlertDraft(slug, payload, version, effectiveActor);
        targetSlug = updated.slug;
        currentVer = updated.version;
      }

      // Perform review validation
      const valResult = validateAlertForReview(payload);
      if (!valResult.valid) {
        setValidationErrors(valResult.errors);
        setServerErrorMessage('Please fix validation errors before submitting for review.');
        setIsSubmitting(false);
        return;
      }

      const reviewAlert = await submitAlertForReview(targetSlug, currentVer, effectiveActor);
      setVersion(reviewAlert.version);
      setCurrentStatus(reviewAlert.status);
      setServerSuccessMessage('Alert submitted for review successfully!');
      setIsDirty(false);
    } catch (err) {
      handleServiceError(err, 'Failed to submit alert for review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 4: Publish Alert
  const handlePublishAlert = async () => {
    setIsSubmitting(true);
    setValidationErrors([]);
    setServerErrorMessage(null);

    if (!checkCanSaveSlug()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = buildAlertPayload();

      // First ensure latest edits are saved
      let targetSlug = slug.trim().toLowerCase();
      let currentVer = version;

      if (!isEditMode) {
        const created = await createAlertDraft(payload, effectiveActor);
        targetSlug = created.slug;
        currentVer = created.version;
      } else {
        const updated = await updateAlertDraft(slug, payload, version, effectiveActor);
        targetSlug = updated.slug;
        currentVer = updated.version;
      }

      // Perform strict publishing validation
      const valResult = validateAlertForPublishing(payload);
      if (!valResult.valid) {
        setValidationErrors(valResult.errors);
        setServerErrorMessage('Cannot publish: Alert does not meet public publication requirements.');
        setIsSubmitting(false);
        return;
      }

      const published = await publishAlert(targetSlug, currentVer, effectiveActor);
      setVersion(published.version);
      setCurrentStatus(published.status);
      setServerSuccessMessage(`Alert "${published.slug}" published successfully!`);
      setIsDirty(false);
    } catch (err) {
      handleServiceError(err, 'Failed to publish alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 5: Return to Draft / Unpublish
  const handleUnpublish = async () => {
    if (!slug) return;
    setIsSubmitting(true);
    setServerErrorMessage(null);

    try {
      const unpublished = await unpublishAlert(slug, version, effectiveActor);
      setVersion(unpublished.version);
      setCurrentStatus(unpublished.status);
      setServerSuccessMessage('Alert unpublished and reverted to draft state.');
      setIsDirty(false);
    } catch (err) {
      handleServiceError(err, 'Failed to unpublish alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 6: Archive
  const handleArchive = async () => {
    if (!slug) return;
    setIsSubmitting(true);
    setServerErrorMessage(null);

    try {
      const archived = await archiveAlert(slug, version, effectiveActor);
      setVersion(archived.version);
      setCurrentStatus(archived.status);
      setServerSuccessMessage('Alert archived successfully.');
      setIsDirty(false);
    } catch (err) {
      handleServiceError(err, 'Failed to archive alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 7: Move to Trash
  const handleTrash = async () => {
    if (!slug) return;
    if (!window.confirm('Are you sure you want to move this alert to trash?')) return;

    setIsSubmitting(true);
    setServerErrorMessage(null);

    try {
      await moveAlertToTrash(slug, version, effectiveActor, 'Moved to trash from editor');
      navigate('/admin/alerts');
    } catch (err) {
      handleServiceError(err, 'Failed to move alert to trash.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Recommended Actions Builder
  const handleAddAction = () => {
    const newId = `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setRecommendedActions((prev) => [
      ...prev,
      {
        id: newId,
        title: { om: '', am: '', en: '' },
        description: { om: '', am: '', en: '' },
      },
    ]);
    setIsDirty(true);
  };

  const handleUpdateAction = (id: string, field: 'title' | 'description', lang: 'om' | 'am' | 'en', val: string) => {
    setRecommendedActions((prev) =>
      prev.map((act) => {
        if (act.id !== id) return act;
        return {
          ...act,
          [field]: {
            ...act[field],
            [lang]: val,
          },
        };
      })
    );
    setIsDirty(true);
  };

  const handleRemoveAction = (id: string) => {
    setRecommendedActions((prev) => prev.filter((act) => act.id !== id));
    setIsDirty(true);
  };

  const handleMoveAction = (index: number, direction: 'up' | 'down') => {
    setRecommendedActions((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    setIsDirty(true);
  };

  const canPublish = hasPermission('alert.publish') || ['superAdmin', 'contentAdmin'].includes(effectiveActor.role);
  const canCreate = hasPermission('alert.create') || ['superAdmin', 'contentAdmin', 'editor', 'advisoryOfficer'].includes(effectiveActor.role);
  const canEdit = hasPermission('alert.edit') || ['superAdmin', 'contentAdmin', 'editor', 'advisoryOfficer'].includes(effectiveActor.role);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin/alerts"
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                {isEditMode ? 'Edit Agricultural Advisory Alert' : 'Create Agricultural Advisory Alert'}
              </h1>
              {isEditMode && <AlertStatusBadge status={currentStatus as any} size="sm" />}
            </div>
            <p className="text-xs text-slate-500 truncate">
              {isEditMode ? `Slug: /${slug} • Version ${version}` : 'Draft new emergency or routine alert'}
            </p>
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-slate-500" />}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveAndPreview}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
          >
            <Eye className="w-4 h-4 text-blue-500" />
            <span>Save & Preview</span>
          </button>

          {currentStatus === 'draft' && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitForReview}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Submit for Review</span>
            </button>
          )}

          {canPublish && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePublishAlert}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Alert</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation Errors Banner */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Validation Checks Failed:</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 text-rose-800 dark:text-rose-300">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Server Success Banner */}
      {serverSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{serverSuccessMessage}</span>
          </div>
          <button onClick={() => setServerSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Server Error Banner */}
      {serverErrorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{serverErrorMessage}</span>
          </div>
          <button onClick={() => setServerErrorMessage(null)} className="text-amber-700 hover:text-amber-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Title, Slug & Language Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Multilingual Alert Content
                </h2>
              </div>

              {/* Language Tab Selector */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveLangTab('om')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    activeLangTab === 'om'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>OM</span>
                  <span className="text-[10px] opacity-80">(Primary)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLangTab('am')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    activeLangTab === 'am'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>AM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLangTab('en')}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    activeLangTab === 'en'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>EN</span>
                </button>
              </div>
            </div>

            {/* Slug Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Alert Slug Identifier</span>
                  {!isEditMode && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        slugMode === 'auto'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}
                    >
                      {slugMode === 'auto' ? 'Auto-Generated' : 'Custom Manual'}
                    </span>
                  )}
                </label>

                {!isEditMode && (
                  <div className="flex items-center gap-2">
                    {slugMode === 'manual' ? (
                      <button
                        type="button"
                        onClick={() => {
                          sessionUniqueSuffixRef.current = generateUniqueSlugSuffix();
                          setSlugMode('auto');
                          const candidate = generateAlertSlugCandidate(title, sessionUniqueSuffixRef.current);
                          setSlug(candidate);
                          setAutoAdjustedNotice(null);
                          setIsDirty(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to generated slug</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Edit text directly to override
                      </span>
                    )}
                  </div>
                )}

                {isEditMode && (
                  <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-500" /> Locked after creation
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={slug}
                  disabled={isEditMode}
                  onChange={(e) => {
                    const rawVal = e.target.value.toLowerCase().trim();
                    const normalized = normalizeSlugString(rawVal) || rawVal.replace(/[^a-z0-9-]/g, '');
                    setSlugMode('manual');
                    setSlug(normalized);
                    setAutoAdjustedNotice(null);
                    setIsDirty(true);
                  }}
                  placeholder="e.g. werarsa-hawwaana-harargee-2026"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono transition-all border ${
                    isEditMode
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                      : slugError || uniquenessState === 'duplicate'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                      : uniquenessState === 'available'
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                  }`}
                />
                {!isEditMode && uniquenessState === 'checking' && (
                  <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              {/* Preview Route & Status Feedback */}
              <div className="space-y-1 text-[11px] pt-0.5">
                <p className="font-mono text-slate-500 dark:text-slate-400">
                  Preview Route: <code className="text-amber-600 dark:text-amber-400 font-bold">/alerts/{slug || '...'}</code>
                </p>

                {!isEditMode && (
                  <>
                    {slugError && (
                      <p className="text-rose-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{slugError}</span>
                      </p>
                    )}

                    {uniquenessState === 'checking' && (
                      <p className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span>Checking availability...</span>
                      </p>
                    )}

                    {uniquenessState === 'available' && !slugError && (
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Slug available</span>
                      </p>
                    )}

                    {uniquenessState === 'duplicate' && (
                      <p className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{uniquenessErrorMsg || 'An alert with this slug already exists'}</span>
                      </p>
                    )}

                    {uniquenessState === 'error' && (
                      <p className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{uniquenessErrorMsg || 'Could not verify slug availability'}</span>
                      </p>
                    )}

                    {autoAdjustedNotice && (
                      <p className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{autoAdjustedNotice}</span>
                      </p>
                    )}

                    <p className="text-slate-400 dark:text-slate-500 font-sans">
                      {slugMode === 'auto'
                        ? 'Generated automatically from the alert title.'
                        : 'Manually customized slug. Title edits will not overwrite this value.'}
                    </p>
                  </>
                )}

                {isEditMode && (
                  <p className="text-slate-400 dark:text-slate-500 font-sans">
                    Slug is locked after creation.
                  </p>
                )}
              </div>
            </div>

            {/* Title Input for Active Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Alert Title ({activeLangTab.toUpperCase()})</span>
                {activeLangTab === 'om' && <span className="text-amber-600 font-bold">* Required</span>}
              </label>
              <input
                type="text"
                value={title[activeLangTab] || ''}
                onChange={(e) => {
                  setTitle({ ...title, [activeLangTab]: e.target.value });
                  setIsDirty(true);
                }}
                placeholder={
                  activeLangTab === 'om'
                    ? 'Akeekkachiisa Werarsa Hawwaana Harargee'
                    : activeLangTab === 'am'
                    ? 'የሃርጌ የአንበጣ መንጋ ማስጠንቀቂያ'
                    : 'Hararghe Desert Locust Infestation Alert'
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Summary Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Summary / Teaser ({activeLangTab.toUpperCase()})</span>
                {activeLangTab === 'om' && <span className="text-amber-600 font-bold">* Required</span>}
              </label>
              <textarea
                rows={2}
                value={summary[activeLangTab] || ''}
                onChange={(e) => {
                  setSummary({ ...summary, [activeLangTab]: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="Brief high-priority sentence for SMS notifications & quick dashboard feeds..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Body Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Detailed Advisory Body ({activeLangTab.toUpperCase()})</span>
                {activeLangTab === 'om' && <span className="text-amber-600 font-bold">* Required</span>}
              </label>
              <textarea
                rows={6}
                value={body[activeLangTab] || ''}
                onChange={(e) => {
                  setBody({ ...body, [activeLangTab]: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="Complete technical breakdown, outbreak locations, symptoms, and containment guidance..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all leading-relaxed"
              />
            </div>

            {/* Source Office Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Issuing Authority / Source Office ({activeLangTab.toUpperCase()})</span>
              </label>
              <input
                type="text"
                value={sourceOffice[activeLangTab] || ''}
                onChange={(e) => {
                  setSourceOffice({ ...sourceOffice, [activeLangTab]: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="Biiroo Qonnaa Oromiyaa"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Section 2: Recommended Actions Builder */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Recommended Field Actions
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Action</span>
              </button>
            </div>

            {recommendedActions.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Info className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No recommended field actions added yet.
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  High severity alerts (Warning / Critical) require at least one action step for farmers and extension workers.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedActions.map((action, idx) => (
                  <div
                    key={action.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Action Step #{idx + 1}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveAction(idx, 'up')}
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === recommendedActions.length - 1}
                          onClick={() => handleMoveAction(idx, 'down')}
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(action.id)}
                          className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 dark:hover:bg-rose-950/50"
                          title="Remove action"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Title ({activeLangTab.toUpperCase()}) *
                        </label>
                        <input
                          type="text"
                          value={action.title[activeLangTab] || ''}
                          onChange={(e) => handleUpdateAction(action.id, 'title', activeLangTab, e.target.value)}
                          placeholder="e.g. Apply Bio-pesticides Immediate Spraying"
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Instruction Detail ({activeLangTab.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          value={action.description[activeLangTab] || ''}
                          onChange={(e) => handleUpdateAction(action.id, 'description', activeLangTab, e.target.value)}
                          placeholder="Specific dosage, timing, or safety instructions..."
                          className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Featured Image / Media */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <AlertFeaturedImageUploader
              authenticatedUid={staffUser?.uid || 'system_admin'}
              currentLanguage={language as any}
              existingExternalImageUrl={featuredImageSource === 'external' ? featuredImage : ''}
              stagedImage={featuredImageStaging}
              disabled={isSubmitting}
              onStagedImageChange={(staged) => {
                setFeaturedImageStaging(staged);
                if (staged) setFeaturedImageSource('managed');
                setIsDirty(true);
              }}
              onExternalImageChange={(url) => {
                setFeaturedImage(url);
                if (url) setFeaturedImageSource('external');
                setIsDirty(true);
              }}
              onManagedReady={(mId, managed) => {
                setFeaturedImageManaged(managed);
                setFeaturedImageSource('managed');
                setIsDirty(true);
              }}
            />
          </div>
        </div>

        {/* Sidebar Controls Column */}
        <div className="space-y-6">
          {/* Severity & Category Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              Alert Classification
            </h2>

            {/* Severity Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Severity Level *
              </label>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value as AlertSeverity);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="info">Info (Odeeffannoo)</option>
                <option value="advisory">Advisory (Gorsa)</option>
                <option value="warning">Warning (Akeekkachiisa)</option>
                <option value="critical">Critical (Balaa Guddaa)</option>
              </select>
              <div className="pt-1">
                <AlertSeverityBadge severity={severity} size="sm" />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Canonical Category *
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as AlertCategory);
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="weather">Weather Hazard (Qilleensa)</option>
                <option value="pest">Pest Outbreak (Hawwaana)</option>
                <option value="crop-disease">Crop Disease (Dhukkuba Biqiltuu)</option>
                <option value="livestock-disease">Livestock Health (Fayyaa Beeyladaa)</option>
                <option value="input-supply">Input Supply (Dhiheessii Qonnaa)</option>
                <option value="irrigation">Irrigation & Water (Jallisii & Bishaan)</option>
                <option value="market">Market Disruption (Gabaa)</option>
                <option value="food-safety">Food Safety (Nageenya Nyata)</option>
                <option value="emergency">Agricultural Emergency (Balaa Qonnaa)</option>
                <option value="general">General Advisory (Gorsa Waliigalaa)</option>
              </select>
            </div>

            {/* Flags */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => {
                    setFeatured(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded-md text-amber-600 focus:ring-amber-500"
                />
                <span>Highlight as Featured Advisory</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => {
                    setPinned(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded-md text-amber-600 focus:ring-amber-500"
                />
                <span>Pin to Top of Public Alert Feeds</span>
              </label>
            </div>
          </div>

          {/* Timing & Effective Dates */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Effective Period</span>
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Effective From *
              </label>
              <input
                type="datetime-local"
                value={effectiveFromDate}
                onChange={(e) => {
                  setEffectiveFromDate(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Expires At (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAtDate}
                onChange={(e) => {
                  setExpiresAtDate(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Geographic Targeting Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Geographic Targeting</span>
            </h2>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={regionWide}
                onChange={(e) => {
                  setRegionWide(e.target.checked);
                  setIsDirty(true);
                }}
                className="rounded-md text-amber-600 focus:ring-amber-500"
              />
              <span>Region-Wide (All Oromia)</span>
            </label>

            {!regionWide && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Target Oromia Zones
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1 text-xs">
                    {OROMIA_ZONES.map((zone) => (
                      <label key={zone} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedZones.includes(zone)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedZones([...selectedZones, zone]);
                            } else {
                              setSelectedZones(selectedZones.filter((z) => z !== zone));
                            }
                            setIsDirty(true);
                          }}
                        />
                        <span>{zone}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Target Woredas (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={woredasInput}
                    onChange={(e) => {
                      setWoredasInput(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="e.g. Boset, Lume, Adama, Bule Hora"
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Subject Targeting Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Subject & Commodity Targeting</span>
            </h2>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Target Crops
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CROPS.map((crop) => {
                  const isSel = selectedCrops.includes(crop);
                  return (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          setSelectedCrops(selectedCrops.filter((c) => c !== crop));
                        } else {
                          setSelectedCrops([...selectedCrops, crop]);
                        }
                        setIsDirty(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        isSel
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {crop}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Target Livestock
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_LIVESTOCK.map((item) => {
                  const isSel = selectedLivestock.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          setSelectedLivestock(selectedLivestock.filter((l) => l !== item));
                        } else {
                          setSelectedLivestock([...selectedLivestock, item]);
                        }
                        setIsDirty(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        isSel
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              Hotline & Contact Info
            </h2>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-amber-500" /> Phone Hotline
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="+251115517000"
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3 text-amber-500" /> Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="alerts@oromiaagri.gov.et"
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Destructive Actions Card (Edit Mode Only) */}
          {isEditMode && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
              <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 text-rose-600">
                Lifecycle Actions
              </h2>

              <div className="space-y-2 pt-1">
                {currentStatus === 'published' && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleUnpublish}
                    className="w-full py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Unpublish / Revert to Draft</span>
                  </button>
                )}

                {currentStatus !== 'archived' && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleArchive}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive Alert</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleTrash}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move Alert to Trash</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Version Conflict Modal */}
      {showVersionConflictModal && (
        <AlertVersionConflictModal
          expectedVersion={version}
          actualVersion={version + 1}
          onClose={() => setShowVersionConflictModal(false)}
          onReload={() => {
            setShowVersionConflictModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
