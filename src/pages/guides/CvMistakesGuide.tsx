import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FileWarning, Sparkles, ChevronLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Link } from 'react-router-dom';

export const CvMistakesGuide: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden text-right font-sans" dir="rtl">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-red-100/40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-100/30 blur-[120px] pointer-events-none" />

            <div className="relative z-10 pt-24 pb-24 max-w-[900px] mx-auto px-6 sm:px-8">
                <Helmet>
                    <title>5 טעויות שגורמות לקורות החיים שלך להידחות | עובדים בצ'יק</title>
                    <meta name="description" content="מגייסים מזהים טעויות מהר. הימנע משגיאות כתיב, אורך מוגזם, מבנה מבלבל ועיצוב לא מקצועי בקורות החיים שלך." />
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-full text-red-700 text-sm font-medium mb-8 shadow-sm">
                        <FileWarning size={16} />
                        מדריך למחפשי עבודה
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                        5 טעויות שגורמות
                        <br />
                        <span className="text-red-500 font-bold mt-2 block">לקורות החיים שלך להידחות</span>
                    </h1>
                </motion.div>

                {/* Content */}
                <div className="space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                        <Card className="p-6 md:p-8 border-slate-200/60 shadow-sm bg-white hover:border-red-200 transition-colors">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center font-bold shrink-0">1</div>
                                שגיאות כתיב ותחביר
                            </h2>
                            <p className="text-lg text-slate-700 leading-relaxed pr-13">
                                הטעות הכי בסיסית שעדיין חוזרת על עצמה. מגייסים שמזהים שגיאות כתיב או תחביר עלולים לפרש זאת כחוסר רצינות או מקצועיות. תמיד ערוך הגהה לפני שליחה — ועדיף שזוג עיניים נוסף יעבור על המסמך.
                            </p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Card className="p-6 md:p-8 border-slate-200/60 shadow-sm bg-white hover:border-orange-200 transition-colors">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold shrink-0">2</div>
                                מבנה לא ברור או מבלבל
                            </h2>
                            <p className="text-lg text-slate-700 leading-relaxed pr-13">
                                אם קורות החיים שלך לא קריאים, או שהמידע החשוב "קבור" בתוך טקסט צפוף, המגייס פשוט יפסיק לקרוא. הקפד על מבנה היררכי עם כותרות, נקודות ותחנות ברורות.
                            </p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                        <Card className="p-6 md:p-8 border-slate-200/60 shadow-sm bg-white hover:border-amber-200 transition-colors">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold shrink-0">3</div>
                                אורך מוגזם או קצר מדי
                            </h2>
                            <p className="text-lg text-slate-700 leading-relaxed pr-13">
                                קורות חיים בני עמוד אחד הם סטנדרט מקובל ברוב התחומים. אם אתה כותב 3 עמודים — כנראה הוספת מידע לא רלוונטי. אם אתה כותב חצי עמוד — כנראה השמטת מידע חשוב.
                            </p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                        <Card className="p-6 md:p-8 border-slate-200/60 shadow-sm bg-white hover:border-blue-200 transition-colors">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-bold shrink-0">4</div>
                                הכללות וחוסר התאמה למשרה
                            </h2>
                            <p className="text-lg text-slate-700 leading-relaxed pr-13">
                                מועמדים רבים שולחים את אותם קורות חיים לכל משרה. מגייסים מרגישים בכך מיד. נסה לכלול מילות מפתח שמופיעות בדרישות התפקיד והתאם את קורות החיים לכל משרה מחדש.
                            </p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
                        <Card className="p-6 md:p-8 border-slate-200/60 shadow-sm bg-white hover:border-purple-200 transition-colors">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center font-bold shrink-0">5</div>
                                עיצוב לא מקצועי או שימוש בתבניות מיושנות
                            </h2>
                            <p className="text-lg text-slate-700 leading-relaxed pr-13">
                                עיצוב חשוב! יותר מדי צבעים, פונטים שונים, או גרפיקה מיותרת יוצרים עומס. השתמש בעיצוב נקי ומודרני. קורות חיים צריכים להיות קודם כל ברורים.
                            </p>
                        </Card>
                    </motion.div>

                    {/* Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-12"
                    >
                        <Card className="p-8 border-slate-800 bg-slate-900 text-white rounded-3xl text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 pointer-events-none" />
                            <div className="relative z-10">
                                <Sparkles className="text-amber-400 mx-auto mb-4" size={32} />
                                <h2 className="text-2xl font-semibold mb-4">רוצה לבלוט מול מגייסים?</h2>
                                <p className="text-slate-300 text-lg leading-relaxed mb-0 max-w-2xl mx-auto">
                                    השקעה בקורות החיים היא הצעד הראשון. <br/>
                                    <strong className="text-white">כתיבה מקצועית, התאמה אישית ועיצוב נכון עושים את ההבדל.</strong>
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
