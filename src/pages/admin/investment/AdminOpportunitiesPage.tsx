import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Save,
  X,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAllOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  slugifyOpportunityTitle,
} from '../../../services/investment/investmentOpportunityService';
import { seedPrototypeOpportunitiesData } from '../../../services/investment/investmentPrototypeSeedService';
import {
  InvestmentOpportunity,
  LifecycleStatus,
  VerificationStatus,
} from '../../../types/investment';
import {
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
  CanonicalZoneId,
} from '../../../features/investment-map/constants/canonicalZones';
import { OPPORTUNITY_TYPE_OPTIONS } from '../../../data/investmentPrototypeOpportunitySeedData';
import { PROTOTYPE_SOURCE_IDS } from '../../../data/investmentPrototypeSeedData';
import { PROTOTYPE_INFRA_SOURCE_IDS } from '../../../data/investmentPrototypeInfraSeedData';

type FormMode = 'create' | 'edit';

const COMMODITY_OPTIONS = ['coffee', 'wheat', 'maize', 'livestock', 'horticulture', 'oilseeds', 'dairy'];

const emptyForm = () => ({
  opportunityId: '',
  title: '',
  slug: '',
  zoneIds: [] as CanonicalZoneId[],
  commodityKeys: [] as string[],
  opportunityType: 'processing_cluster',
  summary: '',
  description: '',
  responsibleOffice: 'Oromia Bureau of Agriculture',
  sourceIds: [
    PROTOTYPE_SOURCE_IDS.oboaZone,
    PROTOTYPE_SOURCE_IDS.compilation,
    PROTOTYPE_INFRA_SOURCE_IDS.corridorNotes,
  ] as string[],
  minUsd: '',
  maxUsd: '',
  rangeNotes: '',
  totalHa: '',
  tenureType: '',
  landNotes: '',
  lifecycleStatus: 'published' as LifecycleStatus,
  verificationStatus: 'verified' as VerificationStatus,
});

export function AdminOpportunitiesPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [editingVersion, setEditingVersion] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const canManageOpps = hasPermission(staffUser, 'investment.opportunities.manage');
  const canDelete = staffUser?.role === 'superAdmin';
  const canSeed =
    canManageOpps && (staffUser?.role === 'superAdmin' || staffUser?.role === 'contentAdmin');

  const loadOpps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllOpportunities();
      setOpportunities(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load opportunities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpps();
  }, []);

  useEffect(() => {
    if (!staffUser || !canSeed || seeding) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('seedOpportunities') !== '1') return;
    let cancelled = false;
    (async () => {
      setSeeding(true);
      setError(null);
      try {
        const result = await seedPrototypeOpportunitiesData(staffUser);
        if (cancelled) return;
        setActionMessage(result.message);
        await loadOpps();
        params.delete('seedOpportunities');
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
        window.history.replaceState({}, '', next);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Seed failed');
      } finally {
        if (!cancelled) setSeeding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffUser, canSeed]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return opportunities;
    return opportunities.filter(
      (o) =>
        o.title?.toLowerCase().includes(q) ||
        o.opportunityId?.toLowerCase().includes(q) ||
        o.opportunityType?.toLowerCase().includes(q) ||
        o.commodityKeys?.some((c) => c.toLowerCase().includes(q))
    );
  }, [opportunities, searchQuery]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditingVersion(undefined);
    setFormError(null);
    setFormMode('create');
  };

  const openEdit = (opp: InvestmentOpportunity) => {
    setForm({
      opportunityId: opp.opportunityId,
      title: opp.title || '',
      slug: opp.slug || '',
      zoneIds: (opp.zoneIds || []) as CanonicalZoneId[],
      commodityKeys: opp.commodityKeys || [],
      opportunityType: opp.opportunityType || 'general',
      summary: opp.summary || '',
      description: opp.description || '',
      responsibleOffice: opp.responsibleOffice || 'Oromia Bureau of Agriculture',
      sourceIds: opp.sourceIds || [],
      minUsd: opp.estimatedInvestmentRange?.minUsd != null ? String(opp.estimatedInvestmentRange.minUsd) : '',
      maxUsd: opp.estimatedInvestmentRange?.maxUsd != null ? String(opp.estimatedInvestmentRange.maxUsd) : '',
      rangeNotes: opp.estimatedInvestmentRange?.notes || '',
      totalHa: opp.landInformation?.totalHa != null ? String(opp.landInformation.totalHa) : '',
      tenureType: opp.landInformation?.tenureType || '',
      landNotes: opp.landInformation?.notes || '',
      lifecycleStatus: opp.lifecycleStatus || 'draft',
      verificationStatus: opp.verificationStatus || 'pending',
    });
    setEditingVersion(opp.version);
    setFormError(null);
    setFormMode('edit');
  };

  const toggleZone = (zoneId: CanonicalZoneId) => {
    setForm((prev) => ({
      ...prev,
      zoneIds: prev.zoneIds.includes(zoneId)
        ? prev.zoneIds.filter((z) => z !== zoneId)
        : [...prev.zoneIds, zoneId],
    }));
  };

  const toggleCommodity = (key: string) => {
    setForm((prev) => ({
      ...prev,
      commodityKeys: prev.commodityKeys.includes(key)
        ? prev.commodityKeys.filter((c) => c !== key)
        : [...prev.commodityKeys, key],
    }));
  };

  const buildPayload = () => {
    const title = form.title.trim();
    const slug = (form.slug || slugifyOpportunityTitle(title)).trim();
    const opportunityId =
      formMode === 'edit'
        ? form.opportunityId
        : form.opportunityId.trim() || `opp_${slug.replace(/-/g, '_').slice(0, 48)}`;

    const estimatedInvestmentRange =
      form.minUsd || form.maxUsd || form.rangeNotes
        ? {
            minUsd: form.minUsd ? Number(form.minUsd) : undefined,
            maxUsd: form.maxUsd ? Number(form.maxUsd) : undefined,
            notes: form.rangeNotes || undefined,
          }
        : undefined;

    const landInformation =
      form.totalHa || form.tenureType || form.landNotes
        ? {
            totalHa: form.totalHa ? Number(form.totalHa) : undefined,
            tenureType: form.tenureType || undefined,
            notes: form.landNotes || undefined,
          }
        : undefined;

    return {
      opportunityId,
      title,
      slug,
      zoneIds: form.zoneIds,
      commodityKeys: form.commodityKeys,
      opportunityType: form.opportunityType,
      summary: form.summary.trim(),
      description: form.description.trim(),
      responsibleOffice: form.responsibleOffice.trim(),
      sourceIds: form.sourceIds,
      estimatedInvestmentRange,
      landInformation,
      lifecycleStatus: form.lifecycleStatus,
      verificationStatus: form.verificationStatus,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser || !canManageOpps) return;
    setFormError(null);
    const payload = buildPayload();
    if (!payload.title || !payload.summary || payload.zoneIds.length === 0) {
      setFormError('Title, summary, and at least one zone are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (formMode === 'create') {
        await createOpportunity(staffUser, payload as any);
        setActionMessage(`Created ${payload.opportunityId}`);
      } else {
        await updateOpportunity(staffUser, payload as any, editingVersion);
        setActionMessage(`Updated ${payload.opportunityId}`);
      }
      setFormMode(null);
      await loadOpps();
    } catch (err: any) {
      setFormError(err?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (opp: InvestmentOpportunity) => {
    if (!staffUser || !canDelete) return;
    if (!window.confirm(`Permanently delete opportunity "${opp.title}"?`)) return;
    try {
      await deleteOpportunity(staffUser, opp.opportunityId, opp.version);
      setActionMessage(`Deleted ${opp.opportunityId}`);
      await loadOpps();
    } catch (err: any) {
      setError(err?.message || 'Delete failed');
    }
  };

  const handleSeed = async () => {
    if (!staffUser || !canSeed) return;
    if (
      !window.confirm(
        'Seed 6 published prototype opportunities (coffee, wheat, maize, livestock corridors)?'
      )
    ) {
      return;
    }
    setSeeding(true);
    setActionMessage(null);
    try {
      const result = await seedPrototypeOpportunitiesData(staffUser);
      setActionMessage(result.message);
      await loadOpps();
    } catch (err: any) {
      setError(err?.message || 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Investment Opportunities Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Promotional investment profiles linked to canonical zones and verified sources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canSeed && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${seeding ? 'animate-pulse' : ''}`} />
              <span>{seeding ? 'Seeding…' : 'Seed prototype opportunities'}</span>
            </button>
          )}
          {canManageOpps && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Opportunity</span>
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 px-4 py-3 text-sm">
          {actionMessage}
        </div>
      )}

      {formMode && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {formMode === 'create' ? 'Create opportunity' : `Edit ${form.opportunityId}`}
            </h3>
            <button type="button" onClick={() => setFormMode(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Title</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((p) => ({
                    ...p,
                    title,
                    slug: formMode === 'create' ? slugifyOpportunityTitle(title) : p.slug,
                    opportunityId:
                      formMode === 'create'
                        ? `opp_${slugifyOpportunityTitle(title).replace(/-/g, '_').slice(0, 48)}`
                        : p.opportunityId,
                  }));
                }}
                required
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Slug</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Type</span>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.opportunityType}
                onChange={(e) => setForm((p) => ({ ...p, opportunityType: e.target.value }))}
              >
                {OPPORTUNITY_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Responsible office</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.responsibleOffice}
                onChange={(e) => setForm((p) => ({ ...p, responsibleOffice: e.target.value }))}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Lifecycle</span>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.lifecycleStatus}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lifecycleStatus: e.target.value as LifecycleStatus }))
                }
              >
                {['draft', 'review', 'published', 'unpublished', 'archived'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Verification</span>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.verificationStatus}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    verificationStatus: e.target.value as VerificationStatus,
                  }))
                }
              >
                {['unverified', 'pending', 'verified', 'rejected'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-xs space-y-1 block">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Summary</span>
            <textarea
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 min-h-[64px]"
              value={form.summary}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              required
            />
          </label>
          <label className="text-xs space-y-1 block">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Description</span>
            <textarea
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 min-h-[96px]"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </label>

          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Zones</p>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {CANONICAL_ZONE_IDS.map((zid) => (
                <button
                  key={zid}
                  type="button"
                  onClick={() => toggleZone(zid)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${
                    form.zoneIds.includes(zid)
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {CANONICAL_ZONE_METADATA[zid].displayName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Commodities</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMODITY_OPTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCommodity(key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border capitalize ${
                    form.commodityKeys.includes(key)
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Min USD</span>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.minUsd}
                onChange={(e) => setForm((p) => ({ ...p, minUsd: e.target.value }))}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Max USD</span>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.maxUsd}
                onChange={(e) => setForm((p) => ({ ...p, maxUsd: e.target.value }))}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Land (ha)</span>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.totalHa}
                onChange={(e) => setForm((p) => ({ ...p, totalHa: e.target.value }))}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving…' : 'Save opportunity'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              placeholder="Search title, type, commodity…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
            Loading opportunities from Firestore...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No investment opportunities yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create a profile or seed prototype corridor opportunities for the public Opportunities tab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Zone(s)</th>
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Lifecycle</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filtered.map((opp) => (
                  <tr key={opp.opportunityId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold">{opp.title}</td>
                    <td className="py-3 px-4">
                      {opp.zoneIds
                        ?.map(
                          (z) =>
                            CANONICAL_ZONE_METADATA[z as CanonicalZoneId]?.displayName || z
                        )
                        .join(', ')}
                    </td>
                    <td className="py-3 px-4 capitalize">{opp.commodityKeys?.join(', ') || 'N/A'}</td>
                    <td className="py-3 px-4 capitalize">{opp.opportunityType?.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4">{opp.verificationStatus}</td>
                    <td className="py-3 px-4">{opp.lifecycleStatus}</td>
                    <td className="py-3 px-4">
                      {opp.updatedAt ? new Date(opp.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {canManageOpps && (
                          <button
                            type="button"
                            onClick={() => openEdit(opp)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(opp)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOpportunitiesPage;
