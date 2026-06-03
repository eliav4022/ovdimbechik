import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Facebook, Mail, Send as TelegramIcon, Instagram, Twitter, Linkedin, ShieldCheck, Globe, Clock, Zap } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TrustBadge } from './ui/TrustBadge';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { UserRole } from '../types';

export const Footer: React.FC = () => {
    const { user } = useAuth();
    const [contactEmail, setContactEmail] = useState('Ovdimbechik@gmail.com');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
             const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
             if (settingsDoc.exists()) {
                 const data = settingsDoc.data();
                 if (data.contactEmail) setContactEmail(data.contactEmail);
                 if (data.siteLogoUrl) setLogoUrl(data.siteLogoUrl);
             }
        };
        fetchSettings();
    }, []);

    return (
        <footer className="bg-slate-900 pt-10 md:pt-16 pb-6 md:pb-8 border-t border-white/5 relative overflow-hidden" dir="rtl">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-highlight/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-8 mb-10 md:mb-16">
                    {/* Brand Section */}
                    <div className="space-y-4 md:space-y-6 text-center md:text-right">
                        <Link to="/" className="inline-block group">
                            {logoUrl ? (
                                <img src={logoUrl} alt="עובדים בצ'יק בגרסה מוקטנת" className="h-16 w-auto object-contain brightness-0 invert" style={{ filter: 'brightness(0) invert(1) contrast(1.2)' }} />
                            ) : (
                                <div className="text-4xl font-black tracking-tighter">
                                    <span className="text-white group-hover:text-primary transition-colors">עובדים</span>
                                    <span className="text-primary">בצ'יק</span>
                                </div>
                            )}
                        </Link>
                        <p className="text-slate-400 font-medium leading-relaxed text-lg max-w-sm mx-auto md:mx-0">
                            הפלטפורמה המתקדמת בישראל למציאת עבודה וגיוס עובדים. אנחנו מחברים בין אנשים מוכשרים להזדמנויות הנכונות, בשיא המהירות והנוחות.
                        </p>
                        
                        <div className="flex flex-col gap-6 pt-2 items-center md:items-start">
                             <TrustBadge type="secure" size="sm" className="bg-white/5 border-white/10 text-white/70 text-sm" />
                            <div className="flex justify-center md:justify-start gap-4">
                                <a href="https://api.whatsapp.com/send/?phone=972556867356" target="_blank" rel="noreferrer" className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-primary/5">
                                    <Phone size={24} />
                                </a>
                                <a href="https://t.me/OVDIM_BCHIK" target="_blank" rel="noreferrer" className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-sky-400 hover:bg-sky-400 hover:text-white hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-sky-400/5">
                                    <TelegramIcon size={24} />
                                </a>
                                <a href="https://www.facebook.com/groups/1312682680131451" target="_blank" rel="noreferrer" className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-blue-500/5">
                                    <Facebook size={24} />
                                </a>
                                <a href={`mailto:${contactEmail}`} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-white hover:text-slate-900 hover:-translate-y-2 transition-all duration-300 shadow-xl">
                                    <Mail size={24} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    <div className="space-y-4 md:space-y-6 text-center md:text-right">
                        <h4 className="text-highlight font-black text-lg flex items-center gap-3 justify-center md:justify-start">
                            <span className="hidden md:block w-8 h-px bg-white/20" />
                            ניווט מהיר
                        </h4>
                        <ul className="space-y-3 md:space-y-5 text-slate-300 font-bold text-base md:text-base text-sm">
                            <li><Link to="/" className="hover:text-primary transition-all flex items-center gap-3 justify-center md:justify-start group">
                                <span className="w-2 h-2 bg-slate-800 rounded-full group-hover:bg-primary transition-colors" />
                                לוח המשרות
                            </Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-all flex items-center gap-3 justify-center md:justify-start group">
                                <span className="w-2 h-2 bg-slate-800 rounded-full group-hover:bg-primary transition-colors" />
                                אודות עובדים בצ'יק
                            </Link></li>
                            <li><Link to="/pricing" className="hover:text-primary transition-all flex items-center gap-3 justify-center md:justify-start group">
                                <span className="w-2 h-2 bg-slate-800 rounded-full group-hover:bg-primary transition-colors" />
                                חבילות פרסום
                            </Link></li>
                            <li><Link to="/faq" className="hover:text-primary transition-all flex items-center gap-3 justify-center md:justify-start group">
                                <span className="w-2 h-2 bg-slate-800 rounded-full group-hover:bg-primary transition-colors" />
                                שאלות ותשובות
                            </Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4 md:space-y-6 text-center md:text-right">
                        <h4 className="text-highlight font-black text-lg flex items-center gap-3 justify-center md:justify-start">
                            <span className="hidden md:block w-8 h-px bg-white/20" />
                            מרכז המעסיקים
                        </h4>
                        <ul className="space-y-3 md:space-y-5 text-slate-300 font-bold text-base md:text-base text-sm">
                            <li><Link to="/employer/post-job" className="hover:text-highlight transition-all flex items-center gap-3 justify-center md:justify-start group text-white">
                                <Zap size={20} className="text-highlight animate-pulse" />
                                פרסום משרה מהיר
                            </Link></li>
                            {user && [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYER].includes(user.role) && (
                                <li><Link to="/employer/dashboard" className="hover:text-primary transition-all flex items-center gap-3 justify-center md:justify-start group">
                                    <span className="w-2 h-2 bg-slate-800 rounded-full group-hover:bg-primary transition-colors" />
                                    ניהול מועמדים
                                </Link></li>
                            )}
                            <li><Link to="/contact" className="hover:text-primary transition-all flex items-center gap-3 justify-center md:justify-start group">
                                <span className="w-2 h-2 bg-slate-800 rounded-full group-hover:bg-primary transition-colors" />
                                צור קשר עם התמיכה
                            </Link></li>
                        </ul>
                    </div>

                    {/* Contact Info Column */}
                    <div className="space-y-4 md:space-y-6 text-center md:text-right">
                        <h4 className="text-highlight font-black text-lg flex items-center gap-3 justify-center md:justify-start">
                            <span className="hidden md:block w-8 h-px bg-white/20" />
                            פרטי התקשרות
                        </h4>
                        <div className="text-slate-300 font-bold space-y-4 md:space-y-6 text-sm md:text-base">
                            <div className="flex items-start gap-4 justify-center md:justify-start">
                                <Mail size={24} className="text-primary mt-1 shrink-0" />
                                <div className="text-right">
                                    <p className="text-white/50 text-sm mb-1 font-bold">מייל</p>
                                    <p className="text-slate-100">{contactEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 justify-center md:justify-start">
                                <Phone size={24} className="text-highlight mt-1 shrink-0" />
                                <div className="text-right">
                                    <p className="text-white/50 text-sm mb-1 font-bold">ווצאפ וטלפון</p>
                                    <p className="text-slate-100">055-6867356</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 justify-center md:justify-start">
                                <Clock size={24} className="text-primary mt-1 shrink-0" />
                                <div className="text-right">
                                    <p className="text-white/50 text-sm mb-1 font-bold">שעות מענה</p>
                                    <p className="text-slate-100">א-ה: 09:00 - 18:00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
                        <div className="text-sm font-bold tracking-wide">
                            &copy; {new Date().getFullYear()} OVDIM BECHIK. כל הזכויות שמורות.
                        </div>
                        <div className="hidden md:block w-px h-6 bg-white/10" />
                        <div className="flex gap-3 items-center bg-white/5 px-4 py-2 rounded-2xl border border-white/10 shadow-soft">
                            <span className="w-2.5 h-2.5 bg-highlight rounded-full animate-pulse shadow-[0_0_10px_#4ADE80]" />
                            <span className="text-sm font-bold text-slate-300 tracking-wide">מערכת פעילה</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-bold tracking-wide">
                        <Link to="/terms" className="hover:text-primary transition-all hover:translate-y-[-2px]">תנאי שימוש</Link>
                        <Link to="/privacy" className="hover:text-primary transition-all hover:translate-y-[-2px]">פרטיות</Link>
                        <Link to="/security" className="hover:text-primary transition-all hover:translate-y-[-2px]">אבטחה</Link>
                        <Link to="/accessibility" className="hover:text-primary transition-all hover:translate-y-[-2px]">הצהרת נגישות</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
