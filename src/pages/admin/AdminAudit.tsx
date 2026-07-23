import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { User, Activity, Trash2, PlusCircle, ShieldAlert, Briefcase, CheckSquare, Building2, CreditCard, MessageSquare, FileText, Settings, Users } from 'lucide-react';
import { Job, UserRole } from '../../types';

export const AdminAudit: React.FC = () => {
    const [allLogs, setAllLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'JOBS' | 'USERS' | 'GENERAL' | 'COMPANIES' | 'PAYMENTS' | 'INQUIRIES' | 'REPORTS' | 'EMPLOYERS'>('ALL');

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                // Fetch real audit logs from audit_logs collection
                const auditLogsQuery = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(500));
                const auditLogsSnap = await getDocs(auditLogsQuery);
                
                const newLogs = auditLogsSnap.docs
                    .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        action: data.action,
                        entity: data.collection,
                        entityId: data.documentId,
                        user: data.userName || data.userId || 'משתמש לא ידוע',
                        role: data.userRole || 'UNKNOWN',
                        details: data.details || '',
                        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
                        type: (data.type) || ((data.action || '').includes('מחיק') || (data.action || '').toLowerCase().includes('delete') ? 'delete' : (data.action || '').includes('עריכ') || (data.action || '').toLowerCase().includes('edit') ? 'edit' : 'add')
                    };
                });

                setAllLogs(newLogs);
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        let filtered = allLogs;
        if (activeTab === 'JOBS') filtered = allLogs.filter(log => ['משרות', 'jobs'].includes(log.entity));
        if (activeTab === 'USERS') filtered = allLogs.filter(log => ['משתמשים', 'users', 'מחפשי עבודה'].includes(log.entity));
        if (activeTab === 'EMPLOYERS') filtered = allLogs.filter(log => ['מעסיקים'].includes(log.entity));
        if (activeTab === 'COMPANIES') filtered = allLogs.filter(log => ['חברות', 'companies'].includes(log.entity));
        if (activeTab === 'PAYMENTS') filtered = allLogs.filter(log => ['תשלומים', 'credit_transactions'].includes(log.entity));
        if (activeTab === 'INQUIRIES') filtered = allLogs.filter(log => ['פניות', 'inquiries'].includes(log.entity));
        if (activeTab === 'REPORTS') filtered = allLogs.filter(log => ['דיווחים', 'משימות', 'reports', 'jobReports'].includes(log.entity));
        if (activeTab === 'GENERAL') filtered = allLogs.filter(log => ['עדכונים כלליים', 'settings', 'קבצים', 'files', 'audit_logs'].includes(log.entity));
        return filtered;
    }, [allLogs, activeTab]);

    const columns = [
        { 
            key: 'action', 
            header: 'פעולה ופירוט',
            render: (r: any) => (
                <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer list-none outline-none">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${r.type === 'delete' ? 'bg-red-50 text-red-500' : r.type === 'edit' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {r.type === 'delete' ? <Trash2 size={14} /> : r.type === 'edit' ? <Activity size={14} /> : <PlusCircle size={14} />}
                        </div>
                        <span className="font-bold text-slate-800 text-sm group-hover:text-brand-teal transition-colors">{r.action}</span>
                    </summary>
                    <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mr-10 leading-relaxed max-w-sm whitespace-pre-wrap">
                        {r.details || 'אין פירוט נוסף'}
                    </div>
                </details>
            )
        },
        { 
            key: 'entity', 
            header: 'ישות',
            render: (r: any) => <Badge variant="neutral" className="text-[10px]">{r.entity}</Badge>
        },
        {
            key: 'user',
            header: 'מבצע פעולה',
            render: (r: any) => <div className="text-xs font-bold text-slate-600 flex items-center gap-1"><User size={12}/> {r.user}</div>
        },
        { 
            key: 'timestamp', 
            header: 'תאריך ושעה',
            render: (r: any) => <span className="text-xs text-slate-500 font-mono" dir="ltr">{new Date(r.timestamp).toLocaleString('he-IL')}</span>
        }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => setActiveTab('ALL')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Activity size={18} />
                    ראשי
                </button>
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Users size={18} />
                    משתמשים
                </button>
                <button 
                    onClick={() => setActiveTab('JOBS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'JOBS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Briefcase size={18} />
                    משרות
                </button>
                <button 
                    onClick={() => setActiveTab('GENERAL')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'GENERAL' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Settings size={18} />
                    עדכונים כלליים
                </button>
                <button 
                    onClick={() => setActiveTab('COMPANIES')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'COMPANIES' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Building2 size={18} />
                    חברות
                </button>
                <button 
                    onClick={() => setActiveTab('PAYMENTS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'PAYMENTS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <CreditCard size={18} />
                    תשלומים
                </button>
                <button 
                    onClick={() => setActiveTab('INQUIRIES')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'INQUIRIES' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <MessageSquare size={18} />
                    פניות
                </button>
                <button 
                    onClick={() => setActiveTab('REPORTS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'REPORTS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <FileText size={18} />
                    דיווחים
                </button>
                <button 
                    onClick={() => setActiveTab('EMPLOYERS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'EMPLOYERS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <User size={18} />
                    מעסיקים
                </button>
            </div>

            <AdminTable 
                title={`לוג פעולות מערכת (${filteredLogs.length})`}
                description="כל הפעולות שבוצעו במערכת, כולל הוספה, עריכה ומחיקה של רשומות על ידי כלל המשתמשים ומנהלי המערכת."
                data={filteredLogs}
                columns={columns}
                searchFields={['action', 'entity', 'details', 'user']}
            />
        </div>
    );
};

