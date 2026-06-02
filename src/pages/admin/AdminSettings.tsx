import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Save, Settings, Shield, CreditCard, RotateCcw, Bell, Lock, Globe, Share2, Briefcase, Webhook, LayoutTemplate, Bot, Activity, Database, Trash2, Download, Upload } from 'lucide-react';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { UserRole, JobType, WorkMode, ExperienceLevel } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

interface SystemSettings {
    contactEmail: string;
    maintenanceMode: boolean;
    seoSiteTitle: string;
    seoSiteDescription: string;
    socialFacebookUrl: string;
    socialLinkedInUrl: string;
    socialInstagramUrl: string;

    allowSeekerRegistration: boolean;
    allowEmployerRegistration: boolean;
    requireEmailVerification: boolean;
    requireResumeUpload: boolean;
    maxFailedLoginAttempts: number;
    enableAdminRoleManagement: boolean;

    autoApproveJobs: boolean;
    defaultJobValidityDays: number;
    maxActiveJobsPerEmployer: number;
    bannedJobKeywords: string;

    autoApproveCasualJobs: boolean;
    defaultCasualJobValidityDays: number;
    maxActiveCasualJobsPerEmployer: number;

    defaultCreditsForNewEmployer: number;
    pricePerCreditAmount: number;
    platformFeePercentage: number;
    enableDiscountCoupons: boolean;
    currency: string;

    webhookUrlNewJob: string;
    webhookUrlStatusChange: string;
    enableCandidateWhatsAppNotifications: boolean;
    enableCandidateEmailNotifications: boolean;
    notifyOnNewJobPending: boolean;
    notifyOnNewEmployerRegistered: boolean;

    enableAIAssistant: boolean;
    aiModel: string;
    aiHistoryWindow: number;
    aiEnableRAG: boolean;
    aiTone: string;
    aiTemperature: number;
    aiAdditionalPrompt: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
    contactEmail: 'Ovdimbechik@gmail.com',
    maintenanceMode: false,
    seoSiteTitle: "Ovedim B'Chik - The Best Job Board",
    seoSiteDescription: 'The leading job board for finding work quickly and easily.',
    socialFacebookUrl: '',
    socialLinkedInUrl: '',
    socialInstagramUrl: '',

    allowSeekerRegistration: true,
    allowEmployerRegistration: true,
    requireEmailVerification: true,
    requireResumeUpload: false,
    maxFailedLoginAttempts: 5,
    enableAdminRoleManagement: false,

    autoApproveJobs: false,
    defaultJobValidityDays: 30,
    maxActiveJobsPerEmployer: 10,
    bannedJobKeywords: 'casino, crypto, forex',

    autoApproveCasualJobs: true,
    defaultCasualJobValidityDays: 7,
    maxActiveCasualJobsPerEmployer: 5,

    defaultCreditsForNewEmployer: 0,
    pricePerCreditAmount: 50,
    platformFeePercentage: 10,
    enableDiscountCoupons: false,
    currency: 'ILS',

    webhookUrlNewJob: '',
    webhookUrlStatusChange: '',
    enableCandidateWhatsAppNotifications: false,
    enableCandidateEmailNotifications: true,
    notifyOnNewJobPending: true,
    notifyOnNewEmployerRegistered: true,

    enableAIAssistant: true,
    aiModel: 'gemini-3-flash-preview',
    aiHistoryWindow: 10,
    aiEnableRAG: true,
    aiTone: 'professional',
    aiTemperature: 0.7,
    aiAdditionalPrompt: '',
};

const ToggleSwitch = ({ label, description, checked, onChange, activeColorClass = "peer-checked:bg-indigo-500" }: { label: string, description?: string, checked: boolean, onChange: (val: boolean) => void, activeColorClass?: string }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-sm transition-shadow">
        <div className="pr-4">
            <p className="font-bold text-slate-800">{label}</p>
            {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${activeColorClass}`}></div>
        </label>
    </div>
);

const ExportModal = ({ isOpen, onClose, collectionName, toast }: { isOpen: boolean, onClose: () => void, collectionName: string, toast: any }) => {
    const [loading, setLoading] = useState(true);
    const [allDocs, setAllDocs] = useState<any[]>([]);
    const [fields, setFields] = useState<{name: string, selected: boolean, type: string, options: string[]}[]>([]);
    
    type FilterRule = {
        field: string;
        operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'empty' | 'not_empty';
        value: string;
    };
    const [filters, setFilters] = useState<FilterRule[]>([]);

    useEffect(() => {
        if (!isOpen || !collectionName) return;
        
        const fetchDocs = async () => {
            setLoading(true);
            try {
                const snap = await getDocs(collection(db, collectionName));
                if (snap.empty) {
                    toast(`אין נתונים באוסף ${collectionName}.`, 'info');
                    onClose();
                    return;
                }
                const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllDocs(docs);
                
                // Extract unique fields and deduce their types
                const allKeys = new Set<string>();
                docs.forEach(d => Object.keys(d).forEach(k => allKeys.add(k)));
                
                const fieldInfos = Array.from(allKeys).map(key => {
                    const types = new Set<string>();
                    const distinctValues = new Set<any>();
                    let isDate = false;

                    docs.forEach(d => {
                        const val = d[key];
                        if (val !== null && val !== undefined && val !== '') {
                            types.add(typeof val);
                            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                                distinctValues.add(val);
                            }
                            
                            if (val && typeof val === 'object' && typeof val.toDate === 'function') {
                                isDate = true;
                            } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
                                isDate = true;
                            } else if (typeof val === 'number' && (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key.endsWith('At'))) {
                                isDate = true;
                            }
                        }
                    });

                    let detectedType = 'string';
                    let options: string[] = [];

                    if (types.has('boolean') && distinctValues.size <= 2) {
                        detectedType = 'boolean';
                        options = ['true', 'false'];
                    } else if (isDate) {
                        detectedType = 'date';
                    } else if (distinctValues.size > 0 && distinctValues.size <= 15 && !types.has('object')) {
                        detectedType = 'picklist';
                        options = Array.from(distinctValues).map(String).sort();
                    } else if (types.has('number') && !types.has('string')) {
                        detectedType = 'number';
                    }

                    return { name: key, type: detectedType, options, selected: true };
                });
                
                setFields(fieldInfos);
                setFilters([]);
            } catch (error) {
                console.error(`Export fetch failed for ${collectionName}:`, error);
                toast(`שגיאה בייצוא האוסף ${collectionName}`, 'error');
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, [isOpen, collectionName]);

    const handleExport = () => {
        if (!collectionName) return;
        const selectedFieldNames = fields.filter(f => f.selected).map(f => f.name);
        if (selectedFieldNames.length === 0) {
            toast('חובה לבחור לפחות שדה אחד לייצוא', 'error');
            return;
        }

        // Apply complex filters
        let filteredDocs = allDocs;
        
        if (filters.length > 0) {
            filteredDocs = allDocs.filter(doc => {
                return filters.every(filter => {
                    if (!filter.field) return true; // ignore incomplete rules

                    const val = doc[filter.field];
                    
                    switch (filter.operator) {
                        case 'empty':
                            return val === null || val === undefined || val === '';
                        case 'not_empty':
                            return val !== null && val !== undefined && val !== '';
                        default:
                            if (val === null || val === undefined) return false;
                            
                            let parsedVal = String(val);
                            if (val && typeof val === 'object' && typeof val.toDate === 'function') {
                                parsedVal = val.toDate().toISOString(); 
                            } else if (typeof val === 'number' && (filter.field.toLowerCase().includes('date') || filter.field.toLowerCase().includes('time') || filter.field.endsWith('At'))) {
                                if (val > 1000000000000) parsedVal = new Date(val).toISOString();
                                else parsedVal = new Date(val * 1000).toISOString();
                            }
                            
                            const strVal = parsedVal.toLowerCase();
                            const filterVal = filter.value.toLowerCase();
                            
                            switch (filter.operator) {
                                case 'eq': return strVal === filterVal || (typeof val === 'boolean' && String(val) === filterVal);
                                case 'neq': return strVal !== filterVal;
                                case 'contains': return strVal.includes(filterVal);
                                case 'gt': 
                                    if (!isNaN(Number(val)) && !isNaN(Number(filter.value)) && filter.value.trim() !== '') {
                                        return Number(val) > Number(filter.value);
                                    }
                                    return strVal > filterVal;
                                case 'lt':
                                    if (!isNaN(Number(val)) && !isNaN(Number(filter.value)) && filter.value.trim() !== '') {
                                        return Number(val) < Number(filter.value);
                                    }
                                    return strVal < filterVal;
                                default: return true;
                            }
                    }
                });
            });
        }
        
        if (filteredDocs.length === 0) {
            toast('אין נתונים התואמים את הסינון הנוכחי', 'info');
            return;
        }

        const csvRows = [];
        csvRows.push(selectedFieldNames.join(',')); // Header row
        
        filteredDocs.forEach(d => {
            const row = selectedFieldNames.map(header => {
                const val = (d as any)[header];
                if (val === null || val === undefined) return '';
                if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvRows.push(row.join(','));
        });
        
        const csvString = '\uFEFF' + csvRows.join('\n'); // Add BOM for Hebrew Excel
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${collectionName}_export_filtered_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast(`ייצוא הושלם: ${collectionName} (${filteredDocs.length} מתוך ${allDocs.length} רשומות)`, 'success');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`ייצוא נתונים מותאם אישית: ${collectionName}`} className="max-w-3xl">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
                    <p className="text-slate-500 font-medium">מושך נתונים, אנא המתן...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-4">סינון נתונים לפי רשומות (אופציונלי)</h4>
                        
                        {filters.length > 0 && (
                            <div className="space-y-3 mb-4">
                                {filters.map((filter, idx) => (
                                    <div key={idx} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl relative">
                                        <select 
                                            className="h-10 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none flex-1 min-w-[120px]"
                                            value={filter.field}
                                            onChange={(e) => {
                                                const newFilters = [...filters];
                                                newFilters[idx].field = e.target.value;
                                                setFilters(newFilters);
                                            }}
                                        >
                                            <option value="" disabled>בחר שדה...</option>
                                            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                        </select>
                                        
                                        <select
                                            className="h-10 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none flex-1 min-w-[120px]"
                                            value={filter.operator}
                                            onChange={(e) => {
                                                const newFilters = [...filters];
                                                newFilters[idx].operator = e.target.value as any;
                                                setFilters(newFilters);
                                            }}
                                        >
                                            <option value="eq">שווה ל-</option>
                                            <option value="neq">שונה מ-</option>
                                            <option value="contains">מכיל טקסט</option>
                                            <option value="gt">גדול מ- (תאריך אחרי / ערך)</option>
                                            <option value="lt">קטן מ- (תאריך לפני / ערך)</option>
                                            <option value="empty">ריק או חסר</option>
                                            <option value="not_empty">קיים ולא ריק</option>
                                        </select>
                                        
                                        {filter.operator !== 'empty' && filter.operator !== 'not_empty' && (
                                            (() => {
                                                const fieldInfo = fields.find(f => f.name === filter.field);
                                                if (fieldInfo?.type === 'picklist' || fieldInfo?.type === 'boolean') {
                                                    return (
                                                        <select
                                                            className="h-10 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none flex-1 min-w-[120px]"
                                                            value={filter.value}
                                                            onChange={(e) => {
                                                                const newFilters = [...filters];
                                                                newFilters[idx].value = e.target.value;
                                                                setFilters(newFilters);
                                                            }}
                                                        >
                                                            <option value="" disabled>בחר ערך...</option>
                                                            {fieldInfo.options.map(opt => <option key={opt} value={opt}>{opt === 'true' ? 'כן' : opt === 'false' ? 'לא' : opt}</option>)}
                                                        </select>
                                                    );
                                                } else if (fieldInfo?.type === 'date') {
                                                    return (
                                                        <input 
                                                            type="date"
                                                            className="h-10 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none flex-1 min-w-[120px]"
                                                            value={filter.value}
                                                            onChange={(e) => {
                                                                const newFilters = [...filters];
                                                                newFilters[idx].value = e.target.value;
                                                                setFilters(newFilters);
                                                            }}
                                                        />
                                                    );
                                                } else if (fieldInfo?.type === 'number') {
                                                    return (
                                                        <input 
                                                            type="number"
                                                            placeholder="הכנס מספר..."
                                                            className="h-10 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none flex-1 min-w-[120px]"
                                                            value={filter.value}
                                                            onChange={(e) => {
                                                                const newFilters = [...filters];
                                                                newFilters[idx].value = e.target.value;
                                                                setFilters(newFilters);
                                                            }}
                                                        />
                                                    );
                                                } else {
                                                    return (
                                                        <input 
                                                            type="text"
                                                            placeholder="הכנס ערך או טקסט..."
                                                            className="h-10 px-3 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none flex-1 min-w-[120px]"
                                                            value={filter.value}
                                                            onChange={(e) => {
                                                                const newFilters = [...filters];
                                                                newFilters[idx].value = e.target.value;
                                                                setFilters(newFilters);
                                                            }}
                                                        />
                                                    );
                                                }
                                            })()
                                        )}
                                        
                                        <button 
                                            type="button" 
                                            onClick={() => setFilters(filters.filter((_, i) => i !== idx))}
                                            className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button 
                            variant="outline" 
                            className="w-full border-dashed p-4 h-auto text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-slate-300 hover:border-indigo-300"
                            onClick={() => setFilters([...filters, { field: fields[0]?.name || '', operator: 'eq', value: '' }])}
                        >
                            + הוסף חוק סינון חדש
                        </Button>
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-3 border-t pt-4">
                            <h4 className="font-bold text-slate-800">בחירת שדות לייצוא</h4>
                            <div className="flex gap-2">
                                <button type="button" className="text-xs text-indigo-600 hover:underline font-bold" onClick={() => setFields(fields.map(f => ({...f, selected: true})))}>בחר הכל</button>
                                <span className="text-slate-300">|</span>
                                <button type="button" className="text-xs text-indigo-600 hover:underline font-bold" onClick={() => setFields(fields.map(f => ({...f, selected: false})))}>נקה הכל</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            {fields.map(field => (
                                <label key={field.name} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded transition">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0"
                                        checked={field.selected}
                                        onChange={(e) => {
                                            setFields(fields.map(f => f.name === field.name ? { ...f, selected: e.target.checked } : f));
                                        }}
                                    />
                                    <span className="text-sm font-medium text-slate-700 truncate" title={field.name}>{field.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t font-bold border-slate-100">
                        <Button variant="outline" onClick={onClose}>ביטול</Button>
                        <Button 
                            onClick={handleExport}
                            leftIcon={<Download size={18} />}
                            disabled={fields.filter(f => f.selected).length === 0}
                        >
                            ייצא CSV ({allDocs.length} רשומות במקור)
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const mapHebrewJobType = (val: string) => {
    const lower = val.trim().toLowerCase();
    switch(lower) {
        case 'משרה מלאה': return 'Full-time';
        case 'משרה חלקית': return 'Part-time';
        case 'קבלנות': return 'Contract';
        case 'פרילאנס / קבלן': return 'Contract';
        case 'פרילאנס': return 'Freelance';
        case 'התמחות': return 'Internship';
        case 'משמרות': return 'Shifts';
        default: return val;
    }
}
const mapHebrewWorkMode = (val: string) => {
    const lower = val.trim().toLowerCase();
    switch(lower) {
        case 'מרחוק': return 'Remote';
        case 'היברידי': return 'Hybrid';
        case 'משרדי': return 'Office';
        default: return val; 
    }
}
const mapHebrewExp = (val: string) => {
    const lower = val.trim().toLowerCase();
    switch(lower) {
        case 'ללא ניסיון': return 'No Experience';
        case 'ניסיון שנה': return 'Junior';
        case 'שנתיים - 3 שנים': return 'Middle';
        case 'שנתיים ומעלה': return 'Middle';
        case '5 שנות ניסיון': return 'Senior';
        case 'ומעלה': return 'Expert';
        case 'מנהל': return 'Manager';
        default: return val;
    }
}

export const AdminSettings: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    
    // Bulk Upload States
    const [previewJobs, setPreviewJobs] = useState<any[] | null>(null);
    const [bulkOperation, setBulkOperation] = useState<'create' | 'update' | 'delete'>('create');
    const [isUploadingBulk, setIsUploadingBulk] = useState(false);
    const [employers, setEmployers] = useState<{ id: string, name: string, company: string }[]>([]);
    const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
    const [fetchedTags, setFetchedTags] = useState<string[]>([]);

    useEffect(() => {
        const fetchEmployers = async () => {
            try {
                const q = query(collection(db, 'users'), where('role', 'in', [UserRole.EMPLOYER, UserRole.ADMIN, UserRole.SEEKER]));
                const snap = await getDocs(q);
                const emps = snap.docs.map(d => ({
                    id: d.id,
                    name: d.data().fullName || d.data().displayName || 'ללא שם',
                    company: d.data().companyName || 'ללא חברה'
                }));
                setEmployers(emps);
                
                const tagsRef = doc(db, 'settings', 'tags');
                const tagsSnap = await getDoc(tagsRef);
                if (tagsSnap.exists()) {
                    const data = tagsSnap.data();
                    setFetchedCategories(data.categories || []);
                    setFetchedTags(data.jobTags || []);
                }
            } catch (err) {
                console.error("Failed to fetch auxiliary data for bulk upload", err);
            }
        };
        fetchEmployers();
    }, []);

    const [aiStats, setAiStats] = useState<any[]>([]);
    const [totals, setTotals] = useState({ tokens: 0, queries: 0 });
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const [exportModalConfig, setExportModalConfig] = useState<{isOpen: boolean, collection: string}>({isOpen: false, collection: ''});
    const [dataStats, setDataStats] = useState({
        users: 0,
        jobs: 0,
        applications: 0,
        companies: 0,
        contacts: 0,
        auditLogs: 0
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'system'));
                if (settingsDoc.exists()) {
                    setSettings({ ...DEFAULT_SETTINGS, ...settingsDoc.data() } as SystemSettings);
                }

                // Fetch AI Stats
                const statsSnap = await getDocs(query(collection(db, 'ai_stats'), orderBy('date', 'asc'), limit(30)));
                const statsData = statsSnap.docs.map(d => {
                    const data = d.data();
                    const dObj = new Date(data.date);
                    return {
                        name: `${dObj.getDate()}/${dObj.getMonth() + 1}`,
                        tokens: data.tokens || 0,
                        queries: data.queries || 0
                    };
                });
                setAiStats(statsData);

                const recentStats = statsData.slice(-7);
                const totalTokens = recentStats.reduce((sum, item) => sum + item.tokens, 0);
                const totalQueries = recentStats.reduce((sum, item) => sum + item.queries, 0);
                setTotals({ tokens: totalTokens, queries: totalQueries });

                const fetchCounts = async () => {
                    setLoading(true);
                    try {
                        const snapUsers = await getCountFromServer(collection(db, 'users'));
                        const snapJobs = await getCountFromServer(collection(db, 'jobs'));
                        const snapApps = await getCountFromServer(collection(db, 'applications'));
                        const snapComps = await getCountFromServer(collection(db, 'companies'));
                        const snapInquiries = await getCountFromServer(collection(db, 'inquiries'));
                        const snapAnalytics = await getCountFromServer(collection(db, 'analytics_events'));

                        setDataStats({
                            users: snapUsers.data().count,
                            jobs: snapJobs.data().count,
                            applications: snapApps.data().count,
                            companies: snapComps.data().count,
                            contacts: snapInquiries.data().count,
                            auditLogs: snapAnalytics.data().count
                        });
                        setLastFetched(new Date());
                    } catch (e) {
                        console.error("Error fetching counts:", e);
                    } finally {
                        setLoading(false);
                    }
                };
                fetchCounts();

            } catch (error) {
                console.error("Error fetching settings:", error);
                toast('Error loading system settings', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'system'), settings);
            toast('Settings saved successfully', 'success');
        } catch (error) {
            console.error("Error saving settings:", error);
            toast('Error saving settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof SystemSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleTestWebhook = async (url: string, eventName: string) => {
        if (!url) {
            toast('נא להזין כתובת Webhook קודם', 'info');
            return;
        }
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event: eventName,
                    test: true,
                    timestamp: new Date().toISOString(),
                    data: {
                        message: "This is a test event from the Admin Settings."
                    }
                })
            });

            if (response.ok) {
                toast('הבקשה נשלחה בהצלחה!', 'success');
            } else {
                toast(`שגיאה בשרת: ${response.status}`, 'error');
            }
        } catch (error) {
            toast('שגיאה בשליחת הבקשה, ייתכן בעיית CORS או שרת לא זמין', 'error');
        }
    };

    const handleOpenExportModal = (collectionName: string) => {
        setExportModalConfig({ isOpen: true, collection: collectionName });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;
    }

    const tabs = [
        { id: 'general', label: 'כללי ומיתוג', icon: <Globe size={18} /> },
        { id: 'access', label: 'גישה והרשמה', icon: <Shield size={18} /> },
        { id: 'jobs', label: 'עבודות לטווח ארוך', icon: <Briefcase size={18} /> },
        { id: 'jobs-casual', label: 'עבודות מזדמנות', icon: <Briefcase size={18} /> },
        { id: 'billing', label: 'תמחור וקרדיטים', icon: <CreditCard size={18} /> },
        { id: 'integrations', label: 'אינטגרציות', icon: <Webhook size={18} /> },
        { id: 'ai', label: 'עוזר חכם (AI)', icon: <Bot size={18} /> },
        { id: 'data', label: 'ניהול דאטה ואחסון', icon: <Database size={18} /> },
    ];

    if (previewJobs) {
        const updateJobField = (idx: number, field: string, value: any) => {
            const newJobs = [...previewJobs];
            newJobs[idx] = { ...newJobs[idx], [field]: value };
            setPreviewJobs(newJobs);
        };

        const removeJob = (idx: number) => {
            const newJobs = [...previewJobs];
            newJobs.splice(idx, 1);
            if (newJobs.length === 0) setPreviewJobs(null);
            else setPreviewJobs(newJobs);
        };

        return (
            <div dir="rtl" className="space-y-8 text-right pb-12 w-full">
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-0 z-10 w-full">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">תצוגה מקדימה - פעולות צובר ({previewJobs.length})</h2>
                        <p className="text-slate-500 mt-2">סקור משרות ובחר את הפעולה שתתבצע באופן גורף על הרשומות הנטענות.</p>
                        <div className="mt-4 flex items-center gap-3">
                            <label className="text-sm font-bold text-slate-700">פעולה גורפת:</label>
                            <select 
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-teal focus:border-brand-teal block p-2 outline-none font-medium"
                                value={bulkOperation}
                                onChange={(e) => setBulkOperation(e.target.value as 'create' | 'update' | 'delete')}
                            >
                                <option value="create">יצירה (Create) - הוספת משרות חדשות</option>
                                <option value="update">עדכון (Update) - עדכון לפי עמודת id</option>
                                <option value="delete">מחיקה (Delete) - מחיקה לפי עמודת id</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setPreviewJobs(null)} disabled={isUploadingBulk}>ביטול</Button>
                        <Button 
                            disabled={isUploadingBulk}
                            onClick={async () => {
                                setIsUploadingBulk(true);
                                let createdCount = 0;
                                let updatedCount = 0;
                                let deletedCount = 0;

                                const newTags = new Set<string>();
                                const newCategories = new Set<string>();
                                const newLocations = new Set<string>();

                                for (const jobData of previewJobs) {
                                    const { _ownerId, ...cleanData } = jobData;
                                    const docId = cleanData.id?.trim();
                                    const opName = bulkOperation;

                                    if (opName === 'delete') {
                                        if (docId) {
                                            try { await deleteDoc(doc(db, 'jobs', docId)); deletedCount++; } catch(e) {}
                                        }
                                        continue;
                                    }

                                    if (cleanData.tags && Array.isArray(cleanData.tags)) cleanData.tags.forEach((t: string) => newTags.add(t));
                                    if (cleanData.category) newCategories.add(cleanData.category);
                                    if (cleanData.location) newLocations.add(cleanData.location);

                                    const selectedEmp = employers.find(e => e.id === _ownerId);

                                    if (opName === 'update') {
                                        if (docId) {
                                            try { await setDoc(doc(db, 'jobs', docId), cleanData, { merge: true }); updatedCount++; } catch(e) {}
                                        }
                                    } else {
                                        const docRef = docId ? doc(db, 'jobs', docId) : doc(collection(db, 'jobs'));
                                        const newJob = {
                                            id: docRef.id,
                                            ...cleanData,
                                            employerId: _ownerId || user?.uid,
                                            ownerId: _ownerId || user?.uid,
                                            employerName: selectedEmp ? selectedEmp.name : (user?.displayName || user?.fullName || 'מנהל מערכת'),
                                            employerCompany: selectedEmp && selectedEmp.company !== 'ללא חברה' ? selectedEmp.company : cleanData.companyName,
                                            status: cleanData.status || 'pending_review',
                                            createdAt: cleanData.createdAt || new Date().toISOString()
                                        };
                                        try { await setDoc(docRef, newJob); createdCount++; } catch(e) {}
                                    }
                                }

                                try {
                                    const tagsRef = doc(db, 'settings', 'tags');
                                    const tagsSnap = await getDoc(tagsRef);
                                    const tagsData = tagsSnap.exists() ? tagsSnap.data() : { categories: [], locations: [], jobTags: [] };
                                    
                                    const currentCategories = new Set(tagsData.categories || []);
                                    const currentLocations = new Set(tagsData.locations || []);
                                    const currentJobTags = new Set(tagsData.jobTags || []);
                                    
                                    let updated = false;
                                    newCategories.forEach(c => { if (c && !currentCategories.has(c)) { currentCategories.add(c); updated = true; }});
                                    newLocations.forEach(c => { if (c && !currentLocations.has(c)) { currentLocations.add(c); updated = true; }});
                                    newTags.forEach(c => { if (c && !currentJobTags.has(c)) { currentJobTags.add(c); updated = true; }});
                                    
                                    if (updated) {
                                        await setDoc(tagsRef, {
                                            ...tagsData,
                                            categories: Array.from(currentCategories),
                                            locations: Array.from(currentLocations),
                                            jobTags: Array.from(currentJobTags)
                                        }, { merge: true });
                                    }
                                } catch (tagErr) {
                                    console.error("Failed to update general settings for new tags:", tagErr);
                                }

                                toast(`הפעולות הסתיימו: ${createdCount} נוצרו, ${updatedCount} עודכנו, ${deletedCount} נמחקו.`, 'success');
                                setIsUploadingBulk(false);
                                setPreviewJobs(null);
                            }}
                        >
                            {isUploadingBulk ? 'מבצע פעולות...' : `אשר פעולות על ${previewJobs.length} משרות`}
                        </Button>
                    </div>
                </div>

                <div className="bg-white border rounded-xl overflow-hidden overflow-x-auto shadow-sm custom-scrollbar w-full relative">
                    <datalist id="job-categories">
                        {fetchedCategories.map(c => <option key={c} value={c} />)}
                    </datalist>
                    <datalist id="job-tags">
                        {fetchedTags.map(t => <option key={t} value={t} />)}
                    </datalist>
                    <table className="w-full text-sm text-right align-middle whitespace-nowrap min-w-max">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                {previewJobs.length > 0 && Object.keys(previewJobs[0]).map(h => (
                                    <th key={h} className="px-4 py-3 min-w-[128px]">
                                        {h === '_ownerId' ? 'שיוך מעסיק' : h}
                                    </th>
                                ))}
                                <th className="px-4 py-3 sticky left-0 bg-slate-50 w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {previewJobs.map((job, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    {Object.keys(job).map(h => (
                                        <td key={h} className="px-2 py-2 max-w-[300px]">
                                            {h === '_ownerId' ? (
                                                <select 
                                                    className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                    value={job[h]}
                                                    onChange={(e) => updateJobField(idx, h, e.target.value)}
                                                >
                                                    <option value={user?.uid}>אני (מנהל המערכת)</option>
                                                    {employers.filter(e => e.id !== user?.uid).map(emp => (
                                                        <option key={emp.id} value={emp.id}>{emp.name} {emp.company && emp.company !== 'ללא חברה' ? `(${emp.company})` : ''}</option>
                                                    ))}
                                                </select>
                                            ) : h === 'type' ? (
                                                <select 
                                                    className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white min-w-[100px]"
                                                    value={job[h] || ''}
                                                    onChange={(e) => updateJobField(idx, h, e.target.value)}
                                                >
                                                    <option value="">בחר...</option>
                                                    {Object.values(JobType).map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            ) : h === 'workMode' ? (
                                                <select 
                                                    className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white min-w-[100px]"
                                                    value={job[h] || ''}
                                                    onChange={(e) => updateJobField(idx, h, e.target.value)}
                                                >
                                                    <option value="">בחר...</option>
                                                    {Object.values(WorkMode).map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            ) : h === 'experienceLevel' ? (
                                                <select 
                                                    className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white min-w-[120px]"
                                                    value={job[h] || ''}
                                                    onChange={(e) => updateJobField(idx, h, e.target.value)}
                                                >
                                                    <option value="">בחר...</option>
                                                    {Object.values(ExperienceLevel).map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            ) : h === 'isCasual' || typeof job[h] === 'boolean' || h === 'isImmediate' || h === 'requireCV' ? (
                                                <select 
                                                    className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                    value={job[h] ? 'true' : 'false'}
                                                    onChange={(e) => updateJobField(idx, h, e.target.value === 'true')}
                                                >
                                                    <option value="true">כן</option>
                                                    <option value="false">לא</option>
                                                </select>
                                            ) : h === 'salary' ? (
                                                <div className="flex items-center gap-1 min-w-[220px]">
                                                    <input 
                                                        type="number" 
                                                        placeholder="מ..."
                                                        className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                        value={(job[h] && typeof job[h] === 'string' ? job[h].split('-')[0]?.replace(/\D/g, '') : '') || ''}
                                                        onChange={(e) => {
                                                            const max = (job[h] && typeof job[h] === 'string' ? job[h].split('-')[1] : '') || '';
                                                            const type = (job[h] && typeof job[h] === 'string') ? (job[h].match(/(שעתית|חודשית|גלובלית)/)?.[0] || '') : '';
                                                            updateJobField(idx, h, `${e.target.value}-${max ? max.replace(/\D/g, '') : ''} ${type}`.trim());
                                                        }}
                                                    />
                                                    <span className="text-slate-400">-</span>
                                                    <input 
                                                        type="number" 
                                                        placeholder="עד..."
                                                        className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                        value={(job[h] && typeof job[h] === 'string' ? job[h].split('-')[1]?.replace(/\D/g, '') : '') || ''}
                                                        onChange={(e) => {
                                                            const min = (job[h] && typeof job[h] === 'string' ? job[h].split('-')[0]?.replace(/\D/g, '') : '') || '';
                                                            const type = (job[h] && typeof job[h] === 'string') ? (job[h].match(/(שעתית|חודשית|גלובלית)/)?.[0] || '') : '';
                                                            updateJobField(idx, h, `${min}-${e.target.value} ${type}`.trim());
                                                        }}
                                                    />
                                                    <select 
                                                        className="text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                        onChange={(e) => {
                                                            const min = (job[h] && typeof job[h] === 'string' ? job[h].split('-')[0]?.replace(/\D/g, '') : '') || '';
                                                            const max = (job[h] && typeof job[h] === 'string' ? job[h].split('-')[1]?.replace(/\D/g, '') : '') || '';
                                                            updateJobField(idx, h, `${min}-${max} ${e.target.value}`.trim());
                                                        }}
                                                    >
                                                        <option value="">סוג...</option>
                                                        <option value="שעתית">שעתית</option>
                                                        <option value="חודשית">חודשית</option>
                                                        <option value="גלובלית">גלובלית</option>
                                                    </select>
                                                </div>
                                            ) : h === 'category' ? (
                                                <div className="flex flex-col gap-1 min-w-[150px]">
                                                    <select 
                                                        className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                        value={job[h] || ''}
                                                        onChange={(e) => updateJobField(idx, h, e.target.value)}
                                                    >
                                                        <option value="">בחר קטגוריה...</option>
                                                        {fetchedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                        {job[h] && !fetchedCategories.includes(job[h]) && <option value={job[h]}>{job[h]} (מותאם אישית)</option>}
                                                    </select>
                                                    <input 
                                                        type="text" 
                                                        placeholder="או הקלד קטגוריה חדשה..."
                                                        className="w-full text-xs p-1.5 border border-slate-200 focus:border-indigo-500 rounded outline-none bg-white transition-colors"
                                                        value={job[h] || ''}
                                                        onChange={(e) => updateJobField(idx, h, e.target.value)}
                                                    />
                                                </div>
                                            ) : h === 'tags' ? (
                                                <div className="flex flex-col gap-1 min-w-[180px]">
                                                    <select 
                                                        className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                                        value=""
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (!val) return;
                                                            const currentTags = Array.isArray(job[h]) ? job[h] : [];
                                                            if (!currentTags.includes(val)) {
                                                                updateJobField(idx, h, [...currentTags, val]);
                                                            }
                                                        }}
                                                    >
                                                        <option value="">הוסף תגית...</option>
                                                        {fetchedTags.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                    <input 
                                                        type="text"
                                                        placeholder="מופרד בפסיקים (ערוך חופשי)..."
                                                        className="w-full text-xs p-1.5 border border-slate-200 focus:border-indigo-500 rounded outline-none bg-white transition-colors"
                                                        value={Array.isArray(job[h]) ? job[h].join(', ') : (job[h] || '')}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            updateJobField(idx, h, val ? val.split(',').map(t => t.trim()).filter(Boolean) : []);
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <input 
                                                    type="text" 
                                                    className="w-full text-xs p-1.5 border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded outline-none bg-transparent focus:bg-white transition-colors min-w-[80px]"
                                                    value={job[h] || ''}
                                                    onChange={(e) => updateJobField(idx, h, e.target.value)}
                                                />
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-2 py-2 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors border-l border-slate-100">
                                        <button 
                                            onClick={() => removeJob(idx)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="הסר שורה"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div dir="rtl" className="space-y-8 text-right pb-12">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-0 z-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">הגדרות מערכת</h2>
                    <p className="text-slate-500 mt-2">ניהול פרמטרים גלובליים, הרשאות ותמחור במערכת.</p>
                </div>
                <Button
                    onClick={handleSave}
                    isLoading={saving}
                    variant="primary"
                    className="shadow-lg shadow-indigo-500/30 font-bold px-6"
                    leftIcon={<Save size={18} />}
                >
                    שמור שינויים
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Vertical Sidebar Navigation */}
                <div className="w-full lg:w-64 shrink-0">
                    <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 sticky top-28">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 max-w-4xl space-y-6">
                    {/* 1. General & Branding */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Settings size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">הגדרות כלליות</h3>
                                </div>
                                <div className="space-y-6">
                                    <Input
                                        label="אימייל ליצירת קשר (תמיכה)"
                                        type="email"
                                        placeholder="Ovdimbechik@gmail.com"
                                        dir="ltr"
                                        className="text-left"
                                        value={settings.contactEmail}
                                        onChange={(e) => handleChange('contactEmail', e.target.value)}
                                    />
                                    <ToggleSwitch
                                        label="מצב תחזוקה"
                                        description="חסימת גישה למשתמשים במערכת (למעט מנהלים)."
                                        checked={settings.maintenanceMode}
                                        onChange={(v) => handleChange('maintenanceMode', v)}
                                        activeColorClass="peer-checked:bg-red-500"
                                    />
                                </div>
                            </Card>

                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Globe size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">SEO (מנועי חיפוש)</h3>
                                </div>
                                <div className="space-y-6">
                                    <Input
                                        label="כותרת האתר (Title)"
                                        type="text"
                                        value={settings.seoSiteTitle}
                                        onChange={(e) => handleChange('seoSiteTitle', e.target.value)}
                                        placeholder="כותרת שתוצג למשתמשים ובגוגל"
                                    />
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700">תיאור האתר (Description)</label>
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none placeholder-slate-400"
                                            rows={3}
                                            placeholder="תיאור העמוד שיעזור בקידום אורגני"
                                            value={settings.seoSiteDescription}
                                            onChange={(e) => handleChange('seoSiteDescription', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                                        <Share2 size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">רשתות חברתיות</h3>
                                </div>
                                <div className="space-y-6">
                                    <Input
                                        label="קישור ל-Facebook"
                                        type="url"
                                        dir="ltr"
                                        className="text-left"
                                        value={settings.socialFacebookUrl}
                                        onChange={(e) => handleChange('socialFacebookUrl', e.target.value)}
                                        placeholder="https://facebook.com/..."
                                    />
                                    <Input
                                        label="קישור ל-LinkedIn"
                                        type="url"
                                        dir="ltr"
                                        className="text-left"
                                        value={settings.socialLinkedInUrl}
                                        onChange={(e) => handleChange('socialLinkedInUrl', e.target.value)}
                                        placeholder="https://linkedin.com/..."
                                    />
                                     <Input
                                        label="קישור ל-Instagram"
                                        type="url"
                                        dir="ltr"
                                        className="text-left"
                                        value={settings.socialInstagramUrl}
                                        onChange={(e) => handleChange('socialInstagramUrl', e.target.value)}
                                        placeholder="https://instagram.com/..."
                                    />
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 2. Access & Registration */}
                    {activeTab === 'access' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Shield size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">גישה והרשמה</h3>
                                </div>
                                <div className="space-y-4">
                                    <ToggleSwitch
                                        label="אפשר הרשמת מחפשי עבודה"
                                        description="יאפשר למשתמשים חדשים להירשם כמחפשי עבודה."
                                        checked={settings.allowSeekerRegistration}
                                        onChange={(v) => handleChange('allowSeekerRegistration', v)}
                                        activeColorClass="peer-checked:bg-emerald-500"
                                    />
                                    <ToggleSwitch
                                        label="אפשר הרשמת מעסיקים"
                                        description="יאפשר הרשמת מעסיקים וחברות חדשות."
                                        checked={settings.allowEmployerRegistration}
                                        onChange={(v) => handleChange('allowEmployerRegistration', v)}
                                        activeColorClass="peer-checked:bg-emerald-500"
                                    />
                                    <ToggleSwitch
                                        label="דרוש אימות אימייל"
                                        description="משתמשים יחויבו לאמת את כתובת הדוא״ל שלהם."
                                        checked={settings.requireEmailVerification}
                                        onChange={(v) => handleChange('requireEmailVerification', v)}
                                        activeColorClass="peer-checked:bg-emerald-500"
                                    />
                                    <ToggleSwitch
                                        label="דרישת העלאת קורות חיים"
                                        description="משתמש לא יוכל להגיש מועמדות ללא קורות חיים."
                                        checked={settings.requireResumeUpload}
                                        onChange={(v) => handleChange('requireResumeUpload', v)}
                                        activeColorClass="peer-checked:bg-emerald-500"
                                    />
                                </div>
                            </Card>

                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                                        <Lock size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">אבטחה</h3>
                                </div>
                                <div className="space-y-6">
                                    <Input
                                        label="ניסיונות התחברות מקסימליים (לפני חסימה)"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={settings.maxFailedLoginAttempts.toString()}
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value);
                                            if (isNaN(val) || val < 1) val = 1;
                                            handleChange('maxFailedLoginAttempts', val);
                                        }}
                                    />
                                    <ToggleSwitch
                                        label="ניהול הרשאות אדמינים"
                                        description="מאפשר הגדרת תפקידים ספציפיים למנהלים במערכת."
                                        checked={settings.enableAdminRoleManagement}
                                        onChange={(v) => handleChange('enableAdminRoleManagement', v)}
                                        activeColorClass="peer-checked:bg-red-500"
                                    />
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 3. Job Management */}
                    {activeTab === 'jobs' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Briefcase size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">הגדרות עבודות לטווח ארוך</h3>
                                </div>
                                <div className="space-y-6">
                                    <ToggleSwitch
                                        label="אישור אוטומטי למשרות"
                                        description="משרות יפורסמו באופן מיידי ללא צורך באישור מנהל."
                                        checked={settings.autoApproveJobs}
                                        onChange={(v) => handleChange('autoApproveJobs', v)}
                                        activeColorClass="peer-checked:bg-indigo-500"
                                    />
                                    <Input
                                        label="תוקף משרה (בימים)"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={settings.defaultJobValidityDays.toString()}
                                        onChange={(e) => handleChange('defaultJobValidityDays', parseInt(e.target.value) || 30)}
                                    />
                                    <Input
                                        label="מקסימום משרות פעילות למעסיק"
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={settings.maxActiveJobsPerEmployer.toString()}
                                        onChange={(e) => handleChange('maxActiveJobsPerEmployer', parseInt(e.target.value) || 10)}
                                    />
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700">מילות מפתח אסורות (מופרדות בפסיק)</label>
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none placeholder-slate-400"
                                            rows={4}
                                            placeholder="לדוגמה: בינארי, דרושות, קריפטו..."
                                            value={settings.bannedJobKeywords}
                                            onChange={(e) => handleChange('bannedJobKeywords', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 3b. Casual Job Management */}
                    {activeTab === 'jobs-casual' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <Briefcase size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">הגדרות עבודות מזדמנות</h3>
                                </div>
                                <div className="space-y-6">
                                    <ToggleSwitch
                                        label="אישור אוטומטי לעבודות מזדמנות"
                                        description="עבודות מזדמנות יפורסמו באופן מיידי ללא צורך באישור מנהל."
                                        checked={settings.autoApproveCasualJobs}
                                        onChange={(v) => handleChange('autoApproveCasualJobs', v)}
                                        activeColorClass="peer-checked:bg-orange-500"
                                    />
                                    <Input
                                        label="תוקף משרה למזדמנות (בימים)"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={settings.defaultCasualJobValidityDays.toString()}
                                        onChange={(e) => handleChange('defaultCasualJobValidityDays', parseInt(e.target.value) || 7)}
                                    />
                                    <Input
                                        label="מקסימום עבודות מזדמנות פעילות למעסיק"
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={settings.maxActiveCasualJobsPerEmployer.toString()}
                                        onChange={(e) => handleChange('maxActiveCasualJobsPerEmployer', parseInt(e.target.value) || 5)}
                                    />
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 4. Billing & Credits */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <CreditCard size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">תמחור וקרדיטים</h3>
                                </div>
                                <div className="space-y-6">
                                    <Input
                                        label="כמות קרדיטים במתנה למעסיק חדש"
                                        type="number"
                                        value={settings.defaultCreditsForNewEmployer.toString()}
                                        onChange={(e) => handleChange('defaultCreditsForNewEmployer', parseInt(e.target.value) || 0)}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="מחיר לקרדיט"
                                            type="number"
                                            value={settings.pricePerCreditAmount.toString()}
                                            onChange={(e) => handleChange('pricePerCreditAmount', parseInt(e.target.value) || 0)}
                                        />
                                        <div className="space-y-1">
                                            <label className="block text-sm font-bold text-slate-700">מטבע</label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                                                value={settings.currency}
                                                onChange={(e) => handleChange('currency', e.target.value)}
                                            >
                                                <option value="ILS">ILS (₪)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Input
                                        label="עמלת מערכת (%)"
                                        type="number"
                                        max="100"
                                        min="0"
                                        value={settings.platformFeePercentage.toString()}
                                        onChange={(e) => handleChange('platformFeePercentage', parseInt(e.target.value) || 0)}
                                    />
                                    <ToggleSwitch
                                        label="אפשר קופוני הנחה"
                                        description="יאפשר למעסיקים להזין קודי קופון בעת תשלום."
                                        checked={settings.enableDiscountCoupons}
                                        onChange={(v) => handleChange('enableDiscountCoupons', v)}
                                        activeColorClass="peer-checked:bg-emerald-500"
                                    />
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 5. Integrations & Notifications */}
                    {activeTab === 'integrations' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Webhook size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">אינטגרציות (n8n & Webhooks)</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-end gap-3 w-full">
                                        <div className="flex-1 w-full">
                                            <Input
                                                label="Webhook URL: משרה חדשה נוצרה"
                                                type="url"
                                                dir="ltr"
                                                className="text-left w-full"
                                                placeholder="https://your-n8n-instance.com/webhook/new-job"
                                                value={settings.webhookUrlNewJob}
                                                onChange={(e) => handleChange('webhookUrlNewJob', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleTestWebhook(settings.webhookUrlNewJob, 'new_job')}
                                        >
                                            Test Webhook
                                        </Button>
                                    </div>
                                    <div className="flex items-end gap-3 w-full">
                                        <div className="flex-1 w-full">
                                            <Input
                                                label="Webhook URL: שינוי סטטוס מועמדות"
                                                type="url"
                                                dir="ltr"
                                                className="text-left w-full"
                                                placeholder="https://your-n8n-instance.com/webhook/status-change"
                                                value={settings.webhookUrlStatusChange}
                                                onChange={(e) => handleChange('webhookUrlStatusChange', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleTestWebhook(settings.webhookUrlStatusChange, 'status_change')}
                                        >
                                            Test Webhook
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <Bell size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">התראות (Notifications)</h3>
                                </div>
                                <div className="space-y-4">
                                    <ToggleSwitch
                                        label="הפעלת התראות WhatsApp למועמדים"
                                        description="שליחת הודעות אוטומטיות למועמדים על שינוי סטטוס."
                                        checked={settings.enableCandidateWhatsAppNotifications}
                                        onChange={(v) => handleChange('enableCandidateWhatsAppNotifications', v)}
                                        activeColorClass="peer-checked:bg-emerald-500"
                                    />
                                    <ToggleSwitch
                                        label="הפעלת התראות Email למועמדים"
                                        description="שליחת עדכוני דוא״ל למועמדים על מצב מועמדותם."
                                        checked={settings.enableCandidateEmailNotifications}
                                        onChange={(v) => handleChange('enableCandidateEmailNotifications', v)}
                                        activeColorClass="peer-checked:bg-indigo-500"
                                    />
                                    <ToggleSwitch
                                        label="התראת אדמין: משרה חדשה"
                                        description="ישלח התראה פנימית למנהל כשנוצרת משרה שממתינה לאישור."
                                        checked={settings.notifyOnNewJobPending}
                                        onChange={(v) => handleChange('notifyOnNewJobPending', v)}
                                        activeColorClass="peer-checked:bg-orange-500"
                                    />
                                    <ToggleSwitch
                                        label="התראת אדמין: מעסיק חדש נרשם"
                                        description="ישלח התראה פנימית למנהל כשמעסיק חדש נרשם למערכת."
                                        checked={settings.notifyOnNewEmployerRegistered}
                                        onChange={(v) => handleChange('notifyOnNewEmployerRegistered', v)}
                                        activeColorClass="peer-checked:bg-orange-500"
                                    />
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 6. AI Assistant */}
                    {activeTab === 'ai' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                                        <Bot size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">עוזר חכם (Chat Bot)</h3>
                                </div>
                                <div className="space-y-6">
                                    <ToggleSwitch
                                        label="הפעלת עוזר חכם"
                                        description="הצגת העוזר האישי למשתמשים (מחפשי עבודה ומעסיקים) ולמבקרים באמצויות האתר."
                                        checked={settings.enableAIAssistant}
                                        onChange={(v) => handleChange('enableAIAssistant', v)}
                                        activeColorClass="peer-checked:bg-teal-500"
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">מודל הליבה (Model Selection)</label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                                                value={settings.aiModel}
                                                onChange={(e) => handleChange('aiModel', e.target.value)}
                                            >
                                                <option value="gemini-3-flash-preview">Gemini 3 Flash (מהיר וחסכוני ביותר)</option>
                                                <option value="gemini-flash-latest">Gemini Flash Latest (החדש ביותר)</option>
                                                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (חכם ומדויק מאוד - תומך ב-API בתשלום בלבד)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">סגנון דיבור (Tone of Voice)</label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                                                value={settings.aiTone}
                                                onChange={(e) => handleChange('aiTone', e.target.value)}
                                            >
                                                <option value="professional">רשמי ומקצועי (Professional)</option>
                                                <option value="friendly">ידידותי ומזמין (Friendly)</option>
                                                <option value="humorous">קליל והומוריסטי (Humorous)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">מגבלת זיכרון שיחה (History Window)</label>
                                            <div className="relative">
                                                <Input 
                                                    type="number"
                                                    value={settings.aiHistoryWindow}
                                                    onChange={(e) => handleChange('aiHistoryWindow', parseInt(e.target.value) || 10)}
                                                    className="w-full h-11 pr-4 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500"
                                                />
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">הודעות</span>
                                            </div>
                                             <p className="text-xs text-slate-500">מספר ההודעות האחרונות שהבוט "יזכור" בהקשר ההמתנה.</p>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <ToggleSwitch
                                                label='הפעלת "ידע חיצוני" (RAG)'
                                                description="האם הבוט רשאי לשאוב מידע ספציפי ממאגר המידע של האתר (משרות, חברות) כדי לענות על שאלות."
                                                checked={settings.aiEnableRAG}
                                                onChange={(v) => handleChange('aiEnableRAG', v)}
                                                activeColorClass="peer-checked:bg-teal-500"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700">טמפרטורה (יצירתיות וגיוון)</label>
                                            <input
                                                type="range"
                                                min="0.0"
                                                max="1.0"
                                                step="0.1"
                                                className="w-full accent-teal-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                                value={settings.aiTemperature}
                                                onChange={(e) => handleChange('aiTemperature', parseFloat(e.target.value) || 0.7)}
                                            />
                                            <div className="flex justify-between text-xs text-slate-500 font-medium mt-2">
                                                <span>ממוקד וקבוע (0.0)</span>
                                                <span className="bg-teal-100 text-teal-700 px-2 rounded-md font-bold">{settings.aiTemperature}</span>
                                                <span>יצירתי ומגוון (1.0)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700">תוספת לפרומפט המערכת (System Prompt)</label>
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 transition-all resize-none placeholder-slate-400"
                                            rows={4}
                                            placeholder="הכנס הוראות או מגבלות נוספות לעוזר החכם. הן יתווספו לפרומפט הבסיסי של העוזר."
                                            value={settings.aiAdditionalPrompt}
                                            onChange={(e) => handleChange('aiAdditionalPrompt', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* Analytics Section */}
                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">שימוש וסטטיסטיקה</h3>
                                        <p className="text-sm text-slate-500">נתוני השימוש של העוזר החכם</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h4 className="text-sm text-slate-500 font-bold mb-1">שאילתות (7 ימים)</h4>
                                        <p className="text-2xl font-black text-slate-800">{totals.queries}</p>
                                    </div>
                                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h4 className="text-sm text-slate-500 font-bold mb-1">טוקנים (Tokens)</h4>
                                        <p className="text-2xl font-black text-slate-800">{totals.tokens.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="h-[250px] w-full" dir="ltr">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={aiStats} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="tokens" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 7. Data & Storage Management */}
                    {activeTab === 'data' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                            <Database size={20} />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800">סיכום נתונים ואחסון</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {lastFetched && <span className="text-xs text-slate-400">עודכן לאחרונה: {lastFetched.toLocaleTimeString()}</span>}
                                        <Button variant="outline" size="sm" onClick={() => window.location.reload()} leftIcon={<RotateCcw size={14} />}>
                                            רענן
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                        <p className="text-sm font-bold text-slate-500 mb-1">סה"כ רשומות</p>
                                        <p className="text-3xl font-black text-slate-900">
                                            {(dataStats.users + dataStats.jobs + dataStats.applications + dataStats.companies + dataStats.contacts + dataStats.auditLogs).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-6 bg-cyan-50 rounded-2xl border border-cyan-100 flex flex-col items-center justify-center text-center">
                                        <p className="text-sm font-bold text-cyan-600 mb-1">נפח מוערך</p>
                                        <p className="text-3xl font-black text-cyan-900">
                                            {((dataStats.auditLogs * 0.6 + dataStats.jobs * 1.2 + dataStats.users * 0.8 + dataStats.applications * 0.5 + dataStats.companies * 1.0 + dataStats.contacts * 0.4) / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                                        <p className="text-sm font-bold text-emerald-600 mb-1">בריאות דאטה</p>
                                        <p className="text-3xl font-black text-emerald-900">תקין</p>
                                    </div>
                                </div>

                                <h4 className="font-bold text-slate-800 mb-4 px-1">פירוט לפי אוספים</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'משתמשים', count: dataStats.users, weight: 0.8, color: 'bg-blue-500' },
                                        { label: 'משרות', count: dataStats.jobs, weight: 1.2, color: 'bg-indigo-500' },
                                        { label: 'מועמדויות', count: dataStats.applications, weight: 0.5, color: 'bg-purple-500' },
                                        { label: 'חברות', count: dataStats.companies, weight: 1.0, color: 'bg-pink-500' },
                                        { label: 'לוגים', count: dataStats.auditLogs, weight: 0.6, color: 'bg-slate-400' },
                                    ].map((item, idx) => {
                                        const size = (item.count * item.weight) / 1024;
                                        const totalSize = (dataStats.auditLogs * 0.6 + dataStats.jobs * 1.2 + dataStats.users * 0.8 + dataStats.applications * 0.5 + dataStats.companies * 1.0 + dataStats.contacts * 0.4) / 1024;
                                        const percent = totalSize > 0 ? (size / totalSize) * 100 : 0;
                                        
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span className="text-slate-700">{item.label} ({item.count.toLocaleString()})</span>
                                                    <span className="text-slate-500">{size.toFixed(2)} MB</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${item.color} transition-all duration-1000`} 
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Activity size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">ניטור ומגמות גדילה</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-center">
                                        מוניטור גדילת הנתונים יחל להציג מגמות לאחר שימוש ממושך במערכת (מעל 30 יום).
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <h5 className="font-bold text-slate-800 text-sm mb-2">אופטימיזציה מומלצת</h5>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                נפח הצמיחה הנוכחי מאפשר עבודה תקינה בשנים הקרובות ללא צורך בארכיבאציה. 
                                                מומלץ לוודא אינדקסים על שדות חיפוש נפוצים לשיפור ביצועי השאילתות.
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <h5 className="font-bold text-slate-800 text-sm mb-2">גיבויים ושחזור</h5>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                הנתונים מגובים אוטומטית על ידי תשתית Google Cloud. 
                                                Point-in-time recovery פעיל ומאפשר שחזור במקרה של תקלה.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Download size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">יצוא דאטה ידני (Backup & Export)</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                                            הכן גיבוי לנתוני המערכת על ידי ייצוא האובייקטים הקיימים לקבצי אקסל (CSV).
                                            אפשרות זו שימושית במיוחד לקריאה, בקרה ושליטה ידנית על הדאטה.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                { label: 'ייצוא משתמשים', collection: 'users' },
                                                { label: 'ייצוא חברות', collection: 'companies' },
                                                { label: 'ייצוא משרות', collection: 'jobs' },
                                                { label: 'ייצוא מועמדויות', collection: 'applications' },
                                                { label: 'ייצוא יומן Audit', collection: 'audit_logs' },
                                                { label: 'ייצוא פעולות קרדיט', collection: 'credit_transactions' },
                                                { label: 'ייצוא פניות (Inquiries)', collection: 'inquiries' },
                                                { label: 'ייצוא דיווחי מערכת', collection: 'reports' },
                                                { label: 'ייצוא דיווחי משרות', collection: 'jobReports' },
                                                { label: 'ייצוא איוונטים (Analytics)', collection: 'analytics_events' },
                                                { label: 'ייצוא הגדרות, תווים וקטגוריות', collection: 'settings' }
                                            ].map((btn, idx) => (
                                                <Button 
                                                    key={idx} 
                                                    variant="outline" 
                                                    leftIcon={<Download size={16} />} 
                                                    onClick={() => handleOpenExportModal(btn.collection)}
                                                >
                                                    {btn.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Briefcase size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">ניהול משרות בצובר (ייבוא, עדכון, מחיקה)</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col items-start gap-4">
                                            <div>
                                                <p className="font-bold text-indigo-900 mb-1">טמפלייט משרות לטווח ארוך</p>
                                                <p className="text-sm text-indigo-700/80 mb-4">קובץ לקליטת משרות קבועות, קריירה, הייטק ומקצועיות.</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                className="w-full bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                                leftIcon={<Download size={16} />}
                                                onClick={() => {
                                                    const headers = 'id,isCasual,title,description,companyName,companyDescription,location,type,workMode,experienceLevel,salary,category,tags,directContact,requireCV\n';
                                                    const exampleRows = '"","false","מנהל מכירות","ניהול צוות טכני בשילוב של מיומנויות מכירה וקידום מוצרים","Tech Corp","חברת הייטק וותיקה במרכז תל אביב","תל אביב","משרה מלאה","היברידי","שנתיים - 3 שנים","20K-25K","מכירות","אגייל, מכירות, צוות מעולה","jobs@techcorp.co.il","true"';
                                                    
                                                    const blob = new Blob(['\uFEFF' + headers + exampleRows], { type: 'text/csv;charset=utf-8;' });
                                                    const link = document.createElement('a');
                                                    const url = URL.createObjectURL(blob);
                                                    link.setAttribute('href', url);
                                                    link.setAttribute('download', 'long_term_jobs_template.csv');
                                                    link.style.visibility = 'hidden';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                            >
                                                הורד טמפלייט
                                            </Button>
                                        </div>

                                        <div className="p-5 bg-purple-50 border border-purple-100 rounded-xl flex flex-col items-start gap-4">
                                            <div>
                                                <p className="font-bold text-purple-900 mb-1">טמפלייט עבודות מזדמנות 🍕</p>
                                                <p className="text-sm text-purple-700/80 mb-4">קובץ לעבודות זמניות, נוער, משמרות ועבודות מיידיות.</p>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                className="w-full bg-white border-purple-200 text-purple-600 hover:bg-purple-100"
                                                leftIcon={<Download size={16} />}
                                                onClick={() => {
                                                    const headers = 'id,isCasual,title,description,companyName,companyDescription,location,type,workMode,experienceLevel,salary,category,tags,directContact,isImmediate,requireCV\n';
                                                    const exampleRows = '"","true","דרושים מלצרים לעבודה מיידית באולם אירועים","עבודה באולם אירועים במרכז. צוות צעיר ואווירה טובה! לא נדרש ניסיון קודם!","אולמי השרון","אולם שמחות ואירועים מוביל בישראל","ראשון לציון","משמרות","משרדי","ללא ניסיון","45-50","מלצרות","ערב, בוקר","https://wa.me/972556867356","true","false"';
                                                    
                                                    const blob = new Blob(['\uFEFF' + headers + exampleRows], { type: 'text/csv;charset=utf-8;' });
                                                    const link = document.createElement('a');
                                                    const url = URL.createObjectURL(blob);
                                                    link.setAttribute('href', url);
                                                    link.setAttribute('download', 'casual_jobs_template.csv');
                                                    link.style.visibility = 'hidden';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                            >
                                                הורד טמפלייט
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-teal mt-4 shadow-sm">
                                        <textarea 
                                            placeholder="או הדבק נתוני CSV לכאן..." 
                                            className="w-full h-32 p-4 text-xs font-mono text-slate-700 outline-none resize-y border-b border-slate-100 placeholder:font-sans placeholder:text-sm"
                                            onPaste={(e) => {
                                                const text = e.clipboardData.getData('text');
                                                if (text) {
                                                    Papa.parse(text, {
                                                        header: true,
                                                        skipEmptyLines: true,
                                                        complete: (results) => {
                                                            if (results.errors.length > 0 && results.data.length === 0) {
                                                                toast('שגיאה בפענוח הנתונים המודבקים', 'error');
                                                                return;
                                                            }
                                                            const parsed = results.data.map((row: any) => {
                                                                const defaultUploader = employers.find(e => e.name === 'שיוך משרות (משתמש כללי)');
                                                                const jobData: any = {
                                                                    id: row.id || '',
                                                                    _ownerId: defaultUploader ? defaultUploader.id : (user?.uid || '')
                                                                };
                                                                Object.keys(row).forEach(h => {
                                                                    if (h === 'id') return;
                                                                    const val = row[h] ? String(row[h]).trim() : '';
                                                                    if (h === 'tags') {
                                                                        jobData[h] = val ? val.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
                                                                    } else if (h === 'isImmediate' || h === 'requireCV' || h === 'isCasual') {
                                                                        jobData[h] = val.toLowerCase() === 'true' || val === 'TRUE';
                                                                    } else if (h === 'type') {
                                                                        jobData.type = mapHebrewJobType(val);
                                                                    } else if (h === 'workMode') {
                                                                        jobData.workMode = mapHebrewWorkMode(val);
                                                                    } else if (h === 'experienceLevel') {
                                                                        jobData.experienceLevel = mapHebrewExp(val);
                                                                    } else {
                                                                        jobData[h] = val;
                                                                    }
                                                                });
                                                                return jobData;
                                                            });
                                                            setPreviewJobs(parsed);
                                                        }
                                                    });
                                                    // clear textarea after shortly
                                                    setTimeout(() => { if(e.target instanceof HTMLTextAreaElement) e.target.value = '' }, 100);
                                                }
                                            }}
                                        ></textarea>
                                        <div className="p-4 bg-slate-50 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-800 mb-0.5">פעולות בצובר על משרות (יבוא מ-CSV)</p>
                                                <p className="text-sm text-slate-600">בחר קובץ עם העמודות הרלוונטיות. עמודת id משמשת לזיהוי משרות עבור עדכון או מחיקה.</p>
                                            </div>
                                            <label className="cursor-pointer shrink-0">
                                                <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                                                    if (!e.target.files?.[0]) return;
                                                    const file = e.target.files[0];
                                                    
                                                    Papa.parse(file, {
                                                    header: true,
                                                    skipEmptyLines: true,
                                                    complete: (results) => {
                                                        if (results.errors.length > 0 && results.data.length === 0) {
                                                            toast('שגיאה בפענוח הקובץ', 'error');
                                                            return;
                                                        }
                                                        
                                                        const parsed = results.data.map((row: any) => {
                                                            const defaultUploader = employers.find(e => e.name === 'שיוך משרות (משתמש כללי)');
                                                            const jobData: any = {
                                                                id: row.id || '',
                                                                _ownerId: defaultUploader ? defaultUploader.id : (user?.uid || '')
                                                            };
                                                            Object.keys(row).forEach(h => {
                                                                if (h === 'id') return;
                                                                const val = row[h] ? String(row[h]).trim() : '';
                                                                if (h === 'tags') {
                                                                    jobData[h] = val ? val.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
                                                                } else if (h === 'isImmediate' || h === 'requireCV' || h === 'isCasual') {
                                                                    jobData[h] = val.toLowerCase() === 'true' || val === 'TRUE';
                                                                } else if (h === 'type') {
                                                                    jobData.type = mapHebrewJobType(val);
                                                                } else if (h === 'workMode') {
                                                                    jobData.workMode = mapHebrewWorkMode(val);
                                                                } else if (h === 'experienceLevel') {
                                                                    jobData.experienceLevel = mapHebrewExp(val);
                                                                } else {
                                                                    jobData[h] = val;
                                                                }
                                                            });
                                                            return jobData;
                                                        });
                                                        
                                                        setPreviewJobs(parsed);
                                                        e.target.value = '';
                                                    }
                                                });
                                            }} />
                                            <Button variant="primary" className="pointer-events-none w-full shadow-lg hover:-translate-y-0.5 transition-all" leftIcon={<Upload size={16} />}>
                                                העלה קובץ
                                            </Button>
                                        </label>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
            <ExportModal 
                isOpen={exportModalConfig.isOpen} 
                onClose={() => setExportModalConfig({ isOpen: false, collection: '' })} 
                collectionName={exportModalConfig.collection}
                toast={toast}
            />

        </div>
    );
};

