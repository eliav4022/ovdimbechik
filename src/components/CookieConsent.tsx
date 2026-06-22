import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ShieldCheck, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [preferences, setPreferences] = useState({
        necessary: true,
        analytics: true,
        marketing: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const cookieDoc = await getDoc(doc(db, 'settings', 'cookieConsent'));
                if (cookieDoc.exists()) {
                    setSettings(cookieDoc.data());
                } else {
                    setSettings({
                        isActive: true,
                        title: 'העוגיות שלנו 🍪',
                        message: 'אנחנו משתמשים בעוגיות כדי לשפר את חווית הגלישה שלך, להציג משרות רלוונטיות ולנתח את השימוש באתר שלנו. האם תרצה לאשר את כל העוגיות?',
                        analyticsDesc: 'עוזר לנו להבין איך משתמשים באתר ולשפר ביצועים.',
                        marketingDesc: 'מאפשר לנו להציג לך משרות ומודעות שבאמת רלוונטיות עבורך.'
                    });
                }
            } catch (error) {
                console.error("Error fetching cookie settings:", error);
            }
        };

        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            fetchSettings();
        }
    }, []);

    useEffect(() => {
        if (settings && settings.isActive) {
            setIsVisible(true);
        }
    }, [settings]);

    const handleAcceptAll = () => {
        localStorage.setItem('cookie-consent', 'all');
        setIsVisible(false);
    };

    const handleAcceptNecessary = () => {
        localStorage.setItem('cookie-consent', 'necessary');
        setIsVisible(false);
    };

    const handleSavePreferences = () => {
        localStorage.setItem('cookie-consent', JSON.stringify(preferences));
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" dir="rtl">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden"
                    >
                        <div className="p-8">
                            {!showSettings ? (
                                <div className="text-right">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-highlight/10 text-primary-dark rounded-xl flex items-center justify-center">
                                            <Cookie size={28} />
                                        </div>
                                        <h3 className="text-xl font-black text-text-main">{settings?.title || 'העוגיות שלנו 🍪'}</h3>
                                    </div>
                                    <p className="text-text-muted font-bold text-sm leading-relaxed mb-8">
                                        {settings?.message || 'אנחנו משתמשים בעוגיות כדי לשפר את חווית הגלישה שלך, להציג משרות רלוונטיות ולנתח את השימוש באתר שלנו. האם תרצה לאשר את כל העוגיות?'}
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={handleAcceptAll}
                                            className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                                        >
                                            אישור כל העוגיות
                                        </button>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleAcceptNecessary}
                                                className="flex-1 bg-bg-light text-text-muted py-4 rounded-xl font-black text-sm hover:bg-slate-200 transition-all"
                                            >
                                                הכרחיות בלבד
                                            </button>
                                            <button 
                                                onClick={() => setShowSettings(true)}
                                                className="flex-1 border-2 border-slate-100 text-text-main py-4 rounded-xl font-black text-sm hover:border-primary/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Settings size={18} /> הגדרות
                                            </button>
                                        </div>
                                    </div>
                                    <p className="mt-6 text-[10px] text-text-muted/60 font-medium">
                                        בלחיצה על "אישור", אתה מסכים ל<Link to="/privacy" className="underline">מדיניות הפרטיות</Link> שלנו.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-right">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="text-primary" size={24} />
                                            <h3 className="text-xl font-black text-text-main">ניהול פרטיות</h3>
                                        </div>
                                        <button onClick={() => setShowSettings(false)} className="text-text-muted hover:text-text-main">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-6 mb-10">
                                        <PreferenceToggle 
                                            label="עוגיות נחוצות" 
                                            desc="הכרחיות לפעילות התקינה של האתר (אבטחה, התחברות)." 
                                            checked={true} 
                                            disabled={true} 
                                        />
                                        <PreferenceToggle 
                                            label="ניתוח נתונים" 
                                            desc={settings?.analyticsDesc || "עוזר לנו להבין איך משתמשים באתר ולשפר ביצועים."}
                                            checked={preferences.analytics} 
                                            onChange={(v) => setPreferences(p => ({ ...p, analytics: v }))}
                                        />
                                        <PreferenceToggle 
                                            label="שיווק והתאמה" 
                                            desc={settings?.marketingDesc || "מאפשר לנו להציג לך משרות ומודעות שבאמת רלוונטיות עבורך."}
                                            checked={preferences.marketing} 
                                            onChange={(v) => setPreferences(p => ({ ...p, marketing: v }))}
                                        />
                                    </div>

                                    <button 
                                        onClick={handleSavePreferences}
                                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl"
                                    >
                                        שמור העדפות
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const PreferenceToggle: React.FC<{ label: string, desc: string, checked: boolean, disabled?: boolean, onChange?: (v: boolean) => void }> = ({ label, desc, checked, disabled, onChange }) => (
    <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
            <p className="font-black text-text-main text-sm mb-1">{label}</p>
            <p className="text-[11px] text-text-muted font-bold leading-relaxed">{desc}</p>
        </div>
        <button 
            disabled={disabled}
            onClick={() => onChange?.(!checked)}
            className={`w-12 h-6 rounded-full relative transition-all ${checked ? 'bg-primary' : 'bg-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'right-7' : 'right-1'}`} />
        </button>
    </div>
);
