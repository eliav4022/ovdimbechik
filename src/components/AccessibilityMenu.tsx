import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Accessibility, X, Type, Sun, Contrast, 
  MousePointer2, Eye, RotateCcw, Link2, 
  TextCursor, ZapOff
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AccessibilityMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState({
        fontSize: 1, // 1 = 100%
        contrast: 'normal', // normal, high, dark
        grayscale: false,
        underlineLinks: false,
        readableFont: false,
        stopAnimations: false,
        bigCursor: false,
    });

    useEffect(() => {
        const html = document.documentElement;
        
        // Font Size
        html.style.fontSize = `${settings.fontSize * 16}px`;

        // Contrast/Grayscale
        if (settings.grayscale) {
            html.classList.add('grayscale');
        } else {
            html.classList.remove('grayscale');
        }

        if (settings.contrast === 'high') {
            html.classList.add('high-contrast');
            html.classList.remove('dark-contrast');
        } else if (settings.contrast === 'dark') {
            html.classList.add('dark-contrast');
            html.classList.remove('high-contrast');
        } else {
            html.classList.remove('high-contrast', 'dark-contrast');
        }

        // Underline Links
        if (settings.underlineLinks) {
            html.classList.add('underline-links');
        } else {
            html.classList.remove('underline-links');
        }

        // Font
        if (settings.readableFont) {
            html.classList.add('readable-font');
        } else {
            html.classList.remove('readable-font');
        }

        // Cursor
        if (settings.bigCursor) {
            html.classList.add('big-cursor');
        } else {
            html.classList.remove('big-cursor');
        }

    }, [settings]);

    const resetSettings = () => {
        setSettings({
            fontSize: 1,
            contrast: 'normal',
            grayscale: false,
            underlineLinks: false,
            readableFont: false,
            stopAnimations: false,
            bigCursor: false,
        });
    };

    const toggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none"
                aria-label="תפריט נגישות"
                title="תפריט נגישות"
            >
                {isOpen ? <X size={28} /> : <Accessibility size={28} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
                        className="fixed bottom-24 right-6 z-[100] w-80 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden text-right"
                        dir="rtl"
                    >
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Accessibility className="text-highlight" size={24} />
                                <h3 className="font-black text-lg">תפריט נגישות</h3>
                            </div>
                            <button onClick={resetSettings} className="text-xs font-black text-white/60 hover:text-white flex items-center gap-1 transition-colors">
                                <RotateCcw size={14} /> איפוס
                            </button>
                        </div>

                        <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh]">
                            <AccessButton 
                                icon={Type} 
                                label="הגדלת טקסט" 
                                active={settings.fontSize > 1}
                                onClick={() => setSettings(s => ({ ...s, fontSize: s.fontSize < 1.2 ? s.fontSize + 0.1 : 1 }))} 
                            />
                            <AccessButton 
                                icon={Type} 
                                label="הקטנת טקסט" 
                                active={settings.fontSize < 1}
                                onClick={() => setSettings(s => ({ ...s, fontSize: s.fontSize > 0.8 ? s.fontSize - 0.1 : 1 }))} 
                            />
                            <AccessButton 
                                icon={Contrast} 
                                label="ניגודיות גבוהה" 
                                active={settings.contrast === 'high'}
                                onClick={() => setSettings(s => ({ ...s, contrast: s.contrast === 'high' ? 'normal' : 'high' }))} 
                            />
                            <AccessButton 
                                icon={Sun} 
                                label="מצב כהה" 
                                active={settings.contrast === 'dark'}
                                onClick={() => setSettings(s => ({ ...s, contrast: s.contrast === 'dark' ? 'normal' : 'dark' }))} 
                            />
                            <AccessButton 
                                icon={Eye} 
                                label="גווני אפור" 
                                active={settings.grayscale}
                                onClick={() => toggle('grayscale')} 
                            />
                            <AccessButton 
                                icon={Link2} 
                                label="הדגשת קישורים" 
                                active={settings.underlineLinks}
                                onClick={() => toggle('underlineLinks')} 
                            />
                            <AccessButton 
                                icon={TextCursor} 
                                label="גופן קריא" 
                                active={settings.readableFont}
                                onClick={() => toggle('readableFont')} 
                            />
                            <AccessButton 
                                icon={MousePointer2} 
                                label="סמן גדול" 
                                active={settings.bigCursor}
                                onClick={() => toggle('bigCursor')} 
                            />
                            <AccessButton 
                                icon={ZapOff} 
                                label="עצור אנימציות" 
                                active={settings.stopAnimations}
                                onClick={() => toggle('stopAnimations')} 
                            />
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 italic text-[11px] text-slate-500 font-bold text-center flex flex-col gap-2">
                            <span>עומד בתקן הנגישות הבינלאומי (WCAG 2.1)</span>
                            <a 
                                href="/accessibility" 
                                className="text-primary hover:underline font-black block"
                                onClick={() => setIsOpen(false)}
                            >
                                להצהרת הנגישות המלאה
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const AccessButton: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group",
            active 
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                : "bg-white border-slate-100 text-text-main hover:border-primary/20 hover:bg-primary/5"
        )}
    >
        <Icon size={20} className={cn(active ? "text-white" : "text-primary group-hover:scale-110 transition-transform")} />
        <span className="text-[11px] font-black">{label}</span>
    </button>
);
