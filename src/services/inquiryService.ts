import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Inquiry } from '../types';

export const sendInquiry = async (
  inquiryData: Omit<Inquiry, 'id' | 'status' | 'createdAt'>
): Promise<boolean> => {
  try {
    // Save to Firebase first so Admin can see it
    await addDoc(collection(db, 'inquiries'), {
      ...inquiryData,
      status: 'NEW',
      createdAt: new Date().toISOString()
    });

    console.log("Inquiry submitted:", inquiryData);

    // Fetch system settings to get contact email
    const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
    let toEmail = 'Ovdimbechik@gmail.com';
    if (settingsDoc.exists() && settingsDoc.data().contactEmail) {
        toEmail = settingsDoc.data().contactEmail;
    }

    // Connect to Firebase Trigger Email Extension
    await addDoc(collection(db, 'mail'), {
        to: toEmail,
        message: {
            subject: `פנייה חדשה מאתר הדרושים: ${inquiryData.subject}`,
            html: `
                <div dir="rtl">
                    <h2>פנייה חדשה התקבלה</h2>
                    <p><strong>שם:</strong> ${inquiryData.senderName}</p>
                    <p><strong>אימייל:</strong> ${inquiryData.senderEmail}</p>
                    <p><strong>נושא:</strong> ${inquiryData.subject}</p>
                    <p><strong>הודעה:</strong></p>
                    <p>${inquiryData.message.replace(/\n/g, '<br/>')}</p>
                </div>
            `
        }
    });

    return Promise.resolve(true);
  } catch (error) {
    console.error("Error sending inquiry:", error);
    return Promise.resolve(false);
  }
};
