import { doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { updateDoc, deleteDoc } from './firestore-audit';;
import { db } from './firebase';
import { UserRole } from '../types';
import { moveToRecycleBin } from './recycleBin';

export interface SoftDeleteParams {
  collectionName: string;
  id: string;
  deletedBy: string;
  reason: string;
}

/**
 * Moves document to recycle bin and deletes it from original collection
 */
export const softDelete = async ({ collectionName, id, deletedBy, reason }: SoftDeleteParams) => {
  const docRef = doc(db, collectionName, id);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
      await moveToRecycleBin(collectionName, id, { ...snap.data(), deleteReason: reason }, [], deletedBy);
      await deleteDoc(docRef);
  }
};

/**
 * Restores a soft-deleted document.
 */
export const restoreDocument = async (collectionName: string, id: string, restoredBy: string) => {
  const docRef = doc(db, collectionName, id);
  
  await updateDoc(docRef, {
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    restoredAt: serverTimestamp(),
    restoredBy,
    status: 'active'
  });
};

/**
 * Checks if a user has sufficient admin permissions.
 */
export const hasAdminPermission = (userRole: UserRole, requiredRole: UserRole = UserRole.ADMIN) => {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 100,
    [UserRole.ADMIN]: 80,
    [UserRole.FINANCE_MANAGER]: 60,
    [UserRole.CONTENT_MANAGER]: 50,
    [UserRole.SUPPORT_AGENT]: 40,
    [UserRole.EMPLOYER]: 10,
    [UserRole.SEEKER]: 0,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
};
