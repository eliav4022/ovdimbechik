import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
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
                    <div className="w-full max-h-[40vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: popup.htmlContent || '' }} />
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
                    <div className="w-full max-h-[40vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: popup.htmlContent || '' }} />
                </div>
            </motion.div>
        );
    }
    // center
    return (
        <Modal isOpen={true} onClose={onClose} title="">
            <div className="relative">
                {popup.cssContent && <style dangerouslySetInnerHTML={{ __html: popup.cssContent }} />}
                <div dangerouslySetInnerHTML={{ __html: popup.htmlContent || '' }} />
            </div>
        </Modal>
    );
};

export const AdminPopups: React.FC = () => {
    const [popups, setPopups] = useState<Popup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingPopup, setEditingPopup] = useState<Popup | null>(null);

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
            const popupData: Popup = {
                ...(formData as Popup),
                id: popupId,
                createdAt: editingPopup?.createdAt || Date.now(),
                updatedAt: Date.now()
            };

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
        if (!window.confirm('האם אתה בטוח שברצונך למחוק פופאפ זה?')) return;
        
        try {
            await deleteDoc(doc(db, 'popups', id));
            toast.success('פופאפ נמחק בהצלחה');
            fetchPopups();
        } catch (error) {
            console.error("Error deleting popup:", error);
            toast.error('שגיאה במחיקת פופאפ');
        }
    };

    const handleToggleActive = async (popup: Popup) => {
        try {
            const updatedPopup = { ...popup, isActive: !popup.isActive, updatedAt: Date.now() };
            await setDoc(doc(db, 'popups', popup.id), updatedPopup);
            fetchPopups();
            toast.success('סטטוס פופאפ עודכן');
        } catch (error) {
            console.error("Error toggling popup:", error);
            toast.error('שגיאה בעדכון הפופאפ');
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

            <AnimatePresence>
                {isPreviewOpen && (
                    <PreviewPopup popup={formData} onClose={() => setIsPreviewOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPopups;
