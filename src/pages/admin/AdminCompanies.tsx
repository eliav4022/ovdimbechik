import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { Building2, Globe, MapPin, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { softDelete } from '../../lib/adminUtils';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const AdminCompanies: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState<any | null>(null);

    const [newCompany, setNewCompany] = useState({
        name: '',
        employerId: '',
        industry: '',
        location: ''
    });

    const [employers, setEmployers] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'companies'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((c: any) => !c.deletedAt);
            setCompanies(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching companies:", error);
            toast('שגיאה בטעינת חברות: ' + error.message, 'error');
            setLoading(false);
        });

        const qEmps = query(collection(db, 'users'), where('role', '==', 'EMPLOYER'));
        const unsubEmps = onSnapshot(qEmps, (snapshot) => {
            setEmployers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((u: any) => !u.deletedAt));
        });

        return () => {
            unsubscribe();
            unsubEmps();
        };
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const companyId = 'comp_' + Date.now();
            
            await setDoc(doc(db, 'companies', companyId), {
                name: newCompany.name,
                employerId: newCompany.employerId || currentUser?.uid || 'system',
                industry: newCompany.industry,
                location: newCompany.location,
                isVerified: true,
                createdAt: new Date().toISOString()
            });
            
            toast('חברה חדשה התווספה בהצלחה', 'success');
            setIsAddModalOpen(false);
            setNewCompany({ name: '', employerId: '', industry: '', location: '' });
        } catch (error) {
            console.error("Error adding company:", error);
            toast('שגיאה בהוספת החברה', 'error');
        }
    };

    const handleEditOpen = (company: any) => {
        setCompanyToEdit(company);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyToEdit) return;
        try {
            await setDoc(doc(db, 'companies', companyToEdit.id), {
                name: companyToEdit.name,
                industry: companyToEdit.industry,
                location: companyToEdit.location,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            toast('החברה עודכנה בהצלחה', 'success');
            setIsEditModalOpen(false);
            setCompanyToEdit(null);
        } catch (error) {
            console.error("Error updating company:", error);
            toast('שגיאה בעדכון החברה', 'error');
        }
    };

    const handleDelete = (c: any) => {
        setCompanyToDelete(c);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async (reason: string) => {
        if (!companyToDelete || !currentUser) return;
        try {
            await softDelete({
                collectionName: 'companies',
                id: companyToDelete.id,
                deletedBy: currentUser.uid,
                reason
            });
            toast('החברה הועברה לארכיון', 'success');
        } catch (error) {
            toast('שגיאה במחיקה', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setCompanyToDelete(null);
        }
    };

    const handleStatusChange = async (company: any, status: string) => {
        try {
            const isVerified = status === 'active';
            await setDoc(doc(db, 'companies', company.id), {
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
            key: 'name', 
            header: 'שם החברה',
            render: (c: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden p-1">
                        {c.logoUrl ? (
                            <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain rounded-xl" />
                        ) : (
                            <Building2 className="text-slate-300" size={24} />
                        )}
                    </div>
                    <div>
                        <Link to={`/admin/companies/${c.id}`} className="font-black text-slate-900 leading-tight hover:text-indigo-600 hover:underline">{c.name}</Link>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.industry || 'תעשייה כללית'} | {c.location}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'employer',
            header: 'מעסיק בעלים',
            render: (c: any) => {
                const emp = employers.find(e => (e as any).id === c.employerId || e.uid === c.employerId);
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs">{emp ? emp.displayName : 'לא ידוע'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{emp ? emp.email : c.employerId}</span>
                    </div>
                );
            }
        },
        {
            key: 'verification',
            header: 'אימות',
            render: (c: any) => (
                c.isVerified ? (
                    <Badge variant="success" className="text-[10px] font-black flex items-center gap-1">
                        <ShieldCheck size={12} />
                        חברה מאומתת
                    </Badge>
                ) : (
                    <Badge variant="warning" className="text-[10px] font-black">
                        ממתין לאימות
                    </Badge>
                )
            )
        },
        { 
            key: 'location', 
            header: 'מיקום',
            render: (c: any) => (
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                    <MapPin size={14} className="text-slate-300" />
                    {c.location || 'לא צוין'}
                </div>
            )
        },
        {
            key: 'links',
            header: 'קישורים',
            render: (c: any) => (
                <div className="flex items-center gap-3">
                    {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary transition-colors"><Globe size={14} /></a>}
                    {c.email && <a href={`mailto:${c.email}`} className="text-slate-400 hover:text-primary transition-colors"><Mail size={14} /></a>}
                </div>
            )
        },
        {
            key: 'credits',
            header: 'קרדיטים',
            render: (c: any) => (
                <div className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                    {c.credits || 0}
                </div>
            )
        },
        { 
            key: 'jobsCount', 
            header: 'משרות',
            render: (c: any) => (
                <div className="text-sm font-bold text-slate-600">
                    {c.activeJobsCount || 0} פעילות
                </div>
            )
        }
    ];

    return (
        <>
            <AdminTable 
                title="ניהול חברות"
                description="פיקוח על פרופילי חברות, אימות מעסיקים וניהול מותג מעסיק."
                data={companies}
                columns={columns}
                searchFields={['name', 'industry', 'location']}
                onAdd={() => setIsAddModalOpen(true)}
                onEdit={handleEditOpen}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onExport={() => console.log('Exporting companies...')}
                filters={[
                    { 
                        key: 'industry', 
                        label: 'תחום עיסוק', 
                        options: [
                            { label: 'הייטק', value: 'tech' },
                            { label: 'קמעונאות', value: 'retail' },
                            { label: 'פיננסים', value: 'finance' },
                        ] 
                    }
                ]}
            />

            {companyToDelete && (
                <TwoStepConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="ארכוב פרופיל חברה"
                    message={`האם אתה בטוח שברצונך לארכב את חברת ${companyToDelete.name}?`}
                    confirmWord="מחק"
                />
            )}

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="הוספת חברה חדשה"
            >
                <form onSubmit={handleAdd} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">בעלי החברה (מעסיק)</label>
                        <select 
                            required
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            value={newCompany.employerId}
                            onChange={(e) => setNewCompany(prev => ({...prev, employerId: e.target.value}))}
                        >
                            <option value="">בחר מעסיק...</option>
                            {employers.map(emp => (
                                <option key={emp.id || emp.uid} value={emp.id || emp.uid}>{emp.displayName} ({emp.email})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">שם חברה</label>
                        <Input 
                            required
                            placeholder="למשל: סייברקאפ..." 
                            value={newCompany.name}
                            onChange={(e) => setNewCompany(prev => ({...prev, name: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">תעשייה</label>
                        <Input 
                            placeholder="למשל: תוכנה..." 
                            value={newCompany.industry}
                            onChange={(e) => setNewCompany(prev => ({...prev, industry: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">מיקום משרדים</label>
                        <Input 
                            placeholder="למשל: תל אביב, חיפה..." 
                            value={newCompany.location}
                            onChange={(e) => setNewCompany(prev => ({...prev, location: e.target.value}))}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>ביטול</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור חברה</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="עריכת חברה"
            >
                {companyToEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-6">
                        <div className="flex gap-4 items-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                                {companyToEdit.logoUrl ? (
                                    <img src={companyToEdit.logoUrl} alt={companyToEdit.name} className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 className="text-slate-300" size={32} />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2">לוגו החברה</label>
                                <input 
                                    type="file"
                                    accept="image/*"
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const fileExt = file.name.split('.').pop();
                                            const storageRef = ref(storage, `cvs/admin_${Date.now()}.${fileExt}`);
                                            const fileBytes = new Uint8Array(await file.arrayBuffer());
                                            await uploadBytes(storageRef, fileBytes, { contentType: file.type });
                                            const url = await getDownloadURL(storageRef);
                                            
                                            // Save to files collection
                                            const compName = companyToEdit.name || 'חברה_ללא_שם';
                                            const formattedDate = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');
                                            await addDoc(collection(db, 'files'), {
                                                name: `לוגו-${compName}-${formattedDate}.${fileExt}`,
                                                url,
                                                type: file.type,
                                                size: file.size,
                                                createdAt: serverTimestamp(),
                                                uploadedBy: currentUser?.uid
                                            });
                                            
                                            setCompanyToEdit({ ...companyToEdit, logoUrl: url });
                                            toast('הלוגו הועלה בהצלחה נוסף לניהול קבצים (אל תשכחו לשמור)', 'success');
                                        } catch (error) {
                                            console.error('Error uploading logo:', error);
                                            toast('שגיאה בהעלאת התמונה', 'error');
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">שם חברה</label>
                            <Input 
                                required
                                value={companyToEdit.name}
                                onChange={(e) => setCompanyToEdit({ ...companyToEdit, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">תעשייה</label>
                            <Input 
                                value={companyToEdit.industry}
                                onChange={(e) => setCompanyToEdit({ ...companyToEdit, industry: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">מיקום משרדים</label>
                            <Input 
                                value={companyToEdit.location}
                                onChange={(e) => setCompanyToEdit({ ...companyToEdit, location: e.target.value })}
                            />
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
