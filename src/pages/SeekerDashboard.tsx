import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, linkWithPopup, unlink, GoogleAuthProvider, deleteUser, reauthenticateWithPopup } from 'firebase/auth';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../context/ToastContext';
import { Helmet } from 'react-helmet-async';
import { LoadingSpinner, FullPageLoading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { getFileUrl } from '../lib/utils';
import { Job, Application, ApplicationStatus, User, UserRole, JobStatus } from '../types';
import { isJobActive } from '../lib/jobUtils';
import { JobCard } from '../components/JobCard';
import { 
    Heart, 
    Send, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Briefcase, 
    ChevronLeft, 
    User as UserIcon, 
    FileText, 
    Sparkles, 
    Phone, 
    Mail, 
    Calendar,
    Eye,
    TrendingUp,
    Star,
    LayoutDashboard,
    LogOut,
    ExternalLink,
    Zap,
    Upload,
    Lock,
    ShieldCheck,
    AlertTriangle,
    Sliders,
    Search
} from 'lucide-react';
import { cn, validateFile } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SeekerDashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [appliedJobs, setAppliedJobs] = useState<{ job: Job; app: Application }[]>([]);
    const [savedJobs, setSavedJobs] = useState<Job[]>([]);
    const [matchedJobs, setMatchedJobs] = useState<Job[]>([]);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [activeTab, setActiveTab] = useState<'applications' | 'saved' | 'profile' | 'matches'>('applications');
    const [loading, setLoading] = useState(true);

    // Profile State
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [preferredCategories, setPreferredCategories] = useState<string[]>(user?.preferredCategories || []);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    
    // Job Preferences State
    const [globalTags, setGlobalTags] = useState<string[]>([]);
    const [showPreferencesModal, setShowPreferencesModal] = useState(false);
    const [jobSeekingStatus, setJobSeekingStatus] = useState<'active' | 'open' | 'inactive'>(user?.jobSeekingStatus || 'active');
    const [preferredLocations, setPreferredLocations] = useState<string[]>(user?.preferredLocations || []);
    const [preferredDistance, setPreferredDistance] = useState<number>(user?.preferredDistance || 25);
    const [remoteOnly, setRemoteOnly] = useState(user?.remoteOnly || false);
    const [jobScope, setJobScope] = useState<string[]>(user?.jobScope || []);

    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [cvUploading, setCvUploading] = useState(false);

    // Activity & notifications
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        const compiledActivities: any[] = [];
        
        // Add applications
        appliedJobs.slice(0, 5).forEach(app => {
            compiledActivities.push({
                id: `app-${app.app.id}`,
                type: 'application',
                title: `הגשת מועמדות ל${app.job.title}`,
                company: app.job.companyName,
                date: new Date(app.app.createdAt).getTime(),
                icon: Send
            });
        });

        // Add recently viewed
        if (user.recentlyViewedJobs) {
            user.recentlyViewedJobs.forEach((v: any, index: number) => {
                compiledActivities.push({
                    id: `view-${v.jobId}-${index}`,
                    type: 'view',
                    title: `צפית במשרה ${v.title}`,
                    company: v.companyName,
                    date: new Date(v.viewedAt || Date.now()).getTime(),
                    icon: Eye
                });
            });
        }

        compiledActivities.sort((a, b) => b.date - a.date);
        setActivities(compiledActivities.slice(0, 4));
    }, [appliedJobs, user]);

    // Profile Completion Logic
    const profileFields = [
        { key: 'displayName', label: 'שם מלא', isComplete: !!user?.displayName || !!user?.fullName },
        { key: 'phone', label: 'טלפון', isComplete: !!user?.phone },
        { key: 'bio', label: 'קצת עליי', isComplete: !!user?.bio },
        { key: 'preferredCategories', label: 'תחומי עניין', isComplete: !!user?.preferredCategories && user.preferredCategories.length > 0 },
        { key: 'preferredLocations', label: 'אזורי עבודה', isComplete: !!user?.preferredLocations && user.preferredLocations.length > 0 },
        { key: 'jobScope', label: 'סוג משרה (היקף)', isComplete: !!user?.jobScope && user.jobScope.length > 0 },
    ];
    const completedFieldsCount = profileFields.filter(f => f.isComplete).length;
    const profileCompletionPercentage = Math.round((completedFieldsCount / profileFields.length) * 100);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Linked Accounts State
    const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
    const [isLinking, setIsLinking] = useState(false);

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    const [enableCVUploads, setEnableCVUploads] = useState(true);
    const [maxUserUploadSizeMB, setMaxUserUploadSizeMB] = useState(1);

    // Initial setup from user
    useEffect(() => {
        if (!user) return;
        setDisplayName(user.displayName || '');
        setPhone(user.phone || '');
        setBio(user.bio || '');
        setPreferredCategories(user.preferredCategories || []);
        
        setJobSeekingStatus(user.jobSeekingStatus || 'active');
        setPreferredLocations(user.preferredLocations || []);
        setPreferredDistance(user.preferredDistance || 25);
        setRemoteOnly(user.remoteOnly || false);
        setJobScope(user.jobScope || []);

        if (auth.currentUser) {
            setLinkedProviders(auth.currentUser.providerData.map(p => p.providerId));
        }
    }, [user?.uid, auth.currentUser]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'settings', 'tags'));
                if (docSnap.exists() && docSnap.data().jobTags) {
                    setGlobalTags(docSnap.data().jobTags);
                } else {
                    setGlobalTags([
                        'מכירות וניהול תיקי לקוחות', 'שירות לקוחות', 'תמיכה טכנית (Help Desk)', 
                        'הייטק ופיתוח תוכנה', 'בדיקות תוכנה (QA)', 'שיווק ודיגיטל', 'כספים וכלכלה', 
                        'אדמיניסטרציה ומזכירות', 'משאבי אנוש (HR)', 'לוגיסטיקה ותפעול', 'הנדסה', 
                        'ניהול פרויקטים', 'עיצוב ואנימציה', 'מקצועות הבריאות והסיעוד', 'הוראה והדרכה', 
                        'קמעונאות ורשתות', 'אבטחת מידע וסייבר', 'ניהול מוצר (Product)', 'DevOps', 
                        'רפואה', 'רכב ותחבורה', 'עריכת דין ומשפטים'
                    ]);
                }

                const systemSnap = await getDoc(doc(db, 'settings', 'system'));
                if (systemSnap.exists()) {
                    setEnableCVUploads(systemSnap.data().enableCVUploads !== false);
                    setMaxUserUploadSizeMB(systemSnap.data().maxUserUploadSizeMB || 1);
                }
            } catch (error) {
                console.error("Failed to load global tags", error);
            }
        };
        fetchSettings();
    }, []);

    const handleLinkGoogle = async () => {
        if (!auth.currentUser) return;
        setIsLinking(true);
        try {
            const provider = new GoogleAuthProvider();
            await linkWithPopup(auth.currentUser, provider);
            setLinkedProviders(auth.currentUser.providerData.map(p => p.providerId));
            toast('חשבון גוגל קושר בהצלחה', 'success');
        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                console.error('Error linking with Google:', error);
            }
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                return;
            } else if (error.code === 'auth/credential-already-in-use') {
                toast('חשבון גוגל זה כבר משויך למשתמש אחר', 'error');
            } else {
                toast('אירעה שגיאה בקישור החשבון', 'error');
            }
        } finally {
            setIsLinking(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        if (!auth.currentUser) return;
        // Check if there are other providers left, otherwise user gets locked out.
        if (auth.currentUser.providerData.length === 1) {
            toast('לא ניתן לנתק חשבון גוגל כאשר קיימת רק שיטת התחברות אחת.', 'error');
            return;
        }

        setIsLinking(true);
        try {
            await unlink(auth.currentUser, GoogleAuthProvider.PROVIDER_ID);
            setLinkedProviders(auth.currentUser.providerData.map(p => p.providerId));
            toast('חשבון גוגל נותק בהצלחה', 'success');
        } catch (error: any) {
            console.error('Error unlinking Google:', error);
            toast('אירעה שגיאה בניתוק החשבון', 'error');
        } finally {
            setIsLinking(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!auth.currentUser || !user) return;
        setIsDeleting(true);
        try {
            // Re-authenticate first to prevent partial deletion (doc deleted but auth throws error)
            if (linkedProviders.includes('password')) {
                if (!deletePassword) {
                    toast('אנא הזן סיסמה כדי לאשר מחיקה', 'error');
                    setIsDeleting(false);
                    return;
                }
                const credential = EmailAuthProvider.credential(user.email || '', deletePassword);
                await reauthenticateWithCredential(auth.currentUser, credential);
            } else if (linkedProviders.includes('google.com')) {
                const provider = new GoogleAuthProvider();
                await reauthenticateWithPopup(auth.currentUser, provider);
            }

            // After re-authentication, it's safe to delete
            
            // 1. Delete CV if exists
            if (user.cvUrl) {
                try {
                    const cvRef = ref(storage, user.cvUrl);
                    await deleteObject(cvRef);
                } catch (e) {
                    console.error("Failed to delete CV reference:", e);
                }
            }

            // 2. Delete all applications
            const appsQuery = query(collection(db, 'applications'), where('seekerId', '==', user.uid));
            const appsSnap = await getDocs(appsQuery);
            
            const batches = [];
            let currentBatch = writeBatch(db);
            let count = 0;
            
            appsSnap.forEach(appDoc => {
                if (count >= 499) {
                    batches.push(currentBatch);
                    currentBatch = writeBatch(db);
                    count = 0;
                }
                currentBatch.delete(appDoc.ref);
                count++;
            });
            batches.push(currentBatch);

            for (const b of batches) {
                await b.commit();
            }

            // 3. Delete user document
            const { softDelete } = await import('../lib/adminUtils');
            await softDelete({
                collectionName: 'users',
                id: user.uid,
                deletedBy: user.uid,
                reason: 'מחיקת חשבון עצמאית על ידי מחפש עבודה'
            });
            // 4. Delete auth account
            await deleteUser(auth.currentUser);
            
            toast('החשבון נמחק בהצלחה', 'success');
            navigate('/');
        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                console.error('Error deleting account:', error);
            }
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                setIsDeleting(false);
                return;
            }
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast('הסיסמה שגויה', 'error');
            } else if (error.code === 'auth/requires-recent-login') {
                toast('מטעמי אבטחה, יש להתנתק ולהתחבר מחדש לפני מחיקת החשבון', 'error');
                // You can optionally sign out here, or just tell them to do it.
            } else {
                toast('אירעה שגיאה במחיקת החשבון', 'error');
            }
        } finally {
            setIsDeleting(false);
            if (deletePassword) {
                // If wrong password, don't hide the confirm box so they can try again.
                // But we just reset the password string.
                setDeletePassword('');
            }
        }
    };

    // 1. Fetch Applications
    useEffect(() => {
        if (!user) return;
        const appsQuery = query(collection(db, 'applications'), where('seekerId', '==', user.uid));
        const unsubApps = onSnapshot(appsQuery, async (snapshot) => {
            const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application));
            const jobsData: { job: Job; app: Application }[] = [];
            for (const app of apps) {
                const jobDoc = await getDoc(doc(db, 'jobs', app.jobId));
                if (jobDoc.exists()) {
                    jobsData.push({ job: { id: jobDoc.id, ...jobDoc.data() } as Job, app });
                } else {
                    jobsData.push({ job: { id: app.jobId, title: 'המשרה הוסרה מהמערכת', companyName: '-', location: '-', status: JobStatus.CLOSED } as any, app });
                }
            }
            setAppliedJobs(jobsData.sort((a, b) => new Date(b.app.createdAt).getTime() - new Date(a.app.createdAt).getTime()));
            setLoading(false);
        });
        return () => unsubApps();
    }, [user?.uid]);

    // 2. Fetch Jobs globally for matches and saved jobs
    useEffect(() => {
        const unsubJobs = onSnapshot(query(collection(db, 'jobs'), where('status', 'in', ['active', 'Published'])), (snapshot) => {
            const allApprovedRaw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            const allApproved = allApprovedRaw.filter(job => isJobActive(job));
            setAllJobs(allApproved);
        });
        return () => unsubJobs();
    }, []);

    // 3. Derived state for saved jobs and matched jobs
    useEffect(() => {
        if (!user) return;
        // Saved Jobs
        setSavedJobs(allJobs.filter(j => user.savedJobs?.includes(j.id)));
        
        // Match Jobs (Simulated logic based on common tags or categories)
        const userCategories = new Set([
            ...appliedJobs.map(aj => aj.job.category),
            ...((user.preferredCategories as string[]) || [])
        ]);
        let matches = allJobs.filter(j => 
            !appliedJobs.some(aj => aj.job.id === j.id) && 
            (userCategories.has(j.category) || j.isUrgent)
        );
        // Fallback if no exact matches, show other unapplied jobs
        if (matches.length === 0) {
             matches = allJobs.filter(j => !appliedJobs.some(aj => aj.job.id === j.id));
        }
        setMatchedJobs(matches.slice(0, 4));
    }, [user?.savedJobs, allJobs, appliedJobs]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setUpdatingProfile(true);
        try {
            await setDoc(doc(db, 'users', user.uid), {
                displayName,
                phone,
                bio,
                preferredCategories,
                jobSeekingStatus,
                preferredLocations,
                preferredDistance,
                remoteOnly,
                jobScope
            }, { merge: true });
            toast('הפרופיל עודכן בהצלחה!', 'success');
            setShowPreferencesModal(false);
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'users');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !user?.email) return;
        if (newPassword !== confirmPassword) {
            toast('הסיסמאות החדשות אינן תואמות', 'error');
            return;
        }
        setChangingPassword(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            toast('הסיסמה שונתה בהצלחה!', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Password change error:', error);
            if (error.code === 'auth/invalid-credential') {
                 toast('הסיסמה הנוכחית אינה נכונה.', 'error');
            } else if (error.code === 'auth/weak-password') {
                 toast('הסיסמה החדשה חלשה מדי. אנא בחר סיסמה עם 6 תווים לפחות.', 'error');
            } else {
                 toast('אירעה שגיאה בשינוי הסיסמה. אנא נסה שוב.', 'error');
            }
        } finally {
            setChangingPassword(false);
        }
    };

    const handleCVUpload = async (file: File) => {
        if (!user) return;
        const validation = validateFile(file, maxUserUploadSizeMB);
        if (!validation.valid) {
            toast(validation.error || 'קובץ לא תקין', 'error');
            return;
        }
        setCvUploading(true);
        try {
            const cvRef = ref(storage, `cvs/${user.uid}/profile_${Date.now()}_${file.name}`);
            
            const fileName = file.name.toLowerCase();
            let contentType = file.type || 'application/octet-stream';
            if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
            else if (fileName.endsWith('.doc')) contentType = 'application/msword';
            else if (fileName.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

            const fileBytes = new Uint8Array(await file.arrayBuffer());
            await uploadBytes(cvRef, fileBytes, { contentType });
            
            const cvUrl = window.location.origin + '/file/' + cvRef.fullPath;
            await setDoc(doc(db, 'users', user.uid), { cvUrl }, { merge: true });
            toast('קורות החיים הועלו בהצלחה!', 'success');
        } catch (error: any) {
            console.error('CV Upload Error:', error);
            handleFirestoreError(error, OperationType.UPDATE, 'users');
        } finally {
            setCvUploading(false);
        }
    };

    if (loading) return <FullPageLoading message="טוען נתונים אישיים..." />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20" dir="rtl">
            <Helmet>
                <title>לוח בקרה אישי | עובדים בצ'יק</title>
                <meta name="description" content="אזור אישי למחפשי עבודה. עקבו אחר המועמדויות שלכם, שמרו משרות ונהלו את הפרופיל שלכם." />
            </Helmet>
            {/* Header */}
            <div className="bg-brand-dark text-white pt-24 pb-40 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-brand-teal/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl relative group">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-3xl" />
                                ) : (
                                    <UserIcon size={48} />
                                )}
                                <div className="absolute -bottom-2 -right-2 bg-brand-teal text-white p-2 rounded-xl shadow-lg border-2 border-brand-dark">
                                    <TrendingUp size={16} />
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2">שלום, {user?.displayName || user?.email} 👋</h1>
                                <p className="text-white/60 font-bold flex flex-wrap items-center gap-4 mt-2">
                                    <span className="flex items-center gap-2">
                                        <Sparkles size={18} className="text-brand-orange" />
                                        מחפש עבודה אקטיבי • {appliedJobs.length} פניות שנשלחו
                                    </span>
                                </p>
                                <div className="mt-4 flex gap-3">
                                    {profileCompletionPercentage < 100 ? (
                                        <button 
                                            onClick={() => setActiveTab('profile')}
                                            className="bg-brand-orange hover:bg-brand-orange/90 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                                        >
                                            <AlertTriangle size={16} />
                                            השלם פרופיל ({profileCompletionPercentage}%)
                                        </button>
                                    ) : (!user?.cvUrl && enableCVUploads) ? (
                                        <button 
                                            onClick={() => setActiveTab('profile')}
                                            className="bg-brand-teal hover:bg-brand-teal/90 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                                        >
                                            <Upload size={16} />
                                            העלה קורות חיים
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setActiveTab('matches')}
                                            className="bg-brand-teal hover:bg-brand-teal/90 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                                        >
                                            <Zap size={16} />
                                            מצא לי משרות מתאימות
                                        </button>
                                    )}
                                    {appliedJobs.length > 0 && activeTab !== 'applications' && (
                                        <button 
                                            onClick={() => setActiveTab('applications')}
                                            className="bg-white/10 hover:bg-white/20 text-white py-2 px-5 rounded-xl font-bold text-sm transition-all border border-white/10"
                                        >
                                            בדוק סטטוס מועמדויות
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={signOut}
                                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-6 py-3 rounded-2xl transition-all font-black text-sm border border-white/10 flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                התנתק
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Profile Completion Widget */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
                            <div className="relative w-20 h-20 mb-4">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="4" />
                                    <circle 
                                        cx="18" 
                                        cy="18" 
                                        r="16" 
                                        fill="none" 
                                        className={profileCompletionPercentage === 100 ? "stroke-brand-teal" : "stroke-brand-orange"} 
                                        strokeWidth="4" 
                                        strokeDasharray={`${profileCompletionPercentage}, 100`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center font-black text-lg text-slate-800">
                                    {profileCompletionPercentage}%
                                </div>
                            </div>
                            <h4 className="font-black text-slate-900 mb-2">
                                {profileCompletionPercentage === 100 ? 'הפרופיל שלך מושלם!' : 'השלמת פרופיל'}
                            </h4>
                            <p className="text-sm text-slate-500 font-bold mb-4">
                                {profileCompletionPercentage === 100 
                                    ? 'סיכויי הקבלה שלך בשיאם.' 
                                    : 'פרופיל מלא מגדיל את סיכויי הקבלה שלך ב-40%.'}
                            </p>
                            {profileCompletionPercentage < 100 && (
                                <ul className="text-right text-xs text-slate-600 space-y-2 mb-4 w-full bg-slate-50 p-4 rounded-xl">
                                    {profileFields.map(f => (
                                        <li key={f.key} className="flex items-center justify-between">
                                            <span>{f.label}</span>
                                            {f.isComplete ? (
                                                <CheckCircle size={14} className="text-brand-teal" />
                                            ) : (
                                                <XCircle size={14} className="text-rose-400" />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {profileCompletionPercentage < 100 && activeTab !== 'profile' && (
                                <button 
                                    onClick={() => setActiveTab('profile')}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-black text-sm transition-all"
                                >
                                    השלם חסרים עכשיו
                                </button>
                            )}
                        </div>

                        {[
                            { id: 'applications', label: 'המועמדויות שלי', icon: Send, count: appliedJobs.length },
                            { id: 'saved', label: 'משרות ששמרתי', icon: Heart, count: savedJobs.length },
                            { id: 'matches', label: 'התאמות AI בשבילך', icon: Zap, count: matchedJobs.length },
                            { id: 'profile', label: 'פרופיל אישי', icon: UserIcon }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "w-full flex items-center justify-between p-5 rounded-[1.5rem] transition-all font-black",
                                    activeTab === tab.id 
                                        ? "bg-brand-teal text-white shadow-xl shadow-teal-500/20 scale-105" 
                                        : "bg-white text-slate-500 hover:bg-slate-100/50 border border-slate-100"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <tab.icon size={20} />
                                    <span>{tab.label}</span>
                                </div>
                                {tab.count !== undefined && (
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs",
                                        activeTab === tab.id ? "bg-white/20" : "bg-slate-100"
                                    )}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}

                        <div className="bg-gradient-to-br from-brand-orange to-orange-600 rounded-[2rem] p-8 text-white shadow-xl shadow-orange-500/20">
                            <Sliders className="mb-4" size={32} />
                            <h4 className="text-xl font-black mb-2">התאמה אישית ל-AI</h4>
                            <p className="text-white/80 text-sm font-bold leading-relaxed mb-6">
                                הגדר את ההעדפות שלך כדי שהמערכת תמצא עבורך את המשרות המדויקות ביותר.
                            </p>
                            <button 
                                onClick={() => setShowPreferencesModal(true)}
                                className="w-full bg-white text-brand-orange py-3 rounded-xl font-black text-sm hover:scale-105 transition-transform active:scale-95 shadow-lg"
                            >
                                העדפות חיפוש עבודה
                            </button>
                        </div>

                        {/* Recent Activity */}
                        {activities.length > 0 && (
                            <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                                <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <TrendingUp className="text-brand-teal" size={18} />
                                    פעילות אחרונה
                                </h4>
                                <div className="space-y-4">
                                    {activities.map((activity, idx) => (
                                        <div key={activity.id} className={cn(
                                            "flex gap-4 items-start",
                                            idx !== activities.length - 1 ? "pb-4 border-b border-slate-50" : ""
                                        )}>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                                                <activity.icon size={14} className={activity.type === 'application' ? "text-brand-orange" : "text-brand-teal"} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 leading-tight">{activity.title}</p>
                                                <p className="text-xs text-slate-500 mt-1">{activity.company} • {new Date(activity.date).toLocaleDateString('he-IL')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {activeTab === 'applications' && (
                                <motion.div 
                                    key="apps"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    {appliedJobs.length === 0 ? (
                                        <EmptyState 
                                            title="עדיין לא הגשת מועמדות" 
                                            description="כל משרה שתגיש אליה תופיע כאן עם הסטטוס שלה בזמן אמת."
                                            icon={Briefcase}
                                            action={{
                                                label: "חפש משרה ראשונה",
                                                onClick: () => navigate('/')
                                            }}
                                        />
                                    ) : (
                                        appliedJobs.map(({ job, app }) => (
                                            <div key={app.id} className="bg-white rounded-[2rem] p-5 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 hover:translate-x-2 transition-transform group">
                                                <div className="flex gap-4 md:gap-6 items-center w-full md:w-auto">
                                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-brand-teal/10 transition-colors">
                                                        <Briefcase size={24} className="md:w-7 md:h-7 text-slate-400 group-hover:text-brand-teal transition-colors" />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <h3 className="text-lg md:text-xl font-black text-slate-900 mb-1 truncate">{job.title}</h3>
                                                        <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs md:text-sm font-bold">
                                                            <span className="truncate">{job.companyName}</span>
                                                            <span className="hidden md:block w-1 h-1 bg-slate-200 rounded-full" />
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <Calendar size={12} className="md:w-3.5 md:h-3.5" />
                                                                {new Date(app.createdAt).toLocaleDateString('he-IL')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 md:gap-6 justify-between md:justify-end w-full md:w-auto border-t md:border-t-0 md:border-r border-slate-50 pt-4 md:pt-0 md:pr-6">
                                                    <div className="text-right">
                                                        <div className={cn(
                                                            "px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-2",
                                                            app.status === ApplicationStatus.NEW ? "bg-blue-50 text-blue-600" :
                                                            app.status === ApplicationStatus.REVIEWING ? "bg-yellow-50 text-yellow-600" :
                                                            app.status === ApplicationStatus.INTERVIEW ? "bg-purple-50 text-purple-600" :
                                                            app.status === ApplicationStatus.HIRED ? "bg-green-50 text-green-600" :
                                                            app.status === ApplicationStatus.REJECTED ? "bg-red-50 text-red-600" :
                                                            "bg-slate-50 text-slate-400"
                                                        )}>
                                                            {app.status === ApplicationStatus.NEW && <Send size={12} className="md:w-3.5 md:h-3.5" />}
                                                            {app.status === ApplicationStatus.REVIEWING && <Clock size={12} className="md:w-3.5 md:h-3.5" />}
                                                            {app.status === ApplicationStatus.INTERVIEW && <Eye size={12} className="md:w-3.5 md:h-3.5" />}
                                                            {app.status === ApplicationStatus.HIRED && <CheckCircle size={12} className="md:w-3.5 md:h-3.5" />}
                                                            {app.status === ApplicationStatus.REJECTED && <XCircle size={12} className="md:w-3.5 md:h-3.5" />}
                                                            
                                                            {app.status === ApplicationStatus.NEW ? 'חדש' :
                                                             app.status === ApplicationStatus.REVIEWING ? 'בבחינה' :
                                                             app.status === ApplicationStatus.INTERVIEW ? 'ראיון' :
                                                             app.status === ApplicationStatus.HIRED ? 'התקבל!' :
                                                             app.status === ApplicationStatus.REJECTED ? 'נדחה' : 'סטטוס'}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => navigate(`/job/${job.id}`)}
                                                        className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 hover:bg-brand-teal hover:text-white transition-all shadow-sm shrink-0"
                                                    >
                                                        <ExternalLink size={18} className="md:w-5 md:h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'saved' && (
                                <motion.div 
                                    key="saved"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                                >
                                    {savedJobs.length === 0 ? (
                                        <div className="col-span-full">
                                            <EmptyState 
                                                title="אין משרות שמורות" 
                                                description="שמור משרות שמעניינות אותך כדי לחזור אליהן מאוחר יותר."
                                                icon={Heart}
                                                action={{
                                                    label: "חזרה לדף הבית",
                                                    onClick: () => navigate('/')
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        savedJobs.map(job => (
                                            <JobCard key={job.id} job={job} isSaved={true} />
                                        ))
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'profile' && (
                                <motion.div 
                                    key="profile"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-8"
                                >
                                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                                        {/* Personal Details */}
                                        <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                                <UserIcon className="text-brand-teal" />
                                                פרטים אישיים
                                            </h3>
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-black text-slate-700 pr-2">שם מלא</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold shadow-inner"
                                                            value={displayName}
                                                            onChange={(e) => setDisplayName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-black text-slate-700 pr-2">טלפון</label>
                                                        <input 
                                                            type="tel" 
                                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold shadow-inner"
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-black text-slate-700 pr-2">אימייל (לקריאה בלבד)</label>
                                                    <input 
                                                        disabled
                                                        type="email" 
                                                        className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl text-slate-400 font-bold cursor-not-allowed font-sans text-left"
                                                        value={user?.email}
                                                        dir="ltr"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-black text-slate-700 pr-2">קצת עלי (Bio)</label>
                                                    <textarea 
                                                        rows={4}
                                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold shadow-inner resize-none transition-all"
                                                        placeholder="ספר קצת על הניסיון והשאיפות שלך..."
                                                        value={bio}
                                                        onChange={(e) => setBio(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end p-4">
                                            <button 
                                                type="submit"
                                                disabled={updatingProfile}
                                                className="bg-brand-teal text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50 text-lg"
                                            >
                                                {updatingProfile ? 'מעדכן...' : 'שמור שינויים'}
                                            </button>
                                        </div>
                                    </form>

                                    {enableCVUploads && (
                                        <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                                    <FileText className="text-brand-orange" />
                                                    ניהול קורות חיים
                                                </h3>
                                                {user?.cvUrl && (
                                                    <a 
                                                        href={getFileUrl(user.cvUrl)} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="bg-brand-teal/10 text-brand-teal px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-brand-teal/20 transition-all"
                                                    >
                                                        <ExternalLink size={18} />
                                                        צפה בקובץ הנוכחי
                                                    </a>
                                                )}
                                            </div>

                                            <div className="relative group">
                                                <input 
                                                    type="file" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => e.target.files?.[0] && handleCVUpload(e.target.files[0])}
                                                />
                                                <div className="border-4 border-dashed border-slate-50 rounded-[2rem] p-12 text-center group-hover:border-brand-teal transition-all bg-slate-50/50">
                                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                                                        <Upload size={32} className={cvUploading ? "text-slate-300 animate-bounce" : "text-brand-teal"} />
                                                    </div>
                                                    <p className="font-black text-slate-900 mb-1">
                                                        {cvUploading ? 'מעלה קובץ עכשיו...' : 'לחץ להעלאת קורות חיים חדשים'}
                                                    </p>
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">PDF, DOCX עד {maxUserUploadSizeMB}MB</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mt-8">
                                        <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                            <Lock className="text-brand-teal" />
                                            שינוי סיסמה
                                        </h3>
                                        
                                        {!linkedProviders.includes('password') ? (
                                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 font-bold">
                                                חשבונך מוגדר באמצעות התחברות חיצונית (למשל Google) ולכן לא ניתן להחליף סיסמה מעמוד זה.
                                            </div>
                                        ) : (
                                            <form onSubmit={handleChangePassword} className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-black text-slate-700 pr-2">סיסמה נוכחית</label>
                                                <input 
                                                    type="password" 
                                                    required
                                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold shadow-inner"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-black text-slate-700 pr-2">סיסמה חדשה</label>
                                                    <input 
                                                        type="password" 
                                                        required
                                                        minLength={6}
                                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold shadow-inner"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-black text-slate-700 pr-2">אימות סיסמה חדשה</label>
                                                    <input 
                                                        type="password"
                                                        required
                                                        minLength={6}
                                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold shadow-inner"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                disabled={changingPassword}
                                                type="submit"
                                                className="bg-brand-dark text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {changingPassword ? 'משנה סיסמה...' : 'עדכן סיסמה'}
                                            </button>
                                        </form>
                                        )}
                                    </div>

                                    {/* Linked Accounts */}
                                    <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mt-8">
                                        <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                            <ShieldCheck className="text-brand-teal" />
                                            שיטות התחברות לחשבון
                                        </h3>
                                        
                                        <div className="flex flex-col gap-6">
                                            {/* Google Account */}
                                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
                                                        <svg viewBox="0 0 24 24" className="w-full h-full">
                                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-lg">Google</div>
                                                        <div className="text-sm text-slate-500">התחברות באמצעות חשבון Google</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={linkedProviders.includes('google.com') ? handleUnlinkGoogle : handleLinkGoogle}
                                                    disabled={isLinking}
                                                    className={cn(
                                                        "px-6 py-3 rounded-xl font-bold transition-all border-2",
                                                        linkedProviders.includes('google.com') 
                                                            ? "border-rose-100 text-rose-600 hover:bg-rose-50"
                                                            : "border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                                                    )}
                                                >
                                                    {isLinking ? 'אנא המתן...' : linkedProviders.includes('google.com') ? 'נתק חשבון' : 'קשר חשבון'}
                                                </button>
                                            </div>

                                            {/* Email Password */}
                                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-800">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-lg">אימייל וסיסמה</div>
                                                        <div className="text-sm text-slate-500">התחברות באמצעות האימייל שלך</div>
                                                    </div>
                                                </div>
                                                {linkedProviders.includes('password') ? (
                                                    <div className="px-6 py-3 rounded-xl font-bold bg-slate-200/50 text-slate-500 cursor-not-allowed">
                                                        מחובר
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-400 cursor-not-allowed">
                                                        לא מחובר
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Account */}
                                    <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mt-8 mb-12">
                                        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                            <ShieldCheck className="text-brand-orange" />
                                            פרטיות וניהול חשבון
                                        </h3>
                                        
                                        <div className="space-y-6 text-slate-600 font-medium pb-8 border-b border-slate-100">
                                            <p className="flex items-start gap-2">
                                                <Eye className="text-brand-teal shrink-0 mt-1" size={18} />
                                                <span><strong className="text-slate-800">מי יכול לראות את הפרופיל שלי?</strong> רק מעסיקים שהגשת אליהם מועמדות יוכלו לצפות בפרטיך המלאים (לרבות קורות חיים ופרטי קשר). הפרופיל אינו חשוף באופן ציבורי בחיפוש.</span>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <AlertTriangle className="text-brand-orange shrink-0 mt-1" size={18} />
                                                <span><strong className="text-slate-800">מה נמחק במחיקת חשבון?</strong> מחיקת החשבון הינה פעולה בלתי הפיכה. ברגע שהחשבון יימחק: פרטיך האישיים יוסרו מהמערכת, קורות החיים שלך יימחקו משרתינו, והיסטוריית המועמדויות והמשרות ששמרת תאבד לחלוטין.</span>
                                            </p>
                                        </div>

                                        <div className="mt-8 flex justify-center text-center">
                                            {!showDeleteConfirm ? (
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="bg-white text-rose-600 hover:bg-rose-50 px-6 py-3 rounded-2xl font-black transition-colors border-2 border-rose-100"
                                                >
                                                    מחיקת חשבון לצמיתות
                                                </button>
                                            ) : (
                                                <div className="bg-rose-50 rounded-3xl p-8 border border-rose-200 mt-6 max-w-lg w-full text-center shadow-inner">
                                                    <AlertTriangle className="text-rose-500 w-12 h-12 mx-auto mb-4" />
                                                    <h4 className="text-xl font-black text-rose-900 mb-2">אזור מסוכן - אישור מחיקה</h4>
                                                    <p className="text-rose-800 font-medium mb-8">האם אתה בטוח? מחיקת החשבון הינה פעולה בלתי הפיכה.</p>
                                                    {linkedProviders.includes('password') && (
                                                        <div className="mb-6 relative max-w-sm mx-auto">
                                                            <label className="block text-right text-sm font-bold text-rose-900 mb-2">הזן סיסמה לאימות</label>
                                                            <input 
                                                                type="password"
                                                                value={deletePassword}
                                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                                placeholder="סיסמת החשבון שלך"
                                                                className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-slate-800"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                                                        <button
                                                            onClick={handleDeleteAccount}
                                                            disabled={isDeleting}
                                                            className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
                                                        >
                                                            {isDeleting ? 'מוחק...' : 'כן, מחק חשבון'}
                                                        </button>
                                                        <button
                                                            onClick={() => setShowDeleteConfirm(false)}
                                                            disabled={isDeleting}
                                                            className="bg-white text-slate-700 px-8 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                                                        >
                                                            ביטול חזרה לעמוד
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            
                            {activeTab === 'matches' && (
                                <motion.div 
                                    key="matches"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-brand-teal text-white rounded-[2rem] p-6 md:p-10 shadow-xl shadow-teal-500/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2" />
                                        <div className="relative z-10 text-right">
                                            <h3 className="text-3xl font-black mb-4 flex items-center gap-3 justify-start">
                                                <Zap className="text-brand-orange fill-brand-orange" />
                                                משרות שמתאימות בדיוק לך
                                            </h3>
                                            <p className="text-white/80 font-bold mb-0">
                                                המערכת שלנו ניתחה את הפרופיל שלך ומצאה {matchedJobs.length} משרות חדשות שמתאימות לכישורים שלך.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                        {matchedJobs.length === 0 ? (
                                            <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-100">
                                                <Sparkles size={48} className="mx-auto text-slate-200 mb-4" />
                                                <h3 className="text-xl font-black text-slate-900 mb-2">אין התאמות כרגע</h3>
                                                <p className="text-slate-500 font-bold">נסה להגיש מועמדות למשרות כדי שנוכל ללמוד מה מעניין אותך.</p>
                                            </div>
                                        ) : (
                                            matchedJobs.map(job => (
                                                <JobCard key={job.id} job={job} isSaved={user.savedJobs?.includes(job.id)} />
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <Modal isOpen={showPreferencesModal} onClose={() => setShowPreferencesModal(false)} title="התאמה אישית למנוע ה-AI">
                <form onSubmit={handleUpdateProfile} className="space-y-8 pb-4">
                    <p className="text-slate-500 font-bold mb-4">
                        מערכת ה-AI שלנו משתמשת בהעדפות אלו כדי להתאים במיוחד עבורך הצעות מדויקות יותר.
                    </p>

                    {/* Status */}
                    <div className="space-y-4">
                        <label className="text-sm font-black text-slate-700 pr-2">סטטוס חיפוש</label>
                        <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                            {(['active', 'open', 'inactive'] as const).map(status => {
                                const labels = {
                                    active: 'מחפש באופן אקטיבי',
                                    open: 'פתוח להצעות בלבד',
                                    inactive: 'לא מחפש כרגע'
                                };
                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setJobSeekingStatus(status)}
                                        className={cn(
                                            "flex-1 py-3 text-sm font-bold rounded-xl transition-all relative z-10",
                                            jobSeekingStatus === status 
                                                ? "bg-white text-brand-teal shadow-md shadow-slate-200/50" 
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                                        )}
                                    >
                                        {labels[status]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-4">
                        <label className="text-sm font-black text-slate-700 pr-2">תחומי עניין (תפקידים רלוונטיים)</label>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4">
                            <div className="relative">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="text"
                                    placeholder="חפש תפקיד או תחום..."
                                    className="w-full pl-6 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold transition-all"
                                    value={categorySearchQuery}
                                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                {globalTags
                                    .filter(cat => cat.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                                    .map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            if (preferredCategories.includes(cat)) {
                                                setPreferredCategories(preferredCategories.filter(c => c !== cat));
                                            } else {
                                                setPreferredCategories([...preferredCategories, cat]);
                                            }
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-xl font-bold border transition-all",
                                            preferredCategories.includes(cat)
                                                ? "bg-brand-teal text-white border-brand-teal shadow-lg shadow-teal-500/20"
                                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                                {globalTags
                                    .filter(cat => cat.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 && (
                                        <p className="text-slate-500 font-bold p-4 text-center w-full">לא נמצאו תחומי עניין התואמים לחיפוש.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-black text-slate-700 pr-2">מיקום ומרחק</label>
                            <label className="flex items-center gap-2 cursor-pointer group text-sm font-bold text-slate-600">
                                <input 
                                    type="checkbox"
                                    className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal"
                                    checked={remoteOnly}
                                    onChange={(e) => setRemoteOnly(e.target.checked)}
                                />
                                <span>מעדיף עבודה מהבית (Remote)</span>
                            </label>
                        </div>
                        {!remoteOnly && (
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <input 
                                    type="text" 
                                    placeholder="חפש לפי עיר (לדוג': תל אביב, חיפה)..."
                                    className="w-full sm:w-2/3 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-brand-teal/10 outline-none text-slate-700 font-bold shadow-inner"
                                    value={preferredLocations[0] || ''}
                                    onChange={(e) => setPreferredLocations([e.target.value])}
                                />
                                <div className="w-full sm:w-1/3 flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl shadow-inner text-slate-700 font-bold">
                                    <span className="text-sm whitespace-nowrap">עד {preferredDistance} ק״מ</span>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        className="w-full accent-brand-teal"
                                        value={preferredDistance}
                                        onChange={(e) => setPreferredDistance(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Job Scope */}
                    <div className="space-y-4">
                        <label className="text-sm font-black text-slate-700 pr-2">היקף משרה מצופה</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {["משרה מלאה", "משרה חלקית", "משרת אם/אב", "משמרות", "סטודנטים", "זמנית/פרויקטלית", "פרילנס"].map(scope => (
                                <label key={scope} className={cn(
                                    "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all font-bold text-sm",
                                    jobScope.includes(scope)
                                        ? "border-brand-teal bg-brand-teal/5 text-brand-dark"
                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                )}>
                                    <input 
                                        type="checkbox"
                                        className="w-4 h-4 text-brand-teal rounded border-slate-300 focus:ring-brand-teal"
                                        checked={jobScope.includes(scope)}
                                        onChange={(e) => {
                                            if (e.target.checked) setJobScope([...jobScope, scope]);
                                            else setJobScope(jobScope.filter(s => s !== scope));
                                        }}
                                    />
                                    {scope}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            type="submit"
                            disabled={updatingProfile}
                            className="bg-brand-teal text-white w-full sm:w-auto px-12 py-4 rounded-2xl font-black shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50 text-lg hover:scale-105"
                        >
                            {updatingProfile ? 'שומר העדפות...' : 'רענן תוצאות'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SeekerDashboard;
