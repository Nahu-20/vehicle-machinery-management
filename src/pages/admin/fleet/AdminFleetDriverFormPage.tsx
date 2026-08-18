import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import {
  Save,
  ArrowLeft,
  AlertTriangle,
  Info,
  LogOut,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  createDriver,
  getDriverById,
  updateDriver,
  type DriverInput,
} from '../../../features/fleet/services/fleetDriverService';
import { listAssets } from '../../../features/fleet/services/fleetService';
import { issueAsset } from '../../../features/fleet/services/fleetAssignmentService';
import type {
  FleetAsset,
  FleetDriver,
  FleetDriverEmployment,
} from '../../../features/fleet/types/fleet';
import {
  assessDriverForAsset,
  formatMeter,
  isIssuable,
  METER_UNIT_LABEL,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  FleetPanel,
  FleetButton,
  StatusPill,
  INPUT,
  LABEL,
  FleetLoading,
  FleetBanner,
} from '../../../features/fleet/components/FleetUI';
import {
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
  type CanonicalZoneId,
} from '../../../features/investment-map/constants/canonicalZones';


const EMPLOYMENT_OPTIONS: { value: FleetDriverEmployment; label: string; hint: string }[] = [
  { value: 'permanent', label: 'Permanent', hint: 'Bureau staff with an employee number' },
  { value: 'contract', label: 'Contract', hint: 'Engaged for a period or a project' },
  { value: 'seconded', label: 'Seconded', hint: 'On loan from another office' },
  { value: 'daily', label: 'Daily', hint: 'Taken on by the day, often at a busy season' },
];

function toDateInput(ts?: Timestamp | null): string {
  if (!ts?.toDate) return '';
  const d = ts.toDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function fromDateInput(value: string): Timestamp | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

/**
 * Add or edit a driver.
 *
 * Only two fields are required — a name and a zone. Everything else is optional
 * because the alternative is a form that cannot record a daily labourer whose
 * licence nobody has seen yet, and a register that refuses to hold the truth is
 * one people keep a second book alongside.
 */
export function AdminFleetDriverFormPage() {
  const { driverId: routeDriverId } = useParams<{ driverId: string }>();
  const isEdit = Boolean(routeDriverId);
  const navigate = useNavigate();

  const { staffUser } = useStaffAuthorizationContext();
  const canManage = hasPermission(staffUser, 'fleet.driver.manage');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(1);

  const [driverIdField, setDriverIdField] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [employment, setEmployment] = useState<FleetDriverEmployment>('permanent');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceGrade, setLicenceGrade] = useState('');
  const [licenceExpiry, setLicenceExpiry] = useState('');
  const [zoneId, setZoneId] = useState<CanonicalZoneId>(CANONICAL_ZONE_IDS[0]);
  const [stationedAt, setStationedAt] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  /*
   * Issuing a machine while registering the driver.
   *
   * The mirror of the same option on the vehicle form, and optional in exactly
   * the same way: most drivers are added to the directory before they are given
   * anything, and a form that insists otherwise would have people signing out a
   * machine nobody has actually collected.
   *
   * Only issuable machines are offered — anything in the garage, already out, or
   * retired is not a choice, because isIssuable would refuse it at the service
   * layer anyway and a picker that offers refusals is a picker that wastes time.
   */
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [issueNow, setIssueNow] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [meterOut, setMeterOut] = useState('');
  const [dueAt, setDueAt] = useState('');

  useEffect(() => {
    if (!isEdit || !routeDriverId) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await getDriverById(routeDriverId);
        if (cancelled) return;
        if (!d) {
          setError(`Driver ${routeDriverId} was not found.`);
          return;
        }
        setDriverIdField(d.driverId);
        setFullName(d.fullName);
        setPhone(d.phone ?? '');
        setEmployeeNumber(d.employeeNumber ?? '');
        setEmployment(d.employment);
        setLicenceNumber(d.licenceNumber ?? '');
        setLicenceGrade(d.licenceGrade ?? '');
        setLicenceExpiry(toDateInput(d.licenceExpiry));
        setZoneId(d.zoneId);
        setStationedAt(d.stationedAt ?? '');
        setPhotoUrl(d.photoUrl ?? '');
        setNotes(typeof d.notes === 'string' ? d.notes : d.notes?.en ?? '');
        setVersion(d.version);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load the driver.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, routeDriverId]);

  /** Machines that could actually be handed over. Only needed while adding. */
  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    (async () => {
      const rows = await listAssets().catch(() => [] as FleetAsset[]);
      if (!cancelled) setAssets(rows.filter(isIssuable));
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  /** This driver's zone first, the rest after — same reasoning as the issue form. */
  const assetOptions = useMemo(() => {
    const here = assets.filter((a) => a.zoneId === zoneId);
    return [...here, ...assets.filter((a) => a.zoneId !== zoneId)];
  }, [assets, zoneId]);

  const chosenAsset = useMemo(
    () => assets.find((a) => a.assetId === assetId) ?? null,
    [assets, assetId]
  );

  /**
   * The licence check, against the driver being typed.
   *
   * Runs on the form values rather than a saved record, so a lapsed licence
   * stops a pickup before the driver is even created — and the same licence on a
   * tractor only warns, exactly as it does everywhere else.
   */
  const eligibility = useMemo(
    () =>
      chosenAsset
        ? assessDriverForAsset(
            {
              fullName: fullName.trim() || 'This driver',
              status: 'active',
              licenceNumber: licenceNumber.trim() || undefined,
              licenceExpiry: fromDateInput(licenceExpiry),
            } as FleetDriver,
            chosenAsset
          )
        : null,
    [chosenAsset, fullName, licenceNumber, licenceExpiry]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser || saving) return;

    const input: DriverInput = {
      driverId: driverIdField.trim().toUpperCase(),
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      employeeNumber: employeeNumber.trim() || undefined,
      employment,
      licenceNumber: licenceNumber.trim() || undefined,
      licenceGrade: licenceGrade.trim() || undefined,
      licenceExpiry: fromDateInput(licenceExpiry),
      zoneId,
      stationedAt: stationedAt.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      notes: notes.trim() ? { en: notes.trim() } : undefined,
    };

    const wantsIssue = !isEdit && issueNow && Boolean(chosenAsset);

    if (wantsIssue && chosenAsset) {
      if (!purpose.trim()) {
        return setError('A purpose is required to sign the machine out — or untick the sign-out.');
      }
      const reading = Number(meterOut);
      if (chosenAsset.meterType !== 'none' && !Number.isFinite(reading)) {
        return setError('Enter the meter reading the machine is going out on.');
      }
      if (eligibility && !eligibility.allowed) {
        return setError(eligibility.reason ?? 'This driver may not take that machine.');
      }
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateDriver({ ...input, expectedVersion: version }, staffUser);
        navigate(`/admin/fleet/drivers/${input.driverId}`);
        return;
      }

      const created = await createDriver(input, staffUser);

      if (!wantsIssue || !chosenAsset) {
        navigate(`/admin/fleet/drivers/${created.driverId}`);
        return;
      }

      /*
       * The driver exists now, whatever happens next.
       *
       * A refused sign-out — somebody else took that machine between the form
       * loading and this submit — leaves a perfectly good driver record and no
       * assignment, which is a fine state. Saying so is better than a generic
       * failure that leaves the user wondering whether the driver saved.
       */
      try {
        await issueAsset(
          {
            assetId: chosenAsset.assetId,
            expectedVersion: chosenAsset.version,
            assignedToUid: `driver:${created.driverId}`,
            assignedToName: created.fullName,
            driverId: created.driverId,
            purpose: purpose.trim(),
            meterOut: chosenAsset.meterType === 'none' ? 0 : Number(meterOut),
            dueAt: dueAt ? new Date(`${dueAt}T00:00:00`) : null,
          },
          staffUser
        );
      } catch (issueErr) {
        setSaving(false);
        setError(
          `${created.fullName} was added to the directory, but ${chosenAsset.assetId} was not signed out: ${
            issueErr instanceof Error ? issueErr.message : 'the sign-out failed.'
          } The driver record is saved and the machine can be issued from its page.`
        );
        return;
      }

      navigate(`/admin/fleet/drivers/${created.driverId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the driver.');
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <FleetPanel title="Not available">
        <div className="p-8 text-xs text-slate-500 dark:text-slate-400">
          Adding and editing drivers needs the driver management permission.
        </div>
      </FleetPanel>
    );
  }

  if (loading) {
    return (
      <FleetPanel title="Loading driver…">
        <FleetLoading />
      </FleetPanel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FleetButton variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Back
        </FleetButton>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          {isEdit ? `Edit ${driverIdField}` : 'Add a driver'}
        </h2>
      </div>

      {error && (
        <FleetBanner tone="error" icon={AlertTriangle}><span>{error}</span></FleetBanner>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FleetPanel
          title="Who they are"
          description="A name and a zone are all that is required. A driver taken on for a week still belongs in the register."
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL}>Driver ID *</label>
              <input
                value={driverIdField}
                onChange={(e) => setDriverIdField(e.target.value)}
                disabled={isEdit}
                placeholder="DR-011"
                className={`${INPUT} font-mono disabled:opacity-60`}
                required
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {isEdit
                  ? 'Fixed once created — the sign-out book points at it.'
                  : 'Written on forms rather than painted on anything. Keep the sequence going.'}
              </p>
            </div>
            <div>
              <label className={LABEL}>Full name *</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Obbo Girmaa Bekele"
                className={INPUT}
                required
              />
            </div>
            <div>
              <label className={LABEL}>Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 911 000 000"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Employee number</label>
              <input
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="OAB-0000"
                className={INPUT}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Blank for contract and daily drivers, who have none.
              </p>
            </div>
            <div>
              <label className={LABEL}>Engagement</label>
              <select
                value={employment}
                onChange={(e) => setEmployment(e.target.value as FleetDriverEmployment)}
                className={INPUT}
              >
                {EMPLOYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {EMPLOYMENT_OPTIONS.find((o) => o.value === employment)?.hint}
              </p>
            </div>
            <div>
              <label className={LABEL}>Zone *</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value as CanonicalZoneId)}
                className={INPUT}
              >
                {CANONICAL_ZONE_IDS.map((z) => (
                  <option key={z} value={z}>
                    {CANONICAL_ZONE_METADATA[z].displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Stationed at</label>
              <input
                value={stationedAt}
                onChange={(e) => setStationedAt(e.target.value)}
                placeholder="Adama Depot"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Photograph URL</label>
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://…"
                className={INPUT}
              />
            </div>
          </div>
        </FleetPanel>

        <FleetPanel
          title="Licence"
          description="Both halves or neither. A number with no expiry cannot be checked, and an expiry with no number is not a document anyone can produce."
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={LABEL}>Licence number</label>
              <input
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value)}
                placeholder="ET-3-000000"
                className={`${INPUT} font-mono`}
              />
            </div>
            <div>
              <label className={LABEL}>Grade</label>
              <input
                value={licenceGrade}
                onChange={(e) => setLicenceGrade(e.target.value)}
                placeholder="3"
                className={INPUT}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                As printed on the licence.
              </p>
            </div>
            <div>
              <label className={LABEL}>Expires</label>
              <input
                type="date"
                value={licenceExpiry}
                onChange={(e) => setLicenceExpiry(e.target.value)}
                className={INPUT}
              />
            </div>
            <div className="md:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                A lapsed or unrecorded licence stops a road vehicle being issued outright.
                Tractors, harvesters and other field machinery are still issued, with a warning
                — a licence is a road document, and refusing to record real fieldwork would
                only send it back to paper.
              </span>
            </div>
          </div>
        </FleetPanel>

        {!isEdit && (
        <FleetPanel
          title="Give them a machine now"
          description="Optional. Most drivers join the directory before they are given anything — leave this alone and the record is simply created."
        >
          <div className="p-6 space-y-5">
            <label className="inline-flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={issueNow}
                onChange={(e) => {
                  setIssueNow(e.target.checked);
                  setError(null);
                }}
                className="accent-emerald-600 mt-0.5"
              />
              <span className="text-xs text-slate-700 dark:text-slate-200">
                <strong>Sign a machine out to them straight away.</strong>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  This records a real sign-out: the machine becomes <strong>In use</strong>, appears
                  in the sign-out book and on this driver's page, and stays out until someone
                  records a return.
                </span>
              </span>
            </label>

            {issueNow && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div>
                  <label className={LABEL}>Machine</label>
                  <select
                    value={assetId}
                    onChange={(e) => {
                      setAssetId(e.target.value);
                      const a = assets.find((x) => x.assetId === e.target.value);
                      setMeterOut(a && a.meterType !== 'none' ? String(a.currentMeter) : '');
                      setError(null);
                    }}
                    className={INPUT}
                  >
                    <option value="">Choose a machine…</option>
                    {assetOptions.map((a) => (
                      <option key={a.assetId} value={a.assetId}>
                        {a.assetId} — {a.make} {a.model}
                        {a.zoneId !== zoneId
                          ? ` (${CANONICAL_ZONE_METADATA[a.zoneId]?.displayName ?? a.zoneId})`
                          : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {assets.length === 0
                      ? 'Nothing is available to issue at the moment.'
                      : 'Only machines that can actually be handed over are listed.'}
                  </p>
                  {chosenAsset && (
                    <div className="mt-2">
                      <StatusPill status={chosenAsset.status} />
                    </div>
                  )}
                </div>

                <div className="flex items-end">
                  {!chosenAsset ? (
                    <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3 text-[11px] text-slate-500 dark:text-slate-400">
                      Choose a machine and the licence check runs against it — a road vehicle and a
                      tractor are not judged the same way.
                    </div>
                  ) : eligibility && !eligibility.allowed ? (
                    <div className="w-full rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{eligibility.reason}</span>
                    </div>
                  ) : eligibility?.warning ? (
                    <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{eligibility.warning}</span>
                    </div>
                  ) : (
                    <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Nothing on record stops this issue.</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className={LABEL}>Purpose *</label>
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Extension officer field visits, Lume woreda"
                    className={INPUT}
                  />
                </div>

                <div>
                  <label className={LABEL}>
                    Meter out{' '}
                    {chosenAsset && chosenAsset.meterType !== 'none'
                      ? `(${METER_UNIT_LABEL[chosenAsset.meterType]})`
                      : ''}
                  </label>
                  <input
                    type="number"
                    value={meterOut}
                    onChange={(e) => setMeterOut(e.target.value)}
                    disabled={!chosenAsset || chosenAsset.meterType === 'none'}
                    className={`${INPUT} disabled:opacity-50`}
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {!chosenAsset
                      ? 'Choose a machine first.'
                      : chosenAsset.meterType === 'none'
                      ? 'This machine has no meter.'
                      : `Currently ${formatMeter(chosenAsset.currentMeter, chosenAsset.meterType)}.`}
                  </p>
                </div>
                <div>
                  <label className={LABEL}>Due back</label>
                  <input
                    type="date"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>
            )}
          </div>
        </FleetPanel>
      )}

      <FleetPanel title="Notes">
          <div className="p-6">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything the next person issuing a machine should know."
              className={INPUT}
            />
          </div>
        </FleetPanel>

        <div className="flex justify-end gap-3">
          <FleetButton type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </FleetButton>
          <FleetButton
            type="submit"
            icon={!isEdit && issueNow ? LogOut : Save}
            disabled={saving}
          >
            {saving
              ? 'Saving…'
              : isEdit
              ? 'Save changes'
              : issueNow
              ? 'Add and sign out'
              : 'Add driver'}
          </FleetButton>
        </div>
      </form>
    </div>
  );
}

export default AdminFleetDriverFormPage;
