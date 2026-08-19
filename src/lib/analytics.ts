import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export type AnalyticsEventType = 'search' | 'view_job' | 'apply_job' | 'post_job' | 'contact_click' | 'page_view' | 'site_visit';

interface TrackEventParams {
    type: AnalyticsEventType;
    metadata?: Record<string, any>;
}

export const trackEvent = async ({ type, metadata = {} }: TrackEventParams) => {
    try {
        const eventData = {
            type,
            userId: auth.currentUser?.uid || null,
            metadata,
            timestamp: new Date().toISOString(),
        };

        // Always log to console for visibility during development
        console.log(`[Analytics] ${type}`, eventData);

        // Record in Firestore
        const docRef = await addDoc(collection(db, 'analytics_events'), eventData);
        return docRef.id;
    } catch (error) {
        // Silently fail analytics so it doesn't break the UI
        console.error('Failed to track event:', error);
        return null;
    }
};

export const updateTrackedEvent = async (docId: string, metadataUpdates: Record<string, any>) => {
    try {
        await updateDoc(doc(db, 'analytics_events', docId), {
            'metadata.role': metadataUpdates.role,
            userId: auth.currentUser?.uid || null
        });
    } catch (error) {
        console.error('Failed to update event:', error);
    }
};

// Hook-like wrapper if needed, or just use directly
