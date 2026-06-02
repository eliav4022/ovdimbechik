import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MessageSquare, Mail, Phone, MapPin, Send, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingSpinner } from '../components/ui/Loading';
import { trackEvent } from '../lib/analytics';
import { sendInquiry } from '../services/inquiryService';

const Contact: React.FC = () => {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [senderName, setSenderName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [subject, setSubject] = useState('אני מחפש עבודה וזקוק לעזרה');
    const [message, setMessage] = useState('');
    const [contactEmail, setContactEmail] = useState('Ovdimbechik@gmail.com');

    useEffect(() => {
        const fetchSettings = async () => {
             const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
             if (settingsDoc.exists() && settingsDoc.data().contactEmail) {
                 setContactEmail(settingsDoc.data().contactEmail);
             }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        trackEvent({
            type: 'contact_click',
            metadata: {
                location: 'contact_page'
            }
        });

        // Simulating the actual sending using the new service
        await sendInquiry({
            senderName,
            senderEmail,
            subject,
            message
        });

        // // TODO: Connect to Resend/SendGrid API here.

        setTimeout(() => {
            setLoading(false);
            setSent(true);
            setSenderName('');
            setSenderEmail('');
            setSubject('אני מחפש עבודה וזקוק לעזרה');
            setMessage('');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-bg-light pt-24 pb-20 text-right" dir="rtl">
            <Helmet>
                <title>צור קשר | עובדים בצ'יק</title>
                <meta name="description" content="זקוקים לעזרה? דברו איתנו. צוות עובדים בצ'יק כאן בשבילכם לכל שאלה או פנייה." />
            </Helmet>
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-20">
                    <div className="inline-block bg-primary/10 text-primary px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-6 border border-primary/10">
                        שירות לקוחות
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-text-main mb-6 tracking-tighter">אנחנו כאן <span className="text-primary font-serif italic">להקשיב</span></h1>
                    <p className="text-lg md:text-xl text-text-muted font-bold max-w-2xl mx-auto leading-relaxed px-4 md:px-0">צריכים עזרה? יש לכם הצעה לשיפור או רעיון לשיתוף פעולה? דברו איתנו, אנחנו עונים בצ'יק.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-50 group hover:translate-y-[-4px] transition-all">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                                <Mail size={32} />
                            </div>
                            <h3 className="text-xl font-black text-text-main mb-2">דוא"ל פניות</h3>
                            <p className="text-text-muted font-bold text-lg cursor-pointer" onClick={() => window.open(`mailto:${contactEmail}`)}>{contactEmail}</p>
                            <p className="text-text-muted/60 text-xs mt-4 font-black uppercase tracking-widest">זמינות: 24/7</p>
                        </div>
                        <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-50 group hover:translate-y-[-4px] transition-all">
                            <div className="w-16 h-16 bg-highlight/10 rounded-2xl flex items-center justify-center text-primary-dark mb-8 group-hover:scale-110 transition-transform">
                                <Phone size={32} />
                            </div>
                            <h3 className="text-xl font-black text-text-main mb-2">ווצאפ וטלפון</h3>
                            <p className="text-text-muted font-bold text-lg">055-6867356</p>
                            <p className="text-text-muted/60 text-xs mt-4 font-black uppercase tracking-widest">זמינות: א-ה, 09:00-18:00</p>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[2rem] md:rounded-[4rem] p-8 sm:p-10 md:p-14 shadow-2xl shadow-slate-200/60 border border-slate-50 relative overflow-hidden h-full">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />
                            
                            {sent ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center py-16 relative z-10"
                                >
                                    <div className="w-28 h-28 bg-green-500 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-500/30">
                                        <CheckCircle2 size={56} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-text-main mb-6 leading-tight">שלחת משהו? קיבלנו! 🚀</h2>
                                    <p className="text-text-muted font-bold text-lg md:text-xl max-w-md leading-relaxed">תודה על הפנייה. הצוות המקצועי שלנו כבר בוחן את הבקשה שלך ויחזור אליך תוך זמן קצר.</p>
                                    <button 
                                        onClick={() => setSent(false)}
                                        className="mt-12 px-12 py-5 bg-bg-light text-text-main rounded-2xl font-black hover:bg-slate-200 transition-all shadow-soft active:scale-95 border border-slate-100"
                                    >
                                        שלח הודעה נוספת
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-10 relative z-10 font-sans">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-sm font-black text-text-main pr-3">שם מלא</label>
                                            <input required type="text" value={senderName} onChange={e => setSenderName(e.target.value)} className="w-full px-8 py-5 bg-bg-light border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white transition-all outline-none font-black text-text-main shadow-inner" placeholder="ישראל ישראלי" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-black text-text-main pr-3">כתובת אימייל</label>
                                            <input required type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} className="w-full px-8 py-5 bg-bg-light border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white transition-all outline-none font-black text-text-main shadow-inner" placeholder="name@email.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-text-main pr-3">על מה נדבר היום?</label>
                                        <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-8 py-5 bg-bg-light border-2 border-transparent rounded-[1.5rem] focus:border-primary focus:bg-white transition-all outline-none font-black text-text-main appearance-none cursor-pointer shadow-inner">
                                            <option value="אני מחפש עבודה וזקוק לעזרה">אני מחפש עבודה וזקוק לעזרה</option>
                                            <option value="אני מעסיק ורוצה לפרסם משרה">אני מעסיק ורוצה לפרסם משרה</option>
                                            <option value="יש לי רעיון לשיתוף פעולה">יש לי רעיון לשיתוף פעולה</option>
                                            <option value="דיווח על באג או תקלה טכנית">דיווח על באג או תקלה טכנית</option>
                                            <option value="אחר">אחר</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-text-main pr-3">ההודעה שלך</label>
                                        <textarea required rows={6} value={message} onChange={e => setMessage(e.target.value)} className="w-full px-8 py-8 bg-bg-light border-2 border-transparent rounded-[2.5rem] focus:border-primary focus:bg-white transition-all outline-none font-black text-text-main shadow-inner resize-none" placeholder="כאן אפשר לפרט..." />
                                    </div>
                                    <div className="flex items-start gap-4 pr-3">
                                        <input 
                                            required 
                                            type="checkbox" 
                                            id="terms" 
                                            className="mt-1.5 w-5 h-5 accent-primary rounded border-slate-300 shadow-sm cursor-pointer"
                                        />
                                        <label htmlFor="terms" className="text-sm text-text-muted font-bold leading-tight cursor-pointer">
                                            אני מאשר/ת שקראתי והבנתי את <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">תנאי השימוש</a> ואת <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">מדיניות הפרטיות</a> של האתר ומסכים/ה להם.
                                        </label>
                                    </div>
                                    <button 
                                        disabled={loading}
                                        type="submit" 
                                        className="w-full bg-slate-900 text-white py-6 rounded-[1.75rem] font-black text-xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                                    >
                                        {loading ? <LoadingSpinner /> : (
                                            <>
                                                שיגור ההודעה <Send size={28} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
