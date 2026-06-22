import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updateDoc } from 'firebase/firestore';
import { trackEvent } from '../lib/analytics';
import { auth, db } from '../lib/firebase';
import { UserRole, User } from '../types';
import { Briefcase, User as UserIcon, Mail, Lock, Chrome, Rocket, ArrowRight, Bot, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SEEKER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  const { user: authUser, loading: authLoading } = useAuth();

  const isIframe = window.self !== window.top;
  const isIPad = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /iPad|iPhone|iPod/.test(navigator.userAgent);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    // If the user object exists from AuthContext, they are already authenticated.
    if (!authLoading && authUser) {
      const savedRedirect = sessionStorage.getItem('google_auth_redirect') || redirectPath;
      sessionStorage.removeItem('google_auth_redirect');
      
      const userRole = authUser.role;
      if (savedRedirect === '/') {
        if (userRole === UserRole.SEEKER) navigate('/seeker/dashboard');
        else if (userRole === UserRole.EMPLOYER) navigate('/employer/dashboard');
        else if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) navigate('/admin');
        else navigate('/');
      } else {
        navigate(savedRedirect);
      }
    }
  }, [authUser, authLoading, navigate, redirectPath]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!emailRegex.test(email)) {
        setError('אנא הזן כתובת אימייל תקינה');
        setLoading(false);
        return;
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const fullDisplayName = `${firstName} ${lastName}`.trim();
      await updateProfile(user, { displayName: fullDisplayName });

      const isSelfAdmin = user.email === 'eliav4022@gmail.com';
      const newUser: User = {
        id: user.uid,
        uid: user.uid,
        email: user.email!,
        fullName: fullDisplayName,
        displayName: fullDisplayName,
        role: isSelfAdmin ? UserRole.ADMIN : role,
        status: 'Active',
        permissions: isSelfAdmin ? ['ALL'] : [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), newUser);
      
      trackEvent({ type: 'register' as any, metadata: { role, method: 'email' } });

      // Create separate profile based on role
      if (role === UserRole.SEEKER) {
        await setDoc(doc(db, `users/${user.uid}/profiles/seeker`), {
          userId: user.uid,
          bio: '',
          cvUrl: '',
          skills: [],
          savedJobIds: [],
        });
      } else if (role === UserRole.EMPLOYER) {
        await setDoc(doc(db, `users/${user.uid}/profiles/employer`), {
          userId: user.uid,
          position: '',
          companyId: null,
          isPrimaryContact: true,
        });
      }

      if (redirectPath === '/') {
        if (role === UserRole.SEEKER) navigate('/seeker/dashboard');
        else if (role === UserRole.EMPLOYER) navigate('/employer/dashboard');
        else navigate('/');
      } else {
        navigate(redirectPath);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('התחברות עם אימייל וסיסמה כבויה בפיירבייס. עליך להפעיל אותה ב-Firebase Console תחת Authentication > Sign-in method, או להשתמש בהתחברות גוגל.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('החשבון כבר קיים. אנא עבור למסך ההתחברות.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isMobile = isIPad || /Mobi|Android|iPhone|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    
    try {
      const { user } = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const isSelfAdmin = user.email === 'eliav4022@gmail.com';
        const newUser: User = {
          id: user.uid,
          uid: user.uid,
          email: user.email!,
          fullName: user.displayName || '',
          displayName: user.displayName || '',
          role: isSelfAdmin ? UserRole.ADMIN : role,
          status: 'Active',
          permissions: isSelfAdmin ? ['ALL'] : [],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        await setDoc(userRef, newUser);
        trackEvent({ type: 'register' as any, metadata: { role, method: 'google' } });

        if (role === UserRole.SEEKER) {
          await setDoc(doc(db, `users/${user.uid}/profiles/seeker`), {
            userId: user.uid,
            bio: '',
            cvUrl: '',
            skills: [],
            savedJobIds: [],
          });
        } else if (role === UserRole.EMPLOYER) {
          await setDoc(doc(db, `users/${user.uid}/profiles/employer`), {
            userId: user.uid,
            position: '',
            companyId: null,
            isPrimaryContact: true,
          });
        }
      } else {
        await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
        trackEvent({ type: 'login' as any, metadata: { method: 'google', isNewUser: false } });
      }

      if (redirectPath === '/') {
        const finalRole = userDoc.exists() ? userDoc.data().role : role;
        if (finalRole === UserRole.SEEKER) navigate('/seeker/dashboard');
        else if (finalRole === UserRole.EMPLOYER) navigate('/employer/dashboard');
        else navigate('/');
      } else {
        navigate(redirectPath);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err.code, err.message, err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('חלון ההתחברות נסגר לפני סיום ההרשמה. נסה שוב.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('חלון ההרשמה נחסם על ידי הדפדפן. אנא אפשר חלונות קופצים (Popups) תחת בסרגל הכתובת.');
      } else {
        setError(`שגיאה בהתחברות דרך גוגל (${err.code || 'לא ידוע'}): ${err.message}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
      <Helmet>
        <title>הרשמה | עובדים בצ'יק</title>
        <meta name="description" content="הירשם עכשיו לעובדים בצ'יק והתחל למצוא את המשרה הבאה שלך או לגייס עובדים מעולים." />
      </Helmet>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10 relative z-10">
          <div className="text-center mb-8 md:mb-10">
            <Link to="/" className="inline-flex items-center justify-center p-4 bg-brand-dark text-white rounded-2xl mb-6 shadow-xl shadow-slate-900/10 hover:scale-105 transition-transform">
              <Rocket size={32} />
            </Link>
            <h2 className="text-3xl font-black text-slate-900 mb-2">ברוכים הבאים 🌈</h2>
            <p className="text-slate-500 font-bold">הצטרפו לאלפי מחפשי עבודה ומעסיקים</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 font-bold text-right flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</div>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-right">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="firstName" className="block text-xs font-black text-slate-400 uppercase pr-2">שם פרטי</label>
                  <div className="relative group">
                    <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-teal transition-colors" size={20} />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal transition-all outline-none text-right font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                      placeholder="ישראל"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="lastName" className="block text-xs font-black text-slate-400 uppercase pr-2">שם משפחה</label>
                  <div className="relative group">
                    <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-teal transition-colors" size={20} />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal transition-all outline-none text-right font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                      placeholder="ישראלי"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-black text-slate-400 uppercase pr-2">אימייל</label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-teal transition-colors" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal transition-all outline-none text-right font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase pr-2">סיסמה</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-teal transition-colors" size={20} />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal transition-all outline-none text-right font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                      placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-black text-slate-400 uppercase pr-2">מי אתם?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.SEEKER)}
                  className={cn(
                    "py-4 px-4 rounded-2xl border-2 text-sm font-black transition-all",
                    role === UserRole.SEEKER
                      ? "bg-brand-teal/5 border-brand-teal text-brand-teal shadow-xl shadow-teal-500/10"
                      : "bg-white border-slate-50 text-slate-500 hover:border-slate-200"
                  )}
                >
                  محפש עבודה 💼
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.EMPLOYER)}
                  className={cn(
                    "py-4 px-4 rounded-2xl border-2 text-sm font-black transition-all",
                    role === UserRole.EMPLOYER
                      ? "bg-brand-orange/5 border-brand-orange text-brand-orange shadow-xl shadow-orange-500/10"
                      : "bg-white border-slate-50 text-slate-500 hover:border-slate-200"
                  )}
                >
                  מעסיק 📢
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4 pr-3 pt-4">
                <input 
                    required 
                    type="checkbox" 
                    id="terms" 
                    className="mt-1 w-5 h-5 accent-brand-teal rounded border-slate-300 shadow-sm cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-slate-500 font-bold leading-tight cursor-pointer">
                    אני מאשר/ת שקראתי והבנתי את <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">תנאי השימוש</Link> ואת <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">מדיניות הפרטיות</Link> של האתר ומסכים/ה להם.
                </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-dark text-white font-black py-4 rounded-2xl hover:bg-slate-900 transition-all disabled:opacity-50 mt-4 shadow-xl shadow-slate-900/20 active:scale-95 text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  <>הרשמה עכשיו 👋</>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            כבר יש לכם חשבון?{' '}
            <Link to={`/login${location.search}`} className="text-brand-teal font-black hover:underline underline-offset-4">
              התחברו כאן
            </Link>
          </div>
        </div>
        
        <div className="mt-12 flex justify-center items-center gap-4 text-slate-300">
            <Bot size={20} />
            <span className="text-xs font-bold">העוזר החכם שלנו יכול לעזור לכם למלא את הפרופיל</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
