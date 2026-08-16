import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Database,
  ArrowLeft,
  FileText,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit3,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Plus,
  Trash2,
  BookOpen,
  Map,
  Eye,
  BarChart2,
  Info,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getDataset,
  getDatasetCoverage,
  getZoneValues,
  DatasetCoverage,
  submitDatasetForReview,
  returnDatasetToDraft,
  publishDataset,
  unpublishDataset,
  verifyDataset,
  rejectDataset,
  attachSourceToDataset,
  removeSourceFromDataset,
  attachMethodologyToDataset,
  removeMethodologyFromDataset,
} from '../../../services/investment/investmentDatasetService';
import { getSource, getAllSources } from '../../../services/investment/investmentSourceService';
import { getMethodology, getAllMethodologies } from '../../../services/investment/investmentMethodologyService';
import { getAuditLogsForEntity } from '../../../services/investment/investmentAuditService';
import {
  InvestmentDataset,
  InvestmentSource,
  InvestmentMethodology,
  InvestmentAuditLog,
  InvestmentZoneValue,
} from '../../../types/investment';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';
import { AdminDatasetValueEditor } from '../../../components/admin/investment/AdminDatasetValueEditor';
import { AdminThematicMapContainer, MapViewMode } from '../../../components/admin/investment/AdminThematicMapContainer';
import { SelectedZoneReviewPanel } from '../../../components/admin/investment/SelectedZoneReviewPanel';
import { QualitySummaryCard } from '../../../components/admin/investment/QualitySummaryCard';
import { SourceDetailModal } from '../../../components/admin/investment/SourceDetailModal';
import { MethodologyDetailModal } from '../../../components/admin/investment/MethodologyDetailModal';

type DetailTab = 'overview' | 'zones' | 'provenance' | 'map' | 'audit';

export function AdminDatasetDetailPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const { staffUser } = useStaffAuthorizationContext();

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [dataset, setDataset] = useState<InvestmentDataset | null>(null);
  const [coverage, setCoverage] = useState<DatasetCoverage | null>(null);
  const [zoneValues, setZoneValues] = useState<InvestmentZoneValue[]>([]);
  const [sources, setSources] = useState<InvestmentSource[]>([]);
  const [methodology, setMethodology] = useState<InvestmentMethodology | null>(null);
  const [allSources, setAllSources] = useState<InvestmentSource[]>([]);
  const [allMethodologies, setAllMethodologies] = useState<InvestmentMethodology[]>([]);
  const [auditLogs, setAuditLogs] = useState<InvestmentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingValues, setIsEditingValues] = useState(false);

  // Selected Zone for Map ↔ Table synchronization
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('metric');

  // Modals
  const [inspectSource, setInspectSource] = useState<InvestmentSource | null>(null);
  const [inspectMethodology, setInspectMethodology] = useState<InvestmentMethodology | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Source Search in selector
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');

  const canManageDatasets = hasPermission(staffUser, 'investment.datasets.manage') || hasPermission(staffUser, 'investment.edit');
  const canPublish = hasPermission(staffUser, 'investment.publish');
  const canVerify = hasPermission(staffUser, 'investment.verify');
  const canManageSources = hasPermission(staffUser, 'investment.sources.manage');

  const [transitioning, setTransitioning] = useState(false);
  const [transitionMsg, setTransitionMsg] = useState<string | null>(null);

  const handleSubmitForReview = async () => {
    if (!staffUser || !dataset) return;
    setTransitioning(true);
    setTransitionMsg(null);
    setError(null);
    try {
      await submitDatasetForReview(staffUser, dataset.datasetId, dataset.version);
      setTransitionMsg('Dataset submitted for review successfully.');
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit dataset for review.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleReturnToDraft = async () => {
    if (!staffUser || !dataset) return;
    setTransitioning(true);
    setTransitionMsg(null);
    setError(null);
    try {
      await returnDatasetToDraft(staffUser, dataset.datasetId, dataset.version);
      setTransitionMsg('Dataset returned to draft status.');
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to return dataset to draft.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleVerify = async () => {
    if (!staffUser || !dataset) return;
    setTransitioning(true);
    setTransitionMsg(null);
    setError(null);
    try {
      await verifyDataset(staffUser, dataset.datasetId, dataset.version);
      setTransitionMsg('Dataset successfully verified!');
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to verify dataset.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleReject = async () => {
    if (!staffUser || !dataset) return;
    setTransitioning(true);
    setTransitionMsg(null);
    setError(null);
    try {
      await rejectDataset(staffUser, dataset.datasetId, dataset.version, rejectionNotes);
      setTransitionMsg('Dataset rejected.');
      setShowRejectModal(false);
      setRejectionNotes('');
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject dataset.');
    } finally {
      setTransitioning(false);
    }
  };

  const handlePublish = async () => {
    if (!staffUser || !dataset) return;
    setTransitioning(true);
    setTransitionMsg(null);
    setError(null);
    try {
      await publishDataset(staffUser, dataset.datasetId, dataset.version);
      setTransitionMsg('Dataset published successfully!');
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish dataset.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleUnpublish = async () => {
    if (!staffUser || !dataset) return;
    setTransitioning(true);
    setTransitionMsg(null);
    setError(null);
    try {
      await unpublishDataset(staffUser, dataset.datasetId, dataset.version);
      setTransitionMsg('Dataset unpublished successfully.');
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to unpublish dataset.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleAttachSource = async (sourceId: string) => {
    if (!staffUser || !dataset || !sourceId) return;
    setTransitioning(true);
    setError(null);
    try {
      await attachSourceToDataset(staffUser, dataset.datasetId, sourceId, dataset.version);
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to attach source.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    if (!staffUser || !dataset || !sourceId) return;
    setTransitioning(true);
    setError(null);
    try {
      await removeSourceFromDataset(staffUser, dataset.datasetId, sourceId, dataset.version);
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove source.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleAttachMethodology = async (methodologyId: string) => {
    if (!staffUser || !dataset || !methodologyId) return;
    setTransitioning(true);
    setError(null);
    try {
      await attachMethodologyToDataset(staffUser, dataset.datasetId, methodologyId, dataset.version);
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to attach methodology.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleRemoveMethodology = async () => {
    if (!staffUser || !dataset) return;
    setTransitioning(true);
    setError(null);
    try {
      await removeMethodologyFromDataset(staffUser, dataset.datasetId, dataset.version);
      await loadDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove methodology.');
    } finally {
      setTransitioning(false);
    }
  };

  const loadDetails = async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);

    try {
      const ds = await getDataset(datasetId);
      if (!ds) {
        setError(`Dataset with ID "${datasetId}" was not found.`);
        setLoading(false);
        return;
      }
      setDataset(ds);

      const [cov, zv, availableSources, availableMeths] = await Promise.all([
        getDatasetCoverage(datasetId),
        getZoneValues(datasetId),
        getAllSources(),
        getAllMethodologies(),
      ]);
      setCoverage(cov);
      setZoneValues(zv);
      setAllSources(availableSources);
      setAllMethodologies(availableMeths);

      if (ds.sourceIds && Array.isArray(ds.sourceIds) && ds.sourceIds.length > 0) {
        const srcList = await Promise.all(ds.sourceIds.map((sid) => getSource(sid)));
        setSources(srcList.filter((s): s is InvestmentSource => s !== null));
      } else {
        setSources([]);
      }

      if (ds.methodologyId) {
        const meth = await getMethodology(ds.methodologyId);
        setMethodology(meth);
      } else {
        setMethodology(null);
      }

      const logs = await getAuditLogsForEntity('dataset', datasetId);
      setAuditLogs(logs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dataset details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [datasetId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
        <Database className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
        <p>Loading dataset specification...</p>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/investment/datasets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Datasets</span>
        </Link>

        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-rose-600 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
          <p className="font-bold text-sm">{error || 'Dataset not found'}</p>
        </div>
      </div>
    );
  }

  const renderVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            Verification Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Unverified
          </span>
        );
    }
  };

  const renderLifecycleBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            Published
          </span>
        );
      case 'review':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            Under Review (Locked)
          </span>
        );
      case 'archived':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
            Archived
          </span>
        );
      case 'unpublished':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
            Unpublished
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            Draft
          </span>
        );
    }
  };

  // Readiness Evaluation
  const isMethodologyRequired = dataset.metric === 'suitability' || dataset.metric === 'investment_potential';

  const hasValidSources = sources.length >= 1 && sources.every((s) => s.verificationStatus === 'verified');
  const hasValidMethodology = !isMethodologyRequired || (methodology !== null && methodology.verificationStatus === 'verified');
  const isFullyPopulated = (coverage?.populatedCount ?? 0) === 22;
  const isVerified = dataset.verificationStatus === 'verified';
  const isEditable = dataset.lifecycleStatus === 'draft' || dataset.lifecycleStatus === 'unpublished';

  // Calculate publication blockers
  const blockers: string[] = [];
  if (dataset.lifecycleStatus === 'review') {
    if (!isVerified) blockers.push('Dataset verification is pending (requires verification by Super Admin or Content Admin).');
    if (sources.length === 0) blockers.push('At least one data source must be linked to the dataset.');
    else if (!sources.every((s) => s.verificationStatus === 'verified')) blockers.push('All attached sources must be in "verified" state.');
    if (isMethodologyRequired && !methodology) blockers.push(`Datasets with metric "${dataset.metric}" require a linked methodology.`);
    else if (isMethodologyRequired && methodology?.verificationStatus !== 'verified') blockers.push('Associated methodology must be verified.');
    if ((coverage?.populatedCount ?? 0) === 0) blockers.push('Dataset contains zero zone values.');
  }

  if (isEditingValues && dataset) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => setIsEditingValues(false)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dataset Review Workspace</span>
        </button>

        <AdminDatasetValueEditor
          dataset={dataset}
          existingValues={zoneValues}
          onSaveSuccess={() => {
            setIsEditingValues(false);
            loadDetails();
          }}
          onCancel={() => setIsEditingValues(false)}
        />
      </div>
    );
  }

  // Filter available sources for attach picker
  const filteredAvailableSources = allSources.filter((s) => {
    if (dataset.sourceIds?.includes(s.sourceId)) return false;
    if (!sourceSearchTerm) return true;
    const q = sourceSearchTerm.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.organization.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/investment/datasets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Datasets Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          {renderVerificationBadge(dataset.verificationStatus)}
          {renderLifecycleBadge(dataset.lifecycleStatus)}
        </div>
      </div>

      {/* Main Spec Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded">
              Dataset ID: {dataset.datasetId}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
              {dataset.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              {dataset.description || 'No detailed description provided.'}
            </p>
          </div>

          <div className="text-right shrink-0 font-mono text-xs text-slate-500 space-y-2">
            <div>Version: <strong className="text-slate-800 dark:text-slate-200">v{dataset.version}</strong></div>
            <div>Updated: {dataset.updatedAt ? new Date(dataset.updatedAt).toLocaleDateString() : 'N/A'}</div>

            {/* Lifecycle & Verification Action Bar */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 font-sans">
              {/* Draft / Unpublished -> Submit for Review */}
              {canManageDatasets && isEditable && (
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={transitioning}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
              )}

              {/* Review -> Verify / Reject */}
              {canVerify && dataset.lifecycleStatus === 'review' && (
                <>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={transitioning}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify Dataset</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    disabled={transitioning}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {/* Review -> Return to Draft */}
              {canManageDatasets && dataset.lifecycleStatus === 'review' && (
                <button
                  type="button"
                  onClick={handleReturnToDraft}
                  disabled={transitioning}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Return to Draft</span>
                </button>
              )}

              {/* Review + Verified -> Publish Dataset */}
              {canPublish && dataset.lifecycleStatus === 'review' && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={transitioning || blockers.length > 0}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg text-white shadow-xs transition-colors cursor-pointer ${
                    blockers.length === 0
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  title={blockers.length > 0 ? blockers.join(' ') : 'Publish Dataset'}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish Dataset</span>
                </button>
              )}

              {/* Published -> Unpublish Dataset */}
              {canManageDatasets && dataset.lifecycleStatus === 'published' && (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={transitioning}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-700 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Unpublish Dataset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transition Success Message */}
        {transitionMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{transitionMsg}</span>
          </div>
        )}

        {/* Publication Blockers Explanation Banner */}
        {dataset.lifecycleStatus === 'review' && blockers.length > 0 && (
          <div className="p-3.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Publication Requirements Pending ({blockers.length})</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1 text-amber-800 dark:text-amber-300">
              {blockers.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Dataset Rejection Notes
              </h4>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
              >
                Cancel
              </button>
            </div>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Provide reasons for rejection or requested corrections for the data author..."
              className="w-full text-xs p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReject}
                disabled={transitioning}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-700 hover:bg-rose-800 text-white cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Overview & Readiness</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'zones'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Zone Coverage & Values ({coverage?.populatedCount ?? 0}/22)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('provenance')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'provenance'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Sources & Methodology ({sources.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'map'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Admin Thematic Map Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Activity Audit History ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & READINESS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metadata Specs Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dataset Metadata Specification
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Commodity</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
                  {dataset.commodity}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Metric</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
                  {dataset.metric?.replace('_', ' ')}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Category</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 capitalize mt-0.5">
                  {dataset.category?.replace('_', ' ')}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Unit</span>
                <p className="font-semibold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                  {dataset.unit}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Reference Period</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {dataset.referencePeriod?.label || dataset.referencePeriod?.startYear}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Coverage</span>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                  {coverage?.populatedCount ?? 0} / 22 zones
                </p>
              </div>
            </div>
          </div>

          {/* Publication Readiness Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Publication Readiness Governance Panel
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                hasValidSources
                  ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Verified Data Sources</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {sources.length} Attached {hasValidSources ? '(Verified)' : sources.length === 0 ? '(Missing)' : '(Unverified)'}
                  </span>
                </div>
                {hasValidSources ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                hasValidMethodology
                  ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Methodology Specification</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {isMethodologyRequired ? (methodology ? (methodology.verificationStatus === 'verified' ? 'Verified' : 'Unverified') : 'Missing') : 'Not Required'}
                  </span>
                </div>
                {hasValidMethodology ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isFullyPopulated
                  ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Spatial Zone Coverage</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {coverage?.populatedCount ?? 0} / 22 Zones Populated
                  </span>
                </div>
                {isFullyPopulated ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isVerified
                  ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : dataset.verificationStatus === 'rejected'
                  ? 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
                  : 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Dataset Verification</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm capitalize">
                    {dataset.verificationStatus}
                  </span>
                </div>
                {isVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : dataset.verificationStatus === 'rejected' ? (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Lifecycle State</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm capitalize">
                    {dataset.lifecycleStatus} ({isEditable ? 'Editable' : 'Immutable'})
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-500">v{dataset.version}</span>
              </div>
            </div>
          </div>

          {/* Data Quality Summary Breakdown */}
          <QualitySummaryCard zoneValues={zoneValues} metric={dataset.metric} />
        </div>
      )}

      {/* TAB CONTENT 2: ZONE COVERAGE & DATA VALUES */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  22 Canonical Zone Inventory & Record Values ({coverage?.populatedCount ?? 0} / 22 Populated)
                </h3>
              </div>

              {canManageDatasets && (
                isEditable ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingValues(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Launch Value Editor</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                    Values Locked ({dataset.lifecycleStatus})
                  </span>
                )
              )}
            </div>

            {/* 22 Zone Summary Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {Object.entries(CANONICAL_ZONE_METADATA).map(([zid, info]) => {
                const isPopulated = coverage?.populatedZoneIds.includes(zid as any);
                const isSelected = selectedZoneId === zid;

                return (
                  <button
                    key={zid}
                    type="button"
                    onClick={() => {
                      setSelectedZoneId(zid);
                      setActiveTab('map');
                    }}
                    className={`p-2 rounded border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/40'
                        : isPopulated
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-200 hover:bg-emerald-100/60'
                        : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold truncate">{info.displayName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{info.pcode}</div>
                    </div>

                    <span
                      className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isPopulated
                          ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isPopulated ? 'Populated' : 'Missing'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Zone Values Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Zone Name</th>
                    <th className="p-2.5">PCODE</th>
                    <th className="p-2.5 font-mono">Record Value</th>
                    <th className="p-2.5">Quality Flag</th>
                    <th className="p-2.5">Notes / Comment</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {Object.entries(CANONICAL_ZONE_METADATA).map(([zid, info]) => {
                    const zv = zoneValues.find((v) => v.zoneId === zid);
                    const isProd = dataset.metric === 'production';
                    const rawVal = zv ? (isProd ? zv.productionVolume : zv.value) : null;
                    const isPopulated = rawVal !== null && rawVal !== undefined && typeof rawVal === 'number';
                    const isSelected = selectedZoneId === zid;

                    return (
                      <tr
                        key={zid}
                        onClick={() => setSelectedZoneId(zid)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 font-bold text-slate-900 dark:text-slate-100'
                            : isPopulated
                            ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-400'
                        }`}
                      >
                        <td className="p-2.5 font-sans font-semibold text-slate-900 dark:text-slate-100">{info.displayName}</td>
                        <td className="p-2.5 text-slate-400">{info.pcode}</td>
                        <td className="p-2.5 font-bold">
                          {isPopulated ? (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              {rawVal.toLocaleString()} {dataset.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-normal">Missing (null)</span>
                          )}
                        </td>
                        <td className="p-2.5 font-sans">
                          {isPopulated ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                              {zv?.qualityFlag || 'unverified'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No Data</span>
                          )}
                        </td>
                        <td className="p-2.5 font-sans text-slate-500 max-w-xs truncate">
                          {zv?.notes || '—'}
                        </td>
                        <td className="p-2.5 text-right font-sans">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedZoneId(zid);
                              setActiveTab('map');
                            }}
                            className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-800 cursor-pointer"
                          >
                            Inspect Map
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SOURCES & METHODOLOGY */}
      {activeTab === 'provenance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sources Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Linked Data Sources ({sources.length})
                </h3>
              </div>

              {canManageSources && (
                <Link
                  to="/admin/investment/sources"
                  className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sources Directory</span>
                </Link>
              )}
            </div>

            {/* Source Selector (when editable) */}
            {isEditable && canManageDatasets && (
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Attach Source Reference
                </label>

                {allSources.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold">No investment data sources are available.</p>
                    {canManageSources && (
                      <Link
                        to="/admin/investment/sources"
                        className="font-bold underline text-purple-700 dark:text-purple-400 block mt-1"
                      >
                        Create New Source Record →
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search sources by title or org..."
                        value={sourceSearchTerm}
                        onChange={(e) => setSourceSearchTerm(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <select
                      id="attach-source-dropdown"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAttachSource(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                      <option value="" disabled>Select source to attach...</option>
                      {filteredAvailableSources.map((s) => (
                        <option key={s.sourceId} value={s.sourceId}>
                          {s.title} — {s.organization} ({s.verificationStatus})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {sources.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>No data sources linked yet</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Datasets must link at least one verified data source before verification and publication.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sources.map((src) => (
                  <div
                    key={src.sourceId}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {src.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          src.verificationStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {src.verificationStatus}
                        </span>

                        <button
                          type="button"
                          onClick={() => setInspectSource(src)}
                          className="px-2 py-1 text-[10px] font-bold rounded bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-200 cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Details</span>
                        </button>

                        {isEditable && canManageDatasets && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSource(src.sourceId)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Source"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-xs">Org: <strong>{src.organization}</strong> | Document: {src.documentTitle || 'N/A'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Methodology Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Associated Analytical Methodology
                </h3>
              </div>
            </div>

            {/* Methodology Selector (when editable) */}
            {isEditable && canManageDatasets && (
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Select Associated Methodology
                </label>
                <select
                  id="attach-methodology-dropdown"
                  value={dataset.methodologyId || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAttachMethodology(e.target.value);
                    }
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">No methodology explicitly linked...</option>
                  {allMethodologies.map((m) => (
                    <option key={m.methodologyId} value={m.methodologyId}>
                      {m.title} — v{m.versionLabel || '1.0'} ({m.verificationStatus})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {methodology ? (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{methodology.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      methodology.verificationStatus === 'verified'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {methodology.verificationStatus}
                    </span>

                    <button
                      type="button"
                      onClick={() => setInspectMethodology(methodology)}
                      className="px-2 py-1 text-[10px] font-bold rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-200 cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>

                    {isEditable && canManageDatasets && (
                      <button
                        type="button"
                        onClick={handleRemoveMethodology}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove Methodology"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{methodology.description}</p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 italic space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {isMethodologyRequired
                    ? 'Methodology is REQUIRED for suitability & investment potential metrics.'
                    : 'Methodology is optional for standard production metrics.'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Linking a verified methodology provides scientific justification and transparent analytical component weights for reviewers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: ADMIN THEMATIC MAP PREVIEW */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AdminThematicMapContainer
                dataset={dataset}
                zoneValues={zoneValues}
                selectedZoneId={selectedZoneId}
                onSelectZone={(zid) => setSelectedZoneId(zid)}
                viewMode={mapViewMode}
                onViewModeChange={(m) => setMapViewMode(m)}
                height="520px"
              />
            </div>

            <div className="space-y-4">
              <SelectedZoneReviewPanel
                zoneId={selectedZoneId}
                dataset={dataset}
                zoneValues={zoneValues}
                onSelectZone={(zid) => setSelectedZoneId(zid)}
              />

              {/* Map View Switcher Info */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block flex items-center gap-1">
                  <Info className="w-4 h-4 text-emerald-600" /> Map Synchronization Guide
                </span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Clicking any canonical zone on the OpenLayers preview map updates the selected zone inspector card and highlights the corresponding row in the Zone Coverage table.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Authoritative Investment Audit Log History ({auditLogs.length} Entries)
            </h3>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No audit entries recorded for this dataset.
            </p>
          ) : (
            <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <div key={log.id} className="pt-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] uppercase text-emerald-700 dark:text-emerald-400">
                        {log.action}
                      </span>
                      {log.summary}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Actor: {log.actorEmail} ({log.actorRole})</span>
                    {log.previousVersion !== undefined && (
                      <span>Version: v{log.previousVersion} → v{log.newVersion}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <SourceDetailModal source={inspectSource} onClose={() => setInspectSource(null)} />
      <MethodologyDetailModal methodology={inspectMethodology} onClose={() => setInspectMethodology(null)} />
    </div>
  );
}

export default AdminDatasetDetailPage;
