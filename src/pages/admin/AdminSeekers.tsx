import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { User, UserRole } from '../../types';
import { Trash2, UserCheck, Mail, Phone, Download, MapPin } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { softDelete } from '../../lib/adminUtils';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const AdminSeekers: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [seekers, setSeekers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [seekerToEdit, setSeekerToEdit] = useState<User | null>(null);
    const [newPasswordForUser, setNewPasswordForUser] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const [newSeeker, setNewSeeker] = useState({
        displayName: '',
        email: '',
        jobTitle: '',
        phone: '',
        location: '',
        password: ''
    });

    useEffect(() => {
        const q = query(
            collection(db, 'users'), 
            where('role', '==', UserRole.SEEKER)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as unknown as User))
                .filter(u => !u.deletedAt);
            setSeekers(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching seekers:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!newSeeker.email) {
                toast('נא למלא אימייל', 'error');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newSeeker.email)) {
                toast('נא להזין כתובת אימייל תקינה', 'error');
                return;
            }

            let uid = 'seek_' + Date.now();
            
            if (newSeeker.password) {
                const token = await (await import('../../lib/firebase')).auth.currentUser?.getIdToken();
                const res = await fetch('/api/admin/create-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email: newSeeker.email,
                        password: newSeeker.password,
                        displayName: newSeeker.displayName,
                        uid: uid
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error === "Firebase Admin config missing" ? "שגיאה: כדי ליצור משתמשים עם סיסמה דרך ממשק הניהול, עליך להגדיר את מפתח FIREBASE_SERVICE_ACCOUNT בהגדרות הסודות" : data.error || 'Failed to create user in Auth');
            }
            
            await setDoc(doc(db, 'users', uid), {
                uid,
                email: newSeeker.email,
                displayName: newSeeker.displayName,
                phone: newSeeker.phone,
                location: newSeeker.location,
                role: UserRole.SEEKER,
                isVerified: false,
                createdAt: new Date().toISOString(),
                seekerProfile: {
                    jobTitle: newSeeker.jobTitle,
                    yearsOfExperience: 0
                }
            });
            
            toast('מחפש עבודה התווסף בהצלחה', 'success');
            setIsAddModalOpen(false);
            setNewSeeker({ displayName: '', email: '', jobTitle: '', phone: '', location: '', password: '' });
        } catch (error: any) {
            console.error("Error adding seeker:", error);
            toast(error.message || 'שגיאה בהוספת המועמד', 'error');
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
            toast('מחפש העבודה הועבר לארכיון', 'success');
        } catch (error) {
            toast('שגיאה במחיקה', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    const handleEditOpen = (user: User) => {
        setSeekerToEdit(user);
        setNewPasswordForUser('');
        setIsEditModalOpen(true);
    };

    const handlePasswordReset = async () => {
        if (!seekerToEdit || !newPasswordForUser || newPasswordForUser.length < 6) {
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
                    targetUid: (seekerToEdit as any).id || seekerToEdit.uid,
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
        setNewSeeker({
            displayName: user.displayName ? user.displayName + ' (עותק)' : '',
            email: user.email ? 'copy_' + user.email : '',
            jobTitle: (user as any).seekerProfile?.jobTitle || '',
            phone: '',
            location: '',
            password: ''
        });
        setIsAddModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!seekerToEdit) return;
        try {
            await setDoc(doc(db, 'users', (seekerToEdit as any).id || seekerToEdit.uid), {
                displayName: seekerToEdit.displayName,
                email: seekerToEdit.email,
                phone: seekerToEdit.phone || null,
                location: (seekerToEdit as any).location || null,
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
                        targetUid: (seekerToEdit as any).id || seekerToEdit.uid,
                        newEmail: seekerToEdit.email
                    })
                });
            } catch (err) {
                 console.error("Failed to update email in Auth", err);
            }

            toast('מחפש העבודה עודכן בהצלחה', 'success');
            setIsEditModalOpen(false);
            setSeekerToEdit(null);
        } catch (error) {
            console.error("Error updating seeker:", error);
            toast('שגיאה בעדכון מחפש העבודה', 'error');
        }
    };

    const handleStatusChange = async (user: User, status: string) => {
        try {
            const isVerified = status === 'active';
            await setDoc(doc(db, 'users', (user as any).id || user.uid), {
                isVerified,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            toast(`סטטוס שונה בהצלחה`, 'success');
        } catch (error) {
            console.error("Error updating status:", error);
            toast('שגיאה בשינוי סטטוס', 'error');
        }
    };

    const columns = [
        { 
            key: 'displayName', 
            header: 'שם המועמד',
            render: (u: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 shadow-sm">
                        {u.displayName ? u.displayName[0] : '?'}
                    </div>
                    <div>
                        <Link to={`/admin/users/${u.id || u.uid}`} className="font-black text-slate-900 leading-tight hover:text-indigo-600 hover:underline">{u.displayName}</Link>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{u.seekerProfile?.jobTitle || 'טרם עודכן תפקיד'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'location',
            header: 'מיקום',
            render: (u: any) => (
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                    <MapPin size={14} className="text-slate-300" />
                    {u.location || 'לא צוין'}
                </div>
            )
        },
        { 
            key: 'experience', 
            header: 'ניסיון',
            render: (u: any) => (
                <Badge variant="outline" className="text-[10px] font-black tracking-wider border-slate-200">
                    {u.seekerProfile?.yearsOfExperience ? `${u.seekerProfile.yearsOfExperience} שנים` : 'מתחיל'}
                </Badge>
            )
        },
        {
            key: 'status',
            header: 'סטטוס פרופיל',
            render: (u: any) => {
                const isComplete = u.seekerProfile?.resumeUrl && u.seekerProfile?.bio;
                return (
                    <Badge variant={isComplete ? 'success' : 'warning'} className="font-bold text-[10px]">
                        {isComplete ? 'פרופיל מלא' : 'חסר נתונים'}
                    </Badge>
                );
            }
        },
        { 
            key: 'createdAt', 
            header: 'הצטרף ב-',
            render: (u: any) => <span className="text-xs text-slate-500 font-mono">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('he-IL') : '-'}</span>
        }
    ];

    return (
        <>
            <AdminTable 
                title="מאגר מחפשי עבודה"
                description="ניהול המועמדים הרשומים במערכת, בדיקת איכות פרופילים וניהול גישה."
                data={seekers}
                columns={columns}
                searchFields={['displayName', 'email']}
                onAdd={() => setIsAddModalOpen(true)}
                onEdit={handleEditOpen}
                onClone={handleClone}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onExport={() => console.log('Exporting seekers...')}
                bulkActions={[
                    { label: 'הורדת קורות חיים', action: (items) => alert(`מוריד ${items.length} קבצים...`), icon: Download },
                ]}
            />

            {userToDelete && (
                <TwoStepConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="ארכוב מחפש עבודה"
                    message={`האם אתה בטוח שברצונך לארכב את ${userToDelete.displayName}?`}
                    confirmWord="מחק"
                />
            )}

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="הוספת מחפש עבודה חדש"
            >
                <form onSubmit={handleAdd} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">שם מלא</label>
                        <Input 
                            required
                            placeholder="למשל: דניאל לוי..." 
                            value={newSeeker.displayName}
                            onChange={(e) => setNewSeeker(prev => ({...prev, displayName: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">אימייל</label>
                        <Input 
                            type="email"
                            required
                            placeholder="daniel@example.com" 
                            value={newSeeker.email}
                            onChange={(e) => setNewSeeker(prev => ({...prev, email: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">תפקיד מבוקש / מקצוע העיקרי</label>
                        <Input 
                            placeholder="למשל: מנתח נתונים, מנהל פרויקטים..." 
                            value={newSeeker.jobTitle}
                            onChange={(e) => setNewSeeker(prev => ({...prev, jobTitle: e.target.value}))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                            <Input 
                                placeholder="למשל: 050-1234567" 
                                value={newSeeker.phone || ''}
                                onChange={(e) => setNewSeeker(prev => ({...prev, phone: e.target.value}))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">מיקום</label>
                            <Input 
                                placeholder="למשל: תל אביב, חיפה..." 
                                value={newSeeker.location || ''}
                                onChange={(e) => setNewSeeker(prev => ({...prev, location: e.target.value}))}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">סיסמה (אופציונלי - ליצירת משתמש אמיתי)</label>
                        <Input 
                            type="password"
                            placeholder="סיסמה (לפחות 6 תווים)" 
                            value={newSeeker.password || ''}
                            onChange={(e) => setNewSeeker(prev => ({...prev, password: e.target.value}))}
                        />
                        <p className="text-xs text-slate-500 mt-1">אם תוזן סיסמה, המשתמש יוכל להתחבר למערכת מיד.</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>ביטול</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור מועמד</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="עריכת פרטי מחפש עבודה"
            >
                {seekerToEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">שם מלא</label>
                            <Input 
                                required
                                value={seekerToEdit.displayName}
                                onChange={(e) => setSeekerToEdit({ ...seekerToEdit, displayName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">אימייל</label>
                            <Input 
                                type="email"
                                required
                                value={seekerToEdit.email}
                                onChange={(e) => setSeekerToEdit({ ...seekerToEdit, email: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                                <Input 
                                    value={seekerToEdit.phone || ''}
                                    onChange={(e) => setSeekerToEdit({ ...seekerToEdit, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">מיקום</label>
                                <Input 
                                    value={(seekerToEdit as any).location || ''}
                                    onChange={(e) => setSeekerToEdit({ ...seekerToEdit, location: e.target.value } as any)}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 mt-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">איפוס סיסמה למשתמש</label>
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
        </>
    );
};
