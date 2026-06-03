import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection, increment, runTransaction, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../context/ToastContext';
import { Job, JobType, JobStatus, UserRole, WorkMode, ExperienceLevel, PromotionLevel } from '../types';
import { Briefcase, MapPin, DollarSign, Type, AlignLeft, Info, Clock, Tag, Rocket, Zap, Home, Award, Sparkles, Star, Lightbulb, X, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../lib/analytics';

import { predefinedTagsByCategory, getAllPredefinedTags } from '../lib/predefinedTags';

const JobPost: React.FC = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Job>>({
        title: '',
        companyName: user?.companyName || user?.fullName || '',
        location: '',
        type: JobType.FULL_TIME,
        workMode: WorkMode.OFFICE,
        experienceLevel: ExperienceLevel.NO_EXPERIENCE,
        category: '',
        salary: '',
        description: '',
        tags: [],
        isImmediate: false,
        isUrgent: false,
        requireCV: false,
        promotionLevel: PromotionLevel.REGULAR,
    });
  const [tagInput, setTagInput] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [globalLocations, setGlobalLocations] = useState<string[]>([]);
  const [enableCVUploads, setEnableCVUploads] = useState(true);
  const [employers, setEmployers] = useState<{ id: string, name: string, company: string }[]>([]);

  useEffect(() => {
    const fetchEmployers = async () => {
      if (user?.role === UserRole.ADMIN) {
        try {
          const q = query(collection(db, 'users'), where('role', 'in', [UserRole.EMPLOYER, UserRole.ADMIN]));
          const snap = await getDocs(q);
          const emps = snap.docs.map(d => ({
            id: d.id,
            name: d.data().fullName || d.data().displayName || 'ללא שם',
            company: d.data().companyName || 'ללא חברה'
          }));
          setEmployers(emps);
        } catch(error) { console.error("Failed to fetch employers", error); }
      }
    };
    fetchEmployers();
  }, [user]);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'tags'));
        if (snap.exists()) {
           const data = snap.data();
           setGlobalCategories(data.categories || []);
           setGlobalTags(data.jobTags || []);
           setGlobalLocations(data.locations || []);
        }

        const sysSnap = await getDoc(doc(db, 'settings', 'system'));
        if (sysSnap.exists()) {
            setEnableCVUploads(sysSnap.data().enableCVUploads !== false);
        }
      } catch(error) { console.error("Failed to fetch settings/tags", error); }
    };
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const fetchJob = async () => {
        const jobDoc = await getDoc(doc(db, 'jobs', id));
        if (jobDoc.exists()) {
          const jobData = jobDoc.data() as Job;
          if (jobData.employerId !== user?.uid && user?.role !== UserRole.ADMIN) {
            navigate('/');
            return;
          }
          setFormData(jobData);
        }
      };
      fetchJob();
    }
  }, [id, isEditing, user, navigate]);

  useEffect(() => {
    // Generate improvements recommendations based on form data
    const recs = [];
    if (formData.title && formData.title.length < 5) recs.push('כותרת המשרה קצרה מדי. מומלץ להוסיף פרטים מושכים.');
    if (formData.description && formData.description.length < 100) recs.push('תיאור המשרה קצר מדי. מועמדים מעדיפים פירוט על התפקיד והחברה.');
    if (!formData.tags || formData.tags.length < 3) recs.push('מומלץ להוסיף לפחות 3 מיומנויות (Skills) כדי לשפר את תוצאות החיפוש.');
    if (!formData.salary) recs.push('מידע על שכר מעלה את כמות הפניות ב-40%. מומלץ לציין לפחות טווח.');
    setRecommendations(recs);
  }, [formData.title, formData.description, formData.tags, formData.salary]);

  useEffect(() => {
    const handleFillForm = (e: any) => {
        const data = e.detail;
        setFormData(prev => ({
            ...prev,
            ...(data.title && { title: data.title }),
            ...(data.description && { description: data.description }),
            ...(data.tags && { tags: [...new Set([...(prev.tags || []), ...data.tags])] }),
            ...(data.category && { category: data.category })
        }));
        toast('ה-AI אכלס את השדות עבורך!', 'success');
    };
    window.addEventListener('fill-job-form', handleFillForm as EventListener);
    return () => window.removeEventListener('fill-job-form', handleFillForm as EventListener);
  }, [toast]);

  const getPromotionCost = (level: PromotionLevel) => {
    switch (level) {
        case PromotionLevel.REGULAR: return 1;
        case PromotionLevel.HIGHLIGHTED: return 2;
        case PromotionLevel.HOT: return 3;
        case PromotionLevel.URGENT: return 3;
        default: return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;
    setLoading(true);

    // Deep validation
    if (!formData.title || formData.title.length < 3) {
      toast('כותרת המשרה חייבת להכיל לפחות 3 תווים', 'error');
      setLoading(false);
      return;
    }
    if (!formData.companyName || formData.companyName.length < 2) {
      toast('שם החברה חייב להכיל לפחות 2 תווים', 'error');
      setLoading(false);
      return;
    }
    if (!formData.description || formData.description.length < 20) {
      toast('תיאור המשרה קצר מדי. אנא פירוט רחב יותר (לפחות 20 תווים)', 'error');
      setLoading(false);
      return;
    }
    if (!formData.location) {
      toast('אנא ציין מיקום למשרה', 'error');
      setLoading(false);
      return;
    }
    if (!formData.category) {
      toast('אנא בחר קטגוריה למשרה', 'error');
      setLoading(false);
      return;
    }

    const cost = 5; // 5 credits = 1 job post
    
    // Admin doesn't pay credits. If editing, we don't charge again (simplification).
    if (user.role !== UserRole.ADMIN && !isEditing) {
        const userCredits = user.credits || 0;
        if (userCredits < cost) {
            toast('אין לך מספיק קרדיטים לפרסום משרה זו', 'error');
            setLoading(false);
            return;
        }
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();
      if (isEditing) {
        // Prevent overwriting dynamic fields that might have changed while editing (race condition)
        const { id: _, views, applicationsCount, createdAt, employerId, ownerId, tags: rawTags, pendingTags: _pTags, hasPendingTags: _hPTags, ...editableFields } = formData as Record<string, any>;
        
        const knownTags = new Set([...globalTags, ...globalCategories]);
        const isTagApproved = (t: string) => knownTags.has(t);
        const isAdmin = user.role === UserRole.ADMIN;
        const allTags = rawTags || [];

        const approvedTags = isAdmin ? allTags : allTags.filter(isTagApproved);
        const unapprovedTags = isAdmin ? [] : allTags.filter((t: string) => !isTagApproved(t));

        await updateDoc(doc(db, 'jobs', id), {
          ...editableFields,
           tags: approvedTags,
           pendingTags: unapprovedTags,
           hasPendingTags: unapprovedTags.length > 0,
          updatedAt: now,
        });
        toast('המשרה עודכנה בהצלחה!', 'success');
      } else {
        const newJobRef = doc(collection(db, 'jobs'));
        const txRef = doc(collection(db, 'credit_transactions'));
        const userRef = doc(db, 'users', user.uid);

        const selectedEmp = employers.find(e => e.id === formData.ownerId);
        const ownerToSet = formData.ownerId || user.uid;
        const nameToSet = selectedEmp ? selectedEmp.name : (user.displayName || user.fullName || '');
        const compToSet = selectedEmp ? selectedEmp.company : (user.companyName || user.companyDescription || user.bio || '');

        const knownTags = new Set([...globalTags, ...globalCategories]);
        const isTagApproved = (t: string) => knownTags.has(t);
        const isAdmin = user.role === UserRole.ADMIN;
        const allTags = formData.tags || [];

        const newJob: Job = {
          id: newJobRef.id,
          employerId: ownerToSet, // deprecated
          ownerId: ownerToSet,
          employerName: nameToSet,
          title: formData.title || '',
          companyName: formData.companyName || compToSet || '',
          companyDescription: formData.companyDescription || compToSet || '',
          location: formData.location || '',
          type: (formData.type as JobType) || JobType.FULL_TIME,
          workMode: (formData.workMode as WorkMode) || WorkMode.OFFICE,
          experienceLevel: (formData.experienceLevel as ExperienceLevel) || ExperienceLevel.NO_EXPERIENCE,
          category: formData.category || '',
          salary: formData.salary || '',
          description: formData.description || '',
          tags: isAdmin ? allTags : allTags.filter(isTagApproved),
          pendingTags: isAdmin ? [] : allTags.filter(t => !isTagApproved(t)),
          hasPendingTags: isAdmin ? false : allTags.some(t => !isTagApproved(t)),
          status: formData.status || (isAdmin ? 'Published' : JobStatus.PENDING_REVIEW),
          isCasual: formData.isCasual || false,
          isImmediate: formData.isImmediate || false,
          isUrgent: formData.isUrgent || false,
          requireCV: formData.requireCV !== false,
          promotionLevel: formData.promotionLevel || PromotionLevel.REGULAR,
          isVerified: false,
          views: 0,
          createdAt: now,
          updatedAt: now,
        };

        if (user.role !== UserRole.ADMIN) {
            let eliavAdminId = '';
            // Try to find Eliav as fallback
            const adminQuery = query(collection(db, 'users'), where('role', '==', UserRole.ADMIN));
            const admins = await getDocs(adminQuery);
            const eliavUser = admins.docs.find(d => d.data().fullName?.includes('אליאב') || d.data().displayName?.includes('אליאב') || d.data().email?.includes('eliav'));
            eliavAdminId = eliavUser ? eliavUser.id : (admins.docs[0]?.id || '');
            const finalAssigneeId = user.assignedAdminId || eliavAdminId;

            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("משתמש לא נמצא בהליך גבייה");
                }
                const currentCredits = userDoc.data().credits || 0;
                if (currentCredits < cost) {
                    throw new Error("אין לך מספיק קרדיטים לפרסום משרה זו");
                }

                transaction.update(userRef, {
                    credits: increment(-cost)
                });
                
                transaction.set(newJobRef, newJob);

                transaction.set(txRef, {
                    id: txRef.id,
                    employerId: user.uid,
                    amount: cost,
                    type: 'USAGE',
                    createdAt: now,
                    jobId: newJob.id
                });

                // Create a Report/Task for the Admin
                if (newJob.status === JobStatus.PENDING_REVIEW) {
                    const taskRef = doc(collection(db, 'reports'));
                    const pName = eliavUser && finalAssigneeId === eliavUser.id ? (eliavUser.data().displayName || eliavUser.data().fullName) : undefined;
                    transaction.set(taskRef, {
                        id: taskRef.id,
                        title: `אישור משרה: ${newJob.title}`,
                        description: `משרה חדשה מאת מעסיק: ${newJob.companyName}. אנא עבור עליה ואשר אותה במערכת.`,
                        priority: 'High',
                        isResolved: false,
                        assigneeId: finalAssigneeId,
                        assigneeName: pName || null,
                        createdAt: now,
                    });
                }
            });
        } else {
            await setDoc(newJobRef, newJob);
        }

        // Add category, tags, and location to global tags list (ONLY FOR ADMINS)
        if (user.role === UserRole.ADMIN) {
            try {
                const validCategory = newJob.category?.trim();
                const validTags = newJob.tags.filter(t => t && t.trim() !== '');
                const validLocation = newJob.location?.trim();
                
                const updateData: any = {};
                let shouldUpdate = false;

                if (validCategory) {
                   updateData.categories = arrayUnion(validCategory);
                   updateData.jobTags = arrayUnion(validCategory, ...validTags);
                   shouldUpdate = true;
                   if (validTags.length > 0) {
                       updateData[`tagsByCategory.${validCategory}`] = arrayUnion(...validTags);
                   }
                }
                if (validLocation) {
                    updateData.locations = arrayUnion(validLocation);
                    shouldUpdate = true;
                }

                if (shouldUpdate) {
                   await setDoc(doc(db, 'settings', 'tags'), updateData, { merge: true });
                }
            } catch (tagErr) {
                console.error("Failed to update global tags list", tagErr);
            }
        }

        // Track job posting
        trackEvent({
            type: 'post_job',
            metadata: {
                jobId: newJob.id,
                title: newJob.title,
                companyName: newJob.companyName,
                category: newJob.category,
                promotionLevel: newJob.promotionLevel
            }
        });

        toast(user.role === UserRole.ADMIN ? 'המשרה פורסמה בהצלחה!' : 'המשרה נשלחה לאישור המערכת.', 'success');
      }
      navigate(user.role === UserRole.ADMIN ? '/admin' : '/employer/dashboard');
    } catch (error: any) {
        if (error.message === "אין לך מספיק קרדיטים לפרסום משרה זו") {
            toast(error.message, 'error');
            // navigate('/pricing');
        } else {
            handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.WRITE, `jobs/${id || 'new'}`);
        }
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tag) });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4" dir="rtl">
      <Helmet>
        <title>{isEditing ? `עריכת משרה: ${formData.title}` : 'פרסום משרה חדשה | עובדים בצ\'יק'}</title>
        <meta name="description" content="פרסם משרה באתר עובדים בצ'יק וקבל מועמדים איכותיים תוך דקות. הממשק המהיר והחכם ביותר למעסיקים." />
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="rounded-[3rem] p-6 sm:p-8 md:p-10 relative overflow-hidden" hoverable={false}>
            {recommendations.length > 0 && !isEditing && (
                <div className="mb-10 bg-brand-orange/5 border border-brand-orange/20 rounded-[2rem] p-6">
                    <div className="flex items-center gap-3 mb-4 text-right justify-end">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">טיפים לשדרוג המשרה</h4>
                        <Lightbulb className="text-brand-orange" size={20} />
                    </div>
                    <ul className="space-y-2">
                        {recommendations.map((rec, i) => (
                            <li key={i} className="text-xs font-bold text-slate-600 flex items-center gap-2 justify-end">
                                {rec}
                                <div className="w-1.5 h-1.5 bg-brand-orange rounded-full" />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          <div className="mb-10 text-right">
            <div className="w-16 h-16 bg-brand-teal text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-teal-500/20 mr-auto ml-0 md:ml-auto md:mr-0">
              <Rocket size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">{isEditing ? 'עדכון פרטי משרה' : 'פרסום משרה חדשה בצ\'יק'}</h1>
            <p className="text-slate-500 font-bold">ספקו פרטים ברורים כדי שנוכל למצוא לכם את המועמדים הטובים ביותר</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 text-right font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Input
                  required
                  label="שם המשרה"
                  icon={<Briefcase size={18} />}
                  placeholder="לדוגמה: מפתח פרונטנד בכיר"
                  className="h-14 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-right font-bold text-slate-700 shadow-inner"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  helperText={
                      <button 
                        type="button"
                        onClick={() => {
                            const hasValue = !!formData.title?.trim();
                            const message = hasValue 
                              ? `היי, שמתי לב שיש לי פה את הכותרת \`${formData.title}\`. תוכל לעזור לי לשפר אותה כדי שתהיה מקצועית ומושכת יותר עבור משרה בתחום ${formData.category || 'כללי'}? תוכל בבקשה לעזור לי גם עם שאר השדות החסרים?`
                              : `היי, תוכל להציע לי טיפים וכותרות מושכות ומקצועיות למשרה בתחום ${formData.category || 'כללי'}? סגור אותי על נתונים חסרים שיעזרו לי לפרסם בצורה הטובה ביותר.`;
                            const event = new CustomEvent('open-ai-assistant', { detail: { message } });
                            window.dispatchEvent(event);
                        }}
                        className="text-[10px] font-black text-brand-teal hover:text-brand-dark flex items-center gap-1 transition-colors mt-2"
                      >
                        <Sparkles size={12} /> הצעה מה-AI
                      </button>
                  }
                />
              </div>
              <div className="space-y-2">
                <Input
                  required
                  label="שם החברה"
                  icon={<Type size={18} />}
                  placeholder="לדוגמה: טק-פלואו בע״מ"
                  className="h-14 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-right font-bold text-slate-700 shadow-inner"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2 relative">
                <Input
                  required
                  list="locations-list"
                  label="מיקום"
                  icon={<MapPin size={18} />}
                  placeholder="כתובת מדוייקת (לדוגמה: יגאל אלון 98, תל אביב)"
                  className="h-14 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-right font-bold text-slate-700 shadow-inner"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <datalist id="locations-list">
                    {globalLocations.map(loc => <option key={loc} value={loc} />)}
                </datalist>
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className={`grid grid-cols-1 ${enableCVUploads ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 h-full pt-6`}>
                    <Button
                        type="button"
                        variant={formData.isUrgent ? 'outline' : 'ghost'}
                        onClick={() => setFormData({ ...formData, isUrgent: !formData.isUrgent })}
                        className={cn(
                            "py-4 rounded-2xl border-2 font-black h-14 w-full",
                            formData.isUrgent ? "bg-red-50 border-red-500 text-red-600 shadow-lg shadow-red-500/10" : "bg-white border-slate-50 text-slate-400"
                        )}
                    >
                        דחוף 🔥
                    </Button>
                    <Button
                        type="button"
                        variant={formData.isImmediate ? 'outline' : 'ghost'}
                        onClick={() => setFormData({ ...formData, isImmediate: !formData.isImmediate })}
                        className={cn(
                            "py-4 rounded-2xl border-2 font-black h-14 w-full",
                            formData.isImmediate ? "bg-orange-50 border-brand-orange text-brand-orange shadow-lg shadow-orange-500/10" : "bg-white border-slate-50 text-slate-400"
                        )}
                    >
                        מיידי ⚡
                    </Button>
                    {enableCVUploads && (
                        <Button
                            type="button"
                            variant={formData.requireCV !== false ? 'outline' : 'ghost'}
                            onClick={() => setFormData({ ...formData, requireCV: formData.requireCV === false })}
                            className={cn(
                                "py-4 rounded-2xl border-2 font-black h-14 w-full",
                                formData.requireCV !== false ? "bg-teal-50 border-brand-teal text-brand-teal shadow-lg shadow-brand-teal/10" : "bg-white border-slate-50 text-slate-400"
                            )}
                        >
                            דרישת CV 📄
                        </Button>
                    )}
                </div>
              </div>
            </div>

            {/* Standalone Big Toggle for Casual vs Regular */}
            <div className="mb-4 space-y-4">
              <label className="text-sm font-black text-slate-700 flex items-center gap-2 pr-2">
                <Tag size={18} className="text-brand-teal" /> ייעוד המשרה בלוח הדרושים
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                    type="button"
                    variant={!formData.isCasual ? 'outline' : 'ghost'}
                    onClick={() => setFormData({ ...formData, isCasual: false })}
                    className={cn(
                        "py-6 rounded-3xl border-2 font-black h-auto flex flex-col gap-2 transition-all",
                        !formData.isCasual ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg shadow-indigo-500/10" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Briefcase size={28} className={!formData.isCasual ? "text-indigo-600" : "text-slate-400"} />
                    <span className="text-lg">משרה לטווח ארוך</span>
                    <span className="text-sm font-medium opacity-80 font-sans">קריירה, משרות קבועות ומקצועיות</span>
                </Button>
                <Button
                    type="button"
                    variant={formData.isCasual ? 'outline' : 'ghost'}
                    onClick={() => setFormData({ ...formData, isCasual: true })}
                    className={cn(
                        "py-6 rounded-3xl border-2 font-black h-auto flex flex-col gap-2 transition-all",
                        formData.isCasual ? "bg-purple-50 border-purple-500 text-purple-700 shadow-lg shadow-purple-500/10" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <div className="text-3xl">🍕</div>
                    <span className="text-lg">עבודה מזדמנת</span>
                    <span className="text-sm font-medium opacity-80 font-sans">עבודות זמניות, נוער, משמרות, ללא קורות חיים</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 flex items-center gap-2 pr-2">
                  <Clock size={18} className="text-brand-teal" /> סוג משרה
                </label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all text-right font-bold text-slate-700 shadow-inner appearance-none border-0"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as JobType })}
                >
                  <option value={JobType.FULL_TIME}>משרה מלאה</option>
                  <option value={JobType.PART_TIME}>משרה חלקית</option>
                  <option value={JobType.CONTRACT}>קבלן / פרויקט</option>
                  <option value={JobType.FREELANCE}>פרילאנס</option>
                  <option value={JobType.INTERNSHIP}>התמחות</option>
                  <option value={JobType.SHIFTS}>עבודת משמרות</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 flex items-center gap-2 pr-2">
                  <Home size={18} className="text-brand-teal" /> מודל עבודה
                </label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all text-right font-bold text-slate-700 shadow-inner appearance-none border-0"
                  value={formData.workMode}
                  onChange={(e) => setFormData({ ...formData, workMode: e.target.value as WorkMode })}
                >
                  <option value={WorkMode.OFFICE}>מהמשרד</option>
                  <option value={WorkMode.HYBRID}>היברידי</option>
                  <option value={WorkMode.REMOTE}>מהבית</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 flex items-center gap-2 pr-2">
                  <Award size={18} className="text-brand-teal" /> ניסיון נדרש
                </label>
                <select
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all text-right font-bold text-slate-700 shadow-inner appearance-none border-0"
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as ExperienceLevel })}
                >
                  <option value={ExperienceLevel.NO_EXPERIENCE}>ללא ניסיון</option>
                  <option value={ExperienceLevel.JUNIOR}>ג'וניור (1-2 שנים)</option>
                  <option value={ExperienceLevel.MIDDLE}>ניסיון בינוני (3-5 שנים)</option>
                  <option value={ExperienceLevel.SENIOR}>בכיר (5+ שנים)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">שכר מוצע</label>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        placeholder="מ..."
                        className="h-14 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-right font-bold text-slate-700 shadow-inner w-full"
                        value={(formData.salary && typeof formData.salary === 'string' ? formData.salary.split('-')[0]?.replace(/\D/g, '') : '') || ''}
                        onChange={(e) => {
                            const max = (formData.salary && typeof formData.salary === 'string' ? formData.salary.split('-')[1] || '' : '');
                            const typeMatch = (formData.salary && typeof formData.salary === 'string') ? formData.salary.match(/(שעתית|חודשית|גלובלית)/) : null;
                            const type = typeMatch ? typeMatch[0] : '';
                            setFormData({ ...formData, salary: `${e.target.value}-${max ? max.replace(/\D/g, '') : ''} ${type}`.trim() });
                        }}
                    />
                    <span className="text-slate-400">-</span>
                    <Input
                        type="number"
                        placeholder="עד..."
                        className="h-14 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-right font-bold text-slate-700 shadow-inner w-full"
                        value={(formData.salary && typeof formData.salary === 'string' ? formData.salary.split('-')[1]?.replace(/\D/g, '') : '') || ''}
                        onChange={(e) => {
                            const min = (formData.salary && typeof formData.salary === 'string' ? formData.salary.split('-')[0]?.replace(/\D/g, '') : '') || '';
                            const typeMatch = (formData.salary && typeof formData.salary === 'string') ? formData.salary.match(/(שעתית|חודשית|גלובלית)/) : null;
                            const type = typeMatch ? typeMatch[0] : '';
                            setFormData({ ...formData, salary: `${min}-${e.target.value} ${type}`.trim() });
                        }}
                    />
                    <select 
                        className="h-14 px-4 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-teal/10 bg-slate-50 font-bold text-slate-700"
                        value={((formData.salary && typeof formData.salary === 'string') ? formData.salary.match(/(שעתית|חודשית|גלובלית)/)?.[0] : '') || ''}
                        onChange={(e) => {
                            const min = (formData.salary && typeof formData.salary === 'string' ? formData.salary.split('-')[0]?.replace(/\D/g, '') : '') || '';
                            const max = (formData.salary && typeof formData.salary === 'string' ? formData.salary.split('-')[1]?.replace(/\D/g, '') : '') || '';
                            setFormData({ ...formData, salary: `${min}-${max} ${e.target.value}`.trim() });
                        }}
                    >
                        <option value="">סוג...</option>
                        <option value="שעתית">שעתית</option>
                        <option value="חודשית">חודשית</option>
                        <option value="גלובלית">גלובלית</option>
                    </select>
                </div>
              </div>
              <div className="space-y-2 relative">
                <label className="block text-sm font-bold text-slate-700">קטגוריה</label>
                <div className="flex flex-col md:flex-row gap-2">
                    <select
                        className="flex-1 h-14 px-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none font-bold text-slate-700 shadow-inner"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                    >
                        <option value="">בחר קטגוריה...</option>
                        {Array.from(new Set([...Object.keys(predefinedTagsByCategory), ...globalCategories])).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        {formData.category && !Array.from(new Set([...Object.keys(predefinedTagsByCategory), ...globalCategories])).includes(formData.category) && (
                            <option value={formData.category}>{formData.category} (מותאם אישית)</option>
                        )}
                    </select>
                    <Input 
                      placeholder="או הקלד קטגוריה חדשה..."
                      className="flex-1 h-14 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none font-bold text-slate-700 shadow-inner w-full"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700 flex items-center justify-between pr-2">
                <div className="flex items-center gap-2">
                  <Tag size={18} className="text-brand-teal" /> מיומנויות (Skills)
                </div>
                <button 
                  type="button"
                  onClick={() => {
                      const hasTitle = !!formData.title?.trim();
                      const message = hasTitle 
                        ? `היי, מדובר במשרה: "${formData.title}". ${formData.tags && formData.tags.length > 0 ? `כבר הוספתי מיומנויות: ${formData.tags.join(', ')}. תוכל להציע לי עוד מיומנויות חשובות שמתאימות?` : 'תוכל להציע לי רשימת תגיות ומיומנויות רלוונטיות עבורה?'}`
                        : `היי, עדיין לא הזנתי את המשרה המלאה בעמוד (הקטגוריה: ${formData.category || 'כללי'}). תוכל בשאילתה אלי לקבל את המידע ולעזור לי עם המיומנויות שנדרשות?`;
                      const event = new CustomEvent('open-ai-assistant', { detail: { message } });
                      window.dispatchEvent(event);
                  }}
                  className="text-[10px] font-black text-brand-teal hover:text-brand-dark flex items-center gap-1 transition-colors"
                >
                  <Sparkles size={12} /> הצע תגיות AI
                </button>
              </label>
              <div className="flex gap-2 mb-4 flex-wrap justify-end">
                  {formData.tags?.map(tag => (
                      <Badge key={tag} variant="brand" className="px-4 py-1.5 flex items-center gap-2">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-brand-dark transition-colors"><X size={14} /></button>
                      </Badge>
                  ))}
              </div>
              <div className="flex flex-col md:flex-row gap-4 relative">
                  <select
                      className="flex-1 h-14 px-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none font-bold text-slate-700 shadow-inner"
                      value=""
                      onChange={(e) => {
                          const tag = e.target.value;
                          if (tag && !formData.tags?.includes(tag)) {
                              setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
                          }
                      }}
                  >
                      <option value="">בחר תגית...</option>
                      {Array.from(new Set([
                          ...(predefinedTagsByCategory[formData.category || ''] || getAllPredefinedTags()), 
                          ...globalTags
                      ])).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Input
                      placeholder="או הקלד מיומנות (למשל Docker)"
                      className="flex-1 h-14 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-right font-bold text-slate-700 shadow-inner w-full"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button 
                    type="button" 
                    onClick={addTag} 
                    className="h-14 px-8"
                  >
                    הוסף
                  </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 flex items-center justify-between pr-2">
                <div className="flex items-center gap-2">
                  <AlignLeft size={18} className="text-brand-teal" /> תיאור המשרה המלא
                </div>
                <button 
                  type="button"
                  onClick={() => {
                      const hasDesc = !!formData.description?.trim();
                      const message = hasDesc 
                        ? `היי, אני כותב משרה ל-"${formData.title || 'תפקיד'}". זה התיאור שכבר התחלתי: "${formData.description}". תוכל לעזור לי לשפר את הניסוח שיהיה מקצועי, מסודר ואטרקטיבי יותר? (שיכלול דרישות של התפקיד, תנאים למה כדאי בחברת ${formData.companyName || 'שלנו'})`
                        : `היי, חסר לי טקסט של תיאור משרה עבור "${formData.title || 'תפקיד חסר'}". תוכל לשאול אותי שאלות מנחות או להציע לי תיאור בסיס שנוכל לעבוד עליו? (חברה: ${formData.companyName || 'לא צוין'})`;
                      const event = new CustomEvent('open-ai-assistant', { detail: { message } });
                      window.dispatchEvent(event);
                  }}
                  className="text-[10px] font-black text-brand-teal hover:text-brand-dark flex items-center gap-1 transition-colors"
                >
                  <Sparkles size={12} /> עזור לי לכתוב עם AI
                </button>
              </label>
              <textarea
                required
                rows={10}
                placeholder="ספרו למה כדאי לעבוד אצלכם, מה הדרישות ומה תחומי האחריות..."
                className="w-full px-6 py-6 bg-slate-50 border-none rounded-[2rem] focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all resize-none text-right font-medium text-slate-700 shadow-inner leading-relaxed"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {!isEditing && (
                <div className="space-y-4">
                    <label className="text-sm font-black text-slate-700 flex items-center gap-2 pr-2">
                        <Star size={18} className="text-brand-orange" /> בחירת חבילת קידום (קרדיטים לחשבון: {user?.credits || 0})
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button
                            type="button"
                            variant={formData.promotionLevel === PromotionLevel.REGULAR ? 'outline' : 'ghost'}
                            onClick={() => setFormData({ ...formData, promotionLevel: PromotionLevel.REGULAR })}
                            className={cn(
                                "flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all h-auto",
                                formData.promotionLevel === PromotionLevel.REGULAR ? "bg-teal-50 border-brand-teal text-brand-teal" : "bg-white border-slate-100 text-slate-400"
                            )}
                        >
                            <span className="text-lg font-black tracking-tight">רגילה</span>
                            <span className="text-[10px] font-bold opacity-60">1 קרדיט</span>
                        </Button>
                        <Button
                            type="button"
                            variant={formData.promotionLevel === PromotionLevel.HIGHLIGHTED ? 'outline' : 'ghost'}
                            onClick={() => setFormData({ ...formData, promotionLevel: PromotionLevel.HIGHLIGHTED })}
                            className={cn(
                                "flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all h-auto",
                                formData.promotionLevel === PromotionLevel.HIGHLIGHTED ? "bg-purple-50 border-purple-500 text-purple-600 shadow-lg shadow-purple-500/10" : "bg-white border-slate-100 text-slate-400"
                            )}
                        >
                            <span className="text-lg font-black tracking-tight">מודגשת ✨</span>
                            <span className="text-[10px] font-bold opacity-60">2 קרדיטים</span>
                        </Button>
                        <Button
                            type="button"
                            variant={formData.promotionLevel === PromotionLevel.HOT ? 'outline' : 'ghost'}
                            onClick={() => setFormData({ ...formData, promotionLevel: PromotionLevel.HOT })}
                            className={cn(
                                "flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all h-auto",
                                formData.promotionLevel === PromotionLevel.HOT ? "bg-orange-50 border-brand-orange text-brand-orange shadow-lg shadow-orange-500/10" : "bg-white border-slate-100 text-slate-400"
                            )}
                        >
                            <span className="text-lg font-black tracking-tight">משרה חמה 🔥</span>
                            <span className="text-[10px] font-bold opacity-60">3 קרדיטים</span>
                        </Button>
                        <Button
                            type="button"
                            variant={formData.promotionLevel === PromotionLevel.URGENT ? 'outline' : 'ghost'}
                            onClick={() => setFormData({ ...formData, promotionLevel: PromotionLevel.URGENT })}
                            className={cn(
                                "flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all h-auto",
                                formData.promotionLevel === PromotionLevel.URGENT ? "bg-red-50 border-red-500 text-red-600 shadow-lg shadow-red-500/10" : "bg-white border-slate-100 text-slate-400"
                            )}
                        >
                            <span className="text-lg font-black tracking-tight">דחוף ביותר 🚨</span>
                            <span className="text-[10px] font-bold opacity-60">3 קרדיטים</span>
                        </Button>
                    </div>
                </div>
            )}

            {user?.role === UserRole.ADMIN && (
              <div className="space-y-4 pt-6 mt-6 border-t font-sans border-slate-100">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 pr-2">
                    <Shield size={18} className="text-indigo-600" /> הגדרות מנהל מערכת
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">שייך מעסיק / משתמש</label>
                        <select 
                            className="w-full h-14 bg-indigo-50/50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-right font-bold text-slate-700 shadow-inner px-4 cursor-pointer"
                            value={formData.ownerId || user.uid}
                            onChange={(e) => {
                                const newId = e.target.value;
                                const selectedEmp = employers.find(emp => emp.id === newId);
                                setFormData(prev => ({ 
                                    ...prev, 
                                    ownerId: newId, 
                                    companyName: selectedEmp ? selectedEmp.company : prev.companyName 
                                }));
                            }}
                        >
                            <option value={user.uid}>אני (מנהל המערכת)</option>
                            {employers.filter(e => e.id !== user.uid).map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name} {emp.company ? `(${emp.company})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">סטטוס משופר</label>
                        <select 
                            className="w-full h-14 bg-indigo-50/50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-right font-bold text-slate-700 shadow-inner px-4 cursor-pointer"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        >
                            <option value="Published">Published (מפורסם)</option>
                            <option value="active">Active (פעיל)</option>
                            <option value="pending_review">Pending Review (ממתין)</option>
                            <option value="rejected">Rejected (נדחה)</option>
                            <option value="Draft">Draft (טיוטה)</option>
                            <option value="Archived">Archived (בארכיון)</option>
                        </select>
                    </div>
                  </div>
              </div>
            )}
            
            {!isEditing && (
                <div className="flex items-start gap-4 pr-3 pt-6">
                    <input 
                        required 
                        type="checkbox" 
                        id="terms" 
                        className="mt-1.5 w-5 h-5 accent-indigo-600 rounded border-slate-300 shadow-sm cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-500 font-bold leading-tight cursor-pointer">
                        אני מאשר/ת שקראתי והבנתי את <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">תנאי השימוש</a> ואת <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">מדיניות הפרטיות</a> של האתר ומסכים/ה להם.
                    </label>
                </div>
            )}

            <div className="pt-8 flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1 py-5 text-lg"
              >
                ביטול
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex-[2] py-5 text-xl"
                leftIcon={!loading && <Zap size={24} />}
              >
                {isEditing ? 'עדכן משרה עכשיו' : 'פרסום משרה בצ\'יק!'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default JobPost;
