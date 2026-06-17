import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Popup } from '../../types';
import { Card } from '../../components/ui/Card';
import { Plus, Edit2, Trash2, LayoutTemplate, ToggleLeft, ToggleRight, X, Eye } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { LoadingSpinner } from '../../components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';

const PreviewPopup: React.FC<{ popup: Partial<Popup>, onClose: () => void }> = ({ popup, onClose }) => {
    if (popup.position === 'top') {
        return (
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[9999] bg-white border-b border-slate-200 shadow-md"
            >
                <div className="relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-2 right-2 p-2 text-slate-500 hover:bg-slate-100 rounded-full z-10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    {popup.cssContent && <style dangerouslySetInnerHTML={{ __html: popup.cssContent }} />}
                    <div className="w-full max-h-[40vh] overflow-y-auto hide-scrollbar" dangerouslySetInnerHTML={{ __html: popup.htmlContent || '' }} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} />
                </div>
            </motion.div>
        );
    }
    if (popup.position === 'bottom') {
        return (
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
            >
                <div className="relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-2 right-2 p-2 text-slate-500 hover:bg-slate-100 rounded-full z-10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    {popup.cssContent && <style dangerouslySetInnerHTML={{ __html: popup.cssContent }} />}
                    <div className="w-full max-h-[40vh] overflow-y-auto hide-scrollbar" dangerouslySetInnerHTML={{ __html: popup.htmlContent || '' }} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} />
                </div>
            </motion.div>
        );
    }
    // center
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-2"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative max-w-full max-h-[100vh] overflow-y-auto"
                style={{ backgroundColor: 'transparent', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style>{`
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <button 
                    onClick={onClose}
                    className="absolute top-2 right-2 z-50 p-2 text-slate-400 hover:text-slate-600 bg-white/80 hover:bg-white rounded-full transition-colors shadow-sm"
                >
                    <X size={20} />
                </button>
                {popup.cssContent && <style dangerouslySetInnerHTML={{ __html: popup.cssContent }} />}
                <div className="hide-scrollbar" dangerouslySetInnerHTML={{ __html: popup.htmlContent || '' }} />
            </motion.div>
        </motion.div>
    );
};

export const AdminPopups: React.FC = () => {
    const [popups, setPopups] = useState<Popup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
    const [cookieConsentSettings, setCookieConsentSettings] = useState<any>(null);
    const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Popup>>({
        name: '',
        isActive: false,
        position: 'center',
        targetPage: 'all',
        targetUserType: 'all',
        htmlContent: '<div class="text-center p-6">\n  <h2 class="text-2xl font-bold mb-4">כותרת</h2>\n  <p>תוכן הפופאפ יופיע כאן</p>\n</div>',
        cssContent: ''
    });

    const fetchPopups = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'popups'));
            const popupsData = querySnapshot.docs.map(doc => doc.data() as Popup);
            setPopups(popupsData.sort((a, b) => b.updatedAt - a.updatedAt));

            const { getDoc } = await import('firebase/firestore');
            const cookieDoc = await getDoc(doc(db, 'settings', 'cookieConsent'));
            if (cookieDoc.exists()) {
                setCookieConsentSettings(cookieDoc.data());
            } else {
                setCookieConsentSettings({
                    isActive: true,
                    title: 'העוגיות שלנו 🍪',
                    message: 'אנחנו משתמשים בעוגיות כדי לשפר את חווית הגלישה שלך, להציג משרות רלוונטיות ולנתח את השימוש באתר שלנו. האם תרצה לאשר את כל העוגיות?',
                    analyticsDesc: 'עוזר לנו להבין איך משתמשים באתר ולשפר ביצועים.',
                    marketingDesc: 'מאפשר לנו להציג לך משרות ומודעות שבאמת רלוונטיות עבורך.'
                });
            }
        } catch (error) {
            console.error("Error fetching popups:", error);
            toast.error('שגיאה בטעינת פופאפים');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPopups();
    }, []);

    const handleOpenModal = (popup?: Popup) => {
        if (popup) {
            setEditingPopup(popup);
            setFormData(popup);
        } else {
            setEditingPopup(null);
            setFormData({
                name: '',
                isActive: false,
                position: 'center',
                targetPage: 'all',
                targetUserType: 'all',
                htmlContent: '<div class="text-center p-6">\n  <h2 class="text-2xl font-bold mb-4">כותרת</h2>\n  <p>תוכן הפופאפ יופיע כאן</p>\n</div>',
                cssContent: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('נא להזין שם לפופאפ');
            return;
        }

        try {
            const popupId = editingPopup?.id || `popup_${Date.now()}`;
            
            let finalHtmlContent = formData.htmlContent;
            let finalCssContent = formData.cssContent;
            
            if (formData.popupType === 'image') {
                const imgUrl = formData.imageUrl || '';
                const lnkUrl = formData.imageLink || '#';
                finalHtmlContent = `
<div class="relative w-full h-full flex justify-center items-center p-2">
  <a href="${lnkUrl}" target="_blank" rel="noopener noreferrer" class="block">
    <img src="${imgUrl}" alt="${formData.name}" class="max-w-full h-auto rounded-xl shadow-lg" style="object-fit: contain; max-height: 80vh;" />
  </a>
</div>`;
                finalCssContent = ''; // clear css or maybe not, but generated is enough
            }

            const popupData: Popup = {
                ...(formData as Popup),
                id: popupId,
                htmlContent: finalHtmlContent || '',
                cssContent: finalCssContent || '',
                createdAt: editingPopup?.createdAt || Date.now(),
                updatedAt: Date.now()
            };

            if (popupData.isActive) {
                const conflictingPopups = popups.filter(p => 
                    p.id !== popupId && 
                    p.isActive && 
                    p.targetPage === popupData.targetPage && 
                    p.position === popupData.position
                );
                for (const p of conflictingPopups) {
                    await setDoc(doc(db, 'popups', p.id), { ...p, isActive: false, updatedAt: Date.now() });
                }
            }

            await setDoc(doc(db, 'popups', popupId), popupData);
            toast.success(editingPopup ? 'פופאפ עודכן בהצלחה' : 'פופאפ נוצר בהצלחה');
            setIsModalOpen(false);
            fetchPopups();
        } catch (error) {
            console.error("Error saving popup:", error);
            toast.error('שגיאה בשמירת הפופאפ');
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmId) return;
        
        try {
            // First fetch the popup data
            const popupRef = doc(db, 'popups', deleteConfirmId);
            const popupSnap = await getDoc(popupRef);
            
            if (popupSnap.exists()) {
                const { softDelete } = await import('../../lib/adminUtils');
                // Use softDelete to move to recycle bin
                await softDelete({
                    collectionName: 'popups',
                    id: deleteConfirmId,
                    deletedBy: 'admin',
                    reason: 'נמחק ממסך ניהול פופאפ'
                });
            } else {
                await deleteDoc(popupRef);
            }
            
            toast.success('פופאפ נמחק (הועבר לסל מחזור)');
            fetchPopups();
            setDeleteConfirmId(null);
        } catch (error) {
            console.error("Error deleting popup:", error);
            toast.error('שגיאה במחיקת פופאפ');
        }
    };

    const handleToggleActive = async (popup: Popup) => {
        try {
            const newState = !popup.isActive;
            const updatedPopup = { ...popup, isActive: newState, updatedAt: Date.now() };

            if (newState) {
                const conflictingPopups = popups.filter(p => 
                    p.id !== popup.id && 
                    p.isActive && 
                    p.targetPage === popup.targetPage && 
                    p.position === popup.position
                );
                for (const p of conflictingPopups) {
                    await setDoc(doc(db, 'popups', p.id), { ...p, isActive: false, updatedAt: Date.now() });
                }
            }

            await setDoc(doc(db, 'popups', popup.id), updatedPopup);
            fetchPopups();
            toast.success('סטטוס פופאפ עודכן');
        } catch (error) {
            console.error("Error toggling popup:", error);
            toast.error('שגיאה בעדכון הפופאפ');
        }
    };

    const handleToggleCookieConsent = async () => {
        if (!cookieConsentSettings) return;
        try {
            const newState = !cookieConsentSettings.isActive;
            const updated = { ...cookieConsentSettings, isActive: newState };
            await setDoc(doc(db, 'settings', 'cookieConsent'), updated);
            setCookieConsentSettings(updated);
            toast.success('סטטוס פופאפ עוגיות עודכן');
        } catch (error) {
            console.error("Error toggling cookie consent:", error);
            toast.error('שגיאה בעדכון פופאפ העוגיות');
        }
    };

    const handleDirectPreview = (popup: Popup) => {
        setFormData(popup);
        setIsPreviewOpen(true);
    };

    const handleSaveCookieSettings = async () => {
        if (!cookieConsentSettings) return;
        try {
            await setDoc(doc(db, 'settings', 'cookieConsent'), cookieConsentSettings);
            toast.success('הגדרות פופאפ עוגיות נשמרו בהצלחה');
            setIsCookieModalOpen(false);
            fetchPopups();
        } catch (error) {
            console.error("Error saving cookie settings:", error);
            toast.error('שגיאה בשמירת ההגדרות');
        }
    };

    return (
        <div className="space-y-6">
            <Helmet>
                <title>ניהול פופאפים | עובדים בצ'יק</title>
            </Helmet>

            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">ניהול פופאפים (Popups)</h1>
                    <p className="text-slate-500 mt-1">נהל הודעות קופצות ופרסומות באתר לפי דפים וסוגי משתמשים</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                    <Plus size={20} />
                    <span>פופאפ חדש</span>
                </button>
            </div>

            {/* System Popups */}
            <h2 className="text-xl font-bold text-slate-800 pt-2">פופאפי מערכת</h2>
            <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4" style={{ borderLeftColor: cookieConsentSettings?.isActive ? '#10b981' : '#cbd5e1' }}>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-slate-800">הסכמת עוגיות (Cookie Consent)</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${cookieConsentSettings?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {cookieConsentSettings?.isActive ? 'פעיל' : 'כבוי'}
                        </span>
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-4 mt-1">
                        <span>דף פעולה: <strong className="text-slate-700">כל הדפים (פעם אחת)</strong></span>
                        <span>קהל יעד: <strong className="text-slate-700">כולם</strong></span>
                        <span>מיקום: <strong className="text-slate-700">חלון פינתי (מעוצב מראש)</strong></span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggleCookieConsent}
                        className={`p-2 rounded-lg transition-colors ${cookieConsentSettings?.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={cookieConsentSettings?.isActive ? 'כיבוי' : 'הדלקה'}
                    >
                        {cookieConsentSettings?.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <button
                        onClick={() => setIsCookieModalOpen(true)}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="עריכת טקסטים"
                    >
                        <Edit2 size={20} />
                    </button>
                </div>
            </Card>

            <h2 className="text-xl font-bold text-slate-800 pt-6 border-t mt-6">פופאפים מותאמים אישית</h2>

            {loading ? (
                <LoadingSpinner message="טוען פופאפים..." />
            ) : popups.length === 0 ? (
                <Card className="text-center p-12">
                    <LayoutTemplate size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">אין פופאפים במערכת</h3>
                    <p className="text-slate-500 mt-2">לחץ על הכפתור "פופאפ חדש" כדי ליצור אחד.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {popups.map(popup => (
                        <Card key={popup.id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4" style={{ borderLeftColor: popup.isActive ? '#10b981' : '#cbd5e1' }}>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-slate-800">{popup.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${popup.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {popup.isActive ? 'פעיל' : 'כבוי'}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-4 mt-1">
                                    <span>דף פעולה: <strong className="text-slate-700">{popup.targetPage === 'all' ? 'כל הדפים' : popup.targetPage}</strong></span>
                                    <span>קהל יעד: <strong className="text-slate-700">{popup.targetUserType === 'all' ? 'כולם' : popup.targetUserType === 'seeker' ? 'מחפשי עבודה' : popup.targetUserType === 'employer' ? 'מעסיקים' : 'אורחים בלבד'}</strong></span>
                                    <span>מיקום: <strong className="text-slate-700">{popup.position === 'center' ? 'מרכז (Modal)' : popup.position === 'top' ? 'עליון' : 'תחתון'}</strong></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(popup)}
                                    className={`p-2 rounded-lg transition-colors ${popup.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                    title={popup.isActive ? 'כיבוי' : 'הדלקה'}
                                >
                                    {popup.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                </button>
                                <button
                                    onClick={() => handleDirectPreview(popup)}
                                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                    title="תצוגה מקדימה"
                                >
                                    <Eye size={20} />
                                </button>
                                <button
                                    onClick={() => handleOpenModal(popup)}
                                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                    title="עריכה"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(popup.id)}
                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    title="מחיקה"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPopup ? 'עריכת פופאפ' : 'פופאפ חדש'}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">שם פנימי (לזיהוי בלבד)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-xl"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="למשל: פרסומת קיץ, מבצע למעסיקים..."
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="isActive"
                                className="w-5 h-5"
                                checked={formData.isActive || false}
                                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                            />
                            <label htmlFor="isActive" className="font-bold text-slate-700">פופאפ מופעל</label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">מיקום במסך</label>
                            <select
                                className="w-full px-4 py-2 border rounded-xl text-right"
                                value={formData.position || 'center'}
                                onChange={(e) => setFormData({...formData, position: e.target.value as any})}
                            >
                                <option value="center">מרכז המסך (חלון קופץ ענק)</option>
                                <option value="top">פס עליון</option>
                                <option value="bottom">פס תחתון</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">הדף בו יופיע</label>
                            <select
                                className="w-full px-4 py-2 border rounded-xl text-right"
                                value={formData.targetPage || 'all'}
                                onChange={(e) => setFormData({...formData, targetPage: e.target.value})}
                            >
                                <option value="all">בכל הדפים</option>
                                <option value="/">מסך הבית בלבד</option>
                                <option value="/jobs">לוח דרושים (/jobs)</option>
                                <option value="/seeker/dashboard">דאשבורד מחפש עבודה</option>
                                <option value="/employer/dashboard">דאשבורד מעסיק</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">קהל יעד</label>
                            <select
                                className="w-full px-4 py-2 border rounded-xl text-right"
                                value={formData.targetUserType || 'all'}
                                onChange={(e) => setFormData({...formData, targetUserType: e.target.value as any})}
                            >
                                <option value="all">כולם (כולל אורחים)</option>
                                <option value="guest">אורחים בלבד (לא מחוברים)</option>
                                <option value="seeker">מחפשי עבודה מחוברים</option>
                                <option value="employer">מעסיקים מחוברים</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center gap-6 mb-4">
                            <span className="font-bold text-slate-700">סוג פופאפ:</span>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="popupType" 
                                    value="html" 
                                    checked={formData.popupType !== 'image'} 
                                    onChange={() => setFormData({...formData, popupType: 'html'})} 
                                /> 
                                <span>קוד HTML</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="popupType" 
                                    value="image" 
                                    checked={formData.popupType === 'image'} 
                                    onChange={() => setFormData({...formData, popupType: 'image'})} 
                                /> 
                                <span>מבוסס תמונה וקישור</span>
                            </label>
                        </div>

                        {formData.popupType === 'image' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">קישור לתמונה (URL)</label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                                        value={formData.imageUrl || ''}
                                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                                        placeholder="https://example.com/image.png"
                                        dir="ltr"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">תוכל להעלות תמונה באזור ניהול הקבצים ולהעתיק לכאן את הקישור.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">קישור בעת לחיצה (אופציונלי)</label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                                        value={formData.imageLink || ''}
                                        onChange={(e) => setFormData({...formData, imageLink: e.target.value})}
                                        placeholder="https://example.com/promotion"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">תוכן HTML (Popup Content)</label>
                                    <p className="text-xs text-slate-500 mb-2">אתה יכול להשתמש בקלאסים של TailwindCSS.</p>
                                    <textarea
                                        className="w-full h-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-left align-left"
                                        dir="ltr"
                                        value={formData.htmlContent || ''}
                                        onChange={(e) => setFormData({...formData, htmlContent: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">עיצוב CSS (אופציונלי)</label>
                                    <textarea
                                        className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-left align-left"
                                        dir="ltr"
                                        value={formData.cssContent || ''}
                                        onChange={(e) => setFormData({...formData, cssContent: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t mt-6">
                        <div>
                            <button
                                onClick={() => setIsPreviewOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition w-full sm:w-auto justify-center"
                            >
                                <Eye size={18} />
                                צפה בתצוגה מקדימה
                            </button>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 sm:flex-none px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition"
                            >
                                ביטול
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                            >
                                שמור פופאפ
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isCookieModalOpen} onClose={() => setIsCookieModalOpen(false)} title="עריכת פופאפ עוגיות">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">כותרת הפופאפ</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-xl"
                            value={cookieConsentSettings?.title || ''}
                            onChange={(e) => setCookieConsentSettings({...cookieConsentSettings, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">טקסט תיאור כללי</label>
                        <textarea
                            className="w-full h-24 px-4 py-3 border border-slate-200 rounded-xl"
                            value={cookieConsentSettings?.message || ''}
                            onChange={(e) => setCookieConsentSettings({...cookieConsentSettings, message: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">תיאור - ניתוח נתונים (Analytics)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-xl"
                            value={cookieConsentSettings?.analyticsDesc || ''}
                            onChange={(e) => setCookieConsentSettings({...cookieConsentSettings, analyticsDesc: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">תיאור - שיווק והתאמה (Marketing)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-xl"
                            value={cookieConsentSettings?.marketingDesc || ''}
                            onChange={(e) => setCookieConsentSettings({...cookieConsentSettings, marketingDesc: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t mt-6">
                        <button
                            onClick={() => setIsCookieModalOpen(false)}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition"
                        >
                            ביטול
                        </button>
                        <button
                            onClick={handleSaveCookieSettings}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                        >
                            שמור הגדרות
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="מחיקת פופאפ">
                <div className="space-y-4">
                    <p className="text-slate-600">האם אתה בטוח שברצונך למחוק פופאפ זה?</p>
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition"
                        >
                            ביטול
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                        >
                            מחק
                        </button>
                    </div>
                </div>
            </Modal>

            <AnimatePresence>
                {isPreviewOpen && (
                    <PreviewPopup popup={formData} onClose={() => setIsPreviewOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPopups;
