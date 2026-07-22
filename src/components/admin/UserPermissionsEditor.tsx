import React from 'react';
import { Lock, Shield, Check, X, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react';
import { adminNavItems } from './AdminSidebar';
import { UserRole } from '../../types';

interface UserPermissionsEditorProps {
    currentRole: UserRole;
    permissions: string[];
    onChange: (permissions: string[]) => void;
}

interface ObjectItem {
    id: string;
    label: string;
    icon: React.ElementType;
    hasCreate?: boolean;
    hasDelete?: boolean;
}

const OBJECT_ITEMS: ObjectItem[] = [
    { id: 'dashboard', label: 'דאשבורד ראשי', icon: adminNavItems.find(i => i.id === 'dashboard')?.icon || Lock, hasCreate: false, hasDelete: false },
    { id: 'files', label: 'ניהול קבצים', icon: adminNavItems.find(i => i.id === 'files')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'users', label: 'משתמשים', icon: adminNavItems.find(i => i.id === 'users')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'seekers', label: 'מחפשי עבודה', icon: adminNavItems.find(i => i.id === 'seekers')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'employers', label: 'מעסיקים', icon: adminNavItems.find(i => i.id === 'employers')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'companies', label: 'חברות', icon: adminNavItems.find(i => i.id === 'companies')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'jobs-long-term', label: 'עבודות לטווח ארוך', icon: adminNavItems.find(i => i.id === 'jobs-long-term')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'jobs-casual', label: 'עבודות מזדמנות', icon: adminNavItems.find(i => i.id === 'jobs-casual')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'applications', label: 'מועמדויות', icon: adminNavItems.find(i => i.id === 'applications')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'payments', label: 'תשלומים', icon: adminNavItems.find(i => i.id === 'payments')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'contacts', label: 'פניות ותמיכה', icon: adminNavItems.find(i => i.id === 'contacts')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'reports', label: 'דיווחים ושגיאות', icon: adminNavItems.find(i => i.id === 'reports')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'popups', label: 'ניהול פופאפים', icon: adminNavItems.find(i => i.id === 'popups')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'tags', label: 'ניהול תגיות', icon: adminNavItems.find(i => i.id === 'tags')?.icon || Lock, hasCreate: true, hasDelete: true },
    { id: 'settings', label: 'הגדרות מערכת', icon: adminNavItems.find(i => i.id === 'settings')?.icon || Lock, hasCreate: false, hasDelete: false },
    { id: 'settings.objects', label: 'ניהול אובייקטים ושדות', icon: Lock, hasCreate: false, hasDelete: false }
];

export const UserPermissionsEditor: React.FC<UserPermissionsEditorProps> = ({ currentRole, permissions = [], onChange }) => {
    const isCustomMode = Array.isArray(permissions) && permissions.length > 0;
    
    // Top toggle: is admin access allowed for this user?
    const hasAdminAccess = isCustomMode
        ? permissions.includes('admin.access') || permissions.includes('ALL') || permissions.some(p => p.includes('.view') || p.includes('.edit') || OBJECT_ITEMS.some(o => o.id === p))
        : (currentRole === UserRole.ADMIN || currentRole === UserRole.SUPER_ADMIN);

    const toggleAdminAccess = (enabled: boolean) => {
        if (!enabled) {
            onChange([]);
        } else {
            // Enable default custom admin access
            const newPerms = ['admin.access', '_custom_', 'dashboard.view'];
            onChange(newPerms);
        }
    };

    const hasPerm = (objectId: string, permType: 'all' | 'view' | 'create' | 'edit' | 'delete') => {
        if (!hasAdminAccess) return false;
        if (permissions.includes('ALL')) return true;

        if (!isCustomMode) {
            if (currentRole === UserRole.SUPER_ADMIN) return true;
            if (currentRole === UserRole.ADMIN) {
                const navItem = adminNavItems.find(i => i.id === objectId);
                if (navItem && navItem.roles.includes(currentRole as UserRole)) return true;
                if (objectId === 'dashboard' || objectId === 'settings') return true;
            }
            return false;
        }

        if (permType === 'all') {
            return permissions.includes(objectId) || 
                   permissions.includes(`${objectId}.all`) ||
                   (
                       permissions.includes(`${objectId}.view`) &&
                       permissions.includes(`${objectId}.edit`) &&
                       permissions.includes(`${objectId}.create`) &&
                       permissions.includes(`${objectId}.delete`)
                   );
        }

        return permissions.includes(`${objectId}.${permType}`) || 
               permissions.includes(objectId) || 
               permissions.includes(`${objectId}.all`);
    };

    const toggleObjectAll = (objectId: string, check: boolean) => {
        let newPerms = [...permissions];
        if (!newPerms.includes('_custom_')) newPerms.push('_custom_');
        if (!newPerms.includes('admin.access')) newPerms.push('admin.access');

        const keys = [objectId, `${objectId}.all`, `${objectId}.view`, `${objectId}.create`, `${objectId}.edit`, `${objectId}.delete`];
        newPerms = newPerms.filter(p => !keys.includes(p));

        if (check) {
            newPerms.push(objectId, `${objectId}.all`, `${objectId}.view`, `${objectId}.create`, `${objectId}.edit`, `${objectId}.delete`);
        }

        onChange(newPerms);
    };

    const toggleSinglePerm = (objectId: string, permType: 'view' | 'create' | 'edit' | 'delete', check: boolean) => {
        let newPerms = [...permissions];
        if (!newPerms.includes('_custom_')) newPerms.push('_custom_');
        if (!newPerms.includes('admin.access')) newPerms.push('admin.access');

        const permKey = `${objectId}.${permType}`;

        if (check) {
            if (!newPerms.includes(permKey)) newPerms.push(permKey);
            // If checking edit/create/delete, ensure view is also checked
            if (permType !== 'view' && !newPerms.includes(`${objectId}.view`)) {
                newPerms.push(`${objectId}.view`);
            }
        } else {
            newPerms = newPerms.filter(p => p !== permKey && p !== objectId && p !== `${objectId}.all`);
        }

        onChange(newPerms);
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl mt-4 flex flex-col overflow-hidden shadow-sm">
            {/* Top Toggle Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${hasAdminAccess ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Shield size={20} />
                    </div>
                    <div>
                        <h4 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                            גישה למערכת הניהול (אדמין)
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                            {hasAdminAccess 
                                ? 'מורשה כניסה למערכת הניהול. הגדר הרשאות מפורטות לכל אובייקט בטבלה.'
                                : 'חסום לכניסה למערכת הניהול. הפעל כדי לספק הרשאות מותאמות אישית.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={hasAdminAccess}
                            onChange={(e) => toggleAdminAccess(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>

                    {isCustomMode && (
                        <button 
                            type="button"
                            onClick={() => onChange([])}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                        >
                            איפוס
                        </button>
                    )}
                </div>
            </div>

            {/* Granular Object Permissions Table */}
            {hasAdminAccess ? (
                <div className="p-3 max-h-[420px] overflow-y-auto">
                    <table className="w-full text-xs md:text-sm text-right border-collapse">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700 font-extrabold z-10 shadow-xs">
                            <tr className="border-b border-slate-200">
                                <th className="p-2.5 text-right rounded-r-xl">מסך / אובייקט</th>
                                <th className="p-2.5 text-center w-20 bg-indigo-50/50 text-indigo-800">אדמין (הכל)</th>
                                <th className="p-2.5 text-center w-16">צפייה</th>
                                <th className="p-2.5 text-center w-16">יצירה</th>
                                <th className="p-2.5 text-center w-16">עריכה</th>
                                <th className="p-2.5 text-center w-16 rounded-l-xl">מחיקה</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {OBJECT_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isAll = hasPerm(item.id, 'all');
                                const isView = hasPerm(item.id, 'view');
                                const isCreate = item.hasCreate !== false && hasPerm(item.id, 'create');
                                const isEdit = hasPerm(item.id, 'edit');
                                const isDelete = item.hasDelete !== false && hasPerm(item.id, 'delete');

                                return (
                                    <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                                        <td className="p-2.5 font-bold text-slate-800">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                    <Icon size={14} />
                                                </div>
                                                <span className="whitespace-nowrap">{item.label}</span>
                                            </div>
                                        </td>

                                        {/* Admin / All Column */}
                                        <td className="p-2.5 text-center bg-indigo-50/30">
                                            <label className="flex items-center justify-center cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                    checked={isAll}
                                                    onChange={(e) => toggleObjectAll(item.id, e.target.checked)}
                                                />
                                            </label>
                                        </td>

                                        {/* View Column */}
                                        <td className="p-2.5 text-center">
                                            <label className="flex items-center justify-center cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                                    checked={isView}
                                                    onChange={(e) => toggleSinglePerm(item.id, 'view', e.target.checked)}
                                                />
                                            </label>
                                        </td>

                                        {/* Create Column */}
                                        <td className="p-2.5 text-center">
                                            {item.hasCreate === false ? (
                                                <span className="text-slate-300 font-mono text-xs">-</span>
                                            ) : (
                                                <label className="flex items-center justify-center cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                                        checked={isCreate}
                                                        onChange={(e) => toggleSinglePerm(item.id, 'create', e.target.checked)}
                                                    />
                                                </label>
                                            )}
                                        </td>

                                        {/* Edit Column */}
                                        <td className="p-2.5 text-center">
                                            <label className="flex items-center justify-center cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                                                    checked={isEdit}
                                                    onChange={(e) => toggleSinglePerm(item.id, 'edit', e.target.checked)}
                                                />
                                            </label>
                                        </td>

                                        {/* Delete Column */}
                                        <td className="p-2.5 text-center">
                                            {item.hasDelete === false ? (
                                                <span className="text-slate-300 font-mono text-xs">-</span>
                                            ) : (
                                                <label className="flex items-center justify-center cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                                                        checked={isDelete}
                                                        onChange={(e) => toggleSinglePerm(item.id, 'delete', e.target.checked)}
                                                    />
                                                </label>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50/50 flex flex-col items-center justify-center gap-2">
                    <ShieldAlert size={28} className="text-slate-300" />
                    <p className="text-xs font-bold">גישת הניהול מנוטרלת למשתמש זה</p>
                    <p className="text-[11px] text-slate-400">הפעל את המתג העליון במידה ברצונך להגדיר הרשאות מפורטות לפנל הניהול.</p>
                </div>
            )}
        </div>
    );
};
