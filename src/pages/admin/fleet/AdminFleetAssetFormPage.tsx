import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { Save, ArrowLeft, AlertTriangle, Info, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  createAsset,
  getAssetById,
  updateAsset,
  type CreateAssetInput,
} from '../../../features/fleet/services/fleetService';
import { issueAsset } from '../../../features/fleet/services/fleetAssignmentService';
import { listDrivers } from '../../../features/fleet/services/fleetDriverService';
import type {
  FleetAsset,
  FleetAssetType,
  FleetDriver,
  FleetMeterType,
} from '../../../features/fleet/types/fleet';
import {
  DEFAULT_METER_BY_TYPE,
  FLEET_ASSET_TYPES,
  METER_UNIT_LABEL,
  isRoadVehicle,
  assessDriverForAsset,
  licenceState,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  FleetPanel,
  FleetButton,
  LicencePill,
  INPUT,
  LABEL,
  FleetLoading,
  FleetBanner,
} from '../../../features/fleet/components/FleetUI';
import { AssetImage } from '../../../features/fleet/components/AssetImage';
import {
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
  type CanonicalZoneId,
} from '../../../features/investment-map/constants/canonicalZones';

const TYPE_LABELS: Record<FleetAssetType, string> = {
  tractor: 'Tractor',
  harvester: 'Harvester',
  implement: 'Implement / attachment',
  pickup: 'Pickup',
  truck: 'Truck',
  motorcycle: 'Motorcycle',
  bus: 'Bus',
  pump: 'Irrigation pump',
  generator: 'Generator',
  other: 'Other',
};


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
 * Add or edit an asset.
 *
 * The form adapts to the meter type rather than showing every field to
 * everyone: a plough has no odometer, insurance or plate, and presenting those
 * boxes invites someone to invent values for them.
 */
export function AdminFleetAssetFormPage() {
  const { assetId: routeAssetId } = useParams<{ assetId: string }>();
  const isEdit = Boolean(routeAssetId);
  const navigate = useNavigate();

  const { staffUser } = useStaffAuthorizationContext();
  const canManage = hasPermission(staffUser, 'fleet.asset.manage');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(1);

  const [assetIdField, setAssetIdField] = useState('');
  const [assetType, setAssetType] = useState<FleetAssetType>('tractor');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [meterType, setMeterType] = useState<FleetMeterType>('hours');
  const [currentMeter, setCurrentMeter] = useState('0');
  const [zoneId, setZoneId] = useState<CanonicalZoneId>(CANONICAL_ZONE_IDS[0]);
  const [stationedAt, setStationedAt] = useState('');
  const [serviceIntervalMeter, setServiceIntervalMeter] = useState('');
  const [lastServiceMeter, setLastServiceMeter] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insurer, setInsurer] = useState('');
  const [insuranceCost, setInsuranceCost] = useState('');
  const [inspectionExpiry, setInspectionExpiry] = useState('');
  const [inspectionCertificateNumber, setInspectionCertificateNumber] = useState('');
  const [libreNumber, setLibreNumber] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');

  /*
   * Issuing straight away, while adding.
   *
   * Optional throughout. Most machines are added to the register long before
   * anybody takes them out, and a form that insists on a holder would have
   * people inventing one.
   *
   * When it is used it goes through issueAsset like any other sign-out — a real
   * assignment row, a purpose, a meter reading. Setting a custodian without one
   * is precisely the inconsistency the first two rounds of this module existed
   * to remove.
   */
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [issueNow, setIssueNow] = useState(false);
  const [driverId, setDriverId] = useState('');
  const [holderName, setHolderName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dueAt, setDueAt] = useState('');

  /** Road vehicles carry documents; farm machinery does not. */
  const roadVehicle = useMemo(() => isRoadVehicle(assetType), [assetType]);

  useEffect(() => {
    if (!isEdit || !routeAssetId) return;
    let cancelled = false;
    (async () => {
      try {
        const asset = await getAssetById(routeAssetId);
        if (cancelled) return;
        if (!asset) {
          setError(`Asset ${routeAssetId} was not found.`);
          return;
        }
        setAssetIdField(asset.assetId);
        setAssetType(asset.assetType);
        setMake(asset.make ?? '');
        setModel(asset.model ?? '');
        setYear(asset.year ? String(asset.year) : '');
        setPlateNumber(asset.plateNumber ?? '');
        setChassisNumber(asset.chassisNumber ?? '');
        setMeterType(asset.meterType);
        setCurrentMeter(String(asset.currentMeter ?? 0));
        setZoneId(asset.zoneId);
        setStationedAt(asset.stationedAt ?? '');
        setServiceIntervalMeter(
          asset.serviceIntervalMeter ? String(asset.serviceIntervalMeter) : ''
        );
        setLastServiceMeter(asset.lastServiceMeter ? String(asset.lastServiceMeter) : '');
        setInsuranceExpiry(toDateInput(asset.insuranceExpiry));
        setInsurancePolicyNumber(asset.insurancePolicyNumber ?? '');
        setInsurer(asset.insurer ?? '');
        setInsuranceCost(asset.insuranceCost ? String(asset.insuranceCost) : '');
        setInspectionExpiry(toDateInput(asset.inspectionExpiry));
        setInspectionCertificateNumber(asset.inspectionCertificateNumber ?? '');
        setLibreNumber(asset.libreNumber ?? '');
        setImageUrl(asset.imageUrl ?? '');
        setNotes(typeof asset.notes === 'string' ? asset.notes : asset.notes?.en ?? '');
        setVersion(asset.version ?? 1);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the asset.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, routeAssetId]);

  /** The directory, for the optional sign-out below. Only needed while adding. */
  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    (async () => {
      // Non-critical: without it the sign-out falls back to a typed name, which
      // is what the issue form does anyway when somebody is not on the register.
      const rows = await listDrivers({ status: 'active' }).catch(() => [] as FleetDriver[]);
      if (!cancelled) setDrivers(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  /** Changing the type re-suggests the meter, but only while adding. */
  useEffect(() => {
    if (isEdit) return;
    setMeterType(DEFAULT_METER_BY_TYPE[assetType]);
  }, [assetType, isEdit]);

  /**
   * Drivers offered, this asset's zone first.
   *
   * The rest still follow rather than being hidden — a machine bought for one
   * zone is often driven away by somebody from another, and a picker that
   * silently omits the right person sends the clerk to the free-text box.
   */
  const driverOptions = useMemo(() => {
    const here = drivers.filter((d) => d.zoneId === zoneId);
    return [...here, ...drivers.filter((d) => d.zoneId !== zoneId)];
  }, [drivers, zoneId]);

  const chosenDriver = useMemo(
    () => drivers.find((d) => d.driverId === driverId) ?? null,
    [drivers, driverId]
  );

  /**
   * The licence check, run against the asset being typed rather than a saved one.
   *
   * assessDriverForAsset only needs the id and the type, both of which exist in
   * the form before anything is written — so a lapsed licence on a new pickup is
   * refused at the point of entry, not after the asset has been created.
   */
  const eligibility = useMemo(
    () =>
      chosenDriver
        ? assessDriverForAsset(chosenDriver, {
            assetId: assetIdField.trim().toUpperCase() || 'this vehicle',
            assetType,
          } as FleetAsset)
        : null,
    [chosenDriver, assetIdField, assetType]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser || saving) return;

    setError(null);

    if (!assetIdField.trim()) return setError('An asset identifier is required.');
    if (!make.trim() || !model.trim()) return setError('Make and model are required.');
    if (!stationedAt.trim()) return setError('Station or depot is required.');

    const meter = Number(currentMeter);
    if (Number.isNaN(meter) || meter < 0) return setError('Meter reading must be zero or more.');

    const payload: CreateAssetInput = {
      assetId: assetIdField.trim().toUpperCase(),
      assetType,
      make: make.trim(),
      model: model.trim(),
      year: year ? Number(year) : undefined,
      plateNumber: roadVehicle ? plateNumber.trim() || undefined : undefined,
      chassisNumber: chassisNumber.trim() || undefined,
      meterType,
      currentMeter: meter,
      zoneId,
      stationedAt: stationedAt.trim(),
      serviceIntervalMeter: serviceIntervalMeter ? Number(serviceIntervalMeter) : undefined,
      lastServiceMeter: lastServiceMeter ? Number(lastServiceMeter) : undefined,
      insuranceExpiry: roadVehicle ? fromDateInput(insuranceExpiry) : null,
      insurancePolicyNumber: roadVehicle ? insurancePolicyNumber.trim() || undefined : undefined,
      insurer: roadVehicle ? insurer.trim() || undefined : undefined,
      insuranceCost: roadVehicle && insuranceCost.trim() ? Number(insuranceCost) : undefined,
      inspectionExpiry: roadVehicle ? fromDateInput(inspectionExpiry) : null,
      inspectionCertificateNumber: roadVehicle
        ? inspectionCertificateNumber.trim() || undefined
        : undefined,
      libreNumber: roadVehicle ? libreNumber.trim() || undefined : undefined,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() ? { en: notes.trim() } : undefined,
    };

    const holder = chosenDriver ? chosenDriver.fullName : holderName.trim();
    const wantsIssue = !isEdit && issueNow && Boolean(holder);

    if (wantsIssue) {
      if (!purpose.trim()) {
        return setError('A purpose is required to sign the machine out — or untick the sign-out.');
      }
      // The same verdict issueAsset will reach, said before the round trip.
      if (eligibility && !eligibility.allowed) {
        return setError(eligibility.reason ?? 'That driver may not take this machine.');
      }
    }

    setSaving(true);
    try {
      if (isEdit && routeAssetId) {
        await updateAsset(routeAssetId, payload, version, staffUser);
        navigate('/admin/fleet/register');
        return;
      }

      const created = await createAsset(payload, staffUser);

      if (!wantsIssue) {
        navigate(`/admin/fleet/register/${created.assetId}`);
        return;
      }

      /*
       * Two writes, and the second can fail on its own.
       *
       * If the sign-out is refused — a licence that lapsed between loading the
       * form and submitting it, say — the vehicle has already been created and
       * that is fine: it is on the register, available, exactly as if the
       * sign-out had been left unticked. What is not fine is navigating away as
       * though everything worked, so the failure is reported against the asset
       * that now exists rather than as a generic save error.
       */
      try {
        await issueAsset(
          {
            assetId: created.assetId,
            expectedVersion: created.version,
            assignedToUid: chosenDriver
              ? `driver:${chosenDriver.driverId}`
              : `unlinked:${holder}`,
            assignedToName: holder,
            driverId: chosenDriver ? chosenDriver.driverId : null,
            purpose: purpose.trim(),
            meterOut: meter,
            dueAt: dueAt ? new Date(`${dueAt}T00:00:00`) : null,
          },
          staffUser
        );
      } catch (issueErr) {
        setSaving(false);
        setError(
          `${created.assetId} was added to the register, but not signed out: ${
            issueErr instanceof Error ? issueErr.message : 'the sign-out failed.'
          } It is available, and can be issued from its page.`
        );
        return;
      }

      navigate(`/admin/fleet/register/${created.assetId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the asset.');
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <FleetPanel title="Not permitted">
        <div className="p-8 text-xs text-slate-500 dark:text-slate-400">
          Adding or editing assets requires the <code>fleet.asset.manage</code> permission.
        </div>
      </FleetPanel>
    );
  }

  if (loading) {
    return (
      <FleetPanel title="Loading asset…">
        <FleetLoading />
      </FleetPanel>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <FleetButton
          type="button"
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate('/admin/fleet/register')}
        >
          Back to register
        </FleetButton>
      </div>

      {error && (
        <FleetBanner tone="error" icon={AlertTriangle}><span>{error}</span></FleetBanner>
      )}

      <FleetPanel
        title={isEdit ? `Edit ${assetIdField}` : 'Add an asset'}
        description="Identity and location. The asset identifier is what is painted on the machine and written on the paperwork."
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={LABEL}>Asset identifier *</label>
            <input
              value={assetIdField}
              onChange={(e) => setAssetIdField(e.target.value)}
              disabled={isEdit}
              placeholder="TR-014"
              className={`${INPUT} font-mono disabled:opacity-60`}
            />
            {isEdit && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                The identifier cannot be changed — audit records point at it.
              </p>
            )}
          </div>

          <div>
            <label className={LABEL}>Type *</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as FleetAssetType)}
              className={INPUT}
            >
              {FLEET_ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL}>Make *</label>
            <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="John Deere" className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Model *</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="5075E" className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2021"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Chassis number</label>
            <input
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
              className={`${INPUT} font-mono`}
            />
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
            <label className={LABEL}>Station or depot *</label>
            <input
              value={stationedAt}
              onChange={(e) => setStationedAt(e.target.value)}
              placeholder="Adama Zonal Office"
              className={INPUT}
            />
          </div>
        </div>
      </FleetPanel>

      <FleetPanel
        title="Usage and servicing"
        description="Tractors are serviced on engine hours and road vehicles on kilometres. Leave the interval blank if the asset is serviced on inspection instead."
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className={LABEL}>Meter type</label>
            <select
              value={meterType}
              onChange={(e) => setMeterType(e.target.value as FleetMeterType)}
              className={INPUT}
            >
              <option value="hours">Engine hours</option>
              <option value="kilometres">Kilometres</option>
              <option value="none">No meter</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              Suggested from the type; change it if this machine differs.
            </p>
          </div>

          <div>
            <label className={LABEL}>
              Current reading {meterType !== 'none' && `(${METER_UNIT_LABEL[meterType]})`}
            </label>
            <input
              type="number"
              value={currentMeter}
              onChange={(e) => setCurrentMeter(e.target.value)}
              disabled={meterType === 'none'}
              className={`${INPUT} font-mono disabled:opacity-50`}
            />
          </div>

          <div>
            <label className={LABEL}>Last serviced at</label>
            <input
              type="number"
              value={lastServiceMeter}
              onChange={(e) => setLastServiceMeter(e.target.value)}
              disabled={meterType === 'none'}
              placeholder="1100"
              className={`${INPUT} font-mono disabled:opacity-50`}
            />
          </div>

          <div>
            <label className={LABEL}>Service interval</label>
            <input
              type="number"
              value={serviceIntervalMeter}
              onChange={(e) => setServiceIntervalMeter(e.target.value)}
              disabled={meterType === 'none'}
              placeholder={meterType === 'hours' ? '250' : '5000'}
              className={`${INPUT} font-mono disabled:opacity-50`}
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Due when the reading exceeds the last service by this much.
            </p>
          </div>
        </div>
      </FleetPanel>

      {roadVehicle && (
        <FleetPanel
          title="Road documents"
          description="Shown for road vehicles only — tractors and machinery carry neither. Leaving a date blank does not mean the vehicle is covered; it is reported as not recorded."
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={LABEL}>Plate number</label>
              <input
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="3-A12345 OR"
                className={`${INPUT} font-mono`}
              />
            </div>
            <div>
              <label className={LABEL}>Libre number</label>
              <input
                value={libreNumber}
                onChange={(e) => setLibreNumber(e.target.value)}
                placeholder="LB-3-000000"
                className={`${INPUT} font-mono`}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                The ownership booklet. Never expires, so it raises no warnings.
              </p>
            </div>
            <div />

            <div>
              <label className={LABEL}>Insurance expires</label>
              <input
                type="date"
                value={insuranceExpiry}
                onChange={(e) => setInsuranceExpiry(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Policy number</label>
              <input
                value={insurancePolicyNumber}
                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                placeholder="EIC/MV/2026/00000"
                className={`${INPUT} font-mono`}
              />
            </div>
            <div>
              <label className={LABEL}>Insurer</label>
              <input
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                placeholder="Ethiopian Insurance Corporation"
                className={INPUT}
              />
            </div>

            <div>
              <label className={LABEL}>Road-worthiness expires</label>
              <input
                type="date"
                value={inspectionExpiry}
                onChange={(e) => setInspectionExpiry(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Certificate number</label>
              <input
                value={inspectionCertificateNumber}
                onChange={(e) => setInspectionCertificateNumber(e.target.value)}
                placeholder="RW-2026-00000"
                className={`${INPUT} font-mono`}
              />
            </div>
            <div>
              <label className={LABEL}>Annual premium</label>
              <input
                type="number"
                value={insuranceCost}
                onChange={(e) => setInsuranceCost(e.target.value)}
                placeholder="ETB"
                className={INPUT}
              />
            </div>
          </div>
        </FleetPanel>
      )}

      {!isEdit && (
        <FleetPanel
          title="Sign it out now"
          description="Optional. Most machines are added to the register before anyone takes them out — leave this alone and the vehicle is simply available."
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
                <strong>Issue this machine to somebody straight away.</strong>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  This records a real sign-out: the vehicle will show as{' '}
                  <strong>In use</strong> rather than available, appear in the sign-out book, and
                  stay out until someone records a return.
                </span>
              </span>
            </label>

            {issueNow && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div>
                  <label className={LABEL}>Driver</label>
                  <select
                    value={driverId}
                    onChange={(e) => {
                      setDriverId(e.target.value);
                      setError(null);
                    }}
                    className={INPUT}
                  >
                    <option value="">Someone not in the directory…</option>
                    {driverOptions.map((d) => (
                      <option key={d.driverId} value={d.driverId}>
                        {d.fullName} · {d.driverId}
                        {d.zoneId !== zoneId
                          ? ` (${CANONICAL_ZONE_METADATA[d.zoneId]?.displayName ?? d.zoneId})`
                          : ''}
                      </option>
                    ))}
                  </select>
                  {chosenDriver && (
                    <div className="mt-2">
                      <LicencePill state={licenceState(chosenDriver)} />
                    </div>
                  )}
                </div>

                {chosenDriver ? (
                  <div className="flex items-end">
                    {eligibility && !eligibility.allowed ? (
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
                ) : (
                  <div>
                    <label className={LABEL}>Issued to</label>
                    <input
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder="Obbo Girmaa Bekele"
                      className={INPUT}
                    />
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      A typed name records the sign-out but checks no licence.
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className={LABEL}>Purpose *</label>
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Ploughing at Boset cooperative"
                    className={INPUT}
                  />
                </div>

                <div>
                  <label className={LABEL}>
                    Meter out{' '}
                    {meterType !== 'none' ? `(${METER_UNIT_LABEL[meterType]})` : ''}
                  </label>
                  <input value={currentMeter} disabled className={`${INPUT} opacity-60`} />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Taken from the current reading above — it is the same moment.
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

      <FleetPanel
        title="Photograph"
        description="Optional. Paste a link to a photo of this machine; leave it blank and a placeholder is drawn from the asset type."
      >
        <div className="p-6 flex flex-col sm:flex-row items-start gap-6">
          <AssetImage
            assetType={assetType}
            imageUrl={imageUrl.trim() || undefined}
            alt="Preview"
            size="card"
          />
          <div className="flex-1 w-full">
            <label className={LABEL}>Image URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…/tractor-tr-014.jpg"
              className={INPUT}
            />
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              The preview updates as you type. A link that stops working falls back to the
              placeholder rather than showing a broken image.
            </p>
          </div>
        </div>
      </FleetPanel>

      <FleetPanel title="Notes">
        <div className="p-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything the next person to sign this out should know."
            className={`${INPUT} resize-none`}
          />
        </div>
      </FleetPanel>

      <div className="flex items-center justify-end gap-3">
        <FleetButton
          type="button"
          variant="secondary"
          onClick={() => navigate('/admin/fleet/register')}
        >
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
            : 'Add to register'}
        </FleetButton>
      </div>
    </form>
  );
}

export default AdminFleetAssetFormPage;
