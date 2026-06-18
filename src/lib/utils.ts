import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileUrl(url: string | undefined): string {
    if (!url) return '';
    // If it's a firebase storage URL, map it to our /file/ endpoint
    if (url.includes('firebasestorage.googleapis.com')) {
        const match = url.match(/\/o\/(.*?)\?/);
        if (match && match[1]) {
            const decodedPath = decodeURIComponent(match[1]);
            return window.location.origin + '/file/' + decodedPath;
        }
    }
    // If it already uses the /file/ convention but from a different origin, we could optionally update the origin
    if (url.includes('/file/')) {
        try {
            const parsed = new URL(url);
            if (parsed.pathname.startsWith('/file/')) {
               return window.location.origin + parsed.pathname;
            }
        } catch(e) {}
    }
    return url;
}

export function validateFile(file: File, maxSizeMB: number = 5, allowedTypes: string[] = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']): { valid: boolean; error?: string } {
    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `גודל הקובץ חורג מהמגבלה של ${maxSizeMB}MB` };
    }
    // Allow empty type if system couldn't determine, or match against allowed
    if (file.type && !allowedTypes.includes(file.type)) {
        return { valid: false, error: 'סוג הקובץ אינו נתמך. נא להעלות קבצי PDF או Word (DOC/DOCX).' };
    }
    return { valid: true };
}
