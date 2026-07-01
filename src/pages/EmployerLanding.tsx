import React, { useState, useRef } from 'react';
import { 
    Briefcase, TrendingUp, Target, Clock, ChevronDown, 
    CheckCircle2, Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';

export const EmployerLanding: React.FC = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const benefits = [
        {
            title: 'חשיפה גבוהה',
            description: 'המודעה שלכם תגיע לאלפי מחפשי עבודה פוטנציאליים בכל רחבי הארץ בזמן קצר.',
            icon: <TrendingUp className="text-primary w-8 h-8" />
        },
        {
            title: 'התאמה חכמה',
            description: 'מערכת חכמה שמחברת בין דרישות המשרה שלכם לבין הכישורים של המועמדים הטובים ביותר.',
            icon: <Target className="text-primary w-8 h-8" />
        },
        {
            title: 'חיסכון זמן וכסף',
            description: 'גייסו עובדים איכותיים במהירות וביעילות, מבלי לבזבז משאבים מיותרים.',
            icon: <Clock className="text-primary w-8 h-8" />
        }
    ];

    const steps = [
        {
            num: '01',
            title: 'יוצרים איתנו קשר',
            description: 'משאירים פרטים בטופס, ואנו חוזרים אליכם במייל או בוואטצאפ.'
        },
        {
            num: '02',
            title: 'סוגרים על תוכנית פרסום',
            description: 'בוחרים את המסלול שמתאים בדיוק לצרכי הגיוס שלכם.'
        },
        {
            num: '03',
            title: 'מתחילים לקבל פניות',
            description: 'המשרה מופצת, ואתם מתחילים לקבל קורות חיים ממועמדים.'
        }
    ];

    const stats = [
        { number: '150,000+', label: 'תפוצה ממוצעת' },
        { number: '2,500+', label: 'מעסיקים שפרסמו' },
        { number: '15,000+', label: 'מצאו עבודה' }
    ];

    const faqs = [
        {
            q: 'מה קורה אחרי שאני מפרסם?',
            a: 'אחרי הפרסום המשרה מופצת לקהל הרלוונטי, ומועמדים יכולים לפנות אליכם ישירות.'
        },
        {
            q: 'איך בוחרים מועמדים?',
            a: 'בחירת המועמדים נעשית על ידי המעסיק לפי הפניות שמתקבלות.'
        },
        {
            q: 'כמה זמן המודעה נשארת באוויר?',
            a: 'משך הפרסום תלוי במסלול הפרסום שייבחר.'
        }
    ];

    const feedbacks = [
        { text: '✨ השירות היה מעולה ומהיר! תודה רבה 🙏', time: '10:23' },
        { text: '👨‍💼 מצאתי עובדים דרך האתר תוך יומיים בלבד!', time: '12:45' },
        { text: '💬 מהר מאוד מצאתי עובדים איכותיים במינימום מאמץ וכסף', time: '09:10' },
        { text: '✅ קיבלתי פניות איכותיות תוך זמן קצר!', time: '14:20' },
        { text: '📢 לא הייתי מקבל תוצאות כאלו באף מקום, תודה!', time: '16:05' }
    ];

    return (
        <div className="bg-slate-50 min-h-screen font-sans" dir="rtl">
            {/* Hero Section */}
            <section className="relative bg-white overflow-hidden py-16 sm:py-24">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-gradient-to-bl from-primary/20 to-highlight/20 rounded-full blur-3xl opacity-60 animate-blob"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/10 to-primary/20 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary-dark font-bold mb-8 shadow-sm">
                        <Briefcase size={18} />
                        <span>למעסיקים ומגייסים</span>
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 text-slate-900">
                        להעסיק <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-highlight">בצ'יק</span> 💼
                    </h1>
                    <p className="text-xl sm:text-2xl text-slate-600 font-medium max-w-2xl mx-auto mb-10">
                        המועמדים מחכים – התחילו לגייס עכשיו!
                    </p>
                    <button 
                        onClick={scrollToForm}
                        className="bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
                    >
                        התחל לגייס
                    </button>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">למה לגייס דרכנו?</h2>
                        <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {benefits.map((benefit, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow group text-center">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">{benefit.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works Section */}
            <section className="py-20 bg-slate-50 border-y border-slate-200/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">איך זה עובד?</h2>
                        <p className="text-slate-600">שלושה צעדים פשוטים ואתם בדרך לגייס את העובד הבא שלכם</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/4 left-1/6 right-1/6 h-0.5 bg-primary/20 -z-0"></div>
                        
                        {steps.map((step, idx) => (
                            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black shadow-lg mb-6 ring-4 ring-slate-50 group-hover:bg-primary-dark transition-colors">
                                    {step.num}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                                <p className="text-slate-600 px-4">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-primary/5 to-white border border-primary/10 p-8 rounded-2xl text-center">
                                <div className="text-4xl sm:text-5xl font-extrabold text-primary mb-3 drop-shadow-sm">{stat.number}</div>
                                <div className="text-lg font-medium text-slate-700">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials (Chat Style) */}
            <section className="py-20 bg-gradient-to-br from-indigo-50 to-primary/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">מה מעסיקים אומרים עלינו?</h2>
                        <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
                    </div>
                    
                    {/* Chat Bubble Carousel */}
                    <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar relative max-w-4xl mx-auto px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {feedbacks.map((fb, idx) => (
                            <div key={idx} className="shrink-0 w-80 sm:w-96 snap-center bg-white border border-slate-100 shadow-sm p-6 rounded-3xl rounded-tr-sm flex flex-col justify-between hover:shadow-md transition-all">
                                <p className="text-lg text-slate-800 font-medium mb-4 leading-relaxed">{fb.text}</p>
                                <div className="flex items-center justify-between text-slate-500 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 size={16} className="text-primary" />
                                        <span>נצפה</span>
                                    </div>
                                    <span>{fb.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">שאלות נפוצות</h2>
                        <p className="text-slate-600">יש לכם שאלות? ריכזנו את התשובות כאן.</p>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full text-right px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-bold text-slate-800 text-lg">{faq.q}</span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary transition-transform shrink-0 mr-4 ${openFaq === idx ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </button>
                                <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-slate-600">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section ref={formRef} className="py-24 bg-white relative">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-highlight"></div>
                        <div className="p-8 sm:p-12 text-center">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">לתחילת תהליך פרסום</h2>
                            <p className="text-slate-600 mb-10 text-lg">השאירו פרטים ונחזור אליכם בהקדם!</p>
                            
                            <form className="max-w-2xl mx-auto space-y-6 text-right" onSubmit={(e) => { e.preventDefault(); alert("טופס נשלח בהצלחה! צוות להעסיק בצ'יק יחזור אליכם בהקדם."); }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">שם העסק / חברה</label>
                                        <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="הכנס שם עסק" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">טלפון</label>
                                        <input type="tel" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="05x-xxxxxxx" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">אימייל</label>
                                    <input type="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="your@email.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">נושא / הערות (אופציונלי)</label>
                                    <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none" placeholder="הערות נוספות..."></textarea>
                                </div>
                                
                                <div className="flex items-start gap-3 pt-2">
                                    <div className="flex items-center h-5 mt-0.5">
                                        <input id="terms" type="checkbox" required className="w-5 h-5 border-slate-300 rounded text-primary focus:ring-primary bg-slate-50 cursor-pointer" />
                                    </div>
                                    <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer">
                                        אני מסכים. קראתי ואישרתי את <Link to="/terms" className="text-primary hover:underline font-medium">תנאי השימוש</Link> ואת <Link to="/privacy" className="text-primary hover:underline font-medium">מדיניות הפרטיות</Link> באתר.
                                    </label>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-primary to-highlight text-white font-bold text-lg py-4 rounded-xl shadow-md hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-2 border-none"
                                >
                                    <Send size={20} />
                                    ליצירת קשר
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div className="text-center mt-8">
                        <p className="text-slate-500">
                            לכל נושא אחר צרו קשר ב<Link to="/contact" className="text-primary hover:underline font-bold">עמוד יצירת קשר</Link>!
                        </p>
                    </div>
                </div>
            </section>

            {/* Custom CSS for hidden scrollbar */}
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
};
