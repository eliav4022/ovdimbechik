import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Eye, EyeOff, Save, RefreshCw, Link as LinkIcon } from 'lucide-react';
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
    const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
    
    // Quick info settings
    const [quickInfoLinks, setQuickInfoLinks] = useState<Record<string, string>>({
        cv_pdf: '',
        cv_word: '',
        contract: '',
        checklist: ''
    });

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

            const infoSnap = await getDoc(doc(db, 'settings', 'quickInfo'));
            if (infoSnap.exists() && infoSnap.data().links) {
                setQuickInfoLinks(prev => ({ ...prev, ...infoSnap.data().links }));
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

    const handleToggleShow = async (id: string) => {
        const updatedPages = pages.map(p => {
            if (p.id === id) {
                return { ...p, showInMenu: !p.showInMenu };
            }
            return p;
        });
        setPages(updatedPages);
        
        // Auto-save the specific page to Firestore
        const pageToSave = updatedPages.find(p => p.id === id);
        if (pageToSave) {
            try {
                await setDoc(doc(db, 'pages', id), pageToSave);
                toast.success('הגדרות עמוד עודכנו בהצלחה');
            } catch (error) {
                console.error('Error saving page:', error);
                toast.error('שגיאה בשמירת הגדרות עמוד');
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const page of pages) {
                await setDoc(doc(db, 'pages', page.id), page);
            }
            await setDoc(doc(db, 'settings', 'quickInfo'), { links: quickInfoLinks }, { merge: true });
            toast.success('הגדרות נשמרו בהצלחה');
        } catch (error) {
            console.error('Error saving pages:', error);
            toast.error('שגיאה בשמירת הגדרות');
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
                        <div 
                            key={page.id} 
                            className="flex flex-col bg-slate-50 rounded-xl border border-slate-100 overflow-hidden cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => setExpandedPageId(expandedPageId === page.id ? null : page.id)}
                        >
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-slate-800">{page.name}</span>
                                    <span className="text-sm text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">{page.path}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleShow(page.id);
                                    }}
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
                            {page.id === 'info' && expandedPageId === page.id && (
                                <div className="p-4 bg-white border-t border-slate-100 cursor-default" onClick={(e) => e.stopPropagation()}>
                                    <div className="mb-4">
                                        <h3 className="text-sm font-bold text-slate-900">הגדרות עמוד מידע בצ'יק</h3>
                                        <p className="text-xs text-slate-500 mt-1">ניהול קישורים לכלים החינמיים המוצגים בעמוד</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-slate-700">קישור תבנית קורות חיים – PDF</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input
                                                    type="url"
                                                    value={quickInfoLinks.cv_pdf || ''}
                                                    onChange={(e) => setQuickInfoLinks(prev => ({ ...prev, cv_pdf: e.target.value }))}
                                                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-xs"
                                                    placeholder="https://..."
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-slate-700">קישור תבנית קורות חיים – Word</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input
                                                    type="url"
                                                    value={quickInfoLinks.cv_word || ''}
                                                    onChange={(e) => setQuickInfoLinks(prev => ({ ...prev, cv_word: e.target.value }))}
                                                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-xs"
                                                    placeholder="https://..."
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-slate-700">קישור לחוזה עבודה בסיסי</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input
                                                    type="url"
                                                    value={quickInfoLinks.contract || ''}
                                                    onChange={(e) => setQuickInfoLinks(prev => ({ ...prev, contract: e.target.value }))}
                                                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-xs"
                                                    placeholder="https://..."
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-slate-700">קישור לצ'קליסט לפני ראיון עבודה</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input
                                                    type="url"
                                                    value={quickInfoLinks.checklist || ''}
                                                    onChange={(e) => setQuickInfoLinks(prev => ({ ...prev, checklist: e.target.value }))}
                                                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-xs"
                                                    placeholder="https://..."
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
