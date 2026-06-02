import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, documentId, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Job, Application, UserRole } from '../../types';
import { ArrowRight, UserCircle, Briefcase, FileText, CheckCircle, XCircle, Mail, Clock, CalendarDays, Loader2, Edit2, Lock } from 'lucide-react';
import { AdminTable } from '../../components/admin/AdminTable';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { adminNavItems } from '../../components/admin/AdminSidebar';

export const AdminUserDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [savedJobs, setSavedJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'related'>('general');
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState<{ role: UserRole, permissions: string[] }>({ role: UserRole.SEEKER, permissions: [] });

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

                // 2. Fetch specific related lists if user is SEEKER
                if (userData.role === UserRole.SEEKER || userData.role === UserRole.ADMIN) {
                    let savedJobIds: string[] = userData.savedJobs || [];

                    // 2a. Fetch Saved Jobs using Promise.all/in queries
                    if (savedJobIds.length > 0) {
                        try {
                            // Firestore "in" query has a limit of 10. We chunk it.
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

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !id) return;
        
        // Validation: If changing from EMPLOYER to something else, check if they have jobs
        if (user.role === UserRole.EMPLOYER && editData.role !== UserRole.EMPLOYER) {
            try {
                const jobsQuery = query(collection(db, 'jobs'), where('employerId', '==', id));
                const jobsSnap = await getDocs(jobsQuery);
                if (!jobsSnap.empty) {
                    toast('לא ניתן לשנות תפקיד למעסיק שיש ברשותו משרות', 'error');
                    return;
                }
            } catch (error) {
                console.error("Error checking employer jobs:", error);
                toast('שגיאה בבדיקת משרות המעסיק', 'error');
                return;
            }
        }

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

    const togglePermission = (permId: string) => {
        let updatedPerms = [...editData.permissions];
        if (updatedPerms.includes(permId)) {
            updatedPerms = updatedPerms.filter(p => p !== permId);
        } else {
            updatedPerms.push(permId);
        }
        setEditData({ ...editData, permissions: updatedPerms });
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
        { key: 'title', header: 'משרה', render: (j: Job) => <span className="font-bold">{j.title}</span> },
        { key: 'companyName', header: 'חברה' },
        { key: 'status', header: 'סטטוס', render: (j: Job) => <Badge variant="neutral">{j.status}</Badge> }
    ];

    const appsColumns = [
        { key: 'jobId', header: 'ID משרה', render: (a: Application) => <span className="text-xs font-mono">{a.jobId}</span> },
        { key: 'status', header: 'סטטוס', render: (a: Application) => <Badge variant={a.status === 'Hired' ? 'success' : a.status === 'Rejected' ? 'danger' : 'warning'}>{a.status}</Badge> },
        { key: 'createdAt', header: 'הוגש בתאריך', render: (a: Application) => formatDate(a.createdAt) }
    ];

    const adminRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.CONTENT_MANAGER, UserRole.FINANCE_MANAGER] as string[];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                    >
                        <ArrowRight size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <UserCircle className="text-indigo-600" /> {user.fullName || user.displayName || 'משתמש ללא שם'}
                        </h1>
                        <p className="text-slate-500 font-mono text-sm mt-1">ID: {user.id || user.uid}</p>
                    </div>
                </div>
                
                <Button 
                    onClick={() => {
                        setEditData({ role: user.role || UserRole.SEEKER, permissions: user.permissions || [] });
                        setIsEditModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold"
                >
                    <Edit2 size={16} /> עריכת הרשאות ותפקיד
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-6">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    מידע כללי
                </button>
                <button 
                    onClick={() => setActiveTab('related')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'related' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    פעילות קשורה
                    <Badge variant="neutral" className="text-[10px] py-0">{savedJobs.length + applications.length}</Badge>
                </button>
            </div>

            {/* Tab: General Info */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <h2 className="font-black text-lg text-slate-800 border-b border-slate-50 pb-2">פרטי משתמש</h2>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2"><Mail size={16}/> אימייל</dt>
                            <dd className="col-span-2 text-sm font-bold text-slate-900">{user.email}</dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2"><Clock size={16}/> תפקיד</dt>
                            <dd className="col-span-2"><Badge variant="brand">{user.role}</Badge></dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2"><CheckCircle size={16}/> טלפון</dt>
                            <dd className="col-span-2 text-sm font-bold text-slate-900">{user.phone || 'לא הוזן'}</dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2"><CalendarDays size={16}/> תאריך הצטרפות</dt>
                            <dd className="col-span-2 text-sm font-bold text-slate-900">{formatDate(user.createdAt)}</dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2"><Clock size={16}/> התחברות אחרונה</dt>
                            <dd className="col-span-2 text-sm font-bold text-slate-900" dir="ltr">{user.lastLogin ? formatDate(user.lastLogin) : 'לא ידוע'}</dd>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <h2 className="font-black text-lg text-slate-800 border-b border-slate-50 pb-2">נתונים מורחבים</h2>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">סטטוס</dt>
                            <dd className="col-span-2"><Badge variant={user.status === 'Active' ? 'success' : user.status === 'Suspended' ? 'danger' : 'neutral'}>{user.status}</Badge></dd>
                        </div>

                        {user.fullName && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">שם מלא</dt>
                                <dd className="col-span-2 text-sm text-slate-900">{user.fullName}</dd>
                            </div>
                        )}
                        
                        {user.isVerified && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">אימות</dt>
                                <dd className="col-span-2"><Badge variant="success">מאומת</Badge></dd>
                            </div>
                        )}

                        {user.permissions && user.permissions.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">הרשאות מיוחדות</dt>
                                <dd className="col-span-2 flex flex-wrap gap-1">
                                    {user.permissions.map(p => <Badge key={p} variant="neutral" className="text-[10px]">{p}</Badge>)}
                                </dd>
                            </div>
                        )}

                        {user.bio && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-start">
                                <dt className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">אודות</dt>
                                <dd className="col-span-2 text-sm text-slate-900 leading-relaxed max-h-32 overflow-y-auto">{user.bio}</dd>
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
                            {Object.values(UserRole).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            שינוי תפקיד ישפיע על אפשרות הגישה הבסיסית של המשתמש.
                        </p>
                    </div>

                    {/* Allow overriding permissions for any role (Salesforce style) */}
                    <div className="bg-slate-50 p-4 border rounded-xl mt-4 space-y-3">
                        <h4 className="font-bold flex items-center gap-2 text-slate-800"><Lock size={16} /> שליטת הרשאות מתקדמת</h4>
                        <p className="text-xs text-slate-500 font-medium">סמן את המסכים אליהם יוכל המשמש לגשת בממשק הניהול. במידה ואף מסך לא מסומן, המערכת תשתמש בהרשאות ברירת המחדל של התפקיד שלו.</p>
                        <div className="grid grid-cols-2 gap-3 mt-3 max-h-[250px] overflow-y-auto pr-2">
                            {adminNavItems.map(item => {
                                const isAllowedByRole = item.roles.includes(editData.role as UserRole);

                                return (
                                    <label key={item.id} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border hover:border-indigo-500 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="accent-indigo-600 w-4 h-4"
                                            checked={editData.permissions.includes(item.id) || (editData.permissions.length === 0 && isAllowedByRole)}
                                            onChange={() => {
                                                let permsToToggle = [...editData.permissions];
                                                // Initialize permissions list based on defaults if they haven't explicitly set any yet
                                                if (permsToToggle.length === 0) {
                                                    permsToToggle = adminNavItems.filter(p => p.roles.includes(editData.role as UserRole)).map(p => p.id);
                                                }
                                                
                                                if (permsToToggle.includes(item.id)) {
                                                    permsToToggle = permsToToggle.filter(p => p !== item.id);
                                                } else {
                                                    permsToToggle.push(item.id);
                                                }
                                                setEditData({ ...editData, permissions: permsToToggle });
                                            }}
                                        />
                                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                            <item.icon size={14} className="text-slate-400" />
                                            {item.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>ביטול</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור שינויים</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

