import React from 'react';
import { Lock } from 'lucide-react';
import { adminNavItems } from './AdminSidebar';
import { UserRole } from '../../types';

interface UserPermissionsEditorProps {
    currentRole: UserRole;
    permissions: string[];
    onChange: (permissions: string[]) => void;
}

export const UserPermissionsEditor: React.FC<UserPermissionsEditorProps> = ({ currentRole, permissions, onChange }) => {
    return (
        <div className="bg-slate-50 border rounded-xl mt-4 max-h-[400px] flex flex-col overflow-hidden">
            <div className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm flex items-start justify-between">
                <div>
                    <h4 className="font-bold flex items-center gap-2 text-slate-800">
                        <Lock size={16} /> שליטת הרשאות מתקדמת (צפייה, יצירה, עריכה, מחיקה)
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        סמן את סוג הפעולה עבור כל מסך במערכת הניהול. הסרת הרשאת המסך במלואה תעלים את התפריט עבור המשתמש הזה.
                    </p>
                </div>
                {Array.isArray(permissions) && permissions.length > 0 && (
                    <button 
                        onClick={() => onChange([])}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                        שחזר להרשאות ברירת מחדל
                    </button>
                )}
            </div>
            <div className="overflow-y-auto p-4">
                <table className="w-full text-sm text-right border-collapse">
                    <thead>
                        <tr className="bg-slate-100 font-bold border-b text-slate-600">
                            <th className="p-2 whitespace-nowrap">מסך / אובייקט</th>
                            <th className="p-2 text-center whitespace-nowrap">צפייה</th>
                            <th className="p-2 text-center whitespace-nowrap">יצירה</th>
                            <th className="p-2 text-center whitespace-nowrap">עריכה</th>
                            <th className="p-2 text-center whitespace-nowrap">מחיקה</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...adminNavItems || [], { id: 'settings.objects', label: 'ניהול אובייקטים ושדות', icon: Lock, roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }].map((item: any) => {
                            const isCustomMode = Array.isArray(permissions) && permissions.length > 0;
                            
                            // A helper to get the effective set of permissions to display in the UI checkboxes
                            const effectivePermissions = (() => {
                                if (isCustomMode) return permissions;
                                // Simulating defaults
                                const defaults: string[] = [];
                                [...adminNavItems || [], { id: 'settings.objects', roles: [UserRole.SUPER_ADMIN] }].forEach((p: any) => {
                                     if (currentRole === UserRole.SUPER_ADMIN || p.roles.includes(currentRole)) {
                                         defaults.push(`${p.id}.view`, `${p.id}.create`, `${p.id}.edit`, `${p.id}.delete`);
                                     }
                                });
                                return defaults;
                            })();

                            const canView = effectivePermissions.includes(item.id) || effectivePermissions.includes(`${item.id}.view`);
                            const canCreate = effectivePermissions.includes(item.id) || effectivePermissions.includes(`${item.id}.create`);
                            const canEdit = effectivePermissions.includes(item.id) || effectivePermissions.includes(`${item.id}.edit`);
                            const canDelete = effectivePermissions.includes(item.id) || effectivePermissions.includes(`${item.id}.delete`);

                            const toggleAction = (action: 'view' | 'create' | 'edit' | 'delete', checked: boolean) => {
                                let newPerms = [...effectivePermissions];
                                
                                if (!newPerms.includes('_custom_')) {
                                    newPerms.push('_custom_');
                                }

                                // Break apart legacy full-access item if modifying its parts
                                if (newPerms.includes(item.id)) {
                                    newPerms = newPerms.filter(p => p !== item.id);
                                    if (action !== 'view') newPerms.push(`${item.id}.view`);
                                    if (action !== 'create') newPerms.push(`${item.id}.create`);
                                    if (action !== 'edit') newPerms.push(`${item.id}.edit`);
                                    if (action !== 'delete') newPerms.push(`${item.id}.delete`);
                                }

                                const key = `${item.id}.${action}`;
                                if (checked) {
                                    if (!newPerms.includes(key)) newPerms.push(key);
                                    // if creating/editing/deleting, auto-grant view
                                    if (action !== 'view' && !newPerms.includes(`${item.id}.view`)) {
                                        newPerms.push(`${item.id}.view`);
                                    }
                                } else {
                                    newPerms = newPerms.filter(p => p !== key);
                                    // if unchecking view, uncheck others too
                                    if (action === 'view') {
                                        newPerms = newPerms.filter(p => !p.startsWith(`${item.id}.`));
                                    }
                                }
                                onChange(newPerms);
                            };

                            const Icon = item.icon;
                            return (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-bold text-slate-700 flex items-center gap-2">
                                        <Icon size={16} className="text-slate-400" /> {item.label}
                                    </td>
                                    <td className="p-2 text-center">
                                        <input type="checkbox" checked={canView} onChange={(e) => toggleAction('view', e.target.checked)} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                                    </td>
                                    <td className="p-2 text-center">
                                        <input type="checkbox" checked={canCreate} onChange={(e) => toggleAction('create', e.target.checked)} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                                    </td>
                                    <td className="p-2 text-center">
                                        <input type="checkbox" checked={canEdit} onChange={(e) => toggleAction('edit', e.target.checked)} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                                    </td>
                                    <td className="p-2 text-center">
                                        <input type="checkbox" checked={canDelete} onChange={(e) => toggleAction('delete', e.target.checked)} className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
