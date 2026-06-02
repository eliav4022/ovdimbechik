import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../types';

export interface SoftDeleteParams {
  collectionName: string;
  id: string;
  deletedBy: string;
  reason: string;
}

/**
 * Performs a soft delete by setting deletedAt, deletedBy, and deleteReason fields.
 * Security rules must be configured to allow this update but block access to documents with deletedAt.
 */
export const softDelete = async ({ collectionName, id, deletedBy, reason }: SoftDeleteParams) => {
  const docRef = doc(db, collectionName, id);
  
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
    deletedBy,
    deleteReason: reason,
    status: 'deleted' // Optional: update status for easier filtering
  });
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
