import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
    Edit3, 
    Type, 
    Megaphone, 
    ListChecks, 
    CheckCircle2, 
    HeartHandshake, 
    MapPin, 
    GitCommit, 
    MousePointerClick, 
    Sparkles, 
    Lightbulb
} from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const JobPostGuide: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden text-right font-sans" dir="rtl">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-100/40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-100/30 blur-[120px] pointer-events-none" />

            <div className="relative z-10 pt-24 pb-24 max-w-[900px] mx-auto px-6 sm:px-8">
                <Helmet>
                    <title>טיפים לכתיבה נכונה של מודעת דרושים | עובדים בצ'יק</title>
                    <meta name="description" content="מדריך מעשי למעסיקים: איך לכתוב מודעת דרושים שמושכת את המועמדים הטובים ביותר." />
                </Helmet>

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 text-sm font-medium mb-8 shadow-sm">
                        <Edit3 size={16} className="text-violet-500" />
                        מדריך למעסיקים
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                        איך לבנות מודעת דרושים
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500 font-bold">
                            מושלמת
                        </span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        המדריך המלא לכתיבת מודעות דרושים שיבלטו מעל כולם וימשכו את הטאלנטים שהחברה שלכם צריכה.
                    </p>
                </motion.div>

                <div className="space-y-8">
                    {/* Section 1 & 2: Title & Intro */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card className="h-full p-6 border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                        <Type size={20} />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-900">1. כותרת מדויקת ומושכת</h2>
                                </div>
                                <p className="text-slate-600 mb-4">
                                    כתבו את שם המשרה כפי שמחפשים אותה. הוסיפו תיאור קצר וקולע:
                                </p>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 font-medium">
                                    לדוגמה: מנהל/ת שיווק יצירתי/ת | היברידי | סטארטאפ בצמיחה
                                </div>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="h-full p-6 border-slate-200/60 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600">
                                        <Megaphone size={20} />
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-900">2. פתיח שיווקי</h2>
                                </div>
                                <p className="text-slate-600 mb-4">
                                    ספרו בקצרה על החברה, מה הייחוד שלכם ולמה כדאי להצטרף:
                                </p>
                                <blockquote className="border-r-4 border-fuchsia-400 pr-4 italic text-slate-700 bg-fuchsia-50/50 py-2">
                                    "מחפשים מקום לעבוד בו כמו בצוות NBA? אצלנו כל אחד הוא שחקן מרכזי. בואו להוביל איתנו את מהפכת ה-E-Commerce באירופה!"
                                </blockquote>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Section 3 & 4: Responsibilities & Requirements */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card className="p-0 overflow-hidden border-slate-200/60 shadow-sm">
                            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100">
                                {/* Responsibilities */}
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <ListChecks size={20} />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-900">3. תחומי אחריות</h2>
                                    </div>
                                    <ul className="space-y-3">
                                        {[
                                            'ניהול קמפיינים בדיגיטל (Meta, Google)',
                                            'יצירת תוכן שיווקי יחד עם צוות קריאייטיב',
                                            'ניתוח ביצועים ושיפורם בהתבסס על דאטה'
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-slate-700">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {/* Requirements */}
                                <div className="p-6 md:p-8 bg-slate-50/50">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <h2 className="text-xl font-semibold text-slate-900">4. דרישות תפקיד</h2>
                                    </div>
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-sm md:text-base">
                                        <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 font-medium text-slate-700">
                                            <div className="p-3">דרישות חובה</div>
                                            <div className="p-3 border-r border-slate-200">יתרון ל…</div>
                                        </div>
                                        <div className="grid grid-cols-2 border-b border-slate-100 text-slate-600">
                                            <div className="p-3">ניסיון של שנתיים לפחות בתחום</div>
                                            <div className="p-3 border-r border-slate-100">ניסיון בסטארטאפ</div>
                                        </div>
                                        <div className="grid grid-cols-2 border-b border-slate-100 text-slate-600">
                                            <div className="p-3">עברית ואנגלית ברמה גבוהה</div>
                                            <div className="p-3 border-r border-slate-100">שליטה ב-Figma / Hubspot</div>
                                        </div>
                                        <div className="grid grid-cols-2 text-slate-600">
                                            <div className="p-3">יכולות תקשורת ועבודה בצוות</div>
                                            <div className="p-3 border-r border-slate-100">רקע בעולמות eCommerce</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Section 5, 6, 7 */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                            <Card className="h-full p-6 border-rose-100 bg-rose-50/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <HeartHandshake className="text-rose-500" size={24} />
                                    <h2 className="text-lg font-semibold text-slate-900">5. למה לעבוד אצלכם?</h2>
                                </div>
                                <ul className="space-y-2 text-slate-700 text-sm md:text-base">
                                    <li>• עבודה היברידית וגמישות מלאה בשעות</li>
                                    <li>• צוות קטן עם השפעה גדולה</li>
                                    <li>• פרויקטים חדשניים וחוצה גבולות</li>
                                    <li>• תרבות ארגונית משפחתית ותומכת</li>
                                </ul>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
                            <Card className="h-full p-6 border-amber-100 bg-amber-50/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <MapPin className="text-amber-500" size={24} />
                                    <h2 className="text-lg font-semibold text-slate-900">6. מיקום ותנאים</h2>
                                </div>
                                <ul className="space-y-2 text-slate-700 text-sm md:text-base">
                                    <li>• מיקום: תל אביב (היברידי – יומיים מהבית)</li>
                                    <li>• משרה מלאה עם אפשרות לגמישות</li>
                                    <li>• תנאים מעולים + ימי חופשה מוגדלים</li>
                                    <li>• שכר בהתאם לניסיון – שקיפות תמשוך מועמדים</li>
                                </ul>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
                            <Card className="h-full p-6 border-indigo-100 bg-indigo-50/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <GitCommit className="text-indigo-500" size={24} />
                                    <h2 className="text-lg font-semibold text-slate-900">7. תהליך הגיוס</h2>
                                </div>
                                <ol className="space-y-2 text-slate-700 text-sm md:text-base list-decimal list-inside marker:text-indigo-400 marker:font-bold">
                                    <li>שיחה קצרה עם HR</li>
                                    <li>משימה מקצועית קצרה</li>
                                    <li>ראיון עם המנהל/ת הישיר/ה</li>
                                    <li>תוך 7 ימי עסקים חוזרים עם תשובה</li>
                                </ol>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Section 8: Call to action */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                    >
                        <Card className="p-8 text-center border-slate-200/60 shadow-sm bg-white">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-600 mb-4">
                                <MousePointerClick size={24} />
                            </div>
                            <h2 className="text-2xl font-semibold text-slate-900 mb-2">8. קריאה לפעולה</h2>
                            <p className="text-lg text-slate-600 mb-4">נשמע מעניין?</p>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-w-md mx-auto">
                                <p className="text-slate-800 font-medium mb-1">שלח/י קורות חיים ל: <a href="mailto:jobs@yourcompany.co.il" className="text-violet-600 hover:underline">jobs@yourcompany.co.il</a></p>
                                <p className="text-slate-600 text-sm">או דברו איתנו ישירות בלינקדאין 💬</p>
                            </div>
                        </Card>
                    </motion.section>

                    {/* Pro Tips */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        <Card className="p-8 border border-slate-800 bg-slate-900 text-white rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 blur-[80px] rounded-full pointer-events-none" />
                            
                            <div className="relative z-10">
                                <h2 className="text-2xl font-semibold text-white mb-8 flex items-center gap-3">
                                    <Sparkles className="text-violet-400" size={28} />
                                    טיפים סודיים של מקצוענים
                                </h2>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { title: 'שפה ידידותית, לא משפטית', desc: 'יוצרת חיבור קליל' },
                                        { title: 'התאמת הסגנון לקהל', desc: 'לדוגמה: מפתחים ≠ אנשי קריאייטיב' },
                                        { title: 'אורך מודעה: 300–500 מילים', desc: 'מאוזן וברור' },
                                        { title: 'שימוש מדוד באימוג\'ים 🎯', desc: 'מושך את העין, מתאים לדור צעיר' },
                                        { title: 'בדיקות A/B בפלטפורמות', desc: 'לגלות מה עובד יותר' },
                                        { title: 'תמונה או סרטון של הצוות', desc: 'יוצר אמון ומעורבות' }
                                    ].map((tip, idx) => (
                                        <div key={idx} className="bg-white/10 border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors">
                                            <div className="flex items-center gap-2 mb-2 text-violet-300">
                                                <Lightbulb size={16} />
                                                <h3 className="font-semibold text-sm">{tip.title}</h3>
                                            </div>
                                            <p className="text-slate-300 text-sm">{tip.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.section>

                </div>
            </div>
        </div>
    );
};
