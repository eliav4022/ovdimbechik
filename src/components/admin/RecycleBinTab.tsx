import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Trash2, RefreshCcw, AlertTriangle, Eye } from 'lucide-react';
import { restoreFromRecycleBin, RecycledRecord } from '../../lib/recycleBin';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/Modal';

export const RecycleBinTab = () => {
    const [records, setRecords] = useState<RecycledRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [viewRecord, setViewRecord] = useState<RecycledRecord | null>(null);
    const { toast } = useToast();

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'recycle_bin'), orderBy('deletedAt', 'desc'));
            const snap = await getDocs(q);
            
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
            
            const validRecords: RecycledRecord[] = [];
            const toDelete: string[] = [];
            
            snap.docs.forEach(d => {
                const data = d.data();
                const deletedAt = data.deletedAt?.toDate ? data.deletedAt.toDate() : new Date();
                
                if (deletedAt < tenDaysAgo) {
                    toDelete.push(d.id);
                } else {
                    validRecords.push({ id: d.id, ...data } as RecycledRecord);
                }
            });
            
            setRecords(validRecords);
            
            // Cleanup old records
            if (toDelete.length > 0) {
                // In background, don't wait
                Promise.all(toDelete.map(id => deleteDoc(doc(db, 'recycle_bin', id)))).catch(console.error);
            }
            
        } catch (error) {
            console.error("Failed to load recycle bin", error);
            toast('שגיאה בטעינת סל המחזור', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleRestore = async (record: RecycledRecord) => {
        if (!record.id) return;
        setRestoring(record.id);
        try {
            await restoreFromRecycleBin(record.id);
            toast('שוחזר בהצלחה', 'success');
            setRecords(prev => prev.filter(r => r.id !== record.id));
            if (viewRecord?.id === record.id) setViewRecord(null);
        } catch (error) {
            console.error("Restore failed", error);
            toast('שגיאה בשחזור', 'error');
        } finally {
            setRestoring(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">טוען נתונים...</div>;
    }

    return (
        <Card className="p-8 shadow-xl shadow-slate-200/40 border-none rounded-2xl relative overflow-hidden bg-white mt-8">
            <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                <Trash2 size={24} className="text-rose-500" />
                סל מחזור
            </h3>
            <p className="text-slate-500 mb-8 border-b pb-6 text-sm flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                רשומות הנמצאות כאן יישמרו למשך 10 ימים מיום מחיקתן לפני שיימחקו לצמיתות. בעת שחזור יעודכנו גם הרשומות המקושרות.
            </p>

            {records.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <Trash2 size={48} className="mx-auto mb-4 opacity-20" />
                    <p>סל המחזור ריק.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {records.map(record => (
                        <div key={record.id} className="border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                            <div>
                                <div className="font-bold text-slate-800 uppercase tracking-widest text-xs mb-1 opacity-70">
                                    {record.originalCollection}
                                </div>
                                <div className="text-slate-700 font-medium">
                                    {record.data?.displayName || record.data?.title || record.data?.name || record.originalId}
                                </div>
                                {record.deletedAt && (
                                    <div className="text-[11px] text-slate-400 mt-1">
                                        נמחק בתאריך: {record.deletedAt.toDate ? record.deletedAt.toDate().toLocaleString('he-IL') : 'לא ידוע'}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewRecord(record)}
                                >
                                    <Eye size={16} className="ml-2" /> צפייה
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleRestore(record)}
                                    disabled={restoring === record.id}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <RefreshCcw size={16} className={restoring === record.id ? "animate-spin ml-2" : "ml-2"} />
                                    שחזר
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="צפייה ברשומה מחוקה">
                {viewRecord && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl text-sm overflow-auto max-h-96" dir="ltr">
                            <pre>{JSON.stringify(viewRecord.data, null, 2)}</pre>
                        </div>
                        {viewRecord.relatedData?.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                                <h4 className="font-bold text-slate-700 mb-2">רשומות מקושרות:</h4>
                                <div className="bg-slate-50 p-4 rounded-xl text-xs overflow-auto max-h-64" dir="ltr">
                                    <pre>{JSON.stringify(viewRecord.relatedData.map(r => ({ collection: r.collection, id: r.id })), null, 2)}</pre>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <Button variant="ghost" onClick={() => setViewRecord(null)}>סגור</Button>
                            <Button 
                                variant="primary" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={restoring === viewRecord.id}
                                onClick={() => handleRestore(viewRecord)}
                            >
                                <RefreshCcw size={16} className={restoring === viewRecord.id ? "animate-spin ml-2" : "ml-2"} />
                                שחזר רשומה
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
};
