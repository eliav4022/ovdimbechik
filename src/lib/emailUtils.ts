import { db } from './firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

export interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
}

export async function sendEmail(options: EmailOptions) {
    try {
        // Fetch the sender email from settings
        let fromEmail = 'noreply@ovdimbechik.com';
        try {
            const sysSnap = await getDoc(doc(db, 'settings', 'system'));
            if (sysSnap.exists()) {
                const settings = sysSnap.data();
                if (settings.systemSenderEmail) {
                    fromEmail = settings.systemSenderEmail;
                }
            }
        } catch (err) {
            console.error('Error fetching system settings for email sender:', err);
        }

        const mailDoc = {
            to: Array.isArray(options.to) ? options.to : [options.to],
            from: fromEmail,
            message: {
                subject: options.subject,
                text: options.text || '',
                html: options.html || options.text || ''
            },
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'mail'), mailDoc);
        console.log('Email queued for sending:', docRef.id);
        return true;
    } catch (error) {
        console.error('Error queuing email:', error);
        return false;
    }
}
