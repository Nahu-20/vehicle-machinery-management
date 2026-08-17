import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { Save, ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  createAsset,
  getAssetById,
  updateAsset,
  type CreateAssetInput,
} from '../../../features/fleet/services/fleetService';
import type { FleetAsset, FleetAssetType, FleetMeterType } from '../../../features/fleet/types/fleet';
import {
  DEFAULT_METER_BY_TYPE,
  FLEET_ASSET_TYPES,
  METER_UNIT_LABEL,
  isRoadVehicle,
} from '../../../features/fleet/constants/fleetVocabulary';
import { FleetPanel, FleetButton } from '../../../features/fleet/components/FleetUI';
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

const INPUT =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500';
const LABEL =
  'block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

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

  /** Changing the type re-suggests the meter, but only while adding. */
  useEffect(() => {
    if (isEdit) return;
    setMeterType(DEFAULT_METER_BY_TYPE[assetType]);
  }, [assetType, isEdit]);

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

    setSaving(true);
    try {
      if (isEdit && routeAssetId) {
        await updateAsset(routeAssetId, payload, version, staffUser);
      } else {
        await createAsset(payload, staffUser);
      }
      navigate('/admin/fleet/register');
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
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
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
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
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
        <FleetButton type="submit" icon={Save} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add to register'}
        </FleetButton>
      </div>
    </form>
  );
}

export default AdminFleetAssetFormPage;
