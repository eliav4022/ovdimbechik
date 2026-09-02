import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, documentId, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { User, Job, Application, UserRole } from '../../types';
import { 
    ArrowRight, UserCircle, Briefcase, FileText, CheckCircle, XCircle, 
    Mail, Clock, CalendarDays, Loader2, Edit2, Lock, User as UserIcon, 
    Trash2, ShieldCheck, ShieldAlert, Download, MapPin, Sparkles, Award, Phone 
} from 'lucide-react';
import { AdminTable } from '../../components/admin/AdminTable';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { UserPermissionsEditor } from '../../components/admin/UserPermissionsEditor';
import { useAuth } from '../../lib/AuthContext';
import { softDelete } from '../../lib/adminUtils';
import { AdminEmployerDetail } from './AdminEmployerDetail';

export const AdminUserDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    const [user, setUser] = useState<User | null>(null);
    const [savedJobs, setSavedJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'related'>('general');
    
    // Role & Permissions Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState<{ role: UserRole, permissions: string[] }>({ role: UserRole.SEEKER, permissions: [] });

    // General Edit Modal
    const [isGeneralEditOpen, setIsGeneralEditOpen] = useState(false);
    const [generalEditData, setGeneralEditData] = useState<any>(null);
    const [newPasswordForUser, setNewPasswordForUser] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Delete / Archive Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;
            setLoading(true);

            try {
                // 1. Fetch main user document
                const userRef = doc(db, 'users', id);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    toast('משתמש לא נמצא', 'error');
                    navigate('/admin/users');
                    return;
                }

                const userData = { id: userSnap.id, ...userSnap.data() } as User;
                setUser(userData);
                setEditData({ role: userData.role || UserRole.SEEKER, permissions: userData.permissions || [] });

                // 2. Fetch specific related lists if user is SEEKER or ADMIN
                if (userData.role !== UserRole.EMPLOYER) {
                    const savedJobIds: string[] = userData.savedJobs || [];

                    // 2a. Fetch Saved Jobs
                    if (savedJobIds.length > 0) {
                        try {
                            const chunks = [];
                            for (let i = 0; i < savedJobIds.length; i += 10) {
                                chunks.push(savedJobIds.slice(i, i + 10));
                            }
                            
                            const jobPromises = chunks.map(chunk => 
                                getDocs(query(collection(db, 'jobs'), where(documentId(), 'in', chunk)))
                            );
                            
                            const jobSnaps = await Promise.all(jobPromises);
                            const loadedJobs: Job[] = [];
                            jobSnaps.forEach(snap => {
                                snap.docs.forEach(d => loadedJobs.push({ id: d.id, ...d.data() } as unknown as Job));
                            });
                            setSavedJobs(loadedJobs);
                        } catch (e) {
                            console.error("Error fetching saved jobs:", e);
                        }
                    }

                    // 2b. Fetch Applications
                    try {
                        const appsQuery = query(collection(db, 'applications'), where('seekerId', '==', id));
                        const appsSnap = await getDocs(appsQuery);
                        const loadedApps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Application));
                        setApplications(loadedApps);
                    } catch (e) {
                        console.error("Error fetching applications:", e);
                    }
                }
            } catch (err: any) {
                console.error("Error fetching user detail:", err);
                toast('שגיאה בטעינת נתוני משתמש', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id, toast, navigate]);

    // Unify Employer Experience: If the user is an EMPLOYER, render the full AdminEmployerDetail view!
    if (user && user.role === UserRole.EMPLOYER) {
        return <AdminEmployerDetail />;
    }

    const handleGeneralEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!generalEditData || !id) return;
        try {
            if (!generalEditData.email || !generalEditData.displayName) {
               toast('נא למלא את כל שדות החובה', 'error');
               return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(generalEditData.email)) {
               toast('נא להזין כתובת אימייל תקינה', 'error');
               return;
            }
            
            const updates: any = {
                displayName: generalEditData.displayName,
                email: generalEditData.email,
                phone: generalEditData.phone || null,
                location: generalEditData.location || null,
                photoURL: generalEditData.photoURL || null,
                bio: generalEditData.bio || null,
                seekerProfile: {
                    ...(user?.seekerProfile || {}),
                    jobTitle: generalEditData.jobTitle || generalEditData.seekerProfile?.jobTitle || '',
                    yearsOfExperience: generalEditData.yearsOfExperience || generalEditData.seekerProfile?.yearsOfExperience || 0,
                    bio: generalEditData.bio || generalEditData.seekerProfile?.bio || '',
                },
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', id), updates, { merge: true });
            
            try {
                if (generalEditData.email !== user?.email) {
                    const token = await (await import('../../lib/firebase')).auth.currentUser?.getIdToken();
                    await fetch('/api/admin/update-user-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            targetUid: id,
                            newEmail: generalEditData.email
                        })
                    });
                }
            } catch (err) {
                 console.error("Failed to update email in Auth", err);
            }

            toast('המשתמש עודכן בהצלחה', 'success');
            setUser({ ...user, ...updates } as User);
            setIsGeneralEditOpen(false);
        } catch (error) {
            console.error("Error updating user:", error);
            toast('שגיאה בעדכון המשתמש', 'error');
        }
    };

    const handleToggleVerify = async () => {
        if (!user || !id) return;
        try {
            const nextStatus = !user.isVerified;
            await setDoc(doc(db, 'users', id), {
                isVerified: nextStatus,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setUser({ ...user, isVerified: nextStatus });
            toast(nextStatus ? 'המשתמש אומת בהצלחה' : 'אימות המשתמש בוטל', 'success');
        } catch (e) {
            toast('שגיאה בעדכון אימות', 'error');
        }
    };

    const handlePasswordReset = async () => {
        if (!generalEditData || !newPasswordForUser || newPasswordForUser.length < 6) {
            toast('חובה להזין סיסמה של 6 תווים לפחות', 'error');
            return;
        }
        setIsUpdatingPassword(true);
        try {
            const token = await (await import('../../lib/firebase')).auth.currentUser?.getIdToken();
            const res = await fetch('/api/admin/update-user-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetUid: id,
                    newPassword: newPasswordForUser
                })
            });
            const data = await res.json();
            if (data.success) {
                toast('הסיסמה עודכנה בהצלחה', 'success');
                setNewPasswordForUser('');
            } else {
                const errMsg = data.error === "Firebase Admin config missing" ? "יש להגדיר FIREBASE_SERVICE_ACCOUNT בהגדרות כדי לעדכן סיסמה" : data.error;
                toast(errMsg || 'שגיאה בעדכון הסיסמה', 'error');
            }
        } catch (err: any) {
             toast('שגיאה בתקשורת עם השרת', 'error');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !id) return;

        try {
            await setDoc(doc(db, 'users', id), {
                role: editData.role,
                permissions: editData.permissions,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            setUser({ ...user, role: editData.role, permissions: editData.permissions });
            toast('הגדרות המשתמש עודכנו בהצלחה', 'success');
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error updating user:", error);
            toast('שגיאה בעדכון המשתמש', 'error');
        }
    };

    const handleDeleteUser = async () => {
        if (!user || !id || !currentUser) return;
        try {
            await softDelete({
                collectionName: 'users',
                id: id,
                deletedBy: currentUser.uid,
                reason: 'ארכוב משתמש מדף הרשומה'
            });
            toast('המשתמש הועבר לארכיון בהצלחה', 'success');
            navigate('/admin/users');
        } catch (e) {
            console.error(e);
            toast('שגיאה בארכוב המשתמש', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) return null;

    const formatDate = (isoString?: string) => {
        if (!isoString) return 'לא ידוע';
        return format(new Date(isoString), 'dd/MM/yyyy HH:mm', { locale: he });
    };

    const savedJobColumns = [
        { key: 'title', header: 'משרה', render: (j: Job) => <Link to={`/admin/jobs/${j.id}`} className="font-bold text-slate-900 hover:text-indigo-600 hover:underline">{j.title}</Link> },
        { key: 'companyName', header: 'חברה' },
        { key: 'status', header: 'סטטוס', render: (j: Job) => <Badge variant="neutral">{j.status}</Badge> }
    ];

    const appsColumns = [
        { key: 'jobId', header: 'מזהה משרה', render: (a: any) => <Link to={`/admin/jobs/${a.jobId}`} className="font-bold text-slate-900 hover:text-indigo-600 hover:underline">{a.jobTitle || a.jobId}</Link> },
        { key: 'status', header: 'סטטוס', render: (a: Application) => <Badge variant={a.status === 'Hired' ? 'success' : a.status === 'Rejected' ? 'danger' : 'warning'}>{a.status}</Badge> },
        { key: 'createdAt', header: 'הוגש בתאריך', render: (a: any) => formatDate(a.createdAt ? (typeof a.createdAt === 'string' ? a.createdAt : a.createdAt.toDate?.()?.toISOString()) : undefined) }
    ];

    const cvUrl = user.cvUrl || user.seekerProfile?.cvUrl;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Synchronized Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/users')} 
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                    >
                        <ArrowRight size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle className="text-indigo-600" size={36} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    {user.fullName || user.displayName || 'משתמש ללא שם'}
                                    {user.isVerified && <ShieldCheck className="text-emerald-500" size={24} />}
                                </h1>
                                <Badge variant="brand" className="text-xs font-bold">{user.role}</Badge>
                            </div>
                            <p className="text-slate-500 font-mono text-xs mt-1">{user.email}</p>
                        </div>
                    </div>
                </div>
                
                {/* Synchronized Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                        onClick={() => {
                            setGeneralEditData({
                                ...user,
                                jobTitle: user.seekerProfile?.jobTitle || '',
                                yearsOfExperience: user.seekerProfile?.yearsOfExperience || 0,
                                bio: user.bio || user.seekerProfile?.bio || '',
                                location: (user as any).location || ''
                            });
                            setNewPasswordForUser('');
                            setIsGeneralEditOpen(true);
                        }}
                        leftIcon={<Edit2 size={16} />}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                    >
                        עריכה
                    </Button>

                    <Button 
                        onClick={handleToggleVerify}
                        leftIcon={user.isVerified ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                        className={`font-bold ${user.isVerified ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {user.isVerified ? 'מאומת' : 'אמת משתמש'}
                    </Button>

                    <Button 
                        onClick={() => {
                            setEditData({ role: user.role || UserRole.SEEKER, permissions: user.permissions || [] });
                            setIsEditModalOpen(true);
                        }}
                        leftIcon={<Lock size={16} />}
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold"
                    >
                        הרשאות ותפקיד
                    </Button>

                    <Button 
                        onClick={() => setIsDeleteModalOpen(true)}
                        leftIcon={<Trash2 size={16} />}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold"
                    >
                        ארכוב
                    </Button>
                </div>
            </div>

            {/* Metric Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">מועמדויות שהוגשו</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={18} /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 mt-2">{applications.length}</div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">הגשות למשרות במערכת</span>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">משרות שנשמרו</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase size={18} /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 mt-2">{savedJobs.length}</div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">משרות במועדפים</span>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">סטטוס קורות חיים</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Award size={18} /></div>
                    </div>
                    <div className="text-lg font-black text-slate-800 mt-2">
                        {cvUrl ? (
                            <span className="text-emerald-600 flex items-center gap-1.5">
                                <CheckCircle size={18} /> קובץ קיים
                            </span>
                        ) : (
                            <span className="text-slate-400">לא הועלו קו"ח</span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">קובץ מצורף לפרופיל</span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <UserCircle size={16} />
                    מידע כללי ופרופיל
                </button>
                <button 
                    onClick={() => setActiveTab('related')}
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'related' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Briefcase size={16} />
                    פעילות קשורה
                    <Badge variant="neutral" className="text-[10px] py-0 mr-1">{savedJobs.length + applications.length}</Badge>
                </button>
            </div>

            {/* Tab: General Info */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <h2 className="font-black text-lg text-slate-800">פרטי משתמש בסיסיים</h2>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                    setGeneralEditData({
                                        ...user,
                                        jobTitle: user.seekerProfile?.jobTitle || '',
                                        yearsOfExperience: user.seekerProfile?.yearsOfExperience || 0,
                                        bio: user.bio || user.seekerProfile?.bio || '',
                                        location: (user as any).location || ''
                                    });
                                    setIsGeneralEditOpen(true);
                                }}
                                className="text-indigo-600 font-bold"
                            >
                                <Edit2 size={14} className="mr-1" /> ערוך
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2"><Mail size={16}/> אימייל:</span>
                            <span className="col-span-2 text-sm font-bold text-slate-900 font-mono">{user.email}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2"><Clock size={16}/> תפקיד מערכת:</span>
                            <span className="col-span-2"><Badge variant="brand">{user.role}</Badge></span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2"><Phone size={16}/> טלפון:</span>
                            <span className="col-span-2 text-sm font-bold text-slate-900">{user.phone || 'לא הוזן'}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2"><MapPin size={16}/> מיקום:</span>
                            <span className="col-span-2 text-sm font-medium text-slate-800">{(user as any).location || 'ישראל'}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2"><CalendarDays size={16}/> תאריך הצטרפות:</span>
                            <span className="col-span-2 text-sm font-medium text-slate-800">{formatDate(user.createdAt)}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2"><Clock size={16}/> התחברות אחרונה:</span>
                            <span className="col-span-2 text-sm font-mono text-slate-800">{user.lastLogin ? formatDate(user.lastLogin) : 'לא ידוע'}</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <h2 className="font-black text-lg text-slate-800 border-b border-slate-50 pb-2">פרופיל מקצועי והרשאות</h2>
                        
                        {user.seekerProfile?.jobTitle && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <span className="text-slate-400 font-bold text-sm">תפקיד מבוקש:</span>
                                <span className="col-span-2 text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl">{user.seekerProfile.jobTitle}</span>
                            </div>
                        )}

                        {user.seekerProfile?.yearsOfExperience !== undefined && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <span className="text-slate-400 font-bold text-sm">שנות ניסיון:</span>
                                <span className="col-span-2 text-sm font-bold text-slate-800">{user.seekerProfile.yearsOfExperience} שנים</span>
                            </div>
                        )}

                        {cvUrl && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <span className="text-slate-400 font-bold text-sm flex items-center gap-1.5">
                                    <FileText size={16} /> קובץ קו"ח:
                                </span>
                                <div className="col-span-2 flex items-center gap-3">
                                    <a 
                                        href={cvUrl} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        <Download size={14} /> הורד / צפה בקובץ
                                    </a>
                                </div>
                            </div>
                        )}

                        {user.seekerProfile?.skills && user.seekerProfile.skills.length > 0 && (
                            <div className="py-2">
                                <span className="text-slate-400 font-bold text-sm block mb-1.5">כישורים ומיומנויות:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {user.seekerProfile.skills.map((skill, i) => (
                                        <Badge key={i} variant="brand" className="text-xs font-medium">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {user.permissions && user.permissions.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <span className="text-slate-400 font-bold text-sm">הרשאות מיוחדות:</span>
                                <div className="col-span-2 flex flex-wrap gap-1">
                                    {user.permissions.map(p => <Badge key={p} variant="neutral" className="text-[10px]">{p}</Badge>)}
                                </div>
                            </div>
                        )}

                        {(user.bio || user.seekerProfile?.bio) && (
                            <div className="pt-2">
                                <span className="text-slate-400 font-bold text-sm block mb-1">אודות המועמד:</span>
                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">{user.bio || user.seekerProfile?.bio}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Related Lists */}
            {activeTab === 'related' && (
                <div className="flex flex-col gap-10">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase size={20} className="text-indigo-600" />
                            <h2 className="text-xl font-black text-slate-800">משרות שנשמרו ({savedJobs.length})</h2>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <AdminTable 
                                  title="" 
                                  description="" 
                                  data={savedJobs} 
                                  columns={savedJobColumns} 
                                  searchFields={['title', 'companyName']} 
                                  onView={(j) => navigate(`/admin/jobs/${j.id}`)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={20} className="text-indigo-600" />
                            <h2 className="text-xl font-black text-slate-800">מועמדויות שהגיש ({applications.length})</h2>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <AdminTable 
                                  title="" 
                                  description="" 
                                  data={applications} 
                                  columns={appsColumns} 
                                  searchFields={['jobId', 'status']} 
                                  onView={(a) => navigate(`/admin/jobs/${a.jobId}`)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Permissions & Role */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="עריכת תפקיד והרשאות"
            >
                <form onSubmit={handleSaveEdit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">תפקיד המשתמש</label>
                        <select 
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            value={editData.role}
                            onChange={(e) => setEditData({ ...editData, role: e.target.value as UserRole })}
                        >
                            <option value={UserRole.SEEKER}>מחפש עבודה (עובד)</option>
                            <option value={UserRole.EMPLOYER}>מעסיק (מעביד)</option>
                            <option value={UserRole.SUPPORT_AGENT}>נציג תמיכה / אייגנט (Agent)</option>
                            <option value={UserRole.ADMIN}>מנהל מערכת (Admin)</option>
                            <option value={UserRole.SUPER_ADMIN}>סופר אדמין (Super Admin)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            שינוי תפקיד ישפיע על אפשרות הגישה הבסיסית של המשתמש.
                        </p>
                    </div>

                    <UserPermissionsEditor 
                        currentRole={editData.role as UserRole} 
                        permissions={editData.permissions} 
                        onChange={(perms) => setEditData({ ...editData, permissions: perms })} 
                    />

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>ביטול</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">שמור שינויים</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: General Edit */}
            <Modal
                isOpen={isGeneralEditOpen}
                onClose={() => setIsGeneralEditOpen(false)}
                title="עריכת פרטי משתמש"
            >
                {generalEditData && (
                    <form onSubmit={handleGeneralEditSubmit} className="space-y-4">
                        <div className="flex gap-4 items-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative">
                                {generalEditData.photoURL ? (
                                    <img src={generalEditData.photoURL} alt={generalEditData.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="text-slate-300" size={32} />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">תמונת פרופיל</label>
                                <input 
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const fileExt = file.name.split('.').pop();
                                            const storageRef = ref(storage, `cvs/admin_${Date.now()}.${fileExt}`);
                                            const fileBytes = new Uint8Array(await file.arrayBuffer());
                                            await uploadBytes(storageRef, fileBytes, { contentType: file.type });
                                            const url = window.location.origin + '/file/' + storageRef.fullPath;
                                            
                                            setGeneralEditData({ ...generalEditData, photoURL: url });
                                            toast('התמונה הועלתה בהצלחה', 'success');
                                        } catch (error) {
                                            console.error('Error uploading image:', error);
                                            toast('שגיאה בהעלאת התמונה', 'error');
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">שם מלא / תצוגה</label>
                            <Input 
                                required
                                value={generalEditData.displayName || ''}
                                onChange={(e) => setGeneralEditData({ ...generalEditData, displayName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">אימייל</label>
                            <Input 
                                type="email"
                                required
                                value={generalEditData.email || ''}
                                onChange={(e) => setGeneralEditData({ ...generalEditData, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">טלפון</label>
                                <Input 
                                    value={generalEditData.phone || ''}
                                    onChange={(e) => setGeneralEditData({ ...generalEditData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">מיקום</label>
                                <Input 
                                    value={generalEditData.location || ''}
                                    onChange={(e) => setGeneralEditData({ ...generalEditData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">תפקיד מבוקש</label>
                                <Input 
                                    placeholder="לדוגמה: מפתח Full-Stack"
                                    value={generalEditData.jobTitle || ''}
                                    onChange={(e) => setGeneralEditData({ ...generalEditData, jobTitle: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">שנות ניסיון</label>
                                <Input 
                                    type="number"
                                    min="0"
                                    value={generalEditData.yearsOfExperience || ''}
                                    onChange={(e) => setGeneralEditData({ ...generalEditData, yearsOfExperience: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">אודות</label>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                                placeholder="תיאור קצר..."
                                value={generalEditData.bio || ''}
                                onChange={(e) => setGeneralEditData({ ...generalEditData, bio: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-200 mt-4">
                            <label className="block text-sm font-bold text-slate-700 mb-1">איפוס סיסמה למשתמש</label>
                            <div className="flex gap-2">
                                <Input 
                                    type="text"
                                    placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                                    value={newPasswordForUser}
                                    onChange={(e) => setNewPasswordForUser(e.target.value)}
                                    className="flex-1"
                                />
                                <Button 
                                    type="button" 
                                    onClick={handlePasswordReset}
                                    disabled={isUpdatingPassword || newPasswordForUser.length < 6}
                                    className="bg-slate-800 hover:bg-slate-900 text-white shrink-0 font-bold"
                                >
                                    {isUpdatingPassword ? 'מעדכן...' : 'עדכן סיסמה'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <Button type="button" variant="ghost" onClick={() => setIsGeneralEditOpen(false)}>ביטול</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">שמור שינויים</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* TwoStepConfirmModal for archiving */}
            <TwoStepConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteUser}
                title="ארכוב משתמש"
                message={`האם אתה בטוח שברצונך להעביר את ${user.displayName || user.email} לארכיון?`}
                confirmWord="מחק"
            />
        </div>
    );
};
