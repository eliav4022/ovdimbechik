import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Job, User, JobStatus, UserRole } from '../../types';
import { ArrowRight, Building2, Briefcase, Mail, Phone, CalendarDays, Loader2, Globe, MapPin, ShieldCheck, ShieldAlert, Users, UserPlus, UserMinus, Plus, Sparkles, Coins, Edit2, Trash2 } from 'lucide-react';
import { AdminTable } from '../../components/admin/AdminTable';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { assignEmployerToCompany, unlinkEmployerFromCompany, ensureDefaultEntities, syncCompanyNameChange } from '../../services/entityService';
import { addCompanyCredits } from '../../services/creditService';
import { softDelete } from '../../lib/adminUtils';
import { useAuth } from '../../lib/AuthContext';

export const AdminCompanyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();

    const [company, setCompany] = useState<any | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [employers, setEmployers] = useState<User[]>([]);
    const [allEmployers, setAllEmployers] = useState<User[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    
    const initialTab = (searchParams.get('tab') as 'general' | 'employers' | 'jobs' | 'credits') || 'general';
    const [activeTab, setActiveTab] = useState<'general' | 'employers' | 'jobs' | 'credits'>(initialTab);
    
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedEmployerToAssign, setSelectedEmployerToAssign] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Edit Company Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState<any>({});

    // Add Credits Modal
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [creditsAmount, setCreditsAmount] = useState<number>(50);
    const [isAddingCredits, setIsAddingCredits] = useState(false);

    // Delete Company Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const isDefaultCompany = company?.isDefault || company?.id === 'comp_default';

    const fetchCompanyData = async () => {
        if (!id) return;
        setLoading(true);

        try {
            await ensureDefaultEntities();

            // 1. Fetch company document
            const compRef = doc(db, 'companies', id);
            const compSnap = await getDoc(compRef);

            if (!compSnap.exists()) {
                toast('חברה לא נמצאה', 'error');
                navigate('/admin/companies');
                return;
            }

            const compData = { id: compSnap.id, ...compSnap.data() } as any;
            setCompany(compData);
            setEditData(compData);

            // 2. Fetch associated Employers
            const empsQuery = query(collection(db, 'users'), where('role', '==', UserRole.EMPLOYER));
            const empsSnap = await getDocs(empsQuery);
            const loadedAllEmps = empsSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as User));
            setAllEmployers(loadedAllEmps);

            // Filter employers linked to this company (or all employers with no company if this is default company)
            const linkedEmps = loadedAllEmps.filter(e => e.companyId === id || (compData.isDefault && !e.companyId));
            setEmployers(linkedEmps);

            // 3. Fetch Jobs associated with this company
            const jobsQuery = query(collection(db, 'jobs'), where('companyId', '==', id));
            const jobsSnap = await getDocs(jobsQuery);
            let loadedJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Job));

            // If default company or old data without companyId, also collect jobs from linked employers
            if (compData.isDefault) {
                const unassignedJobsQuery = query(collection(db, 'jobs'));
                const unassignedSnap = await getDocs(unassignedJobsQuery);
                loadedJobs = unassignedSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as unknown as Job))
                    .filter(j => j.companyId === id || !j.companyId);
            }

            setJobs(loadedJobs);

            // 4. Fetch transactions for company
            try {
                const txQ = query(collection(db, 'credit_transactions'), where('companyId', '==', String(id)));
                const txSnap = await getDocs(txQ);
                const txs = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                txs.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
                setTransactions(txs);
            } catch(e) { console.error('Error fetching company trans', e); }

        } catch (err: any) {
            console.error("Error fetching detail:", err);
            toast('שגיאה בטעינת נתוני חברה', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyData();
    }, [id, navigate]);

    const handleTabChange = (tab: 'general' | 'employers' | 'jobs' | 'credits') => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const handleAssignEmployer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployerToAssign || !company) return;

        setIsAssigning(true);
        try {
            await assignEmployerToCompany(selectedEmployerToAssign, company.id, company.name);
            toast('המעסיק שויך לחברה בהצלחה', 'success');
            setIsAssignModalOpen(false);
            setSelectedEmployerToAssign('');
            await fetchCompanyData();
        } catch (error: any) {
            console.error(error);
            toast('שגיאה בשיוך המעסיק', 'error');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUnlinkEmployer = async (emp: User) => {
        if (!emp) return;
        try {
            await unlinkEmployerFromCompany(emp.id || emp.uid);
            toast(`שיוך המעסיק ${emp.displayName} הוסר והועבר לחברה הכללית`, 'success');
            await fetchCompanyData();
        } catch (error: any) {
            console.error(error);
            toast('שגיאה בהסרת שיוך מעסיק', 'error');
        }
    };

    const handleToggleVerify = async () => {
        if (!company) return;
        try {
            const nextStatus = !company.isVerified;
            await setDoc(doc(db, 'companies', company.id), {
                isVerified: nextStatus,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setCompany({ ...company, isVerified: nextStatus });
            toast(nextStatus ? 'החברה אומתה בהצלחה' : 'אימות החברה בוטל', 'success');
        } catch (e) {
            toast('שגיאה בעדכון אימות', 'error');
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company || !editData.name?.trim()) {
            toast('שם חברה הינו שדה חובה', 'error');
            return;
        }

        try {
            const oldName = company.name;
            const newName = editData.name.trim();

            await setDoc(doc(db, 'companies', company.id), {
                name: newName,
                industry: editData.industry || 'כללי',
                location: editData.location || 'ישראל',
                website: editData.website || '',
                description: editData.description || '',
                logoUrl: editData.logoUrl || null,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            if (oldName !== newName) {
                await syncCompanyNameChange(company.id, newName);
            }

            setCompany({ ...company, ...editData, name: newName });
            setIsEditModalOpen(false);
            toast('פרטי החברה עודכנו בהצלחה', 'success');
        } catch (e) {
            console.error(e);
            toast('שגיאה בעדכון החברה', 'error');
        }
    };

    const handleAddCreditsSubmit = async () => {
        if (!company || !creditsAmount || creditsAmount <= 0) {
            toast('נא להזין כמות תקינה', 'error');
            return;
        }
        setIsAddingCredits(true);
        try {
            await addCompanyCredits(company.id, creditsAmount, 'ADMIN_ADDITION', `טעינה מנהלתית - ${creditsAmount} קרדיטים`);
            toast(`${creditsAmount} קרדיטים נוספו בהצלחה לקופת החברה`, 'success');
            setCompany({ ...company, credits: (company.credits || 0) + creditsAmount });
            setIsCreditsModalOpen(false);
            await fetchCompanyData();
        } catch (e) {
            console.error(e);
            toast('שגיאה בהוספת קרדיטים', 'error');
        } finally {
            setIsAddingCredits(false);
        }
    };

    const handleDeleteCompany = async () => {
        if (!company || !currentUser) return;
        if (isDefaultCompany) {
            toast('לא ניתן למחוק את חברת ברירת המחדל', 'error');
            return;
        }
        try {
            await softDelete({
                collectionName: 'companies',
                id: company.id,
                deletedBy: currentUser.uid,
                reason: 'ארכוב חברה מדף הרשומה'
            });
            toast('החברה הועברה לארכיון בהצלחה', 'success');
            navigate('/admin/companies');
        } catch (e) {
            console.error(e);
            toast('שגיאה בארכוב החברה', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!company) return null;

    const formatDate = (isoString?: string) => {
        if (!isoString) return 'לא ידוע';
        return format(new Date(isoString), 'dd/MM/yyyy HH:mm', { locale: he });
    };

    const jobsColumns = [
        { key: 'title', header: 'כותרת משרה', render: (j: Job) => <Link className="font-bold text-slate-900 hover:text-indigo-600 hover:underline" to={`/admin/jobs/${j.id}`}>{j.title}</Link> },
        { key: 'status', header: 'סטטוס', render: (j: Job) => <Badge variant={(j.status === 'Published' || j.status === JobStatus.ACTIVE) ? 'success' : (j.status === 'Draft' || j.status === JobStatus.DRAFT) ? 'neutral' : 'warning'}>{j.status}</Badge> },
        { key: 'applicationsCount', header: 'מועמדויות', render: (j: Job) => <span className="font-mono">{j.applicationsCount || 0}</span> },
        { key: 'createdAt', header: 'תאריך יצירה', render: (j: Job) => formatDate(j.createdAt) }
    ];

    const employersColumns = [
        {
            key: 'displayName',
            header: 'שם מעסיק',
            render: (u: User) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                        {u.displayName?.[0] || '?'}
                    </div>
                    <div>
                        <Link to={`/admin/employers/${u.id || u.uid}`} className="font-bold text-slate-900 hover:text-indigo-600 hover:underline block">
                            {u.displayName || u.fullName || 'ללא שם'}
                        </Link>
                        <span className="text-xs text-slate-400 font-mono">{u.email}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'phone',
            header: 'טלפון',
            render: (u: User) => <span className="text-xs font-mono">{u.phone || '-'}</span>
        },
        {
            key: 'credits',
            header: 'קרדיטים אישיים',
            render: (u: User) => (
                <Badge variant="brand" className="font-mono text-xs font-black">
                    {u.credits || 0}
                </Badge>
            )
        },
        {
            key: 'isVerified',
            header: 'סטטוס',
            render: (u: User) => (
                u.isVerified ? (
                    <Badge variant="success" className="text-[10px] font-black flex items-center gap-1">
                        <ShieldCheck size={12} />
                        מאומת
                    </Badge>
                ) : (
                    <Badge variant="warning" className="text-[10px] font-black">
                        טרם אומת
                    </Badge>
                )
            )
        },
        {
            key: 'actions',
            header: 'פעולות',
            render: (u: User) => (
                <div className="flex items-center gap-2">
                    <Link to={`/admin/employers/${u.id || u.uid}`} className="text-xs font-bold text-indigo-600 hover:underline">
                        צפה בפרופיל
                    </Link>
                    {!isDefaultCompany && (
                        <button
                            onClick={() => handleUnlinkEmployer(u)}
                            className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 mr-3"
                            title="הסר שיוך מחברה זו (יעבור לעובדים בצ'יק כללי)"
                        >
                            <UserMinus size={13} />
                            הסר שיוך
                        </button>
                    )}
                </div>
            )
        }
    ];

    const unassignedOrOtherEmployers = allEmployers.filter(e => e.companyId !== company.id);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/companies')} 
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                    >
                        <ArrowRight size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
                            ) : (
                                <Building2 className="text-slate-300" size={32} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    {company.name}
                                    {company.isVerified && <ShieldCheck className="text-emerald-500" size={24} />}
                                </h1>
                                {isDefaultCompany && (
                                    <Badge variant="brand" className="text-[10px] font-black bg-indigo-100 text-indigo-700">
                                        <Sparkles size={11} className="mr-1" />
                                        חברת ברירת מחדל
                                    </Badge>
                                )}
                            </div>
                            <p className="text-slate-500 font-bold text-sm mt-1">{company.industry || 'תעשייה כללית'} | {company.location || 'ישראל'}</p>
                        </div>
                    </div>
                </div>

                {/* Synchronized Header Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                        onClick={() => {
                            setCreditsAmount(50);
                            setIsCreditsModalOpen(true);
                        }}
                        leftIcon={<Coins size={16} />}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                    >
                        הוסף קרדיטים ({company.credits || 0})
                    </Button>

                    <Button 
                        onClick={() => {
                            setEditData(company);
                            setIsEditModalOpen(true);
                        }}
                        leftIcon={<Edit2 size={16} />}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                    >
                        עריכה
                    </Button>

                    <Button 
                        onClick={handleToggleVerify}
                        leftIcon={company.isVerified ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                        className={`font-bold ${company.isVerified ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {company.isVerified ? 'מאומת' : 'אמת חברה'}
                    </Button>

                    {!isDefaultCompany && (
                        <>
                            <Button 
                                onClick={() => setIsAssignModalOpen(true)}
                                leftIcon={<UserPlus size={16} />}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                            >
                                שייך מעסיק
                            </Button>

                            <Button 
                                onClick={() => setIsDeleteModalOpen(true)}
                                leftIcon={<Trash2 size={16} />}
                                className="bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold"
                            >
                                ארכוב
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Dashboard Cards for Company */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">מעסיקים משויכים</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={18} /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 mt-2">{employers.length}</div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">מעסיקים הפועלים תחת ישות-אב זו</span>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">סה"כ משרות</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase size={18} /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 mt-2">{jobs.length}</div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">משרות המשויכות לחברה</span>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">קרדיטים משותפים</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Sparkles size={18} /></div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 mt-2">{company.credits || 0}</div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1">קופת קרדיטים משותפת לחברה</span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => handleTabChange('general')}
                >
                    <Building2 size={16} />
                    פרטים כלליים
                </button>
                <button
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'employers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => handleTabChange('employers')}
                >
                    <Users size={16} />
                    מעסיקים משויכים ({employers.length})
                </button>
                <button
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => handleTabChange('jobs')}
                >
                    <Briefcase size={16} />
                    משרות בחברה ({jobs.length})
                </button>
                <button
                    className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'credits' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => handleTabChange('credits')}
                >
                    <Sparkles size={16} />
                    קרדיטים משותפים ({company.credits || 0})
                </button>
            </div>

            {/* Tab: General */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <h2 className="font-black text-lg text-slate-800">פרטי התאגיד והמותג</h2>
                            <Button size="sm" variant="ghost" onClick={() => { setEditData(company); setIsEditModalOpen(true); }} className="text-indigo-600 font-bold">
                                <Edit2 size={14} className="mr-1" /> ערוך
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <Building2 size={16} /> שם התאגיד:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">{company.name}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <MapPin size={16} /> מיקום (מטה):
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">{company.location || 'ישראל'}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                ענף/תעשייה:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">{company.industry || 'כללי'}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <Globe size={16} /> אתר אינטרנט:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">
                                {company.website ? <a href={company.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{company.website}</a> : 'לא סופק'}
                            </span>
                        </div>

                        {company.description && (
                            <div className="pt-2">
                                <span className="text-slate-400 font-bold text-sm block mb-1">תיאור החברה:</span>
                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">{company.description}</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <h2 className="font-black text-lg text-slate-800">מעסיקים משויכים ({employers.length})</h2>
                            {!isDefaultCompany && (
                                <Button size="sm" variant="ghost" onClick={() => setIsAssignModalOpen(true)} className="text-indigo-600 font-bold">
                                    + הוסף שיוך
                                </Button>
                            )}
                        </div>

                        {employers.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {employers.map(emp => (
                                    <div key={emp.id || emp.uid} className="py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {emp.displayName?.[0] || '?'}
                                            </div>
                                            <div>
                                                <Link to={`/admin/employers/${emp.id || emp.uid}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600 hover:underline">
                                                    {emp.displayName || emp.fullName}
                                                </Link>
                                                <div className="text-xs text-slate-400 font-mono">{emp.email}</div>
                                            </div>
                                        </div>
                                        <Link to={`/admin/employers/${emp.id || emp.uid}`} className="text-xs text-indigo-600 font-bold hover:underline">
                                            פרטים
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-slate-50 rounded-xl">
                                <p className="text-slate-500 font-medium text-sm">אין כרגע מעסיקים המשויכים ישירות לחברה זו</p>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 py-2 mt-auto pt-4 border-t border-slate-100 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <CalendarDays size={16} /> רשומה במערכת מ:
                            </span>
                            <span className="col-span-2 font-medium text-slate-800">{formatDate(company.createdAt)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Employers */}
            {activeTab === 'employers' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="font-black text-lg text-slate-800">מעסיקים הפועלים תחת החברה</h2>
                            <p className="text-xs text-slate-400 font-bold">חברה היא אובייקט אב המאגד תחתיו משתמשי מעסיק.</p>
                        </div>
                        {!isDefaultCompany && (
                            <Button 
                                onClick={() => setIsAssignModalOpen(true)}
                                leftIcon={<UserPlus size={16} />}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                size="sm"
                            >
                                שייך מעסיק לחברה
                            </Button>
                        )}
                    </div>

                    {employers.length > 0 ? (
                        <AdminTable<User> data={employers} columns={employersColumns as any} searchFields={['displayName', 'email', 'phone']} title="מעסיקים משויכים" />
                    ) : (
                        <div className="p-8 md:p-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">לא נמצאו מעסיקים המשויכים לחברה זו</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Jobs */}
            {activeTab === 'jobs' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="font-black text-lg text-slate-800 mb-4 flex justify-between items-center">
                         משרות החברה ({jobs.length})
                    </h2>
                    {jobs.length > 0 ? (
                        <AdminTable<Job> data={jobs} columns={jobsColumns as any} searchFields={['title', 'status']} title="משרות החברה" />
                    ) : (
                        <div className="p-8 md:p-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">לא נמצאו משרות לחברה זו</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Credits */}
            {activeTab === 'credits' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                            <div>
                                <h2 className="font-black text-lg text-slate-800">ניהול קרדיטים משותפים בחברה</h2>
                                <p className="text-xs text-slate-400 font-bold">מעסיקים המשויכים לחברה זו יכולים להשתמש בקרדיטים משותפים אלו לפרסום משרות.</p>
                            </div>
                            <Button 
                                onClick={() => {
                                    setCreditsAmount(50);
                                    setIsCreditsModalOpen(true);
                                }}
                                leftIcon={<Coins size={16} />}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                            >
                                הוסף קרדיטים לחברה
                            </Button>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-amber-800 mb-1">יתרת קופת חברה משותפת</p>
                                <p className="text-4xl font-black text-slate-900">{company?.credits || 0} <span className="text-lg font-bold text-amber-700">קרדיטים</span></p>
                            </div>
                            <div className="p-4 bg-amber-100 text-amber-700 rounded-2xl">
                                <Coins size={36} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-black text-lg text-slate-800 mb-4">היסטוריית תנועות קרדיטים בחברה ({transactions.length})</h3>
                        {transactions.length > 0 ? (
                            <div className="space-y-3">
                                {transactions.map((tx: any) => (
                                    <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-bold text-slate-700">{tx.description || tx.type || 'טעינת קרדיטים'}</p>
                                            <p className="text-xs text-slate-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleString('he-IL') : '-'}</p>
                                        </div>
                                        <div className="font-black text-lg" dir="ltr">
                                            <span className={tx.amount > 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-6">אין עדיין היסטוריית פעולות לחברה זו</p>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Edit Company */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="עריכת פרטי חברה"
            >
                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">שם התאגיד / חברה</label>
                        <Input 
                            required
                            placeholder="שם חברה..." 
                            value={editData.name || ''}
                            onChange={(e) => setEditData({...editData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">ענף / תעשייה</label>
                        <Input 
                            placeholder="ענף (הייטק, מסעדנות, שיווק...)" 
                            value={editData.industry || ''}
                            onChange={(e) => setEditData({...editData, industry: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">מיקום (מטה)</label>
                        <Input 
                            placeholder="מיקום (למשל: תל אביב)..." 
                            value={editData.location || ''}
                            onChange={(e) => setEditData({...editData, location: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">אתר אינטרנט</label>
                        <Input 
                            type="url"
                            placeholder="https://example.com" 
                            value={editData.website || ''}
                            onChange={(e) => setEditData({...editData, website: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">תיאור החברה</label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 min-h-[90px]"
                            placeholder="קצת על החברה..." 
                            value={editData.description || ''}
                            onChange={(e) => setEditData({...editData, description: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                         <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>ביטול</Button>
                         <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">שמור שינויים</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Add Credits to Company */}
            <Modal
                isOpen={isCreditsModalOpen}
                onClose={() => setIsCreditsModalOpen(false)}
                title="הוספת קרדיטים לקופת החברה"
            >
                <div className="space-y-5">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                            <Coins size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">
                                יתרת קופת חברה: <span className="text-amber-700 text-lg font-black">{company.credits || 0}</span> קרדיטים
                            </p>
                            <p className="text-xs text-slate-500">
                                עבור חברת: {company.name}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">בחירה מהירה:</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {[10, 50, 100, 250, 500].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setCreditsAmount(preset)}
                                    className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                                        creditsAmount === preset
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    +{preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">כמות מותאמת אישית:</label>
                        <Input
                            type="number"
                            min="1"
                            value={creditsAmount || ''}
                            onChange={(e) => setCreditsAmount(Number(e.target.value))}
                            placeholder="הזן מספר קרדיטים..."
                            className="font-bold text-lg"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsCreditsModalOpen(false)}
                            disabled={isAddingCredits}
                        >
                            ביטול
                        </Button>
                        <Button 
                            onClick={handleAddCreditsSubmit}
                            disabled={isAddingCredits || !creditsAmount || creditsAmount <= 0}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-2"
                        >
                            <Coins size={16} />
                            {isAddingCredits ? 'מוסיף...' : `הוסף ${creditsAmount} קרדיטים`}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Assign Employer to Company */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title={`שיוך מעסיק לחברת ${company.name}`}
            >
                <form onSubmit={handleAssignEmployer} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">בחר מעסיק לשיוך</label>
                        <select 
                            required
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            value={selectedEmployerToAssign}
                            onChange={(e) => setSelectedEmployerToAssign(e.target.value)}
                        >
                            <option value="">בחר מעסיק מתוך המערכת...</option>
                            {unassignedOrOtherEmployers.map(emp => (
                                <option key={emp.id || emp.uid} value={emp.id || emp.uid}>
                                    {emp.displayName || emp.fullName} ({emp.email}) {emp.companyName ? `— כרגע ב: ${emp.companyName}` : '— ללא חברה'}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">שיוך המעסיק יקשר אותו לחברה זו ויעדכן את כל המשרות שלו עם שם החברה החדשה.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>ביטול</Button>
                        <Button type="submit" disabled={isAssigning || !selectedEmployerToAssign} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isAssigning ? 'משייך...' : 'אשר שיוך מעסיק'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* TwoStepConfirmModal for archiving company */}
            <TwoStepConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteCompany}
                title="ארכוב חברה"
                message={`האם אתה בטוח שברצונך להעביר את חברת "${company.name}" לארכיון?`}
                confirmWord="מחק"
            />
        </div>
    );
};
