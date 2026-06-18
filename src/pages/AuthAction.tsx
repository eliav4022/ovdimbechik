import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Helmet } from 'react-helmet-async';
import { Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthAction = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (mode === 'resetPassword' && oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then(() => {
          setVerifying(false);
        })
        .catch((err) => {
          setError('הקישור לאיפוס סיסמה פג תוקף או שאינו תקין. אנא בקש קישור חדש.');
          setVerifying(false);
        });
    } else {
       setError('פעולה לא חוקית או קישור פגום.');
       setVerifying(false);
    }
  }, [mode, oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !newPassword || newPassword.length < 6) {
       setError('יש להזין סיסמה בת 6 תווים לפחות.');
       return;
    }
    setLoading(true);
    setError('');
    
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'שגיאה באיפוס הסיסמה.');
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
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">איפוס סיסמה</h2>
        </div>

        {verifying ? (
           <div className="flex flex-col items-center justify-center py-8">
             <Loader2 className="w-8 h-8 text-brand-teal animate-spin mb-4" />
             <p className="text-slate-500 font-medium">מאמת את הקישור...</p>
           </div>
        ) : error && !success ? (
           <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-800 mb-2">שגיאה</h3>
              <p className="text-red-600 font-medium mb-6">{error}</p>
              <button onClick={() => navigate('/forgot-password')} className="bg-red-100 text-red-700 font-bold py-2 px-6 rounded-xl hover:bg-red-200 transition-colors">
                 בקש איפוס מחדש
              </button>
           </div>
        ) : success ? (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-green-800 mb-2">הסיסמה שונתה בהצלחה!</h3>
              <p className="text-green-600 font-medium">מעביר אותך לעמוד ההתחברות...</p>
           </div>
        ) : (
            <form className="space-y-6" onSubmit={handleReset}>
                <div className="space-y-2">
                    <label htmlFor="newPassword" className="block text-sm font-black text-slate-700">סיסמה חדשה</label>
                    <input
                        id="newPassword"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-brand-teal transition-all font-medium"
                        placeholder="מינימום 6 תווים"
                        minLength={6}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || newPassword.length < 6}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-md text-sm font-black text-white bg-brand-teal hover:bg-brand-teal-dark hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        'שמור סיסמה חדשה'
                    )}
                </button>
            </form>
        )}
      </motion.div>
    </div>
  );
};

export default AuthAction;
