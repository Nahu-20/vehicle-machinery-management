import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { mockNews } from '../data/mockData';
import { StaffUser } from '../types/auth';
import { sanitizeSlug, validateNewsArticle } from '../types/news';

const NEWS_COLLECTION = 'newsArticles';

export async function seedMockNewsToFirestore(
  staffUser: StaffUser,
  overwriteExisting: boolean = false
): Promise<{ seeded: number; skipped: number; errors: string[] }> {
  let seeded = 0;
  let skipped = 0;
  const errors: string[] = [];

  // 1. Ensure Firebase Auth session exists for Firestore security rules
  if (auth && !auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.warn('[newsSeedService] Anonymous sign-in failed during seeding:', err);
    }
  }

  const activeUid = auth?.currentUser?.uid || staffUser.uid;

  // 2. Ensure staffUsers document exists for current active UID
  if (db && activeUid) {
    try {
      const staffDocRef = doc(db, 'staffUsers', activeUid);
      const staffSnap = await getDoc(staffDocRef);
      if (!staffSnap.exists()) {
        await setDoc(staffDocRef, {
          uid: activeUid,
          email: staffUser.email || 'staff@oromiaagri.gov.et',
          displayName: staffUser.displayName || 'Staff Member',
          role: staffUser.role || 'superAdmin',
          active: true,
          preferredLanguage: staffUser.preferredLanguage || 'om',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn('[newsSeedService] Note setting staff profile document:', err);
    }
  }

  for (const item of mockNews) {
    const slug = sanitizeSlug(item.slug || item.id);
    if (!slug) {
      skipped++;
      continue;
    }

    try {
      const docRef = doc(db, NEWS_COLLECTION, slug);
      if (!overwriteExisting) {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          skipped++;
          continue;
        }
      }

      const validArticle = validateNewsArticle(item, slug);
      if (!validArticle) {
        skipped++;
        continue;
      }

      const docData = {
        slug,
        title: validArticle.title,
        excerpt: validArticle.excerpt,
        content: validArticle.content,
        category: validArticle.category,
        tags: validArticle.tags,
        featuredImage: validArticle.featuredImage || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80',
        imageAlt: validArticle.imageAlt.om ? validArticle.imageAlt : { om: validArticle.title.om, am: validArticle.title.am, en: validArticle.title.en },
        responsibleOffice: validArticle.responsibleOffice,
        authorName: validArticle.authorName || { om: 'Waajjira Qonnaa Oromiyaa', am: 'የኦሮሚያ ግብርና ቢሮ', en: 'Oromia Agricultural Bureau' },
        status: 'published',
        featured: Boolean(validArticle.featured),
        publishedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: activeUid,
        createdByEmail: staffUser.email,
        updatedAt: serverTimestamp(),
        updatedBy: activeUid,
        updatedByEmail: staffUser.email,
        publishedBy: activeUid,
        publishedByEmail: staffUser.email,
        version: 1,
      };

      await setDoc(docRef, docData);
      seeded++;
    } catch (err: any) {
      console.error(`Failed to seed news article "${slug}":`, err);
      errors.push(`${slug}: ${err?.message || String(err)}`);
    }
  }

  return { seeded, skipped, errors };
}
