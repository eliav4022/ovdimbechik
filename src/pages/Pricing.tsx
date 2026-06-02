import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../context/ToastContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Check, Zap, Rocket, Star, Shield, Gift, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const PACKAGES = [
    {
        id: 'basic',
        name: 'מסלול התנעה',
        price: 199,
        credits: 5,
        description: 'הפתרון האידיאלי למעסיקים שמחפשים גיוס ממוקד ומהיר.',
        features: [
            '5 קרדיטים לפרסום משרות',
            'חשיפה בלוח המשרות הראשי',
            'ממשק ניהול מועמדים ידידותי',
            'תמיכה טכנית במייל'
        ],
        icon: Zap,
        color: 'slate'
    },
    {
        id: 'pro',
        name: 'מסלול צמיחה',
        price: 499,
        credits: 15,
        description: 'המסלול המועדף על עסקים בצמיחה. מקסימום חשיפה למועמדים.',
        features: [
            '15 קרדיטים לפרסום משרות',
            'אפשרות להדגשת משרות "חמות"',
            'תו אימות "מעסיק מאומת"',
            'תמיכה מועדפת בוואטסאפ',
            'לוח דוחות וביצועי משרות'
        ],
        icon: Rocket,
        color: 'brand-teal',
        highlighted: true
    },
    {
        id: 'elite',
        name: 'מסלול ארגוני',
        price: 999,
        credits: 50,
        description: 'המעטפת המלאה למגייסים מקצועיים. חשיפה נרחבת וליווי אישי.',
        features: [
            '50 קרדיטים לפרסום משרות',
            'קידום אוטומטי לראש הלוח',
            'ליווי אישי בתהליך הגיוס',
            'תמיכה טלפונית VIP',
            'אינטגרציה למערכות גיוס'
        ],
        icon: Star,
        color: 'brand-orange'
    }
];

const Pricing: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
        if (!user) {
            toast('אנא התחבר כדי לרכוש חבילה', 'error');
            navigate('/login');
            return;
        }

        const message = encodeURIComponent(`היי, אני מעוניין לרכוש את חבילת הפרסום: ${pkg.name}.`);
        window.open(`https://api.whatsapp.com/send/?phone=972552993643&text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 font-sans" dir="rtl">
            <Helmet>
                <title>חבילות פרסום ותמחור | עובדים בצ'יק</title>
                <meta name="description" content="מצא את החבילה המתאימה ביותר לעסק שלך והתחל לגייס עובדים מוכשרים עוד היום." />
            </Helmet>

            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-full text-sm font-black mb-6"
                    >
                        <Shield size={16} />
                        <span>גיוס בטוח, מהיר וחכם</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight">השקעות שחוזרות <span className="text-brand-teal">בצ'יק</span></h1>
                    <p className="text-lg md:text-xl text-slate-500 font-bold max-w-2xl mx-auto px-4 md:px-0">
                        בחר את החבילה שמתאימה לצרכי הגיוס שלך. אין התחייבות, אפשר לשדרג או לבטל בכל זמן.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {PACKAGES.map((pkg, i) => (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "relative bg-white rounded-[2rem] md:rounded-[3rem] p-6 sm:p-8 md:p-10 border-4 transition-all hover:scale-105",
                                pkg.highlighted ? "border-brand-teal shadow-2xl shadow-teal-500/10 scale-105 z-10" : "border-slate-50 shadow-xl shadow-slate-200/50"
                            )}
                        >
                            {pkg.highlighted && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-teal text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-wider">
                                    החבילה המבוקשת
                                </div>
                            )}

                            <div className={cn(
                                "w-16 h-16 rounded-3xl flex items-center justify-center mb-8",
                                pkg.color === 'brand-teal' ? "bg-teal-50 text-teal-600" : 
                                pkg.color === 'brand-orange' ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-600"
                            )}>
                                <pkg.icon size={32} />
                            </div>

                            <h3 className="text-3xl font-black text-slate-900 mb-2">{pkg.name}</h3>
                            <p className="text-slate-500 font-bold mb-6 min-h-[3rem]">{pkg.description}</p>

                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-5xl font-black text-slate-900">₪{pkg.price}</span>
                                <span className="text-slate-400 font-bold">/ חד פעמי</span>
                            </div>

                            <div className="space-y-4 mb-10">
                                {pkg.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                                            <Check size={14} className="stroke-[3]" />
                                        </div>
                                        <span className="text-slate-600 font-bold text-sm tracking-tight">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handlePurchase(pkg)}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-black transition-all transform active:scale-95 shadow-lg",
                                    pkg.highlighted ? "bg-brand-teal text-white shadow-teal-500/20 hover:shadow-teal-500/40" : "bg-slate-900 text-white hover:bg-slate-800"
                                )}
                            >
                                רכישה באמצעות WhatsApp
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <button 
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>חזרה</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
