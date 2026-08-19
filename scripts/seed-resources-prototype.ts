/**
 * CLI: seed published source-attributed Resources & Manuals for /resources.
 *
 * Usage:
 *   set SEED_ADMIN_EMAIL=admin@oromiaagri.gov.et
 *   set SEED_ADMIN_PASSWORD=...
 *   npm run seed:resources-prototype
 */
import dotenv from 'dotenv';
dotenv.config();

import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { StaffUser } from '../src/types/auth';
import { seedPrototypeResourcesData } from '../src/services/resourcePrototypeSeedService';
import { auth, db } from '../src/lib/firebase';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || process.argv[2];
  const password = process.env.SEED_ADMIN_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error(
      'Missing credentials. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, or pass: email password'
    );
    process.exit(1);
  }

  if (!auth || !db) {
    console.error('src/lib/firebase failed to initialize (check VITE_FIREBASE_* in .env)');
    process.exit(1);
  }

  console.log(`Signing in as ${email}…`);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  const staffSnap = await getDoc(doc(db, 'staffUsers', uid));
  if (!staffSnap.exists()) {
    console.error(`No staffUsers/${uid} profile — cannot seed under staff rules.`);
    process.exit(1);
  }
  const staff = { uid, ...(staffSnap.data() as Omit<StaffUser, 'uid'>) } as StaffUser;
  if (staff.active !== true) {
    console.error('Staff account is inactive');
    process.exit(1);
  }

  console.log(`Seeding Resources & Manuals as ${staff.email || email} (${staff.role})…`);
  const result = await seedPrototypeResourcesData(staff);
  console.log(JSON.stringify(result, null, 2));
  console.log('Done. Open /admin/resources and /resources.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
