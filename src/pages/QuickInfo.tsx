import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FileText, DollarSign, BrainCircuit, Building, Globe, Edit3, Calendar, Link as LinkIcon, Download, CheckSquare, Search, Briefcase, FileType, ChevronDown, Info } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { icon: FileText, title: 'איך כותבים קורות חיים טובים?', link: '/guides/cv-writing' },
  { icon: DollarSign, title: 'טווחי שכר נפוצים לפי תחומים', link: '/guides/salary-ranges' },
  { icon: BrainCircuit, title: 'איך לעבור ראיון עבודה בהצלחה', link: '/guides/interview-prep' },
  { icon: Building, title: 'זכויות עובדים', link: '/guides/employee-rights' },
  { icon: Globe, title: 'עבודה מרחוק – יתרונות וחסרונות', link: '/guides/remote-work' },
  { icon: Edit3, title: 'טיפים לכתיבה נכונה של מודעת דרושים', link: '/guides/job-post-tips' },
];

const UPDATES = [
  { date: '12 באוקטובר 2025', source: 'סקר עצמאי', title: 'יותר עובדים דורשים עבודה היברידית', description: 'סקר חדש מצא כי מעל 65% מהעובדים מעדיפים לשלב עבודה מהבית עם הגעה למשרד, ומעסיקים מתחילים להיערך בהתאם.' },
  { date: '05 באוקטובר 2025', source: 'הלשכה המרכזית לסטטיסטיקה', title: 'עלייה בדרישה למקצועות טכנולוגיים', description: 'במהלך 2025 נרשמה עלייה של 18% בביקוש למפתחי תוכנה, אנליסטים ומדעני נתונים, במיוחד בחברות סטארט־אפ.' },
  { date: '28 בספטמבר 2025', source: 'משרד הכלכלה', title: 'שכר המינימום בישראל צפוי להתעדכן', description: 'משרד הכלכלה הודיע על כוונה להעלות את שכר המינימום ל־6,500 ש"ח, בכפוף לאישור סופי.' },
  { date: '15 בספטמבר 2025', source: 'מחקר HR', title: 'מעסיקים מתמקדים ברווחת עובדים', description: 'יותר חברות מציעות תוכניות לרווחה נפשית, שעות גמישות וחדרי מנוחה, כחלק ממאמץ להגברת שביעות הרצון של העובדים.' },
  { date: '01 בספטמבר 2025', source: 'איגוד חברות ההשמה', title: 'ירידה חדה בביקוש לעובדים זמניים', description: 'סוכנויות השמה מדווחות על ירידה של 23% בדרישה לעובדים זמניים, בעיקר בתחומי המכירות והשירות.' },
  { date: '20 באוגוסט 2025', source: 'פורום אנרגיה ירוקה', title: 'תחום האנרגיה הירוקה מגייס עובדים חדשים', description: 'חברות בתחומי האנרגיה הסולארית והחשמל החכם פתחו משרות חדשות למהנדסים, מתקינים ואנשי שיווק.' },
  { date: '10 באוגוסט 2025', source: 'דוח בינלאומי', title: 'רובוטים ובינה מלאכותית משנים את שוק העבודה', description: 'דוחות בינלאומיים מעריכים כי עד שנת 2030 משרות רבות יושפעו מתהליכי אוטומציה ובינה מלאכותית.' },
  { date: '05 באוגוסט 2025', source: 'מכון מחקר אקדמי', title: 'עובדים צעירים דורשים משמעות בעבודה', description: 'מחקרים בקרב צעירים מראים כי דור ה־Z מחפש משרות עם ערך חברתי, גמישות ואיזון בין העבודה לחיים האישיים, ולא רק שכר גבוה.' },
];

const GUIDES = [
  {
    category: 'טעויות בקורות חיים',
    title: '5 טעויות שגורמות לקורות החיים שלך להידחות',
    summary: 'ריכזנו עבורך את הטעויות הנפוצות ביותר שעלולות לגרום למעסיקים לדלג על קורות החיים שלך.',
    img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60',
    link: '/guides/cv-mistakes'
  },
  {
    category: 'פיטורים בוואטסאפ',
    title: 'האם מותר לפטר אותך בוואטסאפ? מדריך לזכויות עובדים',
    summary: 'האם הודעת פיטורים בוואטסאפ חוקית, ומה חשוב לדעת לפני שמגיבים? מדריך קצר וברור.',
    img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60',
    link: '/guides/whatsapp-firing'
  }
];

const FAQ_EMPLOYEES = [
  { q: 'איך שולחים קורות חיים באתר?', a: 'בלחיצה על כפתור "שלח קו"ח" בעמוד המשרה ניתן לצרף קובץ ולהגיש את המועמדות.' },
  { q: 'האם אפשר לדעת אם ראו את הפנייה שלי?', a: 'אם קיימת באתר אפשרות מעקב אחר פניות, יש להציג התראה באזור האישי לאחר שהמעסיק צפה בפנייה.' },
  { q: 'איך אני יודע אם משרה אמינה?', a: 'משרות שנבדקו ואומתו יכולות להופיע עם תגית "מעסיק מאומת".' }
];

const FAQ_EMPLOYERS = [
  { q: 'איך מפרסמים משרה באתר?', a: 'יש להיכנס לאזור "פרסם משרה", למלא את פרטי המשרה ולשלוח אותה לפרסום. אם קיימת מערכת אישורים, המשרה תתפרסם לאחר אישור.' },
  { q: 'אפשר לראות סטטיסטיקה של צפיות?', a: 'אם האפשרות קיימת באתר, לוח הבקרה של המעסיק יציג נתונים כגון צפיות ופניות לכל משרה.' },
  { q: 'האם אפשר להקפיא או להסתיר משרה?', a: 'אם הפונקציונליות קיימת, ניתן להיכנס למשרה ולבחור באפשרות "השהה מודעה" או "הסתר".' }
];

const DEFAULT_FREE_TOOLS = [
  { id: 'cv_pdf', icon: FileText, title: 'תבנית קורות חיים – PDF', description: 'תבנית מוכנה להדפסה', type: 'PDF' },
  { id: 'cv_word', icon: FileType, title: 'תבנית קורות חיים – Word', description: 'תבנית ניתנת לעריכה', type: 'Word' },
  { id: 'contract', icon: Briefcase, title: 'חוזה עבודה בסיסי', description: 'דוגמה לחוזה התקשרות', type: 'Word' },
  { id: 'checklist', icon: CheckSquare, title: 'צ\'קליסט לפני ראיון עבודה', description: 'כל מה שצריך להכין', type: 'PDF' },
];

export const QuickInfo: React.FC = () => {
    const [visibleUpdates, setVisibleUpdates] = useState(4);
    const [activeFaqTab, setActiveFaqTab] = useState<'employees'|'employers'>('employees');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [freeToolsLinks, setFreeToolsLinks] = useState<Record<string, string>>({
      cv_pdf: "https://ais-dev-4uf74slrq3fucfg5czsffd-15204860087.europe-west2.run.app/file/cvs/OBFARCBEZLZNdvPpGVBgrKx6Dqq1/admin_1783927694523_%D7%A7%D7%95%D7%A8%D7%95%D7%AA_%D7%97%D7%99%D7%99%D7%9D.pdf",
      cv_word: "/file/cvs/OBFARCBEZLZNdvPpGVBgrKx6Dqq1/admin_1783926905535_%D7%AA%D7%91%D7%A0%D7%99%D7%AA%20%D7%A7%D7%95%D7%A8%D7%95%D7%AA%20%D7%97%D7%99%D7%99%D7%9D%20Word",
      contract: "/file/cvs/OBFARCBEZLZNdvPpGVBgrKx6Dqq1/admin_1783926878023_%D7%9E%D7%A1%D7%9E%D7%9A-5.docx",
      checklist: "/file/cvs/OBFARCBEZLZNdvPpGVBgrKx6Dqq1/admin_1783926857191_%D7%A6'%D7%A7%20%D7%9C%D7%99%D7%A1%D7%98%20%D7%94%D7%9B%D7%A0%D7%94%20%D7%9C%D7%A8%D7%90%D7%99%D7%95%D7%9F%20%D7%A2%D7%91%D7%95%D7%93%D7%94"
    });

    React.useEffect(() => {
        import('firebase/firestore').then(({ doc, getDoc }) => {
            import('../lib/firebase').then(({ db }) => {
                getDoc(doc(db, 'settings', 'quickInfo')).then(snap => {
                    if (snap.exists() && snap.data().links) {
                        setFreeToolsLinks(prev => ({ ...prev, ...snap.data().links }));
                    }
                }).catch(console.error);
            });
        });
    }, []);

    const faqs = activeFaqTab === 'employees' ? FAQ_EMPLOYEES : FAQ_EMPLOYERS;
    const toolsToRender = DEFAULT_FREE_TOOLS.map(t => ({ ...t, link: freeToolsLinks[t.id] }));

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 text-right" dir="rtl">
            <Helmet>
                <title>מידע בצ'יק | עובדים בצ'יק</title>
                <meta name="description" content="המדריכים, העדכונים והכלים החינמיים למחפשי עבודה ולמעסיקים - במקום אחד." />
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Hero */}
                <div className="relative bg-brand-teal text-white rounded-[3rem] p-10 md:p-16 mb-20 overflow-hidden shadow-2xl shadow-brand-teal/20">
                    <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-10">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-start max-w-3xl">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex p-3 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 text-white"
                        >
                            <Info size={32} />
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight"
                        >
                            מידע בצ'יק
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-teal-50 font-medium max-w-2xl"
                        >
                            המרכז שלך לכל מה שצריך לדעת על עולם העבודה. מדריכים, כלים, טיפים ועדכונים - הכל במקום אחד.
                        </motion.p>
                    </div>
                </div>

                {/* Categories Grid */}
                <section className="mb-24">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {CATEGORIES.map((cat, idx) => (
                            <Link to={cat.link} key={idx} className="block group">
                                <Card className="h-full p-8 flex flex-col items-center justify-center text-center hover:bg-brand-teal hover:border-transparent transition-colors group-hover:text-white">
                                    <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                        <cat.icon size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-white transition-colors">
                                        {cat.title}
                                    </h3>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Updates */}
                <section className="mb-24">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-black text-slate-900">עדכונים ומגמות בשוק העבודה</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {UPDATES.slice(0, visibleUpdates).map((update, idx) => (
                            <Card key={idx} className="p-6">
                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {update.date}</span>
                                    <span className="flex items-center gap-1"><LinkIcon size={14} /> {update.source}</span>
                                    <span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-medium">תוכן לדוגמה</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{update.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{update.description}</p>
                            </Card>
                        ))}
                    </div>
                    {visibleUpdates < UPDATES.length && (
                        <div className="text-center mt-10">
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="px-10 rounded-full"
                                onClick={() => setVisibleUpdates(prev => Math.min(prev + 4, UPDATES.length))}
                            >
                                הצג עדכונים נוספים
                            </Button>
                        </div>
                    )}
                </section>

                {/* Guides */}
                <section className="mb-24">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black text-slate-900">📚 מדריכים שיעזרו לכם להבין את שוק העבודה הישראלי</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {GUIDES.map((guide, idx) => (
                            <Card key={idx} className="p-0 overflow-hidden flex flex-col sm:flex-row group cursor-pointer" hoverable>
                                <div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden">
                                    <img src={guide.img} alt={guide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-8 sm:w-3/5 flex flex-col justify-between">
                                    <div>
                                        <span className="inline-block bg-brand-teal/10 text-brand-teal px-3 py-1 rounded-full text-sm font-bold mb-4">
                                            {guide.category}
                                        </span>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-brand-teal transition-colors">
                                            {guide.title}
                                        </h3>
                                        <p className="text-slate-600 mb-6 line-clamp-2">
                                            {guide.summary}
                                        </p>
                                    </div>
                                    <div>
                                        {guide.link ? (
                                            <Link to={guide.link}>
                                                <Button variant="outline" className="w-full sm:w-auto">קרא עוד</Button>
                                            </Link>
                                        ) : (
                                            <Button variant="outline" className="w-full sm:w-auto opacity-50 cursor-not-allowed">בקרוב</Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-24 bg-white rounded-[3rem] p-8 sm:p-12 border border-slate-100 shadow-xl shadow-slate-200/40">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-900">שאלות שכולם שואלים</h2>
                    </div>
                    
                    <div className="flex justify-center mb-10">
                        <div className="bg-slate-100 p-1.5 rounded-full inline-flex">
                            <button
                                onClick={() => { setActiveFaqTab('employees'); setOpenFaqIndex(null); }}
                                className={cn(
                                    "px-8 py-3 rounded-full font-bold text-sm transition-all",
                                    activeFaqTab === 'employees' ? "bg-white text-brand-teal shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                עובדים
                            </button>
                            <button
                                onClick={() => { setActiveFaqTab('employers'); setOpenFaqIndex(null); }}
                                className={cn(
                                    "px-8 py-3 rounded-full font-bold text-sm transition-all",
                                    activeFaqTab === 'employers' ? "bg-white text-brand-teal shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                מעסיקים
                            </button>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                                    className="w-full p-6 flex items-center justify-between text-right outline-none"
                                >
                                    <h3 className="text-lg font-bold text-slate-900">{faq.q}</h3>
                                    <ChevronDown className={cn("text-slate-400 transition-transform duration-300", openFaqIndex === i ? "rotate-180" : "")} />
                                </button>
                                <motion.div
                                    initial={false}
                                    animate={{ height: openFaqIndex === i ? 'auto' : 0, opacity: openFaqIndex === i ? 1 : 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100">
                                        {faq.a}
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Free Tools */}
                <section>
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-black text-slate-900">🟡 כלים חינמיים בצ'יק</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {toolsToRender.map((tool, idx) => (
                            <Card key={idx} className="p-6 text-center hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 mb-5">
                                    <tool.icon size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{tool.title}</h3>
                                <p className="text-sm text-slate-500 mb-6 h-10">{tool.description}</p>
                                {tool.link ? (
                                    <a href={tool.link} target="_blank" rel="noopener noreferrer" className="w-full mt-auto">
                                        <Button variant="primary" className="w-full">
                                            <Download size={16} className="ml-2" />
                                            הורד עכשיו
                                        </Button>
                                    </a>
                                ) : (
                                    <Button variant="outline" className="w-full mt-auto cursor-not-allowed opacity-50" disabled>
                                        <Download size={16} className="ml-2" />
                                        בקרוב
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};
