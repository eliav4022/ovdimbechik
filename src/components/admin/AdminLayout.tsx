import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AdminSidebar, adminNavItems } from './AdminSidebar';
import { useAuth } from '../../lib/AuthContext';
import { UserRole } from '../../types';
import { LoadingSpinner } from '../ui/Loading';
import { Menu, X, ShieldAlert } from 'lucide-react';

const ALLOWED_ADMIN_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.SUPPORT_AGENT,
  UserRole.CONTENT_MANAGER,
  UserRole.FINANCE_MANAGER
];

export const AdminLayout: React.FC = () => {
  const { user, loading, initialized } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="טוען פנל ניהול..." />
      </div>
    );
  }

  // A user is allowed if they have an admin role OR if they have explicitly granted permissions
  const hasBasicAdminRole = user ? ALLOWED_ADMIN_ROLES.includes(user.role as UserRole) : false;
  const isCustomMode = user ? (Array.isArray(user.permissions) && user.permissions.some(p => p !== '_custom_')) : false;
  const hasAnyCustomPermission = user && isCustomMode ? user.permissions!.some(p => p === 'ALL' || (typeof p === 'string' && p.includes('.view')) || (adminNavItems || []).some(item => item.id === p)) : false;
  const shouldShowAdmin = (!isCustomMode && hasBasicAdminRole) || hasAnyCustomPermission;

  if (!user || !shouldShowAdmin) {
    return <Navigate to="/" replace />;
  }

  // Determine if the current user has access to the current page.
  const path = location.pathname;
  let hasAccess = true; // Default to true for nested routes like /admin/users/:id
  
  // Find the exact base route match from the nav items to see if it's restricted
  const mainNavItem = [...(adminNavItems || [])].sort((a,b) => b.href.length - a.href.length).find(item => 
      path === item.href || (item.href !== '/admin' && path.startsWith(item.href + '/'))
  );
  
  if (mainNavItem) {
      if (isCustomMode) {
          hasAccess = user.permissions!.includes('ALL') || user.permissions!.includes(mainNavItem.id) || user.permissions!.includes(`${mainNavItem.id}.view`);
      } else {
          hasAccess = user.role === UserRole.SUPER_ADMIN || mainNavItem.roles.includes(user.role as UserRole);
      }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-40 sticky top-0 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black">
            ע
          </div>
          <span className="font-bold">ניהול מערכת</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 -mr-2 text-slate-300 hover:text-white focus:outline-none"
          aria-label="תפריט"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AdminSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 md:mr-64 p-4 md:p-8 w-full md:w-[calc(100%-16rem)] relative">
        <div className="max-w-7xl mx-auto">
          {hasAccess ? (
              <Outlet />
          ) : (
              <div className="flex flex-col items-center justify-center h-[60vh]">
                  <ShieldAlert size={80} className="text-slate-300 mb-6" />
                  <h2 className="text-3xl font-black text-slate-800 mb-2">אין לך הרשאה למסך זה</h2>
                  <p className="text-slate-500 font-medium text-center max-w-md">
                      כנראה שהמנהל הראשי לא אישר לך גישה לטאב זה. אנא פנה למנהל המערכת במידה וזה חסר לך.
                  </p>
              </div>
          )}
        </div>
      </main>
    </div>
  );
};
