import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { User, UserRole, calculateRemainingJobs } from '../../types';
import { Trash2, Building2, Mail, Phone, ShieldCheck, Coins } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { softDelete } from '../../lib/adminUtils';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { addCredits } from '../../services/creditService';

export const AdminEmployers: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [employers, setEmployers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [employerToEdit, setEmployerToEdit] = useState<User | null>(null);

    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [employerForCredits, setEmployerForCredits] = useState<User | null>(null);
    const [creditsAmount, setCreditsAmount] = useState<number>(0);
    const [isAddingCredits, setIsAddingCredits] = useState(false);
    
    const [newEmployer, setNewEmployer] = useState({
        displayName: '',
        email: '',
        companyName: ''
    });

    const [searchParams] = useSearchParams();
    const filterParam = searchParams.get('filter');

    const filteredEmployers = useMemo(() => {
        if (filterParam === 'unassigned') {
            return employers.filter(e => !e.assignedAdminId);
        }
        return employers;
    }, [employers, filterParam]);

    useEffect(() => {
        const q = query(
            collection(db, 'users'), 
            where('role', '==', UserRole.EMPLOYER)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as unknown as User))
                .filter(u => !u.deletedAt);
            setEmployers(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching employers:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const uid = 'emp_' + Date.now();
            const companyId = 'comp_' + Date.now();
            
            await setDoc(doc(db, 'companies', companyId), {
                name: newEmployer.companyName || newEmployer.displayName,
                employerId: uid,
                isVerified: false,
                createdAt: new Date().toISOString()
            });

            await setDoc(doc(db, 'users', uid), {
                uid,
                email: newEmployer.email,
                displayName: newEmployer.displayName,
                role: UserRole.EMPLOYER,
                companyId,
                companyName: newEmployer.companyName, // Added to fix missing company mapping
                isVerified: false,
                createdAt: new Date().toISOString()
            });
            
            toast('מעסיק חדש התווסף בהצלחה', 'success');
            setIsAddModalOpen(false);
            setNewEmployer({ displayName: '', email: '', companyName: '' });
        } catch (error) {
            console.error("Error adding employer:", error);
            toast('שגיאה בהוספת המעסיק', 'error');
        }
    };

    const handleEditOpen = (user: User) => {
        setEmployerToEdit(user);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employerToEdit) return;
        try {
            await setDoc(doc(db, 'users', (employerToEdit as any).id || employerToEdit.uid), {
                displayName: employerToEdit.displayName,
                email: employerToEdit.email,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            toast('המעסיק עודכן בהצלחה', 'success');
            setIsEditModalOpen(false);
            setEmployerToEdit(null);
        } catch (error) {
            console.error("Error updating employer:", error);
            toast('שגיאה בעדכון מעסיק', 'error');
        }
    };

    const handleDelete = (u: User) => {
        setUserToDelete(u);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async (reason: string) => {
        if (!userToDelete || !currentUser) return;
        try {
            await softDelete({
                collectionName: 'users',
                id: (userToDelete as any).id || userToDelete.uid,
                deletedBy: currentUser.uid,
                reason
            });
            toast('המעסיק הועבר לארכיון', 'success');
        } catch (error) {
            toast('שגיאה במחיקה', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    const handleStatusChange = async (user: User, status: string) => {
        try {
            const isVerified = status === 'active';
            await setDoc(doc(db, 'users', (user as any).id || user.uid), {
                isVerified,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            toast(`סטטוס המעסיק שונה בהצלחה`, 'success');
        } catch (error) {
            console.error("Error updating status:", error);
            toast('שגיאה בשינוי סטטוס מעסיק', 'error');
        }
    };

    const handleOpenCreditsModal = (user: User) => {
        setEmployerForCredits(user);
        setCreditsAmount(5); // Default to 1 job worth
        setIsCreditsModalOpen(true);
    };

    const submitAddCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employerForCredits || creditsAmount <= 0) return;
        
        setIsAddingCredits(true);
        try {
            await addCredits((employerForCredits as any).id || employerForCredits.uid, creditsAmount);
            toast(`נוספו ${creditsAmount} קרדיטים בהצלחה`, 'success');
            setIsCreditsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast('שגיאה בהוספת קרדיטים', 'error');
        } finally {
            setIsAddingCredits(false);
        }
    };

    const columns = [
        { 
            key: 'displayName', 
            header: 'שם המעסיק',
            render: (u: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 shadow-sm">
                        {u.displayName ? u.displayName[0] : '?'}
                    </div>
                    <div>
                        <Link to={`/admin/employers/${u.id || u.uid}`} className="font-black text-slate-900 leading-tight hover:text-indigo-600 hover:underline">{u.displayName}</Link>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{u.employerProfile?.companyName || 'חברה לא רשומה'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'isVerified',
            header: 'סטטוס אימות',
            render: (u: any) => (
                <div className="flex items-center gap-2">
                    {u.isVerified ? (
                        <Badge variant="success" className="text-[10px] font-black flex items-center gap-1">
                            <ShieldCheck size={12} />
                            מאומת
                        </Badge>
                    ) : (
                        <Badge variant="warning" className="text-[10px] font-black">
                            טרם אומת
                        </Badge>
                    )}
                </div>
            )
        },
        { 
            key: 'jobsCount', 
            header: 'משרות פעילות',
            render: (u: any) => (
                <div className="text-sm font-bold text-slate-600">
                    {u.employerProfile?.activeJobsCount || 0} משרות
                </div>
            )
        },
        {
            key: 'credits',
            header: 'יתרת קרדיטים',
            render: (u: any) => (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="purple" className="text-xs font-bold flex items-center gap-1">
                            <Coins size={12} />
                            {u.credits || 0}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-medium">({calculateRemainingJobs(u.credits)} משרות)</span>
                    </div>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-[10px] px-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 w-fit"
                        onClick={() => handleOpenCreditsModal(u)}
                    >
                        + הוסף
                    </Button>
                </div>
            )
        },
        {
            key: 'contact',
            header: 'פרטי קשר',
            render: (u: any) => (
                <div className="flex items-center gap-3">
                    {u.phone && <a href={`tel:${u.phone}`} className="text-slate-400 hover:text-primary transition-colors"><Phone size={14} /></a>}
                    {u.email && <a href={`mailto:${u.email}`} className="text-slate-400 hover:text-primary transition-colors"><Mail size={14} /></a>}
                </div>
            )
        },
        { 
            key: 'createdAt', 
            header: 'תאריך רישום',
            render: (u: any) => <span className="text-xs text-slate-500 font-mono">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('he-IL') : '-'}</span>
        }
    ];

    return (
        <>
            <AdminTable 
                title="ניהול מעסיקים"
                description={filterParam === 'unassigned' ? "רשימת מעסיקים ללא שיוך מנהל אישי" : "צפייה במעסיקים רשומים, אימות חברות וניהול הרשאות פרסום."}
                data={filteredEmployers}
                columns={columns}
                searchFields={['displayName', 'email']}
                onAdd={() => setIsAddModalOpen(true)}
                onEdit={handleEditOpen}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                bulkActions={[
                    { label: 'אימות נבחרים', action: (items) => alert(`מאמת ${items.length} מעסיקים`), icon: ShieldCheck },
                ]}
                filters={[
                    { 
                        key: 'isVerified', 
                        label: 'סטטוס אימות', 
                        options: [
                            { label: 'מאומתים', value: 'true' },
                            { label: 'לא מאומתים', value: 'false' },
                        ] 
                    }
                ]}
            />

            {userToDelete && (
                <TwoStepConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="ארכוב חשבון מעסיק"
                    message={`האם אתה בטוח שברצונך לארכב את המעסיק ${userToDelete.displayName}? כל המשרות שלו יושבתו.`}
                    confirmWord="מחק"
                />
            )}

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="הוספת מעסיק חדש"
            >
                <form onSubmit={handleAdd} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">שם מלא</label>
                        <Input 
                            required
                            placeholder="למשל: סתיו שפירא..." 
                            value={newEmployer.displayName}
                            onChange={(e) => setNewEmployer(prev => ({...prev, displayName: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">אימייל</label>
                        <Input 
                            type="email"
                            required
                            placeholder="stav@company.com" 
                            value={newEmployer.email}
                            onChange={(e) => setNewEmployer(prev => ({...prev, email: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">שם חברה (אופציונלי)</label>
                        <Input 
                            placeholder="למשל: Google" 
                            value={newEmployer.companyName}
                            onChange={(e) => setNewEmployer(prev => ({...prev, companyName: e.target.value}))}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>ביטול</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור מעסיק</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="עריכת פרטי מעסיק"
            >
                {employerToEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">שם חדש</label>
                            <Input 
                                required
                                value={employerToEdit.displayName}
                                onChange={(e) => setEmployerToEdit({ ...employerToEdit, displayName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">אימייל</label>
                            <Input 
                                type="email"
                                required
                                value={employerToEdit.email}
                                onChange={(e) => setEmployerToEdit({ ...employerToEdit, email: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>ביטול</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור שינויים</Button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal
                isOpen={isCreditsModalOpen}
                onClose={() => setIsCreditsModalOpen(false)}
                title="הוספת קרדיטים למעסיק"
            >
                {employerForCredits && (
                    <form onSubmit={submitAddCredits} className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 shadow-sm">
                                {employerForCredits.displayName ? employerForCredits.displayName[0] : '?'}
                            </div>
                            <div>
                                <p className="font-black text-slate-900 leading-tight">{employerForCredits.displayName}</p>
                                <p className="text-xs text-slate-500 font-bold">מצב קרדיטים נוכחי צפוי: {employerForCredits.credits || 0}</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">כמות קרדיטים להוספה</label>
                            <div className="relative">
                                <Input 
                                    type="number"
                                    min="1"
                                    required
                                    value={creditsAmount}
                                    onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                                    className="pl-10"
                                />
                                <Coins size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">1 פרסום משרה = 5 קרדיטים. תוספת זו תאפשר למעסיק לפרסם עוד {calculateRemainingJobs(creditsAmount)} משרות.</p>
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsCreditsModalOpen(false)} disabled={isAddingCredits}>ביטול</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold" disabled={isAddingCredits}>
                                {isAddingCredits ? 'מוסיף...' : 'הוסף קרדיטים'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
};
