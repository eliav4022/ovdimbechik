import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
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
import { getFileUrl } from '../../lib/utils';

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [fileToEdit, setFileToEdit] = useState<SiteFile | null>(null);
    const [editFileName, setEditFileName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadPassword, setUploadPassword] = useState('');
    const [systemPassword, setSystemPassword] = useState('');
    const [maxFileSizeMB, setMaxFileSizeMB] = useState(5);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [customFileName, setCustomFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
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

    const validateAndSetFile = (file: File) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
            toast('סוג קובץ אינו נתמך (רק תמונות, מסמכי PDF ו-Word)', 'error');
            return;
        }

        if (file.size > maxFileSizeMB * 1024 * 1024) {
            toast(`גודל קובץ חורג מ-${maxFileSizeMB}MB`, 'error');
            return;
        }

        setSelectedFile(file);
        setCustomFileName(file.name);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        if (!user) {
            toast('רק משתמש מחובר יכול להעלות קבצים', 'error');
            return;
        }

        if (systemPassword && uploadPassword !== systemPassword) {
            toast('סיסמת העלאה שגויה', 'error');
            return;
        }

        setUploading(true);
        try {
            const finalName = customFileName.trim() || selectedFile.name;
            const storageRef = ref(storage, `cvs/${user.uid}/admin_${Date.now()}_${finalName}`);
            
            // Convert to byte array to bypass Blob/iframe issues in Firebase SDK
            const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
            
            await uploadBytes(storageRef, fileBytes, { contentType: selectedFile.type });
            const url = window.location.origin + '/file/' + storageRef.fullPath;

            await addDoc(collection(db, 'files'), {
                name: finalName,
                url,
                type: selectedFile.type,
                size: selectedFile.size,
                createdAt: serverTimestamp(),
                uploadedBy: user?.uid
            });

            toast('הקובץ הועלה בהצלחה', 'success');
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            setCustomFileName('');
            setUploadPassword('');
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
        if (!window.confirm('האם אתה בטוח שברצונך למחוק קובץ זה להעברה לסל המחזור?')) return;
        
        try {
            const { softDelete } = await import('../../lib/adminUtils');
            await softDelete({
                collectionName: 'files',
                id: file.id,
                deletedBy: user?.uid || 'admin',
                reason: 'נמחק ממסך ניהול קבצים'
            });
            
            toast('הקובץ הועבר לסל מחזור בהצלחה', 'success');
        } catch (error) {
            console.error("Error deleting file:", error);
            toast('שגיאה במחיקת קובץ', 'error');
        }
    };

    const handleEdit = (file: SiteFile) => {
        setFileToEdit(file);
        setEditFileName(file.name);
        setIsEditModalOpen(true);
    };

    const saveEdit = async () => {
        if (!fileToEdit || !editFileName.trim()) return;
        
        try {
            await updateDoc(doc(db, 'files', fileToEdit.id), {
                name: editFileName.trim()
            });
            toast('שם הקובץ עודכן בהצלחה', 'success');
            setIsEditModalOpen(false);
            setFileToEdit(null);
            setEditFileName('');
        } catch (error) {
            console.error("Error updating file name:", error);
            toast('שגיאה בעדכון שם הקובץ', 'error');
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
                const cleanUrl = getFileUrl(file.url);
                if (file.type.startsWith('image/')) {
                    return (
                        <a href={cleanUrl} target="_blank" rel="noopener noreferrer" title="לצפייה" className="block w-12 h-12 rounded-lg bg-slate-100 border overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity">
                            <img src={cleanUrl} alt={file.name} className="w-full h-full object-cover" />
                        </a>
                    );
                }
                return (
                    <a href={cleanUrl} target="_blank" rel="noopener noreferrer" title="לצפייה" className="block w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:opacity-80 transition-opacity">
                        <File size={24} />
                    </a>
                );
            }
        },
        {
            key: 'name',
            header: 'שם קובץ',
            sortable: true,
            render: (file: SiteFile) => {
                const cleanUrl = getFileUrl(file.url);
                return (
                <div className="flex flex-col">
                    <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-900 max-w-[200px] truncate hover:text-indigo-600 transition-colors" title={file.name}>{file.name}</a>
                    <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                </div>
                );
            }
        },
        {
            key: 'type',
            header: 'סוג',
            render: (file: SiteFile) => {
                let displayType = 'תמונה';
                if (file.type.includes('pdf')) displayType = 'PDF';
                else if (file.type.includes('word') || file.type.includes('document')) displayType = 'Word';
                else if (file.type.includes('png')) displayType = 'PNG';
                else if (file.type.includes('jpeg') || file.type.includes('jpg')) displayType = 'JPG';
                else if (file.type.includes('webp')) displayType = 'WEBP';
                else if (file.type.includes('gif')) displayType = 'GIF';

                return (
                    <Badge variant={file.type.includes('pdf') ? 'warning' : 'neutral'}>
                        {displayType}
                    </Badge>
                );
            }
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
            render: (file: SiteFile) => {
                const cleanUrl = getFileUrl(file.url);
                return (
                <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            navigator.clipboard.writeText(cleanUrl);
                            toast('הקישור הועתק ללוח', 'success');
                        }}
                    >
                        <Copy size={16} /> העתק קישור
                    </Button>
                    <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                       <Link size={16} />
                    </a>
                </div>
                );
            }
        }
    ];

    if (loading) return <div>טוען קבצים...</div>;

    return (
        <div className="space-y-6">
            <AdminTable
                title="ניהול ושיתוף קבצים"
                description="העלאה וניהול של תמונות ומסמכי PDF ו-Word לשימוש כללי באתר (באנרים לחברות, מסמכים נלווים, וכד')"
                data={files}
                columns={columns}
                onAdd={() => setIsUploadModalOpen(true)}
                onDelete={handleDelete}
                onEdit={handleEdit}
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
                    {!selectedFile ? (
                        <div 
                            className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                                isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 pointer-events-none">
                                <UploadCloud size={40} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2 pointer-events-none">לחץ לבחירת קובץ או גרור לכאן</h3>
                            <p className="text-slate-500 font-medium pointer-events-none">קבצי תמונה, PDF ו-Word נתמכים. עד {maxFileSizeMB}MB.</p>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                                    {selectedFile.type.includes('pdf') ? <File size={32} /> : <ImageIcon size={32} />}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-slate-800 font-bold truncate">{selectedFile.name}</p>
                                    <p className="text-slate-500 text-sm">{formatBytes(selectedFile.size)}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedFile(null)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    disabled={uploading}
                                >
                                    החלף
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">שם לקובץ (אופציונלי - יופיע בניהול)</label>
                                <input 
                                    type="text" 
                                    value={customFileName}
                                    onChange={(e) => setCustomFileName(e.target.value)}
                                    placeholder="הזן שם לקובץ..."
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                                    disabled={uploading}
                                />
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={uploading || (!!systemPassword && !uploadPassword)}
                                className={`w-full py-3 rounded-xl font-bold transition-all ${
                                    uploading ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                                }`}
                            >
                                {uploading ? 'מעלה קובץ, אנא המתן...' : 'העלה קובץ'}
                            </button>
                        </div>
                    )}
                </div>
            </Modal>
            <Modal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)}
                title="עריכת שם קובץ"
            >
                <div className="space-y-6 text-right" dir="rtl">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">שם קובץ חדש</label>
                        <input 
                            type="text" 
                            value={editFileName}
                            onChange={(e) => setEditFileName(e.target.value)}
                            placeholder="הזן שם לקובץ..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={saveEdit}
                            disabled={!editFileName.trim() || editFileName === fileToEdit?.name}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                                !editFileName.trim() || editFileName === fileToEdit?.name ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                            }`}
                        >
                            שמור שינויים
                        </button>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-6 py-3 rounded-xl font-bold transition-all bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                        >
                            ביטול
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
