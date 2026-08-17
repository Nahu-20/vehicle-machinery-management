import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  limit as fsLimit,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { logAuditEvent } from '../../../services/auditService';
import type { StaffUser } from '../../../types/auth';
import type { FleetAsset, FleetFuelLog } from '../types/fleet';
import { isDemoFleet, FleetNotFoundError, FleetVersionConflictError } from './fleetService';
import { FLEET_ASSETS_COLLECTION, FLEET_FUEL_LOGS_COLLECTION } from './fleetCollections';
import {
  demoGetAsset,
  demoListFuelLogs,
  demoRecordFuelFill,
  demoVoidFuelFill,
} from '../data/demoStore';

/**
 * Fuel slips, and what they do to the register.
 *
 * There is no telematics on this fleet and there is not going to be, so every
 * figure the fuel dashboard shows begins as a number somebody copied off a
 * printed slip at a pump. The service's job is to make sure that number is
 * plausible before it becomes a fact: a reading below the one already on record
 * is a mistyped slip, not a discovery, and letting it through would break the
 * arithmetic for every fill after it.
 */

export { FLEET_FUEL_LOGS_COLLECTION } from './fleetCollections';

/** Firestore rejects undefined; optional fields must be dropped, not passed through. */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not configured. Set the VITE_FIREBASE_* values to record fuel.');
  }
  return db;
}

/* ------------------------------------------------------------------ reads */

export async function listFuelLogs(assetId?: string): Promise<FleetFuelLog[]> {
  if (isDemoFleet()) {
    return demoListFuelLogs()
      .filter((l) => !assetId || l.assetId === assetId)
      .sort((a, b) => b.filledAt.toMillis() - a.filledAt.toMillis());
  }

  const database = requireDb();
  const constraints: QueryConstraint[] = [];
  if (assetId) constraints.push(where('assetId', '==', assetId));
  // Newest first for display. computeConsumption re-sorts ascending, because
  // the arithmetic runs between neighbours and needs the other order.
  constraints.push(orderBy('filledAt', 'desc'), fsLimit(500));

  const snap = await getDocs(query(collection(database, FLEET_FUEL_LOGS_COLLECTION), ...constraints));
  return snap.docs.map((d) => ({ ...(d.data() as FleetFuelLog), fuelLogId: d.id }));
}

/* ----------------------------------------------------------------- writes */

export interface RecordFuelFillInput {
  assetId: string;
  /** Checked against the asset so a stale tab cannot write against a changed row. */
  expectedVersion: number;
  filledAt: Date;
  litres: number;
  costPerLitre?: number;
  totalCost: number;
  /** The reading at the pump. Null only for a machine with no meter. */
  meterAtFill: number | null;
  fullTank: boolean;
  station?: string;
  reference?: string;
  driverId?: string | null;
  driverName?: string;
}

/**
 * Guards shared by both paths, so the demo refuses exactly what the register does.
 *
 * The meter check is the one that matters. Everything the dashboard reports is
 * the difference between two readings, so a single reading that is wrong in the
 * wrong direction does not produce one bad row — it produces one bad row and
 * then a second bad row when the next honest fill is measured against it.
 */
function validateFill(input: RecordFuelFillInput, asset: FleetAsset): void {
  if (!(input.litres > 0)) throw new Error('Litres must be more than zero.');
  if (input.totalCost < 0) throw new Error('Cost cannot be negative.');

  if (asset.meterType === 'none') {
    // Nothing to compare against; the fill is still worth recording for cost.
    return;
  }
  if (input.meterAtFill == null) {
    throw new Error(
      `${asset.assetId} has a meter, so the reading at the pump is needed — it is what every later figure rests on.`
    );
  }
  if (input.meterAtFill < asset.currentMeter) {
    throw new Error(
      `Reading ${input.meterAtFill.toLocaleString()} is below the recorded ${asset.currentMeter.toLocaleString()}. Check the slip.`
    );
  }
}

/**
 * Record a fill.
 *
 * Advances the asset's meter when the pump reading is higher, and never
 * backwards. A fill-up is the most frequent moment anyone reliably reads a dial,
 * so ignoring it would leave currentMeter stale and isServiceDue wrong.
 * lastServiceMeter is untouched — filling a tank is not servicing it.
 */
export async function recordFuelFill(
  input: RecordFuelFillInput,
  actor: StaffUser
): Promise<string> {
  if (isDemoFleet()) {
    const asset = demoGetAsset(input.assetId);
    if (!asset) throw new FleetNotFoundError(input.assetId);
    validateFill(input, asset);

    return demoRecordFuelFill({
      assetId: asset.assetId,
      zoneId: asset.zoneId,
      driverId: input.driverId ?? null,
      driverName: input.driverName,
      filledAt: Timestamp.fromDate(input.filledAt),
      litres: input.litres,
      costPerLitre: input.costPerLitre,
      totalCost: input.totalCost,
      meterAtFill: asset.meterType === 'none' ? null : input.meterAtFill,
      fullTank: input.fullTank,
      station: input.station,
      reference: input.reference,
      recordedByUid: actor.uid,
      recordedByName: actor.displayName,
    } as Omit<FleetFuelLog, 'fuelLogId'>);
  }

  const database = requireDb();
  const assetRef = doc(database, FLEET_ASSETS_COLLECTION, input.assetId);
  const logRef = doc(collection(database, FLEET_FUEL_LOGS_COLLECTION));

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(assetRef);
    if (!snap.exists()) throw new FleetNotFoundError(input.assetId);

    const asset = snap.data() as FleetAsset;
    if (asset.version !== input.expectedVersion) {
      throw new FleetVersionConflictError(input.expectedVersion, asset.version);
    }
    validateFill(input, asset);

    tx.set(
      logRef,
      stripUndefined({
        fuelLogId: logRef.id,
        assetId: asset.assetId,
        zoneId: asset.zoneId,
        driverId: input.driverId ?? null,
        driverName: input.driverName,
        filledAt: Timestamp.fromDate(input.filledAt),
        litres: input.litres,
        costPerLitre: input.costPerLitre,
        totalCost: input.totalCost,
        meterAtFill: asset.meterType === 'none' ? null : input.meterAtFill,
        fullTank: input.fullTank,
        station: input.station,
        reference: input.reference,
        recordedByUid: actor.uid,
        recordedByName: actor.displayName,
        createdAt: serverTimestamp(),
        voidedAt: null,
      })
    );

    // Forward only. Validation already refuses a reading below the current one,
    // so this is belt and braces on the one field the whole module reads from.
    if (
      asset.meterType !== 'none' &&
      input.meterAtFill != null &&
      input.meterAtFill > asset.currentMeter
    ) {
      tx.update(assetRef, {
        currentMeter: input.meterAtFill,
        version: asset.version + 1,
        updatedAt: serverTimestamp(),
        updatedByUid: actor.uid,
      });
    }
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'fuel_recorded',
    targetType: 'fleetAsset',
    targetId: input.assetId,
    targetLabel: `${input.assetId} — ${input.litres} L, ${input.totalCost.toLocaleString()} ETB`,
  } as any);

  return logRef.id;
}

/**
 * Void a slip.
 *
 * The wrong vehicle and transposed litres are the two mistakes that actually
 * happen at a counter, and both need undoing. Deleting would leave the register
 * with a gap it cannot explain and a meter reading nobody can account for, so
 * the row stays, struck through and out of every figure.
 *
 * The asset's meter is deliberately not wound back. It may have moved on since,
 * and lowering it would put the register below a number somebody has already
 * worked from — including, possibly, the next fill.
 */
export async function voidFuelFill(
  fuelLogId: string,
  reason: string,
  actor: StaffUser
): Promise<void> {
  const why = reason.trim();
  if (!why) throw new Error('Say why this slip is being voided — the record keeps the reason.');

  if (isDemoFleet()) {
    demoVoidFuelFill(fuelLogId, actor.uid, why);
    return;
  }

  const database = requireDb();
  // Only these three fields, matching what firestore.rules will accept on an
  // existing slip. Anything else here would be rejected at the server.
  await updateDoc(doc(database, FLEET_FUEL_LOGS_COLLECTION, fuelLogId), {
    voidedAt: serverTimestamp(),
    voidedByUid: actor.uid,
    voidReason: why,
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'fuel_voided',
    targetType: 'fleetFuelLog',
    targetId: fuelLogId,
    targetLabel: `${fuelLogId} — ${why}`,
  } as any);
}
