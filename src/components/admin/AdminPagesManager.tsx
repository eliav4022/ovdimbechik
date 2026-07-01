import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageConfig } from '../../context/PagesContext';

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

export const AdminPagesManager: React.FC = () => {
    const [pages, setPages] = useState<PageConfig[]>(DEFAULT_PAGES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadPages = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'pages'));
            if (!snap.empty) {
                const loaded = snap.docs.map(d => d.data() as PageConfig);
                const merged = DEFAULT_PAGES.map(defaultPage => {
                    const found = loaded.find(p => p.id === defaultPage.id);
                    return found ? { ...defaultPage, ...found, path: defaultPage.path } : defaultPage;
                });
                setPages(merged);
            } else {
                setPages(DEFAULT_PAGES);
            }
        } catch (error) {
            console.error('Error loading pages:', error);
            toast.error('שגיאה בטעינת עמודים');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPages();
    }, []);

    const handleToggleShow = (id: string) => {
        setPages(pages.map(p => {
            if (p.id === id) {
                return { ...p, showInMenu: !p.showInMenu };
            }
            return p;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const page of pages) {
                await setDoc(doc(db, 'pages', page.id), page);
            }
            toast.success('הגדרות עמודים נשמרו בהצלחה');
        } catch (error) {
            console.error('Error saving pages:', error);
            toast.error('שגיאה בשמירת הגדרות עמודים');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">טוען הגדרות עמודים...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">ניהול עמודים</h2>
                        <p className="text-sm text-slate-500 mt-1">שליטה בתצוגת העמודים בתפריט הראשי</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={loadPages}
                            className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                            title="רענן"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'שומר...' : 'שמור שינויים'}
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {pages.map(page => (
                        <div key={page.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-4">
                                <span className="font-semibold text-slate-800">{page.name}</span>
                                <span className="text-sm text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">{page.path}</span>
                            </div>
                            <button
                                onClick={() => handleToggleShow(page.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    page.showInMenu 
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                            >
                                {page.showInMenu ? (
                                    <>
                                        <Eye size={16} />
                                        מוצג בתפריט
                                    </>
                                ) : (
                                    <>
                                        <EyeOff size={16} />
                                        מוסתר מהתפריט
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
