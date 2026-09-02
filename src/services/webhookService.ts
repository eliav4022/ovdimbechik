import { collection, addDoc, getDoc, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type WebhookEventType = 
    | 'job.created'
    | 'job.updated'
    | 'application.created'
    | 'application.status_changed'
    | 'employer.registered'
    | 'inquiry.created';

export type WebhookEvent = WebhookEventType;

export interface WebhookLog {
    id?: string;
    event: WebhookEventType | string;
    url: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    success?: boolean;
    statusCode?: number;
    responseTimeMs?: number;
    requestPayload?: any;
    payload?: any;
    responseBody?: string;
    errorMessage?: string;
    error?: string;
    timestamp: string;
    createdAt?: string;
}

export const SAMPLE_PAYLOADS: Record<WebhookEventType, any> = {
    'job.created': {
        event: 'job.created',
        timestamp: new Date().toISOString(),
        source: 'OvdimBeChik Job Board',
        data: {
            jobId: 'job_sample_88392',
            title: 'מפתח/ת Fullstack React & Node.js',
            employerId: 'emp_99214',
            companyName: 'טק סולושנס בע״מ',
            location: 'תל אביב - יפו / היברידי',
            jobType: 'משרה מלאה',
            category: 'פיתוח תוכנה',
            salaryMin: 22000,
            salaryMax: 28000,
            isUrgent: true,
            status: 'PUBLISHED',
            requirements: ['3+ שנות ניסיון ב-React', 'ניסיון ב-Node.js ו-TypeScript', 'הבנה עמוקה ב-PostgreSQL'],
            createdAt: new Date().toISOString()
        }
    },
    'job.updated': {
        event: 'job.updated',
        timestamp: new Date().toISOString(),
        source: 'OvdimBeChik Job Board',
        data: {
            jobId: 'job_sample_88392',
            title: 'מפתח/ת Fullstack React & Node.js (מעודכן)',
            status: 'PUBLISHED',
            updatedFields: ['salaryMax', 'description'],
            updatedAt: new Date().toISOString()
        }
    },
    'application.created': {
        event: 'application.created',
        timestamp: new Date().toISOString(),
        source: 'OvdimBeChik Job Board',
        data: {
            applicationId: 'app_77491',
            jobId: 'job_sample_88392',
            jobTitle: 'מפתח/ת Fullstack React & Node.js',
            employerId: 'emp_99214',
            candidateName: 'יוסי כהן',
            candidateEmail: 'yossi.cohen@example.com',
            candidatePhone: '050-1234567',
            cvUrl: 'https://storage.googleapis.com/sample-cv/yossi_cohen_cv.pdf',
            coverNote: 'שלום רב, אשמח מאוד להצטרף לצוות הפיתוח שלכם!',
            status: 'NEW',
            appliedAt: new Date().toISOString()
        }
    },
    'application.status_changed': {
        event: 'application.status_changed',
        timestamp: new Date().toISOString(),
        source: 'OvdimBeChik Job Board',
        data: {
            applicationId: 'app_77491',
            jobId: 'job_sample_88392',
            jobTitle: 'מפתח/ת Fullstack React & Node.js',
            candidateName: 'יוסי כהן',
            candidateEmail: 'yossi.cohen@example.com',
            candidatePhone: '050-1234567',
            previousStatus: 'NEW',
            newStatus: 'INTERVIEW',
            note: 'נקבע ראיון טכני ליום שלישי הקרוב בשעה 14:00',
            updatedAt: new Date().toISOString()
        }
    },
    'employer.registered': {
        event: 'employer.registered',
        timestamp: new Date().toISOString(),
        source: 'OvdimBeChik Job Board',
        data: {
            employerId: 'emp_99214',
            companyName: 'סטארטאפ נקסוס בע״מ',
            contactName: 'דנה לוי',
            email: 'dana@nexus-tech.io',
            phone: '052-9876543',
            companyWebsite: 'https://nexus-tech.io',
            registeredAt: new Date().toISOString()
        }
    },
    'inquiry.created': {
        event: 'inquiry.created',
        timestamp: new Date().toISOString(),
        source: 'OvdimBeChik Job Board',
        data: {
            inquiryId: 'inq_33019',
            name: 'רונית שפירא',
            email: 'ronit.shapira@example.com',
            phone: '054-5551234',
            subject: 'בירור לגבי פרסום חבילת משרות לחברות השמה',
            message: 'שלום, ברצוני לברר לגבי מחירים מיוחדים לפרסום 10 משרות בחודש.',
            createdAt: new Date().toISOString()
        }
    }
};

export interface WebhookTestResult {
    success: boolean;
    statusCode?: number;
    responseTimeMs?: number;
    responseBody?: string;
    error?: string;
}

/**
 * Sends a test webhook event through the backend proxy to prevent CORS issues
 */
export async function testWebhook(
    url: string, 
    event: string, 
    samplePayload?: any,
    secret?: string
): Promise<WebhookTestResult> {
    if (!url || !url.startsWith('http')) {
        return {
            success: false,
            error: 'כתובת URL אינה תקינה (חייבת להתחיל ב-http:// או https://)'
        };
    }

    try {
        const payload = samplePayload || {
            event,
            test: true,
            timestamp: new Date().toISOString(),
            source: "OvdimBeChik Job Board",
            data: {
                message: `This is a live test webhook for event: ${event}`,
                sampleId: "test_sample_" + Math.random().toString(36).substring(2, 8),
                generatedAt: new Date().toISOString()
            }
        };

        const response = await fetch('/api/integrations/test-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url,
                event,
                payload,
                secret
            })
        });

        const result = await response.json();
        return {
            success: result.success,
            statusCode: result.statusCode,
            responseTimeMs: result.responseTimeMs,
            responseBody: result.responseBody,
            error: result.error
        };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || 'שגיאת תקשורת עם שרת הבדיקה'
        };
    }
}

/**
 * Dispatches a real webhook event if configured in System Settings
 */
export async function triggerWebhook(event: WebhookEventType, data: any): Promise<void> {
    try {
        const systemDoc = await getDoc(doc(db, 'settings', 'system'));
        if (!systemDoc.exists()) return;

        const settings = systemDoc.data();
        if (settings.webhookEnabled === false) return;

        let targetUrl: string | undefined;

        switch (event) {
            case 'job.created':
            case 'job.updated':
                targetUrl = settings.webhookUrlNewJob;
                break;
            case 'application.status_changed':
                targetUrl = settings.webhookUrlStatusChange;
                break;
            case 'application.created':
                targetUrl = settings.webhookUrlNewApplication || settings.webhookUrlStatusChange;
                break;
            case 'employer.registered':
                targetUrl = settings.webhookUrlNewEmployer;
                break;
            case 'inquiry.created':
                targetUrl = settings.webhookUrlNewInquiry;
                break;
        }

        if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim().startsWith('http')) {
            return;
        }

        const payload = {
            event,
            timestamp: new Date().toISOString(),
            source: 'OvdimBeChik Job Board',
            data
        };

        const startTime = Date.now();

        // Dispatch via server proxy to ensure reliability and avoid CORS
        const response = await fetch('/api/integrations/trigger-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: targetUrl.trim(),
                event,
                payload,
                secret: settings.webhookSecret || ''
            })
        });

        const resData = await response.json();
        const duration = Date.now() - startTime;

        // Log the dispatch in Firestore for audit & dashboard viewing
        try {
            await addDoc(collection(db, 'webhook_logs'), {
                event,
                url: targetUrl.trim(),
                status: resData.success ? 'SUCCESS' : 'FAILED',
                statusCode: resData.statusCode || (resData.success ? 200 : 500),
                responseTimeMs: duration,
                requestPayload: payload,
                responseBody: (resData.responseBody || '').slice(0, 1000),
                errorMessage: resData.error || null,
                timestamp: new Date().toISOString()
            });
        } catch (logErr) {
            console.warn('Could not save webhook log to firestore:', logErr);
        }
    } catch (error) {
        console.error(`Error triggering webhook for event ${event}:`, error);
    }
}

/**
 * Fetches recent webhook logs
 */
export async function getRecentWebhookLogs(maxCount: number = 20): Promise<WebhookLog[]> {
    try {
        const q = query(collection(db, 'webhook_logs'), orderBy('timestamp', 'desc'), limit(maxCount));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as WebhookLog));
    } catch (e) {
        console.warn('Error fetching webhook logs:', e);
        return [];
    }
}
