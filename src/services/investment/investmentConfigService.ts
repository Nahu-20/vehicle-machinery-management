import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { InvestmentMapConfig } from '../../types/investment';
import { StaffUser } from '../../types/auth';

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
  const res = await fetch('/api/investment/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_map_config',
      actorUid: actor.uid,
      expectedVersion,
      payload,
    }),
  });

  const resData = await res.json();
  if (!res.ok || !resData.success) {
    throw new Error(resData.error || 'Failed to save map configuration');
  }

  return resData.data as InvestmentMapConfig;
}
