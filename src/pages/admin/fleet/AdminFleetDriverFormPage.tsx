import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { Save, ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  createDriver,
  getDriverById,
  updateDriver,
  type DriverInput,
} from '../../../features/fleet/services/fleetDriverService';
import type { FleetDriverEmployment } from '../../../features/fleet/types/fleet';
import {
  FleetPanel,
  FleetButton,
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

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateDriver({ ...input, expectedVersion: version }, staffUser);
        navigate(`/admin/fleet/drivers/${input.driverId}`);
      } else {
        const created = await createDriver(input, staffUser);
        navigate(`/admin/fleet/drivers/${created.driverId}`);
      }
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
          <FleetButton type="submit" icon={Save} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add driver'}
          </FleetButton>
        </div>
      </form>
    </div>
  );
}

export default AdminFleetDriverFormPage;
