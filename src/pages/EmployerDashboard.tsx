import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, addDoc, getDocs, writeBatch, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../context/ToastContext';
import { Helmet } from 'react-helmet-async';
import { LoadingSpinner, FullPageLoading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Job, Application, JobStatus, ApplicationStatus, PromotionLevel, CreditTransaction, UserRole, getTxTypeLabel, isPositiveTx } from '../types';
import { 
    Plus, 
    Edit, 
    Trash2, 
    Users, 
    CheckCircle, 
    XCircle, 
    ExternalLink, 
    Briefcase, 
    Copy, 
    Power,
    Eye,
    TrendingUp,
    MessageCircle,
    Download,
    Filter,
    Search,
    ChevronDown,
    MoreHorizontal,
    Zap,
    CreditCard,
    Star,
    BarChart3,
    ArrowUpRight,
    LogOut,
    Building2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const EmployerDashboard: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'jobs' | 'applicants' | 'stats' | 'profile' | 'credits'>('jobs');
    const [jobSubTab, setJobSubTab] = useState<'long-term' | 'casual'>('long-term');
    const [searchQuery, setSearchQuery] = useState('');
    const [company, setCompany] = useState<any | null>(null);

    useEffect(() => {
        const fetchCompany = async () => {
            if (user?.companyId) {
                try {
                    const docSnap = await getDoc(doc(db, 'companies', user.companyId));
                    if (docSnap.exists()) {
                        setCompany({ id: docSnap.id, ...docSnap.data() });
                    }
                } catch (e) {
                    console.error('Error fetching company:', e);
                }
            }
        };
        fetchCompany();
    }, [user?.companyId]);

    // Employer Profile State
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [transferAmount, setTransferAmount] = useState<number | ''>('');
    const [isTransferring, setIsTransferring] = useState(false);

    const handleTransferToCompany = async () => {
        if (!user || (!company)) return;
        const amount = Number(transferAmount);
        if (isNaN(amount) || amount <= 0 || amount > (user.credits || 0)) {
            toast('סכום לא תקין', 'error');
            return;
        }

        setIsTransferring(true);
        try {
            const batch = writeBatch(db);
            
            // 1. Deduct from user
            batch.update(doc(db, 'users', user.uid), {
                credits: (user.credits || 0) - amount
            });

            // 2. Add to company
            batch.update(doc(db, 'companies', company.id), {
                credits: (company.credits || 0) + amount
            });

            // 3. Create transactions
            const txRef1 = doc(collection(db, 'credit_transactions'));
            batch.set(txRef1, {
                employerId: user.uid,
                amount: -amount,
                type: 'TRANSFER_TO_COMPANY',
                companyId: company.id,
                createdAt: new Date().toISOString()
            });

            await batch.commit();
            
            // local state update for company preview since user updates are usually handled by Auth provider or realtime listener (if applicable, but we want UX to be smooth)
            setCompany({ ...company, credits: (company.credits || 0) + amount });
            
            toast('קרדיטים הועברו לחברה בהצלחה', 'success');
            setTransferAmount('');
        } catch (error) {
            console.error('Transfer error:', error);
            handleFirestoreError(error as any, OperationType.UPDATE, 'transfer_credits');
        } finally {
            setIsTransferring(false);
        }
    };
    const [employerProfile, setEmployerProfile] = useState({
        companyName: user?.companyName || user?.fullName || '',
        companyDescription: user?.companyDescription || user?.bio || '',
    });

    // Update profile local state when user auth changes initially
    useEffect(() => {
        if (user) {
            setEmployerProfile({
                companyName: user.companyName || user.fullName || '',
                companyDescription: user.companyDescription || user.bio || '',
            });
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSavingProfile(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                companyName: employerProfile.companyName,
                companyDescription: employerProfile.companyDescription,
                updatedAt: new Date().toISOString()
            });

            // Update all jobs to reflect the new company description
            const jobsQuery = query(collection(db, 'jobs'), where('ownerId', '==', user.uid));
            const jobsSnap = await getDocs(jobsQuery);
            const batch = writeBatch(db);
            let count = 0;
            jobsSnap.forEach(jobDoc => {
                batch.update(jobDoc.ref, {
                    companyName: employerProfile.companyName,
                    companyDescription: employerProfile.companyDescription
                });
                count++;
            });
            
            // For older jobs that used employerId 
            const jobsQueryFallback = query(collection(db, 'jobs'), where('employerId', '==', user.uid));
            const jobsSnapFallback = await getDocs(jobsQueryFallback);
            jobsSnapFallback.forEach(jobDoc => {
                if (!jobsSnap.docs.find(d => d.id === jobDoc.id)) {
                    batch.update(jobDoc.ref, {
                        companyName: employerProfile.companyName,
                        companyDescription: employerProfile.companyDescription
                    });
                    count++;
                }
            });

            if (count > 0) {
                await batch.commit();
            }

            toast('פרופיל החברה עודכן בהצלחה', 'success');
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        } finally {
            setIsSavingProfile(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        const jobsQuery = query(collection(db, 'jobs'), where('employerId', '==', user.uid));
        const appsQuery = query(collection(db, 'applications'), where('employerId', '==', user.uid));
        const txQuery = query(collection(db, 'credit_transactions'), where('employerId', '==', user.uid));

        const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
            setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'jobs');
        });

        const unsubApps = onSnapshot(appsQuery, (snapshot) => {
            setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
            setLoading(false);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'applications');
        });

        const unsubTx = onSnapshot(txQuery, (snapshot) => {
            const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditTransaction));
            // Sort by date desc locally (assuming date is ISO string, simple to sort)
            txData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setTransactions(txData);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'credit_transactions');
        });

        return () => {
            unsubJobs();
            unsubApps();
            unsubTx();
        };
    }, [user]);

    const handleDeleteJob = async (jobId: string) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק משרה זו? שימו לב: פעולה זו תמחק גם את כל המועמדויות המשויכות למשרה.')) return;
        try {
            const appsQuery = query(collection(db, 'applications'), where('jobId', '==', jobId));
            const appsSnap = await getDocs(appsQuery);
            
            const batches = [];
            let currentBatch = writeBatch(db);
            let count = 0;
            
            currentBatch.delete(doc(db, 'jobs', jobId));
            count++;

            appsSnap.forEach(appDoc => {
                if (count >= 499) {
                    batches.push(currentBatch);
                    currentBatch = writeBatch(db);
                    count = 0;
                }
                currentBatch.delete(appDoc.ref);
                count++;
            });
            batches.push(currentBatch);

            for (const b of batches) {
                await b.commit();
            }
            
            toast('המשרה והמועמדויות אליה נמחקו בהצלחה', 'success');
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `jobs/${jobId}`);
        }
    };

    const handleDuplicateJob = async (job: Job) => {
        try {
            const { id, ...jobData } = job;
            const newJob = {
                ...jobData,
                title: `${jobData.title} (עותק)`,
                status: JobStatus.PENDING_REVIEW,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                views: 0,
                isRecommended: false,
                isUrgent: false,
                isImmediate: false,
                isVerified: false
            };
            const newJobRef = await addDoc(collection(db, 'jobs'), newJob);

            // Create Task 
            let eliavAdminId = '';
            const adminQuery = query(collection(db, 'users'), where('role', '==', UserRole.ADMIN));
            const admins = await getDocs(adminQuery);
            const eliavUser = admins.docs.find(d => d.data().fullName?.includes('אליאב') || d.data().displayName?.includes('אליאב') || d.data().email?.includes('eliav'));
            eliavAdminId = eliavUser ? eliavUser.id : (admins.docs[0]?.id || '');
            const finalAssigneeId = user?.assignedAdminId || eliavAdminId;
            const pName = eliavUser && finalAssigneeId === eliavUser.id ? (eliavUser.data().displayName || eliavUser.data().fullName) : undefined;
            
            await addDoc(collection(db, 'reports'), {
                title: `אישור משרה: ${newJob.title}`,
                description: `משרה חדשה מאת מעסיק: ${newJob.companyName}. אנא עבור עליה ואשר אותה במערכת.`,
                priority: 'High',
                isResolved: false,
                assigneeId: finalAssigneeId,
                assigneeName: pName || null,
                createdAt: new Date().toISOString()
            });

            toast('המשרה שוכפלה בהצלחה ועברה לאישור.', 'success');
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'jobs');
        }
    };

    const handleCloseJob = async (jobId: string) => {
        try {
            await updateDoc(doc(db, 'jobs', jobId), { 
                status: JobStatus.CLOSED,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}`);
        }
    };

    const updateAppStatus = async (appId: string, status: ApplicationStatus) => {
        try {
            await updateDoc(doc(db, 'applications', appId), { status });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
        }
    };

    const openWhatsApp = (phone: string, applicantName: string, jobTitle: string) => {
        const message = encodeURIComponent(`היי ${applicantName}, אני פונה אליך לגבי המשרה "${jobTitle}" שפורסמה ב-JobShow.`);
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    };

    // Calculate Analytics
    const totalViews = jobs.reduce((acc, job) => acc + (job.views || 0), 0);
    const activeJobsCount = jobs.filter(j => j.status === JobStatus.ACTIVE).length;
    const totalApplicants = applications.length;
    const newApplicants = applications.filter(a => a.status === ApplicationStatus.NEW).length;

    if (loading) return <FullPageLoading message="טוען נתוני גיוס..." />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20" dir="rtl">
            <Helmet>
                <title>לוח בקרת מעסיק | עובדים בצ'יק</title>
                <meta name="description" content="נהלו את המשרות והמועמדים שלכם במקום אחד. צפו בסטטיסטיקות, עקבו אחר פניות וגייסו בצ'יק." />
            </Helmet>
            {/* Header Section */}
            <div className="bg-brand-dark text-white pt-24 pb-48 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[120px] -translate-y-1/2" />
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12">
                        <div className="text-right">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 md:mb-4">ניהול משרות ומועמדים</h1>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <p className="text-white/60 text-base md:text-lg font-bold">צפה בביצועי המשרות שלך ונהל את תהליכי הגיוס במקום אחד.</p>
                                <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                    <CreditCard className="text-brand-teal" size={18} />
                                    <span className="text-sm font-black text-white">{user?.credits || 0} קרדיטים</span>
                                    <Link to="/pricing" className="text-[10px] bg-brand-teal text-white px-2 py-1 rounded-lg hover:bg-teal-500 transition-colors uppercase tracking-widest">טען עוד</Link>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <button 
                                onClick={() => {
                                    import('../lib/firebase').then(({ auth }) => auth.signOut());
                                    navigate('/');
                                }}
                                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-6 py-3 rounded-2xl transition-all font-black text-sm border border-white/10 flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                התנתק
                            </button>
                            <Button
                                onClick={() => navigate('/employer/post-job')}
                                size="lg"
                                leftIcon={<Plus size={24} />}
                                className="px-10 py-5 rounded-[2rem] shadow-2xl shadow-teal-500/30"
                            >
                                פרסם משרה עכשיו
                            </Button>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'משרות פעילות', value: activeJobsCount, icon: Briefcase, color: 'text-brand-teal' },
                            { label: 'סך צפיות', value: totalViews, icon: Eye, color: 'text-brand-orange' },
                            { label: 'מועמדים סה"כ', value: totalApplicants, icon: Users, color: 'text-purple-400' },
                            { label: 'פניות חדשות', value: newApplicants, icon: TrendingUp, color: 'text-green-400' }
                        ].map((stat, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={stat.label} 
                            >
                                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 text-right hover:bg-white/10" hoverable={false}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn("p-3 rounded-2xl bg-white/5", stat.color)}>
                                            <stat.icon size={24} />
                                        </div>
                                        <Badge variant="neutral" className="bg-white/10 text-white/40">סטטיסטיקה</Badge>
                                    </div>
                                    <div className="text-4xl font-black mb-1">{stat.value}</div>
                                    <div className="text-white/50 text-sm font-bold">{stat.label}</div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20">
                {/* Tabs */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {[
                        { id: 'jobs', label: 'המשרות שלי', icon: Briefcase },
                        { id: 'applicants', label: 'מועמדים', icon: Users },
                        { id: 'stats', label: 'דוחות וביצועים', icon: BarChart3 },
                        { id: 'profile', label: 'עריכת פרופיל', icon: Building2 },
                        { id: 'credits', label: 'היסטוריית זכיינות', icon: CreditCard },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-xl",
                                activeTab === tab.id 
                                    ? "bg-white text-brand-dark scale-105" 
                                    : "bg-brand-dark/20 text-white/70 hover:bg-brand-dark/30 backdrop-blur-md"
                            )}
                        >
                            <tab.icon size={20} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search and Filters */}
                <Card className="rounded-[2rem] p-4 mb-8 flex flex-col md:flex-row gap-4 items-center" hoverable={false}>
                    <div className="flex-1 w-full">
                        <Input 
                            placeholder="חפש משרה או מועמד..."
                            icon={<Search size={20} />}
                            className="h-14 pr-16 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-14 px-8" leftIcon={<Filter size={20} />}>
                        סינון
                    </Button>
                </Card>

                <AnimatePresence mode="wait">
                    {activeTab === 'jobs' && (
                        <motion.div 
                            key="jobs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col gap-6"
                        >
                            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full max-w-sm mx-auto mb-2 border border-slate-100/50">
                                <button
                                    onClick={() => setJobSubTab('long-term')}
                                    className={cn(
                                        "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                                        jobSubTab === 'long-term' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    משרות קבע
                                </button>
                                <button
                                    onClick={() => setJobSubTab('casual')}
                                    className={cn(
                                        "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                                        jobSubTab === 'casual' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    משרות מזדמנות
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {(() => {
                                    const filteredJobs = jobs.filter(j => 
                                        j.title.includes(searchQuery) &&
                                        (jobSubTab === 'casual' ? (j.isCasual || (j as any).jobCategoryType === 'casual') : (!j.isCasual && (j as any).jobCategoryType !== 'casual'))
                                    );
                                    
                                    if (filteredJobs.length === 0) {
                                        return (
                                            <div className="col-span-full">
                                                <EmptyState 
                                                    title={jobSubTab === 'casual' ? 'אין לך משרות מזדמנות עדיין' : 'אין לך משרות קבע עדיין'}
                                                    description="זה הזמן לפרסם את המשרה הראשונה שלך בקטגוריה זו ולהתחיל לקבל פניות."
                                                    icon={Briefcase}
                                                    action={{
                                                        label: "פרסם משרה",
                                                        onClick: () => navigate('/employer/post-job')
                                                    }}
                                                />
                                            </div>
                                        );
                                    }
                                    
                                    return filteredJobs.map(job => (
                                    <Card key={job.id} className="flex flex-col gap-6 group overflow-hidden relative border-slate-50">
                                        <div className="flex justify-between items-start">
                                            <div className="text-right">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge 
                                                        variant={
                                                            job.status === JobStatus.ACTIVE ? "success" :
                                                            job.status === JobStatus.PENDING_REVIEW ? "warning" :
                                                            "danger"
                                                        }
                                                    >
                                                        {job.status === JobStatus.ACTIVE ? 'פעילה' :
                                                         job.status === JobStatus.PENDING_REVIEW ? 'ממתינה לאישור' : 'סגורה'}
                                                    </Badge>
                                                    
                                                    {job.promotionLevel && job.promotionLevel !== PromotionLevel.REGULAR && (
                                                        <Badge 
                                                            variant={
                                                                job.promotionLevel === PromotionLevel.HIGHLIGHTED ? "purple" :
                                                                job.promotionLevel === PromotionLevel.HOT ? "accent" :
                                                                "danger"
                                                            }
                                                        >
                                                            <Star size={10} />
                                                            {job.promotionLevel === PromotionLevel.HIGHLIGHTED ? 'מודגשת' :
                                                             job.promotionLevel === PromotionLevel.HOT ? 'חמה' : 'דחופה'}
                                                        </Badge>
                                                    )}
                                                    <span className="text-slate-300 text-xs font-bold">{new Date(job.createdAt).toLocaleDateString('he-IL')}</span>
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-brand-teal transition-colors">{job.title}</h3>
                                                <div className="text-slate-500 font-bold text-sm flex items-center gap-2 text-right justify-end">
                                                    {job.type} • {job.location}
                                                    <Briefcase size={14} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => navigate(`/employer/jobs/${job.id}`)}
                                                    title="צפה בפרטי משרה ומועמדים"
                                                >
                                                    <Eye size={20} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => handleDuplicateJob(job)}
                                                    title="שכפל משרה"
                                                >
                                                    <Copy size={20} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => navigate(`/employer/edit-job/${job.id}`)}
                                                    title="ערוך משרה"
                                                >
                                                    <Edit size={20} />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 border-y border-slate-50 py-6">
                                            <div className="text-center border-l border-slate-50">
                                                <div className="text-2xl font-black text-slate-900">{job.views || 0}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">צפיות</div>
                                            </div>
                                            <div className="text-center border-l border-slate-50">
                                                <div className="text-2xl font-black text-slate-900">
                                                    {applications.filter(a => a.jobId === job.id).length}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מועמדים</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-black text-brand-orange">
                                                    {applications.filter(a => a.jobId === job.id && a.status === ApplicationStatus.NEW).length}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">פניות חדשות</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {job.status === JobStatus.ACTIVE && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleCloseJob(job.id)}
                                                        leftIcon={<Power size={16} />}
                                                    >
                                                        סגור משרה
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="text-slate-300 hover:text-red-500"
                                                    onClick={() => handleDeleteJob(job.id)}
                                                >
                                                    <Trash2 size={20} />
                                                </Button>
                                            </div>
                                            <Link 
                                                to={`/job/${job.id}`}
                                                className="text-brand-teal font-black text-sm flex items-center gap-1 hover:underline"
                                            >
                                                צפה בדף המשרה <ExternalLink size={16} />
                                            </Link>
                                        </div>
                                    </Card>
                                ));
                            })()}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {activeTab === 'applicants' && (
                        <motion.div 
                            key="applicants"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="md:hidden space-y-4">
                                {applications.length === 0 ? (
                                    <EmptyState 
                                        title="אין עדיין מועמדים" 
                                        description="ברגע שמישהו יגיש מועמדות לאחת המשרות שלך, הפרטים שלו יופיעו כאן."
                                        icon={Users}
                                    />
                                ) : (
                                    applications
                                        .filter(a => a.applicantName.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(app => (
                                            <Card key={app.id} className="p-5 border-slate-100 shadow-sm" hoverable={false}>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 flex items-center justify-center text-brand-teal font-black shrink-0">
                                                        {app.applicantName.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-lg font-black text-slate-900 truncate">{app.applicantName}</div>
                                                        <div className="text-xs text-slate-500 font-bold truncate">{app.applicantEmail}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-black text-slate-400">משרה:</span>
                                                        <span className="font-bold text-slate-700">{jobs.find(j => j.id === app.jobId)?.title || 'משרה לא ידועה'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="font-black text-slate-400">סטטוס:</span>
                                                        <select 
                                                            value={app.status}
                                                            onChange={(e) => updateAppStatus(app.id, e.target.value as ApplicationStatus)}
                                                            className={cn(
                                                                "px-3 py-1 rounded-xl text-xs font-black border-none focus:ring-0 outline-none cursor-pointer",
                                                                app.status === ApplicationStatus.NEW ? "bg-blue-50 text-blue-600" :
                                                                app.status === ApplicationStatus.REVIEWING ? "bg-yellow-50 text-yellow-600" :
                                                                app.status === ApplicationStatus.INTERVIEW ? "bg-purple-50 text-purple-600" :
                                                                app.status === ApplicationStatus.HIRED ? "bg-green-50 text-green-600" :
                                                                app.status === ApplicationStatus.REJECTED ? "bg-red-50 text-red-600" :
                                                                "bg-slate-50 text-slate-400"
                                                            )}
                                                        >
                                                            <option value={ApplicationStatus.NEW}>חדש</option>
                                                            <option value={ApplicationStatus.REVIEWING}>בבחינה</option>
                                                            <option value={ApplicationStatus.INTERVIEW}>ראיון</option>
                                                            <option value={ApplicationStatus.HIRED}>התקבל</option>
                                                            <option value={ApplicationStatus.REJECTED}>נדחה</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <Button 
                                                            className="flex-1 rounded-xl"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(app.cvUrl, '_blank')}
                                                            leftIcon={<Download size={16} />}
                                                        >
                                                            קורות חיים
                                                        </Button>
                                                        <Button 
                                                            className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white"
                                                            size="sm"
                                                            onClick={() => openWhatsApp(app.applicantPhone, app.applicantName, jobs.find(j => j.id === app.jobId)?.title || '')}
                                                            leftIcon={<MessageCircle size={16} />}
                                                        >
                                                            WhatsApp
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))
                                )}
                            </div>

                            <Card className="hidden md:block p-0 overflow-hidden border-slate-50" hoverable={false}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="p-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">מועמד</th>
                                                <th className="p-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">משרה</th>
                                                <th className="p-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">סטטוס</th>
                                                <th className="p-8 text-right text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">תאריך פנייה</th>
                                                <th className="p-8 text-center text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">פעולות</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {applications.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-12 px-8">
                                                        <EmptyState 
                                                            title="אין עדיין מועמדים" 
                                                            description="ברגע שמישהו יגיש מועמדות לאחת המשרות שלך, הפרטים שלו יופיעו כאן."
                                                            icon={Users}
                                                        />
                                                    </td>
                                                </tr>
                                            ) : (
                                                applications
                                                    .filter(a => a.applicantName.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .map(app => (
                                                    <tr key={app.id} className="hover:bg-slate-50/30 transition-colors">
                                                        <td className="p-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 flex items-center justify-center text-brand-teal font-black">
                                                                    {app.applicantName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="text-lg font-black text-slate-900">{app.applicantName}</div>
                                                                    <div className="text-sm text-slate-500 font-bold">{app.applicantEmail}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-8">
                                                            <div className="text-sm font-black text-slate-700">
                                                                {jobs.find(j => j.id === app.jobId)?.title || 'משרה לא ידועה'}
                                                            </div>
                                                        </td>
                                                        <td className="p-8">
                                                            <select 
                                                                value={app.status}
                                                                onChange={(e) => updateAppStatus(app.id, e.target.value as ApplicationStatus)}
                                                                className={cn(
                                                                    "px-3 py-1.5 rounded-xl text-xs font-black border-none focus:ring-0 outline-none cursor-pointer",
                                                                    app.status === ApplicationStatus.NEW ? "bg-blue-50 text-blue-600" :
                                                                    app.status === ApplicationStatus.REVIEWING ? "bg-yellow-50 text-yellow-600" :
                                                                    app.status === ApplicationStatus.INTERVIEW ? "bg-purple-50 text-purple-600" :
                                                                    app.status === ApplicationStatus.HIRED ? "bg-green-50 text-green-600" :
                                                                    app.status === ApplicationStatus.REJECTED ? "bg-red-50 text-red-600" :
                                                                    "bg-slate-50 text-slate-400"
                                                                )}
                                                            >
                                                                <option value={ApplicationStatus.NEW}>חדש</option>
                                                                <option value={ApplicationStatus.REVIEWING}>בבחינה</option>
                                                                <option value={ApplicationStatus.INTERVIEW}>ראיון</option>
                                                                <option value={ApplicationStatus.HIRED}>התקבל</option>
                                                                <option value={ApplicationStatus.REJECTED}>נדחה</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-8">
                                                            <div className="text-sm text-slate-400 font-bold">{new Date(app.createdAt).toLocaleDateString('he-IL')}</div>
                                                        </td>
                                                        <td className="p-8">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon"
                                                                    onClick={() => window.open(app.cvUrl, '_blank')}
                                                                    className="bg-slate-50 text-slate-400 hover:bg-brand-orange hover:text-white"
                                                                    title="צפה בקורות חיים"
                                                                >
                                                                    <Download size={18} />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon"
                                                                    onClick={() => openWhatsApp(app.applicantPhone, app.applicantName, jobs.find(j => j.id === app.jobId)?.title || '')}
                                                                    className="bg-slate-50 text-slate-400 hover:bg-green-500 hover:text-white"
                                                                    title="דבר איתו בוואטסאפ"
                                                                >
                                                                    <MessageCircle size={18} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8 text-right"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="p-6 md:p-10 border-slate-50" hoverable={false}>
                                    <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                        <TrendingUp className="text-brand-teal" /> ביצועי משרות
                                    </h3>
                                    <div className="space-y-6">
                                        {jobs.slice(0, 5).map(job => (
                                            <div key={job.id} className="space-y-2">
                                                <div className="flex justify-between items-center text-sm font-black">
                                                    <span className="text-slate-900">{job.title}</span>
                                                    <span className="text-slate-400">{job.views || 0} צפיות</span>
                                                </div>
                                                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden text-right" dir="rtl">
                                                    <div 
                                                        className="h-full bg-brand-teal rounded-full transition-all duration-1000"
                                                        style={{ width: `${Math.min(((job.views || 0) / (totalViews || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {jobs.length === 0 && <p className="text-slate-400 font-bold py-10 text-center">אין נתוני משרות עדיין.</p>}
                                    </div>
                                </Card>

                                <Card className="p-6 md:p-10 border-slate-50" hoverable={false}>
                                    <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                        <BarChart3 className="text-brand-orange" /> פילוח מועמדים
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        {[
                                            { label: 'פניות חדשות', count: applications.filter(a => a.status === ApplicationStatus.NEW).length, color: 'bg-blue-500' },
                                            { label: 'בבחינה', count: applications.filter(a => a.status === ApplicationStatus.REVIEWING).length, color: 'bg-yellow-500' },
                                            { label: 'ראיונות', count: applications.filter(a => a.status === ApplicationStatus.INTERVIEW).length, color: 'bg-purple-500' },
                                            { label: 'התקבלו', count: applications.filter(a => a.status === ApplicationStatus.HIRED).length, color: 'bg-green-500' }
                                        ].map(stat => (
                                            <div key={stat.label} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                                <div className={cn("w-3 h-3 rounded-full mb-3", stat.color)} />
                                                <div className="text-3xl font-black text-slate-900 mb-1 text-right">{stat.count}</div>
                                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest text-right">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <Card className="bg-brand-dark rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden" hoverable={false}>
                                <div className="absolute top-0 left-0 w-64 h-64 bg-brand-teal/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="text-right">
                                        <h3 className="text-3xl font-black mb-4">רוצה לקבל יותר פניות?</h3>
                                        <p className="text-white/60 font-bold mb-8 max-w-lg">קדם את המשרות שלך לראש הלוח והגדל את החשיפה פי 5. משרה מודגשת מקבלת בממוצע יותר פניות איכותיות בתוך פחות מ-24 שעות.</p>
                                        <Button 
                                            onClick={() => navigate('/pricing')}
                                            rightIcon={<ArrowUpRight size={20} />}
                                            className="px-8 py-4 shadow-xl shadow-teal-500/20"
                                        >
                                            שדרג לחבילת פרסום
                                        </Button>
                                    </div>
                                    <div className="hidden md:block">
                                        <div className="w-48 h-48 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative">
                                            <TrendingUp size={64} className="text-brand-teal" />
                                            <div className="absolute -top-2 -right-2 w-12 h-12 bg-brand-orange text-white rounded-full flex items-center justify-center font-black animate-bounce shadow-lg">
                                                5X
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="max-w-2xl mx-auto space-y-8"
                        >
                            <Card className="p-6 sm:p-8 md:p-12 rounded-[3rem]">
                                <h3 className="text-2xl font-black text-slate-800 mb-2">פרופיל חברה</h3>
                                <p className="text-slate-500 font-medium mb-8">
                                    הגדר את פרטי החברה שלך. התיאור יופיע במשרות שתפרסם ויעזור למועמדים להכיר אתכם טוב יותר.
                                </p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">שם החברה</label>
                                        <Input
                                            value={employerProfile.companyName}
                                            onChange={(e) => setEmployerProfile({ ...employerProfile, companyName: e.target.value })}
                                            placeholder="הזן את שם החברה"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">על המעסיק / תיאור החברה</label>
                                        <textarea
                                            value={employerProfile.companyDescription}
                                            onChange={(e) => setEmployerProfile({ ...employerProfile, companyDescription: e.target.value })}
                                            placeholder={`לדוגמה: "אנחנו ב-${employerProfile.companyName || 'חברה'} מאמינים שהאנשים שלנו הם הלב הפועם של החברה..."`}
                                            className="w-full min-h-[150px] p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none resize-y transition-all text-sm"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="w-full py-4 text-lg font-bold"
                                    >
                                        {isSavingProfile ? 'שומר שינויים...' : 'שמור שינויים'}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === 'credits' && (
                        <motion.div
                            key="credits"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col justify-between bg-white/40 p-6 md:p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">יתרת קרדיטים אישית</h3>
                                        <p className="text-slate-500 font-bold mt-1">קרדיטים מאפשרים פרסום משרות (5 קרדיטים = 1 משרה)</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="text-left">
                                            <span className="text-4xl font-black text-brand-teal">{user?.credits || 0}</span>
                                            <span className="text-slate-500 font-bold mr-2 text-sm">זמינים פה</span>
                                        </div>
                                        <Link to="/pricing">
                                            <Button className="rounded-2xl" leftIcon={<Plus size={18} />}>רכישת קרדיטים</Button>
                                        </Link>
                                    </div>
                                </div>

                                {company && (
                                    <div className="flex flex-col justify-between bg-white p-6 md:p-8 rounded-[3rem] border border-indigo-100 shadow-xl shadow-indigo-100/50">
                                        <div>
                                            <h3 className="text-2xl font-black text-indigo-900 flex items-center gap-2">
                                                <Building2 size={24} className="text-indigo-600" /> 
                                                מאגר החברה
                                            </h3>
                                            <p className="text-indigo-600/70 font-bold mt-1 text-sm">קרדיטים הניתנים לשימוש על ידי כלל המעסיקים בחברה ({company.name}).</p>
                                        </div>
                                        <div className="flex flex-col mt-4">
                                            <div className="flex items-end mb-4">
                                                <span className="text-4xl font-black text-indigo-600">{company.credits || 0}</span>
                                                <span className="text-indigo-600/70 font-bold mr-2 text-sm pb-1">משותפים בחברה</span>
                                            </div>
                                            {(user?.credits || 0) > 0 && (
                                                <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-2xl mb-2">
                                                    <input 
                                                        type="number"
                                                        value={transferAmount}
                                                        onChange={(e) => setTransferAmount(Number(e.target.value) || '')}
                                                        placeholder="כמות להעברה לחברה"
                                                        className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                        min={1}
                                                        max={user?.credits || 1}
                                                    />
                                                    <Button onClick={handleTransferToCompany} disabled={isTransferring || !transferAmount || transferAmount <= 0} className="rounded-xl whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                                                        העבר לחברה
                                                    </Button>
                                                </div>
                                            )}
                                            {(company.credits || 0) > 0 && user?.isCompanyAdmin && (
                                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                                    <input  
                                                        type="number"
                                                        id="transferFromCompanyInput"
                                                        placeholder="משוך כמות אלי"
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                                        min={1}
                                                        max={company.credits || 1}
                                                    />
                                                    <Button 
                                                        onClick={async () => {
                                                            const val = Number((document.getElementById('transferFromCompanyInput') as HTMLInputElement).value);
                                                            if (!val || val <= 0 || val > (company.credits || 0)) {
                                                                toast('סכום לא תקין', 'error');
                                                                return;
                                                            }
                                                            setIsTransferring(true);
                                                            try {
                                                                const batch = writeBatch(db);
                                                                batch.update(doc(db, 'users', user!.uid), {
                                                                   credits: (user!.credits || 0) + val 
                                                                });
                                                                batch.update(doc(db, 'companies', company.id), {
                                                                   credits: (company.credits || 0) - val 
                                                                });
                                                                batch.set(doc(collection(db, 'credit_transactions')), {
                                                                    employerId: user!.uid,
                                                                    amount: val,
                                                                    type: 'TRANSFER_FROM_COMPANY',
                                                                    companyId: company.id,
                                                                    createdAt: new Date().toISOString()
                                                                });
                                                                await batch.commit();
                                                                setCompany({...company, credits: (company.credits || 0) - val});
                                                                // User updates handled by auth or just UX
                                                                toast('קרדיטים נמשכו אליך בהצלחה', 'success');
                                                                (document.getElementById('transferFromCompanyInput') as HTMLInputElement).value = '';
                                                            } catch (e) {
                                                                toast('אירעה שגיאה', 'error');
                                                            } finally {
                                                                setIsTransferring(false);
                                                            }
                                                        }} 
                                                        disabled={isTransferring} 
                                                        className="rounded-xl whitespace-nowrap bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
                                                    >
                                                        העבר אלי
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Card className="p-6 md:p-10 rounded-[3rem] shadow-xl shadow-slate-200/50">
                                <h3 className="text-xl font-black text-slate-800 mb-8 border-b pb-4">היסטוריית זכיינות (קרדיטים)</h3>
                                
                                {transactions.length === 0 ? (
                                    <EmptyState
                                        title="אין היסטוריית פעולות"
                                        description="עדיין לא בוצעו פעולות בחשבון זה."
                                        icon={CreditCard}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {transactions.map(tx => (
                                            <div key={tx.id} className="flex flex-col md:flex-row items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center -rotate-6",
                                                        isPositiveTx(tx.type) ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                                    )}>
                                                        <CreditCard size={20} className={isPositiveTx(tx.type) ? "" : "rotate-180"} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800">
                                                            {getTxTypeLabel(tx.type)}
                                                        </p>
                                                        <p className="text-sm text-slate-500 font-medium">
                                                            {new Date(tx.createdAt).toLocaleDateString('he-IL', {
                                                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 md:mt-0 pr-4 border-r md:border-r-0 md:pl-4 md:border-l border-slate-200 text-left">
                                                    <div className={cn(
                                                        "text-xl font-black drop-shadow-sm",
                                                        isPositiveTx(tx.type) ? "text-green-500" : "text-red-500"
                                                    )}>
                                                    <span className="text-sm font-bold opacity-60 ml-1">קרדיטים</span>
                                                    <span dir="ltr">
                                                        {isPositiveTx(tx.type) ? '+' : '-'}
                                                        {Math.abs(tx.amount)}
                                                    </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EmployerDashboard;

