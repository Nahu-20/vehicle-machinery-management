import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { StaffUser } from '../../types/auth';
import { CANONICAL_ZONE_IDS } from '../../features/investment-map/constants/canonicalZones';
import {
  assertPrototypeCoversAllZones,
  PROTOTYPE_DATASETS,
  PROTOTYPE_METHODOLOGY,
  PROTOTYPE_METHODOLOGY_ID,
  PROTOTYPE_REFERENCE_PERIOD,
  PROTOTYPE_SEED_VERSION,
  PROTOTYPE_SOURCES,
  PROTOTYPE_SOURCE_IDS,
  PROTOTYPE_ZONE_STATS,
  PrototypeCommodity,
  PrototypeMetric,
} from '../../data/investmentPrototypeSeedData';

const BATCH_LIMIT = 400;

export interface PrototypeSeedResult {
  success: boolean;
  seedVersion: string;
  sourcesWritten: number;
  methodologiesWritten: number;
  datasetsWritten: number;
  valuesWritten: number;
  datasetIds: string[];
  message: string;
}

async function commitInChunks(
  ops: Array<(batch: ReturnType<typeof writeBatch>) => void>
): Promise<number> {
  if (!db) throw new Error('Firestore is not initialized');
  let written = 0;
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const slice = ops.slice(i, i + BATCH_LIMIT);
    for (const apply of slice) apply(batch);
    await batch.commit();
    written += slice.length;
  }
  return written;
}

function buildValueRows(
  commodity: PrototypeCommodity,
  metric: PrototypeMetric,
  actorUid: string,
  nowIso: string
) {
  return CANONICAL_ZONE_IDS.map((zoneId) => {
    const row = PROTOTYPE_ZONE_STATS[zoneId][commodity];
    if (metric === 'production') {
      return {
        zoneId,
        value: row.volumeMT,
        productionVolume: row.volumeMT,
        productionUnit: 'tonne',
        harvestedAreaHa: row.harvestedAreaHa,
        yieldValue: row.yieldPerHa,
        yieldUnit: 'tonne/ha',
        trendPercent: row.trendPercent,
        notes: `Prototype estimate (${PROTOTYPE_SEED_VERSION}) attributed to CSA AGSS patterns + OBoA zone estimates.`,
        qualityFlag: 'estimated' as const,
        version: 1,
        updatedAt: nowIso,
        updatedBy: actorUid,
      };
    }
    const score = metric === 'suitability' ? row.suitability : row.investmentPotential;
    return {
      zoneId,
      value: score,
      notes: `Prototype ${metric} score (${PROTOTYPE_SEED_VERSION}) via ${PROTOTYPE_METHODOLOGY_ID}.`,
      qualityFlag: 'estimated' as const,
      version: 1,
      updatedAt: nowIso,
      updatedBy: actorUid,
    };
  });
}

/**
 * Writes published+verified Investment CMS docs for coffee/wheat/maize
 * production, suitability, and investment_potential — all 22 zones.
 * Requires an active editor/contentAdmin/superAdmin Firebase session.
 */
export async function seedPrototypeInvestmentMapData(
  actor: StaffUser
): Promise<PrototypeSeedResult> {
  if (!db) {
    throw new Error('Firestore client is not initialized');
  }
  if (!auth?.currentUser) {
    throw new Error('Sign in as staff before seeding prototype Investment data');
  }
  if (!actor?.uid || actor.active !== true) {
    throw new Error('Active staff profile required');
  }

  assertPrototypeCoversAllZones();

  const nowIso = new Date().toISOString();
  const actorUid = actor.uid;
  const sourceIds = Object.values(PROTOTYPE_SOURCE_IDS);

  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const source of PROTOTYPE_SOURCES) {
    ops.push((batch) => {
      batch.set(doc(db!, 'investmentSources', source.sourceId), {
        ...source,
        verificationStatus: 'verified',
        status: 'published',
        version: 1,
        createdAt: nowIso,
        createdBy: actorUid,
        updatedAt: nowIso,
        updatedBy: actorUid,
      });
    });
  }

  ops.push((batch) => {
    batch.set(doc(db!, 'investmentMethodologies', PROTOTYPE_METHODOLOGY_ID), {
      ...PROTOTYPE_METHODOLOGY,
      verificationStatus: 'verified',
      status: 'published',
      version: 1,
      createdAt: nowIso,
      createdBy: actorUid,
      updatedAt: nowIso,
      updatedBy: actorUid,
    });
  });

  for (const ds of PROTOTYPE_DATASETS) {
    const needsMethodology = ds.metric !== 'production';
    ops.push((batch) => {
      batch.set(doc(db!, 'investmentDatasets', ds.datasetId), {
        datasetId: ds.datasetId,
        title: ds.title,
        category: ds.category,
        commodity: ds.commodity,
        metric: ds.metric,
        unit: ds.unit,
        referencePeriod: PROTOTYPE_REFERENCE_PERIOD,
        referenceYear: PROTOTYPE_REFERENCE_PERIOD.startYear,
        sourceIds,
        methodologyId: needsMethodology ? PROTOTYPE_METHODOLOGY_ID : undefined,
        description: ds.description,
        notes: `Seeded for public /investment map choropleths. Seed ${PROTOTYPE_SEED_VERSION}.`,
        verificationStatus: 'verified',
        lifecycleStatus: 'published',
        isCurrent: true,
        version: 1,
        createdAt: nowIso,
        createdBy: actorUid,
        updatedAt: nowIso,
        updatedBy: actorUid,
        publishedAt: nowIso,
        publishedBy: actorUid,
      });
    });

    const values = buildValueRows(ds.commodity, ds.metric, actorUid, nowIso);
    for (const val of values) {
      ops.push((batch) => {
        batch.set(doc(db!, 'investmentDatasets', ds.datasetId, 'values', val.zoneId), val);
      });
    }
  }

  const totalOps = await commitInChunks(ops);
  const valuesWritten = PROTOTYPE_DATASETS.length * CANONICAL_ZONE_IDS.length;

  return {
    success: true,
    seedVersion: PROTOTYPE_SEED_VERSION,
    sourcesWritten: PROTOTYPE_SOURCES.length,
    methodologiesWritten: 1,
    datasetsWritten: PROTOTYPE_DATASETS.length,
    valuesWritten,
    datasetIds: PROTOTYPE_DATASETS.map((d) => d.datasetId),
    message: `Wrote ${totalOps} Firestore ops: ${PROTOTYPE_DATASETS.length} published datasets × ${CANONICAL_ZONE_IDS.length} zones.`,
  };
}

export interface PrototypeInfraSeedResult {
  success: boolean;
  seedVersion: string;
  sourcesWritten: number;
  facilitiesWritten: number;
  zonesCovered: number;
  message: string;
}

/**
 * Writes published+verified investmentInfrastructure facilities for all 22 zones
 * (~3 per zone) with approximate coordinates and OBoA-attributed sources.
 */
export async function seedPrototypeInfrastructureData(
  actor: StaffUser
): Promise<PrototypeInfraSeedResult> {
  if (!db) {
    throw new Error('Firestore client is not initialized');
  }
  if (!auth?.currentUser) {
    throw new Error('Sign in as staff before seeding prototype infrastructure');
  }
  if (!actor?.uid || actor.active !== true) {
    throw new Error('Active staff profile required');
  }

  const {
    buildPrototypeFacilitySpecs,
    PROTOTYPE_INFRA_SOURCES,
    PROTOTYPE_INFRA_SOURCE_IDS,
    PROTOTYPE_INFRA_SEED_VERSION,
    resolveFacilityCoordinates,
  } = await import('../../data/investmentPrototypeInfraSeedData');
  const { clearFacilityCache } = await import('./publicInfrastructureService');

  const nowIso = new Date().toISOString();
  const actorUid = actor.uid;
  const specs = buildPrototypeFacilitySpecs();
  const sourceIds = [
    PROTOTYPE_INFRA_SOURCE_IDS.oboaInventory,
    PROTOTYPE_INFRA_SOURCE_IDS.corridorNotes,
    PROTOTYPE_INFRA_SOURCE_IDS.compilation,
  ];

  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const source of PROTOTYPE_INFRA_SOURCES) {
    ops.push((batch) => {
      batch.set(doc(db!, 'investmentSources', source.sourceId), {
        ...source,
        verificationStatus: 'verified',
        status: 'published',
        version: 1,
        createdAt: nowIso,
        createdBy: actorUid,
        updatedAt: nowIso,
        updatedBy: actorUid,
      });
    });
  }

  // Ensure thematic compilation source exists for shared attribution.
  ops.push((batch) => {
    batch.set(
      doc(db!, 'investmentSources', PROTOTYPE_SOURCE_IDS.compilation),
      {
        sourceId: PROTOTYPE_SOURCE_IDS.compilation,
        title: 'OAB Investment CMS prototype compilation (source-attributed zone layer)',
        organization: 'Oromia Agriculture Bureau — Investment & Market Systems',
        documentTitle: `Investment thematic + infrastructure prototype seed ${PROTOTYPE_SEED_VERSION}`,
        publicationDate: '2025-08-18',
        referencePeriod: 'Meher 2024/2025',
        methodologyNotes:
          'Shared provenance record for prototype thematic datasets and infrastructure facilities.',
        license:
          'Prototype for bureau portal demonstration; replace with verified official releases before formal publication claims.',
        verificationStatus: 'verified',
        status: 'published',
        version: 1,
        createdAt: nowIso,
        createdBy: actorUid,
        updatedAt: nowIso,
        updatedBy: actorUid,
      },
      { merge: true }
    );
  });

  for (const spec of specs) {
    const coords = resolveFacilityCoordinates(spec);
    const capacities = [];
    if (typeof spec.capacityMt === 'number') {
      capacities.push({
        metricKey: 'storage_capacity',
        label: { en: 'Storage / throughput capacity' },
        numericValue: spec.capacityMt,
        unit: 'MT' as const,
        referencePeriod: '2024/2025',
      });
    }
    if (typeof spec.capacityHa === 'number') {
      capacities.push({
        metricKey: 'irrigated_area',
        label: { en: 'Irrigated command area' },
        numericValue: spec.capacityHa,
        unit: 'hectares' as const,
        referencePeriod: '2024/2025',
      });
    }

    ops.push((batch) => {
      batch.set(doc(db!, 'investmentInfrastructure', spec.facilityId), {
        facilityId: spec.facilityId,
        zoneId: spec.zoneId,
        category: spec.category,
        title: { en: spec.titleEn },
        description: { en: spec.descriptionEn },
        locationDescription: {
          en: `Approximate location near ${coords.place}, ${spec.zoneId.replace(/_/g, ' ')} (prototype map pin).`,
        },
        coordinates: { lat: coords.lat, lng: coords.lng },
        locationPrecision: 'approximate',
        operationalStatus: 'operational',
        ownership: spec.ownership,
        operatorName: spec.operatorName,
        capacities,
        commodityKeys: spec.commodityKeys || [],
        commissioningYear: spec.commissioningYear ?? null,
        assessmentDate: '2025-06-01',
        referencePeriod: '2024/2025',
        sourceIds,
        lifecycleStatus: 'published',
        verificationStatus: 'verified',
        internalNotes: `Seeded ${PROTOTYPE_INFRA_SEED_VERSION}. Approximate coordinates for demonstration only.`,
        version: 1,
        createdAt: nowIso,
        createdBy: actorUid,
        updatedAt: nowIso,
        updatedBy: actorUid,
        verifiedAt: nowIso,
        verifiedBy: actorUid,
        publishedAt: nowIso,
        publishedBy: actorUid,
      });
    });
  }

  const totalOps = await commitInChunks(ops);
  clearFacilityCache();

  const zonesCovered = new Set(specs.map((s) => s.zoneId)).size;

  return {
    success: true,
    seedVersion: PROTOTYPE_INFRA_SEED_VERSION,
    sourcesWritten: PROTOTYPE_INFRA_SOURCES.length + 1,
    facilitiesWritten: specs.length,
    zonesCovered,
    message: `Wrote ${totalOps} ops: ${specs.length} published facilities across ${zonesCovered} zones.`,
  };
}

export interface PrototypeOpportunitySeedResult {
  success: boolean;
  seedVersion: string;
  opportunitiesWritten: number;
  message: string;
}

/** Writes published+verified investment opportunity profiles for the public Opportunities tab. */
export async function seedPrototypeOpportunitiesData(
  actor: StaffUser
): Promise<PrototypeOpportunitySeedResult> {
  if (!db) {
    throw new Error('Firestore client is not initialized');
  }
  if (!auth?.currentUser) {
    throw new Error('Sign in as staff before seeding prototype opportunities');
  }
  if (!actor?.uid || actor.active !== true) {
    throw new Error('Active staff profile required');
  }

  const {
    PROTOTYPE_OPPORTUNITIES,
    PROTOTYPE_OPP_SEED_VERSION,
    PROTOTYPE_OPP_SOURCES,
    prototypeOpportunitySourceIds,
  } = await import('../../data/investmentPrototypeOpportunitySeedData');
  const { PROTOTYPE_SOURCES, PROTOTYPE_SOURCE_IDS } = await import(
    '../../data/investmentPrototypeSeedData'
  );
  const { PROTOTYPE_INFRA_SOURCES, PROTOTYPE_INFRA_SOURCE_IDS } = await import(
    '../../data/investmentPrototypeInfraSeedData'
  );

  const nowIso = new Date().toISOString();
  const actorUid = actor.uid;
  const sourceIds = prototypeOpportunitySourceIds();
  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const source of [
    ...PROTOTYPE_OPP_SOURCES,
    ...PROTOTYPE_SOURCES,
    ...PROTOTYPE_INFRA_SOURCES,
  ]) {
    if (!sourceIds.includes(source.sourceId)) continue;
    ops.push((batch) => {
      batch.set(
        doc(db!, 'investmentSources', source.sourceId),
        {
          ...source,
          verificationStatus: 'verified',
          status: 'published',
          version: 1,
          createdAt: nowIso,
          createdBy: actorUid,
          updatedAt: nowIso,
          updatedBy: actorUid,
        },
        { merge: true }
      );
    });
  }

  for (const spec of PROTOTYPE_OPPORTUNITIES) {
    ops.push((batch) => {
      batch.set(doc(db!, 'investmentOpportunities', spec.opportunityId), {
        ...spec,
        sourceIds,
        contactIds: [],
        verificationStatus: 'verified',
        lifecycleStatus: 'published',
        version: 1,
        createdAt: nowIso,
        createdBy: actorUid,
        updatedAt: nowIso,
        updatedBy: actorUid,
        publishedAt: nowIso,
        publishedBy: actorUid,
      });
    });
  }

  const totalOps = await commitInChunks(ops);

  return {
    success: true,
    seedVersion: PROTOTYPE_OPP_SEED_VERSION,
    opportunitiesWritten: PROTOTYPE_OPPORTUNITIES.length,
    message: `Wrote ${PROTOTYPE_OPPORTUNITIES.length} published opportunities (${totalOps} Firestore ops) with OBoA/CSA source attribution.`,
  };
}

/** Quick check: how many published prototype production datasets are visible. */
export async function countPublishedPrototypeDatasets(): Promise<number> {
  if (!db) return 0;
  const q = query(
    collection(db, 'investmentDatasets'),
    where('lifecycleStatus', '==', 'published'),
    where('verificationStatus', '==', 'verified')
  );
  const snap = await getDocs(q);
  return snap.docs.filter((d) => String(d.id).startsWith('ds_proto_')).length;
}
