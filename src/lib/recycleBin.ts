import { doc, setDoc, deleteDoc, getDoc, collection, serverTimestamp, writeBatch, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface RecycledRecord {
  id?: string; 
  originalCollection: string;
  originalId: string;
  deletedAt: any;
  deletedBy: string;
  data: any;
  relatedData: Array<{ collection: string; id: string; data: any }>;
}

export const moveToRecycleBin = async (
  originalCollection: string,
  originalId: string,
  data: any,
  relatedData: Array<{ collection: string; id: string; data: any }>,
  deletedBy: string
) => {
  const recycleId = `${originalCollection}_${originalId}`;
  
  const record: Partial<RecycledRecord> = {
    originalCollection,
    originalId,
    deletedAt: serverTimestamp(),
    deletedBy,
    data,
    relatedData
  };

  await setDoc(doc(db, 'recycle_bin', recycleId), record);
};

export const restoreFromRecycleBin = async (recycleId: string) => {
  const recSnap = await getDoc(doc(db, 'recycle_bin', recycleId));
  if (!recSnap.exists()) throw new Error("Record not found in recycle bin");
  
  const record = recSnap.data() as RecycledRecord;
  const batch = writeBatch(db);
  
  // Restore original
  if (record.data) {
    batch.set(doc(db, record.originalCollection, record.originalId), record.data);
  }
  
  // Restore related
  if (record.relatedData) {
    record.relatedData.forEach(rel => {
      batch.set(doc(db, rel.collection, rel.id), rel.data);
    });
  }
  
  // Delete from recycle bin
  batch.delete(doc(db, 'recycle_bin', recycleId));
  
  await batch.commit();
};
