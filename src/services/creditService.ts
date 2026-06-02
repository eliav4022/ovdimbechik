import { doc, setDoc, collection, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CreditTransaction } from '../types';

export const addCredits = async (employerId: string, amount: number, type: CreditTransaction['type'] = 'ADMIN_ADDITION') => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  
  // Here we would also typically check auth.currentUser.role === 'ADMIN' locally before sending,
  // but Firestore rules will enforce it.
  
  const txRef = doc(collection(db, 'credit_transactions'));
  const tx: CreditTransaction = {
    id: txRef.id,
    employerId,
    amount,
    type,
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
