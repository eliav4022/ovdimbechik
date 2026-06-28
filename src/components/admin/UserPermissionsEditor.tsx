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
                        <Lock size={16} /> שליטת הרשאות 
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        הענק גישה למסכים השונים במערכת הניהול עבור משתמש זה.
                    </p>
                </div>
                {Array.isArray(permissions) && permissions.length > 0 && (
                    <button 
                        type="button"
                        onClick={() => onChange([])}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    >
                        שחזר לברירת מחדל
                    </button>
                )}
            </div>
            <div className="overflow-y-auto p-4">
                <table className="w-full text-sm text-right border-collapse">
                    <thead>
                        <tr className="bg-slate-100 font-bold border-b text-slate-600">
                            <th className="p-2 whitespace-nowrap rounded-r-lg">מסך / תפריט</th>
                            <th className="p-2 text-center whitespace-nowrap rounded-l-lg w-24">גישה</th>
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
                                         defaults.push(p.id);
                                     }
                                });
                                return defaults;
                            })();

                            // Support legacy fine-grained permissions by checking if they have ANY access
                            const hasAccess = effectivePermissions.includes(item.id) || effectivePermissions.some(p => p.startsWith(`${item.id}.`)) || effectivePermissions.includes('ALL');

                            const toggleAccess = (checked: boolean) => {
                                let newPerms = [...effectivePermissions];
                                
                                if (!newPerms.includes('_custom_')) {
                                    newPerms.push('_custom_');
                                }

                                if (checked) {
                                    if (!newPerms.includes(item.id)) newPerms.push(item.id);
                                    
                                    // If a child is checked, ensure parent is checked too
                                    if (item.id === 'settings.objects' && !newPerms.includes('settings')) {
                                        newPerms.push('settings');
                                    }
                                } else {
                                    // Remove the generic permission and any legacy fine-grained ones
                                    newPerms = newPerms.filter(p => p !== item.id && !p.startsWith(`${item.id}.`) && p !== 'ALL');
                                }
                                onChange(newPerms);
                            };

                            const Icon = item.icon;
                            return (
                                <tr key={item.id} className="border-b last:border-0 border-slate-100 hover:bg-white transition-colors">
                                    <td className="p-3 font-medium text-slate-700 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            <Icon size={16} />
                                        </div>
                                        {item.label}
                                    </td>
                                    <td className="p-3 text-center align-middle">
                                        <label className="relative inline-flex items-center cursor-pointer m-auto">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={hasAccess}
                                                onChange={(e) => toggleAccess(e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
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
