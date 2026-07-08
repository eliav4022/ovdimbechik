import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Shield, FileText, DollarSign, Clock, CalendarHeart, Bus, Plane, PiggyBank, Thermometer, Info } from 'lucide-react';

const RIGHTS_DATA = [
    {
        title: 'חוזה עבודה (הודעה לעובד)',
        description: 'על המעסיק למסור לעובד הסכם עבודה או "הודעה על תנאי העסקה" בכתב תוך 30 ימים מתחילת העבודה, המפרטים את כלל התנאים.',
        icon: FileText,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100'
    },
    {
        title: 'שכר מינימום',
        description: 'אין להעסיק עובד בשכר נמוך מהשכר הקבוע בחוק. נכון לשנת 2026, שכר המינימום עומד על 5,880.02 ₪ לחודש (למשרה מלאה).',
        icon: DollarSign,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100'
    },
    {
        title: 'שעות עבודה ושעות נוספות',
        description: 'שבוע עבודה מלא עומד על 42 שעות. יום עבודה רגיל הוא 8-9 שעות. כל שעה מעבר לכך מזכה בתשלום שעות נוספות (125% לשעתיים הראשונות, ו-150% החל מהשעה השלישית).',
        icon: Clock,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-100'
    },
    {
        title: 'ימי מנוחה',
        description: 'כל עובד זכאי למנוחה שבועית של 36 שעות רצופות לפחות. ליהודים – בשבת, ולבני דתות אחרות – לפי דתם (שישי, שבת או ראשון).',
        icon: CalendarHeart,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-100'
    },
    {
        title: 'החזר הוצאות נסיעה',
        description: 'עובד שגר במרחק של מעל 500 מטר ממקום העבודה זכאי להחזר נסיעות, עד לתקרה של 22.60 ₪ ליום (או עלות חופשי-חודשי, הנמוך מביניהם).',
        icon: Bus,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100'
    },
    {
        title: 'חופשה שנתית',
        description: 'כל עובד זכאי לימי חופשה בתשלום בהתאם לוותק שלו במקום העבודה ולמספר ימי העבודה בשבוע (מינימום 16 ימים בשנה כולל סופ"ש למשרה מלאה).',
        icon: Plane,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        border: 'border-cyan-100'
    },
    {
        title: 'הפרשות לפנסיה',
        description: 'חובה על מעסיק להפריש לביטוח פנסיוני. לעובד ללא קופה פעילה – לאחר 6 חודשי עבודה. לעובד עם קופה פעילה – מהיום הראשון (משולם רטרואקטיבית אחרי 3 חודשים).',
        icon: PiggyBank,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-100'
    },
    {
        title: 'דמי מחלה',
        description: 'עובד זכאי ל-1.5 ימי מחלה בחודש (18 בשנה). התשלום: יום ראשון ללא תשלום, ימים 2-3 תשלום של 50%, והחל מהיום הרביעי תשלום מלא (100%).',
        icon: Thermometer,
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        border: 'border-pink-100'
    }
];

export const RightsGuide: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden text-right font-sans" dir="rtl">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-slate-200/40 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-100/30 blur-[120px] pointer-events-none" />

            <div className="relative z-10 pt-24 pb-24 max-w-[1000px] mx-auto px-6 sm:px-8">
                <Helmet>
                    <title>זכויות עובדים | עובדים בצ'יק</title>
                    <meta name="description" content="מידע חשוב על זכויות העובד לפני תחילת עבודה: שכר מינימום, שעות עבודה, נסיעות, פנסיה ועוד." />
                </Helmet>

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 text-sm font-medium mb-8 shadow-sm">
                        <Shield size={16} className="text-emerald-500" />
                        זכויות בסיסיות
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                        זכויות העובד
                        <br />
                        <span className="text-slate-500 text-3xl md:text-4xl font-normal mt-2 block">מידע חשוב לפני תחילת עבודה</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        הכרת הזכויות שלך היא הצעד הראשון לכניסה מוצלחת ובטוחה לשוק העבודה. ריכזנו עבורך את הזכויות המרכזיות שמגיעות לכל עובד בישראל.
                    </p>
                </motion.div>

                {/* Rights Grid */}
                <div className="grid sm:grid-cols-2 gap-6">
                    {RIGHTS_DATA.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="flex items-start gap-5">
                                <div className={`w-14 h-14 rounded-2xl ${item.bg} border ${item.border} flex items-center justify-center shrink-0`}>
                                    <item.icon size={28} className={item.color} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium text-slate-900 mb-3">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Info Note */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-12 bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4"
                >
                    <Info className="text-blue-500 shrink-0 mt-1" size={24} />
                    <div className="text-blue-900">
                        <strong className="block mb-1">לתשומת לבך:</strong>
                        המידע בעמוד זה הינו לידיעה כללית בלבד, תמציתי ומעודכן לשנת 2026. הוא אינו מהווה ייעוץ משפטי. במקרה של ספק או פגיעה בזכויותיך, מומלץ להתייעץ עם עורך דין המתמחה בדיני עבודה או לפנות לזרוע העבודה במשרד הכלכלה.
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
