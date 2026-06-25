import React, { useState } from 'react';
import { Search, Database, Columns, LayoutGrid, Info, Tag, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

interface FieldDef {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  description?: string;
  isLookup?: boolean;
}

interface ObjectDef {
  name: string;
  label: string;
  pluralLabel: string;
  apiName: string;
  description: string;
  fields: FieldDef[];
}

const SCHEMA: ObjectDef[] = [
  {
    name: 'User',
    label: 'משתמש',
    pluralLabel: 'משתמשים',
    apiName: 'users',
    description: 'מייצג אובייקט משתמש במערכת כגון: אדמין, מעסיק, או מחפש עבודה.',
    fields: [
      { name: 'id', label: 'Record ID', type: 'String', required: true, description: 'מזהה ייחודי של הרשומה ב-DB' },
      { name: 'uid', label: 'Auth UID', type: 'String', required: true, description: 'מזהה מערכת ההזדהות (Firebase Auth)' },
      { name: 'email', label: 'Email', type: 'String', required: true },
      { name: 'fullName', label: 'Full Name', type: 'String', required: true },
      { name: 'displayName', label: 'Display Name', type: 'String' },
      { name: 'role', label: 'Role', type: 'Picklist (UserRole)', required: true, description: 'תפקיד המשתמש: ADMIN, EMPLOYER, SEEKER, וכו׳' },
      { name: 'status', label: 'Status', type: 'Picklist (UserStatus)', required: true },
      { name: 'permissions', label: 'Permissions', type: 'Array<String>', required: true },
      { name: 'companyId', label: 'Company ID', type: 'Lookup (Company)', isLookup: true },
      { name: 'assignedAdminId', label: 'Assigned Admin', type: 'Lookup (User)', isLookup: true },
      { name: 'credits', label: 'Credits', type: 'Number' },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime', required: true },
      { name: 'phone', label: 'Phone Number', type: 'String' },
      { name: 'bio', label: 'Biography', type: 'String' },
      { name: 'photoURL', label: 'Profile Photo URL', type: 'String' },
      { name: 'cvUrl', label: 'CV/Resume URL', type: 'String', description: 'For job seekers' },
      { name: 'savedJobs', label: 'Saved Jobs', type: 'Array<String>' },
    ]
  },
  {
    name: 'Job',
    label: 'משרה',
    pluralLabel: 'משרות',
    apiName: 'jobs',
    description: 'אובייקט המייצג פרסום משרה של מעסיק.',
    fields: [
      { name: 'id', label: 'Job ID', type: 'String', required: true },
      { name: 'employerId', label: 'Employer / Owner', type: 'Lookup (User)', isLookup: true, required: true },
      { name: 'companyId', label: 'Company', type: 'Lookup (Company)', isLookup: true },
      { name: 'title', label: 'Job Title', type: 'String', required: true },
      { name: 'description', label: 'Description', type: 'String', required: true },
      { name: 'type', label: 'Job Type', type: 'Picklist (JobType)', required: true, description: 'Full-time, Part-time, Contract, וכו׳' },
      { name: 'status', label: 'Status', type: 'Picklist (JobStatus)', required: true, description: 'Active, Draft, Pending, Paused' },
      { name: 'location', label: 'Location', type: 'String', required: true },
      { name: 'salary', label: 'Salary Range', type: 'String' },
      { name: 'views', label: 'View Count', type: 'Number' },
      { name: 'applicationsCount', label: 'Applications Count', type: 'Number' },
      { name: 'isCasual', label: 'Is Casual Job (מזדמנת)', type: 'Boolean' },
      { name: 'isImmediate', label: 'Immediate Start', type: 'Boolean' },
      { name: 'category', label: 'Category', type: 'String' },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime', required: true },
      { name: 'updatedAt', label: 'Last Update', type: 'DateTime' },
    ]
  },
  {
    name: 'Application',
    label: 'מועמדות',
    pluralLabel: 'מועמדויות',
    apiName: 'applications',
    description: 'הגשת מועמדות למשרה על ידי מחפש עבודה.',
    fields: [
      { name: 'id', label: 'Application ID', type: 'String', required: true },
      { name: 'jobId', label: 'Job', type: 'Lookup (Job)', isLookup: true, required: true },
      { name: 'seekerId', label: 'Seeker', type: 'Lookup (User)', isLookup: true, required: true },
      { name: 'employerId', label: 'Employer', type: 'Lookup (User)', isLookup: true },
      { name: 'applicantName', label: 'Applicant Name', type: 'String', required: true },
      { name: 'applicantEmail', label: 'Applicant Email', type: 'String', required: true },
      { name: 'applicantPhone', label: 'Applicant Phone', type: 'String', required: true },
      { name: 'resumeUrl', label: 'CV/Resume URL', type: 'String' },
      { name: 'coverLetter', label: 'Cover Letter text', type: 'String' },
      { name: 'status', label: 'Status', type: 'Picklist (ApplicationStatus)', required: true, description: 'New, Reviewing, Interview, Hired, Rejected' },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime', required: true },
    ]
  },
  {
    name: 'Company',
    label: 'חברה',
    pluralLabel: 'חברות',
    apiName: 'companies',
    description: 'פרופיל חברה המכיל מיתוג, מיקום, ושיוך למעסיקים.',
    fields: [
      { name: 'id', label: 'Company ID', type: 'String', required: true },
      { name: 'name', label: 'Company Name', type: 'String', required: true },
      { name: 'employerId', label: 'Primary Employer', type: 'Lookup (User)', isLookup: true, required: true },
      { name: 'industry', label: 'Industry', type: 'String', required: true },
      { name: 'location', label: 'Location', type: 'String', required: true },
      { name: 'logoUrl', label: 'Logo URL', type: 'String' },
      { name: 'website', label: 'Website URL', type: 'String' },
      { name: 'description', label: 'Company Description', type: 'String' },
      { name: 'credits', label: 'Company Credits', type: 'Number' },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime' },
    ]
  },
  {
    name: 'Report',
    label: 'דיווח / משימה',
    pluralLabel: 'דיווחים',
    apiName: 'reports',
    description: 'דיווחים ממשתמשים או משימות לניהול של צוות התמיכה (Ticketing).',
    fields: [
      { name: 'id', label: 'Report ID', type: 'String', required: true },
      { name: 'title', label: 'Title', type: 'String', required: true },
      { name: 'description', label: 'Description', type: 'String' },
      { name: 'reporterId', label: 'Reporter', type: 'Lookup (User)', isLookup: true },
      { name: 'targetId', label: 'Target Record', type: 'String' },
      { name: 'targetType', label: 'Target Object Type', type: 'Picklist' },
      { name: 'assigneeId', label: 'Assignee', type: 'Lookup (User)', isLookup: true },
      { name: 'isResolved', label: 'Is Resolved', type: 'Boolean' },
      { name: 'priority', label: 'Priority', type: 'Picklist (Low, High, Urgent)' },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime', required: true },
    ]
  },
  {
    name: 'Popup',
    label: 'פופאפ / קמפיין',
    pluralLabel: 'פופאפים',
    apiName: 'popups',
    description: 'ניהול חלונות קופצים (Popups) במערכת לפי מסכים וסוגי משתמשים.',
    fields: [
      { name: 'id', label: 'Popup ID', type: 'String', required: true },
      { name: 'name', label: 'Campaign Name', type: 'String', required: true },
      { name: 'isActive', label: 'Active', type: 'Boolean', required: true },
      { name: 'position', label: 'Position', type: 'Picklist (center, top, bottom)' },
      { name: 'targetPage', label: 'Target Page URL/Path', type: 'String', required: true },
      { name: 'targetUserType', label: 'Target User Role', type: 'Picklist (all, seeker, employer, guest)', required: true },
      { name: 'htmlContent', label: 'HTML Body', type: 'String' },
      { name: 'imageUrl', label: 'Image URL', type: 'String' },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime', required: true },
    ]
  },
  {
    name: 'AuditLog',
    label: 'לוג מערכת',
    pluralLabel: 'לוגים',
    apiName: 'audit_logs',
    description: 'תיעוד כל פעולה שבוצעה במערכת (Create, Update, Delete).',
    fields: [
      { name: 'id', label: 'Log ID', type: 'String', required: true },
      { name: 'action', label: 'Action', type: 'String', required: true },
      { name: 'collection', label: 'Collection / Object', type: 'String', required: true },
      { name: 'documentId', label: 'Record ID', type: 'String', required: true },
      { name: 'userId', label: 'User ID', type: 'Lookup (User)', isLookup: true },
      { name: 'userName', label: 'User Name', type: 'String' },
      { name: 'userRole', label: 'User Role', type: 'String' },
      { name: 'details', label: 'Details / Payload', type: 'String' },
      { name: 'timestamp', label: 'Timestamp', type: 'DateTime', required: true },
    ]
  },
  {
    name: 'Category',
    label: 'קטגוריה',
    pluralLabel: 'קטגוריות',
    apiName: 'categories',
    description: 'קטגוריות ראשיות לחיפוש עבודה.',
    fields: [
      { name: 'id', label: 'Category ID', type: 'String', required: true },
      { name: 'name', label: 'Name', type: 'String', required: true },
      { name: 'slug', label: 'URL Slug', type: 'String', required: true },
      { name: 'icon', label: 'Icon Name', type: 'String' },
      { name: 'jobCount', label: 'Jobs Count', type: 'Number' },
    ]
  },
  {
    name: 'Tag',
    label: 'תגית',
    pluralLabel: 'תגיות',
    apiName: 'tags',
    description: 'תגיות חיפוש משרות / Skills.',
    fields: [
      { name: 'id', label: 'Tag ID', type: 'String', required: true },
      { name: 'name', label: 'Name', type: 'String', required: true },
      { name: 'type', label: 'Tag Type', type: 'String' },
      { name: 'count', label: 'Usage Count', type: 'Number' },
    ]
  },
];

export const AdminObjectManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedObject, setSelectedObject] = useState<ObjectDef | null>(null);
    const [activeTab, setActiveTab] = useState<'details'|'fields'>('fields');

    const filteredObjects = SCHEMA.filter(obj => 
        obj.label.includes(searchTerm) || 
        obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.apiName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedObject) {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200" dir="rtl">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                    <button 
                        onClick={() => setSelectedObject(null)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <ArrowLeft size={20} className="transform rotate-180" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Database className="text-indigo-600" />
                            {selectedObject.name} 
                            <span className="text-slate-400 text-lg font-normal">({selectedObject.label})</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">API Name: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">{selectedObject.apiName}</code></p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-64 shrink-0">
                        <nav className="flex flex-row lg:flex-col gap-2">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all text-right
                                    ${activeTab === 'details' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Info size={18} /> פרטים
                            </button>
                            <button
                                onClick={() => setActiveTab('fields')}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all text-right
                                    ${activeTab === 'fields' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Columns size={18} /> שדות וקשרים 
                            </button>
                        </nav>
                    </div>

                    <div className="flex-1">
                        {activeTab === 'details' && (
                            <Card className="p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">פרטי אובייקט (Object Details)</h3>
                                <div className="space-y-4 max-w-2xl">
                                    <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                                        <div className="text-slate-500 font-medium">Label (תווית)</div>
                                        <div className="col-span-2 text-slate-800 font-medium">{selectedObject.label}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                                        <div className="text-slate-500 font-medium">Plural Label</div>
                                        <div className="col-span-2 text-slate-800 font-medium">{selectedObject.pluralLabel}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                                        <div className="text-slate-500 font-medium">Object Name</div>
                                        <div className="col-span-2 text-slate-800 font-medium">{selectedObject.name}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                                        <div className="text-slate-500 font-medium">API Name (DB Collection)</div>
                                        <div className="col-span-2 text-indigo-600 font-mono text-sm">{selectedObject.apiName}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-slate-500 font-medium">תיאור (Description)</div>
                                        <div className="col-span-2 text-slate-700 leading-relaxed">{selectedObject.description}</div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {activeTab === 'fields' && (
                            <Card className="p-0 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Columns size={18} className="text-indigo-500" />
                                        שדות ({selectedObject.fields.length})
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse" dir="ltr">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                                <th className="py-3 px-4 font-semibold w-[25%]">Field Label</th>
                                                <th className="py-3 px-4 font-semibold w-[20%]">Field Name (API)</th>
                                                <th className="py-3 px-4 font-semibold w-[25%]">Data Type</th>
                                                <th className="py-3 px-4 font-semibold w-[30%]">Description / Rules</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedObject.fields.map(field => (
                                                <tr key={field.name} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-4 text-slate-800 font-medium text-sm">
                                                        {field.label}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs select-all">
                                                            {field.name}
                                                        </code>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="flex items-center gap-1.5 text-slate-600 text-sm">
                                                            {field.isLookup && <Tag size={14} className="text-amber-500" />}
                                                            {field.type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            {field.required && (
                                                                <Badge variant="brand" className="text-[10px] px-1.5 py-0 h-4">Required</Badge>
                                                            )}
                                                            <span className="text-slate-500 truncate max-w-[200px]" title={field.description} dir="rtl">
                                                                {field.description || '-'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutGrid className="text-indigo-600" />
                        Object Manager (ניהול אובייקטים)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">צפה בניהול המודלים, טבלאות הנתונים (Collections) והשדות במערכת.</p>
                </div>
            </div>

            <Card className="p-4 flex gap-4 bg-slate-50 border-slate-200">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                        placeholder="חפש אובייקט (API Name או תווית)..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10 bg-white"
                    />
                </div>
            </Card>

            <div className="overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                            <th className="py-3 px-4 font-semibold text-right">Label (תווית)</th>
                            <th className="py-3 px-4 font-semibold text-right" dir="ltr">API Name</th>
                            <th className="py-3 px-4 font-semibold text-right">תיאור</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredObjects.map(obj => (
                            <tr 
                                key={obj.apiName} 
                                onClick={() => setSelectedObject(obj)}
                                className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                            >
                                <td className="py-4 px-4 text-right">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                                            <Database size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-indigo-600 group-hover:underline">{obj.name}</div>
                                            <div className="text-xs text-slate-500">{obj.label}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-right" dir="ltr">
                                    <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm">{obj.apiName}</code>
                                </td>
                                <td className="py-4 px-4 text-right text-sm text-slate-600 max-w-md truncate" title={obj.description}>
                                    {obj.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredObjects.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        לא נמצאו אובייקטים התואמים לחיפוש.
                    </div>
                )}
            </div>
        </div>
    );
};
