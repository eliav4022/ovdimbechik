import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PageConfig {
    id: string;
    name: string;
    path: string;
    enabled: boolean;
    showInMenu: boolean;
}

interface PagesContextType {
    pages: PageConfig[];
    loading: boolean;
}

const PagesContext = createContext<PagesContextType>({ pages: [], loading: true });

const DEFAULT_PAGES: PageConfig[] = [
    { id: 'home', name: 'דף הבית', path: '/', enabled: true, showInMenu: true },
    { id: 'jobs', name: 'לוח דרושים', path: '/jobs', enabled: true, showInMenu: true },
    { id: 'casual', name: 'עבודות מזדמנות 🍕', path: '/jobs?tab=casual', enabled: true, showInMenu: true },
    { id: 'whatsapp', name: 'דרושים בוואטסאפ', path: '/whatsapp-jobs', enabled: true, showInMenu: true },
    { id: 'courses', name: 'פורטל קורסים', path: '/courses', enabled: true, showInMenu: true },
    { id: 'employers', name: 'גיוס עובדים', path: '/employers-landing', enabled: true, showInMenu: true },
    { id: 'info', name: 'מידע בצ\'יק', path: '/info', enabled: true, showInMenu: true },
    { id: 'preparation', name: 'הכנה לעבודה', path: '/preparation', enabled: true, showInMenu: true },
    { id: 'marketing', name: 'שיווק לעסקים', path: '/marketing', enabled: true, showInMenu: true },
];

export const PagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pages, setPages] = useState<PageConfig[]>(DEFAULT_PAGES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'pages'), (snapshot) => {
            if (!snapshot.empty) {
                const loadedPages = snapshot.docs.map(doc => doc.data() as PageConfig);
                const merged = DEFAULT_PAGES.map(defaultPage => {
                    const found = loadedPages.find(p => p.id === defaultPage.id);
                    return found ? { ...defaultPage, ...found, path: defaultPage.path } : defaultPage;
                });
                setPages(merged);
            } else {
                setPages(DEFAULT_PAGES);
            }
            setLoading(false);
        }, (err) => {
            console.warn('Failed to load pages context:', err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <PagesContext.Provider value={{ pages, loading }}>
            {children}
        </PagesContext.Provider>
    );
};

export const usePages = () => useContext(PagesContext);
