import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { User, Activity, Trash2, PlusCircle, ShieldAlert, Briefcase, CheckSquare } from 'lucide-react';
import { Job, UserRole } from '../../types';

export const AdminAudit: React.FC = () => {
    const [allLogs, setAllLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'JOBS' | 'USERS' | 'TASKS'>('ALL');

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
        if (activeTab === 'JOBS') filtered = allLogs.filter(log => log.entity === 'משרות' || log.entity === 'קורות חיים');
        if (activeTab === 'USERS') filtered = allLogs.filter(log => log.entity === 'משתמשים' || log.entity === 'מעסיקים' || log.entity === 'מחפשי עבודה');
        if (activeTab === 'TASKS') filtered = allLogs.filter(log => log.entity === 'משימות' || log.entity === 'applications');
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
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('ALL')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Activity size={18} />
                    כל הפעולות
                </button>
                <button 
                    onClick={() => setActiveTab('JOBS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'JOBS' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Briefcase size={18} />
                    פעולות במשרות
                </button>
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'USERS' ? 'bg-orange-600 text-white shadow-md shadow-orange-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <User size={18} />
                    פעולות משתמשים
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

