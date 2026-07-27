import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Report } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { ArrowRight, CheckCircle, Clock, AlertTriangle, Trash2, User, Save, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/AuthContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export const AdminTaskDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const [task, setTask] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'Low' | 'High' | 'Urgent'>('Low');
    const [isResolved, setIsResolved] = useState(false);
    const [assigneeId, setAssigneeId] = useState('');
    const [assigneeName, setAssigneeName] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchTask = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'reports', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Report;
                    setTask(data);
                    setTitle(data.title || '');
                    setDescription(data.description || '');
                    setPriority(data.priority || 'Low');
                    setIsResolved(data.isResolved || false);
                    setAssigneeId(data.assigneeId || '');
                    setAssigneeName(data.assigneeName || '');
                } else {
                    toast('המשימה לא נמצאה', 'error');
                    navigate('/admin/reports?tab=tasks');
                }
            } catch (error) {
                console.error("Error fetching task:", error);
                toast('שגיאה בטעינת המשימה', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [id, navigate, toast]);

    const handleSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'reports', id), {
                title,
                description,
                priority,
                isResolved,
                assigneeId,
                assigneeName,
            });
            toast('המשימה עודכנה בהצלחה', 'success');
            setTask(prev => prev ? { ...prev, title, description, priority, isResolved, assigneeId, assigneeName } : null);
        } catch (error) {
            console.error("Error saving task:", error);
            toast('שגיאה בעדכון המשימה', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            await deleteDoc(doc(db, 'reports', id));
            toast('המשימה נמחקה בהצלחה', 'success');
            navigate('/admin/reports?tab=tasks');
        } catch (error) {
            console.error("Error deleting task:", error);
            toast('שגיאה במחיקת המשימה', 'error');
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const toggleStatus = async () => {
        if (!id) return;
        const newStatus = !isResolved;
        setIsResolved(newStatus);
        
        try {
            await updateDoc(doc(db, 'reports', id), {
                isResolved: newStatus
            });
            toast(`המשימה סומנה כ${newStatus ? 'טופלה' : 'פתוחה'}`, 'success');
            setTask(prev => prev ? { ...prev, isResolved: newStatus } : null);
        } catch (error) {
             console.error("Error toggling status:", error);
             toast('שגיאה בשינוי הסטטוס', 'error');
             setIsResolved(!newStatus); // revert
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-bold">טוען נתונים...</div>;
    }

    if (!task) {
        return <div className="p-8 text-center text-red-500 font-bold">המשימה לא נמצאה</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link to="/admin/reports?tab=tasks" className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 mb-2 transition-colors font-bold text-sm w-fit">
                        <ArrowRight size={16} /> חזרה לכל המשימות
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm",
                            isResolved ? "bg-green-50 text-green-600 border-green-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        )}>
                            {isResolved ? <CheckCircle size={24} /> : <Clock size={24} />}
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                                עריכת משימה
                            </h1>
                            <p className="text-slate-500 font-bold mt-1 text-sm">
                                מזהה: <span className="font-mono bg-slate-100 px-1 rounded">{task.id}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        className={cn(
                            "border-2 font-bold",
                            isResolved ? "border-slate-200 text-slate-500 hover:bg-slate-50" : "border-green-200 text-green-600 hover:bg-green-50"
                        )}
                        onClick={toggleStatus}
                        leftIcon={isResolved ? <RefreshCw size={18} /> : <CheckCircle size={18} />}
                    >
                        {isResolved ? 'פתח מחדש' : 'סמן כטופל'}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => setIsDeleteModalOpen(true)}
                        leftIcon={<Trash2 size={18} />}
                    >
                        מחק משימה
                    </Button>
                </div>
            </div>

            <Card className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">כותרת המשימה</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="למשל: לבדוק דיווח על משרה..."
                                className="font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">תיאור</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="פירוט המשימה..."
                                rows={6}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                             <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto" leftIcon={<Save size={18} />}>
                                {saving ? 'שומר...' : 'שמור שינויים'}
                             </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-indigo-600" /> הגדרות משימה
                            </h3>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">עדיפות</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="Low">רגילה (Low)</option>
                                    <option value="High">גבוהה (High)</option>
                                    <option value="Urgent">דחופה (Urgent)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">שם אחראי לטיפול</label>
                                <Input
                                    value={assigneeName}
                                    onChange={(e) => setAssigneeName(e.target.value)}
                                    placeholder="שם המטפל..."
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-200">
                                <div className="text-sm font-bold text-slate-500 mb-1">נוצר בתאריך</div>
                                <div className="text-slate-900 font-mono bg-white p-3 rounded-xl border border-slate-200 text-left">
                                    {new Date(task.createdAt).toLocaleString('he-IL')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="מחיקת משימה"
                message="האם אתה בטוח שברצונך למחוק משימה זו? פעולה זו אינה הפיכה."
                confirmLabel="מחק משימה"
            />
        </div>
    );
};
