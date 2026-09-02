import { collection, doc, getDoc, getDocs, query, where, writeBatch, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserRole, User, Company } from '../types';

export const DEFAULT_COMPANY_ID = 'comp_default';
export const DEFAULT_COMPANY_NAME = 'עובדים בצ\'יק כללי';

export const DEFAULT_EMPLOYER_ID = 'emp_default';
export const DEFAULT_EMPLOYER_NAME = 'מעסיק כללי';
export const DEFAULT_EMPLOYER_EMAIL = 'general-employer@system.local';

const KNOWN_DEFAULT_NAMES = [
  'חברה כללית',
  'עובדים בציק כללי',
  'עובדים בצ\'יק כללי',
  'עובדים בציק',
  'עובדים בצ\'יק',
  'חברה כללית - עובדים בצ\'יק'
];

/**
 * Ensures that the Default Company and Default Employer exist in Firestore,
 * and automatically consolidates/unifies duplicate default company records
 * (e.g., 'חברה כללית' and 'עובדים בציק כללי') into a single canonical default company.
 */
export async function ensureDefaultEntities(): Promise<{ defaultCompanyId: string; defaultEmployerId: string }> {
  try {
    const defaultCompanyId = DEFAULT_COMPANY_ID;
    const defaultEmployerId = DEFAULT_EMPLOYER_ID;

    // 1. Unify and ensure Canonical Default Company
    const compRef = doc(db, 'companies', DEFAULT_COMPANY_ID);
    const compSnap = await getDoc(compRef);

    // Fetch all companies to detect and merge any duplicate default entries
    const allCompaniesSnap = await getDocs(collection(db, 'companies'));
    const duplicateCompDocs = allCompaniesSnap.docs.filter(d => {
      const data = d.data();
      const name = (data.name || '').trim();
      const isKnownName = KNOWN_DEFAULT_NAMES.includes(name);
      const isMarkedDefault = data.isDefault === true;
      return (isKnownName || isMarkedDefault) && d.id !== DEFAULT_COMPANY_ID;
    });

    // Create or update canonical comp_default
    const existingCompData = compSnap.exists() ? compSnap.data() : null;
    await setDoc(compRef, {
      id: DEFAULT_COMPANY_ID,
      name: DEFAULT_COMPANY_NAME,
      industry: 'כללי',
      location: 'ישראל',
      description: 'חברה מרכזית המרכזת את כל המעסיקים במערכת שאינם שייכים לחברה ספציפית.',
      isDefault: true,
      isVerified: true,
      credits: existingCompData?.credits ?? 0,
      createdAt: existingCompData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // If duplicate default companies exist, migrate their employers & jobs, then clean them up
    for (const dupDoc of duplicateCompDocs) {
      try {
        const dupId = dupDoc.id;
        // Migrate employers
        const empQ = query(collection(db, 'users'), where('companyId', '==', dupId));
        const empSnap = await getDocs(empQ);
        for (const uDoc of empSnap.docs) {
          await updateDoc(uDoc.ref, {
            companyId: DEFAULT_COMPANY_ID,
            companyName: DEFAULT_COMPANY_NAME,
            updatedAt: new Date().toISOString()
          });
        }

        // Migrate jobs
        const jobsQ = query(collection(db, 'jobs'), where('companyId', '==', dupId));
        const jobsSnap = await getDocs(jobsQ);
        for (const jDoc of jobsSnap.docs) {
          await updateDoc(jDoc.ref, {
            companyId: DEFAULT_COMPANY_ID,
            companyName: DEFAULT_COMPANY_NAME
          });
        }

        // Remove duplicate company document
        await deleteDoc(dupDoc.ref);
      } catch (err) {
        console.error(`Error migrating duplicate company ${dupDoc.id}:`, err);
      }
    }

    // Also update any employers/jobs that had outdated default company names without valid IDs
    try {
      const outDatedUsersQ = query(collection(db, 'users'), where('companyName', 'in', ['חברה כללית', 'עובדים בציק כללי', 'עובדים בציק']));
      const outDatedUsersSnap = await getDocs(outDatedUsersQ);
      for (const uDoc of outDatedUsersSnap.docs) {
        await updateDoc(uDoc.ref, {
          companyId: DEFAULT_COMPANY_ID,
          companyName: DEFAULT_COMPANY_NAME,
          updatedAt: new Date().toISOString()
        });
      }
    } catch {
      // Ignored if query requires composite index
    }

    // 2. Check/Ensure Canonical Default Employer
    const empRef = doc(db, 'users', DEFAULT_EMPLOYER_ID);
    const empSnap = await getDoc(empRef);

    if (!empSnap.exists()) {
      await setDoc(empRef, {
        id: DEFAULT_EMPLOYER_ID,
        uid: DEFAULT_EMPLOYER_ID,
        displayName: DEFAULT_EMPLOYER_NAME,
        fullName: DEFAULT_EMPLOYER_NAME,
        email: DEFAULT_EMPLOYER_EMAIL,
        role: UserRole.EMPLOYER,
        companyId: DEFAULT_COMPANY_ID,
        companyName: DEFAULT_COMPANY_NAME,
        isDefault: true,
        isVerified: true,
        status: 'Active',
        credits: 99999,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
    } else {
      await updateDoc(empRef, {
        companyId: DEFAULT_COMPANY_ID,
        companyName: DEFAULT_COMPANY_NAME,
        isDefault: true
      });
    }

    return { defaultCompanyId, defaultEmployerId };
  } catch (error) {
    console.error('Error ensuring default entities:', error);
    return { defaultCompanyId: DEFAULT_COMPANY_ID, defaultEmployerId: DEFAULT_EMPLOYER_ID };
  }
}

/**
 * Assigns an employer to a company and synchronizes companyName across their profile and active jobs.
 */
export async function assignEmployerToCompany(employerId: string, companyId: string, companyName: string) {
  try {
    // If the employer is the default employer, force company to be default company
    if (employerId === DEFAULT_EMPLOYER_ID) {
      companyId = DEFAULT_COMPANY_ID;
      companyName = DEFAULT_COMPANY_NAME;
    }

    const batch = writeBatch(db);

    // 1. Update user document
    const userRef = doc(db, 'users', employerId);
    batch.update(userRef, {
      companyId: companyId,
      companyName: companyName,
      updatedAt: new Date().toISOString()
    });

    // 2. Update user's jobs with new companyId & companyName
    const jobsQ = query(collection(db, 'jobs'), where('ownerId', '==', employerId));
    const jobsSnap = await getDocs(jobsQ);
    jobsSnap.docs.forEach(jobDoc => {
      batch.update(jobDoc.ref, {
        companyId: companyId,
        companyName: companyName
      });
    });

    await batch.commit();
  } catch (error) {
    console.error(`Error assigning employer ${employerId} to company ${companyId}:`, error);
    throw error;
  }
}

/**
 * Unlinks an employer from a company and safely moves them to the Default Company.
 */
export async function unlinkEmployerFromCompany(employerId: string) {
  const { defaultCompanyId } = await ensureDefaultEntities();
  await assignEmployerToCompany(employerId, defaultCompanyId, DEFAULT_COMPANY_NAME);
}

/**
 * When a company name changes, syncs the new name to all associated employers and jobs.
 */
export async function syncCompanyNameChange(companyId: string, newCompanyName: string) {
  try {
    const batch = writeBatch(db);

    // Update employers
    const usersQ = query(collection(db, 'users'), where('companyId', '==', companyId));
    const usersSnap = await getDocs(usersQ);
    usersSnap.docs.forEach(uDoc => {
      batch.update(uDoc.ref, {
        companyName: newCompanyName,
        updatedAt: new Date().toISOString()
      });
    });

    // Update jobs
    const jobsQ = query(collection(db, 'jobs'), where('companyId', '==', companyId));
    const jobsSnap = await getDocs(jobsQ);
    jobsSnap.docs.forEach(jDoc => {
      batch.update(jDoc.ref, {
        companyName: newCompanyName
      });
    });

    await batch.commit();
  } catch (error) {
    console.error(`Error syncing company name change for ${companyId}:`, error);
    throw error;
  }
}
