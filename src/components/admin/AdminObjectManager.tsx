import React, { useState, useEffect } from 'react';
import { Search, Database, Columns, LayoutGrid, Info, Tag, ArrowLeft, Plus, Edit2, Trash2, Save, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';

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

const DEFAULT_SCHEMA: ObjectDef[] = [
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
      { name: 'role', label: 'Role', type: 'Picklist (UserRole)', required: true },
      { name: 'status', label: 'Status', type: 'Picklist (UserStatus)', required: true },
      { name: 'permissions', label: 'Permissions', type: 'Array<String>', required: true },
      { name: 'companyId', label: 'Company ID', type: 'Lookup (Company)', isLookup: true },
      { name: 'companyName', label: 'Company Name', type: 'String' },
      { name: 'isCompanyAdmin', label: 'Is Company Admin', type: 'Boolean' },
      { name: 'canViewRelevantSeekers', label: 'Can View Relevant Seekers', type: 'Boolean' },
      { name: 'companyDescription', label: 'Company Description', type: 'String' },
      { name: 'assignedAdminId', label: 'Assigned Admin', type: 'Lookup (User)', isLookup: true },
      { name: 'credits', label: 'Credits', type: 'Number' },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime', required: true },
      { name: 'phone', label: 'Phone Number', type: 'String' },
      { name: 'bio', label: 'Biography', type: 'String' },
      { name: 'photoURL', label: 'Profile Photo URL', type: 'String' },
      { name: 'cvUrl', label: 'CV/Resume URL', type: 'String' },
      { name: 'savedJobs', label: 'Saved Jobs', type: 'Array<String>' },
      { name: 'preferredLocation', label: 'Preferred Location', type: 'String' },
      { name: 'preferredJobType', label: 'Preferred Job Type', type: 'String' },
      { name: 'availability', label: 'Availability', type: 'String' },
      { name: 'lastLogin', label: 'Last Login', type: 'DateTime' },
      { name: 'jobSeekingStatus', label: 'Job Seeking Status', type: 'Picklist' },
      { name: 'preferredLocations', label: 'Preferred Locations', type: 'Array<String>' },
      { name: 'preferredDistance', label: 'Preferred Distance', type: 'Number' },
      { name: 'remoteOnly', label: 'Remote Only', type: 'Boolean' },
      { name: 'jobScope', label: 'Job Scope', type: 'Array<String>' },
      { name: 'isVerified', label: 'Is Verified', type: 'Boolean' },
      { name: 'deletedAt', label: 'Deleted At', type: 'DateTime' },
      { name: 'deletedBy', label: 'Deleted By', type: 'String' },
      { name: 'restoredAt', label: 'Restored At', type: 'DateTime' },
      { name: 'restoredBy', label: 'Restored By', type: 'String' },
      { name: 'deleteReason', label: 'Delete Reason', type: 'String' },
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
      { name: 'employerName', label: 'Employer Name', type: 'String' },
      { name: 'companyId', label: 'Company', type: 'Lookup (Company)', isLookup: true },
      { name: 'companyName', label: 'Company Name', type: 'String' },
      { name: 'companyDescription', label: 'Company Description', type: 'String' },
      { name: 'companyLogo', label: 'Company Logo', type: 'String' },
      { name: 'title', label: 'Job Title', type: 'String', required: true },
      { name: 'description', label: 'Description', type: 'String', required: true },
      { name: 'type', label: 'Job Type', type: 'Picklist (JobType)', required: true },
      { name: 'workMode', label: 'Work Mode', type: 'Picklist (WorkMode)' },
      { name: 'experienceLevel', label: 'Experience Level', type: 'Picklist (ExperienceLevel)' },
      { name: 'status', label: 'Status', type: 'Picklist (JobStatus)', required: true },
      { name: 'location', label: 'Location', type: 'String', required: true },
      { name: 'salary', label: 'Salary Range', type: 'String' },
      { name: 'views', label: 'View Count', type: 'Number' },
      { name: 'applicationsCount', label: 'Applications Count', type: 'Number' },
      { name: 'isCasual', label: 'Is Casual Job', type: 'Boolean' },
      { name: 'isImmediate', label: 'Immediate Start', type: 'Boolean' },
      { name: 'isUrgent', label: 'Is Urgent', type: 'Boolean' },
      { name: 'isRecommended', label: 'Is Recommended', type: 'Boolean' },
      { name: 'isVerified', label: 'Is Verified', type: 'Boolean' },
      { name: 'promotionLevel', label: 'Promotion Level', type: 'Picklist (PromotionLevel)' },
      { name: 'requireCV', label: 'Require CV', type: 'Boolean' },
      { name: 'directContact', label: 'Direct Contact Link', type: 'String' },
      { name: 'scheduledPublishDate', label: 'Scheduled Publish Date', type: 'DateTime' },
      { name: 'scheduledRemovalDate', label: 'Scheduled Removal Date', type: 'DateTime' },
      { name: 'scheduledPublishAt', label: 'Scheduled Publish At', type: 'DateTime' },
      { name: 'scheduledArchiveAt', label: 'Scheduled Archive At', type: 'DateTime' },
      { name: 'category', label: 'Category', type: 'String' },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime', required: true },
      { name: 'updatedAt', label: 'Last Update', type: 'DateTime' },
      { name: 'deletedAt', label: 'Deleted At', type: 'DateTime' },
      { name: 'deletedBy', label: 'Deleted By', type: 'String' },
      { name: 'restoredAt', label: 'Restored At', type: 'DateTime' },
      { name: 'restoredBy', label: 'Restored By', type: 'String' },
      { name: 'deleteReason', label: 'Delete Reason', type: 'String' },
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
      { name: 'employerId', label: 'Employer (Deprecated)', type: 'Lookup (User)', isLookup: true },
      { name: 'ownerId', label: 'Owner', type: 'Lookup (User)', isLookup: true },
      { name: 'applicantName', label: 'Applicant Name', type: 'String', required: true },
      { name: 'applicantEmail', label: 'Applicant Email', type: 'String', required: true },
      { name: 'applicantPhone', label: 'Applicant Phone', type: 'String', required: true },
      { name: 'resumeUrl', label: 'CV/Resume URL', type: 'String' },
      { name: 'cvUrl', label: 'CV/Resume URL (Deprecated)', type: 'String' },
      { name: 'coverLetter', label: 'Cover Letter text', type: 'String' },
      { name: 'status', label: 'Status', type: 'Picklist (ApplicationStatus)', required: true },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime', required: true },
      { name: 'deletedAt', label: 'Deleted At', type: 'DateTime' },
      { name: 'deletedBy', label: 'Deleted By', type: 'String' },
      { name: 'restoredAt', label: 'Restored At', type: 'DateTime' },
      { name: 'restoredBy', label: 'Restored By', type: 'String' },
      { name: 'deleteReason', label: 'Delete Reason', type: 'String' },
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
      { name: 'deletedAt', label: 'Deleted Date', type: 'DateTime' },
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
      { name: 'cssContent', label: 'CSS Content', type: 'String' },
      { name: 'imageUrl', label: 'Image URL', type: 'String' },
      { name: 'imageLink', label: 'Image Link', type: 'String' },
      { name: 'popupType', label: 'Popup Type', type: 'String' },
      { name: 'createdAt', label: 'Created Date', type: 'DateTime', required: true },
      { name: 'updatedAt', label: 'Updated Date', type: 'DateTime' },
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
    const [schema, setSchema] = useState<ObjectDef[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [selectedObject, setSelectedObject] = useState<ObjectDef | null>(null);
    const [activeTab, setActiveTab] = useState<'details'|'fields'>('fields');
    
    const [editingField, setEditingField] = useState<{ field: FieldDef, index: number, isNew: boolean } | null>(null);
    const [editingObject, setEditingObject] = useState<{ obj: ObjectDef, index: number, isNew: boolean } | null>(null);
    
    const { toast } = useToast();

    useEffect(() => {
        const loadSchema = async () => {
            try {
                const schemaDoc = await getDoc(doc(db, 'settings', 'schema'));
                if (schemaDoc.exists()) {
                    setSchema(schemaDoc.data().objects || DEFAULT_SCHEMA);
                } else {
                    setSchema(DEFAULT_SCHEMA);
                    // auto save default if not exists
                    await setDoc(doc(db, 'settings', 'schema'), { objects: DEFAULT_SCHEMA }, { merge: true });
                }
            } catch (err) {
                console.error("Error loading schema:", err);
                setSchema(DEFAULT_SCHEMA);
            } finally {
                setLoading(false);
            }
        };
        loadSchema();
    }, []);

    const handleSaveSchema = async (newSchema: ObjectDef[]) => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'schema'), { objects: newSchema }, { merge: true });
            setSchema(newSchema);
            if (selectedObject) {
                const updatedObj = newSchema.find(o => o.apiName === selectedObject.apiName);
                setSelectedObject(updatedObj || null);
            }
            toast('הסכמה נשמרה בהצלחה', 'success');
        } catch (error) {
            console.error("Error saving schema:", error);
            toast('שגיאה בשמירת הסכמה', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveField = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedObject || !editingField) return;
        
        const objIndex = schema.findIndex(o => o.apiName === selectedObject.apiName);
        if (objIndex === -1) return;

        const newSchema = [...schema];
        const newObj = { ...newSchema[objIndex] };
        const newFields = [...newObj.fields];

        if (editingField.isNew) {
            newFields.push(editingField.field);
        } else {
            newFields[editingField.index] = editingField.field;
        }

        newObj.fields = newFields;
        newSchema[objIndex] = newObj;
        
        handleSaveSchema(newSchema);
        setEditingField(null);
    };

    const handleDeleteField = (index: number) => {
        if (!selectedObject) return;
        if (!window.confirm("האם אתה בטוח שברצונך למחוק שדה זה מהסכמה?")) return;

        const objIndex = schema.findIndex(o => o.apiName === selectedObject.apiName);
        if (objIndex === -1) return;

        const newSchema = [...schema];
        const newObj = { ...newSchema[objIndex] };
        const newFields = newObj.fields.filter((_, i) => i !== index);

        newObj.fields = newFields;
        newSchema[objIndex] = newObj;
        
        handleSaveSchema(newSchema);
    };

    const handleSaveObject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingObject) return;
        
        const newSchema = [...schema];
        if (editingObject.isNew) {
            if (newSchema.some(o => o.apiName === editingObject.obj.apiName)) {
                toast('שגיאה: אובייקט עם API Name זה כבר קיים', 'error');
                return;
            }
            newSchema.push(editingObject.obj);
        } else {
            newSchema[editingObject.index] = editingObject.obj;
        }
        
        handleSaveSchema(newSchema);
        setEditingObject(null);
    };

    const handleDeleteObject = (index: number) => {
        if (!window.confirm("האם אתה בטוח שברצונך למחוק אובייקט זה מניהול האובייקטים? (פעולה זו לא תמחק את הנתונים עצמם מה-DB)")) return;
        const newSchema = schema.filter((_, i) => i !== index);
        handleSaveSchema(newSchema);
        if (selectedObject && schema[index].apiName === selectedObject.apiName) {
            setSelectedObject(null);
        }
    };

    const filteredObjects = schema.filter(obj => 
        obj.label.includes(searchTerm) || 
        obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.apiName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
    }

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

                <div className="flex flex-col gap-6">
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

                    <Card className="p-0 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Columns size={18} className="text-indigo-500" />
                                        שדות ({selectedObject.fields.length})
                                    </h3>
                                    <button 
                                        onClick={() => setEditingField({ field: { name: '', label: '', type: 'String' }, index: -1, isNew: true })}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                                    >
                                        <Plus size={16} />
                                        שדה חדש
                                    </button>
                                </div>
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-right border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                                <th className="py-3 px-4 font-semibold w-[20%]">תווית השדה (Label)</th>
                                                <th className="py-3 px-4 font-semibold w-[20%]" dir="ltr">Field Name (API)</th>
                                                <th className="py-3 px-4 font-semibold w-[20%]" dir="ltr">Data Type</th>
                                                <th className="py-3 px-4 font-semibold w-[30%]">תיאור וכללים</th>
                                                <th className="py-3 px-4 font-semibold w-[10%] text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedObject.fields.map((field, idx) => (
                                                <tr key={field.name} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="py-3 px-4 text-slate-800 font-medium text-sm">
                                                        {field.label}
                                                    </td>
                                                    <td className="py-3 px-4" dir="ltr">
                                                        <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs select-all">
                                                            {field.name}
                                                        </code>
                                                    </td>
                                                    <td className="py-3 px-4" dir="ltr">
                                                        <span className="flex items-center gap-1.5 text-slate-600 text-sm justify-end">
                                                            {field.type}
                                                            {field.isLookup && <Tag size={14} className="text-amber-500" />}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            {field.required && (
                                                                <Badge variant="brand" className="text-[10px] px-1.5 py-0 h-4 bg-red-50 text-red-600 border-red-100">חובה</Badge>
                                                            )}
                                                            <span className="text-slate-500 truncate max-w-[180px] sm:max-w-[250px]" title={field.description}>
                                                                {field.description || '-'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => setEditingField({ field: {...field}, index: idx, isNew: false })}
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                title="Edit Field"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteField(idx)}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Field"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                </div>
                
                {/* Field Edit Modal */}
                {editingField && (
                    <Modal
                        isOpen={!!editingField}
                        onClose={() => setEditingField(null)}
                        title={editingField.isNew ? "הוסף שדה חדש" : "ערוך שדה"}
                    >
                        <form onSubmit={handleSaveField} className="space-y-4 pt-4" dir="rtl">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Field Label (תווית בעברית/אנגלית)</label>
                                <Input 
                                    required 
                                    value={editingField.field.label} 
                                    onChange={(e) => setEditingField({ ...editingField, field: { ...editingField.field, label: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Field Name (API Name ב-DB)</label>
                                <Input 
                                    required 
                                    dir="ltr"
                                    disabled={!editingField.isNew}
                                    value={editingField.field.name} 
                                    onChange={(e) => setEditingField({ ...editingField, field: { ...editingField.field, name: e.target.value } })}
                                    className={!editingField.isNew ? "bg-slate-100" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Data Type</label>
                                <select 
                                    required
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all px-4 py-3 text-sm h-12"
                                    value={editingField.field.type}
                                    onChange={(e) => {
                                        const t = e.target.value;
                                        const isLookup = t.startsWith('Lookup');
                                        setEditingField({ ...editingField, field: { ...editingField.field, type: t, isLookup } });
                                    }}
                                >
                                    <option value="String">String (Text)</option>
                                    <option value="Number">Number</option>
                                    <option value="Boolean">Boolean (True/False)</option>
                                    <option value="DateTime">DateTime / Timestamp</option>
                                    <option value="Array<String>">Array (List of Strings)</option>
                                    <option value="Picklist">Picklist (Dropdown)</option>
                                    <option value="Lookup (User)">Lookup (User)</option>
                                    <option value="Lookup (Company)">Lookup (Company)</option>
                                    <option value="Lookup (Job)">Lookup (Job)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Description (תיאור / חוקים)</label>
                                <Input 
                                    value={editingField.field.description || ''} 
                                    onChange={(e) => setEditingField({ ...editingField, field: { ...editingField.field, description: e.target.value } })}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer pt-2">
                                <input 
                                    type="checkbox" 
                                    checked={!!editingField.field.required}
                                    onChange={(e) => setEditingField({ ...editingField, field: { ...editingField.field, required: e.target.checked } })}
                                    className="accent-indigo-600 w-4 h-4"
                                />
                                שדה חובה (Required)
                            </label>

                            <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingField(null)}
                                    className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    ביטול
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    {editingField.isNew ? 'הוסף שדה' : 'שמור שינויים'}
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}
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
                    <p className="text-slate-500 text-sm mt-1">צפה ונהל את המודלים, טבלאות הנתונים והשדות במערכת.</p>
                </div>
                <button 
                    onClick={() => setEditingObject({ obj: { name: '', label: '', pluralLabel: '', apiName: '', description: '', fields: [] }, index: -1, isNew: true })}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    הוסף אובייקט חדש
                </button>
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

            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm w-full">
                <table className="w-full text-right border-collapse min-w-[600px]">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                            <th className="py-3 px-4 font-semibold text-right w-[25%]">Label (תווית)</th>
                            <th className="py-3 px-4 font-semibold text-right w-[20%]" dir="ltr">API Name</th>
                            <th className="py-3 px-4 font-semibold text-right w-[45%]">תיאור</th>
                            <th className="py-3 px-4 font-semibold text-center w-[10%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredObjects.map((obj, idx) => (
                            <tr 
                                key={obj.apiName} 
                                className="hover:bg-indigo-50/50 transition-colors group"
                            >
                                <td className="py-4 px-4 text-right cursor-pointer" onClick={() => setSelectedObject(obj)}>
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
                                <td className="py-4 px-4 text-right cursor-pointer" dir="ltr" onClick={() => setSelectedObject(obj)}>
                                    <code className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm">{obj.apiName}</code>
                                </td>
                                <td className="py-4 px-4 text-right text-sm text-slate-600 truncate max-w-[200px] sm:max-w-md cursor-pointer" title={obj.description} onClick={() => setSelectedObject(obj)}>
                                    {obj.description}
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingObject({ obj: {...obj}, index: schema.findIndex(o => o.apiName === obj.apiName), isNew: false }) }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit Object"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteObject(schema.findIndex(o => o.apiName === obj.apiName)) }}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Object"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
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

            {/* Object Edit Modal */}
            {editingObject && (
                <Modal
                    isOpen={!!editingObject}
                    onClose={() => setEditingObject(null)}
                    title={editingObject.isNew ? "הוסף אובייקט חדש" : "ערוך אובייקט"}
                >
                    <form onSubmit={handleSaveObject} className="space-y-4 pt-4" dir="rtl">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Object Name (אנגלית, יחיד)</label>
                            <Input 
                                required 
                                dir="ltr"
                                value={editingObject.obj.name} 
                                onChange={(e) => setEditingObject({ ...editingObject, obj: { ...editingObject.obj, name: e.target.value } })}
                                placeholder="e.g. User"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Label (תווית יחיד)</label>
                                <Input 
                                    required 
                                    value={editingObject.obj.label} 
                                    onChange={(e) => setEditingObject({ ...editingObject, obj: { ...editingObject.obj, label: e.target.value } })}
                                    placeholder="e.g. משתמש"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Plural Label (תווית רבים)</label>
                                <Input 
                                    required 
                                    value={editingObject.obj.pluralLabel} 
                                    onChange={(e) => setEditingObject({ ...editingObject, obj: { ...editingObject.obj, pluralLabel: e.target.value } })}
                                    placeholder="e.g. משתמשים"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">API Name (DB Collection)</label>
                            <Input 
                                required 
                                dir="ltr"
                                disabled={!editingObject.isNew}
                                value={editingObject.obj.apiName} 
                                onChange={(e) => setEditingObject({ ...editingObject, obj: { ...editingObject.obj, apiName: e.target.value } })}
                                placeholder="e.g. users"
                                className={!editingObject.isNew ? "bg-slate-100" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Description (תיאור)</label>
                            <Input 
                                value={editingObject.obj.description || ''} 
                                onChange={(e) => setEditingObject({ ...editingObject, obj: { ...editingObject.obj, description: e.target.value } })}
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-6 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setEditingObject(null)}
                                className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                ביטול
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                {editingObject.isNew ? 'הוסף אובייקט' : 'שמור שינויים'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
