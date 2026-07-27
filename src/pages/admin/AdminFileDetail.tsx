import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ArrowRight, Save, Trash2, File as FileIcon, ImageIcon, Download, Link as LinkIcon, Calendar, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getFileUrl } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface SiteFile {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    createdAt: any;
    uploadedBy: string;
}

export const AdminFileDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [file, setFile] = useState<SiteFile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Editable fields
    const [customName, setCustomName] = useState('');
    
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        
        const fetchFile = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'files', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as Omit<SiteFile, 'id'>;
                    const fileData = { id: docSnap.id, ...data };
                    setFile(fileData);
                    setCustomName(fileData.name);
                } else {
                    toast('קובץ לא נמצא', 'error');
                    navigate('/admin/files');
                }
            } catch (error) {
                console.error("Failed to fetch file:", error);
                toast('שגיאה בטעינת קובץ', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
    }, [id, navigate, toast]);

    const handleSave = async () => {
        if (!id || !customName.trim()) {
            toast('שם הקובץ לא יכול להיות ריק', 'error');
            return;
        }
        
        setSaving(true);
        try {
            await updateDoc(doc(db, 'files', id), {
                name: customName.trim()
            });
            toast('הקובץ עודכן בהצלחה', 'success');
            if (file) {
                setFile({ ...file, name: customName.trim() });
            }
        } catch (error) {
            console.error("Failed to update file:", error);
            toast('שגיאה בעדכון הקובץ', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            // Note: Normally we'd also delete from Storage, but often in apps we might just delete the doc or use a Cloud Function.
            // For now, we will perform a soft delete or just delete the document according to how AdminFiles does it (it uses recycle_bin if you have it, or standard delete).
            // Looking at AdminFiles, it just calls `deleteDoc(doc(db, 'files', file.id))` and deletes from storage.
            // But doing full delete logic here requires importing storage. Let's redirect to files page or do basic delete.
            const { deleteDoc: firestoreDelete } = await import('firebase/firestore');
            const { ref, deleteObject } = await import('firebase/storage');
            const { storage } = await import('../../lib/firebase');
            
            if (file?.url) {
                try {
                    const storageRef = ref(storage, file.url);
                    await deleteObject(storageRef);
                } catch (e) {
                    console.log("Storage file might be already deleted or access denied.", e);
                }
            }
            await firestoreDelete(doc(db, 'files', id));
            
            toast('הקובץ נמחק בהצלחה', 'success');
            navigate('/admin/files');
        } catch (error) {
            console.error("Failed to delete file:", error);
            toast('שגיאה במחיקת הקובץ', 'error');
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;
    }

    if (!file) return null;

    const isImage = file.type.includes('image');
    const cleanUrl = getFileUrl(file.url);
    const downloadUrl = `${cleanUrl}?downloadName=${encodeURIComponent(file.name)}`;

    let displayType = 'תמונה';
    if (file.type.includes('pdf')) displayType = 'PDF';
    else if (file.type.includes('word') || file.type.includes('document')) displayType = 'Word';
    else if (file.type.includes('png')) displayType = 'PNG';
    else if (file.type.includes('jpeg') || file.type.includes('jpg')) displayType = 'JPG';
    else if (file.type.includes('webp')) displayType = 'WEBP';
    else if (file.type.includes('gif')) displayType = 'GIF';

    return (
        <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate('/admin/files')} className="p-2">
                        <ArrowRight size={20} />
                    </Button>
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        {isImage ? <ImageIcon size={24} /> : <FileIcon size={24} />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">{file.name}</h1>
                        <p className="text-sm text-slate-500 font-medium">ניהול קובץ</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                        leftIcon={<Trash2 size={18} />}
                        onClick={() => setIsConfirmDeleteOpen(true)}
                    >
                        מחק קובץ
                    </Button>
                    <Button
                        onClick={handleSave}
                        loading={saving}
                        leftIcon={<Save size={18} />}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        שמור שינויים
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Edit Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 border-none shadow-xl shadow-slate-200/50 rounded-2xl space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">פרטי הקובץ</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">שם הקובץ לתצוגה</label>
                                <Input 
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="הזן שם לקובץ..."
                                    className="max-w-md"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    שם הקובץ משמש לזיהוי במערכת הניהול.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex gap-4">
                                <Button 
                                    variant="outline" 
                                    leftIcon={<LinkIcon size={18} />}
                                    onClick={() => {
                                        navigator.clipboard.writeText(cleanUrl);
                                        toast('הקישור הועתק ללוח', 'success');
                                    }}
                                >
                                    העתק קישור ישיר
                                </Button>
                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" leftIcon={<Download size={18} />}>
                                        הורדת הקובץ
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </Card>

                    {/* Preview Area */}
                    <Card className="p-6 border-none shadow-xl shadow-slate-200/50 rounded-2xl space-y-4">
                        <h2 className="text-xl font-bold text-slate-800">תצוגה מקדימה</h2>
                        <div className="bg-slate-50 rounded-xl min-h-[300px] flex items-center justify-center p-4 border border-slate-200">
                            {isImage ? (
                                <img src={cleanUrl} alt={file.name} className="max-w-full max-h-[500px] object-contain rounded-lg" />
                            ) : file.type.includes('pdf') ? (
                                <iframe src={cleanUrl} className="w-full h-[500px] rounded-lg border-none" title="PDF Preview" />
                            ) : (
                                <div className="text-center text-slate-500 flex flex-col items-center gap-4">
                                    <FileIcon size={48} className="text-slate-400" />
                                    <p>תצוגה מקדימה לא זמינה לסוג קובץ זה.</p>
                                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline">
                                        הורד כדי לצפות
                                    </a>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="p-6 border-none shadow-xl shadow-slate-200/50 rounded-2xl space-y-6">
                        <h2 className="text-lg font-bold text-slate-800">מידע טכני</h2>
                        
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <Calendar size={16} /> הועלה בתאריך
                                </span>
                                <span className="font-medium text-slate-900 text-left">
                                    {file.createdAt ? format(file.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: he }) : 'לא ידוע'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <FileIcon size={16} /> גודל הקובץ
                                </span>
                                <span className="font-medium text-slate-900" dir="ltr">
                                    {formatBytes(file.size)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <ImageIcon size={16} /> סוג הקובץ
                                </span>
                                <Badge variant={file.type.includes('pdf') ? 'warning' : 'neutral'}>
                                    {displayType}
                                </Badge>
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <User size={16} /> הועלה ע"י
                                </span>
                                <span className="font-medium text-slate-900 max-w-[120px] truncate" title={file.uploadedBy || 'מערכת'}>
                                    {file.uploadedBy || 'מערכת'}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleDelete}
                title="מחיקת קובץ"
                message="האם אתה בטוח שברצונך למחוק קובץ זה? פעולה זו תסיר את הקובץ מהאחסון ולא ניתנת לביטול."
                variant="danger"
            />
        </div>
    );
};
