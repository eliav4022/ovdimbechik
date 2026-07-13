import { setDoc as originalSetDoc, updateDoc as originalUpdateDoc, deleteDoc as originalDeleteDoc, addDoc as originalAddDoc, collection, serverTimestamp, doc } from 'firebase/firestore';
import { db, auth } from './firebase';

const logAction = async (action: string, ref: any, details?: any) => {
    try {
        const collectionName = ref.parent?.path || ref.path || 'unknown';
        const documentId = ref.id || 'unknown';
        if (collectionName.includes('audit_logs') || collectionName.includes('analytics_events')) return; // Prevent infinite loop & noise

        const user = auth.currentUser;
        
        await originalAddDoc(collection(db, 'audit_logs'), {
            action,
            collection: collectionName,
            documentId,
            userId: user?.uid || 'system',
            userName: user?.displayName || user?.email || 'System',
            details: typeof details === 'string' ? details : JSON.stringify(details || {}),
            timestamp: serverTimestamp(),
            type: action.toLowerCase().includes('delete') ? 'delete' : action.toLowerCase().includes('update') ? 'edit' : 'add'
        });
    } catch (e) {
        console.error("Failed to log audit", e);
    }
};

export const setDoc = async (ref: any, data: any, options?: any) => {
    await originalSetDoc(ref, data, options);
    logAction('Set', ref, { fields: Object.keys(data).length });
};

export const updateDoc = async (ref: any, data: any) => {
    await originalUpdateDoc(ref, data);
    logAction('Update', ref, { fields: Object.keys(data).length });
};

export const deleteDoc = async (ref: any) => {
    await originalDeleteDoc(ref);
    logAction('Delete', ref, {});
};

export const addDoc = async (ref: any, data: any) => {
    const newDoc = await originalAddDoc(ref, data);
    logAction('Add', newDoc, { fields: Object.keys(data).length });
    return newDoc;
};
