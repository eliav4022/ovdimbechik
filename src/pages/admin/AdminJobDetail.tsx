import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Job, Application, UserRole } from '../../types';
import { ArrowRight, Briefcase, Users, Calendar, MapPin, Building, Loader2, ExternalLink, Pencil } from 'lucide-react';
import { AdminTable } from '../../components/admin/AdminTable';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../lib/AuthContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export const AdminJobDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'related'>('general');

    useEffect(() => {
        const fetchJobData = async () => {
            if (!id || !currentUser) return;
            setLoading(true);

            try {
                // 1. Fetch main job document
                const jobRef = doc(db, 'jobs', id);
                const jobSnap = await getDoc(jobRef);

                if (!jobSnap.exists()) {
                    toast('משרה לא נמצאה', 'error');
                    navigate(-1);
                    return;
                }

                const jobData = { id: jobSnap.id, ...jobSnap.data() } as Job;
                
                // Security check for employers
                if (currentUser.role === UserRole.EMPLOYER && jobData.ownerId !== currentUser.uid) {
                    toast('אין לך הרשאה לצפות במשרה זו', 'error');
                    navigate(-1);
                    return;
                }

                setJob(jobData);

                // 2. Fetch specific related list - Applications
                try {
                    const appsQuery = query(collection(db, 'applications'), where('jobId', '==', id));
                    const appsSnap = await getDocs(appsQuery);
                    const loadedApps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Application));
                    setApplications(loadedApps);
                } catch (e) {
                    console.error("Error fetching applications:", e);
                }

            } catch (err: any) {
                console.error("Error fetching job detail:", err);
                toast('שגיאה בטעינת נתוני משרה', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchJobData();
    }, [id, currentUser, toast, navigate]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!job) return null;

    const formatDate = (isoString?: string) => {
        if (!isoString) return 'לא ידוע';
        return format(new Date(isoString), 'dd/MM/yyyy HH:mm', { locale: he });
    };

    const appsColumns = [
        { key: 'applicantName', header: 'שם מועמד', render: (a: Application) => <span className="font-bold">{a.applicantName}</span> },
        { key: 'applicantEmail', header: 'אימייל', render: (a: Application) => <span className="text-slate-500">{a.applicantEmail}</span> },
        { key: 'status', header: 'סטטוס', render: (a: Application) => <Badge variant={a.status === 'Hired' ? 'success' : a.status === 'Rejected' ? 'danger' : 'warning'}>{a.status}</Badge> },
        { key: 'createdAt', header: 'הוגש בתאריך', render: (a: Application) => formatDate(a.createdAt) }
    ];

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
                            <Briefcase className="text-indigo-600" /> {job.title}
                        </h1>
                        <p className="text-slate-500 font-mono text-sm mt-1">ID: {job.id} | מפרסם (Owner): {job.ownerId || job.employerId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/employer/edit-job/${job.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-sm transition-colors"
                    >
                        <Pencil size={16} />
                        ערוך משרה
                    </button>
                    <a 
                        href={`/job/${job.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-sm transition-colors"
                    >
                        <ExternalLink size={16} />
                        צפה במשרה
                    </a>
                </div>
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
                    מועמדים
                    <Badge variant="neutral" className="text-[10px] py-0">{applications.length}</Badge>
                </button>
            </div>

            {/* Tab: General Info */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <h2 className="font-black text-lg text-slate-800 border-b border-slate-50 pb-2">פרטי משרה</h2>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2"><Building size={16}/> חברה</dt>
                            <dd className="col-span-2 text-sm font-bold text-slate-900">{job.companyName}</dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2"><MapPin size={16}/> מיקום</dt>
                            <dd className="col-span-2 text-sm text-slate-900">{job.location}</dd>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2"><Briefcase size={16}/> סוג משרה</dt>
                            <dd className="col-span-2 text-sm text-slate-900">{job.type} {job.workMode ? `· ${job.workMode}` : ''}</dd>
                        </div>

                        {job.category && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">תחום / קטגוריה</dt>
                                <dd className="col-span-2 text-sm text-slate-900 font-bold">{job.category}</dd>
                            </div>
                        )}
                        {(job.tags && job.tags.length > 0) && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-start">
                                <dt className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1 px-1">תגיות / מיומנויות</dt>
                                <dd className="col-span-2 flex flex-wrap gap-1.5">
                                    {job.tags.map(t => <span key={t} className="bg-brand-teal/10 text-brand-dark px-2 py-0.5 rounded-full text-xs font-bold">{t}</span>)}
                                </dd>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2"><Calendar size={16}/> תאריך יצירה</dt>
                            <dd className="col-span-2 text-sm font-mono text-slate-700">{formatDate(job.createdAt)}</dd>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <h2 className="font-black text-lg text-slate-800 border-b border-slate-50 pb-2">סטטוס ונתונים מורחבים</h2>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">סטטוס</dt>
                            <dd className="col-span-2"><Badge variant={job.status === 'active' ? 'success' : job.status === 'rejected' ? 'danger' : 'neutral'}>{job.status}</Badge></dd>
                        </div>
                        
                        {job.salary && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">שכר</dt>
                                <dd className="col-span-2 text-sm text-slate-900">{job.salary}</dd>
                            </div>
                        )}
                        
                        {job.experienceLevel && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">ניסיון דרוש</dt>
                                <dd className="col-span-2 text-sm text-slate-900">{job.experienceLevel}</dd>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">מספר צפיות</dt>
                            <dd className="col-span-2 text-sm font-mono text-slate-700">{job.views || job.viewsCount || 0}</dd>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">קידום</dt>
                            <dd className="col-span-2 text-sm text-slate-900">{job.promotionLevel || 'רגיל'}</dd>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">דרישת CV</dt>
                            <dd className="col-span-2 text-sm text-slate-900">
                                {job.requireCV !== false ? <Badge variant="success">חובה</Badge> : <Badge variant="neutral">רשות</Badge>}
                            </dd>
                        </div>

                        {(job.isImmediate || job.isUrgent) && (
                            <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                <dt className="text-sm text-slate-500 font-medium flex items-center gap-2">דחיפות</dt>
                                <dd className="col-span-2 text-sm text-slate-900 flex gap-2">
                                    {job.isImmediate && <Badge variant="warning">מיידי</Badge>}
                                    {job.isUrgent && <Badge variant="danger">דחוף</Badge>}
                                </dd>
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
                            <Users size={20} className="text-indigo-600" />
                            <h2 className="text-xl font-black text-slate-800">מועמדים ({applications.length})</h2>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <AdminTable 
                                  title="" 
                                  description="" 
                                  data={applications} 
                                  columns={appsColumns} 
                                  searchFields={['applicantName', 'applicantEmail']} 
                                  onView={(a) => navigate(`/admin/users/${a.seekerId}`)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
