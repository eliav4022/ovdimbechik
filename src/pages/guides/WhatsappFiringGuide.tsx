import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertCircle, PhoneOff, Gavel, Scale, Mail, Info, ChevronLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';

export const WhatsappFiringGuide: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden text-right font-sans" dir="rtl">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-rose-100/40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-100/30 blur-[120px] pointer-events-none" />

            <div className="relative z-10 pt-24 pb-24 max-w-[900px] mx-auto px-6 sm:px-8">
                <Helmet>
                    <title>האם מותר לפטר אותי בוואטסאפ? ומה הזכויות שלי? | עובדים בצ'יק</title>
                    <meta name="description" content="פיטורים באמצעות הודעת וואטסאפ אינם חוקיים בישראל. קראו מהן הזכויות שלכם ואיך לפעול במקרה שפוטרתם ללא שימוע." />
                </Helmet>

                {/* Back link */}
                <div className="mb-8">
                    <Link to="/quick-info" className="inline-flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium">
                        <ChevronLeft size={16} className="mr-1" />
                        חזרה לכל המדריכים
                    </Link>
                </div>

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-full text-rose-700 text-sm font-medium mb-8 shadow-sm">
                        <ShieldAlert size={16} />
                        מדריך זכויות עובדים
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                        האם מותר לפטר אותי בוואטסאפ?
                        <br />
                        <span className="text-slate-500 text-3xl md:text-4xl font-normal mt-2 block">ומה הזכויות שלי?</span>
                    </h1>
                </motion.div>

                {/* Content */}
                <div className="space-y-8">
                    
                    {/* Intro */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="p-8 border-rose-200 bg-white shadow-sm border-r-4 border-r-rose-500">
                            <h2 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
                                <PhoneOff className="text-rose-500" size={24} />
                                האם פיטורים דרך וואטסאפ חוקיים?
                            </h2>
                            <p className="text-lg text-slate-700 leading-relaxed mb-4">
                                פיטורים באמצעות הודעת וואטסאפ, SMS או כל הודעה לא פורמלית אחרת <strong className="text-rose-600">אינם חוקיים לפי דיני העבודה בישראל</strong>. 
                                החוק מחייב תהליך מסודר הכולל שימוע בכתב לפני פיטורין.
                            </p>
                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-rose-900 flex gap-3">
                                <Info className="shrink-0 mt-0.5" size={20} />
                                <span><strong>שימוע</strong> הוא הזדמנות שלך להציג את עמדתך לפני החלטת הפיטורין.</span>
                            </div>
                        </Card>
                    </motion.div>

                    {/* How should it be done */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="p-8 border-slate-200/60 shadow-sm bg-white">
                            <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
                                <Scale className="text-blue-500" size={24} />
                                איך מבוצעים פיטורין בצורה חוקית?
                            </h2>
                            <ul className="space-y-4">
                                {[
                                    'זימון לשימוע בכתב – בדוא"ל, מכתב רשמי או מסמך חתום.',
                                    'מתן הזדמנות לעובד להשמיע את טיעוניו בשימוע.',
                                    'קבלת החלטה לאחר שקילת הטענות והמסמכים.',
                                    'הודעה רשמית וברורה על סיום ההעסקה.'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <span className="text-slate-700 font-medium text-lg mt-0.5">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </motion.div>

                    {/* What if it happened to you */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        <Card className="p-6 md:p-8 border-orange-200 bg-orange-50/50 shadow-sm">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Gavel className="text-orange-500" size={22} />
                                מה קורה אם פוטרת בדרך לא חוקית?
                            </h2>
                            <p className="text-slate-700 mb-4">
                                אם פוטרת ללא הליך שימוע תקין, יש לך זכויות נוספות כגון:
                            </p>
                            <ul className="space-y-2">
                                {[
                                    'פיצויים מוגדלים.',
                                    'אפשרות לפנות לבית הדין לעבודה לתביעה.',
                                    'במקרים מסוימים, דרישה לשוב לעבודה.'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-700 font-medium">
                                        <div className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Card>

                        <Card className="p-6 md:p-8 border-emerald-200 bg-emerald-50/50 shadow-sm">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <AlertCircle className="text-emerald-500" size={22} />
                                מה לעשות אם פוטרת בוואטסאפ?
                            </h2>
                            <ul className="space-y-3">
                                {[
                                    'שמור את ההודעה כהוכחה.',
                                    'פנה למעסיק בבקשה לשימוע פורמלי בכתב.',
                                    'התייעץ עם עורך דין או ארגון עובדים (כגון ההסתדרות).',
                                    'תעד כל תקשורת בכתב עם המעסיק.'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </motion.div>

                    {/* Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Card className="p-8 border-slate-800 bg-slate-900 text-white rounded-3xl text-center">
                            <h2 className="text-2xl font-semibold mb-4">סיכום</h2>
                            <p className="text-slate-300 text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
                                פיטורין הם תהליך משפטי מחייב. פיטורין בוואטסאפ אינם תקפים אם לא בוצע תהליך חוקי, ואתה זכאי להגן על זכויותיך. חשוב להכיר את התהליך ולפעול בהתאם.
                            </p>
                            <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-4 rounded-xl border border-white/10 text-slate-200">
                                <Mail className="text-slate-400" size={24} />
                                <span className="font-medium">
                                    לייעוץ מקצועי נוסף, מומלץ לפנות לייעוץ משפטי או לגורמי התמיכה הרשמיים.
                                </span>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
