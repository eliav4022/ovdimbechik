import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const SEOHelmet: React.FC = () => {
    const [settings, setSettings] = useState<{
        title?: string;
        description?: string;
        faviconUrl?: string;
    } | null>(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSettings({
                    title: data.seoSiteTitle,
                    description: data.seoSiteDescription,
                    faviconUrl: data.siteFaviconUrl || data.siteLogoUrl
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const title = settings?.title || "עובדים בצ'יק | לוח הדרושים המהיר בישראל";
    const description = settings?.description || "מצא עבודה תוך דקות או גייס עובדים מוכשרים בצ'יק. לוח הדרושים המתקדם ביותר בישראל עם בינה מלאכותית.";
    const faviconUrl = settings?.faviconUrl || "/logo.png";

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="icon" href={faviconUrl} />
            <link rel="apple-touch-icon" href={faviconUrl} />
            <meta property="og:image" content={faviconUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
        </Helmet>
    );
};
