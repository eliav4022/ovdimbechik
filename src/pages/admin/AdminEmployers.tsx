import { auth } from "../../lib/firebase";
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { setDoc } from '../../lib/firestore-audit';
import { db } from '../../lib/firebase';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { User, UserRole, calculateRemainingJobs } from '../../types';
import { Trash2, Building2, Mail, Phone, ShieldCheck, Coins, Sparkles, Building } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { softDelete } from '../../lib/adminUtils';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { addCredits } from '../../services/creditService';
import { ensureDefaultEntities, assignEmployerToCompany, DEFAULT_COMPANY_ID, DEFAULT_COMPANY_NAME } from '../../services/entityService';

export const AdminEmployers: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [employers, setEmployers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [employerToEdit, setEmployerToEdit] = useState<User | null>(null);
    const [selectedCompanyIdForEdit, setSelectedCompanyIdForEdit] = useState<string>('');
    const [newPasswordForUser, setNewPasswordForUser] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [employerForCredits, setEmployerForCredits] = useState<User | null>(null);
    const [creditsAmount, setCreditsAmount] = useState<number>(0);
    const [isAddingCredits, setIsAddingCredits] = useState(false);
    
    const [newEmployer, setNewEmployer] = useState({
        displayName: '',
        email: '',
        companyId: DEFAULT_COMPANY_ID,
        newCompanyName: '',
        phone: '',
        location: '',
        password: ''
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
        ensureDefaultEntities().catch(err => console.error("Error ensuring default entities", err));

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

        const compQ = query(collection(db, 'companies'));
        const unsubComp = onSnapshot(compQ, (snapshot) => {
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((c: any) => !c.deletedAt);
            setCompanies(data);
        });

        return () => {
            unsubscribe();
            unsubComp();
        };
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!newEmployer.email) {
                toast('נא למלא אימייל', 'error');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmployer.email)) {
                toast('נא להזין כתובת אימייל תקינה', 'error');
                return;
            }

            let uid = 'emp_' + Date.now();

            if (newEmployer.password) {
                const token = await (await import('../../lib/firebase')).auth.currentUser?.getIdToken();
                const res = await fetch('/api/admin/create-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email: newEmployer.email,
                        password: newEmployer.password,
                        displayName: newEmployer.displayName,
                        uid: uid
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error === "Firebase Admin config missing" ? "שגיאה: הגדר מפתח פיירבייס SERVICE ACCOUNT בסודות כדי להוסיף סיסמה לחשבון משתמש חדש" : data.error || 'Failed to create user in Auth');
            }

            let finalCompanyId = newEmployer.companyId || DEFAULT_COMPANY_ID;
            let finalCompanyName = DEFAULT_COMPANY_NAME;

            if (newEmployer.companyId === 'NEW') {
                if (!newEmployer.newCompanyName.trim()) {
                    toast('נא להזין שם לחברה החדשה', 'error');
                    return;
                }
                finalCompanyId = 'comp_' + Date.now();
                finalCompanyName = newEmployer.newCompanyName.trim();
                await setDoc(doc(db, 'companies', finalCompanyId), {
                    id: finalCompanyId,
                    name: finalCompanyName,
                    industry: 'כללי',
                    location: newEmployer.location || 'ישראל',
                    isVerified: true,
                    credits: 0,
                    createdAt: new Date().toISOString()
                });
            } else {
                const foundComp = companies.find(c => c.id === finalCompanyId);
                if (foundComp) {
                    finalCompanyName = foundComp.name;
                }
            }

            await setDoc(doc(db, 'users', uid), {
                uid,
                email: newEmployer.email,
                displayName: newEmployer.displayName,
                phone: newEmployer.phone || null,
                location: newEmployer.location || null,
                role: UserRole.EMPLOYER,
                companyId: finalCompanyId,
                companyName: finalCompanyName,
                isVerified: false,
                credits: 0,
                createdAt: new Date().toISOString()
            });
            
            toast('מעסיק חדש התווסף בהצלחה', 'success');
            setIsAddModalOpen(false);
            setNewEmployer({ displayName: '', email: '', companyId: DEFAULT_COMPANY_ID, newCompanyName: '', phone: '', location: '', password: '' });
        } catch (error: any) {
            console.error("Error adding employer:", error);
            toast(error.message || 'שגיאה בהוספת המעסיק', 'error');
        }
    };

    const handleEditOpen = (user: User) => {
        setEmployerToEdit(user);
        setSelectedCompanyIdForEdit(user.companyId || DEFAULT_COMPANY_ID);
        setNewPasswordForUser('');
        setIsEditModalOpen(true);
    };

    const handlePasswordReset = async () => {
        if (!employerToEdit || !newPasswordForUser || newPasswordForUser.length < 6) {
            toast('חובה להזין סיסמה של 6 תווים לפחות', 'error');
            return;
        }
        setIsUpdatingPassword(true);
        try {
            const token = await (await import('../../lib/firebase')).auth.currentUser?.getIdToken();
            const res = await fetch('/api/admin/update-user-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    targetUid: (employerToEdit as any).id || employerToEdit.uid,
                    newPassword: newPasswordForUser
                })
            });
            const data = await res.json();
            if (data.success) {
                toast('הסיסמה עודכנה בהצלחה', 'success');
                setNewPasswordForUser('');
            } else {
                toast(data.error || 'שגיאה בעדכון הסיסמה', 'error');
            }
        } catch (err: any) {
            toast('שגיאה בתקשורת עם השרת', 'error');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleClone = (user: User) => {
        setNewEmployer({
            displayName: user.displayName ? user.displayName + ' (עותק)' : '',
            email: user.email ? 'copy_' + user.email : '',
            companyId: user.companyId || 'comp_default',
            newCompanyName: '',
            phone: '',
            location: '',
            password: ''
        });
        setIsAddModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employerToEdit) return;
        try {
            const empUid = (employerToEdit as any).id || employerToEdit.uid;

            // If company changed, use assignEmployerToCompany
            if (selectedCompanyIdForEdit && selectedCompanyIdForEdit !== employerToEdit.companyId) {
                const comp = companies.find(c => c.id === selectedCompanyIdForEdit);
                const compName = comp ? comp.name : DEFAULT_COMPANY_NAME;
                await assignEmployerToCompany(empUid, selectedCompanyIdForEdit, compName);
            }

            await setDoc(doc(db, 'users', empUid), {
                displayName: employerToEdit.displayName,
                email: employerToEdit.email,
                phone: employerToEdit.phone || null,
                location: (employerToEdit as any).location || null,
                canViewRelevantSeekers: !!employerToEdit.canViewRelevantSeekers,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            try {
                const token = await (await import('../../lib/firebase')).auth.currentUser?.getIdToken();
                await fetch('/api/admin/update-user-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        targetUid: empUid,
                        newEmail: employerToEdit.email
                    })
                });
            } catch (err) {
                console.error("Failed to update email in Auth", err);
            }
            
            toast('המעסיק עודכן בהצלחה', 'success');
            setIsEditModalOpen(false);
            setEmployerToEdit(null);
        } catch (error) {
            console.error("Error updating employer:", error);
            toast('שגיאה בעדכון מעסיק', 'error');
        }
    };

    const handleDelete = (u: User) => {
        if ((u as any).isDefault || (u as any).id === 'emp_default' || u.uid === 'emp_default') {
            toast('לא ניתן למחוק את מעסיק ברירת המחדל של המערכת', 'error');
            return;
        }
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
            // Delete from Auth
            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();
                try {
                    await fetch("/api/admin/delete-user", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ targetUid: (userToDelete as any).id || userToDelete.uid })
                    });
                } catch (e) { console.error(e); }
            }
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
            render: (u: any) => {
                const isDefaultEmp = u.isDefault || u.id === 'emp_default' || u.uid === 'emp_default';
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 shadow-sm">
                            {u.displayName ? u.displayName[0] : '?'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Link to={`/admin/employers/${u.id || u.uid}`} className="font-black text-slate-900 leading-tight hover:text-indigo-600 hover:underline">{u.displayName}</Link>
                                {isDefaultEmp && (
                                    <Badge variant="brand" className="text-[9px] font-black bg-indigo-100 text-indigo-700">
                                        <Sparkles size={10} className="mr-1" />
                                        מעסיק ברירת מחדל
                                    </Badge>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'company',
            header: 'חברה משויכת',
            render: (u: any) => {
                const comp = companies.find(c => c.id === u.companyId);
                const compName = u.companyName || comp?.name || DEFAULT_COMPANY_NAME;
                const compId = u.companyId || DEFAULT_COMPANY_ID;
                return (
                    <Link to={`/admin/companies/${compId}`} className="inline-flex items-center gap-1.5 font-bold text-xs text-indigo-600 hover:underline bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <Building2 size={13} className="text-slate-400" />
                        <span>{compName}</span>
                    </Link>
                );
            }
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
                description={filterParam === 'unassigned' ? "רשימת מעסיקים ללא שיוך מנהל אישי" : "כל מעסיק במערכת מקושר למשתמש וחברה. חברה היא אובייקט האב."}
                data={filteredEmployers}
                columns={columns}
                searchFields={['displayName', 'email', 'companyName']}
                onAdd={() => setIsAddModalOpen(true)}
                onEdit={handleEditOpen}
                onClone={handleClone}
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
                    message={`האם אתה בטוח שברצונך לארכב את המעסיק ${userToDelete.displayName}?`}
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">שיוך לחברה (אובייקט אב)</label>
                        <select 
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            value={newEmployer.companyId}
                            onChange={(e) => setNewEmployer(prev => ({...prev, companyId: e.target.value}))}
                        >
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.isDefault || c.id === 'comp_default' ? '(ברירת מחדל)' : ''}
                                </option>
                            ))}
                            <option value="NEW">+ צור חברה חדשה עבור מעסיק זה</option>
                        </select>
                    </div>

                    {newEmployer.companyId === 'NEW' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">שם החברה החדשה</label>
                            <Input 
                                required
                                placeholder="למשל: אלתא מערכות, סייברסק..." 
                                value={newEmployer.newCompanyName}
                                onChange={(e) => setNewEmployer(prev => ({...prev, newCompanyName: e.target.value}))}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                            <Input 
                                placeholder="למשל: 050-1234567" 
                                value={newEmployer.phone || ''}
                                onChange={(e) => setNewEmployer(prev => ({...prev, phone: e.target.value}))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">מיקום / מטה</label>
                            <Input 
                                placeholder="למשל: תל אביב, חיפה..." 
                                value={newEmployer.location || ''}
                                onChange={(e) => setNewEmployer(prev => ({...prev, location: e.target.value}))}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">סיסמה (אופציונלי - ליצירת משתמש אמיתי)</label>
                        <Input 
                            type="password"
                            placeholder="סיסמה (לפחות 6 תווים)" 
                            value={newEmployer.password || ''}
                            onChange={(e) => setNewEmployer(prev => ({...prev, password: e.target.value}))}
                        />
                        <p className="text-xs text-slate-500 mt-1">אם תוזן סיסמה, משתמש זה יווצר במערכת ההזדהות ויוכל להתחבר מיד.</p>
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
                            <label className="block text-sm font-bold text-slate-700 mb-2">שם המעסיק</label>
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

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">חברה משויכת (אובייקט אב)</label>
                            <select 
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                                value={selectedCompanyIdForEdit}
                                onChange={(e) => setSelectedCompanyIdForEdit(e.target.value)}
                            >
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.isDefault || c.id === 'comp_default' ? '(ברירת מחדל)' : ''}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-400 mt-1">שינוי חברה יעדכן אוטומטית את שם החברה בכל המשרות של מעסיק זה.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                                <Input 
                                    value={employerToEdit.phone || ''}
                                    onChange={(e) => setEmployerToEdit({ ...employerToEdit, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">מיקום / מטה</label>
                                <Input 
                                    value={(employerToEdit as any).location || ''}
                                    onChange={(e) => setEmployerToEdit({ ...employerToEdit, location: e.target.value } as any)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => setEmployerToEdit({...employerToEdit, canViewRelevantSeekers: !employerToEdit.canViewRelevantSeekers})}>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${employerToEdit.canViewRelevantSeekers ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${employerToEdit.canViewRelevantSeekers ? 'translate-x-min-6 rtl:translate-x-6' : 'translate-x-0'}`} style={{ transform: employerToEdit.canViewRelevantSeekers ? 'translateX(-24px)' : 'translateX(0)' }} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">רשאי לראות עובדים רלוונטים</h4>
                                <p className="text-xs text-slate-500">אפשר למעסיק ספציפי זה לצפות במשתמשים רלוונטים למשרות שלו.</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 mt-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">איפוס סיסמה למעסיק</label>
                            <div className="flex gap-2">
                                <Input 
                                    type="text"
                                    placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                                    value={newPasswordForUser}
                                    onChange={(e) => setNewPasswordForUser(e.target.value)}
                                    className="flex-1"
                                />
                                <Button 
                                    type="button" 
                                    onClick={handlePasswordReset}
                                    disabled={isUpdatingPassword || newPasswordForUser.length < 6}
                                    className="bg-slate-800 hover:bg-slate-900 text-white shrink-0"
                                >
                                    {isUpdatingPassword ? 'מעדכן...' : 'עדכן סיסמה'}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">שינוי סיסמה למשתמשי טסטים / קליינטים בלי גישה למייל</p>
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
                                <p className="text-xs text-slate-500 font-bold">מצב קרדיטים נוכחי: {employerForCredits.credits || 0}</p>
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
