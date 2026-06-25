import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  FileText, 
  Building2, 
  CreditCard, 
  MessageSquare, 
  AlertCircle, 
  History, 
  Settings,
  LogOut,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/AuthContext';
import { UserRole } from '../../types';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

export const adminNavItems: NavItem[] = [
  { id: 'dashboard', label: 'דאשבורד', href: '/admin', icon: BarChart3, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.CONTENT_MANAGER, UserRole.FINANCE_MANAGER] },
  { id: 'files', label: 'ניהול קבצים', href: '/admin/files', icon: FolderOpen, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER] },
  { id: 'users', label: 'משתמשים', href: '/admin/users', icon: Users, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT] },
  { id: 'seekers', label: 'מחפשי עבודה', href: '/admin/seekers', icon: UserCheck, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT] },
  { id: 'employers', label: 'מעסיקים', href: '/admin/employers', icon: ShieldCheck, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT] },
  { id: 'companies', label: 'חברות', href: '/admin/companies', icon: Building2, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.CONTENT_MANAGER] },
  { id: 'jobs-long-term', label: 'עבודות לטווח ארוך', href: '/admin/jobs', icon: Briefcase, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.CONTENT_MANAGER] },
  { id: 'jobs-casual', label: 'עבודות מזדמנות', href: '/admin/jobs-casual', icon: Briefcase, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT, UserRole.CONTENT_MANAGER] },
  { id: 'applications', label: 'מועמדויות', href: '/admin/applications', icon: FileText, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT] },
  { id: 'payments', label: 'תשלומים', href: '/admin/payments', icon: CreditCard, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_MANAGER] },
  { id: 'contacts', label: 'פניות', href: '/admin/contacts', icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT] },
  { id: 'reports', label: 'דיווחים', href: '/admin/reports', icon: AlertCircle, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT_AGENT] },
  { id: 'audit', label: 'לוג פעילות', href: '/admin/audit', icon: History, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { id: 'settings', label: 'הגדרות', href: '/admin/settings', icon: Settings, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
  { id: 'popups', label: 'ניהול פופאפים', href: '/admin/popups', icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER] },
  { id: 'tags', label: 'תגיות', href: '/admin/tags', icon: FileText, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER] },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
     const fetchLogo = async () => {
         const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
         if (settingsDoc.exists() && settingsDoc.data().siteLogoUrl) {
             setLogoUrl(settingsDoc.data().siteLogoUrl);
         }
     };
     fetchLogo();
  }, []);
  
  const filteredNavItems = adminNavItems.filter(item => {
    if (!user?.role) return false;
    
    // Check if the user's role fundamentally allows them to see this tab as a fallback/baseline
    const hasRole = item.roles.includes(user.role as UserRole);

    const isCustomMode = Array.isArray(user.permissions) && user.permissions.length > 0;

    // If the user has specific explicit permissions configured, use them.
    if (isCustomMode) {
      // Must have the permission ID (legacy) or the specific explicit .view permission 
      return user.permissions!.includes(item.id) || user.permissions!.includes(`${item.id}.view`);
    }
    
    // Default to role-based access for backwards compatibility and easy defaults
    if (user.role === UserRole.SUPER_ADMIN) return true;
    
    return hasRole;
  });

  return (
    <div 
      className={cn(
        "w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed right-0 top-0 z-50 overflow-y-auto border-l border-slate-800 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}
      dir="rtl"
    >
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="לוגו מערכת ניהול" className="h-10 w-auto object-contain brightness-0 invert" style={{ filter: 'brightness(0) invert(1)' }} />
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">
                ע
              </div>
              <div>
                <h1 className="text-white font-bold leading-none">עובדים בצ׳יק</h1>
                <span className="text-xs text-slate-500">ניהול מערכת</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin'}
            onClick={() => {
              if (onClose) onClose();
            }}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
              isActive 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-colors",
              "group-hover:text-indigo-400"
            )} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="px-4 py-3 bg-slate-800/50 rounded-xl">
          <p className="text-xs text-slate-500 mb-1">מחובר כ:</p>
          <p className="text-sm font-bold text-white truncate">{user?.displayName || user?.email}</p>
          <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-black mt-1">
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all text-slate-400"
        >
          <ArrowRight size={20} />
          <span className="font-medium">חזרה לאתר</span>
        </button>

        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-400"
        >
          <LogOut size={20} />
          <span className="font-medium">התנתקות</span>
        </button>
      </div>
    </div>
  );
};
