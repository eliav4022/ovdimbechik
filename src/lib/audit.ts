import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export const logAuditAction = async (action: string, collectionName: string, documentId: string, details: string | any = '') => {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'audit_logs'), {
      isAudit: true,
      action,
      collection: collectionName,
      documentId,
      userId: user?.uid || 'system',
      userName: user?.displayName || user?.email || 'System',
      userRole: 'UNKNOWN',
      details: typeof details === 'string' ? details : JSON.stringify(details),
      timestamp: serverTimestamp(),
      type: action.includes('מחיק') || action.toLowerCase().includes('delete') ? 'delete' : action.includes('עריכ') || action.includes('עדכון') || action.includes('עודכן') ? 'edit' : 'add'
    });
  } catch (err) {
    console.error('Failed to log audit action', err);
  }
};
