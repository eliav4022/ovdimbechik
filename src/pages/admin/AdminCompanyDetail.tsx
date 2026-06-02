import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Job, User, getTxTypeLabel, JobStatus } from '../../types';
import { ArrowRight, Building2, Briefcase, Mail, Phone, CalendarDays, Loader2, Globe, MapPin, ShieldCheck, CreditCard } from 'lucide-react';
import { AdminTable } from '../../components/admin/AdminTable';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export const AdminCompanyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [company, setCompany] = useState<any | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [owner, setOwner] = useState<User | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'jobs' | 'credits'>('general');

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!id) return;
            setLoading(true);

            try {
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

                // 2. Fetch owner document (employer)
                if (compData.employerId) {
                    const ownerRef = doc(db, 'users', compData.employerId);
                    const ownerSnap = await getDoc(ownerRef);
                    if (ownerSnap.exists()) {
                        setOwner({ id: ownerSnap.id, ...ownerSnap.data() } as User);
                    }
                }

                // 3. Fetch Jobs associated with this company
                // Let's assume jobs might be linked via companyId
                const jobsQuery = query(collection(db, 'jobs'), where('companyId', '==', id));
                const jobsSnap = await getDocs(jobsQuery);
                let loadedJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Job));

                // If currently jobs are not strictly linked by companyId, we could also fetch jobs by employerId
                if (loadedJobs.length === 0 && compData.employerId) {
                    const empJobsQuery = query(collection(db, 'jobs'), where('ownerId', '==', compData.employerId));
                    const empJobsSnap = await getDocs(empJobsQuery);
                    // Filter down those that explicitly mention this company Name if needed, but for now we just show employer's jobs
                    // Assuming for now company ID linking is ideal
                    loadedJobs = empJobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Job));
                }

                setJobs(loadedJobs);

                // Fetch transactions for company
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

        fetchCompanyData();
    }, [id, toast, navigate]);

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

    const activeJobsCount = jobs.filter(j => j.status === 'Published' || j.status === JobStatus.ACTIVE).length;

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
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
                            ) : (
                                <Building2 className="text-slate-300" size={32} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                {company.name}
                                {company.isVerified && <ShieldCheck className="text-emerald-500" size={24} />}
                            </h1>
                            <p className="text-slate-500 font-bold text-sm mt-1">{company.industry || 'תעשייה כללית'} | {company.location || 'מיקום לא צוין'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Cards for Company */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">סה"כ משרות</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase size={18} /></div>
                    </div>
                    <p className="text-3xl font-black text-slate-900 mt-4">{jobs.length}</p>
                 </div>
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">משרות באוויר</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Briefcase size={18} /></div>
                    </div>
                    <p className="text-3xl font-black text-emerald-600 mt-4">{activeJobsCount}</p>
                 </div>
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-slate-500 font-bold text-sm">סטטוס אימות</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><ShieldCheck size={18} /></div>
                    </div>
                    <p className={`text-3xl font-black mt-4 ${company.isVerified ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {company.isVerified ? 'מאומת' : 'לא מאומת'}
                    </p>
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
                    onClick={() => setActiveTab('jobs')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'jobs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    משרות שפורסמו
                    <Badge variant="neutral" className="text-[10px] py-0">{jobs.length}</Badge>
                </button>
                <button 
                    onClick={() => setActiveTab('credits')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'credits' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <CreditCard size={16} /> ניהול קרדיטים
                </button>
            </div>

            {/* Tab: General Info */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <h2 className="font-black text-lg text-slate-800 border-b border-slate-50 pb-2">פרטי חברה</h2>
                        
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
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">{company.location || 'לא צוין'}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                ענף/תעשייה:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">{company.industry || 'לא צוין'}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <Globe size={16} /> אתר אינטרנט:
                            </span>
                            <span className="col-span-2 font-medium bg-slate-50 p-2 rounded-lg text-slate-800">
                                {company.website ? <a href={company.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{company.website}</a> : 'לא סופק'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                        <h2 className="font-black text-lg text-slate-800 border-b border-slate-50 pb-2">מעסיק קשור למותג</h2>

                        {owner ? (
                            <>
                                <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                    <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                        שם הבעלים:
                                    </span>
                                    <span className="col-span-2 font-black text-slate-800">
                                        <Link to={`/admin/employers/${owner.id}`} className="hover:text-indigo-600 hover:underline">{owner.displayName}</Link>
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                    <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                        <Mail size={16} /> אימייל:
                                    </span>
                                    <span className="col-span-2 font-medium text-slate-600">{owner.email}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 py-2 items-center">
                                    <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                        <Phone size={16} /> טלפון:
                                    </span>
                                    <span className="col-span-2 font-medium text-slate-600" dir="ltr">{owner.phone || 'לא סופק'}</span>
                                </div>

                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-sm text-slate-600 mb-2">צפה בפרופיל המעסיק המלא כדי לראות קרדיטים והתראות.</p>
                                    <Link to={`/admin/employers/${owner.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800">
                                        למעבר לפרופיל מעסיק <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-slate-500 font-medium">לא נמצא מעסיק מקושר לחברה זו (נמחק או שגוי)</p>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 py-2 mt-auto pt-4 border-t border-slate-100 items-center">
                            <span className="text-slate-400 font-bold text-sm flex items-center gap-2">
                                <CalendarDays size={16} /> רשום ממתי:
                            </span>
                            <span className="col-span-2 font-medium text-slate-800">{formatDate(company.createdAt)}</span>
                        </div>

                    </div>
                </div>
            )}

            {/* Tab: Jobs */}
            {activeTab === 'jobs' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="font-black text-lg text-slate-800 mb-4 items-center flex justify-between">
                         משרות ממותגות ({jobs.length})
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <h2 className="font-black text-lg text-slate-800 mb-4 border-b pb-2">ניהול קרדיטים משותפים בחברה</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-500 mb-2">יתרת קופת חברה משותפת</p>
                                <p className="text-4xl font-black text-slate-800">{company?.credits || 0}</p>
                            </div>
                        </div>

                        {owner ? (
                        <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 flex flex-col justify-between">
                            <div>
                                <p className="text-sm font-bold text-indigo-500 mb-2">יתרה אישית: בעלים ראשי</p>
                                <p className="text-3xl font-black text-indigo-700">{owner.credits || 0}</p>
                            </div>
                            <div className="mt-6 flex flex-col gap-2">
                                <span className="text-xs font-bold text-indigo-600">משיכה מקופת החברה למעסיק זה: </span>
                                <div className="flex gap-2">
                                <input 
                                    type="number"
                                    className="bg-white border border-indigo-300 rounded px-2 py-1 w-full text-sm font-bold shadow-sm"
                                    placeholder="כמות למשיכה"
                                    id="adminTransferFromCompanyInputTab"
                                    min={1}
                                    max={company.credits || 1}
                                />
                                <button 
                                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700 transition flex-shrink-0"
                                    onClick={async () => {
                                        const val = Number((document.getElementById('adminTransferFromCompanyInputTab') as HTMLInputElement).value);
                                        if (!val || val <= 0 || val > (company.credits || 0)) {
                                            toast('סכום לא תקין', 'error');
                                            return;
                                        }
                                        try {
                                            const { writeBatch, doc, collection } = await import('firebase/firestore');
                                            const batch = writeBatch(db);
                                            const newTxRef = doc(collection(db, 'credit_transactions'));
                                            const txData = {
                                                employerId: owner.id,
                                                amount: val, // will map to UI correctly
                                                type: 'TRANSFER_FROM_COMPANY',
                                                companyId: company.id,
                                                createdAt: new Date().toISOString()
                                            };
                                            batch.update(doc(db, 'users', owner.id), {
                                                credits: (owner.credits || 0) + val 
                                            });
                                            batch.update(doc(db, 'companies', company.id), {
                                                credits: (company.credits || 0) - val 
                                            });
                                            batch.set(newTxRef, txData);
                                            await batch.commit();
                                            setOwner({...owner, credits: (owner.credits || 0) + val});
                                            setCompany({...company, credits: (company.credits || 0) - val});
                                            setTransactions([{ id: newTxRef.id, ...txData }, ...transactions]);
                                            toast('קרדיטים הועברו למעסיק', 'success');
                                            (document.getElementById('adminTransferFromCompanyInputTab') as HTMLInputElement).value = '';
                                        } catch (e) {
                                            console.error(e);
                                            toast('אירעה שגיאה', 'error');
                                        }
                                    }}
                                >
                                    משוך למעסיק
                                </button>
                                </div>
                            </div>
                        </div>
                        ) : (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-center items-center text-center">
                            <p className="text-slate-500 font-bold">לא משויך למעסיק ראשי</p>
                        </div>
                        )}
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-lg font-black text-slate-800 mb-4">פעולות קרדיטים שמשויכות לחברה ({transactions.length})</h3>
                        {transactions.length > 0 ? (
                            <div className="space-y-3">
                                {transactions.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <p className="font-bold text-slate-700">{getTxTypeLabel(tx.type)}</p>
                                            <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString('he-IL')}</p>
                                        </div>
                                        <div className="font-black text-lg" dir="ltr">
                                            <span className={(tx.type === 'TRANSFER_TO_COMPANY' || tx.type === 'ALLOCATION') ? 'text-green-600' : 'text-red-500'}>
                                                {(tx.type === 'TRANSFER_TO_COMPANY' || tx.type === 'ALLOCATION') ? '+' : '-'}
                                                {Math.abs(tx.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500">אין עדיין היסטוריית פעולות בחברה זו</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
