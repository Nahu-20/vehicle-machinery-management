import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  InvestmentDataset,
  InvestmentZoneProfile,
  InvestmentSource,
  InvestmentOpportunity,
} from '../../types/investment';

export interface DashboardSummaryCounts {
  zoneProfilesCount: number;
  datasetsCount: number;
  publishedDatasetsCount: number;
  pendingVerificationCount: number;
  sourcesCount: number;
  opportunitiesCount: number;
}

export async function getDashboardSummaryCounts(): Promise<DashboardSummaryCounts> {
  if (!db) {
    return {
      zoneProfilesCount: 0,
      datasetsCount: 0,
      publishedDatasetsCount: 0,
      pendingVerificationCount: 0,
      sourcesCount: 0,
      opportunitiesCount: 0,
    };
  }

  try {
    const [zoneSnap, dsSnap, sourceSnap, oppSnap] = await Promise.all([
      getDocs(collection(db, 'investmentZoneProfiles')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'investmentDatasets')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'investmentSources')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'investmentOpportunities')).catch(() => ({ docs: [] })),
    ]);

    const zoneDocs = zoneSnap.docs.map((d) => d.data() as InvestmentZoneProfile);
    const dsDocs = dsSnap.docs.map((d) => d.data() as InvestmentDataset);
    const sourceDocs = sourceSnap.docs.map((d) => d.data() as InvestmentSource);
    const oppDocs = oppSnap.docs.map((d) => d.data() as InvestmentOpportunity);

    const publishedDatasetsCount = dsDocs.filter((d) => d.lifecycleStatus === 'published').length;

    const pendingZone = zoneDocs.filter((d) => d.verificationStatus === 'pending' || d.verificationStatus === 'unverified').length;
    const pendingDs = dsDocs.filter((d) => d.verificationStatus === 'pending' || d.verificationStatus === 'unverified').length;
    const pendingSource = sourceDocs.filter((d) => d.verificationStatus === 'pending' || d.verificationStatus === 'unverified').length;
    const pendingOpp = oppDocs.filter((d) => d.verificationStatus === 'pending' || d.verificationStatus === 'unverified').length;

    const pendingVerificationCount = pendingZone + pendingDs + pendingSource + pendingOpp;

    return {
      zoneProfilesCount: zoneDocs.length,
      datasetsCount: dsDocs.length,
      publishedDatasetsCount,
      pendingVerificationCount,
      sourcesCount: sourceDocs.length,
      opportunitiesCount: oppDocs.length,
    };
  } catch (err) {
    console.warn('[InvestmentDashboardService] Error deriving summary counts:', err);
    return {
      zoneProfilesCount: 0,
      datasetsCount: 0,
      publishedDatasetsCount: 0,
      pendingVerificationCount: 0,
      sourcesCount: 0,
      opportunitiesCount: 0,
    };
  }
}
