import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
