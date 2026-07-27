import React, { useState } from 'react';
import Papa from 'papaparse';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { setDoc, deleteDoc } from '../../lib/firestore-audit';
import { db } from '../../lib/firebase';
import { Button } from '../ui/Button';
import { Upload, ArrowRight, Settings, Database, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { softDelete } from '../../lib/adminUtils';
import { JobStatus } from '../../types';

type TargetCollection = 'jobs' | 'companies' | 'users';

const COLLECTION_FIELDS: Record<TargetCollection, { id: string; label: string }[]> = {
    jobs: [
        { id: 'id', label: 'ID (לעדכון/מחיקה)' },
        { id: 'title', label: 'כותרת משרה' },
        { id: 'companyName', label: 'שם חברה/עסק' },
        { id: 'location', label: 'מיקום' },
        { id: 'description', label: 'תיאור' },
        { id: 'type', label: 'סוג משרה (מלאה/חלקית...)' },
        { id: 'workMode', label: 'אופן עבודה (היברידי...)' },
        { id: 'experienceLevel', label: 'רמת ניסיון' },
        { id: 'category', label: 'קטגוריה' },
        { id: 'tags', label: 'תגיות (מופרדות בפסיק)' },
        { id: 'salary', label: 'שכר' },
        { id: 'status', label: 'סטטוס (active, pending_review, draft, closed, rejected, expired)' },
        { id: 'isImmediate', label: 'מיידית? (TRUE/FALSE)' },
        { id: 'requireCV', label: 'דורש קו"ח? (TRUE/FALSE)' },
        { id: 'isCasual', label: 'מזדמנת? (TRUE/FALSE)' },
        { id: 'employerId', label: 'ID משתמש מפרסם (מעסיק)' },
        { id: '_ownerId', label: 'ID משתמש מפרסם (חלופה ל-employerId)' },
        { id: 'companyId', label: 'ID חברה מקושרת (Company ID)' }
    ],
    companies: [
        { id: 'id', label: 'ID (לעדכון/מחיקה)' },
        { id: 'companyName', label: 'שם חברה' },
        { id: 'name', label: 'שם איש קשר' },
        { id: 'email', label: 'אימייל' },
        { id: 'phone', label: 'טלפון' },
        { id: 'location', label: 'מיקום/כתובת' },
        { id: 'industry', label: 'תעשייה' },
        { id: 'website', label: 'אתר אינטרנט' },
        { id: 'description', label: 'תיאור' },
        { id: 'about', label: 'אודות' },
        { id: 'employerId', label: 'ID מעסיק מקושר' },
        { id: 'credits', label: 'קרדיטים (מספר)' },
        { id: 'isVerified', label: 'מאומת? (TRUE/FALSE)' },
        { id: 'createdAt', label: 'תאריך יצירה' },
        { id: 'updatedAt', label: 'תאריך עדכון' }
    ],
    users: [
        { id: 'id', label: 'ID (לעדכון/מחיקה)' },
        { id: 'email', label: 'אימייל' },
        { id: 'displayName', label: 'שם תצוגה' },
        { id: 'fullName', label: 'שם מלא' },
        { id: 'role', label: 'תפקיד (SEEKER, EMPLOYER, ADMIN)' },
        { id: 'phone', label: 'טלפון' }
    ]
};

export const CsvBulkImporter: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [targetCollection, setTargetCollection] = useState<TargetCollection>('jobs');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({}); // CSV Header -> Collection Field
    const [previewData, setPreviewData] = useState<any[] | null>(null);
    const [bulkOperation, setBulkOperation] = useState<'create' | 'update' | 'delete'>('create');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        parseCSV(e.target.files[0]);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const text = e.clipboardData.getData('text');
        if (text) {
            parseCSV(text);
        }
    };

    const parseCSV = (input: File | string) => {
        Papa.parse(input, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0 && results.data.length === 0) {
                    toast('שגיאה בפענוח הנתונים', 'error');
                    return;
                }
                if (results.meta.fields) {
                    setCsvHeaders(results.meta.fields);
                    
                    // Auto-map fields with exact same names
                    const autoMapping: Record<string, string> = {};
                    const targetFields = COLLECTION_FIELDS[targetCollection];
                    results.meta.fields.forEach(header => {
                        const match = targetFields.find(f => f.id.toLowerCase() === header.trim().toLowerCase());
                        if (match) {
                            autoMapping[header] = match.id;
                        } else {
                            autoMapping[header] = '';
                        }
                    });
                    setFieldMapping(autoMapping);
                }
                setCsvData(results.data);
                setStep(2);
            }
        });
    };

    const generatePreview = () => {
        const mappedData = csvData.map(row => {
            const newRow: any = {};
            Object.entries(fieldMapping).forEach(([csvHeader, targetField]) => {
                if (targetField && row[csvHeader] !== undefined) {
                    let val = row[csvHeader];
                    if (typeof val === 'string') val = val.trim();
                    
                    // Specific type casting
                    if (targetField === 'isImmediate' || targetField === 'requireCV' || targetField === 'isCasual' || targetField === 'isVerified') {
                        newRow[targetField] = String(val).toLowerCase() === 'true' || val === 'TRUE';
                    } else if (targetField === 'credits') {
                        newRow[targetField] = val ? Number(val) : 0;
                    } else if (targetField === 'tags' && val) {
                        newRow[targetField] = String(val).split(',').map(t => t.trim()).filter(Boolean);
                    } else {
                        newRow[targetField] = val;
                    }
                }
            });
            return newRow;
        });
        setPreviewData(mappedData);
        setStep(3);
    };

    const executeBulk = async () => {
        if (!previewData) return;
        setIsUploading(true);
        let createdCount = 0;
        let updatedCount = 0;
        let deletedCount = 0;

        for (const row of previewData) {
            const docId = row.id;
            const cleanData = { ...row };
            delete cleanData.id;
            
            if (targetCollection === 'jobs' && (bulkOperation === 'create' || bulkOperation === 'update')) {
                // Determine the correct employerId field
                const empId = cleanData.employerId || cleanData._ownerId;
                if (empId) {
                    cleanData.employerId = empId;
                    cleanData.ownerId = empId; // Also set ownerId for consistency
                    try {
                        const userDoc = await getDoc(doc(db, 'users', empId));
                        if (userDoc.exists()) {
                            const uData = userDoc.data();
                            cleanData.employerName = uData.companyName || uData.fullName || uData.name || 'ללא שם מעסיק';
                            // If the CSV didn't provide a companyName but we found one in user profile
                            if (!cleanData.companyName && uData.companyName) {
                                cleanData.companyName = uData.companyName;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to lookup employer:', e);
                    }
                }
                
                // Lookup company details if companyId is provided
                if (cleanData.companyId) {
                    try {
                        const compDoc = await getDoc(doc(db, 'companies', cleanData.companyId));
                        if (compDoc.exists()) {
                            const cData = compDoc.data();
                            cleanData.companyName = cData.companyName || cData.name || cleanData.companyName;
                            if (cData.description && !cleanData.companyDescription) {
                                cleanData.companyDescription = cData.description;
                            }
                            if (cData.logoUrl && !cleanData.companyLogo) {
                                cleanData.companyLogo = cData.logoUrl;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to lookup company:', e);
                    }
                }
                
                // Force pending_review status on create, no matter what
                if (bulkOperation === 'create') {
                    cleanData.status = JobStatus.PENDING_REVIEW;
                }
            }

            try {
                if (bulkOperation === 'delete') {
                    if (docId) {
                        if (targetCollection === 'jobs' || targetCollection === 'companies') {
                            await softDelete({
                                collectionName: targetCollection,
                                id: docId,
                                deletedBy: user?.uid || 'admin',
                                reason: 'מחיקה המונית דרך יבוא קובץ'
                            });
                        } else {
                            await deleteDoc(doc(db, targetCollection, docId));
                        }
                        deletedCount++;
                    }
                } else if (bulkOperation === 'update') {
                    if (docId) {
                        await setDoc(doc(db, targetCollection, docId), cleanData, { merge: true });
                        updatedCount++;
                    }
                } else {
                    const docRef = docId ? doc(db, targetCollection, docId) : doc(collection(db, targetCollection));
                    await setDoc(docRef, {
                        ...cleanData,
                        createdAt: new Date().toISOString()
                    }, { merge: true });
                    createdCount++;
                }
            } catch (e) {
                console.error(`Error processing row`, row, e);
            }
        }

        toast(`הפעולות הסתיימו: ${createdCount} נוצרו, ${updatedCount} עודכנו, ${deletedCount} נמחקו.`, 'success');
        setIsUploading(false);
        setStep(1);
        setPreviewData(null);
        setCsvData([]);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Database size={20} className="text-brand-teal" />
                    יבוא חכם (CSV)
                </h3>
                <p className="text-slate-500 text-sm mt-1">יבוא, עדכון או מחיקה של רשומות מרובות עם מיפוי שדות אוטומטי.</p>
            </div>

            <div className="p-6">
                {/* Stepper */}
                <div className="flex items-center justify-between mb-8">
                    {['בחירת אובייקט ונתונים', 'מיפוי שדות', 'תצוגה מקדימה וביצוע'].map((label, idx) => (
                        <div key={idx} className={`flex items-center gap-2 ${step === idx + 1 ? 'text-brand-teal font-bold' : step > idx + 1 ? 'text-slate-600' : 'text-slate-300'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === idx + 1 ? 'bg-brand-teal text-white' : step > idx + 1 ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                                {idx + 1}
                            </div>
                            <span className="hidden sm:inline">{label}</span>
                            {idx < 2 && <ArrowRight size={16} className="mx-2 text-slate-200" />}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">אובייקט מטרה:</label>
                            <select 
                                className="w-full md:w-1/2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent block p-3 outline-none"
                                value={targetCollection}
                                onChange={(e) => setTargetCollection(e.target.value as TargetCollection)}
                            >
                                <option value="jobs">משרות (Jobs)</option>
                                <option value="companies">חברות (Companies)</option>
                                <option value="users">משתמשים (Users)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-brand-teal/50 hover:bg-slate-50 transition-all">
                                <Upload size={32} className="text-slate-400 mb-4" />
                                <p className="font-bold text-slate-700 mb-2">העלאת קובץ CSV</p>
                                <p className="text-sm text-slate-500 mb-4">בחר קובץ ממחשבך</p>
                                <label className="cursor-pointer">
                                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                                    <span className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors">בחר קובץ</span>
                                </label>
                            </div>
                            
                            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-teal focus-within:border-transparent transition-all">
                                <textarea 
                                    className="w-full h-full min-h-[160px] p-4 text-sm font-mono text-slate-700 outline-none resize-none placeholder:font-sans placeholder:text-slate-400"
                                    placeholder="או הדבק נתוני CSV לכאן..."
                                    onPaste={handlePaste}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
                            <Settings size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold mb-1">מיפוי שדות (Inspector)</p>
                                <p>אנו מזהים את העמודות בקובץ שלך. אנא ודא כי הן תואמות לשדות הנכונים באובייקט <strong>{targetCollection}</strong>. בחר "התעלם" כדי לדלג על עמודה.</p>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                    <tr>
                                        <th className="p-4 w-1/2 border-l border-slate-200">עמודה בקובץ (CSV)</th>
                                        <th className="p-4 w-1/2">שדה יעד ({targetCollection})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvHeaders.map((header, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                            <td className="p-4 font-mono text-slate-700 border-l border-slate-200 bg-slate-50/30">
                                                {header}
                                            </td>
                                            <td className="p-3">
                                                <select
                                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                                                    value={fieldMapping[header] || ''}
                                                    onChange={(e) => setFieldMapping({...fieldMapping, [header]: e.target.value})}
                                                >
                                                    <option value="">-- התעלם מעמודה זו --</option>
                                                    {COLLECTION_FIELDS[targetCollection].map(field => (
                                                        <option key={field.id} value={field.id}>
                                                            {field.id} ({field.label})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(1)}>חזור אחורה</Button>
                            <Button onClick={generatePreview} leftIcon={<ArrowRight size={18} />}>המשך לתצוגה מקדימה</Button>
                        </div>
                    </div>
                )}

                {step === 3 && previewData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <h4 className="font-bold text-slate-800">תצוגה מקדימה - {previewData.length} רשומות ({targetCollection})</h4>
                                <p className="text-sm text-slate-500">בחר את סוג הפעולה לאישור.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <select 
                                    className="bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-brand-teal"
                                    value={bulkOperation}
                                    onChange={(e) => setBulkOperation(e.target.value as any)}
                                >
                                    <option value="create">יצירה (Create)</option>
                                    <option value="update">עדכון (Update לפי ID)</option>
                                    <option value="delete">מחיקה (Delete לפי ID)</option>
                                </select>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[400px]">
                            <table className="w-full text-sm text-right whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="p-3 border-b border-slate-200 w-12 text-center">#</th>
                                        {Object.values(fieldMapping).filter(Boolean).map((field, idx) => (
                                            <th key={idx} className="p-3 border-b border-slate-200">{field}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((row, rowIdx) => (
                                        <tr key={rowIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                            <td className="p-3 text-center text-slate-400 font-mono">{rowIdx + 1}</td>
                                            {Object.values(fieldMapping).filter(Boolean).map((field, idx) => (
                                                <td key={idx} className="p-3 text-slate-700 max-w-[200px] truncate">
                                                    {Array.isArray(row[field]) ? row[field].join(', ') : String(row[field] || '')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewData.length > 50 && (
                                <div className="p-3 text-center text-slate-500 text-sm bg-slate-50 border-t border-slate-200">
                                    מציג 50 רשומות ראשונות מתוך {previewData.length}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(2)} disabled={isUploading}>חזור למיפוי</Button>
                            <Button 
                                disabled={isUploading || previewData.length === 0} 
                                onClick={executeBulk}
                            >
                                {isUploading ? 'מבצע פעולה...' : `אשר ביצוע על ${previewData.length} רשומות`}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
