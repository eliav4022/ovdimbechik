import { ref, deleteObject, uploadBytes } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from './firebase';

export function isAllowedCVFile(file: File): boolean {
    if (!file) return false;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['pdf', 'doc', 'docx'].includes(ext)) {
        return true;
    }
    const type = (file.type || '').toLowerCase();
    if (!type) return false;
    
    return (
        type.includes('pdf') ||
        type.includes('word') ||
        type.includes('msword') ||
        type.includes('officedocument') ||
        type === 'application/zip' ||
        type === 'application/x-zip-compressed' ||
        type === 'application/octet-stream'
    );
}

export async function uploadAndReplaceCV(file: File, user: any): Promise<string> {
    // 1. Enforce 50KB limit
    if (file.size > 50 * 1024) {
        throw new Error('גודל הקובץ חורג מהמגבלה של 50KB');
    }

    if (!isAllowedCVFile(file)) {
        throw new Error('סוג הקובץ אינו נתמך. נא להעלות קבצי PDF או Word (DOC/DOCX).');
    }

    // 2. Delete old CV if exists
    if (user?.cvUrl) {
        try {
            let oldPath = '';
            if (user.cvUrl.includes('/file/')) {
                oldPath = user.cvUrl.split('/file/')[1];
            } else if (user.cvUrl.includes('firebasestorage')) {
                const match = user.cvUrl.match(/\/o\/(.*?)\?/);
                if (match && match[1]) {
                    oldPath = decodeURIComponent(match[1]);
                }
            } else {
                oldPath = user.cvUrl; // fallback
            }

            if (oldPath && oldPath.startsWith('cvs/')) {
                const oldRef = ref(storage, oldPath);
                await deleteObject(oldRef);
            }
        } catch (e) {
            console.warn('Failed to delete old CV, continuing upload...', e);
        }
    }

    // 3. Upload new CV
    const fileName = file.name.toLowerCase();
    let contentType = file.type || 'application/octet-stream';
    if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
    else if (fileName.endsWith('.doc')) contentType = 'application/msword';
    else if (fileName.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // We use a timestamp to avoid browser caching issues with the same URL, 
    // but the old file is deleted so we only ever have 1 file.
    const newPath = `cvs/${user.uid}/cv_${Date.now()}_${file.name}`;
    const cvRef = ref(storage, newPath);
    
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    await uploadBytes(cvRef, fileBytes, { contentType });
    
    const finalCvUrl = window.location.origin + '/file/' + cvRef.fullPath;
    
    // Update user doc
    await setDoc(doc(db, 'users', user.uid), { cvUrl: finalCvUrl }, { merge: true });
    
    return finalCvUrl;
}
