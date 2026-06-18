import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { Job, JobStatus, PromotionLevel, JobType, WorkMode, ExperienceLevel, User } from '../../types';
import { Trash2, ExternalLink, ShieldCheck, Zap, Diamond, Plus } from 'lucide-react';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { softDelete } from '../../lib/adminUtils';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';

export const AdminJobs: React.FC<{ isCasual?: boolean }> = ({ isCasual = false }) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

  const [newJob, setNewJob] = useState({
      title: '',
      description: '',
      employerId: '',
      companyName: '',
      companyDescription: '',
      location: '',
      type: JobType.FULL_TIME,
      workMode: WorkMode.HYBRID,
      experienceLevel: ExperienceLevel.MIDDLE,
      category: '',
      tags: '',
      salary: '',
      status: JobStatus.ACTIVE,
      scheduledPublishDate: '',
      scheduledRemovalDate: '',
      isImmediate: false,
      isUrgent: false,
      requireCV: true,
      isCasual: isCasual,
      promotionLevel: PromotionLevel.REGULAR
  });

  const [employers, setEmployers] = useState<User[]>([]);
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
  const [fetchedTags, setFetchedTags] = useState<string[]>([]);

  const [isAddEmployerModalOpen, setIsAddEmployerModalOpen] = useState(false);
  const [newEmployer, setNewEmployer] = useState({
      fullName: '',
      email: '',
      phone: '',
      companyName: ''
  });

  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');

  const filteredJobs = useMemo(() => {
      if (statusParam === 'Pending') {
          return jobs.filter(j => j.status === JobStatus.PENDING_REVIEW);
      }
      return jobs;
  }, [jobs, statusParam]);

  const employerOptions = useMemo(() => {
    return employers.map(emp => ({
      value: (emp as any).id || emp.uid,
      label: `${emp.displayName || emp.fullName || 'ללא שם'} | ${emp.companyName || 'ללא חברה'} | 📱 ${emp.phone || 'ללא טלפון'}`
    }));
  }, [employers]);

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const tagsRef = doc(db, 'settings', 'tags');
            const tagsSnap = await getDoc(tagsRef);
            if (tagsSnap.exists()) {
                const data = tagsSnap.data();
                setFetchedCategories(data.categories || []);
                setFetchedTags(data.jobTags || []);
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        }
    };
    fetchSettings();

    const qJobs = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsubJobs = onSnapshot(qJobs, (snapshot) => {
      const jobsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as unknown as Job))
        .filter(j => !j.deletedAt)
        .filter(j => isCasual ? j.isCasual === true : !j.isCasual);
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      toast('שגיאה בטעינת המשרות: ' + error.message, 'error');
      setLoading(false);
    });

    const qEmps = query(collection(db, 'users'), where('role', '==', 'EMPLOYER'));
    const unsubEmps = onSnapshot(qEmps, (snapshot) => {
      const empsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as unknown as User))
        .filter(u => !u.deletedAt);
      setEmployers(empsData);
    });

    return () => {
      unsubJobs();
      unsubEmps();
    };
  }, [isCasual, toast]);

  const handleEditOpen = (job: Job) => {
      setJobToEdit(job);
      setIsEditModalOpen(true);
  };

  const handleClone = (job: Job) => {
      setNewJob({
          title: job.title + ' (עותק)',
          description: job.description || '',
          employerId: job.employerId || '',
          companyName: job.companyName || '',
          companyDescription: job.companyDescription || '',
          location: job.location || '',
          type: job.type as JobType || JobType.FULL_TIME,
          workMode: job.workMode as WorkMode || WorkMode.HYBRID,
          experienceLevel: job.experienceLevel as ExperienceLevel || ExperienceLevel.MIDDLE,
          category: job.category || '',
          tags: Array.isArray(job.tags) ? job.tags.join(', ') : (job.tags || ''),
          salary: job.salary || '',
          status: JobStatus.ACTIVE,
          scheduledPublishDate: job.scheduledPublishDate || '',
          scheduledRemovalDate: job.scheduledRemovalDate || '',
          isImmediate: job.isImmediate || false,
          isUrgent: job.isUrgent || false,
          requireCV: job.requireCV ?? true,
          isCasual: isCasual,
          promotionLevel: job.promotionLevel as PromotionLevel || PromotionLevel.REGULAR
      } as any); // Type assertion if needed
      setIsAddModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!jobToEdit) return;
      try {
          const finalTags = typeof jobToEdit.tags === 'string' ? (jobToEdit.tags as string).split(',').map((t: string) => t.trim()).filter((t: string) => t) : (jobToEdit.tags || []);
          
          await setDoc(doc(db, 'jobs', (jobToEdit as any).id), {
              title: jobToEdit.title,
              description: jobToEdit.description || '',
              companyName: jobToEdit.companyName,
              companyDescription: jobToEdit.companyDescription || '',
              location: jobToEdit.location,
              category: jobToEdit.category || '',
              tags: finalTags,
              salary: jobToEdit.salary || '',
              type: jobToEdit.type,
              workMode: jobToEdit.workMode || WorkMode.HYBRID,
              experienceLevel: jobToEdit.experienceLevel || ExperienceLevel.MIDDLE,
              isImmediate: jobToEdit.isImmediate || false,
              isUrgent: jobToEdit.isUrgent || false,
              requireCV: jobToEdit.requireCV ?? true,
              isCasual: jobToEdit.isCasual || false,
              promotionLevel: jobToEdit.promotionLevel || PromotionLevel.REGULAR,
              status: jobToEdit.status,
              scheduledPublishDate: jobToEdit.scheduledPublishDate || '',
              scheduledRemovalDate: jobToEdit.scheduledRemovalDate || '',
              updatedAt: new Date().toISOString()
          }, { merge: true });

          if (finalTags.length > 0) {
              try {
                  const tagUpdates: any = { jobTags: arrayUnion(...finalTags) };
                  if (jobToEdit.category) {
                      tagUpdates[`tagsByCategory.${jobToEdit.category}`] = arrayUnion(...finalTags);
                  }
                  await setDoc(doc(db, 'settings', 'tags'), tagUpdates, { merge: true });
              } catch(e) { console.error("Failed to update global tags", e); }
          }
          
          toast('המשרה עודכנה בהצלחה', 'success');
          setIsEditModalOpen(false);
          setJobToEdit(null);
      } catch (error) {
          console.error("Error updating job:", error);
          toast('שגיאה בעדכון השמרה', 'error');
      }
  };

  const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const jobId = 'job_' + Date.now();
          const employerId = newJob.employerId || currentUser?.uid || 'system';
          
          let resolvedCompanyName = newJob.companyName;
          const selectedEmp = employers.find(e => e.uid === employerId || (e as any).id === employerId);
          const employerName = selectedEmp ? selectedEmp.displayName || selectedEmp.fullName : (currentUser?.displayName || 'מנהל משרות');
          
          const finalTags = newJob.tags ? newJob.tags.split(',').map(t => t.trim()).filter(t => t) : [];

          await setDoc(doc(db, 'jobs', jobId), {
              employerId,
              ownerId: employerId,
              employerName: employerName || 'ללא שם מעסיק',
              title: newJob.title || '',
              description: newJob.description || '',
              companyName: resolvedCompanyName || '',
              companyDescription: newJob.companyDescription || '',
              location: newJob.location || '',
              category: newJob.category || '',
              tags: finalTags,
              salary: newJob.salary || '',
              type: newJob.type || 'Full Time',
              workMode: newJob.workMode || WorkMode.HYBRID,
              experienceLevel: newJob.experienceLevel || ExperienceLevel.MIDDLE,
              isImmediate: newJob.isImmediate || false,
              isUrgent: newJob.isUrgent || false,
              requireCV: newJob.requireCV ?? true,
              isCasual: newJob.isCasual || false,
              promotionLevel: newJob.promotionLevel || PromotionLevel.REGULAR,
              status: newJob.status || 'draft',
              scheduledPublishDate: newJob.scheduledPublishDate || '',
              scheduledRemovalDate: newJob.scheduledRemovalDate || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              applicationsCount: 0,
              viewsCount: 0
          });

          if (finalTags.length > 0) {
              try {
                  const tagUpdates: any = { jobTags: arrayUnion(...finalTags) };
                  if (newJob.category) {
                      tagUpdates[`tagsByCategory.${newJob.category}`] = arrayUnion(...finalTags);
                  }
                  await setDoc(doc(db, 'settings', 'tags'), tagUpdates, { merge: true });
              } catch(e) { console.error("Failed to update global tags", e); }
          }
          
          toast('משרה חדשה התווספה בהצלחה', 'success');
          setIsAddModalOpen(false);
          setNewJob({ title: '', description: '', employerId: '', companyName: '', companyDescription: '', location: '', type: JobType.FULL_TIME, workMode: WorkMode.HYBRID, experienceLevel: ExperienceLevel.MIDDLE, category: '', tags: '', salary: '', status: JobStatus.ACTIVE, scheduledPublishDate: '', scheduledRemovalDate: '', isImmediate: false, isUrgent: false, requireCV: true, isCasual: isCasual, promotionLevel: PromotionLevel.REGULAR });
      } catch (error) {
          console.error("Error adding job:", error);
          toast('שגיאה בהוספת משרה', 'error');
      }
  };

  const handleAddEmployer = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const empId = 'emp_' + Date.now();
          await setDoc(doc(db, 'users', empId), {
              uid: empId,
              fullName: newEmployer.fullName,
              displayName: newEmployer.fullName,
              email: newEmployer.email,
              phone: newEmployer.phone,
              companyName: newEmployer.companyName,
              role: 'EMPLOYER',
              status: 'Active',
              createdAt: new Date().toISOString(),
              permissions: []
          });
          toast('מעסיק/חברה הוקמו בהצלחה', 'success');
          setIsAddEmployerModalOpen(false);
          setNewJob(prev => ({ ...prev, employerId: empId, companyName: newEmployer.companyName }));
          setNewEmployer({ fullName: '', email: '', phone: '', companyName: '' });
      } catch (err: any) {
          console.error("Error adding employer:", err);
          toast('שגיאה בהקמת מעסיק / חברה: ' + err.message, 'error');
      }
  };

  const handleDelete = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (reason: string) => {
    if (!jobToDelete || !currentUser) return;
    
    try {
      await softDelete({
        collectionName: 'jobs',
        id: (jobToDelete as any).id,
        deletedBy: currentUser.uid,
        reason
      });
      toast('המשרה הועברה לארכיון בהצלחה', 'success');
    } catch (error) {
      console.error("Soft delete failed:", error);
      toast('שגיאה במחיקת המשרה', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    }
  };

  const handleApproveUpdate = async (job: Job) => {
      const j = job as any;
      if (!j.hasPendingUpdate || !j.pendingUpdate) return;
      try {
          // Merge pending update into main document
          const finalUpdates = {
              ...j.pendingUpdate,
              hasPendingUpdate: false,
              pendingUpdate: null,
              updatedAt: new Date().toISOString()
          };
          await updateDoc(doc(db, 'jobs', j.id), finalUpdates);
          toast('עדכון המשרה אושר בהצלחה', 'success');
      } catch (error) {
          console.error("Error approving update:", error);
          toast('שגיאה באישור עדכון משרה', 'error');
      }
  };

  const handleStatusChange = async (job: Job, status: string) => {
      try {
          const updates: any = {
              status,
              updatedAt: new Date().toISOString()
          };

          const isApproving = status === JobStatus.ACTIVE || status === 'Published';
          if (isApproving && job.hasPendingTags && job.pendingTags && job.pendingTags.length > 0) {
              const currentTags = job.tags || [];
              const pendingToApprove = job.pendingTags;
              const newTags = Array.from(new Set([...currentTags, ...pendingToApprove]));
              
              updates.tags = newTags;
              updates.pendingTags = [];
              updates.hasPendingTags = false;

              // Also add to global settings
              try {
                  const tagUpdates: any = { jobTags: arrayUnion(...pendingToApprove) };
                  if (job.category) {
                      tagUpdates[`tagsByCategory.${job.category}`] = arrayUnion(...pendingToApprove);
                  }
                  await setDoc(doc(db, 'settings', 'tags'), tagUpdates, { merge: true });
              } catch(e) { console.error("Failed to update global tags", e); }
          }

          await updateDoc(doc(db, 'jobs', (job as any).id), updates);
          
          if (isApproving && job.status !== JobStatus.ACTIVE && job.status !== 'Published') {
              const emp = employers.find(e => (e as any).id === job.employerId || e.uid === job.employerId);
              if (emp && emp.email) {
                  try {
                      // Import sendEmail dynamically to avoid circular dependencies if any, or regular import
                      const { sendEmail } = await import('../../lib/emailUtils');
                      await sendEmail({
                          to: emp.email,
                          subject: `המשרה שלך "${job.title}" אושרה!`,
                          html: `
                            <div dir="rtl" style="font-family: Arial, sans-serif;">
                                <h2>שלום ${emp.displayName || (emp as any).employerProfile?.companyName || 'מעסיק יקר'},</h2>
                                <p>אנו שמחים לעדכן אותך שהמשרה <strong>"${job.title}"</strong> אושרה על ידי צוות האתר והיא כעת מפורסמת וזמינה למועמדים.</p>
                                <p>בהצלחה בגיוס!</p>
                                <p>בברכה,<br>צוות האתר</p>
                            </div>
                          `
                      });
                  } catch (e) {
                      console.error("Failed to queue approval email:", e);
                  }
              }
          }

          toast(`סטטוס משרה שונה ל-${status}`, 'success');
      } catch (error) {
          console.error("Error updating status:", error);
          toast('שגיאה בעדכון הסטטוס', 'error');
      }
  };

  const columns = [
    { 
      key: 'title', 
      header: 'משרה וסטטוס',
      render: (j: Job) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 leading-tight">
            {j.title}
            {(j as any).hasPendingUpdate && (
              <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                ממתין לעדכון ממעסיק
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{j.companyName} | {j.location} | {j.type}</span>
        </div>
      )
    },
    {
      key: 'employer',
      header: 'מעסיק מפרסם',
      render: (j: Job) => {
        const emp = employers.find(e => (e as any).id === j.employerId || e.uid === j.employerId);
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-xs">{emp ? emp.displayName : 'לא ידוע'}</span>
            <span className="text-[10px] text-slate-400 font-mono">{emp ? emp.email : j.employerId}</span>
          </div>
        );
      }
    },
    { 
      key: 'status', 
      header: 'סטטוס',
      render: (j: Job) => {
        const variants: any = {
          [JobStatus.ACTIVE]: 'success',
          'Published': 'success',
          [JobStatus.PENDING_REVIEW]: 'warning',
          [JobStatus.CLOSED]: 'default',
          [JobStatus.EXPIRED]: 'default',
          [JobStatus.REJECTED]: 'error',
          'Draft': 'default',
          'Archived': 'default'
        };
        const labels: any = {
          [JobStatus.ACTIVE]: 'פעילה',
          'Published': 'פעילה',
          [JobStatus.PENDING_REVIEW]: 'בבחינה',
          [JobStatus.CLOSED]: 'סגורה',
          [JobStatus.EXPIRED]: 'פג תוקף',
          [JobStatus.REJECTED]: 'נדחתה',
          'Draft': 'טיוטה',
          'Archived': 'בארכיון'
        };
        return (
          <Badge variant={variants[j.status] || 'default'} className="font-bold text-[10px]">
            {labels[j.status] || j.status}
          </Badge>
        );
      }
    },
    {
      key: 'schedule',
      header: 'תזמון פרסום',
      render: (j: Job) => {
        const publishValue = j.scheduledPublishAt || j.scheduledPublishDate;
        const archiveValue = j.scheduledArchiveAt || j.scheduledRemovalDate;
        
        return (
          <div className="flex flex-col text-[10px]">
            <span className={cn("font-mono", publishValue ? "text-slate-600" : "text-slate-400")}>
              מ: {publishValue ? new Date(publishValue).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : 'מיידי'}
            </span>
            <span className={cn("font-mono", archiveValue ? "text-slate-600" : "text-slate-400")}>
               עד: {archiveValue ? new Date(archiveValue).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }) : 'ללא הגבלה'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'promotion',
      header: 'קידום',
      render: (j: Job) => {
        if (!j.promotionLevel || j.promotionLevel === PromotionLevel.REGULAR) return <span className="text-slate-300">-</span>;
        return (
          <div className="flex items-center gap-1">
            {j.promotionLevel === PromotionLevel.BOOSTED && <Zap size={14} className="text-amber-500" />}
            {j.promotionLevel === PromotionLevel.TOP && <Diamond size={14} className="text-indigo-500" />}
            <span className={cn(
              "text-[10px] font-black uppercase tracking-tighter",
              j.promotionLevel === PromotionLevel.BOOSTED ? "text-amber-600" : "text-indigo-600"
            )}>
              {j.promotionLevel}
            </span>
          </div>
        );
      }
    },
    {
      key: 'applicants',
      header: 'מועמדים',
      render: (j: Job) => (
        <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-600">
          <span className="text-indigo-600">{j.applicationsCount || 0}</span>
          <span className="text-slate-300">/</span>
          <span>{j.viewsCount || 0}</span>
        </div>
      )
    },
    { 
      key: 'createdAt', 
      header: 'פורסם ב-',
      render: (j: Job) => <span className="text-xs text-slate-400 font-mono">{j.createdAt ? new Date(j.createdAt).toLocaleDateString('he-IL') : '-'}</span>
    }
  ];

  return (
    <>
      <AdminTable 
        title={isCasual ? "ניהול עבודות מזדמנות" : "ניהול עבודות לטווח ארוך"}
        description={statusParam === 'Pending' ? "משרות הממתינות לאישור הנהלה." : "פיקוח על משרות, אישור משרות חדשות וניהול קידומים."}
        data={filteredJobs}
        columns={columns}
        searchFields={['title', 'companyName']}
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={handleEditOpen}
        onClone={handleClone}
        onDelete={handleDelete}
        onView={(j) => navigate('/admin/' + (isCasual ? 'jobs-casual/' : 'jobs/') + (j as any).id)}
        onStatusChange={handleStatusChange}
        onApproveUpdate={handleApproveUpdate}
        filters={[
          { 
            key: 'status', 
            label: 'סטטוס', 
            options: Object.values(JobStatus).map(s => ({ label: s, value: s }))
          }
        ]}
      />

      {jobToDelete && (
        <TwoStepConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="מחיקת משרה"
          message={`האם אתה בטוח שברצונך להסיר את המשרה "${jobToDelete.title}"? המשרה תוסר מהלוח אך תישמר בארכיון.`}
          confirmWord="מחק"
        />
      )}

      <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="הוספת משרה חדשה"
      >
          <form onSubmit={handleAdd} className="space-y-6">
              <div>
                  <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-slate-700">שיוך למעסיק</label>
                      <button 
                          type="button" 
                          onClick={() => setIsAddEmployerModalOpen(true)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                          <Plus size={14} />
                          הקם מעסיק/חברה חדשים
                      </button>
                  </div>
                  <Select 
                      options={employerOptions}
                      value={employerOptions.find(o => o.value === newJob.employerId) || null}
                      onChange={(selected) => {
                          setNewJob(prev => ({...prev, employerId: selected?.value || ''}));
                          // Optional: Auto-fill company name if we selected a known employer
                          const selectedEmp = employers.find(e => ((e as any).id || e.uid) === selected?.value);
                          if (selectedEmp && selectedEmp.companyName) {
                              setNewJob(prev => ({...prev, companyName: selectedEmp.companyName || ''}));
                          }
                      }}
                      placeholder="חפש לפי שם, חברה או טלפון..."
                      isClearable
                      styles={{
                          control: (base) => ({
                              ...base,
                              borderRadius: '0.75rem',
                              border: 'none',
                              backgroundColor: '#f8fafc',
                              padding: '0.25rem',
                              boxShadow: 'none',
                              '&:hover': {
                                  border: 'none',
                              }
                          })
                      }}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">כותרת משרה</label>
                  <Input 
                      required
                      placeholder="למשל: מפתח Full Stack..." 
                      value={newJob.title}
                      onChange={(e) => setNewJob(prev => ({...prev, title: e.target.value}))}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">תיאור משרה / דרישות</label>
                  <textarea 
                      required
                      placeholder="תיאור התפקיד, דרישות החובה והיתרון..." 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                      value={newJob.description || ''}
                      onChange={(e) => setNewJob(prev => ({...prev, description: e.target.value}))}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">שם חברה</label>
                  <Input 
                      required
                      placeholder="למשל: Tech Corp" 
                      value={newJob.companyName}
                      onChange={(e) => setNewJob(prev => ({...prev, companyName: e.target.value}))}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">תיאור חברה (אופציונלי)</label>
                  <textarea 
                      placeholder="קצת על החברה..." 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                      value={newJob.companyDescription || ''}
                      onChange={(e) => setNewJob(prev => ({...prev, companyDescription: e.target.value}))}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">תחום / קטגוריה</label>
                  <div className="flex gap-2">
                      <select
                          className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={newJob.category}
                          onChange={(e) => setNewJob(prev => ({...prev, category: e.target.value}))}
                      >
                          <option value="">בחר קטגוריה (אופציונלי)...</option>
                          {fetchedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                          {newJob.category && !fetchedCategories.includes(newJob.category) && <option value={newJob.category}>{newJob.category} (מותאם אישית)</option>}
                      </select>
                      <Input 
                          className="flex-1"
                          placeholder="או הקלד ערך חדש..." 
                          value={newJob.category}
                          onChange={(e) => setNewJob(prev => ({...prev, category: e.target.value}))}
                      />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">תגיות (מופרדות בפסיק)</label>
                  <div className="flex flex-col gap-2">
                      <select
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          value=""
                          onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const currentTags = newJob.tags ? newJob.tags.split(',').map(t=>t.trim()) : [];
                              if (!currentTags.includes(val)) setNewJob(prev => ({...prev, tags: [...currentTags, val].join(', ')}));
                          }}
                      >
                          <option value="">בחר מיומנות / תגית...</option>
                          {fetchedTags.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <Input 
                          placeholder="ערוך חופשי (למשל: React, Node.js)"
                          value={newJob.tags}
                          onChange={(e) => setNewJob(prev => ({...prev, tags: e.target.value}))}
                      />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">שכר (אופציונלי)</label>
                  <div className="flex items-center gap-2">
                      <Input
                          type="number"
                          placeholder="מ..."
                          value={(newJob.salary && typeof newJob.salary === 'string' ? newJob.salary.split('-')[0]?.replace(/\D/g, '') : '') || ''}
                          onChange={(e) => {
                              const max = (newJob.salary && typeof newJob.salary === 'string' ? newJob.salary.split('-')[1] || '' : '');
                              const typeMatch = (newJob.salary && typeof newJob.salary === 'string') ? newJob.salary.match(/(שעתית|חודשית|גלובלית)/) : null;
                              const type = typeMatch ? typeMatch[0] : '';
                              setNewJob(prev => ({...prev, salary: `${e.target.value}-${max ? max.replace(/\D/g, '') : ''} ${type}`.trim()}));
                          }}
                      />
                      <span className="text-slate-400">-</span>
                      <Input
                          type="number"
                          placeholder="עד..."
                          value={(newJob.salary && typeof newJob.salary === 'string' ? newJob.salary.split('-')[1]?.replace(/\D/g, '') : '') || ''}
                          onChange={(e) => {
                              const min = (newJob.salary && typeof newJob.salary === 'string' ? newJob.salary.split('-')[0]?.replace(/\D/g, '') : '') || '';
                              const typeMatch = (newJob.salary && typeof newJob.salary === 'string') ? newJob.salary.match(/(שעתית|חודשית|גלובלית)/) : null;
                              const type = typeMatch ? typeMatch[0] : '';
                              setNewJob(prev => ({...prev, salary: `${min}-${e.target.value} ${type}`.trim()}));
                          }}
                      />
                      <select 
                          className="h-11 px-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal/50 bg-white"
                          value={((newJob.salary && typeof newJob.salary === 'string') ? newJob.salary.match(/(שעתית|חודשית|גלובלית)/)?.[0] : '') || ''}
                          onChange={(e) => {
                              const min = (newJob.salary && typeof newJob.salary === 'string' ? newJob.salary.split('-')[0]?.replace(/\D/g, '') : '') || '';
                              const max = (newJob.salary && typeof newJob.salary === 'string' ? newJob.salary.split('-')[1]?.replace(/\D/g, '') : '') || '';
                              setNewJob(prev => ({...prev, salary: `${min}-${max} ${e.target.value}`.trim()}));
                          }}
                      >
                          <option value="">סוג...</option>
                          <option value="שעתית">שעתית</option>
                          <option value="חודשית">חודשית</option>
                          <option value="גלובלית">גלובלית</option>
                      </select>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">מיקום</label>
                  <Input 
                      placeholder="לדוגמה: יגאל אלון 98 תל אביב" 
                      value={newJob.location}
                      onChange={(e) => setNewJob(prev => ({...prev, location: e.target.value}))}
                  />
                   <p className="text-xs text-slate-400 mt-1.5 font-medium">
                      נא להזין בשפה חופשית ללא סימני פיסוק (לדוגמה: תל אביב יפו)
                   </p>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">מודל עבודה</label>
                  <select 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      value={newJob.workMode}
                      onChange={(e) => setNewJob(prev => ({...prev, workMode: e.target.value as WorkMode}))}
                  >
                      {Object.values(WorkMode).map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
              </div>
              <div className="flex gap-6 items-center bg-slate-50 p-4 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={newJob.isImmediate} onChange={e => setNewJob(prev => ({...prev, isImmediate: e.target.checked}))} />
                      <span className="text-sm font-bold text-slate-700">מיידי</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={newJob.isUrgent} onChange={e => setNewJob(prev => ({...prev, isUrgent: e.target.checked}))} />
                      <span className="text-sm font-bold text-slate-700">דחוף</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={newJob.requireCV} onChange={e => setNewJob(prev => ({...prev, requireCV: e.target.checked}))} />
                      <span className="text-sm font-bold text-slate-700">דורש קורות חיים</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={newJob.isCasual} onChange={e => setNewJob(prev => ({...prev, isCasual: e.target.checked}))} />
                      <span className="text-sm font-bold text-slate-700">עבודה מזדמנת</span>
                  </label>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">רמת תעדוף (Promotion Level)</label>
                  <select 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      value={newJob.promotionLevel}
                      onChange={(e) => setNewJob(prev => ({...prev, promotionLevel: e.target.value as PromotionLevel}))}
                  >
                      {Object.values(PromotionLevel).map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">רמת ניסיון</label>
                  <select 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      value={newJob.experienceLevel}
                      onChange={(e) => setNewJob(prev => ({...prev, experienceLevel: e.target.value as ExperienceLevel}))}
                  >
                      {Object.values(ExperienceLevel).map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">סוג משרה</label>
                  <select 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      value={newJob.type}
                      onChange={(e) => setNewJob(prev => ({...prev, type: e.target.value as JobType}))}
                  >
                      {Object.values(JobType).map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">סטטוס</label>
                  <select 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      value={newJob.status}
                      onChange={(e) => setNewJob(prev => ({...prev, status: e.target.value as JobStatus}))}
                  >
                      {Object.values(JobStatus).map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">תאריך פרסום מתוזמן (אופציונלי)</label>
                  <Input 
                      type="datetime-local"
                      value={newJob.scheduledPublishDate}
                      onChange={(e) => setNewJob(prev => ({...prev, scheduledPublishDate: e.target.value}))}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">תאריך הסרה מתוזמן (אופציונלי)</label>
                  <Input 
                      type="datetime-local"
                      value={newJob.scheduledRemovalDate}
                      onChange={(e) => setNewJob(prev => ({...prev, scheduledRemovalDate: e.target.value}))}
                  />
              </div>
              <div className="flex justify-end gap-3 pt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>ביטול</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור משרה</Button>
              </div>
          </form>
      </Modal>
      <Modal
          isOpen={isAddEmployerModalOpen}
          onClose={() => setIsAddEmployerModalOpen(false)}
          title="הקמת מעסיק / חברה"
      >
          <form onSubmit={handleAddEmployer} className="space-y-4">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">שם איש הקשר / מעסיק</label>
                  <Input 
                      required
                      placeholder="למשל: יוני ישראלי" 
                      value={newEmployer.fullName}
                      onChange={(e) => setNewEmployer(prev => ({...prev, fullName: e.target.value}))}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">שם חברה</label>
                  <Input 
                      required
                      placeholder="למשל: Tech Corp" 
                      value={newEmployer.companyName}
                      onChange={(e) => setNewEmployer(prev => ({...prev, companyName: e.target.value}))}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">טלפון נציג / חברה (לזיהוי עתידי)</label>
                  <Input 
                      placeholder="למשל: 050-1234567" 
                      value={newEmployer.phone}
                      onChange={(e) => setNewEmployer(prev => ({...prev, phone: e.target.value}))}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">דוא"ל (אופציונלי אך מומלץ)</label>
                  <Input 
                      type="email"
                      placeholder="למשל: yoni@techcorp.com" 
                      value={newEmployer.email}
                      onChange={(e) => setNewEmployer(prev => ({...prev, email: e.target.value}))}
                  />
              </div>
              <div className="flex justify-end gap-3 pt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsAddEmployerModalOpen(false)}>ביטול</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">הקם פרופיל מעסיק</Button>
              </div>
          </form>
      </Modal>

      <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="עריכת משרה"
      >
          {jobToEdit && (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">כותרת משרה</label>
                      <Input 
                          required
                          value={jobToEdit.title}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, title: e.target.value })}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">תיאור משרה / דרישות</label>
                      <textarea 
                          required
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                          value={jobToEdit.description || ''}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, description: e.target.value })}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">שם חברה</label>
                      <Input 
                          required
                          value={jobToEdit.companyName}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, companyName: e.target.value })}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">תיאור חברה (אופציונלי)</label>
                      <textarea 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                          value={jobToEdit.companyDescription || ''}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, companyDescription: e.target.value })}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">תחום / קטגוריה</label>
                      <div className="flex gap-2">
                          <select
                              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={jobToEdit.category || ''}
                              onChange={(e) => setJobToEdit({ ...jobToEdit, category: e.target.value })}
                          >
                              <option value="">בחר קטגוריה (אופציונלי)...</option>
                              {fetchedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                              {jobToEdit.category && !fetchedCategories.includes(jobToEdit.category) && <option value={jobToEdit.category}>{jobToEdit.category} (מותאם אישית)</option>}
                          </select>
                          <Input 
                              className="flex-1"
                              placeholder="או הקלד קטגוריה חדשה..." 
                              value={jobToEdit.category || ''}
                              onChange={(e) => setJobToEdit({ ...jobToEdit, category: e.target.value })}
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">תגיות (מופרדות בפסיק)</label>
                      <div className="flex flex-col gap-2">
                          <select
                              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                              value=""
                              onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  let currentTags: string[] = [];
                                  if (typeof jobToEdit.tags === 'string') {
                                      currentTags = (jobToEdit.tags as string).split(',').map(t=>t.trim()).filter(Boolean);
                                  } else if (Array.isArray(jobToEdit.tags)) {
                                      currentTags = jobToEdit.tags;
                                  }
                                  if (!currentTags.includes(val)) {
                                      setJobToEdit({ ...jobToEdit, tags: [...currentTags, val] as any });
                                  }
                              }}
                          >
                              <option value="">בחר מיומנות / תגית...</option>
                              {fetchedTags.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <Input 
                              placeholder="ערוך חופשי (למשל: React, Node.js)"
                              value={typeof jobToEdit.tags === 'string' ? jobToEdit.tags : (jobToEdit.tags?.join(', ') || '')}
                              onChange={(e) => setJobToEdit({ ...jobToEdit, tags: e.target.value as any })}
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">שכר (אופציונלי)</label>
                      <div className="flex items-center gap-2">
                          <Input
                              type="number"
                              placeholder="מ..."
                              value={(jobToEdit.salary && typeof jobToEdit.salary === 'string' ? jobToEdit.salary.split('-')[0]?.replace(/\D/g, '') : '') || ''}
                              onChange={(e) => {
                                  const max = (jobToEdit.salary && typeof jobToEdit.salary === 'string' ? jobToEdit.salary.split('-')[1] || '' : '');
                                  const typeMatch = (jobToEdit.salary && typeof jobToEdit.salary === 'string') ? jobToEdit.salary.match(/(שעתית|חודשית|גלובלית)/) : null;
                                  const type = typeMatch ? typeMatch[0] : '';
                                  setJobToEdit({ ...jobToEdit, salary: `${e.target.value}-${max ? max.replace(/\D/g, '') : ''} ${type}`.trim() });
                              }}
                          />
                          <span className="text-slate-400">-</span>
                          <Input
                              type="number"
                              placeholder="עד..."
                              value={(jobToEdit.salary && typeof jobToEdit.salary === 'string' ? jobToEdit.salary.split('-')[1]?.replace(/\D/g, '') : '') || ''}
                              onChange={(e) => {
                                  const min = (jobToEdit.salary && typeof jobToEdit.salary === 'string' ? jobToEdit.salary.split('-')[0]?.replace(/\D/g, '') : '') || '';
                                  const typeMatch = (jobToEdit.salary && typeof jobToEdit.salary === 'string') ? jobToEdit.salary.match(/(שעתית|חודשית|גלובלית)/) : null;
                                  const type = typeMatch ? typeMatch[0] : '';
                                  setJobToEdit({ ...jobToEdit, salary: `${min}-${e.target.value} ${type}`.trim() });
                              }}
                          />
                          <select 
                              className="h-11 px-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-teal/50 bg-white"
                              value={((jobToEdit.salary && typeof jobToEdit.salary === 'string') ? jobToEdit.salary.match(/(שעתית|חודשית|גלובלית)/)?.[0] : '') || ''}
                              onChange={(e) => {
                                  const min = (jobToEdit.salary && typeof jobToEdit.salary === 'string' ? jobToEdit.salary.split('-')[0]?.replace(/\D/g, '') : '') || '';
                                  const max = (jobToEdit.salary && typeof jobToEdit.salary === 'string' ? jobToEdit.salary.split('-')[1]?.replace(/\D/g, '') : '') || '';
                                  setJobToEdit({ ...jobToEdit, salary: `${min}-${max} ${e.target.value}`.trim() });
                              }}
                          >
                              <option value="">סוג...</option>
                              <option value="שעתית">שעתית</option>
                              <option value="חודשית">חודשית</option>
                              <option value="גלובלית">גלובלית</option>
                          </select>
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">מיקום</label>
                      <Input 
                          placeholder="לדוגמה: יגאל אלון 98 תל אביב"
                          value={jobToEdit.location || ''}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, location: e.target.value } as any)}
                      />
                       <p className="text-xs text-slate-400 mt-1.5 font-medium">
                          נא להזין בשפה חופשית ללא סימני פיסוק (לדוגמה: תל אביב יפו)
                       </p>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">מודל עבודה</label>
                      <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                          value={jobToEdit.workMode || WorkMode.HYBRID}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, workMode: e.target.value as WorkMode })}
                      >
                          {Object.values(WorkMode).map(s => (
                              <option key={s} value={s}>{s}</option>
                          ))}
                      </select>
                  </div>
                  <div className="flex gap-6 items-center bg-slate-50 p-4 rounded-xl">
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={jobToEdit.isImmediate || false} onChange={e => setJobToEdit({ ...jobToEdit, isImmediate: e.target.checked })} />
                          <span className="text-sm font-bold text-slate-700">מיידי</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={jobToEdit.isUrgent || false} onChange={e => setJobToEdit({ ...jobToEdit, isUrgent: e.target.checked })} />
                          <span className="text-sm font-bold text-slate-700">דחוף</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={jobToEdit.requireCV ?? true} onChange={e => setJobToEdit({ ...jobToEdit, requireCV: e.target.checked })} />
                          <span className="text-sm font-bold text-slate-700">דורש קורות חיים</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={jobToEdit.isCasual || false} onChange={e => setJobToEdit({ ...jobToEdit, isCasual: e.target.checked })} />
                          <span className="text-sm font-bold text-slate-700">עבודה מזדמנת</span>
                      </label>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">רמת תעדוף (Promotion Level)</label>
                      <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                          value={jobToEdit.promotionLevel || PromotionLevel.REGULAR}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, promotionLevel: e.target.value as PromotionLevel })}
                      >
                          {Object.values(PromotionLevel).map(s => (
                              <option key={s} value={s}>{s}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">רמת ניסיון</label>
                      <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                          value={jobToEdit.experienceLevel || ExperienceLevel.MIDDLE}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, experienceLevel: e.target.value as ExperienceLevel })}
                      >
                          {Object.values(ExperienceLevel).map(s => (
                              <option key={s} value={s}>{s}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">סוג משרה</label>
                      <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                          value={jobToEdit.type || JobType.FULL_TIME}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, type: e.target.value as JobType })}
                      >
                          {Object.values(JobType).map(s => (
                              <option key={s} value={s}>{s}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">סטטוס</label>
                      <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                          value={jobToEdit.status}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, status: e.target.value as JobStatus })}
                      >
                          {Object.values(JobStatus).map(s => (
                              <option key={s} value={s}>{s}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">תאריך פרסום מתוזמן (אופציונלי)</label>
                      <Input 
                          type="datetime-local"
                          value={jobToEdit.scheduledPublishDate || ''}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, scheduledPublishDate: e.target.value })}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">תאריך הסרה מתוזמן (אופציונלי)</label>
                      <Input 
                          type="datetime-local"
                          value={jobToEdit.scheduledRemovalDate || ''}
                          onChange={(e) => setJobToEdit({ ...jobToEdit, scheduledRemovalDate: e.target.value })}
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
