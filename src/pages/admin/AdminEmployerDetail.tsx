import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Job, Application, UserRole, JobStatus, Inquiry, getTxTypeLabel, isPositiveTx } from '../../types';
import { ArrowRight, Building2, Briefcase, FileText, Mail, Phone, Clock, CalendarDays, Loader2, Link as LinkIcon, BarChart3, PlusCircle, Edit2, CheckCircle } from 'lucide-react';
import { AdminTable } from '../../components/admin/AdminTable';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export const AdminEmployerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [employer, setEmployer] = useState<User | null>(null);
    const [company, setCompany] = useState<any | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [admins, setAdmins] = useState<User[]>([]);
    const [allCompanies, setAllCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'jobs' | 'pending_jobs' | 'applications' | 'contacts' | 'credits'>('general');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState<Partial<User>>({});

    useEffect(() => {
        const fetchEmployerData = async () => {
            if (!id) return;
            setLoading(true);

            try {
                // 1. Fetch main user document
                const userRef = doc(db, 'users', id);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    toast('מעסיק לא נמצא', 'error');
                    navigate('/admin/employers');
                    return;
                }

                const userData = { id: userSnap.id, ...userSnap.data() } as User;
                setEmployer(userData);

                // Fetch Company if linked
                if (userData.companyId) {
                    try {
                        const compSnap = await getDoc(doc(db, 'companies', userData.companyId));
                        if (compSnap.exists()) {
                            setCompany({ id: compSnap.id, ...compSnap.data() });
                        }
                    } catch (e) {
                        console.error('Error fetching company:', e);
                    }
                }

                // 2. Fetch Jobs posted by this employer
                if (userData.role === UserRole.EMPLOYER || userData.role === UserRole.ADMIN) {
                    try {
                        const jobsQuery = query(collection(db, 'jobs'), where('ownerId', '==', id));
                        const jobsSnap = await getDocs(jobsQuery);
                        const loadedJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Job));
                        setJobs(loadedJobs);

                        // 3. Fetch Applications submitted to this employer's jobs
                        // Applications might have employerId or we fetch them by jobIds. 
                        // Types currently say employerId is 'Deprecated', we should check ownerId instead or use jobIds
                        let loadedApps: Application[] = [];
                        
                        // First attempt using ownerId on applications, or fallback to job IDs
                        const appsQuery = query(collection(db, 'applications'), where('ownerId', '==', id));
                        const appsSnap = await getDocs(appsQuery);
                        loadedApps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Application));
                        
                        // If none found by ownerId (e.g. data is old or relies on jobId), fetch by jobIds 
                        if (loadedApps.length === 0 && loadedJobs.length > 0) {
                            const jobIds = loadedJobs.map(j => j.id);
                            // chunk jobIds because of 'in' filter limit
                            const chunks = [];
                            for(let i = 0; i < jobIds.length; i += 10) {
                                chunks.push(jobIds.slice(i, i+10));
                            }
                            
                            const appPromises = chunks.map(chunk => 
                                getDocs(query(collection(db, 'applications'), where('jobId', 'in', chunk)))
                            );
                            const appSnaps = await Promise.all(appPromises);
                            appSnaps.forEach(snap => {
                                snap.docs.forEach(d => {
                                    loadedApps.push({id: d.id, ...d.data()} as unknown as Application);
                                });
                            });
                        }
                        
                        setApplications(loadedApps);
                    } catch (e) {
                        console.error("Error fetching related data:", e);
                    }
                }

                // Fetch Inquiries for this employer (via email)
                if (userData.email) {
                    try {
                        const inqQ = query(collection(db, 'inquiries'), where('senderEmail', '==', userData.email), orderBy('createdAt', 'desc'));
                        const inqSnap = await getDocs(inqQ);
                        setInquiries(inqSnap.docs.map(d => ({id: d.id, ...d.data()} as Inquiry)));
                    } catch (e) {
                        console.error('Error fetching inquiries:', e);
                    }
                }

                // Fetch transactions
                try {
                    const txQ = query(collection(db, 'credit_transactions'), where('employerId', '==', String(id)));
                    const txSnap = await getDocs(txQ);
                    const txs = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    txs.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
                    setTransactions(txs);
                } catch (e) {
                    console.error('Error fetching transactions:', e);
                }

                // 4. Fetch Admins
                const adminsQ = query(collection(db, 'users'), where('role', '==', UserRole.ADMIN));
                const adminsSnap = await getDocs(adminsQ);
                setAdmins(adminsSnap.docs.map(d => ({id: d.id, ...d.data()} as User)));
                
                // 5. Fetch all companies for edit modal
                const companiesSnap = await getDocs(collection(db, 'companies'));
                setAllCompanies(companiesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (err: any) {
                console.error("Error fetching detail:", err);
                toast('שגיאה בטעינת נתוני מעסיק', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployerData();
    }, [id, toast, navigate]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!employer) return null;

    const formatDate = (isoString?: string) => {
        if (!isoString) return 'לא ידוע';
        return format(new Date(isoString), 'dd/MM/yyyy HH:mm', { locale: he });
    };

    const handleAssignAdmin = async (adminId: string) => {
        if (!employer) return;
        try {
            await updateDoc(doc(db, 'users', employer.id), {
                assignedAdminId: adminId
            });
            setEmployer({ ...employer, assignedAdminId: adminId });
            toast('נשמר בהצלחה', 'success');
        } catch (error) {
            console.error(error);
            toast('שגיאה בשמירת שיוך', 'error');
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employer) return;
        try {
            const updates: any = {
                email: editData.email,
                phone: editData.phone,
                companyName: editData.companyName,
                companyDescription: editData.companyDescription,
            };
            if (editData.companyId !== undefined) {
                updates.companyId = editData.companyId || null; // null if empty string
            }

            await updateDoc(doc(db, 'users', employer.id), updates);
            
            // if companyId changed, fetch new company
            if (editData.companyId && editData.companyId !== employer.companyId) {
                const compSnap = await getDoc(doc(db, 'companies', editData.companyId));
                if (compSnap.exists()) {
                    setCompany({ id: compSnap.id, ...compSnap.data() });
                }
            } else if (!editData.companyId) {
                setCompany(null);
            }

            setEmployer({ ...employer, ...updates });
            toast('פרטי המעסיק עודכנו בהצלחה', 'success');
            setIsEditModalOpen(false);
        } catch (error) {
            console.error(error);
            toast('שגיאה בעדכון פרטי מעסיק', 'error');
        }
    };

    const jobsColumns = [
        { key: 'title', header: 'כותרת משרה', render: (j: Job) => <Link className="font-bold text-slate-900 hover:text-indigo-600 hover:underline" to={`/admin/jobs/${j.id}`}>{j.title}</Link> },
        { key: 'status', header: 'סטטוס', render: (j: Job) => <Badge variant={(j.status === 'Published' || j.status === JobStatus.ACTIVE) ? 'success' : (j.status === 'Draft' || j.status === JobStatus.DRAFT) ? 'neutral' : 'warning'}>{j.status}</Badge> },
        { key: 'applicationsCount', header: 'מועמדויות', render: (j: Job) => <span className="font-mono">{j.applicationsCount || 0}</span> },
        { key: 'createdAt', header: 'תאריך יצירה', render: (j: Job) => formatDate(j.createdAt) }
    ];

    const appsColumns = [
        { key: 'applicantName', header: 'שם המועמד' },
        { key: 'jobName', header: 'משרה', render: (a: Application) => {
            const job = jobs.find(j => j.id === a.jobId);
            return job ? <Link to={`/admin/jobs/${job.id}`} className="hover:underline">{job.title}</Link> : <span className="text-xs text-slate-400">{a.jobId}</span>
        }},
        { key: 'status', header: 'סטטוס', render: (a: Application) => <Badge variant={a.status === 'Hired' ? 'success' : a.status === 'Rejected' ? 'danger' : 'warning'}>{a.status}</Badge> },
        { key: 'createdAt', header: 'הוגש בתאריך', render: (a: Application) => formatDate(a.createdAt) }
    ];

    const inquiryColumns = [
        { key: 'subject', header: 'נושא', render: (i: Inquiry) => <div className="font-medium text-slate-700">{i.subject}</div> },
        { key: 'status', header: 'סטטוס', render: (i: Inquiry) => <Badge variant={i.status === 'RESOLVED' ? 'success' : 'neutral'}>{i.status === 'RESOLVED' ? 'טופל' : 'חדש'}</Badge> },
        { key: 'createdAt', header: 'תאריך', render: (i: Inquiry) => <div className="text-sm font-medium text-slate-500">{formatDate(i.createdAt)}</div> }
    ];

    const pendingJobsCount = jobs.filter(j => j.status === 'Draft' || j.status === JobStatus.DRAFT || j.status === JobStatus.PENDING_REVIEW).length;
    const activeJobsCount = jobs.filter(j => j.status === 'Published' || j.status === JobStatus.ACTIVE).length;
    const newApplicationsCount = applications.filter(a => a.status === 'New').length;
    const newInquiriesCount = inquiries.filter(i => i.status === 'NEW').length;

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
                            <Building2 className="text-indigo-600" /> {employer.companyName || employer.displayName || 'מעסיק'}
                        </h1>
                        <p className="text-slate-500 font-mono text-sm mt-1">ID: {employer.id || employer.uid}</p>
                    </div>
                </div>
            </div>

            {/* Dashboard Cards for Employer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">סה"כ משרות</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase size={18} /></div>
                    </div>
                    <p className="text-3xl font-black text-slate-900 mt-4">{jobs.length}</p>
                 </div>
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setActiveTab('jobs')}>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">משרות באוויר</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Briefcase size={18} /></div>
                    </div>
                    <p className="text-3xl font-black text-emerald-600 mt-4">{activeJobsCount}</p>
                 </div>
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setActiveTab('pending_jobs')}>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">משרות ממתינות לפרסום</span>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
                    </div>
                    <p className="text-3xl font-black text-amber-600 mt-4">{pendingJobsCount}</p>
                 </div>
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setActiveTab('contacts')}>
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">פניות חדשות (לא נקראו)</span>
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><FileText size={18} /></div>
                    </div>
                    <p className="text-3xl font-black text-rose-600 mt-4">{newInquiriesCount}</p>
                 </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-6 scrollbar-hide overflow-x-auto whitespace-nowrap">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    מידע ומנוי
                </button>
                <button 
                    onClick={() => setActiveTab('jobs')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    משרות באוויר
                    <Badge variant="neutral" className="text-[10px] py-0">{activeJobsCount}</Badge>
                </button>
                <button 
                    onClick={() => setActiveTab('pending_jobs')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'pending_jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    משרות ממתינות
                    <Badge variant={pendingJobsCount > 0 ? "warning" : "neutral"} className="text-[10px] py-0">{pendingJobsCount}</Badge>
                </button>
                <button 
                    onClick={() => setActiveTab('applications')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'applications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    מועמדויות שהתקבלו
                    <Badge variant="neutral" className="text-[10px] py-0">{applications.length}</Badge>
                </button>
                <button 
                    onClick={() => setActiveTab('contacts')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'contacts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    פניות תמיכה
                    <Badge variant={newInquiriesCount > 0 ? "danger" : "neutral"} className="text-[10px] py-0">{inquiries.length}</Badge>
                </button>
                <button 
                    onClick={() => setActiveTab('credits')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'credits' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    ניהול קרדיטים
                </button>
            </div>

            {/* Tab: General Info */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                             <h2 className="font-black text-lg text-slate-800">פרטי מעסיק</h2>
                             <button 
                                 onClick={() => {
                                     setEditData({
                                         email: employer.email || '',
                                         phone: employer.phone || '',
                                         companyName: employer.companyName || '',
                                         companyDescription: employer.companyDescription || '',
                                         companyId: employer.companyId || ''
                                     });
                                     setIsEditModalOpen(true);
                                 }}
                                 className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                             >
                                 <Edit2 size={14} /> עריכת פרטים
                             </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <Mail size={16} /> אימייל:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">{employer.email}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <Building2 size={16} /> שיוך לחברה:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">
                                {company ? (
                                    <Link to={`/admin/companies/${company.id}`} className="text-indigo-600 hover:underline flex items-center gap-2 font-bold">
                                        {company.name} <LinkIcon size={14} />
                                    </Link>
                                ) : (
                                    'לא משויך לחברה'
                                )}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                חברה (טקסט):
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">{employer.companyName || 'לא צוין'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                מעסיק ראשי?:
                            </span>
                            <span className="col-span-2 flex items-center gap-3">
                                <Badge variant={employer.isCompanyAdmin ? 'success' : 'neutral'}>
                                    {employer.isCompanyAdmin ? 'כן' : 'לא'}
                                </Badge>
                                <button
                                    onClick={async () => {
                                        try {
                                            const newStatus = !employer.isCompanyAdmin;
                                            await updateDoc(doc(db, 'users', employer.id), {
                                                isCompanyAdmin: newStatus
                                            });
                                            setEmployer({...employer, isCompanyAdmin: newStatus});
                                            toast(newStatus ? 'הוגדר כמעסיק ראשי' : 'בוטל סטטוס מעסיק ראשי', 'success');
                                        } catch (e) {
                                            toast('שגיאה בעדכון الסטטוס', 'error');
                                        }
                                    }}
                                    className={`text-xs px-2 py-1 rounded font-bold shadow-sm transition-colors ${employer.isCompanyAdmin ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                                >
                                    {employer.isCompanyAdmin ? 'בטל ראשי' : 'הפוך לראשי'}
                                </button>
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <Phone size={16} /> סלולרי:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800" dir="ltr">{employer.phone || 'לא סופק'}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                תיאור חברה:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800 line-clamp-3">{employer.companyDescription || 'לא צוין'}</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <h2 className="font-black text-lg text-slate-800 border-b border-slate-50 pb-2">מערכת ומנוי</h2>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <CalendarDays size={16} /> הצטרף ב:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">{formatDate(employer.createdAt)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                מאומת:
                            </span>
                            <span className="col-span-2 flex items-center gap-3">
                                <Badge variant={employer.isVerified ? 'success' : 'neutral'}>
                                    {employer.isVerified ? 'כן' : 'לא'}
                                </Badge>
                                <button
                                    onClick={async () => {
                                        try {
                                            const newStatus = !employer.isVerified;
                                            await updateDoc(doc(db, 'users', employer.id), {
                                                isVerified: newStatus
                                            });
                                            setEmployer({...employer, isVerified: newStatus});
                                            toast(newStatus ? 'המעסיק אומת בהצלחה' : 'אימות המעסיק בוטל', 'success');
                                        } catch (e) {
                                            toast('שגיאה בעדכון הסטטוס', 'error');
                                        }
                                    }}
                                    className={`text-xs px-2 py-1 rounded font-bold shadow-sm transition-colors ${employer.isVerified ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                >
                                    {employer.isVerified ? 'בטל אימות' : 'אמת מעסיק'}
                                </button>
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                אישי:
                            </span>
                            <span className="col-span-2 font-black text-lg text-indigo-600">
                                {employer.credits || 0}
                            </span>
                        </div>
                        {company && (
                            <div className="grid grid-cols-1 gap-2 py-2 items-center">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                        חברה (משותף):
                                    </span>
                                    <span className="font-black text-lg text-indigo-600 flex items-center gap-4">
                                        {company.credits || 0}
                                        <Link to={`/admin/companies/${company.id}`} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 transition-colors">נהל קרדיטים בחברה</Link>
                                    </span>
                                </div>
                                <div className="mt-2 bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center gap-2">
                                    <span className="text-xs font-bold text-indigo-800">העבר פנימה לחברה: </span>
                                    <input 
                                        type="number"
                                        className="bg-white border border-indigo-200 rounded px-2 py-1 w-20 text-sm font-bold shadow-sm"
                                        placeholder="כמות"
                                        id="adminTransferInput"
                                        min={1}
                                        max={employer.credits || 1}
                                    />
                                    <button 
                                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700 transition"
                                        onClick={async () => {
                                            const val = Number((document.getElementById('adminTransferInput') as HTMLInputElement).value);
                                            if (!val || val <= 0 || val > (employer.credits || 0)) {
                                                toast('סכום לא תקין', 'error');
                                                return;
                                            }
                                            try {
                                                const { writeBatch, doc, collection } = await import('firebase/firestore');
                                                const batch = writeBatch(db);
                                                const newTxRef = doc(collection(db, 'credit_transactions'));
                                                const txData = {
                                                    employerId: employer.id,
                                                    amount: -val,
                                                    type: 'TRANSFER_TO_COMPANY',
                                                    companyId: company.id,
                                                    createdAt: new Date().toISOString()
                                                };
                                                batch.update(doc(db, 'users', employer.id), {
                                                   credits: (employer.credits || 0) - val 
                                                });
                                                batch.update(doc(db, 'companies', company.id), {
                                                   credits: (company.credits || 0) + val 
                                                });
                                                batch.set(newTxRef, txData);
                                                await batch.commit();
                                                setEmployer({...employer, credits: (employer.credits || 0) - val});
                                                setCompany({...company, credits: (company.credits || 0) + val});
                                                setTransactions([{ id: newTxRef.id, ...txData }, ...transactions]);
                                                toast('קרדיטים הועברו לחברה', 'success');
                                            } catch (e) {
                                                console.error(e);
                                                toast('אירעה שגיאה', 'error');
                                            }
                                        }}
                                    >
                                        העבר
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">שיוך מנהל:</span>
                            <span className="col-span-2">
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-medium text-slate-800"
                                    value={employer.assignedAdminId || ''}
                                    onChange={(e) => handleAssignAdmin(e.target.value)}
                                >
                                    <option value="">ללא שיוך אישי</option>
                                    {admins.map(a => (
                                        <option key={a.id} value={a.id}>{a.displayName || a.fullName || a.email}</option>
                                    ))}
                                </select>
                            </span>
                        </div>

                        <div className="p-4 bg-indigo-50/50 rounded-xl mt-2 border border-indigo-100">
                             <h4 className="font-bold text-indigo-800 text-sm mb-1">ניהול משתמש וקרדיטים</h4>
                             <p className="text-xs text-slate-600 mb-3">צפה בניהול מלא ומשאבים של המשתמש במסך העריכה המתקדמת (User Detail).</p>
                             <Link to={`/admin/users/${employer.id}`} className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors inline-block">
                                 עריכה מתקדמת כמשתמש המערכת
                             </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Jobs */}
            {activeTab === 'jobs' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="font-black text-lg text-slate-800 mb-4 items-center flex justify-between">
                            משרות לטווח ארוך ({jobs.filter(j => !j.isCasual && (j.status === 'Published' || j.status === JobStatus.ACTIVE)).length})
                            <Link to="/post-job" className="text-xs bg-indigo-600 outline-none text-white px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors font-bold shadow-md shadow-indigo-600/20">
                                <PlusCircle size={14} /> פתח משרה חדשה עבורו
                            </Link>
                        </h2>
                        {jobs.filter(j => !j.isCasual && (j.status === 'Published' || j.status === JobStatus.ACTIVE)).length > 0 ? (
                            <AdminTable<Job> data={jobs.filter(j => !j.isCasual && (j.status === 'Published' || j.status === JobStatus.ACTIVE))} columns={jobsColumns as any} searchFields={['title', 'status']} title="משרות לטווח ארוך" />
                        ) : (
                            <div className="p-8 md:p-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">לא נמצאו משרות לטווח ארוך פעילות</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="font-black text-lg text-slate-800 mb-4 items-center flex justify-between">
                            עבודות מזדמנות ({jobs.filter(j => j.isCasual && (j.status === 'Published' || j.status === JobStatus.ACTIVE)).length})
                            <Link to="/post-job?casual=true" className="text-xs bg-orange-600 outline-none text-white px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-700 transition-colors font-bold shadow-md shadow-orange-600/20">
                                <PlusCircle size={14} /> פתח משרה מזדמנת חדשה
                            </Link>
                        </h2>
                        {jobs.filter(j => j.isCasual && (j.status === 'Published' || j.status === JobStatus.ACTIVE)).length > 0 ? (
                            <AdminTable<Job> data={jobs.filter(j => j.isCasual && (j.status === 'Published' || j.status === JobStatus.ACTIVE))} columns={jobsColumns as any} searchFields={['title', 'status']} title="עבודות מזדמנות" />
                        ) : (
                            <div className="p-8 md:p-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">לא נמצאו עבודות מזדמנות פעילות</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Pending Jobs */}
            {activeTab === 'pending_jobs' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="font-black text-lg text-slate-800 mb-4 items-center flex justify-between">
                            משרות לטווח ארוך בממתינה ({jobs.filter(j => !j.isCasual && (j.status === 'Draft' || j.status === JobStatus.DRAFT || j.status === JobStatus.PENDING_REVIEW)).length})
                        </h2>
                        {jobs.filter(j => !j.isCasual && (j.status === 'Draft' || j.status === JobStatus.DRAFT || j.status === JobStatus.PENDING_REVIEW)).length > 0 ? (
                            <AdminTable<Job> data={jobs.filter(j => !j.isCasual && (j.status === 'Draft' || j.status === JobStatus.DRAFT || j.status === JobStatus.PENDING_REVIEW))} columns={jobsColumns as any} searchFields={['title', 'status']} title="משרות לטווח ארוך" />
                        ) : (
                            <div className="p-8 md:p-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">אין משרות לטווח ארוך הממתינות לאישור</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="font-black text-lg text-slate-800 mb-4 items-center flex justify-between">
                            עבודות מזדמנות בממתינה ({jobs.filter(j => j.isCasual && (j.status === 'Draft' || j.status === JobStatus.DRAFT || j.status === JobStatus.PENDING_REVIEW)).length})
                        </h2>
                        {jobs.filter(j => j.isCasual && (j.status === 'Draft' || j.status === JobStatus.DRAFT || j.status === JobStatus.PENDING_REVIEW)).length > 0 ? (
                            <AdminTable<Job> data={jobs.filter(j => j.isCasual && (j.status === 'Draft' || j.status === JobStatus.DRAFT || j.status === JobStatus.PENDING_REVIEW))} columns={jobsColumns as any} searchFields={['title', 'status']} title="עבודות מזדמנות" />
                        ) : (
                            <div className="p-8 md:p-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">אין עבודות מזדמנות הממתינות לאישור</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Applications */}
            {activeTab === 'applications' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="font-black text-lg text-slate-800 mb-4">קורות חיים שהתקבלו ({applications.length})</h2>
                    {applications.length > 0 ? (
                        <AdminTable<Application> data={applications} columns={appsColumns as any} searchFields={['jobId']} title="קורות חיים" />
                    ) : (
                        <div className="p-8 md:p-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">לא התקבלו פניות עדיין</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Contacts */}
            {activeTab === 'contacts' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="font-black text-lg text-slate-800 mb-4">פניות תמיכה ({inquiries.length})</h2>
                    {inquiries.length > 0 ? (
                        <AdminTable<Inquiry> data={inquiries} columns={inquiryColumns as any} searchFields={['subject', 'message']} title="פניות" />
                    ) : (
                        <div className="p-8 md:p-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">לא התקבלו פניות תמיכה</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Credits */}
            {activeTab === 'credits' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <h2 className="font-black text-lg text-slate-800 mb-4 border-b pb-2">ניהול קרדיטים</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 flex flex-col justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-500 mb-2">יתרת קרדיטים אישית</p>
                                <p className="text-4xl font-black text-indigo-600">{employer.credits || 0}</p>
                            </div>
                            <div className="mt-6 flex flex-col gap-2">
                                <span className="text-xs font-bold text-indigo-800">פעולות אדמין (הזן כמות ולחץ +/-):</span>
                                <div className="flex gap-2">
                                    <input 
                                        type="number"
                                        className="bg-white border border-indigo-200 rounded px-3 py-2 w-full text-sm font-bold shadow-sm"
                                        placeholder="כמות"
                                        id="adminDirectCreditInput"
                                        min={1}
                                    />
                                    <button 
                                        onClick={async () => {
                                            const val = Number((document.getElementById('adminDirectCreditInput') as HTMLInputElement).value);
                                            if (!val || val <= 0) { toast('סכום לא תקין', 'error'); return; }
                                            try {
                                                const { writeBatch, doc, collection } = await import('firebase/firestore');
                                                const batch = writeBatch(db);
                                                
                                                const newTxRef = doc(collection(db, 'credit_transactions'));
                                                const txData = {
                                                    employerId: employer.id,
                                                    amount: val,
                                                    type: 'ADMIN_ADDITION',
                                                    createdAt: new Date().toISOString()
                                                };
                                                
                                                batch.update(doc(db, 'users', employer.id), { credits: (employer.credits || 0) + val });
                                                batch.set(newTxRef, txData);
                                                await batch.commit();
                                                setEmployer({...employer, credits: (employer.credits || 0) + val});
                                                setTransactions([{ id: newTxRef.id, ...txData }, ...transactions]);
                                                toast('קרדיטים נוספו', 'success');
                                            } catch(e) { toast('שגיאה', 'error'); }
                                        }}
                                        className="bg-emerald-500 text-white px-4 py-2 font-black rounded hover:bg-emerald-600 transition"
                                    >+</button>
                                    <button 
                                        onClick={async () => {
                                            const val = Number((document.getElementById('adminDirectCreditInput') as HTMLInputElement).value);
                                            if (!val || val <= 0 || val > (employer.credits || 0)) { toast('סכום לא תקין', 'error'); return; }
                                            try {
                                                const { writeBatch, doc, collection } = await import('firebase/firestore');
                                                const batch = writeBatch(db);
                                                
                                                const newTxRef = doc(collection(db, 'credit_transactions'));
                                                const txData = {
                                                    employerId: employer.id,
                                                    amount: -val,
                                                    type: 'ADMIN_REDUCTION',
                                                    createdAt: new Date().toISOString()
                                                };
                                                
                                                batch.update(doc(db, 'users', employer.id), { credits: (employer.credits || 0) - val });
                                                batch.set(newTxRef, txData);
                                                await batch.commit();
                                                setEmployer({...employer, credits: (employer.credits || 0) - val});
                                                setTransactions([{ id: newTxRef.id, ...txData }, ...transactions]);
                                                toast('קרדיטים הוסרו', 'success');
                                            } catch(e) { toast('שגיאה', 'error'); }
                                        }}
                                        className="bg-rose-500 text-white px-4 py-2 font-black rounded hover:bg-rose-600 transition"
                                    >-</button>
                                </div>
                            </div>
                        </div>

                        {company ? (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-500 mb-2">יתרת קרדיטים קופת חברה משותפת</p>
                                <p className="text-3xl font-black text-slate-800">{company?.credits || 0}</p>
                            </div>
                            <div className="mt-6 flex flex-col gap-2">
                                <span className="text-xs font-bold text-slate-600">העברה מהמעסיק לקופת החברה: </span>
                                <div className="flex gap-2">
                                <input 
                                    type="number"
                                    className="bg-white border border-slate-300 rounded px-2 py-1 w-full text-sm font-bold shadow-sm"
                                    placeholder="כמות להעברה"
                                    id="adminTransferInputTab"
                                    min={1}
                                    max={employer.credits || 1}
                                />
                                <button 
                                    className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded font-bold hover:bg-slate-900 transition flex-shrink-0"
                                    onClick={async () => {
                                        const val = Number((document.getElementById('adminTransferInputTab') as HTMLInputElement).value);
                                        if (!val || val <= 0 || val > (employer.credits || 0)) {
                                            toast('סכום לא תקין', 'error');
                                            return;
                                        }
                                        try {
                                            const { writeBatch, doc, collection } = await import('firebase/firestore');
                                            const batch = writeBatch(db);
                                            const newTxRef = doc(collection(db, 'credit_transactions'));
                                            const txData = {
                                                employerId: employer.id,
                                                amount: -val,
                                                type: 'TRANSFER_TO_COMPANY',
                                                companyId: company.id,
                                                createdAt: new Date().toISOString()
                                            };
                                            batch.update(doc(db, 'users', employer.id), {
                                                credits: (employer.credits || 0) - val 
                                            });
                                            batch.update(doc(db, 'companies', company.id), {
                                                credits: (company.credits || 0) + val 
                                            });
                                            batch.set(newTxRef, txData);
                                            await batch.commit();
                                            setEmployer({...employer, credits: (employer.credits || 0) - val});
                                            setCompany({...company, credits: (company.credits || 0) + val});
                                            setTransactions([{ id: newTxRef.id, ...txData }, ...transactions]);
                                            toast('קרדיטים הועברו לחברה', 'success');
                                            (document.getElementById('adminTransferInputTab') as HTMLInputElement).value = '';
                                        } catch (e) {
                                            console.error(e);
                                            toast('אירעה שגיאה', 'error');
                                        }
                                    }}
                                >
                                    העבר לחברה
                                </button>
                                </div>
                            </div>
                        </div>
                        ) : (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-center items-center text-center">
                            <p className="text-slate-500 font-bold">לא משויך לחברה</p>
                        </div>
                        )}
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-lg font-black text-slate-800 mb-4">היסטוריית פעולות ({transactions.length})</h3>
                        {transactions.length > 0 ? (
                            <div className="space-y-3">
                                {transactions.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <p className="font-bold text-slate-700">{getTxTypeLabel(tx.type)}</p>
                                            <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString('he-IL')}</p>
                                        </div>
                                        <div className="font-black text-lg" dir="ltr">
                                            <span className={isPositiveTx(tx.type) ? 'text-green-600' : 'text-red-500'}>
                                                {isPositiveTx(tx.type) ? '+' : ''}{tx.amount}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500">אין עדיין היסטוריית פעולות</p>
                        )}
                    </div>
                </div>
            )}

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="עריכת פרטי מעסיק"
            >
                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">אימייל</label>
                        <Input 
                            type="email"
                            placeholder="אימייל..." 
                            value={editData.email || ''}
                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">שם חברה / מעסיק</label>
                        <Input 
                            placeholder="שם חברה/מעסיק..." 
                            value={editData.companyName || ''}
                            onChange={(e) => setEditData({...editData, companyName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">טלפון / סלולרי</label>
                        <Input 
                            placeholder="טלפון..." 
                            value={editData.phone || ''}
                            onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">תיאור חברה</label>
                        <textarea 
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                            placeholder="קצת על החברה..." 
                            value={editData.companyDescription || ''}
                            onChange={(e) => setEditData({...editData, companyDescription: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">שיוך לחברה במערכת</label>
                        <select 
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            value={editData.companyId || ''}
                            onChange={(e) => setEditData({...editData, companyId: e.target.value})}
                        >
                            <option value="">-- ללא חברה (עצמאי) --</option>
                            {allCompanies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                         <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>ביטול</Button>
                         <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור שינויים</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
