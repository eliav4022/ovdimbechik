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

  if (!user || !ALLOWED_ADMIN_ROLES.includes(user.role as UserRole)) {
    return <Navigate to="/" replace />;
  }

  // Determine if the current user has access to the current page.
  const path = location.pathname;
  let hasAccess = true; // Default to true for nested routes like /admin/users/:id
  
  // Find the exact base route match from the nav items to see if it's restricted
  const mainNavItem = adminNavItems.find(item => path === item.href || (item.href !== '/admin' && path.startsWith(item.href)));
  
  if (mainNavItem) {
      // If we found the corresponding nav item, verify access using the same logic as the sidebar.
      const isAllowedByRole = mainNavItem.roles.includes(user.role as UserRole);
      
      if (user.permissions && user.permissions.length > 0) {
          hasAccess = user.permissions.includes(mainNavItem.id);
      } else {
          hasAccess = isAllowedByRole;
      }
      
      // Super admin fail-safe if permissions are empty
      if (user.role === UserRole.SUPER_ADMIN && (!user.permissions || user.permissions.length === 0)) {
          hasAccess = true;
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

      <main className="flex-grow md:mr-64 p-4 md:p-8 overflow-y-auto w-full md:w-auto h-full">
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
