import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Trash2, File, ImageIcon, Copy, UploadCloud, Link } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../lib/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface SiteFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: any;
  uploadedBy: string;
}

export const AdminFiles: React.FC = () => {
    const [files, setFiles] = useState<SiteFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadPassword, setUploadPassword] = useState('');
    const [systemPassword, setSystemPassword] = useState('');
    const [maxFileSizeMB, setMaxFileSizeMB] = useState(5);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        // Fetch settings for upload constraints
        const fetchSettings = async () => {
            try {
                const sysSnap = await getDoc(doc(db, 'settings', 'system'));
                if (sysSnap.exists()) {
                    setSystemPassword(sysSnap.data().fileUploadPassword || '');
                    setMaxFileSizeMB(sysSnap.data().maxAdminUploadSizeMB || 5);
                }
            } catch (err) {
                console.error("Error fetching system settings for files tab:", err);
            }
        };
        fetchSettings();

        const q = query(collection(db, 'files'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const filesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SiteFile[];
            setFiles(filesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching files:", error);
            toast('שגיאה בטעינת קבצים', 'error');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!user) {
            toast('רק משתמש מחובר יכול להעלות קבצים', 'error');
            return;
        }

        if (systemPassword && uploadPassword !== systemPassword) {
            toast('סיסמת העלאה שגויה', 'error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Validation
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast('סוג קובץ אינו נתמך (רק תמונות או PDF)', 'error');
            return;
        }

        if (file.size > maxFileSizeMB * 1024 * 1024) {
            toast(`גודל קובץ חורג מ-${maxFileSizeMB}MB`, 'error');
            return;
        }

        setUploading(true);
        try {
            const storageRef = ref(storage, `site_files/${Date.now()}_${file.name}`);
            
            // Convert to byte array to bypass Blob/iframe issues in Firebase SDK
            const fileBytes = new Uint8Array(await file.arrayBuffer());
            
            await uploadBytes(storageRef, fileBytes, { contentType: file.type });
            const url = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'files'), {
                name: file.name,
                url,
                type: file.type,
                size: file.size,
                createdAt: serverTimestamp(),
                uploadedBy: user?.uid
            });

            toast('הקובץ הועלה בהצלחה', 'success');
            setIsUploadModalOpen(false);
        } catch (error) {
            console.error("Error uploading file:", error);
            toast('שגיאה בהעלאת קובץ', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (file: SiteFile) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק קובץ זה לצמיתות?')) return;
        
        try {
            // Because we don't store the exact storage path, we can extract it from the URL
            // Or ideally we should have stored `storagePath`. For now, we try to extract it.
            try {
               const fileRef = ref(storage, file.url);
               await deleteObject(fileRef);
            } catch (err) {
               console.warn("Could not delete from storage (maybe already deleted or weird URL). Proceeding to delete doc.", err);
            }
            
            await deleteDoc(doc(db, 'files', file.id));
            toast('הקובץ נמחק בהצלחה', 'success');
        } catch (error) {
            console.error("Error deleting file:", error);
            toast('שגיאה במחיקת קובץ', 'error');
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const columns = [
        {
            key: 'preview',
            header: 'תצוגה',
            render: (file: SiteFile) => {
                if (file.type.startsWith('image/')) {
                    return (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border overflow-hidden flex items-center justify-center">
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        </div>
                    );
                }
                return (
                    <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                        <File size={24} />
                    </div>
                );
            }
        },
        {
            key: 'name',
            header: 'שם קובץ',
            sortable: true,
            render: (file: SiteFile) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 max-w-[200px] truncate" title={file.name}>{file.name}</span>
                    <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                </div>
            )
        },
        {
            key: 'type',
            header: 'סוג',
            render: (file: SiteFile) => (
                <Badge variant={file.type.includes('pdf') ? 'warning' : 'neutral'}>
                    {file.type.includes('pdf') ? 'PDF' : 'תמונה'}
                </Badge>
            )
        },
        {
            key: 'createdAt',
            header: 'הועלה בתאריך',
            sortable: true,
            render: (file: SiteFile) => file.createdAt ? (
                <span className="text-sm text-slate-600">
                    {formatDistanceToNow(file.createdAt.toDate(), { addSuffix: true, locale: he })}
                </span>
            ) : 'לא זמין'
        },
        {
            key: 'link',
            header: 'קישור',
            render: (file: SiteFile) => (
                <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            navigator.clipboard.writeText(file.url);
                            toast('הקישור הועתק ללוח', 'success');
                        }}
                    >
                        <Copy size={16} /> העתק קישור
                    </Button>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                       <Link size={16} />
                    </a>
                </div>
            )
        }
    ];

    if (loading) return <div>טוען קבצים...</div>;

    return (
        <div className="space-y-6">
            <AdminTable
                title="ניהול ושיתוף קבצים"
                description="העלאה וניהול של תמונות ומסמכי PDF לשימוש כללי באתר (באנרים לחברות, מסמכים נלווים, וכד')"
                data={files}
                columns={columns}
                onAdd={() => setIsUploadModalOpen(true)}
                onDelete={handleDelete}
                searchFields={['name']}
            />

            <Modal 
                isOpen={isUploadModalOpen} 
                onClose={() => !uploading && setIsUploadModalOpen(false)}
                title="העלאת קובץ חדש"
            >
                <div className="space-y-6 text-right" dir="rtl">
                    {systemPassword && (
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">סיסמת מערכת להעלאה</label>
                            <input 
                                type="password" 
                                value={uploadPassword}
                                onChange={(e) => setUploadPassword(e.target.value)}
                                placeholder="הזן סיסמה..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700" 
                            />
                        </div>
                    )}
                    <div 
                        className="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                            <UploadCloud size={40} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">לחץ כאן כדי לבחור קובץ להעלאה</h3>
                        <p className="text-slate-500 font-medium">קבצי תמונה (JPG, PNG, WEBP) ו-PDF נתמכים. עד {maxFileSizeMB}MB.</p>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                    </div>
                    
                    {uploading && (
                        <div className="mt-4 text-center">
                            <p className="text-sm font-bold text-indigo-600 animate-pulse">מעלה קובץ, אנא המתן...</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};
