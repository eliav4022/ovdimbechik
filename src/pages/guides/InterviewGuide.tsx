import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring } from 'framer-motion';
import { 
    Gamepad2, Trophy, Map, Target, Sparkles, Zap, MessageSquare, 
    User, HelpCircle, Handshake, CheckSquare, Send, Mail, UserCheck, 
    Swords, Shield, Unlock, ArrowDown
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

export const InterviewGuide: React.FC = () => {
    const { scrollYProgress } = useScroll();
    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const STAGES = [
        {
            level: 1,
            title: "הכרת הזירה והתפקיד",
            subtitle: "שלב 1: מחקר מודיעין",
            icon: Map,
            color: "from-blue-500 to-cyan-400",
            textColor: "text-cyan-600",
            bgLight: "bg-cyan-50",
            borderLight: "border-cyan-100",
            content: (
                <p className="text-slate-600 leading-relaxed text-lg">
                    לפני הראיון חשוב לחקור על החברה: תחום הפעילות שלה, הלקוחות שלה, הערכים שהיא מציגה והתרבות הארגונית. בנוסף, קרא בעיון את תיאור המשרה ונסה להבין אילו כישורים נדרשים כדי לצלוח את המשימה.
                </p>
            )
        },
        {
            level: 2,
            title: "הכנת תשובות מנצחות",
            subtitle: "שלב 2: הצטיידות בנשק סודי",
            icon: Swords,
            color: "from-purple-500 to-fuchsia-400",
            textColor: "text-fuchsia-600",
            bgLight: "bg-fuchsia-50",
            borderLight: "border-fuchsia-100",
            content: (
                <>
                    <p className="text-slate-600 leading-relaxed text-lg mb-6">
                        הנה מספר שאלות נפוצות שכדאי להכין אליהן מגננה והתקפה:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 mb-6">
                        {[
                            'ספר/י לי על עצמך',
                            'מה היתרונות והחסרונות שלך?',
                            'למה אתה רוצה לעבוד דווקא אצלנו?',
                            'איפה אתה רואה את עצמך בעוד 5 שנים?',
                            'תן דוגמה להתמודדות עם קושי בעבודה'
                        ].map((q, i) => (
                            <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100 hover:bg-slate-100 transition-colors">
                                <Zap size={18} className="text-fuchsia-500 shrink-0" />
                                <span className="font-medium text-slate-700">{q}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-fuchsia-50 rounded-xl p-4 border border-fuchsia-100 text-fuchsia-800 flex gap-3 items-start">
                        <Shield size={20} className="shrink-0 mt-0.5" />
                        <span><strong>זכור:</strong> התשובות צריכות להיות כנות, ברורות, ומחוברות לחוזקות שלך. אל תשתמש ב"קסמים" שקריים.</span>
                    </div>
                </>
            )
        },
        {
            level: 3,
            title: "הופעה ושפת גוף",
            subtitle: "שלב 3: שדרוג האוואטר",
            icon: User,
            color: "from-emerald-500 to-green-400",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            borderLight: "border-emerald-100",
            content: (
                <p className="text-slate-600 leading-relaxed text-lg">
                    יש חשיבות רבה לרושם ראשוני. כדאי להגיע לבוש בצורה מקצועית ונקייה. חשוב להקפיד על קשר עין, לחיצת יד בטוחה (או נימה רגועה בזום), ישיבה זקופה וחיוך. האוואטר שלך צריך לשדר ביטחון ומקצועיות.
                </p>
            )
        },
        {
            level: 4,
            title: "שאלות שאתה שואל",
            subtitle: "שלב 4: חילופי תפקידים",
            icon: Target,
            color: "from-amber-500 to-yellow-400",
            textColor: "text-amber-600",
            bgLight: "bg-amber-50",
            borderLight: "border-amber-100",
            content: (
                <>
                    <p className="text-slate-600 leading-relaxed text-lg mb-6">
                        המראיין מצפה שגם אתה תשאל שאלות. זו הזדמנות להראות מעורבות ועניין במשחק. לדוגמה:
                    </p>
                    <ul className="space-y-3">
                        {[
                            'איך נראה יום עבודה טיפוסי בתפקיד?',
                            'מה מאפיין עובדים שמצליחים כאן?',
                            'מה הציפיות ממי שייכנס לתפקיד הזה בחצי השנה הראשונה?'
                        ].map((q, i) => (
                            <li key={i} className="flex gap-3 items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                                <HelpCircle size={20} className="text-amber-500 shrink-0" />
                                <span className="font-medium text-slate-700">{q}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )
        },
        {
            level: 5,
            title: "סיום הראיון",
            subtitle: "שלב 5: לחיצת היד הווירטואלית",
            icon: Handshake,
            color: "from-rose-500 to-pink-400",
            textColor: "text-pink-600",
            bgLight: "bg-rose-50",
            borderLight: "border-rose-100",
            content: (
                <>
                    <p className="text-slate-600 leading-relaxed text-lg mb-6">
                        בתום הראיון, כדאי להודות למראיין על הזמן ולסכם בכמה מילים את הרצון שלך להשתלב בתפקיד. לדוגמה:
                    </p>
                    <blockquote className="border-r-4 border-pink-500 pr-6 pl-4 py-5 bg-rose-50 rounded-l-xl text-pink-800 font-medium text-lg italic mb-8">
                        "היה לי ממש נעים לשוחח, ואני מאמין שהתפקיד הזה מתאים לי מאוד – אשמח להתקדם לשלב הבא."
                    </blockquote>

                    <h3 className="font-medium text-slate-900 text-xl mb-4 flex items-center gap-2">
                        <Sparkles className="text-pink-500" size={20} />
                        בונוס: משימות לאחר הראיון
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-3 hover:bg-slate-100 transition-colors">
                            <Send className="text-pink-500" size={24} />
                            <span className="font-medium text-slate-700 text-sm">שלח מייל תודה קצר באותו יום</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-3 hover:bg-slate-100 transition-colors">
                            <MessageSquare className="text-pink-500" size={24} />
                            <span className="font-medium text-slate-700 text-sm">ציין שנהנית מהשיחה</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center gap-3 hover:bg-slate-100 transition-colors">
                            <UserCheck className="text-pink-500" size={24} />
                            <span className="font-medium text-slate-700 text-sm">חזק את ההתאמה שלך לתפקיד</span>
                        </div>
                    </div>
                </>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-[#FAFAFA] relative text-right font-sans selection:bg-indigo-500/30" dir="rtl">
            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 origin-right"
                style={{ scaleX: scaleY }}
            />

            {/* Ambient Background Blur Elements */}
            <div className="fixed top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-200/40 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-200/40 blur-[120px] pointer-events-none" />
            <div className="fixed top-[40%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-cyan-200/30 blur-[100px] pointer-events-none" />

            <div className="relative z-10 pt-24 pb-24 max-w-[850px] mx-auto px-6 sm:px-8">
                <Helmet>
                    <title>איך לעבור ראיון עבודה בהצלחה | המדריך המלא</title>
                    <meta name="description" content="הכנה לראיון עבודה - המדריך הכללי: הכרת החברה, תשובות לשאלות נפוצות, הופעה, וטיפים לראיון מוצלח." />
                </Helmet>

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-8 shadow-sm">
                        <Gamepad2 size={16} />
                        המשחק מתחיל: מדריך הכנה לראיון
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        מוכנים לראיון?<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                            הגיע הזמן לעלות שלב
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
                        הכנה לראיון עבודה היא השקעה משתלמת. ככל שתתכונן טוב יותר – תרגיש בטוח, תתנסח טוב יותר, ותשאיר רושם מנצח.
                    </p>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="mt-12 flex justify-center text-slate-400 animate-bounce"
                    >
                        <ArrowDown size={32} />
                    </motion.div>
                </motion.div>

                {/* Stages Timeline */}
                <div className="relative">
                    {/* The Path Line */}
                    <div className="absolute right-8 md:right-12 top-10 bottom-10 w-1 bg-slate-200 rounded-full hidden sm:block">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-20 blur-[2px]" />
                    </div>

                    <div className="space-y-16">
                        {STAGES.map((stage, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5 }}
                                className="relative flex flex-col sm:flex-row gap-6 sm:gap-10"
                            >
                                {/* Stage Node */}
                                <div className="sm:w-24 shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-4 relative z-10">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stage.color} p-[2px] shadow-md shrink-0`}>
                                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center relative overflow-hidden group">
                                            <div className={`absolute inset-0 bg-gradient-to-br ${stage.color} opacity-10`} />
                                            <stage.icon size={28} className={stage.textColor} />
                                        </div>
                                    </div>
                                    <div className="sm:text-left sm:pr-2">
                                        <div className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Level</div>
                                        <div className="text-3xl font-black text-slate-900">{stage.level}</div>
                                    </div>
                                </div>

                                {/* Stage Content */}
                                <div className="flex-1">
                                    <div className={`bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-3xl p-6 md:p-10 hover:border-slate-300 transition-colors relative overflow-hidden group`}>
                                        <div className={`absolute top-0 right-0 w-full h-1 bg-gradient-to-r ${stage.color} opacity-80`} />
                                        
                                        <div className="mb-6">
                                            <span className={`inline-block px-3 py-1 rounded-lg ${stage.bgLight} ${stage.textColor} border ${stage.borderLight} text-sm font-medium mb-3`}>
                                                {stage.subtitle}
                                            </span>
                                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                                {stage.title}
                                            </h2>
                                        </div>
                                        
                                        <div className="relative z-10">
                                            {stage.content}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Final Boss / Checklist */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-24 relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-[3rem] blur-xl" />
                    <div className="bg-white border border-emerald-100 rounded-[3rem] p-8 md:p-14 shadow-xl relative overflow-hidden z-10">
                        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                        
                        <div className="relative z-10 text-center mb-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-500 mb-6 shadow-sm">
                                <Trophy size={40} />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                                צ'ק ליסט לראיון מנצח
                            </h2>
                            <p className="text-emerald-600/80 text-lg md:text-xl font-medium">חמשת המשימות שחובה להשלים לפני הראיון</p>
                        </div>
                        
                        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                            {[
                                'חקור את החברה והמשרה לעומק',
                                'תרגל שאלות נפוצות בראיונות',
                                'התאם לבוש ייצוגי מראש',
                                'הדפס או סדר את קורות החיים שלך',
                                'תכנן הגעה מוקדמת לראיון'
                            ].map((item, idx) => (
                                <motion.div 
                                    key={idx} 
                                    whileHover={{ scale: 1.02, x: -5 }}
                                    className="flex items-center gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-default shadow-sm"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                        <CheckSquare size={20} className="opacity-50" />
                                    </div>
                                    <span className="font-medium text-slate-700 text-lg md:text-xl">{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* CTA Service */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-500/30 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
                        <Sparkles className="absolute top-10 right-10 w-24 h-24 text-white" />
                        <Zap className="absolute bottom-10 left-10 w-20 h-20 text-white" />
                    </div>
                    
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 border border-white/30 text-white mb-6 backdrop-blur-sm">
                            <Unlock size={28} />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                            צריכים עזרה מקצועית?
                        </h2>
                        <p className="text-xl text-indigo-100 mb-10 leading-relaxed font-medium">
                            רוצה להכיר את אנשי המקצוע הנכונים, שידריכו אותך איך להתכונן לראיון עבודה? צור איתנו קשר! שלח קורות חיים ונחזור אליך לתיאום.
                        </p>
                        <Button 
                            className="bg-white text-indigo-700 hover:bg-slate-50 h-16 px-10 rounded-full text-lg font-bold shadow-lg transition-all hover:scale-105"
                        >
                            <Gamepad2 size={24} className="ml-3" />
                            לחץ כאן לתחילת המסע
                        </Button>
                    </div>
                </motion.section>

            </div>
        </div>
    );
};


