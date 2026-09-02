import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { setDoc, addDoc } from '../../lib/firestore-audit';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { Building2, Globe, MapPin, ShieldCheck, Mail, Users, Briefcase, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { softDelete } from '../../lib/adminUtils';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ensureDefaultEntities, syncCompanyNameChange, unlinkEmployerFromCompany } from '../../services/entityService';

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
        industry: '',
        location: '',
        website: '',
        description: ''
    });

    const [employers, setEmployers] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);

    useEffect(() => {
        // Ensure default company and default employer exist
        ensureDefaultEntities().catch(err => console.error("Error ensuring default entities", err));

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

        const qJobs = query(collection(db, 'jobs'));
        const unsubJobs = onSnapshot(qJobs, (snapshot) => {
            setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((j: any) => !j.deletedAt));
        });

        return () => {
            unsubscribe();
            unsubEmps();
            unsubJobs();
        };
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!newCompany.name.trim()) {
                toast('נא להזין שם חברה', 'error');
                return;
            }

            const companyId = 'comp_' + Date.now();
            
            await setDoc(doc(db, 'companies', companyId), {
                id: companyId,
                name: newCompany.name.trim(),
                industry: newCompany.industry || 'כללי',
                location: newCompany.location || 'ישראל',
                website: newCompany.website || '',
                description: newCompany.description || '',
                isVerified: true,
                credits: 0,
                createdAt: new Date().toISOString()
            });
            
            toast('חברה חדשה התווספה בהצלחה', 'success');
            setIsAddModalOpen(false);
            setNewCompany({ name: '', industry: '', location: '', website: '', description: '' });
        } catch (error) {
            console.error("Error adding company:", error);
            toast('שגיאה בהוספת החברה', 'error');
        }
    };

    const handleEditOpen = (company: any) => {
        setCompanyToEdit(company);
        setIsEditModalOpen(true);
    };

    const handleClone = (company: any) => {
        setNewCompany({
            name: company.name ? company.name + ' (עותק)' : '',
            industry: company.industry || '',
            location: company.location || '',
            website: company.website || '',
            description: company.description || ''
        });
        setIsAddModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyToEdit) return;
        try {
            const oldName = companies.find(c => c.id === companyToEdit.id)?.name;
            const newName = companyToEdit.name.trim();

            await setDoc(doc(db, 'companies', companyToEdit.id), {
                name: newName,
                industry: companyToEdit.industry || '',
                location: companyToEdit.location || '',
                website: companyToEdit.website || '',
                description: companyToEdit.description || '',
                logoUrl: companyToEdit.logoUrl || null,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            // If company name changed, sync across all associated employers and jobs
            if (oldName && oldName !== newName) {
                await syncCompanyNameChange(companyToEdit.id, newName);
            }
            
            toast('החברה עודכנה בהצלחה', 'success');
            setIsEditModalOpen(false);
            setCompanyToEdit(null);
        } catch (error) {
            console.error("Error updating company:", error);
            toast('שגיאה בעדכון החברה', 'error');
        }
    };

    const handleDelete = (c: any) => {
        if (c.isDefault || c.id === 'comp_default') {
            toast('לא ניתן למחוק את חברת ברירת המחדל של המערכת', 'error');
            return;
        }
        setCompanyToDelete(c);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async (reason: string) => {
        if (!companyToDelete || !currentUser) return;
        try {
            // Re-link employers of this company to default company
            const linkedEmps = employers.filter(e => e.companyId === companyToDelete.id);
            for (const emp of linkedEmps) {
                await unlinkEmployerFromCompany(emp.id || emp.uid);
            }

            await softDelete({
                collectionName: 'companies',
                id: companyToDelete.id,
                deletedBy: currentUser.uid,
                reason
            });
            toast('החברה הועברה לארכיון והמעסיקים המשויכים הועברו לעובדים בצ\'יק כללי', 'success');
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
            render: (c: any) => {
                const isDefaultComp = c.isDefault || c.id === 'comp_default';
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden p-1">
                            {c.logoUrl ? (
                                <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain rounded-xl" />
                            ) : (
                                <Building2 className="text-slate-300" size={24} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Link to={`/admin/companies/${c.id}`} className="font-black text-slate-900 leading-tight hover:text-indigo-600 hover:underline">{c.name}</Link>
                                {isDefaultComp && (
                                    <Badge variant="brand" className="text-[9px] font-black bg-indigo-100 text-indigo-700">
                                        <Sparkles size={10} className="mr-1" />
                                        חברת ברירת מחדל
                                    </Badge>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.industry || 'תעשייה כללית'} | {c.location || 'ישראל'}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'employersCount',
            header: 'מעסיקים משויכים',
            render: (c: any) => {
                const linkedEmps = employers.filter(e => e.companyId === c.id || (c.isDefault && !e.companyId));
                return (
                    <Link to={`/admin/companies/${c.id}?tab=employers`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-bold text-xs transition-colors">
                        <Users size={13} className="text-indigo-500" />
                        <span>{linkedEmps.length} מעסיקים</span>
                    </Link>
                );
            }
        },
        { 
            key: 'jobsCount', 
            header: 'משרות בחברה',
            render: (c: any) => {
                const compJobs = jobs.filter(j => j.companyId === c.id || (!j.companyId && c.isDefault));
                return (
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-600">
                        <Briefcase size={13} className="text-slate-400" />
                        <span>{compJobs.length} משרות</span>
                    </div>
                );
            }
        },
        {
            key: 'verification',
            header: 'סטטוס אימות',
            render: (c: any) => (
                c.isVerified ? (
                    <Badge variant="success" className="text-[10px] font-black flex items-center gap-1">
                        <ShieldCheck size={12} />
                        מאומתת
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
                    {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors" title={c.website}><Globe size={14} /></a>}
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
        }
    ];

    return (
        <>
            <AdminTable 
                title="ניהול חברות (אובייקט אב)"
                description="חברה מהווה ישות-אב המרכזת תחתיה מעסיקים, משרות וקרדיטים משותפים."
                data={companies}
                columns={columns}
                searchFields={['name', 'industry', 'location']}
                onAdd={() => setIsAddModalOpen(true)}
                onEdit={handleEditOpen}
                onClone={handleClone}
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
                    message={`האם אתה בטוח שברצונך לארכב את חברת ${companyToDelete.name}? כל המעסיקים והמשרות המשויכים יועברו אוטומטית לחברת ברירת המחדל.`}
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">שם חברה</label>
                        <Input 
                            required
                            placeholder="למשל: סייברקאפ, גוגל, עובדים בציק..." 
                            value={newCompany.name}
                            onChange={(e) => setNewCompany(prev => ({...prev, name: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">תעשייה / תחום</label>
                        <Input 
                            placeholder="למשל: תוכנה, קמעונאות, מזון..." 
                            value={newCompany.industry}
                            onChange={(e) => setNewCompany(prev => ({...prev, industry: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">מיקום משרדים / מטה</label>
                        <Input 
                            placeholder="למשל: תל אביב, חיפה..." 
                            value={newCompany.location}
                            onChange={(e) => setNewCompany(prev => ({...prev, location: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">אתר אינטרנט (אופציונלי)</label>
                        <Input 
                            placeholder="https://example.com" 
                            value={newCompany.website}
                            onChange={(e) => setNewCompany(prev => ({...prev, website: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">תיאור החברה (אופציונלי)</label>
                        <textarea 
                            rows={3}
                            className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 font-sans"
                            placeholder="תיאור כללי על החברה..."
                            value={newCompany.description}
                            onChange={(e) => setNewCompany(prev => ({...prev, description: e.target.value}))}
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
                                            const url = window.location.origin + '/file/' + storageRef.fullPath;
                                            
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
                                            toast('הלוגו הועלה בהצלחה (אל תשכחו לשמור)', 'success');
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
                                value={companyToEdit.industry || ''}
                                onChange={(e) => setCompanyToEdit({ ...companyToEdit, industry: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">מיקום משרדים</label>
                            <Input 
                                value={companyToEdit.location || ''}
                                onChange={(e) => setCompanyToEdit({ ...companyToEdit, location: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">אתר אינטרנט</label>
                            <Input 
                                value={companyToEdit.website || ''}
                                onChange={(e) => setCompanyToEdit({ ...companyToEdit, website: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">תיאור החברה</label>
                            <textarea 
                                rows={3}
                                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 font-sans"
                                value={companyToEdit.description || ''}
                                onChange={(e) => setCompanyToEdit({ ...companyToEdit, description: e.target.value })}
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
