import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { InvestmentMapConfig } from '../../types/investment';
import { StaffUser } from '../../types/auth';
import { callInvestmentCallable } from './investmentMutationClient';

export async function getMapConfig(): Promise<InvestmentMapConfig | null> {
  if (!db) return null;
  const ref = doc(db, 'investmentMapConfig', 'default');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as InvestmentMapConfig;
}

export async function saveMapConfig(
  actor: StaffUser,
  payload: Partial<InvestmentMapConfig>,
  expectedVersion?: number
): Promise<InvestmentMapConfig> {
  const res = await callInvestmentCallable<InvestmentMapConfig>(
    'save_map_config',
    payload,
    expectedVersion,
    actor
  );
  if (!res.data) {
    throw new Error(res.error || 'Failed to save map configuration');
  }
  return res.data;
}
