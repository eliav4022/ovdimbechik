import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Save, Settings, Shield, CreditCard, RotateCcw, Bell, Lock, Globe, Share2, Briefcase, Webhook, LayoutTemplate, Bot, Activity, Database, Trash2, Download, Upload, FileText, Copy, Check, CheckCircle2, AlertCircle, Play, Send, RefreshCw, Zap, Key, Radio, ExternalLink, Sparkles, Clock, CheckCheck, XCircle } from 'lucide-react';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, getCountFromServer, deleteDoc as firestoreDeleteDoc } from 'firebase/firestore';
import { setDoc, deleteDoc } from '../../lib/firestore-audit';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/AuthContext';
import { UserRole, JobType, WorkMode, ExperienceLevel } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import { AdminTable } from '../../components/admin/AdminTable';
import { RecycleBinTab } from '../../components/admin/RecycleBinTab';
import { AdminObjectManager } from '../../components/admin/AdminObjectManager';
import { AdminPagesManager } from '../../components/admin/AdminPagesManager';
import { CsvBulkImporter } from '../../components/admin/CsvBulkImporter';
import { testWebhook, getRecentWebhookLogs, WebhookLog, WebhookEvent, SAMPLE_PAYLOADS } from '../../services/webhookService';

interface SystemSettings {
    contactEmail: string;
    systemSenderEmail?: string;
    siteLogoUrl?: string;
    siteFaviconUrl?: string;
    maintenanceMode: boolean;
    enableCVUploads: boolean;
    fileUploadPassword?: string;
    maxUserUploadSizeMB?: number;
    maxAdminUploadSizeMB?: number;
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
    enableEmployersToViewRelevantSeekers: boolean;

    autoApproveJobs: boolean;
    defaultJobValidityDays: number;
    maxActiveJobsPerEmployer: number;
    bannedJobKeywords: string;

    autoApproveCasualJobs: boolean;
    defaultCasualJobValidityDays: number;
    maxActiveCasualJobsPerEmployer: number;

    defaultCreditsForNewEmployer: number;
    creditsCostPerJob?: number;
    creditsCostPerUrgentJob?: number;
    pricePerCreditAmount: number;
    platformFeePercentage: number;
    enableDiscountCoupons: boolean;
    currency: string;

    webhookEnabled?: boolean;
    webhookSecret?: string;
    webhookUrlNewJob: string;
    webhookUrlStatusChange: string;
    webhookUrlNewApplication?: string;
    webhookUrlNewEmployer?: string;
    webhookUrlNewInquiry?: string;
    whatsappGatewayUrl?: string;
    whatsappApiKey?: string;
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
    systemSenderEmail: 'noreply@ovdimbechik.com',
    siteLogoUrl: '',
    siteFaviconUrl: '',
    maintenanceMode: false,
    enableCVUploads: true,
    fileUploadPassword: '',
    maxUserUploadSizeMB: 1,
    maxAdminUploadSizeMB: 5,
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
    enableEmployersToViewRelevantSeekers: false,

    autoApproveJobs: false,
    defaultJobValidityDays: 30,
    maxActiveJobsPerEmployer: 10,
    bannedJobKeywords: 'casino, crypto, forex',

    autoApproveCasualJobs: true,
    defaultCasualJobValidityDays: 7,
    maxActiveCasualJobsPerEmployer: 5,

    defaultCreditsForNewEmployer: 0,
    creditsCostPerJob: 5,
    creditsCostPerUrgentJob: 2,
    pricePerCreditAmount: 50,
    platformFeePercentage: 10,
    enableDiscountCoupons: false,
    currency: 'ILS',

    webhookEnabled: true,
    webhookSecret: '',
    webhookUrlNewJob: '',
    webhookUrlStatusChange: '',
    webhookUrlNewApplication: '',
    webhookUrlNewEmployer: '',
    webhookUrlNewInquiry: '',
    whatsappGatewayUrl: '',
    whatsappApiKey: '',
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
    const [viewMode, setViewMode] = useState<'config' | 'table'>('config');
    const [filteredData, setFilteredData] = useState<any[]>([]);
    
    type FilterRule = {
        field: string;
        operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'empty' | 'not_empty';
        value: string;
    };
    const [filters, setFilters] = useState<FilterRule[]>([]);

    useEffect(() => {
        if (!isOpen || !collectionName) {
            setViewMode('config');
            return;
        }
        
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
                setViewMode('config');
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

    const getFilteredDocs = () => {
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
        return filteredDocs;
    };

    const handleShowTable = () => {
        if (!collectionName) return;
        const selectedFieldNames = fields.filter(f => f.selected).map(f => f.name);
        if (selectedFieldNames.length === 0) {
            toast('חובה לבחור לפחות שדה אחד לייצוא', 'error');
            return;
        }

        const filtered = getFilteredDocs();
        
        if (filtered.length === 0) {
            toast('אין נתונים התואמים את הסינון הנוכחי', 'info');
            return;
        }

        setFilteredData(filtered);
        setViewMode('table');
    };

    const handleDownloadCsv = () => {
        const selectedFieldNames = fields.filter(f => f.selected).map(f => f.name);
        const csvRows = [];
        csvRows.push(selectedFieldNames.join(',')); // Header row
        
        filteredData.forEach(d => {
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
        toast(`ייצוא הושלם: ${collectionName} (${filteredData.length} מתוך ${allDocs.length} רשומות)`, 'success');
        onClose();
    };

    const handleCopyData = async () => {
        const selectedFieldNames = fields.filter(f => f.selected).map(f => f.name);
        const tsvRows = [];
        tsvRows.push(selectedFieldNames.join('\t')); // Header row
        
        filteredData.forEach(d => {
            const row = selectedFieldNames.map(header => {
                let val = (d as any)[header];
                if (val === null || val === undefined) val = '';
                else if (typeof val === 'object') {
                    if (val.toDate && typeof val.toDate === 'function') val = val.toDate().toLocaleString('he-IL');
                    else val = JSON.stringify(val);
                }
                else if (typeof val === 'boolean') val = val ? 'כן' : 'לא';
                else val = String(val);
                
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            tsvRows.push(row.join('\t'));
        });
        
        try {
            await navigator.clipboard.writeText(tsvRows.join('\n'));
            toast('הנתונים הועתקו ללוח בהצלחה', 'success');
        } catch (error) {
            console.error('Failed to copy', error);
            toast('שגיאה בהעתקת הנתונים', 'error');
        }
    };

    const handleCopyCsvData = async () => {
        const selectedFieldNames = fields.filter(f => f.selected).map(f => f.name);
        const csvRows = [];
        csvRows.push(selectedFieldNames.join(',')); // Header row
        
        filteredData.forEach(d => {
            const row = selectedFieldNames.map(header => {
                let val = (d as any)[header];
                if (val === null || val === undefined) val = '';
                else if (typeof val === 'object') {
                    if (val.toDate && typeof val.toDate === 'function') val = val.toDate().toLocaleString('he-IL');
                    else val = JSON.stringify(val);
                }
                else if (typeof val === 'boolean') val = val ? 'כן' : 'לא';
                else val = String(val);
                
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvRows.push(row.join(','));
        });
        
        try {
            await navigator.clipboard.writeText(csvRows.join('\n'));
            toast('הנתונים הועתקו ללוח בהצלחה', 'success');
        } catch (error) {
            console.error('Failed to copy', error);
            toast('שגיאה בהעתקת הנתונים', 'error');
        }
    };

    const renderVal = (val: any) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
            if (val.toDate && typeof val.toDate === 'function') return val.toDate().toLocaleString('he-IL');
            return JSON.stringify(val);
        }
        if (typeof val === 'boolean') return val ? 'כן' : 'לא';
        return String(val);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`ייצוא נתונים מותאם אישית: ${collectionName}`} className={viewMode === 'table' ? "max-w-[90vw]" : "max-w-3xl"}>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
                    <p className="text-slate-500 font-medium">מושך נתונים, אנא המתן...</p>
                </div>
            ) : viewMode === 'table' ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800 text-lg">תצוגה מקדימה ({filteredData.length} רשומות)</h4>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setViewMode('config')}>חזור לסינון</Button>
                            <Button variant="outline" onClick={handleCopyData} leftIcon={<Copy size={18} />}>העתק נתונים לאקסל</Button>
                            <Button variant="outline" onClick={handleCopyCsvData} leftIcon={<Copy size={18} />}>העתק כ-CSV</Button>
                            <Button onClick={handleDownloadCsv} leftIcon={<Download size={18} />}>הורד CSV</Button>
                        </div>
                    </div>
                    
                    <div className="overflow-auto border border-slate-200 rounded-xl max-h-[60vh] bg-white">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    {fields.filter(f => f.selected).map(f => (
                                        <th key={f.name} className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{f.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.slice(0, 100).map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        {fields.filter(f => f.selected).map(f => (
                                            <td key={f.name} className="px-4 py-3 text-slate-600 truncate max-w-xs" title={renderVal((row as any)[f.name])}>
                                                {renderVal((row as any)[f.name])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredData.length > 100 && (
                            <div className="text-center p-4 text-slate-500 bg-slate-50 border-t border-slate-200">
                                מוצגות 100 שורות ראשונות מתוך {filteredData.length}. להצגת כל הנתונים יש להוריד CSV.
                            </div>
                        )}
                    </div>
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
                                                    );;
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
                            onClick={handleShowTable}
                            leftIcon={<Database size={18} />}
                            disabled={fields.filter(f => f.selected).length === 0}
                        >
                            הצג נתונים בטבלה ({allDocs.length} רשומות במקור)
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

    const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [testingEventKey, setTestingEventKey] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ url: string; event: string; success: boolean; statusCode: number; responseTimeMs: number; responseBody?: string; error?: string } | null>(null);
    const [selectedLogForModal, setSelectedLogForModal] = useState<WebhookLog | null>(null);
    const [activeIntegrationSubTab, setActiveIntegrationSubTab] = useState<'endpoints' | 'tester' | 'logs' | 'docs'>('endpoints');
    const [customTestEvent, setCustomTestEvent] = useState<WebhookEvent>('job.created');
    const [customTestUrl, setCustomTestUrl] = useState('');
    const [customTestPayload, setCustomTestPayload] = useState(JSON.stringify(SAMPLE_PAYLOADS['job.created'], null, 2));

    const loadWebhookLogs = async () => {
        setLoadingLogs(true);
        try {
            const logs = await getRecentWebhookLogs(30);
            setWebhookLogs(logs);
        } catch (e) {
            console.error("Failed to load webhook logs:", e);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'integrations') {
            loadWebhookLogs();
        }
    }, [activeTab]);

    const generateRandomSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        let secret = 'whsec_';
        for (let i = 0; i < 28; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        handleChange('webhookSecret', secret);
        toast('נוצר מפתח סודי חדש ל-Webhook! אל תשכח לשמור.', 'success');
    };

    const handleRunTestWebhook = async (url: string, eventName: WebhookEvent, payloadOverride?: any) => {
        if (!url || !url.trim().startsWith('http')) {
            toast('נא להזין כתובת Webhook תקינה (המתחילה ב-http:// או https://)', 'error');
            return;
        }

        setTestingEventKey(eventName);
        setTestResult(null);

        try {
            let finalPayload = payloadOverride;
            if (!finalPayload && SAMPLE_PAYLOADS[eventName]) {
                finalPayload = SAMPLE_PAYLOADS[eventName];
            }

            const result = await testWebhook(url.trim(), eventName, finalPayload, settings.webhookSecret);
            setTestResult({
                url,
                event: eventName,
                success: result.success,
                statusCode: result.statusCode,
                responseTimeMs: result.responseTimeMs,
                responseBody: result.responseBody,
                error: result.error
            });

            if (result.success) {
                toast(`בדיקת Webhook עברה בהצלחה! (${result.statusCode} OK - ${result.responseTimeMs}ms)`, 'success');
            } else {
                toast(`בדיקת Webhook נכשלה: ${result.error || `קוד ${result.statusCode}`}`, 'error');
            }

            // Refresh logs
            loadWebhookLogs();
        } catch (err: any) {
            toast(`שגיאה בהפעלת Webhook: ${err.message || 'שגיאת רשת'}`, 'error');
        } finally {
            setTestingEventKey(null);
        }
    };

    const handleClearLogs = async () => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את כל יומני ה-Webhooks?')) return;
        try {
            const snap = await getDocs(collection(db, 'webhook_logs'));
            const deletePromises = snap.docs.map(d => firestoreDeleteDoc(doc(db, 'webhook_logs', d.id)));
            await Promise.all(deletePromises);
            setWebhookLogs([]);
            toast('יומני ה-Webhooks נמחקו בהצלחה', 'success');
        } catch (e) {
            console.error("Failed to clear webhook logs:", e);
            toast('שגיאה במחיקת יומנים', 'error');
        }
    };

    const handleTestWebhook = async (url: string, eventName: string) => {
        handleRunTestWebhook(url, eventName as WebhookEvent);
    };

    const handleOpenExportModal = (collectionName: string) => {
        setExportModalConfig({ isOpen: true, collection: collectionName });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;
    }

    const hasObjectsPermission = user?.role === UserRole.SUPER_ADMIN || (Array.isArray(user?.permissions) && (user.permissions.includes('ALL') || user.permissions.some(p => typeof p === 'string' && p.startsWith('settings.objects'))));

    const tabs = [
        { id: 'general', label: 'כללי ומיתוג', icon: <Globe size={18} /> },
        { id: 'pages', label: 'ניהול עמודים', icon: <FileText size={18} /> },
        { id: 'access', label: 'גישה והרשמה', icon: <Shield size={18} /> },
        { id: 'jobs', label: 'עבודות לטווח ארוך', icon: <Briefcase size={18} /> },
        { id: 'jobs-casual', label: 'עבודות מזדמנות', icon: <Briefcase size={18} /> },
        { id: 'billing', label: 'תמחור וקרדיטים', icon: <CreditCard size={18} /> },
        { id: 'integrations', label: 'אינטגרציות', icon: <Webhook size={18} /> },
        { id: 'ai', label: 'עוזר חכם (AI)', icon: <Bot size={18} /> },
        { id: 'data', label: 'ניהול דאטה ואחסון', icon: <Database size={18} /> },
        ...(hasObjectsPermission ? [{ id: 'objects', label: 'ניהול אובייקטים', icon: <LayoutTemplate size={18} /> }] : []),
        { id: 'recycle', label: 'סל מחזור', icon: <Trash2 size={18} /> },
    ];


    const processCSVResults = async (results: any, errorMsg: string) => {
        if (results.errors.length > 0 && results.data.length === 0) {
            toast(errorMsg, 'error');
            return;
        }

        let existingJobs: any[] = [];
        try {
            const snap = await getDocs(collection(db, 'jobs'));
            existingJobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error("Failed to fetch jobs for duplication check", e);
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

            const isDuplicate = existingJobs.some(existing => {
                const sameLocation = existing.location?.trim() === jobData.location?.trim();
                const sameCompany = existing.companyName?.trim() === jobData.companyName?.trim();
                const sameDesc = existing.description?.trim() === jobData.description?.trim();
                return sameLocation && sameCompany && sameDesc && !!jobData.description;
            });

            if (isDuplicate) {
                jobData._isDuplicate = true;
                jobData._skip = true;
            } else {
                jobData._skip = false;
            }

            return jobData;
        });

        setPreviewJobs(parsed);
    };

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
    if (jobData._skip) continue;

                                    const { _ownerId, _isDuplicate, _skip, ...cleanData } = jobData;
                                    const docId = cleanData.id?.trim();
                                    const opName = bulkOperation;

                                    if (opName === 'delete') {
                                        if (docId) {
                                            try { 
                                                const { softDelete } = await import('../../lib/adminUtils');
                                                await softDelete({
                                                    collectionName: 'jobs',
                                                    id: docId,
                                                    deletedBy: user?.uid || 'admin',
                                                    reason: 'מחיקה המונית דרך יבוא קובץ'
                                                });
                                                deletedCount++; 
                                            } catch(e) {}
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
                                {previewJobs.length > 0 && Object.keys(previewJobs[0]).map(h => h === '_isDuplicate' || h === '_skip' ? null : (
        <th key={h} className="px-4 py-3 min-w-[128px]">
            {h === '_ownerId' ? 'שיוך מעסיק' : h}
        </th>
    )

)}
                                
    <th className="px-4 py-3 min-w-[100px]">סטטוס / ייבוא</th>
    <th className="px-4 py-3 sticky left-0 bg-slate-50 w-[50px]"></th>

                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {previewJobs.map((job, idx) => (
                                <tr key={idx} className={`hover:bg-slate-50 transition-colors ${job._isDuplicate ? 'bg-amber-50/50' : ''}`}>
                                    {Object.keys(job).map(h => h === '_isDuplicate' || h === '_skip' ? null : (
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
                                    <Input
                                        label="כתובת אימייל לשליחת הודעות מערכת (Sender)"
                                        type="email"
                                        placeholder="noreply@ovdimbechik.com"
                                        dir="ltr"
                                        className="text-left"
                                        value={settings.systemSenderEmail || ''}
                                        onChange={(e) => handleChange('systemSenderEmail', e.target.value)}
                                    />
                                    <Input
                                        id="siteLogoUrl"
                                        label="כתובת לוגו האתר (URL)"
                                        type="url"
                                        placeholder="https://..."
                                        dir="ltr"
                                        className="text-left"
                                        value={settings.siteLogoUrl || ''}
                                        onChange={(e) => handleChange('siteLogoUrl', e.target.value)}
                                    />
                                    <Input
                                        id="siteFaviconUrl"
                                        label="כתובת Favicon (אייקון לשורת הכתובת - URL)"
                                        type="url"
                                        placeholder="https://..."
                                        dir="ltr"
                                        className="text-left"
                                        value={settings.siteFaviconUrl || ''}
                                        onChange={(e) => handleChange('siteFaviconUrl', e.target.value)}
                                    />
                                    <ToggleSwitch
                                        label="מצב תחזוקה"
                                        description="חסימת גישה למשתמשים במערכת (למעט מנהלים)."
                                        checked={settings.maintenanceMode}
                                        onChange={(v) => handleChange('maintenanceMode', v)}
                                        activeColorClass="peer-checked:bg-red-500"
                                    />
                                    <ToggleSwitch
                                        label="הפעלת מנגנון קורות חיים באתר"
                                        description="הפעלה או ניתוק מוחלט של כל מנגנון קורות החיים (העלאה לפרופיל וצירוף קו״ח בהגשת מועמדות למשרות)."
                                        checked={settings.enableCVUploads}
                                        onChange={(v) => handleChange('enableCVUploads', v)}
                                        activeColorClass="peer-checked:bg-indigo-600"
                                    />
                                    <Input
                                        id="fileUploadPassword"
                                        label="סיסמת העלאת קבצים (מנהל/משתמשים)"
                                        type="password"
                                        placeholder="השאר ריק כדי לבטל דרישת סיסמה"
                                        value={settings.fileUploadPassword || ''}
                                        onChange={(e) => handleChange('fileUploadPassword', e.target.value)}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            id="maxUserUploadSizeMB"
                                            label="גודל קובץ מקסימלי למשתמש רגיל (MB)"
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={settings.maxUserUploadSizeMB?.toString() || '1'}
                                            onChange={(e) => handleChange('maxUserUploadSizeMB', parseInt(e.target.value) || 1)}
                                        />
                                        <Input
                                            id="maxAdminUploadSizeMB"
                                            label="גודל קובץ מקסימלי למנהל (MB)"
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={settings.maxAdminUploadSizeMB?.toString() || '5'}
                                            onChange={(e) => handleChange('maxAdminUploadSizeMB', parseInt(e.target.value) || 5)}
                                        />
                                    </div>
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

                    {activeTab === 'pages' && (
                        <AdminPagesManager />
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
                                        label="אפשר למעסיקים לראות מחפשי עבודה רלוונטים"
                                        description="יאפשר למעסיקים לראות נתונים של מחפשי עבודה שעונים על דרישות המשרות שלהם (בהירות והתאמה למשרה)."
                                        checked={settings.enableEmployersToViewRelevantSeekers}
                                        onChange={(v) => handleChange('enableEmployersToViewRelevantSeekers', v)}
                                        activeColorClass="peer-checked:bg-indigo-500"
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
                                    <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-800">סיכום תמחור בפועל למעסיק:</span>
                                            <span className="text-xs font-mono font-black text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md">
                                                1 קרדיט = {settings.pricePerCreditAmount} {settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : '₪'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-amber-700 font-medium">
                                            עלות פרסום משרה רגילה: <strong className="font-black text-amber-950">{(settings.creditsCostPerJob || 5)} קרדיטים</strong> (שווה ערך ל-<strong>{(settings.creditsCostPerJob || 5) * settings.pricePerCreditAmount} {settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : '₪'}</strong>)
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="עלות פרסום משרה רגילה (בקרדיטים)"
                                            type="number"
                                            min="1"
                                            value={(settings.creditsCostPerJob ?? 5).toString()}
                                            onChange={(e) => handleChange('creditsCostPerJob', Math.max(1, parseInt(e.target.value) || 1))}
                                        />
                                        <Input
                                            label="עלות תוספת הדגשת משרה דחופה (בקרדיטים)"
                                            type="number"
                                            min="0"
                                            value={(settings.creditsCostPerUrgentJob ?? 2).toString()}
                                            onChange={(e) => handleChange('creditsCostPerUrgentJob', Math.max(0, parseInt(e.target.value) || 0))}
                                        />
                                    </div>

                                    <Input
                                        label="כמות קרדיטים במתנה למעסיק חדש בהרשמה"
                                        type="number"
                                        min="0"
                                        value={settings.defaultCreditsForNewEmployer.toString()}
                                        onChange={(e) => handleChange('defaultCreditsForNewEmployer', parseInt(e.target.value) || 0)}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="מחיר לקרדיט יחיד"
                                            type="number"
                                            min="1"
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
                            {/* Integrations Sub-Navigation */}
                            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
                                <button
                                    type="button"
                                    onClick={() => setActiveIntegrationSubTab('endpoints')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all",
                                        activeIntegrationSubTab === 'endpoints'
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                    )}
                                >
                                    <Webhook size={16} />
                                    כתובות Webhook והגדרות
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveIntegrationSubTab('tester')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all",
                                        activeIntegrationSubTab === 'tester'
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                    )}
                                >
                                    <Play size={16} />
                                    כלי בדיקה בזמן אמת (Live Tester)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveIntegrationSubTab('logs');
                                        loadWebhookLogs();
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all",
                                        activeIntegrationSubTab === 'logs'
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                    )}
                                >
                                    <Clock size={16} />
                                    יומן קריאות ({webhookLogs.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveIntegrationSubTab('docs')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all",
                                        activeIntegrationSubTab === 'docs'
                                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                    )}
                                >
                                    <Sparkles size={16} />
                                    מדריך ודוגמאות JSON (n8n / Make)
                                </button>
                            </div>

                            {/* SUB-TAB 1: ENDPOINTS & SETTINGS */}
                            {activeIntegrationSubTab === 'endpoints' && (
                                <div className="space-y-6">
                                    <Card className="p-6 md:p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                                    <Webhook size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-800">הגדרות אינטגרציה ו-Webhooks</h3>
                                                    <p className="text-xs text-slate-500 font-medium">סנכרון נתונים אוטומטי מול n8n, Make.com, Zapier או שרתים פרטיים</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-500">סטטוס מנגנון:</span>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5",
                                                    settings.webhookEnabled !== false
                                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                                                        : "bg-slate-100 text-slate-500 border border-slate-200"
                                                )}>
                                                    <span className={cn("w-2 h-2 rounded-full", settings.webhookEnabled !== false ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                                    {settings.webhookEnabled !== false ? "פעיל" : "מושבת"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <ToggleSwitch
                                                label="הפעלת שיגור Webhooks אוטומטי"
                                                description="כאשר מופעל, המערכת תשלח קריאות HTTP POST לכתובות המוגדרות מטה בעת כל אירוע במערכת."
                                                checked={settings.webhookEnabled !== false}
                                                onChange={(v) => handleChange('webhookEnabled', v)}
                                                activeColorClass="peer-checked:bg-indigo-600"
                                            />

                                            {/* Webhook Secret Key */}
                                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Key size={16} className="text-indigo-600" />
                                                        <span className="text-sm font-bold text-slate-800">מפתח אבטחה וחתימה (Webhook Secret Token)</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={generateRandomSecret}
                                                        className="text-xs h-8 gap-1.5"
                                                    >
                                                        <RefreshCw size={13} />
                                                        צור מפתח חדש
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    מפתח זה יישלח בכל קריאה בכותרות <code className="text-indigo-600 font-mono bg-white px-1.5 py-0.5 rounded border">X-Webhook-Secret</code> ו-<code className="text-indigo-600 font-mono bg-white px-1.5 py-0.5 rounded border">Authorization: Bearer</code> לאימות מקור הבקשה ב-n8n / Make.
                                                </p>
                                                <Input
                                                    type="text"
                                                    dir="ltr"
                                                    className="font-mono text-xs text-left bg-white"
                                                    placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
                                                    value={settings.webhookSecret || ''}
                                                    onChange={(e) => handleChange('webhookSecret', e.target.value)}
                                                />
                                            </div>

                                            {/* Webhook Endpoints List */}
                                            <div className="space-y-5 pt-2">
                                                <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                    <Zap size={16} className="text-amber-500" />
                                                    יעדי אירועים (Event Endpoints)
                                                </h4>

                                                {/* 1. New Job Created / Updated */}
                                                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 transition-colors space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                            <span className="text-sm font-bold text-slate-800">משרה חדשה פורסמה / עודכנה</span>
                                                            <span className="text-[11px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">job.created / job.updated</span>
                                                        </div>
                                                        <span className="text-xs text-slate-400">מופעל כאשר מעסיק או מנהל מפרסמים משרה</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="url"
                                                            dir="ltr"
                                                            className="text-left font-mono text-xs flex-1"
                                                            placeholder="https://n8n.your-domain.com/webhook/job-created"
                                                            value={settings.webhookUrlNewJob || ''}
                                                            onChange={(e) => handleChange('webhookUrlNewJob', e.target.value)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={testingEventKey === 'job.created' || !settings.webhookUrlNewJob}
                                                            onClick={() => handleRunTestWebhook(settings.webhookUrlNewJob, 'job.created')}
                                                            className="text-xs h-10 px-3 whitespace-nowrap gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                        >
                                                            {testingEventKey === 'job.created' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                                                            בדיקה
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* 2. New Application Submitted */}
                                                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 transition-colors space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <span className="text-sm font-bold text-slate-800">מועמד הגיש מועמדות למשרה</span>
                                                            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">application.created</span>
                                                        </div>
                                                        <span className="text-xs text-slate-400">כולל פרטי מועמד, קו"ח ומספר טלפון</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="url"
                                                            dir="ltr"
                                                            className="text-left font-mono text-xs flex-1"
                                                            placeholder="https://n8n.your-domain.com/webhook/candidate-applied"
                                                            value={settings.webhookUrlNewApplication || ''}
                                                            onChange={(e) => handleChange('webhookUrlNewApplication', e.target.value)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={testingEventKey === 'application.created' || !settings.webhookUrlNewApplication}
                                                            onClick={() => handleRunTestWebhook(settings.webhookUrlNewApplication, 'application.created')}
                                                            className="text-xs h-10 px-3 whitespace-nowrap gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                        >
                                                            {testingEventKey === 'application.created' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                                                            בדיקה
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* 3. Candidate Status Changed */}
                                                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 transition-colors space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                            <span className="text-sm font-bold text-slate-800">שינוי סטטוס מועמד (ראיון, התקבל, נדחה)</span>
                                                            <span className="text-[11px] font-mono bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">application.status_changed</span>
                                                        </div>
                                                        <span className="text-xs text-slate-400">מאפשר שיגור הודעת וואטסאפ אוטומטית למועמד</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="url"
                                                            dir="ltr"
                                                            className="text-left font-mono text-xs flex-1"
                                                            placeholder="https://n8n.your-domain.com/webhook/candidate-status"
                                                            value={settings.webhookUrlStatusChange || ''}
                                                            onChange={(e) => handleChange('webhookUrlStatusChange', e.target.value)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={testingEventKey === 'application.status_changed' || !settings.webhookUrlStatusChange}
                                                            onClick={() => handleRunTestWebhook(settings.webhookUrlStatusChange, 'application.status_changed')}
                                                            className="text-xs h-10 px-3 whitespace-nowrap gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                        >
                                                            {testingEventKey === 'application.status_changed' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                                                            בדיקה
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* 4. New Employer Registered */}
                                                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 transition-colors space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                                                            <span className="text-sm font-bold text-slate-800">מעסיק חדש נרשם למערכת</span>
                                                            <span className="text-[11px] font-mono bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-semibold">employer.registered</span>
                                                        </div>
                                                        <span className="text-xs text-slate-400">מאפשר שליחת מייל ברוכים הבאים או רישום ב-CRM</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="url"
                                                            dir="ltr"
                                                            className="text-left font-mono text-xs flex-1"
                                                            placeholder="https://n8n.your-domain.com/webhook/employer-registered"
                                                            value={settings.webhookUrlNewEmployer || ''}
                                                            onChange={(e) => handleChange('webhookUrlNewEmployer', e.target.value)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={testingEventKey === 'employer.registered' || !settings.webhookUrlNewEmployer}
                                                            onClick={() => handleRunTestWebhook(settings.webhookUrlNewEmployer, 'employer.registered')}
                                                            className="text-xs h-10 px-3 whitespace-nowrap gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                        >
                                                            {testingEventKey === 'employer.registered' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                                                            בדיקה
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* 5. New Contact Inquiry */}
                                                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 transition-colors space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                                                            <span className="text-sm font-bold text-slate-800">פנייה חדשה בטופס יצירת קשר</span>
                                                            <span className="text-[11px] font-mono bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-semibold">inquiry.created</span>
                                                        </div>
                                                        <span className="text-xs text-slate-400">שליחת התראה לטלגרם, סלאק או אימייל תמיכה</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="url"
                                                            dir="ltr"
                                                            className="text-left font-mono text-xs flex-1"
                                                            placeholder="https://n8n.your-domain.com/webhook/contact-inquiry"
                                                            value={settings.webhookUrlNewInquiry || ''}
                                                            onChange={(e) => handleChange('webhookUrlNewInquiry', e.target.value)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={testingEventKey === 'inquiry.created' || !settings.webhookUrlNewInquiry}
                                                            onClick={() => handleRunTestWebhook(settings.webhookUrlNewInquiry, 'inquiry.created')}
                                                            className="text-xs h-10 px-3 whitespace-nowrap gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                        >
                                                            {testingEventKey === 'inquiry.created' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                                                            בדיקה
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Notifications Card */}
                                    <Card className="p-6 md:p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner">
                                                <Bell size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800">התראות אוטומטיות (Automated Notifications)</h3>
                                                <p className="text-xs text-slate-500 font-medium">שליחת עדכונים והתראות מערכת למועמדים ולמנהלים</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <ToggleSwitch
                                                label="הפעלת התראות WhatsApp למועמדים"
                                                description="שליחת הודעות אוטומטיות למועמדים על שינוי סטטוס (מחייב אינטגרציה מוגדרת)."
                                                checked={settings.enableCandidateWhatsAppNotifications}
                                                onChange={(v) => handleChange('enableCandidateWhatsAppNotifications', v)}
                                                activeColorClass="peer-checked:bg-emerald-500"
                                            />
                                            <ToggleSwitch
                                                label="הפעלת התראות Email למועמדים"
                                                description="שליחת עדכוני דוא״ל למועמדים על מצב מועמדותם כאשר המעסיק מעדכן סטטוס."
                                                checked={settings.enableCandidateEmailNotifications}
                                                onChange={(v) => handleChange('enableCandidateEmailNotifications', v)}
                                                activeColorClass="peer-checked:bg-indigo-500"
                                            />
                                            <ToggleSwitch
                                                label="התראת אדמין: משרה חדשה"
                                                description="ישלח התראה פנימית ומשימה למנהל כשנוצרת משרה שממתינה לאישור."
                                                checked={settings.notifyOnNewJobPending}
                                                onChange={(v) => handleChange('notifyOnNewJobPending', v)}
                                                activeColorClass="peer-checked:bg-orange-500"
                                            />
                                            <ToggleSwitch
                                                label="התראת אדמין: מעסיק חדש נרשם"
                                                description="ישלח התראה פנימית ומשימה למנהל כשמעסיק חדש נרשם למערכת."
                                                checked={settings.notifyOnNewEmployerRegistered}
                                                onChange={(v) => handleChange('notifyOnNewEmployerRegistered', v)}
                                                activeColorClass="peer-checked:bg-orange-500"
                                            />
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* SUB-TAB 2: LIVE TESTER */}
                            {activeIntegrationSubTab === 'tester' && (
                                <Card className="p-6 md:p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl space-y-6">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                            <Play size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800">כלי בדיקה בזמן אמת (Webhook Live Tester)</h3>
                                            <p className="text-xs text-slate-500 font-medium">שלח בקשת בדיקה ישירה לכל כתובת Webhook וצפה בתגובה המדויקת של השרת, בזמן התגובה ובתוכן שהוחזר</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Left Side: Test Setup */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">סוג אירוע לבדיקה (Event Type)</label>
                                                <select
                                                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                    value={customTestEvent}
                                                    onChange={(e) => {
                                                        const ev = e.target.value as WebhookEvent;
                                                        setCustomTestEvent(ev);
                                                        setCustomTestPayload(JSON.stringify(SAMPLE_PAYLOADS[ev] || {}, null, 2));
                                                        // Pre-populate URL if configured in settings
                                                        if (ev === 'job.created' || ev === 'job.updated') {
                                                            if (settings.webhookUrlNewJob) setCustomTestUrl(settings.webhookUrlNewJob);
                                                        } else if (ev === 'application.created') {
                                                            if (settings.webhookUrlNewApplication) setCustomTestUrl(settings.webhookUrlNewApplication);
                                                        } else if (ev === 'application.status_changed') {
                                                            if (settings.webhookUrlStatusChange) setCustomTestUrl(settings.webhookUrlStatusChange);
                                                        } else if (ev === 'employer.registered') {
                                                            if (settings.webhookUrlNewEmployer) setCustomTestUrl(settings.webhookUrlNewEmployer);
                                                        } else if (ev === 'inquiry.created') {
                                                            if (settings.webhookUrlNewInquiry) setCustomTestUrl(settings.webhookUrlNewInquiry);
                                                        }
                                                    }}
                                                >
                                                    <option value="job.created">job.created (משרה חדשה נוצרה)</option>
                                                    <option value="job.updated">job.updated (משרה עודכנה)</option>
                                                    <option value="application.created">application.created (הגשת מועמדות חדשה)</option>
                                                    <option value="application.status_changed">application.status_changed (שינוי סטטוס מועמד)</option>
                                                    <option value="employer.registered">employer.registered (מעסיק חדש נרשם)</option>
                                                    <option value="inquiry.created">inquiry.created (פנייה בטופס יצירת קשר)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">כתובת Webhook יעד (Endpoint URL)</label>
                                                <Input
                                                    type="url"
                                                    dir="ltr"
                                                    className="font-mono text-xs text-left"
                                                    placeholder="https://your-n8n-url/webhook/test"
                                                    value={customTestUrl}
                                                    onChange={(e) => setCustomTestUrl(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-xs font-bold text-slate-700">גוף הבקשה (JSON Payload)</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCustomTestPayload(JSON.stringify(SAMPLE_PAYLOADS[customTestEvent] || {}, null, 2))}
                                                        className="text-[11px] text-indigo-600 font-bold hover:underline"
                                                    >
                                                        אפס לברירת מחדל
                                                    </button>
                                                </div>
                                                <textarea
                                                    dir="ltr"
                                                    rows={10}
                                                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                                                    value={customTestPayload}
                                                    onChange={(e) => setCustomTestPayload(e.target.value)}
                                                />
                                            </div>

                                            <Button
                                                type="button"
                                                size="lg"
                                                disabled={testingEventKey === 'custom' || !customTestUrl}
                                                onClick={async () => {
                                                    try {
                                                        const parsedPayload = JSON.parse(customTestPayload);
                                                        setTestingEventKey('custom');
                                                        await handleRunTestWebhook(customTestUrl, customTestEvent, parsedPayload);
                                                    } catch (e: any) {
                                                        toast('ה-JSON אינו תקין! נא לבדוק את התחביר.', 'error');
                                                    } finally {
                                                        setTestingEventKey(null);
                                                    }
                                                }}
                                                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-200"
                                            >
                                                {testingEventKey === 'custom' ? (
                                                    <>
                                                        <RefreshCw size={18} className="animate-spin" />
                                                        שולח בקשת בדיקה...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send size={18} />
                                                        שגר בדיקה עכשיו (Send Test Webhook)
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Right Side: Live Results Display */}
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold text-slate-700">תוצאת הבדיקה בזמן אמת</label>
                                            {testResult ? (
                                                <div className={cn(
                                                    "p-5 rounded-2xl border space-y-4 transition-all animate-in fade-in",
                                                    testResult.success
                                                        ? "bg-emerald-50/50 border-emerald-200"
                                                        : "bg-red-50/50 border-red-200"
                                                )}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {testResult.success ? (
                                                                <CheckCircle2 size={20} className="text-emerald-600" />
                                                            ) : (
                                                                <XCircle size={20} className="text-red-600" />
                                                            )}
                                                            <span className={cn(
                                                                "text-base font-black",
                                                                testResult.success ? "text-emerald-900" : "text-red-900"
                                                            )}>
                                                                {testResult.success ? "הבקשה הצליחה!" : "הבקשה נכשלה"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-white border text-slate-700">
                                                                {testResult.responseTimeMs} ms
                                                            </span>
                                                            <span className={cn(
                                                                "text-xs px-2.5 py-1 rounded-full font-mono font-black",
                                                                testResult.statusCode >= 200 && testResult.statusCode < 300
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-red-100 text-red-700"
                                                            )}>
                                                                HTTP {testResult.statusCode || 'ERR'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-slate-600 space-y-1 font-mono">
                                                        <div><span className="font-bold text-slate-700 font-sans">יעד:</span> {testResult.url}</div>
                                                        <div><span className="font-bold text-slate-700 font-sans">אירוע:</span> {testResult.event}</div>
                                                    </div>

                                                    {testResult.error && (
                                                        <div className="p-3 bg-red-100/70 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                                                            שגיאה: {testResult.error}
                                                        </div>
                                                    )}

                                                    {testResult.responseBody && (
                                                        <div>
                                                            <span className="block text-[11px] font-bold text-slate-500 mb-1">תגובה מהשרת (Response Body):</span>
                                                            <pre dir="ltr" className="p-3 bg-slate-900 text-slate-100 text-xs font-mono rounded-xl overflow-x-auto max-h-56 leading-relaxed">
                                                                {testResult.responseBody}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center">
                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                                                        <Play size={24} />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-700 mb-1">טרם בוצעה בדיקה</h4>
                                                    <p className="text-xs text-slate-400 max-w-xs">הזן כתובת יעד ולחץ על "שגר בדיקה עכשיו" כדי לבחון את תגובת ה-Webhook</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* SUB-TAB 3: LOGS & HISTORY */}
                            {activeIntegrationSubTab === 'logs' && (
                                <Card className="p-6 md:p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                                                <Clock size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800">יומן שיגורי Webhook (Logs & History)</h3>
                                                <p className="text-xs text-slate-500 font-medium">מעקב בזמן אמת אחר כל האירועים שנשלחו, קודי התגובה וזמני השהייה</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={loadingLogs}
                                                onClick={loadWebhookLogs}
                                                className="text-xs h-9 gap-1.5"
                                            >
                                                <RefreshCw size={14} className={cn(loadingLogs && "animate-spin")} />
                                                רענן יומן
                                            </Button>
                                            {webhookLogs.length > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleClearLogs}
                                                    className="text-xs h-9 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} />
                                                    נקה יומן
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {loadingLogs ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                                            <RefreshCw size={28} className="animate-spin text-indigo-500" />
                                            <span className="text-sm font-bold">טוען יומני שיגור...</span>
                                        </div>
                                    ) : webhookLogs.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                                                <Activity size={24} />
                                            </div>
                                            <h4 className="text-base font-bold text-slate-700 mb-1">אין היסטוריית קריאות עדיין</h4>
                                            <p className="text-xs text-slate-400 max-w-sm">קריאות שיישלחו בעת יצירת משרות, הגשת מועמדויות או בדיקות ידניות יופיעו כאן אוטומטית.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-right text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-200/80 text-slate-500 font-bold">
                                                        <th className="pb-3 pr-2">אירוע</th>
                                                        <th className="pb-3">סטטוס</th>
                                                        <th className="pb-3">כתובת יעד (Endpoint)</th>
                                                        <th className="pb-3">זמן תגובה</th>
                                                        <th className="pb-3">תאריך ושעה</th>
                                                        <th className="pb-3 text-center">פרטים</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {webhookLogs.map((log) => (
                                                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                            <td className="py-3 pr-2 font-mono font-bold text-slate-800">
                                                                <span className={cn(
                                                                    "px-2.5 py-1 rounded-full text-[11px] font-semibold",
                                                                    log.event.startsWith('job') ? "bg-blue-50 text-blue-700" :
                                                                    log.event.startsWith('application') ? "bg-emerald-50 text-emerald-700" :
                                                                    log.event.startsWith('employer') ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-700"
                                                                )}>
                                                                    {log.event}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                <span className={cn(
                                                                    "px-2.5 py-0.5 rounded-md font-mono text-[11px] font-black inline-flex items-center gap-1",
                                                                    log.success
                                                                        ? "bg-emerald-100 text-emerald-700"
                                                                        : "bg-red-100 text-red-700"
                                                                )}>
                                                                    {log.success ? <Check size={12} /> : <XCircle size={12} />}
                                                                    {log.statusCode || 'ERR'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 font-mono text-[11px] text-slate-500 max-w-[200px] truncate" dir="ltr">
                                                                {log.url}
                                                            </td>
                                                            <td className="py-3 font-mono text-slate-600">
                                                                {log.responseTimeMs} ms
                                                            </td>
                                                            <td className="py-3 text-slate-500 font-sans">
                                                                {log.createdAt ? new Date(log.createdAt).toLocaleString('he-IL') : '-'}
                                                            </td>
                                                            <td className="py-3 text-center">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setSelectedLogForModal(log)}
                                                                    className="text-[11px] h-7 px-2.5"
                                                                >
                                                                    הצג JSON
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Card>
                            )}

                            {/* SUB-TAB 4: DOCS & SCHEMAS */}
                            {activeIntegrationSubTab === 'docs' && (
                                <div className="space-y-6">
                                    <Card className="p-6 md:p-8 border-none shadow-xl shadow-slate-200/50 rounded-2xl space-y-6">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                                                <Sparkles size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800">מדריך אינטגרציה ודוגמאות JSON</h3>
                                                <p className="text-xs text-slate-500 font-medium">העתק את מבנה הנתונים המדויק ישירות לתוך n8n, Make.com, Zapier או שרתי Python/Node</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {Object.entries(SAMPLE_PAYLOADS).map(([evName, payload]) => (
                                                <div key={evName} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                            {evName}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                                                                toast('ה-JSON הועתק ללוח!', 'success');
                                                            }}
                                                            className="text-xs h-8 gap-1"
                                                        >
                                                            <Copy size={13} />
                                                            העתק JSON
                                                        </Button>
                                                    </div>
                                                    <pre dir="ltr" className="p-3 bg-slate-900 text-emerald-400 text-[11px] font-mono rounded-xl overflow-x-auto max-h-48 leading-relaxed">
                                                        {JSON.stringify(payload, null, 2)}
                                                    </pre>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* Modal for Log Details */}
                            {selectedLogForModal && (
                                <Modal
                                    isOpen={!!selectedLogForModal}
                                    onClose={() => setSelectedLogForModal(null)}
                                    title={`פרטי קריאת Webhook: ${selectedLogForModal.event}`}
                                >
                                    <div className="space-y-4 max-h-[70vh] overflow-y-auto" dir="rtl">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-slate-400 block mb-1">סטטוס קוד HTTP:</span>
                                                <span className={cn(
                                                    "font-mono font-black text-sm",
                                                    selectedLogForModal.success ? "text-emerald-600" : "text-red-600"
                                                )}>
                                                    {selectedLogForModal.statusCode || 'ERROR'} ({selectedLogForModal.success ? 'הצלחה' : 'כישלון'})
                                                </span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-slate-400 block mb-1">זמן שהייה (Latency):</span>
                                                <span className="font-mono font-bold text-sm text-slate-800">
                                                    {selectedLogForModal.responseTimeMs} ms
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <span className="block text-xs font-bold text-slate-700 mb-1">כתובת יעד (URL):</span>
                                            <div dir="ltr" className="p-2.5 bg-slate-100 rounded-xl font-mono text-xs text-slate-700 break-all">
                                                {selectedLogForModal.url}
                                            </div>
                                        </div>

                                        {selectedLogForModal.error && (
                                            <div>
                                                <span className="block text-xs font-bold text-red-600 mb-1">שגיאה:</span>
                                                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                                                    {selectedLogForModal.error}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-slate-700">גוף הבקשה שנשלח (Payload):</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(JSON.stringify(selectedLogForModal.payload, null, 2));
                                                        toast('ה-JSON הועתק!', 'success');
                                                    }}
                                                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                                                >
                                                    <Copy size={12} /> העתק
                                                </button>
                                            </div>
                                            <pre dir="ltr" className="p-3 bg-slate-900 text-emerald-400 text-xs font-mono rounded-xl overflow-x-auto max-h-48">
                                                {JSON.stringify(selectedLogForModal.payload, null, 2)}
                                            </pre>
                                        </div>

                                        {selectedLogForModal.responseBody && (
                                            <div>
                                                <span className="block text-xs font-bold text-slate-700 mb-1">תגובה שהתקבלה מהשרת (Response Body):</span>
                                                <pre dir="ltr" className="p-3 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl overflow-x-auto max-h-40">
                                                    {selectedLogForModal.responseBody}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </Modal>
                            )}
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
                                                    const headers = 'id,isCasual,title,description,companyName,companyDescription,location,type,workMode,experienceLevel,salary,category,tags,directContact,requireCV,employerId,companyId\n';
                                                    const exampleRows = '"","false","מנהל מכירות","ניהול צוות טכני בשילוב של מיומנויות מכירה וקידום מוצרים","Tech Corp","חברת הייטק וותיקה במרכז תל אביב","תל אביב","משרה מלאה","היברידי","שנתיים - 3 שנים","20K-25K","מכירות","אגייל, מכירות, צוות מעולה","jobs@techcorp.co.il","true","",""';
                                                    
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
                                                    const headers = 'id,isCasual,title,description,companyName,companyDescription,location,type,workMode,experienceLevel,salary,category,tags,directContact,isImmediate,requireCV,employerId,companyId\n';
                                                    const exampleRows = '"","true","דרושים מלצרים לעבודה מיידית באולם אירועים","עבודה באולם אירועים במרכז. צוות צעיר ואווירה טובה! לא נדרש ניסיון קודם!","אולמי השרון","אולם שמחות ואירועים מוביל בישראל","ראשון לציון","משמרות","משרדי","ללא ניסיון","45-50","מלצרות","ערב, בוקר","https://wa.me/972556867356","true","false","",""';
                                                    
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
                                    
                                    <div className="mt-8">
                                        <CsvBulkImporter />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'objects' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <AdminObjectManager />
                        </div>
                    )}

                    {/* 8. Recycle Bin */}
                    {activeTab === 'recycle' && (
                        <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                            <RecycleBinTab />
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

