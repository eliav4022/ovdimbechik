import { setDoc as originalSetDoc, updateDoc as originalUpdateDoc, deleteDoc as originalDeleteDoc, addDoc as originalAddDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

const getEntityName = (col: string) => {
    switch(col) {
        case 'jobs': return 'משרה';
        case 'users': return 'משתמש';
        case 'companies': return 'חברה';
        case 'settings': return 'הגדרת מערכת';
        case 'inquiries': return 'פנייה';
        case 'reports': return 'דיווח';
        case 'employers': return 'מעסיק';
        case 'files': return 'קובץ';
        default: return col;
    }
}

const getActionName = (action: string, col: string) => {
    if (col === 'users') {
        if (action === 'Add') return 'נרשם משתמש חדש';
        if (action === 'Update' || action === 'Set') return 'עודכנו נתוני משתמש';
        if (action === 'Delete') return 'נמחק חשבון';
    }
    if (col === 'jobs') {
        if (action === 'Add') return 'נוצרה משרה';
        if (action === 'Update' || action === 'Set') return 'עודכנה משרה';
        if (action === 'Delete') return 'נמחקה משרה';
    }
    if (col === 'settings') {
        if (action === 'Update' || action === 'Set') return 'הגדרת מערכת שונתה';
    }
    
    const entity = getEntityName(col);
    if (action === 'Add') return `נוצר(ה) ${entity}`;
    if (action === 'Update' || action === 'Set') return `עודכן(ה) ${entity}`;
    if (action === 'Delete') return `נמחק(ה) ${entity}`;
    return action;
}

const logAction = async (action: string, ref: any, details?: any, prevData?: any) => {
    try {
        const collectionName = ref.parent?.path || ref.path || 'unknown';
        const documentId = ref.id || 'unknown';
        
        if (collectionName.includes('audit_logs') || collectionName.includes('analytics_events')) return;
        
        const user = auth.currentUser;
        
        let detailsString = typeof details === 'string' ? details : '';
        if (!detailsString) {
           if (details?.data) {
               if (collectionName === 'jobs') {
                   detailsString += `שם משרה: ${details.data.title || prevData?.title || ''}\n`;
                   detailsString += `מעסיק: ${details.data.companyName || prevData?.companyName || ''}\n`;
                   detailsString += `סטטוס: ${details.data.status || prevData?.status || ''}\n`;
               } else if (collectionName === 'users') {
                   if (details.data.fullName || details.data.name) detailsString += `שם: ${details.data.fullName || details.data.name}\n`;
                   if (details.data.email) detailsString += `אימייל: ${details.data.email}\n`;
                   if (details.data.role) detailsString += `תפקיד: ${details.data.role}\n`;
               } else if (collectionName === 'settings' && prevData) {
                   // Compare settings
                   for (const key in details.data) {
                       if (details.data[key] !== prevData[key] && key !== 'updatedAt') {
                           detailsString += `הגדרה '${key}' שונתה מ-'${prevData[key]}' ל-'${details.data[key]}'\n`;
                       }
                   }
               } else {
                   if (details.data.title) detailsString += `שם: ${details.data.title}\n`;
                   if (details.data.name) detailsString += `שם: ${details.data.name}\n`;
                   if (details.data.status && prevData?.status !== details.data.status) {
                       detailsString += `סטטוס: ${details.data.status}\n`;
                   }
               }
           }
        }
        if (!detailsString) {
           detailsString = JSON.stringify(details || {});
        }
                
        await originalAddDoc(collection(db, 'audit_logs'), {
            action: getActionName(action, collectionName),
            collection: collectionName,
            documentId,
            userId: user?.uid || 'system',
            userName: user?.displayName || user?.email || 'System',
            details: detailsString,
            prevData: prevData ? JSON.stringify(prevData) : null,
            timestamp: serverTimestamp(),
            type: action.toLowerCase().includes('delete') ? 'delete' : action.toLowerCase().includes('update') ? 'edit' : 'add'
        });
    } catch (e) {
        console.error("Failed to log audit", e);
    }
};

export const setDoc = async (ref: any, data: any, options?: any) => {
    let prevData = null;
    try { const snap = await getDoc(ref); if (snap.exists()) prevData = snap.data(); } catch (e) {}
    await originalSetDoc(ref, data, options);
    await logAction(prevData ? 'Set' : 'Add', ref, { data, options }, prevData);
};

export const updateDoc = async (ref: any, data: any) => {
    let prevData = null;
    try { const snap = await getDoc(ref); if (snap.exists()) prevData = snap.data(); } catch (e) {}
    await originalUpdateDoc(ref, data);
    await logAction('Update', ref, { data }, prevData);
};

export const deleteDoc = async (ref: any) => {
    let prevData = null;
    try { const snap = await getDoc(ref); if (snap.exists()) prevData = snap.data(); } catch (e) {}
    await originalDeleteDoc(ref);
    await logAction('Delete', ref, {}, prevData);
};

export const addDoc = async (ref: any, data: any) => {
    const newDoc = await originalAddDoc(ref, data);
    await logAction('Add', newDoc, { data });
    return newDoc;
};
export { collection, serverTimestamp, doc, getDoc, originalAddDoc, originalUpdateDoc, originalSetDoc, originalDeleteDoc };
