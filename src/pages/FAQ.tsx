import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, ChevronDown, MessageSquare, Zap, Shield, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';

const FAQ: React.FC = () => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(0);
    const navigate = useNavigate();

    const questions = [
        {
            q: 'איך עובד תהליך הגשת המועמדות?',
            a: 'התהליך פשוט מאוד: מוצאים משרה שמתאימה לכם, לוחצים על "הגש מועמדות", מעלים קורות חיים והמועמדות שלכם נשלחת ישירות למעסיק. תוכלו לעקוב אחר סטטוס הבקשה בדשבורד האישי שלכם.',
            icon: Zap
        },
        {
            q: 'האם השימוש באתר כרוך בתשלום למחפשי עבודה?',
            a: 'לא, השימוש באתר "עובדים בצ\'יק" למחפשי עבודה הוא חינמי לחלוטין. אנחנו מאמינים בנגישות מלאה להזדמנויות תעסוקה.',
            icon: Shield
        },
        {
            q: 'איך אני יודע אם המשרה אמיתית?',
            a: 'אנחנו מפעילים מערך אימות (Verification) קפדני. משרות שקיבלו את תג "משרה מאומתת" נבחנו ידנית על ידי הצוות שלנו. בנוסף, תוכלו לראות תגי "מעסיק מאומת" עבור חברות מוכרות ומהימנות.',
            icon: Search
        },
        {
            q: 'מה עושים אם נתקלתי בתוכן פוגעני או משרה חשודה?',
            a: 'בכל משרה ישנו כפתור "דיווח" (אייקון של דגל או סימן קריאה). לחיצה עליו תעביר את הדיווח שלכם ישירות למנהלי המערכת שיבחנו את הנושא תוך זמן קצר.',
            icon: MessageSquare
        }
    ];

    const handleContactClick = () => {
        trackEvent({
            type: 'contact_click',
            metadata: { source: 'faq_page' }
        });
        navigate('/contact');
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 text-right" dir="rtl">
            <Helmet>
                <title>שאלות ותשובות | עובדים בצ'יק</title>
                <meta name="description" content="כל התשובות לשאלות הנפוצות על עובדים בצ'יק. איך זה עובד, איך מפרסמים משרה ואיך מוצאים עבודה." />
            </Helmet>
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16">
                    <div className="inline-flex p-3 bg-brand-teal/10 text-brand-teal rounded-2xl mb-6">
                        <HelpCircle size={48} />
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 mb-6">שאלות ותשובות</h1>
                    <p className="text-xl text-slate-600 font-bold">כל מה שצריך לדעת על השימוש ב"עובדים בצ'יק"</p>
                </div>

                <div className="space-y-6">
                    {questions.map((item, i) => (
                        <div 
                            key={i}
                            className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all"
                        >
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full p-8 flex items-center justify-between text-right outline-none"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                        openIndex === i ? "bg-brand-teal text-white" : "bg-slate-50 text-slate-400"
                                    )}>
                                        <item.icon size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">{item.q}</h3>
                                </div>
                                <ChevronDown className={cn("text-slate-400 transition-transform duration-300", openIndex === i ? "rotate-180" : "")} />
                            </button>
                            
                            <motion.div 
                                initial={false}
                                animate={{ height: openIndex === i ? 'auto' : 0, opacity: openIndex === i ? 1 : 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-8 pt-0 pr-24 text-lg text-slate-500 font-bold leading-relaxed border-t border-slate-50">
                                    {item.a}
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl text-center">
                    <h3 className="text-2xl font-black text-slate-900 mb-4">עדיין יש לכם שאלות?</h3>
                    <p className="text-slate-500 font-bold mb-8">הצוות שלנו זמין עבורכם לכל שאלה נוספת.</p>
                    <button 
                        onClick={handleContactClick}
                        className="bg-brand-teal text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-teal-500/20 hover:scale-105 transition-all"
                    >
                        צור קשר עם התמיכה
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
