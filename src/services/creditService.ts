import { doc, setDoc, collection, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CreditTransaction } from '../types';

export const addCredits = async (employerId: string, amount: number, type: CreditTransaction['type'] = 'ADMIN_ADDITION', note?: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  
  const txRef = doc(collection(db, 'credit_transactions'));
  const tx: any = {
    id: txRef.id,
    employerId,
    amount,
    type,
    note: note || 'הוספת קרדיטים ע"י מנהל',
    createdAt: new Date().toISOString(),
  };

  // Add the transaction
  await setDoc(txRef, tx);

  // Increment the employer's credits
  const userRef = doc(db, 'users', employerId);
  await setDoc(userRef, {
    credits: increment(amount),
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

export const addCompanyCredits = async (companyId: string, amount: number, type: CreditTransaction['type'] = 'ADMIN_ADDITION', note?: string) => {
  if (!auth.currentUser) throw new Error('Not authenticated');

  const txRef = doc(collection(db, 'credit_transactions'));
  const tx: any = {
    id: txRef.id,
    companyId,
    amount,
    type,
    note: note || 'הוספת קרדיטים לחברה ע"י מנהל',
    createdAt: new Date().toISOString(),
  };

  await setDoc(txRef, tx);

  const compRef = doc(db, 'companies', companyId);
  await setDoc(compRef, {
    credits: increment(amount),
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

