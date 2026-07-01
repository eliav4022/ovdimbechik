import React, { useRef } from 'react';
import { 
    Users, ShieldCheck, MessageCircle, Send, CheckCircle2, Star, Smartphone, MapPin, Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';

export const WhatsappJobs: React.FC = () => {
    const formRef = useRef<HTMLDivElement>(null);

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const stats = [
        { number: '150+', label: 'קבוצות' },
        { number: '50,000+', label: 'תפוצה' },
        { number: '1,200+', label: 'מעסיקים' }
    ];

    const additionalBenefits = [
        '100% קהל יעד רלוונטי למחפשי עבודה',
        'גיוס עובדים על פי דרישה',
        'עובדים רלוונטיים לכל סוגי העבודות',
        'חיסכון בעלויות פרסום משרה'
    ];

    const categories = [
        { name: 'אזור המרכז', icon: MapPin, link: 'https://t.me/OVDIM_BCHIK', color: 'from-blue-400 to-blue-600' },
        { name: 'אזור הצפון', icon: MapPin, link: 'https://t.me/OVDIM_BCHIK', color: 'from-emerald-400 to-emerald-600' },
        { name: 'אזור הדרום', icon: MapPin, link: 'https://t.me/OVDIM_BCHIK', color: 'from-orange-400 to-orange-600' },
        { name: 'אזור השרון', icon: MapPin, link: 'https://t.me/OVDIM_BCHIK', color: 'from-purple-400 to-purple-600' },
        { name: 'עבודות כלליות', icon: Briefcase, link: 'https://t.me/OVDIM_BCHIK', color: 'from-primary to-highlight' },
        { name: 'נוער וסטודנטים', icon: Users, link: 'https://t.me/OVDIM_BCHIK', color: 'from-pink-400 to-pink-600' },
    ];

    return (
        <div className="bg-slate-50 min-h-screen font-sans" dir="rtl">
            
            {/* Hero Section */}
            <section className="relative bg-slate-50 overflow-hidden py-16 sm:py-32">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-gradient-to-bl from-green-400/20 to-emerald-300/20 rounded-full blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[500px] h-[500px] bg-gradient-to-tr from-teal-400/20 to-green-300/20 rounded-full blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-green-100 text-green-700 font-bold mb-6 sm:mb-8 shadow-sm text-sm sm:text-base">
                        <MessageCircle size={18} className="text-green-600" />
                        <span>קהילות הוואטצאפ שלנו</span>
                    </div>
                    <h1 className="text-[2.75rem] leading-[1.1] sm:text-7xl font-black tracking-tight mb-4 sm:mb-6 text-slate-900 drop-shadow-sm flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                        <span>דרושים</span>
                        <span className="flex items-center gap-2 sm:gap-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 pb-1">בוואטצאפ</span>
                            <span className="text-4xl sm:text-6xl inline-block">📱</span>
                        </span>
                    </h1>
                    <p className="text-lg sm:text-2xl text-slate-600 font-medium max-w-2xl mx-auto mb-8 sm:mb-10 px-4">
                        הצטרפו לקבוצה ומצאו עבודה עוד היום!
                    </p>
                    <button 
                        onClick={() => window.open('https://t.me/OVDIM_BCHIK', '_blank')}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg sm:text-xl px-10 sm:px-12 py-4 sm:py-5 rounded-full shadow-[0_10px_40px_rgba(34,197,94,0.3)] hover:shadow-[0_10px_60px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                    >
                        מצא עבודה &gt;&gt;
                    </button>
                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-500 text-sm font-medium bg-white/60 px-6 py-3 rounded-2xl sm:rounded-full backdrop-blur-sm border border-slate-200/50 shadow-sm text-center">
                        <span>צרו איתנו קשר דרך עמוד יצירת קשר או</span>
                        <Link to="/contact" className="text-green-600 hover:text-green-700 hover:underline transition-colors font-bold">לחצו כאן</Link>
                    </div>
                </div>
            </section>

            {/* Benefits 1 Section */}
            <section className="py-16 bg-white relative z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-xl hover:shadow-2xl hover:border-green-100 transition-all group text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-green-100 transition-all shadow-inner relative z-10">
                                <Users className="text-green-600 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 relative z-10">עובדים איכותיים לכל התחומים</h3>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-xl hover:shadow-2xl hover:border-green-100 transition-all group text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-green-100 transition-all shadow-inner relative z-10">
                                <ShieldCheck className="text-green-600 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 relative z-10">ניהול ומענה אנושי זמין</h3>
                        </div>
                        <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[2rem] shadow-xl hover:shadow-2xl hover:border-green-100 transition-all group text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-green-100 transition-all shadow-inner relative z-10">
                                <MessageCircle className="text-green-600 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 relative z-10">התייעצות חינם!</h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* Groups Section */}
            <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-100">
                <div className="absolute top-1/2 left-0 w-96 h-96 bg-green-400/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 text-slate-700 font-bold mb-6 text-sm">
                            <MapPin size={16} className="text-slate-500" />
                            משרות לפי אזורים
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 leading-tight">
                            בחרו את אזור העבודה <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">שלכם</span>
                        </h2>
                        <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
                            הצטרפו לקבוצה המתאימה לכם ותתחילו לקבל משרות חמות היישר לנייד, מדי יום!
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                        {categories.map((category, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => window.open(category.link, '_blank')}
                                className="group cursor-pointer bg-white border border-slate-100 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center text-center relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${category.color} opacity-5 rounded-bl-[60px] sm:rounded-bl-[100px] transition-all group-hover:scale-150 group-hover:opacity-10`}></div>
                                
                                <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br ${category.color} p-0.5 mb-4 sm:mb-6 shadow-md group-hover:scale-110 transition-transform`}>
                                    <div className="w-full h-full bg-white rounded-[14px] sm:rounded-[30px] flex items-center justify-center">
                                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${category.color} opacity-10 absolute`}></div>
                                        <category.icon className="text-slate-700 w-6 h-6 sm:w-8 sm:h-8 relative z-10" />
                                    </div>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">{category.name}</h3>
                                <div className="mt-auto pt-2 sm:pt-4 flex items-center justify-center gap-2 text-sm sm:text-base text-slate-500 font-medium group-hover:text-green-600 transition-colors">
                                    <span>הצטרף לקבוצה</span>
                                    <Send size={16} className="sm:w-[18px] sm:h-[18px] rotate-180 transform group-hover:-translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA + Stats Section */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-50 text-emerald-600 font-bold mb-6 border border-emerald-100 shadow-sm">
                                📢 הגיע הזמן למצוא עבודה!
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-8 leading-tight">
                                הצטרפו לקבוצות הוואטצאפ שלנו והתחברו ל<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">מאות מעסיקים</span>
                            </h2>
                            <ul className="space-y-5 mb-10">
                                <li className="flex items-center gap-4 text-slate-700 text-xl bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                        <CheckCircle2 className="text-green-500 w-7 h-7 shrink-0" />
                                    </div>
                                    <span className="font-bold">משכורות גבוהות</span>
                                </li>
                                <li className="flex items-center gap-4 text-slate-700 text-xl bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                        <CheckCircle2 className="text-green-500 w-7 h-7 shrink-0" />
                                    </div>
                                    <span className="font-bold">כל סוגי העבודות</span>
                                </li>
                            </ul>
                            <button className="bg-slate-900 text-white hover:bg-slate-800 font-bold text-xl px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                                לקבוצות הוואטצאפ
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {stats.map((stat, idx) => (
                                <div key={idx} className={`bg-gradient-to-br from-green-50/50 to-white border border-green-100/50 p-10 rounded-[2.5rem] text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all ${idx === 2 ? 'sm:col-span-2' : ''}`}>
                                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-500 to-emerald-600 mb-3 drop-shadow-sm">{stat.number}</div>
                                    <div className="text-xl font-bold text-slate-700">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features & Image Section */}
            <section className="py-24 bg-slate-50 overflow-hidden relative border-y border-slate-200/50">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-200/20 rounded-full blur-[100px] opacity-70 -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-[80px] opacity-60 translate-y-1/3 -translate-x-1/4"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 flex justify-center lg:justify-end">
                            <div className="relative w-full max-w-sm">
                                <div className="absolute inset-0 bg-gradient-to-tr from-green-400 to-emerald-300 rounded-[3.5rem] blur-2xl opacity-30 transform -rotate-6 animate-pulse"></div>
                                <div className="relative bg-white p-5 rounded-[3.5rem] shadow-2xl border border-slate-100/50">
                                    <div className="w-20 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 mt-2"></div>
                                    <div className="space-y-4 mb-8 px-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-green-200 hover:shadow-sm transition-all cursor-pointer">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center shrink-0 shadow-inner">
                                                    <Users className="text-green-600 w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="h-3 bg-slate-200 rounded-full w-3/4 mb-2.5"></div>
                                                    <div className="h-2.5 bg-slate-100 rounded-full w-1/2"></div>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-1/3 h-1.5 bg-slate-200 rounded-full mx-auto mb-3"></div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <h2 className="text-4xl sm:text-5xl font-black mb-10 leading-tight text-slate-900">
                                למעסיקים:<br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 drop-shadow-sm">הדרך המהירה לגייס</span>
                            </h2>
                            <div className="space-y-5">
                                {additionalBenefits.map((benefit, idx) => (
                                    <div key={idx} className="flex items-center gap-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all group">
                                        <div className="bg-green-50 text-green-600 p-3.5 rounded-xl group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all shadow-sm">
                                            <Star size={24} className="fill-current opacity-20 group-hover:opacity-100" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-slate-700">{benefit}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section ref={formRef} className="py-24 bg-white relative">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-slate-50 rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400"></div>
                        <div className="p-10 sm:p-16 text-center">
                            <div className="w-20 h-20 bg-white shadow-sm rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-3 hover:rotate-6 transition-transform border border-slate-100">
                                <Send className="text-green-500 w-10 h-10 ml-1" />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 mb-4">השאירו פרטים ונחזור אליכם</h2>
                            <p className="text-slate-500 mb-12 text-xl font-medium">מלאו את הטופס ונציג מטעמנו יחזור אליכם בהקדם.</p>
                            
                            <form className="space-y-6 text-right max-w-2xl mx-auto" onSubmit={(e) => { e.preventDefault(); alert("טופס נשלח בהצלחה!"); }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">שם מלא</label>
                                        <input type="text" required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-lg font-medium shadow-sm" placeholder="הכנס שם" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">אימייל</label>
                                        <input type="email" required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-lg font-medium shadow-sm" placeholder="your@email.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">נושא הפנייה</label>
                                    <select required className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-lg font-medium text-slate-700 shadow-sm">
                                        <option value="">בחר נושא...</option>
                                        <option value="jobs">חיפוש עבודה בקבוצות</option>
                                        <option value="publish">פרסום משרה בקבוצות</option>
                                        <option value="other">אחר</option>
                                    </select>
                                </div>
                                
                                <div className="flex items-start gap-3 pt-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center h-5 mt-1">
                                        <input id="terms" type="checkbox" required className="w-5 h-5 border-slate-300 rounded text-green-600 focus:ring-green-500 bg-white cursor-pointer" />
                                    </div>
                                    <label htmlFor="terms" className="text-base text-slate-600 cursor-pointer font-medium">
                                        אני מסכים. קראתי ואישרתי את <Link to="/terms" className="text-green-600 hover:underline font-bold">תנאי השימוש</Link> באתר.
                                    </label>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-green-500/30 transition-all active:scale-[0.98] mt-8 flex items-center justify-center gap-3 border-none group"
                                >
                                    <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    שליחה
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
