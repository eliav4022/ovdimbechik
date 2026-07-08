import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, AlertCircle, Sparkles, Phone, Mail, Link as LinkIcon, User, Star, Lightbulb, Target } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const CvGuide: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden text-right font-sans" dir="rtl">
            {/* Ambient Background Blur Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-amber-100/30 blur-[100px] pointer-events-none" />
            <div className="absolute top-[20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/30 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-teal-50/40 blur-[100px] pointer-events-none" />

            <div className="relative z-10 pt-24 pb-24 max-w-[850px] mx-auto px-6 sm:px-8">
                <Helmet>
                    <title>איך כותבים קורות חיים טובים? | המדריך המלא</title>
                    <meta name="description" content="המדריך המלא לכתיבת קורות חיים מנצחים: מה לכלול, מה להשמיט, ואיך לבלוט מעל כולם." />
                </Helmet>

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-full text-slate-600 text-sm font-medium mb-8 shadow-sm">
                        <Sparkles size={16} className="text-amber-500" />
                        המדריך המלא
                    </div>
                    <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                        קורות החיים הם<br />כרטיס הביקור שלך
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        המסמך הראשון שמעסיק רואה ודרכו הוא מחליט אם לזמן אותך לראיון.
                        קורות חיים כתובים היטב יכולים לעשות את ההבדל בין התעלמות מוחלטת לבין הזמנה לראיון.
                    </p>
                </motion.div>

                {/* Content Sections */}
                <div className="space-y-8">
                    
                    {/* Intro Summary */}
                    <motion.section 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                        className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    >
                        <h2 className="text-xl md:text-2xl font-medium tracking-tight text-slate-900 mb-8 flex items-center gap-3">
                            <Target size={24} className="text-slate-400" />
                            המבנה המנצח לקורות חיים
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 transition-colors hover:bg-slate-50">
                                <h3 className="font-medium text-slate-900 mb-1 flex items-center gap-2"><User size={18} className="text-slate-400" /> פרטים אישיים</h3>
                                <p className="text-slate-500 text-sm">שם | טלפון | אימייל מקצועי</p>
                            </div>
                            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 transition-colors hover:bg-slate-50">
                                <h3 className="font-medium text-slate-900 mb-1 flex items-center gap-2"><FileText size={18} className="text-slate-400" /> תקציר אישי</h3>
                                <p className="text-slate-500 text-sm">2-3 שורות על מי אתם ולמה אתם</p>
                            </div>
                            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 transition-colors hover:bg-slate-50">
                                <h3 className="font-medium text-slate-900 mb-1 flex items-center gap-2"><CheckCircle2 size={18} className="text-slate-400" /> ניסיון תעסוקתי</h3>
                                <p className="text-slate-500 text-sm">תפקידים מקצועיים מהאחרון לישן</p>
                            </div>
                            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 transition-colors hover:bg-slate-50">
                                <h3 className="font-medium text-slate-900 mb-1 flex items-center gap-2"><Star size={18} className="text-slate-400" /> השכלה והכשרות</h3>
                                <p className="text-slate-500 text-sm">תארים, קורסים והשתלמויות</p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Section 1: Personal Info */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">1</div>
                            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-slate-900">
                                מה לכלול בפרטים האישיים?
                            </h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900 text-lg">שם מלא</h4>
                                    <p className="text-slate-500 leading-relaxed mt-1">כותבים בראש העמוד, בגדול ובולט. אין צורך בתואר אלא אם רלוונטי.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <Phone size={14} className="text-slate-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900 text-lg">מספר טלפון נייד</h4>
                                    <p className="text-slate-500 leading-relaxed mt-1">ודא שהוא נכון ופעיל. הימנע ממספרים ישנים או קווי בית.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <Mail size={14} className="text-slate-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900 text-lg">כתובת דוא"ל מקצועית</h4>
                                    <p className="text-slate-500 leading-relaxed mt-1">Gmail נחשב לרציני יותר. הימנע משמות מצחיקים במייל.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <LinkIcon size={14} className="text-slate-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900 text-lg">קישורים מקצועיים</h4>
                                    <p className="text-slate-500 leading-relaxed mt-1">LinkedIn מעודכן, תיק עבודות, GitHub - רק אם רלוונטי. אין צורך בפייסבוק.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 bg-amber-50/50 rounded-2xl p-6 border border-amber-100/50">
                            <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                                <Lightbulb size={18} className="text-amber-500" />
                                טיפים חשובים
                            </h4>
                            <ul className="space-y-3 text-slate-600 text-sm md:text-base">
                                <li className="flex gap-2"><span className="text-amber-500/50">•</span> מיקום: בראש העמוד, לפני כל תוכן אחר.</li>
                                <li className="flex gap-2"><span className="text-amber-500/50">•</span> שפה: אם הקו"ח באנגלית – גם הפרטים יהיו באנגלית.</li>
                                <li className="flex gap-2"><span className="text-amber-500/50">•</span> תמונה: אין צורך, אלא אם מדובר בתחום בו המראה חזותי קריטי.</li>
                                <li className="flex gap-2"><span className="text-amber-500/50">•</span> מצב משפחתי וגיל: נחשב למיושן, אפשר להשמיט.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 2: Summary */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">2</div>
                            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-slate-900">
                                התקציר האישי
                            </h2>
                        </div>
                        <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                            המטרה היא לספק תמצית של הניסיון, הכישורים והייחודיות שלך, וליצור עניין שיגרום למעסיק להמשיך לקרוא.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                <h4 className="font-medium text-slate-900 mb-4">מה לכלול?</h4>
                                <ul className="space-y-4 text-slate-600 text-sm">
                                    <li><span className="font-medium text-slate-900 block mb-1">תפקיד / תחום עיסוק</span> "אנליסט נתונים עם ניסיון של 4 שנים..."</li>
                                    <li><span className="font-medium text-slate-900 block mb-1">שנות ניסיון</span> "בעל ניסיון של למעלה מ-6 שנים בהובלת צוותים..."</li>
                                    <li><span className="font-medium text-slate-900 block mb-1">תחומי התמחות</span> שפות תכנות, ניהול, שירות לקוחות וכו'.</li>
                                    <li><span className="font-medium text-slate-900 block mb-1">תכונות אישיות</span> חשיבה אנליטית, פתרון בעיות (ולא סתם "ראש גדול").</li>
                                </ul>
                            </div>

                            <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                                    <Star size={16} className="text-amber-400" />
                                    דוגמה מנצחת
                                </h4>
                                <p className="text-sm leading-relaxed text-slate-300 italic">
                                    "מנהלת שיווק עם ניסיון של 7 שנים בניהול קמפיינים דיגיטליים במגוון פלטפורמות. מומחית בבניית אסטרטגיות תוכן, ניתוח ביצועים והובלת צוותים קטנים. בעלת חשיבה קריאטיבית ויכולת ביצועית גבוהה. שואפת להשתלב בחברה טכנולוגית מובילה."
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Experience */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">3</div>
                            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-slate-900">
                                ניסיון תעסוקתי
                            </h2>
                        </div>
                        
                        <div className="grid sm:grid-cols-3 gap-6 mb-10">
                            <div>
                                <div className="h-1 w-8 bg-slate-200 rounded-full mb-4"></div>
                                <h4 className="font-medium text-slate-900 mb-2">מבנה בסיסי</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">שם החברה | הגדרת התפקיד | תקופת עבודה (יולי 2020 – נובמבר 2023)</p>
                            </div>
                            <div>
                                <div className="h-1 w-8 bg-slate-200 rounded-full mb-4"></div>
                                <h4 className="font-medium text-slate-900 mb-2">תיאור התפקיד</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">השתמש בפעלים חזקים (ניהול, הובלה, פיתוח, יישום). תמציתי: 3-5 שורות לתפקיד.</p>
                            </div>
                            <div>
                                <div className="h-1 w-8 bg-slate-200 rounded-full mb-4"></div>
                                <h4 className="font-medium text-slate-900 mb-2">הישגים בולטים</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">הוסף נתונים מספריים. למשל: "הובלתי קמפיין שהביא לעלייה של 35% בלידים".</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-4">דוגמה מעשית</h4>
                            <div className="pl-4 border-l-2 border-slate-200">
                                <div className="font-medium text-slate-900">מנהל פרויקטים טכנולוגיים <span className="text-slate-400 mx-2">|</span> מטריקס, תל אביב</div>
                                <div className="text-sm text-slate-500 mb-4 mt-1">אוקטובר 2020 – ינואר 2024</div>
                                <ul className="space-y-2 text-slate-600 text-sm">
                                    <li className="flex gap-2 items-start"><span className="text-slate-300 mt-0.5">•</span> ניהול והובלת פרויקטים בתחום הדיגיטל מול לקוחות אנטרפרייז.</li>
                                    <li className="flex gap-2 items-start"><span className="text-slate-300 mt-0.5">•</span> אחריות על ניתוח צרכים, כתיבת אפיונים ובניית לו"ז.</li>
                                    <li className="flex gap-2 items-start"><span className="text-slate-300 mt-0.5">•</span> הובלת מעבר מוצלח לענן שהביא לחיסכון של 20% בהוצאות.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Sections 4 & 5: Education & Skills */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">4</div>
                                <h2 className="text-xl font-medium tracking-tight text-slate-900">
                                    השכלה והכשרות
                                </h2>
                            </div>
                            <ul className="space-y-4 text-slate-600 text-sm leading-relaxed">
                                <li className="flex gap-3 items-start"><CheckCircle2 size={16} className="text-slate-400 shrink-0 mt-0.5" /> כתבו בסדר כרונולוגי הפוך.</li>
                                <li className="flex gap-3 items-start"><CheckCircle2 size={16} className="text-slate-400 shrink-0 mt-0.5" /> ציינו: מוסד לימודים, שם התואר/הכשרה, שנות לימוד.</li>
                                <li className="flex gap-3 items-start"><CheckCircle2 size={16} className="text-slate-400 shrink-0 mt-0.5" /> הוסיפו ממוצע או הצטיינות רק אם זה מרשים (90+).</li>
                                <li className="flex gap-3 items-start"><AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" /> הימנעו מקורסים לא רלוונטיים למשרה.</li>
                            </ul>
                        </section>

                        <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">5</div>
                                <h2 className="text-xl font-medium tracking-tight text-slate-900">
                                    מיומנויות
                                </h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-medium text-slate-900 mb-1">מיומנויות טכניות (Hard Skills)</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">תוכנות, שפות תכנות, כלי ניתוח, הסמכות מקצועיות.</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900 mb-1">מיומנויות רכות (Soft Skills)</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">ניהול זמן, עבודת צוות, פתרון בעיות. השתדלו להימנע מקלישאות גנריות.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Section 6 & 7: Recommendations & Final Tips */}
                    <section className="bg-[#1C1C1C] text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[80px] pointer-events-none" />
                        
                        <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-8 relative z-10 flex items-center gap-3">
                            <Sparkles size={24} className="text-amber-400/80" />
                            רגע לפני שליחה
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                            <div className="border-t border-white/10 pt-4">
                                <h4 className="font-medium text-white mb-2">התאמה למשרה</h4>
                                <p className="text-sm text-white/60 leading-relaxed">התאם את הקו"ח למשרה, שלב מילות מפתח מתוך המודעה.</p>
                            </div>
                            <div className="border-t border-white/10 pt-4">
                                <h4 className="font-medium text-white mb-2">תמציתיות</h4>
                                <p className="text-sm text-white/60 leading-relaxed">עמוד אחד או שניים לכל היותר. היה ענייני, ברור וממוקד.</p>
                            </div>
                            <div className="border-t border-white/10 pt-4">
                                <h4 className="font-medium text-white mb-2">הגהה מלאה</h4>
                                <p className="text-sm text-white/60 leading-relaxed">בדוק שגיאות כתיב. טעות במספר הטלפון עלולה להיות קריטית.</p>
                            </div>
                            <div className="border-t border-white/10 pt-4">
                                <h4 className="font-medium text-white mb-2">פורמט</h4>
                                <p className="text-sm text-white/60 leading-relaxed">שלח רק כקובץ PDF. שים לב שהעיצוב נקי, פשוט ומסודר.</p>
                            </div>
                        </div>
                    </section>

                    {/* CTA Service */}
                    <section className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-10 md:p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden mt-8">
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 mb-6 shadow-sm">
                                <FileText size={28} />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 mb-6">
                                תן לנו להפוך את קורות החיים שלך לבלתי נשכחים
                            </h2>
                            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                                עם שירות בניית קורות החיים שלנו תקבל מסמך מקצועי, ממוקד וייחודי שמבליט את החוזקות שלך. אנחנו לא רק "מסדרים טקסט" — אנחנו מספרים את הסיפור שלך בצורה שמקדמת אותך לתפקיד הבא.
                            </p>
                            <Button 
                                size="lg" 
                                className="bg-slate-900 text-white hover:bg-slate-800 h-14 px-8 rounded-full text-base font-medium shadow-sm transition-all hover:shadow-md"
                            >
                                <Phone size={18} className="ml-2" />
                                לפרטים נוספים
                            </Button>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

