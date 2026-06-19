import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { trackEvent } from '../lib/analytics';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types';
import { Briefcase, Mail, Lock, Chrome, Rocket, ArrowLeft, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

let loginRedirectPromise: Promise<any> | null = null;
const getLoginRedirectResult = () => {
  if (!loginRedirectPromise) {
    loginRedirectPromise = getRedirectResult(auth);
  }
  return loginRedirectPromise;
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    let active = true;
    const checkRedirectResult = async () => {
      try {
        const result = await getLoginRedirectResult();
        if (result && active) {
          setLoading(true);
          const user = result.user;
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          const savedRedirect = sessionStorage.getItem('google_auth_redirect') || redirectPath;
          sessionStorage.removeItem('google_auth_redirect');

          if (!userDoc.exists()) {
            const isSelfAdmin = user.email === 'eliav4022@gmail.com';
            const newUser: User = {
              id: user.uid,
              uid: user.uid,
              email: user.email!,
              fullName: user.displayName || '',
              displayName: user.displayName || '',
              role: isSelfAdmin ? UserRole.ADMIN : UserRole.SEEKER,
              status: 'Active',
              permissions: isSelfAdmin ? ['ALL'] : [],
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };

            await setDoc(userRef, newUser);

            await setDoc(doc(db, `users/${user.uid}/profiles/seeker`), {
              userId: user.uid,
              bio: '',
              cvUrl: '',
              skills: [],
              savedJobIds: [],
            });
            trackEvent({ type: 'register' as any, metadata: { role: UserRole.SEEKER, method: 'google-redirect' } });
          } else {
            await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
            trackEvent({ type: 'login' as any, metadata: { method: 'google-redirect', isNewUser: false } });
          }

          if (savedRedirect === '/') {
            const role = userDoc.exists() ? userDoc.data().role : UserRole.SEEKER;
            if (role === UserRole.SEEKER) navigate('/seeker/dashboard');
            else if (role === UserRole.EMPLOYER) navigate('/employer/dashboard');
            else if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) navigate('/admin');
            else navigate('/');
          } else {
            navigate(savedRedirect);
          }
        }
      } catch (err: any) {
        console.error('Google Redirect result error:', err);
        if (active) {
          setError(`שגיאה בהתחברות דרך גוגל (${err.code || 'לא ידוע'}): ${err.message}`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkRedirectResult();
    return () => {
      active = false;
    };
  }, [navigate, redirectPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (redirectPath === '/') {
        const docRef = doc(db, 'users', userCredential.user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const role = docSnap.data().role;
          
          await setDoc(docRef, { lastLogin: new Date().toISOString() }, { merge: true });
          trackEvent({ type: 'login' as any, metadata: { role, method: 'email' } });
          
          if (role === UserRole.SEEKER) navigate('/seeker/dashboard');
          else if (role === UserRole.EMPLOYER) navigate('/employer/dashboard');
          else if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) navigate('/admin');
          else navigate('/');
        } else {
          navigate('/seeker/dashboard');
        }
      } else {
        await setDoc(doc(db, 'users', userCredential.user.uid), { lastLogin: new Date().toISOString() }, { merge: true });
        trackEvent({ type: 'login' as any, metadata: { method: 'email', withRedirect: true } });
        navigate(redirectPath);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('התחברות עם אימייל וסיסמה כבויה בפיירבייס. עליך להפעיל אותה ב-Firebase Console תחת Authentication > Sign-in method, או להשתמש בהתחברות גוגל.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('אימייל או סיסמה שגויים.');
      } else {
        setError('שגיאה בהתחברות. וודא שהפעלת את אפשרות ה-Email/Password ב-Firebase Console.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent);
    
    if (isMobile) {
      try {
        sessionStorage.setItem('google_auth_redirect', redirectPath);
        await signInWithRedirect(auth, provider);
      } catch (err: any) {
        console.error('Google redirect sign-in error:', err);
        setError(`שגיאה בהפעלת התחברות גוגל: ${err.message}`);
        setLoading(false);
      }
    } else {
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
            role: isSelfAdmin ? UserRole.ADMIN : UserRole.SEEKER,
            status: 'Active',
            permissions: isSelfAdmin ? ['ALL'] : [],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };

          await setDoc(userRef, newUser);

          await setDoc(doc(db, `users/${user.uid}/profiles/seeker`), {
            userId: user.uid,
            bio: '',
            cvUrl: '',
            skills: [],
            savedJobIds: [],
          });
        } else {
          await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
          trackEvent({ type: 'login' as any, metadata: { method: 'google', isNewUser: false } });
        }
        
        if (redirectPath === '/') {
          const role = userDoc.exists() ? userDoc.data().role : UserRole.SEEKER;
          if (role === UserRole.SEEKER) navigate('/seeker/dashboard');
          else if (role === UserRole.EMPLOYER) navigate('/employer/dashboard');
          else if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) navigate('/admin');
          else navigate('/');
        } else {
          navigate(redirectPath);
        }
      } catch (err: any) {
        console.error('Google sign-in error:', err.code, err.message, err);
        if (err.code === 'auth/popup-closed-by-user') {
          setError('חלון ההתחברות נסגר לפני סיום תהליך ההתחברות. נסה שוב.');
        } else {
          setError(`שגיאה בהתחברות דרך גוגל (${err.code || 'לא ידוע'}): ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
      <Helmet>
        <title>התחברות | עובדים בצ'יק</title>
        <meta name="description" content="התחבר לחשבון שלך בעובדים בצ'יק כדי לנהל מועמדויות או לפרסם משרות חדשות." />
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
            <h2 className="text-3xl font-black text-slate-900 mb-2">ברוכים השבים 👋</h2>
            <p className="text-slate-500 font-bold">התחברו כדי למצוא את המשרה הבאה בצ'יק</p>
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

          <form onSubmit={handleLogin} className="space-y-5 text-right">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-black text-slate-400 uppercase pr-2">אימייל</label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-teal transition-colors" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full pr-12 pl-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal transition-all outline-none text-right font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
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
                  className="w-full pr-12 pl-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal transition-all outline-none text-right font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" className="text-sm text-brand-teal hover:text-brand-teal-dark font-bold hover:underline transition-all">
                  שכחת סיסמה?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange text-white font-black py-4 rounded-2xl hover:bg-orange-600 transition-all disabled:opacity-50 mt-4 shadow-xl shadow-orange-500/20 active:scale-95 text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  <>התחברות בצ'יק 🚀</>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white text-slate-400 font-black tracking-widest uppercase">או</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 border-2 border-slate-50 rounded-2xl hover:bg-slate-50 transition-all text-sm font-black text-slate-700 shadow-sm"
            >
              <Chrome size={20} className="text-blue-500" />
              כניסה עם גוגל
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-400 font-bold mb-4">עוד לא חברים?</p>
            <Link 
                to={`/register${location.search}`} 
                className="inline-flex items-center gap-2 text-brand-teal font-black hover:gap-3 transition-all"
            >
               יצירת חשבון חדש
               <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
        
        <div className="mt-12 flex justify-center items-center gap-4 text-slate-300">
            <Bot size={20} />
            <span className="text-xs font-bold">צריכים עזרה? העוזר החכם שלנו מחכה לכם באתר</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
