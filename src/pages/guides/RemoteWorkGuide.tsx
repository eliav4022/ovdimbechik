import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Globe, ThumbsUp, ThumbsDown, Search, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const RemoteWorkGuide: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden text-right font-sans" dir="rtl">
            {/* Ambient Background Blur Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-100/30 blur-[100px] pointer-events-none" />

            <div className="relative z-10 pt-24 pb-24 max-w-[900px] mx-auto px-6 sm:px-8">
                <Helmet>
                    <title>עבודה מרחוק – כל מה שצריך לדעת | עובדים בצ'יק</title>
                    <meta name="description" content="מדריך עבודה מרחוק - יתרונות, חסרונות, איך למצוא עבודה ומהן הזכויות שלך בתור עובד מהבית." />
                </Helmet>

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-full text-slate-600 text-sm font-medium mb-8 shadow-sm">
                        <Globe size={16} className="text-blue-500" />
                        מדריך עבודה מהבית
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                        עבודה מרחוק
                        <br />
                        <span className="text-slate-500 text-3xl md:text-4xl font-normal mt-2 block">כל מה שצריך לדעת</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        עבודה מהבית הפכה לפופולרית במיוחד בעשור האחרון, ויותר חברות מציעות משרות היברידיות או מרוחקות לחלוטין. הנה כל מה שצריך לדעת כדי להצליח.
                    </p>
                </motion.div>

                {/* Pros and Cons */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-12"
                >
                    <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                            <span className="text-xl">⚖️</span>
                        </div>
                        יתרונות וחסרונות
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-0 border-emerald-100/50 bg-emerald-50/30 overflow-hidden">
                            <div className="p-6 bg-emerald-100/30 border-b border-emerald-100/50 flex items-center gap-3">
                                <ThumbsUp className="text-emerald-600" size={24} />
                                <h3 className="text-xl font-medium text-emerald-900">יתרונות</h3>
                            </div>
                            <ul className="p-6 space-y-4">
                                {[
                                    'חיסכון בזמן וכסף על נסיעות',
                                    'גמישות בשעות העבודה',
                                    'אפשרות לעבוד מכל מקום בעולם'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700">
                                        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>

                        <Card className="p-0 border-rose-100/50 bg-rose-50/30 overflow-hidden">
                            <div className="p-6 bg-rose-100/30 border-b border-rose-100/50 flex items-center gap-3">
                                <ThumbsDown className="text-rose-600" size={24} />
                                <h3 className="text-xl font-medium text-rose-900">חסרונות</h3>
                            </div>
                            <ul className="p-6 space-y-4">
                                {[
                                    'תחושת בידוד חברתי',
                                    'קושי בהפרדת עבודה וחיים אישיים',
                                    'פחות חשיפה והזדמנויות בארגון'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700">
                                        <XCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </motion.section>

                {/* How to search */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-12"
                >
                    <Card className="p-8 md:p-10 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-xl rounded-3xl">
                        <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Search size={24} />
                            </div>
                            איך מחפשים עבודה מרחוק?
                        </h2>
                        <ul className="space-y-4">
                            {[
                                { text: 'חפשו מילות מפתח כמו: "remote", "עבודה מהבית", "משרה היברידית"', icon: '🔑' },
                                { text: 'השתמשו באתרים ייעודיים כמו FlexJobs, We Work Remotely או RemoteOK', icon: '🌐' },
                                { text: 'הוסיפו את העדפתכם לפרופיל הלינקדאין', icon: '💼' },
                                { text: 'פנו ישירות לחברות בינלאומיות עם מדיניות Remote-first', icon: '🏢' }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <span className="text-2xl">{item.icon}</span>
                                    <span className="font-medium text-slate-700 text-lg">{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </motion.section>

                {/* Legal rights */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="p-8 md:p-10 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-slate-900 text-white rounded-3xl relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[80px] pointer-events-none" />
                        
                        <div className="relative z-10">
                            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                    <ShieldCheck size={28} />
                                </div>
                                זכויות והיבטים משפטיים
                            </h2>
                            <p className="text-slate-300 mb-8 text-lg">
                                לעובדים מהבית יש זכויות כמו לכל עובד, אך חשוב לשים לב לדגשים הבאים:
                            </p>
                            
                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    'המעסיק חייב לדאוג לציוד נדרש – או לפצות עליו',
                                    'חייב להיות חוזה ברור לגבי שעות עבודה, שכר וזמינות',
                                    'שעות נוספות חלות גם על עובדים מרחוק (אם לא הוגדר אחרת)',
                                    'זכויות סוציאליות נשמרות גם מהבית – כולל חופשה, מחלה ופנסיה'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 bg-white/5 p-5 rounded-2xl border border-white/10">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <ShieldCheck size={14} />
                                        </div>
                                        <span className="font-medium text-slate-200">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </motion.section>

            </div>
        </div>
    );
};
