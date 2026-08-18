import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Save,
  Send,
  ShieldCheck,
  ShieldAlert,
  Globe2,
  EyeOff,
  Archive,
  RotateCcw,
  Trash2,
  Plus,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  MapPin,
  Layers,
  Sparkles,
  Info,
  ChevronLeft,
  ExternalLink,
  History,
  Lock,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  InvestmentFacility,
  InvestmentSource,
  InvestmentAuditLog,
  InfrastructureCategory,
  FacilityOperationalStatus,
  FacilityOwnership,
  LocationPrecision,
  CapacityMetric,
  MultilingualString,
  CanonicalZoneId,
} from '../../../types/investment';
import {
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
} from '../../../features/investment-map/constants/canonicalZones';
import { FacilityLocationPicker } from './FacilityLocationPicker';
import {
  saveFacility,
  submitFacilityForReview,
  returnFacilityToDraft,
  verifyFacility,
  rejectFacility,
  publishFacility,
  unpublishFacility,
  archiveFacility,
  restoreFacility,
  deleteFacility,
  getFacility,
} from '../../../services/investment/investmentInfrastructureService';
import { getAllSources } from '../../../services/investment/investmentSourceService';
import { getAuditLogsForEntity } from '../../../services/investment/investmentAuditService';
import {
  INFRASTRUCTURE_CATEGORIES,
  CATEGORY_MAP,
  FacilityCategoryBadge,
} from './FacilityCategoryBadge';
import {
  LifecycleStatusBadge,
  VerificationStatusBadge,
  OperationalStatusBadge,
  PublicVisibilityBadge,
} from './FacilityStatusBadge';
import { FacilityReadinessPanel } from './FacilityReadinessPanel';
import { FacilitySourceSelectorModal } from './FacilitySourceSelectorModal';
import { FacilityVersionConflictModal } from './FacilityVersionConflictModal';
import {
  FacilityConfirmActionModal,
  FacilityActionType,
} from './FacilityConfirmActionModal';
import { FacilityAuditHistoryDrawer } from './FacilityAuditHistoryDrawer';
import { SourceDetailModal } from './SourceDetailModal';

const CANONICAL_COMMODITIES = [
  { id: 'coffee', label: 'Coffee' },
  { id: 'wheat', label: 'Wheat' },
  { id: 'maize', label: 'Maize' },
  { id: 'teff', label: 'Teff' },
  { id: 'barley', label: 'Barley' },
  { id: 'oilseeds', label: 'Oilseeds & Sesame' },
  { id: 'pulses', label: 'Pulses & Faba Bean' },
  { id: 'livestock', label: 'Livestock & Beef' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'poultry', label: 'Poultry' },
  { id: 'horticulture', label: 'Horticulture & Fruits' },
  { id: 'spices', label: 'Spices & Red Pepper' },
  { id: 'tea', label: 'Tea' },
  { id: 'honey', label: 'Honey & Apiculture' },
  { id: 'sugarcane', label: 'Sugarcane' },
  { id: 'cotton', label: 'Cotton' },
];

const CANONICAL_UNITS = [
  'MT',
  'tonnes',
  'tonnes_per_day',
  'quintals',
  'm3',
  'hectares',
  'MW',
  'kW',
  'liters_per_day',
  'heads',
  'birds',
  'count',
  'percent',
];

interface InfrastructureFacilityEditorProps {
  key?: React.Key;
  initialFacility?: InvestmentFacility | null;
  isNew?: boolean;
  onSaved?: (facility: InvestmentFacility) => void;
}

export function InfrastructureFacilityEditor({
  initialFacility,
  isNew = false,
  onSaved,
}: InfrastructureFacilityEditorProps) {
  const navigate = useNavigate();
  const { staffUser } = useStaffAuthorizationContext();

  // Permissions
  const canEdit =
    hasPermission(staffUser, 'investment.edit') ||
    hasPermission(staffUser, 'investment.datasets.manage');
  const canVerify = hasPermission(staffUser, 'investment.verify');
  const canPublish = hasPermission(staffUser, 'investment.publish');
  const isSuperAdmin = staffUser?.role === 'superAdmin';

  // Master Data & Sources
  const [allSources, setAllSources] = useState<InvestmentSource[]>([]);
  const [auditLogs, setAuditLogs] = useState<InvestmentAuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Form State
  const [facilityId, setFacilityId] = useState(
    initialFacility?.facilityId || (initialFacility as any)?.recordId || `fac_${Date.now()}`
  );
  const [zoneId, setZoneId] = useState<CanonicalZoneId>(
    (initialFacility?.zoneId as CanonicalZoneId) || 'jimma'
  );
  const [category, setCategory] = useState<InfrastructureCategory>(
    (initialFacility?.category as InfrastructureCategory) || 'processing'
  );

  // Multilingual Title
  const [titleEn, setTitleEn] = useState(initialFacility?.title?.en || '');
  const [titleOm, setTitleOm] = useState(initialFacility?.title?.om || '');
  const [titleAm, setTitleAm] = useState(initialFacility?.title?.am || '');

  // Multilingual Description
  const [descEn, setDescEn] = useState(initialFacility?.description?.en || '');
  const [descOm, setDescOm] = useState(initialFacility?.description?.om || '');
  const [descAm, setDescAm] = useState(initialFacility?.description?.am || '');

  // Multilingual Location Description
  const [locDescEn, setLocDescEn] = useState(initialFacility?.locationDescription?.en || '');
  const [locDescOm, setLocDescOm] = useState(initialFacility?.locationDescription?.om || '');
  const [locDescAm, setLocDescAm] = useState(initialFacility?.locationDescription?.am || '');

  // Spatial & Coordinates
  const [locationPrecision, setLocationPrecision] = useState<LocationPrecision>(
    initialFacility?.locationPrecision || 'exact'
  );
  const [latInput, setLatInput] = useState<string>(
    typeof initialFacility?.coordinates?.lat === 'number'
      ? String(initialFacility.coordinates.lat)
      : '7.67'
  );
  const [lngInput, setLngInput] = useState<string>(
    typeof initialFacility?.coordinates?.lng === 'number'
      ? String(initialFacility.coordinates.lng)
      : '36.83'
  );
  const [savedLat, setSavedLat] = useState<number | null>(
    typeof initialFacility?.coordinates?.lat === 'number'
      ? initialFacility.coordinates.lat
      : null
  );
  const [savedLng, setSavedLng] = useState<number | null>(
    typeof initialFacility?.coordinates?.lng === 'number'
      ? initialFacility.coordinates.lng
      : null
  );

  // Operations & Ownership
  const [operationalStatus, setOperationalStatus] = useState<FacilityOperationalStatus>(
    initialFacility?.operationalStatus || 'operational'
  );
  const [ownership, setOwnership] = useState<FacilityOwnership>(
    initialFacility?.ownership || 'government'
  );
  const [operatorName, setOperatorName] = useState(initialFacility?.operatorName || '');
  const [commissioningYear, setCommissioningYear] = useState<string>(
    initialFacility?.commissioningYear ? String(initialFacility.commissioningYear) : ''
  );
  const [assessmentDate, setAssessmentDate] = useState(
    initialFacility?.assessmentDate || ''
  );
  const [referencePeriod, setReferencePeriod] = useState(
    initialFacility?.referencePeriod || ''
  );

  // Capacities
  const [capacities, setCapacities] = useState<CapacityMetric[]>(() => {
    if (initialFacility?.capacities && initialFacility.capacities.length > 0) {
      return initialFacility.capacities;
    }
    const legacyCap = (initialFacility as any)?.capacity;
    if (legacyCap) {
      return [
        {
          metricKey: 'processing_capacity',
          numericValue: legacyCap.value ?? legacyCap.numericValue ?? 0,
          unit: legacyCap.unit || 'MT',
          referencePeriod: initialFacility?.referencePeriod || null,
        },
      ];
    }
    return [];
  });

  // Commodities
  const [commodities, setCommodities] = useState<string[]>(
    initialFacility?.commodityKeys || (initialFacility as any)?.commodities || []
  );

  // Sources
  const [sourceIds, setSourceIds] = useState<string[]>(
    initialFacility?.sourceIds || []
  );

  // Internal Notes
  const [internalNotes, setInternalNotes] = useState(
    initialFacility?.internalNotes || ''
  );

  // Record Metadata
  const [lifecycleStatus, setLifecycleStatus] = useState(
    initialFacility?.lifecycleStatus || 'draft'
  );
  const [verificationStatus, setVerificationStatus] = useState(
    initialFacility?.verificationStatus || 'pending'
  );
  const [rejectionReason, setRejectionReason] = useState(
    initialFacility?.rejectionReason || ''
  );
  const [version, setVersion] = useState(initialFacility?.version || 1);

  // Dirty State Tracking
  const [isDirty, setIsDirty] = useState(false);

  // UI Modals & Feedback
  const [isMutating, setIsMutating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showVersionConflict, setShowVersionConflict] = useState(false);
  const [showConfirmAction, setShowConfirmAction] = useState<FacilityActionType | null>(null);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [inspectSource, setInspectSource] = useState<InvestmentSource | null>(null);

  // Load available sources on mount
  useEffect(() => {
    let mounted = true;
    getAllSources()
      .then((sources) => {
        if (mounted) setAllSources(sources);
      })
      .catch((err) => console.warn('Failed to load sources:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // Load audit logs if not new
  useEffect(() => {
    if (!isNew && facilityId) {
      setIsLoadingAudit(true);
      getAuditLogsForEntity('facility', facilityId)
        .then((logs) => setAuditLogs(logs))
        .catch((err) => console.warn('Failed to load audit logs:', err))
        .finally(() => setIsLoadingAudit(false));
    }
  }, [facilityId, isNew]);

  // Read-only Lock Calculation:
  // Direct content mutations are disabled when in 'review', 'published', or 'archived'
  const isReadOnly =
    lifecycleStatus === 'review' ||
    lifecycleStatus === 'published' ||
    lifecycleStatus === 'archived';

  // Mark dirty on any user input
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Capacity handlers
  const handleAddCapacity = () => {
    setCapacities([
      ...capacities,
      {
        metricKey: `metric_${capacities.length + 1}`,
        numericValue: 0,
        unit: 'MT',
        referencePeriod: referencePeriod || '',
      },
    ]);
    markDirty();
  };

  const handleUpdateCapacity = (
    index: number,
    field: keyof CapacityMetric,
    value: any
  ) => {
    const next = [...capacities];
    next[index] = { ...next[index], [field]: value };
    setCapacities(next);
    markDirty();
  };

  const handleRemoveCapacity = (index: number) => {
    setCapacities(capacities.filter((_, i) => i !== index));
    markDirty();
  };

  // Commodity Toggle
  const handleToggleCommodity = (commId: string) => {
    if (commodities.includes(commId)) {
      setCommodities(commodities.filter((c) => c !== commId));
    } else {
      setCommodities([...commodities, commId]);
    }
    markDirty();
  };

  // Source Toggle
  const handleToggleSource = (srcId: string) => {
    if (sourceIds.includes(srcId)) {
      setSourceIds(sourceIds.filter((id) => id !== srcId));
    } else {
      setSourceIds([...sourceIds, srcId]);
    }
    markDirty();
  };

  // Build Payload from form state
  const buildPayload = (): Partial<InvestmentFacility> & {
    facilityId: string;
    zoneId: string;
  } => {
    const latNum = parseFloat(latInput);
    const lngNum = parseFloat(lngInput);

    const title: MultilingualString = {
      en: titleEn.trim() || 'Untitled Facility',
      om: titleOm.trim() || undefined,
      am: titleAm.trim() || undefined,
    };

    const description: MultilingualString = {
      en: descEn.trim(),
      om: descOm.trim() || undefined,
      am: descAm.trim() || undefined,
    };

    const locationDescription: MultilingualString = {
      en: locDescEn.trim(),
      om: locDescOm.trim() || undefined,
      am: locDescAm.trim() || undefined,
    };

    return {
      facilityId,
      zoneId,
      category,
      title,
      description,
      locationDescription,
      locationPrecision,
      coordinates: {
        lat: Number.isFinite(latNum) ? latNum : 0,
        lng: Number.isFinite(lngNum) ? lngNum : 0,
      },
      operationalStatus,
      ownership,
      operatorName: operatorName.trim() || undefined,
      commissioningYear: commissioningYear ? parseInt(commissioningYear, 10) : undefined,
      assessmentDate: assessmentDate || undefined,
      referencePeriod: referencePeriod.trim() || undefined,
      capacities,
      commodityKeys: commodities as any,
      sourceIds,
      internalNotes: internalNotes.trim() || undefined,
    };
  };

  // Current attached source objects
  const attachedSources = allSources.filter((s) => sourceIds.includes(s.sourceId));

  // Facility object representation for validation panel
  const previewFacilityObj: Partial<InvestmentFacility> = {
    title: { en: titleEn, om: titleOm, am: titleAm },
    zoneId,
    category,
    locationPrecision,
    coordinates: {
      lat: parseFloat(latInput),
      lng: parseFloat(lngInput),
    },
    operationalStatus,
    lifecycleStatus,
    verificationStatus,
    sourceIds,
  };

  // Save Draft / Update Facility
  const handleSave = async () => {
    if (!staffUser) return;
    setFormError(null);
    setSuccessMessage(null);
    setIsMutating(true);

    try {
      const payload = buildPayload();
      const saved = await saveFacility(staffUser, payload, isNew ? undefined : version);

      setVersion(saved.version);
      setLifecycleStatus(saved.lifecycleStatus);
      setVerificationStatus(saved.verificationStatus);
      setSavedLat(saved.coordinates?.lat ?? null);
      setSavedLng(saved.coordinates?.lng ?? null);
      setIsDirty(false);
      setSuccessMessage('Facility saved successfully as draft.');

      if (onSaved) onSaved(saved);
      if (isNew) {
        navigate(`/admin/investment/infrastructure/${saved.facilityId}`);
      }
    } catch (err: any) {
      if (err?.code === 'VERSION_CONFLICT' || err?.statusCode === 409) {
        setShowVersionConflict(true);
      } else {
        setFormError(err?.message || 'Failed to save facility.');
      }
    } finally {
      setIsMutating(false);
    }
  };

  // Handle Lifecycle Action Confirmations
  const handleActionConfirm = async (payload?: { reason?: string }) => {
    if (!staffUser) return;
    const action = showConfirmAction;
    setShowConfirmAction(null);
    setFormError(null);
    setSuccessMessage(null);
    setIsMutating(true);

    try {
      let updated: InvestmentFacility | null = null;

      switch (action) {
        case 'submit_review':
          updated = await submitFacilityForReview(staffUser, facilityId, version);
          setSuccessMessage('Facility submitted for editorial review.');
          break;
        case 'verify':
          updated = await verifyFacility(staffUser, facilityId, version);
          setSuccessMessage('Facility verified successfully.');
          break;
        case 'reject':
          updated = await rejectFacility(
            staffUser,
            facilityId,
            payload?.reason || 'Corrections requested',
            version
          );
          setSuccessMessage('Facility draft returned to review with rejection notes.');
          break;
        case 'publish':
          updated = await publishFacility(staffUser, facilityId, version);
          setSuccessMessage('Facility published live to the Investment CMS.');
          break;
        case 'unpublish':
          updated = await unpublishFacility(staffUser, facilityId, version);
          setSuccessMessage('Facility unpublished. Content is now editable.');
          break;
        case 'archive':
          updated = await archiveFacility(staffUser, facilityId, version);
          setSuccessMessage('Facility archived.');
          break;
        case 'restore':
          updated = await restoreFacility(staffUser, facilityId, version);
          setSuccessMessage('Facility restored to draft.');
          break;
        case 'delete':
          await deleteFacility(staffUser, facilityId);
          navigate('/admin/investment/infrastructure');
          return;
      }

      if (updated) {
        setVersion(updated.version);
        setLifecycleStatus(updated.lifecycleStatus);
        setVerificationStatus(updated.verificationStatus);
        setRejectionReason(updated.rejectionReason || '');
        setIsDirty(false);
        if (onSaved) onSaved(updated);

        // Refresh audit logs
        getAuditLogsForEntity('facility', facilityId).then(setAuditLogs);
      }
    } catch (err: any) {
      if (err?.code === 'VERSION_CONFLICT' || err?.statusCode === 409) {
        setShowVersionConflict(true);
      } else {
        setFormError(err?.message || `Failed to execute action "${action}".`);
      }
    } finally {
      setIsMutating(false);
    }
  };

  // Reload Latest Handler for OCC
  const handleReloadLatest = async () => {
    setShowVersionConflict(false);
    setIsMutating(true);
    try {
      const fresh = await getFacility(facilityId);
      if (fresh) {
        setZoneId((fresh.zoneId as CanonicalZoneId) || 'jimma');
        setCategory((fresh.category as InfrastructureCategory) || 'processing');
        setTitleEn(fresh.title?.en || '');
        setTitleOm(fresh.title?.om || '');
        setTitleAm(fresh.title?.am || '');
        setDescEn(fresh.description?.en || '');
        setDescOm(fresh.description?.om || '');
        setDescAm(fresh.description?.am || '');
        setLocDescEn(fresh.locationDescription?.en || '');
        setLocDescOm(fresh.locationDescription?.om || '');
        setLocDescAm(fresh.locationDescription?.am || '');
        setLocationPrecision(fresh.locationPrecision || 'exact');
        setLatInput(
          typeof fresh.coordinates?.lat === 'number'
            ? String(fresh.coordinates.lat)
            : ''
        );
        setLngInput(
          typeof fresh.coordinates?.lng === 'number'
            ? String(fresh.coordinates.lng)
            : ''
        );
        setOperationalStatus(fresh.operationalStatus || 'operational');
        setOwnership(fresh.ownership || 'government');
        setOperatorName(fresh.operatorName || '');
        setCommissioningYear(
          fresh.commissioningYear ? String(fresh.commissioningYear) : ''
        );
        setAssessmentDate(fresh.assessmentDate || '');
        setReferencePeriod(fresh.referencePeriod || '');
        setCapacities(fresh.capacities || []);
        setCommodities(fresh.commodityKeys || (fresh as any).commodities || []);
        setSourceIds(fresh.sourceIds || []);
        setInternalNotes(fresh.internalNotes || '');
        setLifecycleStatus(fresh.lifecycleStatus);
        setVerificationStatus(fresh.verificationStatus);
        setRejectionReason(fresh.rejectionReason || '');
        setVersion(fresh.version);
        setIsDirty(false);
        setSuccessMessage('Reloaded latest facility version from database.');
      }
    } catch (err: any) {
      setFormError('Failed to reload fresh record.');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/investment/infrastructure"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-xs"
            title="Back to Infrastructure Directory"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                {isNew ? 'New Facility' : `ID: ${facilityId}`}
              </span>
              {!isNew && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Version {version}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              {titleEn || (isNew ? 'Create Infrastructure Facility' : 'Untitled Facility')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isNew && (
            <button
              type="button"
              onClick={() => setShowAuditDrawer(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <History className="w-3.5 h-3.5 text-emerald-600" />
              Audit Log ({auditLogs.length})
            </button>
          )}

          {/* Quick status indicators */}
          <LifecycleStatusBadge status={lifecycleStatus} size="md" />
          <VerificationStatusBadge status={verificationStatus} size="md" />
          <PublicVisibilityBadge
            lifecycleStatus={lifecycleStatus}
            verificationStatus={verificationStatus}
            size="md"
          />
        </div>
      </div>

      {/* Rejection Banner */}
      {verificationStatus === 'rejected' && (
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 space-y-2">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Facility Verification Rejected</span>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            <strong className="font-semibold">Reason:</strong>{' '}
            {rejectionReason || 'Corrections requested before publication.'}
          </p>
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmAction('restore')}
              className="px-3 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Return to Draft for Editing
            </button>
          </div>
        </div>
      )}

      {/* Read-Only Warning Banner */}
      {isReadOnly && (
        <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-purple-900 dark:text-purple-200">
            <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              This facility is currently <strong className="capitalize">{lifecycleStatus}</strong>. Direct form edits are locked. Use the lifecycle action bar to modify its review or publication status.
            </span>
          </div>
          {lifecycleStatus === 'published' && canPublish && (
            <button
              type="button"
              onClick={() => setShowConfirmAction('unpublish')}
              className="px-3 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shrink-0 shadow-xs"
            >
              Unpublish to Edit
            </button>
          )}
        </div>
      )}

      {/* Alert Messages */}
      {formError && (
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Review Readiness Checklist */}
      <FacilityReadinessPanel
        facility={previewFacilityObj}
        attachedSources={attachedSources}
      />

      {/* Main Grid: Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Identity, Location, Capacities, Operations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Facility Identity */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  1. Facility Identity & Classification
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Step 1 of 5</span>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="facility-category"
                className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
              >
                Infrastructure Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="facility-category"
                disabled={isReadOnly || isMutating}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as InfrastructureCategory);
                  markDirty();
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
              >
                {INFRASTRUCTURE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label.en} ({cat.label.om})
                  </option>
                ))}
              </select>
            </div>

            {/* Multilingual Titles */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label
                  htmlFor="title-en"
                  className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between"
                >
                  <span>Title (English) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-mono text-slate-400">Primary Display</span>
                </label>
                <input
                  id="title-en"
                  type="text"
                  disabled={isReadOnly || isMutating}
                  required
                  placeholder="e.g. Jimma Specialty Coffee Washing Station"
                  value={titleEn}
                  onChange={(e) => {
                    setTitleEn(e.target.value);
                    markDirty();
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="title-om"
                    className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
                  >
                    Title (Afaan Oromoo)
                  </label>
                  <input
                    id="title-om"
                    type="text"
                    disabled={isReadOnly || isMutating}
                    placeholder="e.g. Wiirtuu Dhiqinsaa Bunaa Jimmaa"
                    value={titleOm}
                    onChange={(e) => {
                      setTitleOm(e.target.value);
                      markDirty();
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="title-am"
                    className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
                  >
                    Title (Amharic)
                  </label>
                  <input
                    id="title-am"
                    type="text"
                    disabled={isReadOnly || isMutating}
                    placeholder="e.g. የጅማ ልዩ ቡና ማጠቢያ ጣቢያ"
                    value={titleAm}
                    onChange={(e) => {
                      setTitleAm(e.target.value);
                      markDirty();
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Multilingual Description */}
            <div className="space-y-1 pt-1">
              <label
                htmlFor="desc-en"
                className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
              >
                Overview & Description (English)
              </label>
              <textarea
                id="desc-en"
                rows={2}
                disabled={isReadOnly || isMutating}
                placeholder="High-level description of facility functions, processing capacity, and serving farmer groups..."
                value={descEn}
                onChange={(e) => {
                  setDescEn(e.target.value);
                  markDirty();
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Section 2: Location & Spatial Governance */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  2. Location & Spatial Governance
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Canonical 22 Zones</span>
            </div>

            {/* Canonical Zone Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="zone-select"
                className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
              >
                Assigned Canonical Zone <span className="text-rose-500">*</span>
              </label>
              <select
                id="zone-select"
                disabled={isReadOnly || isMutating}
                value={zoneId}
                onChange={(e) => {
                  setZoneId(e.target.value as CanonicalZoneId);
                  markDirty();
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
              >
                {CANONICAL_ZONE_IDS.map((z) => {
                  const meta = CANONICAL_ZONE_METADATA[z];
                  return (
                    <option key={z} value={z}>
                      {meta?.displayName || z} (P-Code: {meta?.pcode || 'ET04'})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Location Description */}
            <div className="space-y-1">
              <label
                htmlFor="loc-desc-en"
                className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
              >
                Specific Location Description / Woreda / Kebele
              </label>
              <input
                id="loc-desc-en"
                type="text"
                disabled={isReadOnly || isMutating}
                placeholder="e.g. Mana Woreda, Bilida Kebele, 12km from Jimma City along main asphalt corridor"
                value={locDescEn}
                onChange={(e) => {
                  setLocDescEn(e.target.value);
                  markDirty();
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            {/* Location Precision & Privacy Governance */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="precision-select"
                  className="font-bold text-slate-800 dark:text-slate-200 text-xs block"
                >
                  Location Precision & Privacy Policy <span className="text-rose-500">*</span>
                </label>
                <select
                  id="precision-select"
                  disabled={isReadOnly || isMutating}
                  value={locationPrecision}
                  onChange={(e) => {
                    setLocationPrecision(e.target.value as LocationPrecision);
                    markDirty();
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                >
                  <option value="exact">Exact (GPS Pinpointed Coordinates)</option>
                  <option value="approximate">Approximate (Generalized / Nearby Marker)</option>
                  <option value="zone_centroid">Zone Centroid (Coordinates Suppressed from Public)</option>
                </select>
              </div>

              {/* Policy explanation */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {locationPrecision === 'exact' && (
                  <p className="text-emerald-700 dark:text-emerald-300">
                    • <strong>Exact coordinates</strong> will be included in published public data and rendered as a precise point marker on GIS maps.
                  </p>
                )}
                {locationPrecision === 'approximate' && (
                  <p className="text-amber-700 dark:text-amber-300">
                    • <strong>Approximate coordinates</strong> will be labeled as approximate for public viewers.
                  </p>
                )}
                {locationPrecision === 'zone_centroid' && (
                  <p className="text-purple-700 dark:text-purple-300">
                    • <strong>Zone Centroid Privacy Gate:</strong> Coordinates will be completely stripped in public DTOs. The facility will be attributed solely to the zone level.
                  </p>
                )}
              </div>

              {/* Coordinate Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label
                    htmlFor="lat-input"
                    className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
                  >
                    Latitude (Decimal [-90 to 90]){' '}
                    {locationPrecision !== 'zone_centroid' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    id="lat-input"
                    type="number"
                    step="0.000001"
                    disabled={isReadOnly || isMutating || locationPrecision === 'zone_centroid'}
                    placeholder="e.g. 7.675400"
                    value={latInput}
                    onChange={(e) => {
                      setLatInput(e.target.value);
                      markDirty();
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="lng-input"
                    className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
                  >
                    Longitude (Decimal [-180 to 180]){' '}
                    {locationPrecision !== 'zone_centroid' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    id="lng-input"
                    type="number"
                    step="0.000001"
                    disabled={isReadOnly || isMutating || locationPrecision === 'zone_centroid'}
                    placeholder="e.g. 36.834100"
                    value={lngInput}
                    onChange={(e) => {
                      setLngInput(e.target.value);
                      markDirty();
                    }}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Interactive OpenLayers Coordinate Picker & Spatial Review */}
            <FacilityLocationPicker
              zoneId={zoneId}
              locationPrecision={locationPrecision}
              latitude={latInput !== '' && !isNaN(parseFloat(latInput)) ? parseFloat(latInput) : null}
              longitude={lngInput !== '' && !isNaN(parseFloat(lngInput)) ? parseFloat(lngInput) : null}
              savedLatitude={savedLat}
              savedLongitude={savedLng}
              isReadOnly={isReadOnly || isMutating}
              onChangeCoordinates={({ lat, lng }) => {
                setLatInput(lat != null ? String(lat) : '');
                setLngInput(lng != null ? String(lng) : '');
                markDirty();
              }}
              onResetLocation={() => {
                setLatInput(savedLat != null ? String(savedLat) : '');
                setLngInput(savedLng != null ? String(savedLng) : '');
                markDirty();
              }}
            />
          </div>

          {/* Section 3: Operations & Ownership */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  3. Operational Status & Asset Ownership
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Physical Asset State</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Physical Operational Status */}
              <div className="space-y-1.5">
                <label
                  htmlFor="op-status"
                  className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
                >
                  Physical Operational Status <span className="text-rose-500">*</span>
                </label>
                <select
                  id="op-status"
                  disabled={isReadOnly || isMutating}
                  value={operationalStatus}
                  onChange={(e) => {
                    setOperationalStatus(e.target.value as FacilityOperationalStatus);
                    markDirty();
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                >
                  <option value="operational">Operational (Currently Active)</option>
                  <option value="under_construction">Under Construction / Expansion</option>
                  <option value="planned">Planned Development / Pipeline</option>
                  <option value="temporarily_closed">Temporarily Closed / Maintenance</option>
                  <option value="inactive">Inactive / Decommissioned</option>
                </select>
                <span className="text-[10px] text-slate-400 block">
                  Note: Physical status is distinct from CMS publication status.
                </span>
              </div>

              {/* Ownership Model */}
              <div className="space-y-1.5">
                <label
                  htmlFor="ownership-select"
                  className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
                >
                  Ownership Model
                </label>
                <select
                  id="ownership-select"
                  disabled={isReadOnly || isMutating}
                  value={ownership}
                  onChange={(e) => {
                    setOwnership(e.target.value as FacilityOwnership);
                    markDirty();
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                >
                  <option value="government">Government / State Enterprise</option>
                  <option value="cooperative">Farmers Cooperative Union</option>
                  <option value="private">Private Commercial Enterprise</option>
                  <option value="ppp">Public-Private Partnership (PPP)</option>
                  <option value="ngo_development_partner">NGO / Development Partner</option>
                  <option value="other">Other Model</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1">
                <label
                  htmlFor="operator-name"
                  className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
                >
                  Operator / Managing Entity
                </label>
                <input
                  id="operator-name"
                  type="text"
                  disabled={isReadOnly || isMutating}
                  placeholder="e.g. Oromia Coffee Farmers Coop"
                  value={operatorName}
                  onChange={(e) => {
                    setOperatorName(e.target.value);
                    markDirty();
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="commissioning-year"
                  className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
                >
                  Commissioning Year
                </label>
                <input
                  id="commissioning-year"
                  type="number"
                  disabled={isReadOnly || isMutating}
                  placeholder="e.g. 2021"
                  value={commissioningYear}
                  onChange={(e) => {
                    setCommissioningYear(e.target.value);
                    markDirty();
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="assessment-date"
                  className="font-bold text-slate-700 dark:text-slate-300 text-xs block"
                >
                  Bureau Assessment Date
                </label>
                <input
                  id="assessment-date"
                  type="date"
                  disabled={isReadOnly || isMutating}
                  value={assessmentDate}
                  onChange={(e) => {
                    setAssessmentDate(e.target.value);
                    markDirty();
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Capacity Metrics */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  4. Capacity Metrics & Scale
                </h3>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddCapacity}
                  className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Metric
                </button>
              )}
            </div>

            {capacities.length === 0 ? (
              <div className="p-4 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <p>No specific capacity metrics added yet.</p>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddCapacity}
                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                  >
                    + Add Primary Capacity Metric
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {capacities.map((cap, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                  >
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Metric Key / Name
                      </label>
                      <input
                        type="text"
                        disabled={isReadOnly || isMutating}
                        placeholder="e.g. storage_capacity"
                        value={cap.metricKey}
                        onChange={(e) =>
                          handleUpdateCapacity(idx, 'metricKey', e.target.value)
                        }
                        className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Value
                      </label>
                      <input
                        type="number"
                        disabled={isReadOnly || isMutating}
                        placeholder="e.g. 5000"
                        value={cap.numericValue ?? ''}
                        onChange={(e) =>
                          handleUpdateCapacity(
                            idx,
                            'numericValue',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Unit
                      </label>
                      <select
                        disabled={isReadOnly || isMutating}
                        value={cap.unit}
                        onChange={(e) =>
                          handleUpdateCapacity(idx, 'unit', e.target.value)
                        }
                        className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                      >
                        {CANONICAL_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <input
                        type="text"
                        disabled={isReadOnly || isMutating}
                        placeholder="Period e.g. 2024"
                        value={cap.referencePeriod || ''}
                        onChange={(e) =>
                          handleUpdateCapacity(idx, 'referencePeriod', e.target.value)
                        }
                        className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />

                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCapacity(idx)}
                          aria-label={`Remove capacity metric ${cap.metricKey}`}
                          className="p-2 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Commodities, Sources, Internal Notes, Lifecycle Actions */}
        <div className="space-y-6">
          {/* Section 5: Commodities & Value Chain */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Target Commodities
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {commodities.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
              {CANONICAL_COMMODITIES.map((c) => {
                const isSelected = commodities.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={isReadOnly || isMutating}
                    onClick={() => handleToggleCommodity(c.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    } disabled:opacity-60`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Authoritative Data Sources & Provenance */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  Attached Data Sources
                </h3>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setShowSourceSelector(true)}
                  className="px-2 py-1 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Attach Source
                </button>
              )}
            </div>

            {attachedSources.length === 0 ? (
              <div className="p-4 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs space-y-1.5">
                <p>No authoritative data source attached.</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  Required before this facility can be submitted for review.
                </p>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setShowSourceSelector(true)}
                    className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] cursor-pointer mt-1"
                  >
                    Browse & Attach Source
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {attachedSources.map((src) => {
                  const isSrcVerified = src.verificationStatus === 'verified';
                  return (
                    <div
                      key={src.sourceId}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                            {src.sourceId}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {src.title}
                          </h4>
                        </div>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleToggleSource(src.sourceId)}
                            aria-label={`Remove source ${src.title}`}
                            className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{src.organization || 'OAB'}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectSource(src)}
                            className="text-purple-600 dark:text-purple-400 font-medium hover:underline cursor-pointer"
                          >
                            Inspect
                          </button>
                          {isSrcVerified ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                              Verified
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 7: Internal Staff Notes */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              Internal Bureau Notes
            </h3>
            <textarea
              rows={3}
              disabled={isReadOnly || isMutating}
              placeholder="Staff-only internal verification notes, surveyor contacts, or inspection notes (never published)..."
              value={internalNotes}
              onChange={(e) => {
                setInternalNotes(e.target.value);
                markDirty();
              }}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Section 8: Authoritative Lifecycle Actions Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-600/30 dark:border-emerald-500/30 p-5 shadow-md space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Lifecycle Actions
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {lifecycleStatus}
              </span>
            </div>

            {/* In Draft Mode */}
            {lifecycleStatus === 'draft' && (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={handleSave}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isNew ? 'Create Facility Record' : 'Save Draft Edits'}
                </button>

                {!isNew && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => setShowConfirmAction('submit_review')}
                    className="w-full py-2 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Submit for Editorial Review
                  </button>
                )}

                {!isNew && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => setShowConfirmAction('archive')}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive Draft
                  </button>
                )}
              </div>
            )}

            {/* In Review Mode */}
            {lifecycleStatus === 'review' && (
              <div className="space-y-2">
                {canVerify && verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => setShowConfirmAction('verify')}
                    className="w-full py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify Facility Record
                  </button>
                )}

                {canVerify && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => setShowConfirmAction('reject')}
                    className="w-full py-2 px-3 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Reject Facility Draft
                  </button>
                )}

                {canPublish && verificationStatus === 'verified' && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => setShowConfirmAction('publish')}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Globe2 className="w-4 h-4" />
                    Publish Live
                  </button>
                )}

                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => setShowConfirmAction('restore')}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Return to Draft
                </button>
              </div>
            )}

            {/* In Published Mode */}
            {lifecycleStatus === 'published' && (
              <div className="space-y-2">
                {canPublish && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => setShowConfirmAction('unpublish')}
                    className="w-full py-2 px-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <EyeOff className="w-4 h-4" />
                    Unpublish Facility
                  </button>
                )}
              </div>
            )}

            {/* In Unpublished Mode */}
            {lifecycleStatus === 'unpublished' && (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={handleSave}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save Content Changes
                </button>

                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => setShowConfirmAction('submit_review')}
                  className="w-full py-2 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Submit for Review
                </button>

                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => setShowConfirmAction('archive')}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive Record
                </button>
              </div>
            )}

            {/* In Archived Mode */}
            {lifecycleStatus === 'archived' && (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => setShowConfirmAction('restore')}
                  className="w-full py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore to Draft
                </button>
              </div>
            )}

            {/* SuperAdmin Permanent Delete */}
            {!isNew && isSuperAdmin && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => setShowConfirmAction('delete')}
                  className="w-full py-1 px-3 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Permanent Delete (SuperAdmin)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <FacilitySourceSelectorModal
        isOpen={showSourceSelector}
        onClose={() => setShowSourceSelector(false)}
        availableSources={allSources}
        selectedSourceIds={sourceIds}
        onToggleSource={handleToggleSource}
        onInspectSource={setInspectSource}
      />

      <SourceDetailModal
        source={inspectSource}
        onClose={() => setInspectSource(null)}
      />

      <FacilityVersionConflictModal
        isOpen={showVersionConflict}
        onReload={handleReloadLatest}
        onClose={() => setShowVersionConflict(false)}
        currentVersion={version}
      />

      <FacilityConfirmActionModal
        isOpen={Boolean(showConfirmAction)}
        actionType={showConfirmAction}
        facilityTitle={titleEn || facilityId}
        facilityId={facilityId}
        isProcessing={isMutating}
        onConfirm={handleActionConfirm}
        onClose={() => setShowConfirmAction(null)}
      />

      <FacilityAuditHistoryDrawer
        isOpen={showAuditDrawer}
        onClose={() => setShowAuditDrawer(false)}
        auditLogs={auditLogs}
        facilityTitle={titleEn || facilityId}
        facilityId={facilityId}
        isLoading={isLoadingAudit}
      />
    </div>
  );
}
