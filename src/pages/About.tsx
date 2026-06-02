import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Target, Users, Zap, Award, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const About: React.FC = () => {
    return (
        <div className="min-h-screen bg-bg-light pt-24 pb-20 text-right" dir="rtl">
            <Helmet>
                <title>אודות | עובדים בצ'יק</title>
                <meta name="description" content="הכירו את עובדים בצ'יק - לוח הדרושים המהיר והמתקדם בישראל המבוסס על בינה מלאכותית." />
            </Helmet>
            <div className="max-w-5xl mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <div className="inline-block bg-primary/10 text-primary px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-6 border border-primary/10">
                        הסיפור שלנו
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-text-main mb-6 md:mb-8 tracking-tighter leading-tight">המהפכה בחיפוש העבודה <span className="text-primary">מתחילה כאן</span></h1>
                    <p className="text-lg md:text-xl text-text-muted font-bold max-w-2xl mx-auto leading-relaxed px-4 md:px-0">עובדים בצ'יק היא הפלטפורמה המתקדמת ביותר בישראל לחיבור מהיר, חכם ואנושי בין מעסיקים למחפשי עבודה.</p>
                </motion.div>

                <div className="space-y-16">
                    <section className="bg-white rounded-[2rem] md:rounded-[4rem] p-6 sm:p-10 md:p-16 shadow-2xl shadow-slate-200/60 border border-slate-50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                        <div className="flex flex-col md:flex-row gap-16 items-center relative z-10">
                            <div className="flex-1">
                                <h2 className="text-3xl font-black text-text-main mb-6 flex items-center gap-4">
                                    <div className="w-2 h-10 bg-primary rounded-full" /> החזון שלנו
                                </h2>
                                <p className="text-text-main leading-loose font-medium text-lg opacity-80 decoration-highlight/30 decoration-thickness-2">
                                    אנחנו מאמינים שתהליך מציאת עבודה לא אמור להיות מתיש, ארוך או מתסכל. החזון שלנו הוא להפוך כל גיוס וכל מציאת עבודה לחוויה חיובית, שקופה ומהירה - <span className="text-primary font-black font-serif italic">"בצ'יק"</span>. אנחנו משלבים טכנולוגיית AI עם חוויית משתמש מנצחת כדי לקצר את הדרך לקריירה הבאה שלך.
                                </p>
                            </div>
                            <div className="w-full md:w-2/5 aspect-square bg-bg-light rounded-[3rem] flex items-center justify-center border-2 border-slate-50 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                <Zap size={80} className="text-primary group-hover:text-white group-hover:scale-110 transition-all" />
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { title: 'התאמה חכמה', desc: 'אלגוריתם ה-AI שלנו לומד את הניסיון והשאיפות שלך ומציע משרות שבאמת מתאימות.', icon: Heart, color: 'bg-red-50 text-red-500' },
                            { title: 'שקיפות מלאה', desc: 'אנחנו מוודאים שכל משרה ומעסיק מאומתים כדי לספק לכם סביבת עבודה בטוחה.', icon: ShieldCheck, color: 'bg-green-50 text-green-500' },
                            { title: 'קהילה חזקה', desc: 'אלפי מעסיקים ומחפשי עבודה כבר מצאו את הבית המקצועי שלהם אצלנו.', icon: Users, color: 'bg-blue-50 text-blue-500' },
                            { title: 'מצוינות טכנולוגית', desc: 'הכלים שלנו נבנו בקפידה כדי לתת לכם את יתרון על פני המתחרים.', icon: Award, color: 'bg-highlight/10 text-primary' }
                        ].map((item, i) => (
                            <motion.div 
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 hover:shadow-2xl hover:translate-y-[-8px] transition-all group"
                            >
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-soft group-hover:scale-110 transition-transform", item.color)}>
                                    <item.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-text-main mb-3">{item.title}</h3>
                                <p className="text-text-muted font-bold text-base leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="mt-16 md:mt-24 text-center bg-slate-900 rounded-[2rem] md:rounded-[4rem] p-8 sm:p-12 md:p-20 text-white overflow-hidden relative shadow-2xl shadow-primary/20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 relative z-10 tracking-tight leading-tight">מוכנים להתחיל בשינוי? ✨</h2>
                    <p className="text-white/60 mb-10 md:mb-12 text-lg md:text-xl relative z-10 max-w-2xl mx-auto font-bold leading-relaxed px-4 md:px-0">הצטרפו לאלפי הישראלים שכבר שינו את הקריירה שלהם בצ'יק. הקריירה החדשה שלך נמצאת במרחק קליק.</p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                        <Link to="/" className="bg-primary text-white px-12 py-5 rounded-[1.5rem] font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all text-lg">מצא עבודה עכשיו</Link>
                        <Link to="/register" className="bg-white/5 text-white px-12 py-5 rounded-[1.5rem] font-black border-2 border-white/10 hover:bg-white/10 transition-all text-lg backdrop-blur-sm">אני מחפש עובדים</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
