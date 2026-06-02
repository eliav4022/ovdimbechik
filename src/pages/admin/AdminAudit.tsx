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
                // Fetch recent entities to simulate audit logs and include analytics events
                const [usersSnap, jobsSnap, appsSnap, reportsSnap, analyticsSnap] = await Promise.all([
                    getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100))),
                    getDocs(query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(100))),
                    getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc'), limit(100))),
                    getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50))),
                    getDocs(query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'), limit(100)))
                ]);

                const newLogs: any[] = [];

                usersSnap.docs.forEach(doc => {
                    const data = doc.data() as any;
                    newLogs.push({
                        id: `user_add_${doc.id}`,
                        action: 'הרשמה למערכת',
                        entity: 'משתמשים',
                        entityId: doc.id,
                        user: data.fullName || data.displayName || data.email || 'משתמש לא ידוע',
                        role: data.role === UserRole.ADMIN || data.role === UserRole.SUPER_ADMIN ? 'ADMIN' : data.role === UserRole.EMPLOYER ? 'EMPLOYER' : 'SEEKER',
                        details: `הצטרף למערכת: ${data.email || ''}`,
                        timestamp: data.createdAt,
                        type: 'add'
                    });
                    if (data.deletedAt) {
                        newLogs.push({
                            id: `user_del_${doc.id}`,
                            action: 'מחיקת משתמש',
                            entity: 'משתמשים',
                            entityId: doc.id,
                            user: data.fullName || data.displayName || data.email || 'משתמש לא ידוע',
                            role: data.deletedBy ? 'ADMIN' : (data.role === UserRole.ADMIN ? 'ADMIN' : data.role === UserRole.EMPLOYER ? 'EMPLOYER' : 'SEEKER'),
                            details: `המשתמש נמחק: ${data.deleteReason || ''}`,
                            timestamp: data.deletedAt,
                            type: 'delete'
                        });
                    }
                });

                jobsSnap.docs.forEach(doc => {
                    const data = doc.data() as any;
                    newLogs.push({
                        id: `job_add_${doc.id}`,
                        action: 'יצירת משרה',
                        entity: 'משרות',
                        entityId: doc.id,
                        user: data.employerName || data.companyName || 'מעסיק',
                        role: 'EMPLOYER',
                        details: `התפרסמה משרה: ${data.title}`,
                        timestamp: data.createdAt,
                        type: 'add'
                    });
                    if (data.deletedAt) {
                        newLogs.push({
                            id: `job_del_${doc.id}`,
                            action: 'מחיקת משרה',
                            entity: 'משרות',
                            entityId: doc.id,
                            user: data.deletedBy ? 'מנהל מערכת' : (data.employerName || data.companyName || 'מעסיק'),
                            role: data.deletedBy ? 'ADMIN' : 'EMPLOYER',
                            details: `משרה הוסרה: ${data.title}`,
                            timestamp: data.deletedAt,
                            type: 'delete'
                        });
                    }
                });

                appsSnap.docs.forEach(doc => {
                    const data = doc.data() as any;
                    newLogs.push({
                        id: `app_add_${doc.id}`,
                        action: 'הגשת מועמדות',
                        entity: 'קורות חיים',
                        entityId: doc.id,
                        user: data.applicantName || 'מועמד',
                        role: 'SEEKER',
                        details: `הגיש מועמדות למשרה: ${data.jobId}`,
                        timestamp: data.createdAt,
                        type: 'add'
                    });
                });

                reportsSnap.docs.forEach(doc => {
                    const data = doc.data() as any;
                    newLogs.push({
                        id: `report_add_${doc.id}`,
                        action: 'יצירת משימה',
                        entity: 'משימות',
                        entityId: doc.id,
                        user: 'מערכת / אדמין',
                        role: 'ADMIN',
                        details: `משימה חדשה: ${data.title}`,
                        timestamp: data.createdAt,
                        type: 'add'
                    });
                });
                
                analyticsSnap.docs.forEach(doc => {
                    const data = doc.data() as any;
                    if (data.type === 'login') {
                        newLogs.push({
                            id: `analytics_${doc.id}`,
                            action: 'התחברות למערכת',
                            entity: 'משתמשים',
                            entityId: doc.id,
                            user: data.userId || 'משתמש',
                            role: data.metadata?.role || 'UNKNOWN',
                            details: `דרך ${data.metadata?.method || 'לא ידוע'}`,
                            timestamp: data.timestamp,
                            type: 'info'
                        });
                    }
                });

                // Filter out invalid timestamps and sort descending
                const validLogs = newLogs.filter(log => log.timestamp).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setAllLogs(validLogs);
            } catch (err) {
                console.error("Error fetching logs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        if (activeTab === 'ALL') return allLogs;
        if (activeTab === 'JOBS') return allLogs.filter(log => log.entity === 'משרות' || log.entity === 'קורות חיים');
        if (activeTab === 'USERS') return allLogs.filter(log => log.entity === 'משתמשים');
        if (activeTab === 'TASKS') return allLogs.filter(log => log.entity === 'משימות');
        return allLogs;
    }, [allLogs, activeTab]);

    const columns = [
        { 
            key: 'action', 
            header: 'פעולה',
            render: (r: any) => (
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${r.type === 'delete' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {r.type === 'delete' ? <Trash2 size={14} /> : <PlusCircle size={14} />}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{r.action}</span>
                </div>
            )
        },
        { 
            key: 'entity', 
            header: 'ישות',
            render: (r: any) => <Badge variant="neutral" className="text-[10px]">{r.entity}</Badge>
        },
        {
            key: 'details',
            header: 'פירוט',
            render: (r: any) => <div className="text-xs text-slate-500 line-clamp-2 max-w-xs">{r.details}</div>
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
                    הכל
                </button>
                <button 
                    onClick={() => setActiveTab('JOBS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'JOBS' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <Briefcase size={18} />
                    הוספת משרה
                </button>
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'USERS' ? 'bg-orange-600 text-white shadow-md shadow-orange-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <User size={18} />
                    הרשמות משתמשים
                </button>
                <button 
                    onClick={() => setActiveTab('TASKS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'TASKS' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                    <CheckSquare size={18} />
                    יצירת משימות
                </button>
            </div>

            <AdminTable 
                title={`לוג פעולות (${filteredLogs.length})`}
                description="מעקב חי אחר פעילויות כגון יצירה ומחיקה של מידע מהמערכת."
                data={filteredLogs}
                columns={columns}
            />
        </div>
    );
};

