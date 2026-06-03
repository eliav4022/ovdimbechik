import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit, updateDoc, increment, arrayRemove, arrayUnion, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType, db, storage } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../context/ToastContext';
import { Helmet } from 'react-helmet-async';
import { LoadingSpinner, FullPageLoading } from '../components/ui/Loading';
import { TrustBadge } from '../components/ui/TrustBadge';
import { Job, Application, ApplicationStatus, UserRole, JobType, WorkMode, ExperienceLevel } from '../types';
import { 
    MapPin, 
    Clock, 
    DollarSign, 
    Building2, 
    Calendar, 
    FileText, 
    Send, 
    CheckCircle, 
    ChevronRight, 
    Tag, 
    Zap, 
    Home, 
    Award, 
    Eye,
    ArrowRight,
    Share2,
    Flag,
    ExternalLink,
    Bot,
    Mail,
    Phone,
    Briefcase,
    ShieldCheck,
    X,
    Heart,
    Shield,
    Pencil
} from 'lucide-react';
import { cn, validateFile } from '../lib/utils';
import { motion } from 'framer-motion';
import { JobCard } from '../components/JobCard';
import { trackEvent } from '../lib/analytics';

const getJobTypeLabel = (type: JobType) => {
    switch (type) {
        case JobType.FULL_TIME: return 'משרה מלאה';
        case JobType.PART_TIME: return 'משרה חלקית';
        case JobType.CONTRACT: return 'קבלן / פרויקט';
        case JobType.FREELANCE: return 'פרילאנס';
        case JobType.INTERNSHIP: return 'התמחות';
        case JobType.SHIFTS: return 'עבודת משמרות';
        default: return type;
    }
};

const getWorkModeLabel = (mode?: WorkMode) => {
    switch (mode) {
        case WorkMode.REMOTE: return 'מהבית';
        case WorkMode.HYBRID: return 'היברידי';
        case WorkMode.OFFICE: return 'מהמשרד';
        default: return 'לא צוין';
    }
};

const getExperienceLabel = (level?: ExperienceLevel) => {
    switch (level) {
        case ExperienceLevel.NO_EXPERIENCE: return 'ללא ניסיון';
        case ExperienceLevel.JUNIOR: return 'ג\'וניור (1-2 שנים)';
        case ExperienceLevel.MIDDLE: return 'ניסיון בינוני (3-5 שנים)';
        case ExperienceLevel.SENIOR: return 'בכיר (5+ שנים)';
        default: return 'לא צוין';
    }
};

const JobDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [employer, setEmployer] = useState<any>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicantName, setApplicantName] = useState(user?.displayName || '');
  const [applicantPhone, setApplicantPhone] = useState(user?.phone || '');
  const [applicantEmail, setApplicantEmail] = useState(user?.email || '');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [enableCVUploads, setEnableCVUploads] = useState(true);
  const [maxUserUploadSizeMB, setMaxUserUploadSizeMB] = useState(1);

  const isSaved = user?.savedJobs?.includes(job?.id || '');

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
        navigate('/login');
        return;
    }
    if (!job) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        savedJobs: isSaved ? arrayRemove(job.id) : arrayUnion(job.id)
      });
      toast(isSaved ? 'המשרה הוסרה מהשמורים' : 'המשרה נשמרה בהצלחה', 'success');
    } catch (error) {
      console.error("Error toggling saved job:", error);
      toast('אירעה שגיאה בשמירת המשרה', 'error');
    }
  };

  useEffect(() => {
    if (user) {
        setApplicantName(user.displayName);
        setApplicantEmail(user.email);
        if (user.phone) setApplicantPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const jobDocRef = doc(db, 'jobs', id);
        const jobDoc = await getDoc(jobDocRef);
        
        if (jobDoc.exists()) {
          const jobData = { id: jobDoc.id, ...jobDoc.data() } as Job;
          setJob(jobData);

          // Track job view
          trackEvent({
              type: 'view_job',
              metadata: {
                  jobId: jobData.id,
                  title: jobData.title,
                  companyName: jobData.companyName,
                  category: jobData.category
              }
          });

          // Fetch Employer for verification badge
          const employerDoc = await getDoc(doc(db, 'users', jobData.employerId));
          if (employerDoc.exists()) {
              setEmployer(employerDoc.data());
          }
          
          // Increment views
          await updateDoc(jobDocRef, {
            views: increment(1)
          });

          // Check if applied
          if (user) {
              const q = query(
                  collection(db, 'applications'),
                  where('jobId', '==', id),
                  where('seekerId', '==', user.uid),
                  limit(1)
              );
              const appliedDocs = await getDocs(q);
              if (!appliedDocs.empty) {
                  setApplied(true);
              }

              // Update user's recently viewed jobs
              if (user.role === UserRole.SEEKER) {
                  try {
                      const currentViews = user.recentlyViewedJobs || [];
                      const updatedViews = [
                          { jobId: jobData.id, title: jobData.title, companyName: jobData.companyName, viewedAt: new Date().toISOString() },
                          ...currentViews.filter(v => v.jobId !== jobData.id)
                      ].slice(0, 10);
                      const userRef = doc(db, 'users', user.uid);
                      await updateDoc(userRef, { recentlyViewedJobs: updatedViews });
                  } catch (err) {
                      console.error("Failed to update user recently viewed log", err);
                  }
              }
          }

          // Fetch similar jobs
          const similarQuery = query(
            collection(db, 'jobs'),
            where('category', '==', jobData.category),
            where('id', '!=', jobData.id),
            where('status', '==', 'approved'),
            limit(3)
          );
          const similarSnap = await getDocs(similarQuery);
          const fetchedSimilar = similarSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
          setSimilarJobs(fetchedSimilar);
        }
        
        if (user && user.role === UserRole.SEEKER) {
          const appsQuery = query(
            collection(db, 'applications'), 
            where('jobId', '==', id),
            where('seekerId', '==', user.uid)
          );
          const appsSnap = await getDocs(appsQuery);
          if (!appsSnap.empty) setApplied(true);
        }

        // Fetch settings
        const systemSnap = await getDoc(doc(db, 'settings', 'system'));
        if (systemSnap.exists()) {
            setEnableCVUploads(systemSnap.data().enableCVUploads !== false);
            setMaxUserUploadSizeMB(systemSnap.data().maxUserUploadSizeMB || 1);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `jobs/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job || applying) return;

    if (!applicantName || applicantName.length < 2) {
      toast('אנא הזן שם מלא תקין', 'error');
      return;
    }
    if (!applicantPhone || applicantPhone.length < 9) {
      toast('אנא הזן מספר טלפון תקין', 'error');
      return;
    }
    if (!applicantEmail || !applicantEmail.includes('@')) {
      toast('אנא הזן אימייל תקין', 'error');
      return;
    }
    if (enableCVUploads && job.requireCV !== false && !cvFile && !user.cvUrl) {
      toast('חובה לצרף קובץ קורות חיים', 'error');
      return;
    }
    
    if (cvFile) {
      const validation = validateFile(cvFile, maxUserUploadSizeMB);
      if (!validation.valid) {
        toast(validation.error || 'קובץ לא תקין', 'error');
        return;
      }
    }

    if (!acceptedTerms) {
      toast('עליך לאשר את תנאי השימוש', 'error');
      return;
    }

    setApplying(true);

    try {
      let finalCvUrl = user.cvUrl || '';
      if (cvFile) {
          const cvRef = ref(storage, `cvs/${user.uid}/${Date.now()}_${cvFile.name}`);
          
          const fileName = cvFile.name.toLowerCase();
          let contentType = cvFile.type || 'application/octet-stream';
          if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
          else if (fileName.endsWith('.doc')) contentType = 'application/msword';
          else if (fileName.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

          const fileBytes = new Uint8Array(await cvFile.arrayBuffer());
          await uploadBytes(cvRef, fileBytes, { contentType });
          
          finalCvUrl = await getDownloadURL(cvRef);
      }

      const appRef = doc(collection(db, 'applications'));
      const application: Application = {
        id: appRef.id,
        jobId: job.id,
        seekerId: user.uid,
        employerId: job.employerId,
        ownerId: job.ownerId || job.employerId,
        applicantName,
        applicantPhone,
        applicantEmail,
        cvUrl: finalCvUrl,
        resumeUrl: finalCvUrl,
        coverLetter,
        status: ApplicationStatus.NEW,
        createdAt: new Date().toISOString(),
      };
      
      const batch = writeBatch(db);
      batch.set(appRef, application);
      batch.update(doc(db, 'jobs', job.id), { applicationsCount: increment(1) });
      
      // Update user profile if phone was missing
      if (user.uid && !user.phone && applicantPhone) {
          batch.update(doc(db, 'users', user.uid), { phone: applicantPhone });
      }

      await batch.commit();

      toast('המועמדות שלך נשלחה בהצלחה!', 'success');

      // Track job application
      trackEvent({
          type: 'apply_job',
          metadata: {
              jobId: job.id,
              title: job.title,
              companyName: job.companyName
          }
      });
      setApplied(true);
      setShowApplyForm(false);
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Job Apply Upload/Firestore Error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'applications');
    } finally {
      setApplying(false);
    }
  };

  const handleShare = () => {
    const text = `מצאתי משרה מעולה בשבילך: ${job?.title} ב-${job?.companyName}\n${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job || !reportReason) return;
    setReporting(true);

    try {
      const reportRef = doc(collection(db, 'jobReports'));
      await setDoc(reportRef, {
        id: reportRef.id,
        reporterId: user.uid,
        reporterName: user.displayName,
        targetId: job.id,
        targetType: 'job',
        reason: reportReason,
        details: reportDetails,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      toast('תודה על הדיווח. הנושא ייבדק עליו ידי הצוות.', 'info');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    } finally {
      setReporting(false);
    }
  };

  if (loading) return <FullPageLoading message="טוען פרטי משרה..." />;

  if (!job) return <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
    <div className="w-20 h-20 bg-red-50 text-red-400 rounded-3xl flex items-center justify-center mb-4">
      <Flag size={40} />
    </div>
    <h2 className="text-2xl font-black text-slate-900">המשרה לא נמצאה</h2>
    <p className="text-slate-500 font-bold">ייתכן שהיא כבר נסגרה או הוסרה מהאתר.</p>
    <Link to="/" className="mt-4 bg-brand-dark text-white px-8 py-3 rounded-xl font-black shadow-lg">חזרה לכל המשרות</Link>
  </div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20" dir="rtl">
      <Helmet>
        <title>{`${job.title} | ${job.companyName} | עובדים בצ'יק`}</title>
        <meta name="description" content={`משרת ${job.title} בחברת ${job.companyName} ב${job.location}. הגש מועמדות עכשיו בצ'יק!`} />
      </Helmet>
      {/* Hero Header */}
      <div className="bg-slate-900 text-white pt-24 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-highlight/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <button 
            onClick={() => navigate(-1)} 
            aria-label="חזרה לעמוד הקודם"
            className="flex items-center gap-2 text-white/50 hover:text-white mb-10 transition-all font-black text-sm group"
          >
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /> 
            חזרה ללוח המשרות
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border-2 border-white/10 shadow-2xl overflow-hidden shrink-0">
                <Building2 size={56} className="text-primary" />
              </div>
              <div className="space-y-4 text-right">
                <div className="flex flex-wrap gap-2 mb-3">
                    {user?.role === UserRole.ADMIN && (
                        <Link to={`/admin/jobs/${job.id}`} className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-600 transition-colors flex items-center gap-1">
                            <Shield size={12} /> מסך ניהול משרה
                        </Link>
                    )}
                    {(user?.role === UserRole.ADMIN || user?.uid === job.employerId) && (
                        <Link to={`/employer/edit-job/${job.id}`} className="bg-slate-700 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg hover:bg-slate-600 transition-colors flex items-center gap-1">
                            <Pencil size={12} /> ערוך משרה
                        </Link>
                    )}
                    {job.isUrgent && <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse uppercase tracking-[0.2em] shadow-lg shadow-red-500/20">דחוף 🔥</span>}
                    {job.isImmediate && <span className="bg-highlight text-primary-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-highlight/20">מיידי ⚡</span>}
                    {job.isVerified && <TrustBadge type="verified-job" size="sm" className="shadow-lg" />}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-tight">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-white/60 font-black text-sm">
                  <p className="flex items-center gap-2">
                    <Link 
                      to={`/jobs?company=${encodeURIComponent(job.companyName)}`}
                      className="text-primary hover:text-highlight transition-colors cursor-pointer decoration-2 underline-offset-8 underline"
                    >
                      {job.companyName}
                    </Link>
                    {employer?.isVerified && <TrustBadge type="verified-employer" size="sm" label="VERIFIED" />}
                  </p>
                  <span className="w-2 h-2 bg-white/10 rounded-full" />
                  <p className="flex items-center gap-2">
                    <MapPin size={20} className="text-highlight" />
                    {job.location}
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-white/30 hover:text-white flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 transition-all"
                    >
                        <ExternalLink size={12} />
                        מפה
                    </a>
                  </p>
                  <span className="w-2 h-2 bg-white/10 rounded-full" />
                  <p className="flex items-center gap-2">
                    <Eye size={20} className="text-primary" />
                    <span className="text-white font-black">{job.views || 0}</span> צפיות
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
               <button 
                onClick={toggleSave}
                className={cn(
                    "p-5 rounded-[1.5rem] transition-all border backdrop-blur-xl shadow-xl hover:-translate-y-1",
                    isSaved ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                )}
                title={isSaved ? "הסר משמירה" : "שמור משרה"}
               >
                 <Heart size={24} fill={isSaved ? "currentColor" : "none"} />
               </button>
               <button 
                onClick={handleShare}
                className="bg-white/5 hover:bg-white/10 text-white p-5 rounded-[1.5rem] transition-all border border-white/10 backdrop-blur-xl shadow-xl hover:-translate-y-1"
                title="שתף משרה"
               >
                 <Share2 size={24} />
               </button>
               <button 
                onClick={() => setShowReportModal(true)}
                className="bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 p-5 rounded-[1.5rem] transition-all border border-white/10 backdrop-blur-xl shadow-xl hover:-translate-y-1"
                title="דווח"
               >
                 <Flag size={24} />
               </button>
               {job.directContact ? (
                   <a 
                        href={
                            job.directContact.includes('http') || job.directContact.includes('wa.me') 
                                ? (job.directContact.startsWith('http') ? job.directContact : `https://${job.directContact}`)
                                : job.directContact.includes('@')
                                ? `mailto:${job.directContact}`
                                : `tel:${job.directContact.replace(/\D/g, '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-emerald-400 text-white px-12 py-5 rounded-[1.5rem] font-black text-xl hover:shadow-2xl hover:shadow-emerald-500/40 transition-all active:scale-95 tracking-tight flex items-center justify-center gap-3"
                    >
                        {(job.directContact.includes('wa.me') || job.directContact.includes('whatsapp')) ? (
                            <>
                                <Phone size={24} /> צור קשר בוואטסאפ
                            </>
                        ) : (!job.directContact.includes('http') && !job.directContact.includes('@') && /[0-9]{3}/.test(job.directContact)) ? (
                            <>
                                <Phone size={24} /> חייג עכשיו: {job.directContact}
                            </>
                        ) : job.directContact.includes('@') ? (
                            <>
                                <Mail size={24} /> שלח דוא"ל
                            </>
                        ) : (
                            <>
                                <ExternalLink size={24} /> צור קשר ישירות
                            </>
                        )}
                   </a>
               ) : applied ? (
                   <div className="flex-1 md:flex-none bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20">
                       <CheckCircle size={24} />
                       מועמדות הוגשה
                   </div>
               ) : (
                   <button 
                        onClick={() => {
                            if (!user) {
                                navigate('/login');
                                return;
                            }
                            setShowApplyForm(true);
                            setTimeout(() => {
                                document.getElementById('apply-form-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }}
                        className="flex-1 md:flex-none bg-gradient-to-r from-primary to-highlight text-white px-12 py-5 rounded-[1.5rem] font-black text-xl hover:shadow-2xl hover:shadow-primary/40 transition-all active:scale-95 tracking-tight"
                    >
                        הגשת מועמדות מהירה
                   </button>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Info Sidebar */}
          <div className="lg:col-span-4 lg:order-2 space-y-8">
            <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200/60 border border-slate-100 relative z-20">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-8 border-b border-bg-light pb-6 text-center">מפרט המשרה</h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
                    <div className="flex items-center gap-5 p-4 rounded-3xl bg-bg-light/50 border border-slate-50">
                        <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center shrink-0 shadow-soft">
                            <DollarSign size={28} />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">שכר חודשי</p>
                            <p className="font-black text-text-main text-lg">{job.salary}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 p-4 rounded-3xl bg-bg-light/50 border border-slate-50">
                        <div className="w-14 h-14 rounded-2xl bg-white text-highlight flex items-center justify-center shrink-0 shadow-soft">
                            <Clock size={28} />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">סוג המשרה</p>
                            <p className="font-black text-text-main text-lg">{getJobTypeLabel(job.type)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 p-4 rounded-3xl bg-bg-light/50 border border-slate-50">
                        <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center shrink-0 shadow-soft">
                            <Home size={28} />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">מודל עבודה</p>
                            <p className="font-black text-text-main text-lg">{getWorkModeLabel(job.workMode)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 p-4 rounded-3xl bg-bg-light/50 border border-slate-50">
                        <div className="w-14 h-14 rounded-2xl bg-white text-highlight flex items-center justify-center shrink-0 shadow-soft">
                            <Award size={28} />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">ניסיון נדרש</p>
                            <p className="font-black text-text-main text-lg">{getExperienceLabel(job.experienceLevel)}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-bg-light space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-black text-text-muted uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> תאריך פרסום </span>
                        <span className="text-text-main">{new Date(job.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-black text-text-muted uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Tag size={14} className="text-highlight" /> קוד משרה</span>
                        <span className="text-text-main">#{job.id.slice(-6).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* AI Assistant Promo */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                        <Bot size={28} className="text-highlight" />
                    </div>
                    <h4 className="text-xl font-black mb-3">זקוקים לעזרה בניסוח? ✨</h4>
                    <p className="text-white/60 text-sm font-bold leading-relaxed mb-8">
                        העוזר החכם שלנו יכול לעזור לכם לכתוב מכתב מקדים מותאם אישית שפשוט אי אפשר להתעלם ממנו!
                    </p>
                    <button 
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('open-ai-assistant', { 
                                detail: { message: `היי, אני רוצה להגיש מועמדות למשרה "${job.title}" ב"${job.companyName}". תוכל לעזור לי לנסח מכתב מקדים מנצח?`, autoSend: true } 
                            }));
                        }}
                        className="w-full bg-primary text-white py-4 rounded-[1.25rem] font-black text-sm hover:translate-y-[-4px] transition-all active:scale-95 shadow-xl shadow-primary/20 border border-white/10"
                    >
                        כתוב לי מכתב מקדים ב-AI
                    </button>
                </div>
            </div>
          </div>

          {/* Job Description & Details */}
          <div className="lg:col-span-8 lg:order-1 space-y-8 relative z-20">
            <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 sm:p-10 md:p-14 shadow-2xl shadow-slate-200/60 border border-slate-100">
              <div className="mb-14">
                <h3 className="text-3xl font-black text-text-main mb-8 flex items-center gap-4">
                    <div className="w-2 h-10 bg-primary rounded-full" />
                    תיאור התפקיד
                </h3>
                <div className="text-text-main text-lg leading-relaxed whitespace-pre-wrap font-medium md:pr-6">
                  {job.description}
                </div>
              </div>

              {job.tags && job.tags.length > 0 && (
                <div className="pt-12 border-t border-bg-light">
                  <h3 className="text-xl font-black text-text-main mb-8 flex items-center gap-4">
                     <div className="w-2 h-8 bg-highlight rounded-full" />
                     מיומנויות ודרישות חובה
                  </h3>
                  <div className="flex flex-wrap gap-4 md:pr-6">
                    {job.tags.map(tag => (
                      <span key={tag} className="bg-bg-light text-text-main px-6 py-3 rounded-2xl text-sm font-black border border-slate-200 flex items-center gap-3 hover:bg-white hover:border-primary transition-all cursor-default hover:shadow-soft">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {job.companyDescription && (
              <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-14 shadow-2xl shadow-slate-200/60 border border-slate-100">
                <h3 className="text-xl font-black text-text-main mb-6 flex items-center gap-3">
                    <div className="w-2 h-10 bg-highlight rounded-full" />
                    על המעסיק
                </h3>
                <div className="md:pr-8">
                  <p className="text-text-main font-bold leading-relaxed text-lg italic opacity-80 mb-6">
                    {job.companyDescription}
                  </p>
                  <div className="flex items-center gap-2 text-primary font-black text-sm">
                      <CheckCircle size={18} />
                      <span>מעסיק פעיל המגיב למועמדים במהירות</span>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Jobs Section */}
            {similarJobs.length > 0 && (
                <div className="space-y-8 pt-8">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-3xl font-black text-text-main tracking-tight">משרות דומות שיעניינו אותך</h3>
                        <Link to="/" className="text-primary font-black text-sm hover:underline">כל המשרות ←</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {similarJobs.map(similarJob => (
                            <JobCard key={similarJob.id} job={similarJob} />
                        ))}
                    </div>
                </div>
            )}

            {showApplyForm && (
                <motion.div 
                    id="apply-form-section"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 sm:p-10 md:p-14 shadow-[0_30px_100px_-20px_rgba(46,196,182,0.15)] border-2 border-primary/20 ring-[12px] ring-primary/5"
                >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8 mb-8 md:mb-12">
                        <div className="text-right">
                            <h2 className="text-3xl md:text-4xl font-black text-text-main mb-3 leading-tight">שנתחיל בקריירה החדשה? 🔥</h2>
                            <p className="text-text-muted font-bold text-base md:text-lg">הגשת מועמדות בצ'יק לתפקיד: <span className="text-primary">{job.title}</span></p>
                        </div>
                        <button 
                            onClick={() => setShowApplyForm(false)}
                            className="w-14 h-14 bg-bg-light text-text-muted rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center shrink-0"
                        >
                            <X size={28} />
                        </button>
                    </div>

                    <form onSubmit={handleApply} className="space-y-10 font-sans">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div className="space-y-3 text-right">
                                <label className="text-sm font-black text-text-main pr-3">שם מלא</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="השם שלך"
                                    className="w-full px-8 py-5 bg-bg-light border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white transition-all outline-none text-text-main font-black shadow-inner"
                                    value={applicantName}
                                    onChange={(e) => setApplicantName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3 text-right">
                                <label className="text-sm font-black text-text-main pr-3">טלפון ליצירת קשר</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="05x-xxxxxxx"
                                    className="w-full px-8 py-5 bg-bg-light border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white transition-all outline-none text-text-main font-black shadow-inner"
                                    value={applicantPhone}
                                    onChange={(e) => setApplicantPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3 text-right">
                                <label className="text-sm font-black text-text-main pr-3">אימייל</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="your@email.com"
                                    className="w-full px-8 py-5 bg-bg-light border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white transition-all outline-none text-text-main font-black shadow-inner"
                                    value={applicantEmail}
                                    onChange={(e) => setApplicantEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 ${enableCVUploads ? 'md:grid-cols-2' : ''} gap-10`}>
                            {enableCVUploads && (
                                <div className="space-y-5 text-right">
                                    <label className="block text-sm font-black text-text-main pr-3">קורות חיים (PDF / WORD)</label>
                                    <div className="relative group overflow-hidden rounded-[2.5rem]">
                                        <input
                                            type="file"
                                            required={job.requireCV !== false && !user?.cvUrl}
                                            accept=".pdf,.doc,.docx"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                                        />
                                        <div className="border-4 border-dashed border-bg-light rounded-[2.5rem] p-8 md:p-14 text-center group-hover:border-primary transition-all bg-bg-light/30 group-hover:bg-primary/5">
                                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform border border-slate-100">
                                                <FileText size={40} className="text-primary" />
                                            </div>
                                            <p className="font-black text-text-main text-lg mb-2">
                                                {cvFile ? cvFile.name : (user?.cvUrl ? 'קורות החיים שלך בפרופיל ישלחו (לחץ להחלפה)' : 'לחץ להעלאת קובץ')}
                                            </p>
                                            <p className="text-text-muted text-xs font-black uppercase tracking-[0.2em]">{user?.cvUrl ? 'ניתן להעלות קובץ אחר' : (job.requireCV !== false ? 'חובה לצרף CV' : 'רשות לצרף CV')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-5 text-right">
                                <label className="block text-sm font-black text-text-main pr-3">המסר שלך למעסיק</label>
                                <textarea
                                    rows={9}
                                    className="w-full px-8 py-8 bg-bg-light border-2 border-transparent rounded-[2.5rem] focus:border-primary focus:bg-white transition-all outline-none text-text-main font-bold resize-none shadow-inner"
                                    placeholder="כאן כדאי לכתוב בקצרה למה אתם מתאימים לתפקיד... AI Assistant יכול לעזור לכם בזה!"
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pr-3 justify-end">
                            <label htmlFor="terms" className="text-sm font-bold text-text-muted cursor-pointer order-2 md:order-1 text-right">
                                אני מאשר/ת שקראתי והבנתי את <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">תנאי השימוש</a> ואת <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">מדיניות הפרטיות</a> של האתר ומסכים/ה להם.
                            </label>
                            <input 
                                type="checkbox" 
                                id="terms" 
                                required 
                                className="w-7 h-7 rounded-lg border-bg-light text-primary focus:ring-primary order-1 md:order-2 cursor-pointer"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                            />
                        </div>

                        <div className="flex justify-end pt-6">
                            <button
                                type="submit"
                                disabled={applying}
                                className="w-full md:w-auto bg-gradient-to-r from-primary to-highlight text-white px-20 py-6 rounded-[1.75rem] font-black text-2xl hover:shadow-2xl hover:shadow-primary/40 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-4"
                            >
                                {applying ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        שולח מועמדות...
                                    </>
                                ) : (
                                    <>
                                        שיגור מועמדות
                                        <ArrowRight className="rotate-180" size={28} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {showSuccess && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900 rounded-[2rem] md:rounded-[4rem] p-10 sm:p-16 md:p-24 text-center text-white shadow-[0_50px_100px_-20px_rgba(34,197,94,0.3)] relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                            <CheckCircle size={60} className="md:w-[80px] md:h-[80px]" />
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter leading-tight">נשלח בהצלחה! 🎊</h2>
                        <p className="text-lg md:text-2xl font-bold text-white/70 mb-10 md:mb-14 max-w-2xl mx-auto leading-relaxed">
                            המועמדות שלך בדרך למעסיק. שלחנו לך מייל אישור עם כל הפרטים. המון בהצלחה בדרך החדשה!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button 
                                onClick={() => navigate('/seeker/dashboard')}
                                className="bg-white text-slate-900 px-12 py-5 rounded-[1.5rem] font-black text-xl hover:scale-105 transition-all shadow-xl active:scale-95"
                            >
                                לעבור לאזור האישי
                            </button>
                            <button 
                                onClick={() => setShowSuccess(false)}
                                className="bg-white/10 border-2 border-white/20 text-white px-12 py-5 rounded-[1.5rem] font-black text-xl hover:bg-white/20 transition-all active:scale-95"
                            >
                                הישאר כאן
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                        onClick={() => setShowReportModal(false)}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl max-w-xl w-full relative z-10 border-2 border-red-100"
                    >
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <h3 className="text-3xl font-black text-text-main tracking-tight">דיווח על המראה</h3>
                            <button onClick={() => setShowReportModal(false)} className="w-12 h-12 bg-bg-light text-text-muted rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleReportSubmit} className="space-y-8">
                            <div className="space-y-3 text-right">
                                <label className="text-sm font-black text-text-main pr-3">מה הבעיה במשרה?</label>
                                <select 
                                    required
                                    className="w-full px-6 py-5 bg-bg-light border-none rounded-[1.25rem] focus:ring-4 focus:ring-primary/10 outline-none text-text-main font-black appearance-none cursor-pointer"
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                >
                                    <option value="">משהו לא תקין? ספר לנו...</option>
                                    <option value="inappropriate">תוכן פוגעני או לא הולם</option>
                                    <option value="spam">ספאם / משרה כפולה / הונאה</option>
                                    <option value="misleading">מידע לא מדויק או מטעה</option>
                                    <option value="expired">המשרה כבר לא רלוונטית</option>
                                    <option value="other">אחר</option>
                                </select>
                            </div>

                            <div className="space-y-3 text-right">
                                <label className="text-sm font-black text-text-main pr-3">פירוט (אופציונלי)</label>
                                <textarea 
                                    rows={5}
                                    className="w-full px-6 py-6 bg-bg-light border-none rounded-[1.25rem] focus:ring-4 focus:ring-primary/10 outline-none text-text-main font-bold resize-none shadow-inner"
                                    placeholder="נשמח לפירוט קצר שיעזור לנו לטפל בדיווח במהירות..."
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="sm:flex-1 px-8 py-5 bg-bg-light text-text-muted rounded-[1.25rem] font-black hover:bg-slate-200 transition-all"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={reporting || !reportReason}
                                    className="sm:flex-[2] bg-red-500 text-white px-8 py-5 rounded-[1.25rem] font-black hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {reporting && <LoadingSpinner size="sm" />}
                                    {reporting ? 'שולח דיווח...' : 'דווח על המשרה'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
