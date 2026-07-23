import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, Menu, X, Shield, Phone, Facebook, Mail, 
  Send as TelegramIcon, Home, Briefcase, MessageCircle, 
  BookOpen, Info, FileText, BarChart, UserPlus, 
  Accessibility, User, LogIn, ChevronLeft, LayoutDashboard, ChevronDown
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { usePages } from '../context/PagesContext';
import { auth as firebaseAuth } from '../lib/firebase';
import { UserRole } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { user, loading } = useAuth();
  const { pages, loading: pagesLoading } = usePages();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    import('../lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
         const unsubscribe = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
             if (docSnap.exists() && docSnap.data().siteLogoUrl) {
                 setLogoUrl(docSnap.data().siteLogoUrl);
             } else {
                 setLogoUrl(null);
             }
         });
         return () => unsubscribe();
      });
    });
  }, []);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await firebaseAuth.signOut();
    setIsOpen(false);
    navigate('/');
  };

  const socialLinks = [
    { icon: Phone, href: "https://api.whatsapp.com/send/?phone=0552993643", color: "text-green-500", label: "WhatsApp" },
    { icon: TelegramIcon, href: "https://t.me/OVDIM_BCHIK", color: "text-sky-500", label: "Telegram" },
    { icon: Facebook, href: "https://www.facebook.com/groups/1312682680131451/", color: "text-blue-600", label: "Facebook" }
  ];

  const baseMenuItems = [
    { id: 'home', label: 'דף הבית', path: '/', icon: Home },
    { id: 'jobs', label: 'לוח דרושים', path: '/jobs', icon: Briefcase },
    { id: 'casual', label: 'עבודות מזדמנות 🍕', path: '/jobs?tab=casual', icon: Briefcase },
    { id: 'whatsapp', label: 'דרושים בוואטסאפ', path: '/whatsapp-jobs', icon: MessageCircle },
    { id: 'courses', label: 'פורטל קורסים', path: '/courses', icon: BookOpen },
    { id: 'employers', label: 'גיוס עובדים', path: '/employers-landing', icon: UserPlus },
    { id: 'info', label: 'מידע בצ\'יק', path: '/quick-info', icon: Info },
    { id: 'preparation', label: 'הכנה לעבודה', path: '/preparation', icon: FileText },
    { id: 'marketing', label: 'שיווק לעסקים', path: '/marketing', icon: BarChart },
  ];

  const menuItems = pages
      .filter(p => p.enabled && p.showInMenu)
      .map(p => {
          const base = baseMenuItems.find(b => b.id === p.id) || baseMenuItems.find(b => b.path === p.path);
          return {
              id: p.id,
              label: p.name,
              path: p.path,
              icon: base ? base.icon : FileText
          };
      });

  const getDashboardLink = () => {
      if (!user) return '/login';
      switch (user.role) {
          case UserRole.ADMIN:
          case UserRole.SUPER_ADMIN:
              return '/admin';
          case UserRole.EMPLOYER:
              return '/employer/dashboard';
          case UserRole.SEEKER:
              return '/seeker/dashboard';
          default:
              return '/';
      }
  };

  const getUserDisplayName = () => {
      if (!user) return 'משתמש';
      if (user.fullName && user.fullName.trim() !== '' && user.fullName !== 'משתמש' && user.fullName !== 'משתמש ' && user.fullName !== ' משתמש') {
          return user.fullName;
      }
      if (user.displayName && user.displayName.trim() !== '' && user.displayName !== 'משתמש' && user.displayName !== 'משתמש ' && user.displayName !== ' משתמש') {
          return user.displayName;
      }
      if (user.email) {
          return user.email.split('@')[0];
      }
      return 'משתמש';
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
                <div className="flex flex-col text-right">
                    {logoUrl ? (
                        <img src={logoUrl} alt="עובדים בצ'יק" className="h-12 w-auto object-contain" />
                    ) : (
                        <img src="/logo.png" alt="עובדים בצ'יק" className="h-12 w-auto object-contain" onError={(e) => {
                            // אקסטרה עזרה למקרה שאין עדיין קובץ logo.png, נציג טקסט
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl font-black tracking-tighter"><span class="text-slate-900">עובדים</span><span class="text-primary">בצ'יק</span></span>`;
                        }} />
                    )}
                </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex lg:items-center lg:gap-6">
              {menuItems.slice(0, 4).map((item) => (
                <Link 
                  key={item.label} 
                  to={item.path} 
                  className={cn(
                    "text-sm font-black transition-all whitespace-nowrap",
                    item.label.includes('מזדמנות') ? "bg-purple-100 text-purple-700 px-4 py-2 rounded-xl shadow-sm hover:bg-purple-200" : "text-text-muted hover:text-primary"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {menuItems.length > 4 && (
                <div className="relative group flex items-center h-full py-4">
                  <button className="text-sm font-black text-text-muted hover:text-primary transition-all flex items-center gap-1">
                    עוד
                    <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                  </button>
                  <div className="absolute top-14 right-0 w-56 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-[100] p-2">
                    {menuItems.slice(4).map(item => (
                       <Link
                         key={item.label}
                         to={item.path}
                         className={cn(
                           "px-4 py-3 text-sm font-black transition-all whitespace-nowrap rounded-lg",
                           item.label.includes('מזדמנות') ? "bg-purple-50 text-purple-700 hover:bg-purple-100 mb-1" : "text-slate-600 hover:bg-slate-50 hover:text-primary mb-1"
                         )}
                       >
                         {item.label}
                       </Link>
                    ))}
                  </div>
                </div>
              )}
              {(() => {
                const isCustomMode = Array.isArray(user?.permissions) && user?.permissions.some(p => p !== '_custom_');
                const hasAnyCustomPermission = isCustomMode && user?.permissions!.some(p => p === 'ALL' || p !== '_custom_');
                const hasBasicAdminRole = user?.role && [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.CONTENT_MANAGER, UserRole.FINANCE_MANAGER].includes(user.role as UserRole);
                const shouldShowAdmin = (!isCustomMode && hasBasicAdminRole) || hasAnyCustomPermission;
                if (!loading && user && shouldShowAdmin) {
                  return (
                    <Link to="/admin" className="flex items-center gap-1 text-sm font-black text-purple-600 hover:text-purple-700 transition-all">
                      <Shield size={16} />
                      ניהול
                    </Link>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 ml-6 pl-6 border-l border-bg-light">
               {socialLinks.map((link, i) => (
                   <a key={i} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} className={cn("hover:scale-125 hover:-translate-y-0.5 transition-all opacity-80 hover:opacity-100", link.color)}>
                       <link.icon size={18} />
                   </a>
               ))}
            </div>

            {!loading && (
              <div className="flex items-center sm:gap-6">
                {user ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleLogout}
                      title="התנתקות"
                      className="hidden sm:flex p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <LogOut size={20} />
                    </button>
                    <Link to={getDashboardLink()} className="flex items-center gap-2 sm:gap-4 group cursor-pointer hover:bg-slate-50 p-1 sm:px-3 sm:py-1.5 rounded-2xl transition-all ml-2 sm:ml-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-text-muted group-hover:text-primary transition-colors">אזור אישי</p>
                        <p className="text-sm font-black text-text-main group-hover:text-primary-dark transition-colors">{getUserDisplayName()}</p>
                      </div>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="profile" className="h-8 w-8 sm:h-10 sm:w-10 rounded-2xl md:rounded-2xl rounded-full border-2 border-primary/20 shadow-soft group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full md:rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black border-2 border-primary/20 shadow-soft group-hover:scale-105 transition-transform">
                          <User size={20} className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      )}
                    </Link>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-4">
                    <Link to="/login" className="text-sm font-black text-text-main hover:text-primary transition-all px-4 py-2">
                      התחברות
                    </Link>
                    <Link
                      to="/register"
                      className="bg-primary text-white text-sm font-black px-6 py-3 rounded-[1.25rem] hover:bg-primary-dark transition-all shadow-xl shadow-primary/10 active:scale-95"
                    >
                      הרשמה מהירה
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setIsOpen(true)}
              aria-label="פתח תפריט"
              className="lg:hidden p-3 text-text-main hover:bg-bg-light rounded-2xl transition-all"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Side Drawer Implementation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-[70] shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] flex flex-col text-right"
              dir="rtl"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-bg-light flex items-center justify-between">
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                    <span className="text-xl font-black">
                        עובדים<span className="text-primary">בצ'יק</span>
                    </span>
                    <CheckIcon />
                </Link>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-bg-light rounded-xl transition-all"
                >
                    <X size={24} className="text-text-muted" />
                </button>
              </div>

              {/* User Section (Mobile) */}
              <div className="p-6 bg-bg-light/30 border-b border-bg-light">
                {!loading && (
                    user ? (
                        <div className="flex items-center gap-4">
                            <Link to={getDashboardLink()} onClick={() => setIsOpen(false)} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-soft shrink-0">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="user" className="w-full h-full rounded-2xl object-cover" />
                                ) : (
                                    <User size={24} className="text-primary" />
                                )}
                            </Link>
                            <Link to={getDashboardLink()} onClick={() => setIsOpen(false)} className="flex-1 min-w-0">
                                <p className="text-xs font-black text-text-muted">אזור אישי</p>
                                <p className="text-sm font-black text-text-main truncate hover:text-primary transition-colors">{getUserDisplayName()}</p>
                            </Link>
                            <button 
                                onClick={handleLogout}
                                className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all flex items-center gap-1"
                            >
                                <LogOut size={12} /> התנתקות
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link 
                                to="/login" 
                                onClick={() => setIsOpen(false)}
                                className="flex-1 bg-white text-text-main py-3 rounded-xl font-black text-sm text-center border border-slate-200 flex items-center justify-center gap-2 hover:bg-bg-light transition-all"
                            >
                                <LogIn size={18} className="text-primary" /> התחברות
                            </Link>
                            <Link 
                                to="/register" 
                                onClick={() => setIsOpen(false)}
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-black text-sm text-center shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <UserPlus size={18} /> הרשמה
                            </Link>
                        </div>
                    )
                )}
              </div>

              {/* Menu Links */}
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-black transition-all group",
                            item.label.includes('מזדמנות') ? "bg-purple-50 text-purple-700 hover:bg-purple-100 mb-2" : "text-text-main hover:bg-bg-light"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-transparent shadow-soft group-hover:scale-105",
                            item.label.includes('מזדמנות') ? "bg-purple-200" : "bg-bg-light group-hover:bg-white group-hover:border-slate-100"
                        )}>
                            <item.icon size={20} className={cn("transition-transform", item.label.includes('מזדמנות') ? "text-purple-600 group-hover:scale-110" : "text-primary group-hover:scale-110")} />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        <ChevronLeft size={16} className={cn("transition-all opacity-0 group-hover:opacity-100", item.label.includes('מזדמנות') ? "text-purple-300 group-hover:text-purple-600" : "text-bg-light group-hover:text-primary")} />
                    </Link>
                ))}

                <div className="pt-4 border-t border-bg-light mt-4 space-y-3">
                    {(() => {
                      const isCustomMode = Array.isArray(user?.permissions) && user?.permissions.some(p => p !== '_custom_');
                      const hasAnyCustomPermission = isCustomMode && user?.permissions!.some(p => p === 'ALL' || p !== '_custom_');
                      const hasBasicAdminRole = user?.role && [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.CONTENT_MANAGER, UserRole.FINANCE_MANAGER].includes(user.role as UserRole);
                      const shouldShowAdmin = (!isCustomMode && hasBasicAdminRole) || hasAnyCustomPermission;
                      
                      if (!loading && user && shouldShowAdmin) {
                        return (
                          <Link
                              to="/admin"
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-purple-50 text-purple-700 font-black hover:bg-purple-100 transition-all border border-purple-100"
                          >
                              <Shield size={22} className="text-purple-600" />
                              <span>ניהול מערכת</span>
                          </Link>
                        );
                      }
                      return null;
                    })()}
                    
                    <Link
                        to="/contact"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary/5 text-primary font-black hover:bg-primary/10 transition-all border border-primary/10"
                    >
                        <MessageCircle size={22} className="text-primary" />
                        <span>יצירת קשר</span>
                    </Link>

                    <Link
                        to="/employers-landing"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                    >
                        <Briefcase size={22} className="text-highlight" />
                        <span>גיוס עובדים</span>
                    </Link>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 bg-bg-light/20 border-t border-bg-light">
                <div className="flex justify-center gap-6 mb-6">
                    {socialLinks.map((link, i) => (
                        <a 
                            key={i} 
                            href={link.href} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={cn("w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-soft flex items-center justify-center hover:-translate-y-1 transition-all", link.color)}
                        >
                            <link.icon size={22} />
                        </a>
                    ))}
                </div>
                <div className="flex justify-center">
                    <button 
                        className="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-soft"
                        title="נגישות"
                    >
                        <Accessibility size={20} />
                    </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1">
        <path d="M20 6L9 17L4 12" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

