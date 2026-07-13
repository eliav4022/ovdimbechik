import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export const logAuditAction = async (action: string, collectionName: string, documentId: string, details: string = '') => {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'audit_logs'), {
      isAudit: true, // Flag to distinguish from normal analytics events
      action,
      collection: collectionName,
      documentId,
      userId: user?.uid || 'system',
      userName: user?.displayName || user?.email || 'System',
      userRole: 'UNKNOWN',
      details,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to log audit action', err);
  }
};
