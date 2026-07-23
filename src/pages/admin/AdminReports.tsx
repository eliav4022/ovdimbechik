import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, addDoc, setDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { ShieldAlert, AlertTriangle, CheckCircle, Plus, LayoutDashboard, ListTodo } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { JobReport, Report } from '../../types';
import { cn } from '../../lib/utils';
import { useSearchParams } from 'react-router-dom';

export const AdminReports: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [jobReports, setJobReports] = useState<JobReport[]>([]);
    const [adminTasks, setAdminTasks] = useState<Report[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);
    
    const initialTab = searchParams.get('tab') === 'users' ? 'users' : 'tasks';
    const [activeTab, setActiveTab] = useState<'users' | 'tasks'>(initialTab);
    
    // New Task Modal state
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Low', assigneeId: '' });

    useEffect(() => {
        // Fetch Job Reports
        const qJob = query(collection(db, 'jobReports'));
        const unsubscribeJob = onSnapshot(qJob, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobReport));
            setJobReports(data);
        }, (error) => {
            console.error(error);
        });

        // Fetch Admin Tasks (Reports)
        const qTasks = query(collection(db, 'reports'));
        const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
            setAdminTasks(data);
        }, (error) => {
            console.error(error);
        });

        // Fetch Admin Users
        const qAdmins = query(collection(db, 'users'), where('role', 'in', ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_AGENT']));
        const unsubscribeAdmins = onSnapshot(qAdmins, (snapshot) => {
            setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error(error);
        });

        return () => {
            unsubscribeJob();
            unsubscribeTasks();
            unsubscribeAdmins();
        };
    }, []);

    const handleResolveJobReport = async (reportId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, 'jobReports', reportId), {
                status: newStatus
            });
            toast('סטטוס דיווח עודכן בהצלחה', 'success');
        } catch (error) {
            toast('שגיאה בעדכון טיפול בדיווח', 'error');
        }
    };

    const handleResolveTask = async (taskId: string, isResolved: boolean) => {
         try {
            await updateDoc(doc(db, 'reports', taskId), {
                isResolved
            });
            toast(isResolved ? 'משימה הושלמה' : 'משימה נפתחה מחדש', 'success');
        } catch (error) {
            toast('שגיאה בעדכון משימה', 'error');
        }
    }

    const handleAssignTask = async (taskId: string, assigneeId: string) => {
        try {
            const admin = admins.find(a => a.id === assigneeId);
            await updateDoc(doc(db, 'reports', taskId), {
                assigneeId: assigneeId || null,
                assigneeName: admin ? admin.displayName : null
            });
            toast('שיוך משימה עודכן בהצלחה', 'success');
        } catch (error) {
            toast('שגיאה בעדכון שיוך משימה', 'error');
        }
    }

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const ref = doc(collection(db, 'reports'));
            const admin = admins.find(a => a.id === newTask.assigneeId);
            await setDoc(ref, {
                id: ref.id,
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority as 'Low' | 'High' | 'Urgent',
                assigneeId: newTask.assigneeId || null,
                assigneeName: admin ? admin.displayName : null,
                isResolved: false,
                createdAt: new Date().toISOString()
            });
            toast('משימה נוצרה בהצלחה', 'success');
            setShowNewTaskModal(false);
            setNewTask({ title: '', description: '', priority: 'Low', assigneeId: '' });
        } catch (error) {
            toast('שגיאה ביצירת משימה', 'error');
        }
    };

    const jobColumns = [
        { 
            key: 'targetType', 
            header: 'סוג מדווח',
            render: (r: JobReport) => (
                <div className="flex items-center gap-2">
                    {r.targetType === 'job' ? <Badge variant="warning" className="text-[10px]"><AlertTriangle size={12} className="ml-1 inline" /> משרה</Badge> : <Badge variant="danger" className="text-[10px]"><ShieldAlert size={12} className="ml-1 inline" /> משתמש</Badge>}
                </div>
            )
        },
        { 
            key: 'reason', 
            header: 'סיבת דיווח',
            render: (r: JobReport) => <div className="font-bold text-slate-800 text-sm">{r.reason}</div>
        },
        {
            key: 'details',
            header: 'פירוט',
            render: (r: JobReport) => <div className="text-xs text-slate-500 max-w-xs truncate">{r.details || 'ללא קריטריון'}</div>
        },
        {
            key: 'reporter',
            header: 'דווח ע"י',
            render: (r: JobReport) => <div className="text-xs font-bold text-slate-600">{r.reporterName}</div>
        },
        {
            key: 'status',
            header: 'סטטוס',
            render: (r: JobReport) => (
                <select
                    value={r.status || 'pending'}
                    onChange={(e) => handleResolveJobReport(r.id, e.target.value)}
                    className={cn(
                        "text-xs border rounded-lg px-2 py-1 font-bold outline-none cursor-pointer",
                        r.status === 'resolved' ? "bg-green-50 text-green-700 border-green-200" :
                        r.status === 'dismissed' ? "bg-slate-50 text-slate-700 border-slate-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                >
                    <option value="pending">ממתין</option>
                    <option value="resolved">טופל</option>
                    <option value="dismissed">נדחה</option>
                </select>
            )
        },
        { 
            key: 'createdAt', 
            header: 'תאריך דיווח',
            render: (r: JobReport) => <span className="text-xs text-slate-500 font-mono">{new Date(r.createdAt).toLocaleDateString('he-IL')}</span>
        }
    ];

    const taskColumns = [
        {
            key: 'isResolved',
            header: 'סטטוס',
            render: (r: Report) => (
               <button 
                  onClick={() => handleResolveTask(r.id, !r.isResolved)}
                  className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-colors", r.isResolved ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}
               >
                 {r.isResolved && <CheckCircle size={14} />}
               </button>
            )
        },
        {
            key: 'title',
            header: 'משימה/תקלה',
            render: (r: Report) => (
                <div className={cn("font-bold text-sm", r.isResolved ? "text-slate-400 line-through" : "text-slate-800")}>{r.title || 'משימה ללא כותרת'}</div>
            )
        },
        {
            key: 'description',
            header: 'תיאור',
            render: (r: Report) => <div className="text-xs text-slate-500 max-w-xs">{r.description || 'אין תיאור למשימה.'}</div>
        },
        {
            key: 'priority',
            header: 'עדיפות',
            render: (r: Report) => {
                const colors = {
                    'Low': 'bg-slate-100 text-slate-600',
                    'High': 'bg-orange-100 text-orange-600',
                    'Urgent': 'bg-red-100 text-red-600'
                };
                const labels = {
                    'Low': 'רגילה',
                    'High': 'גבוהה',
                    'Urgent': 'דחופה!'
                };
                const safePriority = r.priority || 'Low';
                return <span className={cn("text-[10px] px-2 py-1 flex max-w-max rounded-md font-bold", colors[safePriority])}>{labels[safePriority]}</span>;
            }
        },
        {
            key: 'assignee',
            header: 'אחראי טיפול',
            render: (r: Report) => (
                <select
                    value={r.assigneeId || ''}
                    onChange={(e) => handleAssignTask(r.id, e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-medium text-slate-700 outline-none hover:bg-slate-100 focus:border-indigo-500"
                >
                    <option value="">ללא שיוך</option>
                    {admins.map(a => (
                        <option key={a.id} value={a.id}>{a.displayName || a.email}</option>
                    ))}
                </select>
            )
        },
        { 
            key: 'createdAt', 
            header: 'תאריך פתיחה',
            render: (r: Report) => <span className="text-xs text-slate-500 font-mono">{new Date(r.createdAt).toLocaleDateString('he-IL')}</span>
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <button
                    onClick={() => { setActiveTab('tasks'); setSearchParams({ tab: 'tasks' }); }}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'tasks' ? "bg-indigo-600/10 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <ListTodo size={18} />
                    משימות ותקלות (Reports)
                </button>
                <button
                    onClick={() => { setActiveTab('users'); setSearchParams({ tab: 'users' }); }}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'users' ? "bg-indigo-600/10 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <ShieldAlert size={18} />
                    דיווחי משתמשים
                </button>
            </div>

            {activeTab === 'tasks' ? (
                <div className="space-y-6">
                    <div className="flex justify-end">
                         <button 
                             onClick={() => setShowNewTaskModal(true)}
                             className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                         >
                             <Plus size={16} /> הוסף משימה / תקלה
                         </button>
                    </div>
                    <AdminTable 
                        title="ניהול משימות (Internal Reports)"
                        description="מעקב וניהול אחר דברים שדורשים טיפול, באגים או משימות אדמין."
                        data={adminTasks.sort((a,b) => (a.isResolved === b.isResolved ? 0 : a.isResolved ? 1 : -1))}
                        columns={taskColumns}
                    />
                </div>
            ) : (
                <AdminTable 
                    title="דיווחים ותלונות"
                    description="טיפול בדיווחים על משרות חשודות, פגיעה בתנאי שימוש ושמירה על טוהר הלוח."
                    data={jobReports}
                    columns={jobColumns}
                />
            )}

            {/* New Task Modal */}
            {showNewTaskModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">משימה פנימית חדשה</h2>
                        <form onSubmit={handleCreateTask} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">כותרת / נושא</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">תיאור התקלה או המשימה</label>
                                <textarea 
                                    required 
                                    rows={4}
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">דחיפות</label>
                                <select 
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="Low">רגילה</option>
                                    <option value="High">גבוהה</option>
                                    <option value="Urgent">דחופה!</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">שיוך למשתמש מנהל</label>
                                <select 
                                    value={newTask.assigneeId}
                                    onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">ללא שיוך</option>
                                    {admins.map(a => (
                                        <option key={a.id} value={a.id}>{a.displayName || a.email}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowNewTaskModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">ביטול</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">שמור משימה</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

