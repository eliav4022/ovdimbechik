import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ArrowRight, Mail, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      // Create native Firebase password reset flow
      const actionCodeSettings = {
        url: window.location.origin + '/login', // Fallback redirect if they use default Firebase page
        handleCodeInApp: false
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);

      // Create a record in password_resets for audit/custom req as requested
      const resetId = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, 'password_resets', resetId), {
        email,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        used: false,
        status: 'sent_via_firebase'
      });

      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Obscure error for security
        setSuccess(true); 
      } else {
        setError(err.message || 'אירעה שגיאה. אנא נסה שנית.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
      <Helmet>
        <title>איפוס סיסמה | עובדים בצ'יק</title>
      </Helmet>
      
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden relative z-10 p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-brand-teal/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3">
            <Key size={32} className="text-brand-teal -rotate-3" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">שכחת סיסמה?</h2>
          <p className="mt-3 text-slate-500 font-medium">הזן את כתובת התקשורת שלך ונשלח לך קישור לאיפוס סיסמה.</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border-2 border-green-100 p-6 rounded-2xl text-center"
          >
            <Mail className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-black text-green-800 mb-2">קישור לאיפוס נשלח!</h3>
            <p className="text-green-700 font-medium text-sm">
              אם הכתובת {email} קיימת במערכת, תקבל הודעת אימייל עם הוראות לאיפוס הסיסמה.
            </p>
            <div className="mt-8">
               <Link 
                  to="/login"
                  className="bg-green-600 hover:bg-green-700 text-white font-black py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg inline-block"
               >
                 חזרה להתחברות
               </Link>
            </div>
          </motion.div>
        ) : (
          <form className="space-y-6" onSubmit={handleResetPassword}>
            {error && (
              <div className="bg-red-50 text-red-500 text-sm font-bold p-4 rounded-xl border border-red-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-black text-slate-700">אימייל</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-4 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-brand-teal transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-md text-sm font-black text-white bg-brand-teal hover:bg-brand-teal-dark hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'שליחת קישור איפוס'
              )}
            </button>

            <div className="text-center pt-4 border-t-2 border-slate-50">
              <Link 
                  to="/login"
                  className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-brand-teal transition-all group"
              >
                 <ArrowRight size={18} className="group-hover:-translate-x-1 transition-transform" />
                 חזרה להתחברות
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
