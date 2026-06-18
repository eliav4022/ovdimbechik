import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { FileText, Download, CheckCircle, Clock, XCircle, User as UserIcon, Building2, Eye, MessageCircle, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { Application, ApplicationStatus, Job } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getFileUrl } from '../../lib/utils';

export const AdminApplications: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [applicationToEdit, setApplicationToEdit] = useState<any | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState<any | null>(null);
    
    // Bulk message modal
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [selectedAppsForMessage, setSelectedAppsForMessage] = useState<any[]>([]);

    const [newApplication, setNewApplication] = useState({
        jobId: '',
        seekerId: '',
        applicantName: '',
        applicantEmail: '',
        applicantPhone: '',
    });
    
    // We fetch them with job details joined conceptually, but since we are simple, we might just load raw
    // Application already has jobId, employerId, etc.
    const [seekers, setSeekers] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);

    useEffect(() => {
        const qApps = query(collection(db, 'applications'));
        const unsubApps = onSnapshot(qApps, (snapshot) => {
            const tempApps = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Application))
                .filter(a => !a.deletedAt);
            
            // Sort by createdAt descending initially
            tempApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            setApplications(tempApps);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching apps:", error);
            toast('שגיאה בטעינת המועמדויות: ' + error.message, 'error');
            setLoading(false);
        });

        const qJobs = query(collection(db, 'jobs'));
        const unsubJobs = onSnapshot(qJobs, (snapshot) => {
            setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((j: any) => !j.deletedAt));
        });

        const qSeekers = query(collection(db, 'users'), where('role', '==', 'SEEKER'));
        const unsubSeekers = onSnapshot(qSeekers, (snapshot) => {
            setSeekers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((u: any) => !u.deletedAt));
        });

        return () => {
            unsubApps();
            unsubJobs();
            unsubSeekers();
        };
    }, []);

    // Local Join to prevent DB quota exhaustion on 10k apps
    const appsWithJobs = React.useMemo(() => {
        return applications.map((app: any) => {
            const job = jobs.find(j => j.id === app.jobId);
            return {
                ...app,
                jobTitle: job ? job.title : 'משרה לא זמינה',
                companyName: job ? job.companyName : 'לא זמין'
            };
        });
    }, [applications, jobs]);


    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const appId = 'app_' + Date.now();
            
            const selectedJob = jobs.find(j => j.id === newApplication.jobId);
            const selectedSeeker = seekers.find(s => s.uid === newApplication.seekerId || s.id === newApplication.seekerId);
            
            await setDoc(doc(db, 'applications', appId), {
                jobId: newApplication.jobId,
                seekerId: newApplication.seekerId,
                employerId: selectedJob?.employerId || 'system',
                applicantName: newApplication.applicantName || selectedSeeker?.displayName || '',
                applicantEmail: newApplication.applicantEmail || selectedSeeker?.email || '',
                applicantPhone: newApplication.applicantPhone || selectedSeeker?.phone || '',
                status: ApplicationStatus.NEW,
                createdAt: new Date().toISOString()
            });
            
            toast('מועמדות חדשה התווספה בהצלחה', 'success');
            setIsAddModalOpen(false);
            setNewApplication({ jobId: '', seekerId: '', applicantName: '', applicantEmail: '', applicantPhone: '' });
        } catch (error) {
            console.error("Error adding application:", error);
            toast('שגיאה בהוספת מועמדות', 'error');
        }
    };

    const handleEditOpen = (application: any) => {
        setApplicationToEdit(application);
        setIsEditModalOpen(true);
    };

    const handleClone = (application: any) => {
        setNewApplication({
            jobId: application.jobId || '',
            seekerId: application.seekerId || '',
            applicantName: application.applicantName ? application.applicantName + ' (עותק)' : '',
            applicantEmail: application.applicantEmail || '',
            applicantPhone: application.applicantPhone || '',
            
        });
        setIsAddModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applicationToEdit) return;
        try {
            await setDoc(doc(db, 'applications', applicationToEdit.id), {
                applicantName: applicationToEdit.applicantName,
                applicantEmail: applicationToEdit.applicantEmail,
                applicantPhone: applicationToEdit.applicantPhone || '',
                status: applicationToEdit.status,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            toast('המועמדות עודכנה בהצלחה', 'success');
            setIsEditModalOpen(false);
            setApplicationToEdit(null);
        } catch (error) {
            console.error("Error updating application:", error);
            toast('שגיאה בעדכון המועמדות', 'error');
        }
    };

    const handleDelete = (application: any) => {
        setApplicationToDelete(application);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async (reason: string) => {
        if (!applicationToDelete || !currentUser) return;
        try {
            const { softDelete } = await import('../../lib/adminUtils');
            await softDelete({
                collectionName: 'applications',
                id: applicationToDelete.id,
                deletedBy: currentUser.uid,
                reason
            });
            
            toast('המועמדות נמחקה והועברה לסל מחזור', 'success');
        } catch (error) {
            console.error("Delete failed:", error);
            toast('שגיאה במחיקה', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setApplicationToDelete(null);
        }
    };

    const handleStatusChange = async (application: any, status: string) => {
        try {
            await setDoc(doc(db, 'applications', application.id), {
                status,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            toast(`סטטוס המועמדות שונה ל-${status}`, 'success');
        } catch (error) {
            console.error("Error updating status:", error);
            toast('שגיאה בעדכון הסטטוס', 'error');
        }
    };

    const handleBulkDelete = async (items: any[]) => {
        if (!currentUser) return;
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק ${items.length} מועמדויות לסל מחזור?`)) return;
        
        try {
            const { softDelete } = await import('../../lib/adminUtils');
            const promises = items.map(item => 
                softDelete({
                    collectionName: 'applications',
                    id: item.id,
                    deletedBy: currentUser.uid,
                    reason: 'מחיקה מרוכזת'
                })
            );
            await Promise.all(promises);
            toast(`${items.length} מועמדויות הועברו לסל מחזור`, 'success');
        } catch (e) {
            toast('שגיאה במחיקה מרוכזת', 'error');
        }
    };

    const handleBulkStatusChange = async (items: any[], status: string) => {
        try {
            const promises = items.map(item => 
                setDoc(doc(db, 'applications', item.id), { 
                    status,
                    updatedAt: new Date().toISOString()
                }, { merge: true })
            );
            await Promise.all(promises);
            toast(`הסטטוס עבור ${items.length} מועמדויות עודכן ל-${status}`, 'success');
        } catch (e) {
            toast('שגיאה בעדכון סטטוס מרוכז', 'error');
        }
    };

    const openBulkMessageModal = (items: any[]) => {
        setSelectedAppsForMessage(items);
        setMessageContent('');
        setIsMessageModalOpen(true);
    };

    const sendBulkMessage = () => {
        // Here you would integrate with n8n, WhatsApp API, or backend logic
        console.log("Sending message to:", selectedAppsForMessage.map(a => a.applicantEmail), "Content:", messageContent);
        toast(`ההודעה נשלחה בהצלחה ל-${selectedAppsForMessage.length} מועמדים (הדגמה)`, 'success');
        setIsMessageModalOpen(false);
    };

    const getStatusBadge = (status: string) => {
        const s = status?.toLowerCase() || '';
        
        switch (true) {
            case s.includes('new') || s.includes('submitted'):
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 text-[10px]"><Clock size={12} className="ml-1 inline" /> הוגש</Badge>;
            case s.includes('review') || s.includes('progress') || s.includes('viewed'):
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 text-[10px]"><Eye size={12} className="ml-1 inline" /> בבחינה</Badge>;
            case s.includes('shortlist') || s.includes('interview'):
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 text-[10px]"><CheckCircle size={12} className="ml-1 inline" /> שורטליסט / ראיון</Badge>;
            case s.includes('hire') || s.includes('accepted'):
                return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600 text-[10px]"><CheckCircle size={12} className="ml-1 inline" /> התקבל</Badge>;
            case s.includes('reject'):
                return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300 text-[10px]"><XCircle size={12} className="ml-1 inline" /> נדחה</Badge>;
            default:
                return <Badge variant="neutral" className="text-[10px]">{status}</Badge>;
        }
    };

    const bulkActions = [
        { label: 'מחיקה מרוכזת', action: handleBulkDelete, icon: Trash2 },
        { label: 'שליחת הודעה', action: openBulkMessageModal, icon: MessageCircle },
        { label: 'סמן כדחויה', action: (items: any[]) => handleBulkStatusChange(items, ApplicationStatus.REJECTED), icon: XCircle },
        { label: 'סמן כשייך (שורטליסט)', action: (items: any[]) => handleBulkStatusChange(items, ApplicationStatus.INTERVIEW), icon: CheckCircle },
    ];

    const columns = [
        { 
            key: 'applicant', 
            header: 'שם מועמד',
            render: (a: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 shadow-sm">
                        {a.applicantName ? a.applicantName.charAt(0).toUpperCase() : <UserIcon size={18} />}
                    </div>
                    <div>
                        <Link to={`/admin/users/${a.seekerId}`} className="font-black text-slate-900 leading-tight hover:text-indigo-600 hover:underline">{a.applicantName}</Link>
                        <p className="text-[10px] text-slate-400 font-bold tracking-wider">{a.applicantEmail}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'job',
            header: 'עבור משרה',
            render: (a: any) => (
                <div className="flex flex-col">
                    <Link to={`/admin/jobs/${a.jobId}`} className="font-bold text-slate-700 text-sm hover:text-indigo-600 hover:underline">{a.jobTitle}</Link>
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Building2 size={10} /> {a.companyName}
                    </span>
                </div>
            )
        },
        {
            key: 'status',
            header: 'סטטוס מגייס',
            render: (a: any) => getStatusBadge(a.status)
        },
        {
            key: 'cv',
            header: 'קורות חיים',
            render: (a: any) => (
                a.cvUrl ? (
                    <div className="flex items-center gap-2">
                         <a href={getFileUrl(a.cvUrl)} target="_blank" rel="noreferrer" title="תצוגה מקדימה" className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:text-white transition-colors hover:bg-indigo-600">
                             <Eye size={14} />
                         </a>
                         <a href={getFileUrl(a.cvUrl)} download target="_blank" rel="noreferrer" title="הורדה" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-brand-dark transition-colors hover:bg-slate-100">
                            <Download size={14} />
                         </a>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400">חסר תמונת קורות חיים</span>
                )
            )
        },
        { 
            key: 'createdAt', 
            header: 'תאריך הגשה',
            render: (a: any) => <span className="text-xs text-slate-500 font-mono">{new Date(a.createdAt).toLocaleDateString('he-IL')}</span>
        }
    ];

    return (
        <>
            <AdminTable 
                title="ניהול מועמדויות (כללי)"
                description="צפייה וניהול של כל המועמדויות שנשלחו דרך המערכת. אפשר לסמן מספר בקשות ולבצע פעולות מרוכזות."
                data={appsWithJobs}
                columns={columns}
                searchFields={['applicantName', 'applicantEmail', 'jobTitle']}
                onAdd={() => setIsAddModalOpen(true)}
                onEdit={handleEditOpen}
                onClone={handleClone}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                bulkActions={bulkActions}
                filters={[
                    { 
                        key: 'status', 
                        label: 'סטטוס מועמדות', 
                        options: [
                            { label: 'התקבלו', value: ApplicationStatus.HIRED },
                            { label: 'נדחו', value: ApplicationStatus.REJECTED },
                            { label: 'בבחינה', value: ApplicationStatus.REVIEWING },
                            { label: 'חדשים', value: ApplicationStatus.NEW },
                            { label: 'בראיון', value: ApplicationStatus.INTERVIEW },
                        ] 
                    }
                ]}
            />

            {/* Modals... */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="הוספת מועמדות חדשה"
            >
                <form onSubmit={handleAdd} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">בחירת משרה</label>
                        <select 
                            required
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            value={newApplication.jobId}
                            onChange={(e) => setNewApplication(prev => ({...prev, jobId: e.target.value}))}
                        >
                            <option value="">בחר משרה...</option>
                            {jobs.map(j => (
                                <option key={j.id} value={j.id}>{j.title} ({j.companyName})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">בחירת מועמד (משתמש הקיים במערכת)</label>
                        <select 
                            required
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            value={newApplication.seekerId}
                            onChange={(e) => {
                                const sid = e.target.value;
                                const seeker = seekers.find(s => s.uid === sid || s.id === sid);
                                setNewApplication(prev => ({
                                    ...prev, 
                                    seekerId: sid,
                                    applicantName: seeker ? seeker.displayName : prev.applicantName,
                                    applicantEmail: seeker ? seeker.email : prev.applicantEmail
                                }));
                            }}
                        >
                            <option value="">בחר מועמד...</option>
                            {seekers.map(s => (
                                <option key={s.id || s.uid} value={s.id || s.uid}>{s.displayName} ({s.email})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">שם המועמד (לתצוגה)</label>
                        <Input 
                            required
                            placeholder="למשל: שיר כהן..." 
                            value={newApplication.applicantName}
                            onChange={(e) => setNewApplication(prev => ({...prev, applicantName: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">אימייל</label>
                        <Input 
                            type="email"
                            required
                            placeholder="shir@example.com" 
                            value={newApplication.applicantEmail}
                            onChange={(e) => setNewApplication(prev => ({...prev, applicantEmail: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                        <Input 
                            placeholder="למשל: 054-1234567..." 
                            value={newApplication.applicantPhone}
                            onChange={(e) => setNewApplication(prev => ({...prev, applicantPhone: e.target.value}))}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>ביטול</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור מועמדות</Button>
                    </div>
                </form>
            </Modal>

            {applicationToDelete && (
                <TwoStepConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="מחיקת מועמדות"
                    message={`האם אתה בטוח שברצונך למחוק את המועמדות של ${applicationToDelete.applicantName}?`}
                    confirmWord="מחק"
                />
            )}

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="עריכת מועמדות"
            >
                {applicationToEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">שם המועמד</label>
                            <Input 
                                required
                                value={applicationToEdit.applicantName}
                                onChange={(e) => setApplicationToEdit({ ...applicationToEdit, applicantName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">אימייל</label>
                            <Input 
                                type="email"
                                required
                                value={applicationToEdit.applicantEmail}
                                onChange={(e) => setApplicationToEdit({ ...applicationToEdit, applicantEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                            <Input 
                                value={applicationToEdit.applicantPhone || ''}
                                onChange={(e) => setApplicationToEdit({ ...applicationToEdit, applicantPhone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">סטטוס</label>
                            <select 
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                                value={applicationToEdit.status}
                                onChange={(e) => setApplicationToEdit({ ...applicationToEdit, status: e.target.value })}
                            >
                                {Object.values(ApplicationStatus).filter(s => ['New', 'Reviewing', 'Interview', 'Hired', 'Rejected'].includes(s)).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>ביטול</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור שינויים</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Bulk Message Modal */}
            <Modal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                title={`שליחת הודעה ל-${selectedAppsForMessage.length} מועמדים`}
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">תוכן ההודעה</label>
                        <textarea 
                            className="w-full h-32 bg-slate-50 border-none rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="הקלד כאן את הודעת ה-WhatsApp / Email שתישלח לכל המועמדים הנבחרים..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            שים לב: לחיצה על 'שלח' תפעיל טריגר שישלח את ההודעה למועמדים באמצעות ה-API (הדגמה).
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsMessageModalOpen(false)}>ביטול</Button>
                        <Button type="button" onClick={sendBulkMessage} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            שלח כעת
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

