import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc, where, getDocs, writeBatch, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { moveToRecycleBin } from '../../lib/recycleBin';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { User, UserRole } from '../../types';
import { Trash2, ShieldCheck, Mail, Phone, Lock, User as UserIcon } from 'lucide-react';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { softDelete } from '../../lib/adminUtils';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { UserPermissionsEditor } from '../../components/admin/UserPermissionsEditor';
import { logAuditAction } from '../../lib/audit';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [newUser, setNewUser] = useState({
    displayName: '',
    email: '',
    role: UserRole.SEEKER,
    permissions: [] as string[],
    phone: '',
    location: '',
    password: ''
  });

  useEffect(() => {
    // Only fetch non-deleted users for the main view
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as unknown as User))
        .filter(u => !u.deletedAt)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast('שגיאה בטעינת הנתונים: ' + error.message, 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (!newUser.email || !newUser.displayName) {
             toast('נא למלא את כל שדות החובה', 'error');
             return;
          }
          
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(newUser.email)) {
             toast('נא להזין כתובת אימייל תקינה', 'error');
             return;
          }

          let uid = 'usr_' + Date.now();
          
          if (newUser.password) {
              const token = await (await import('../../lib/firebase')).auth.currentUser?.getIdToken();
              const res = await fetch('/api/admin/create-user', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                      email: newUser.email,
                      password: newUser.password,
                      displayName: newUser.displayName,
                      uid: uid
                  })
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error === "Firebase Admin config missing" ? "שגיאה: כדי ליצור משתמשים עם סיסמה, יש להגדיר מפתח FIREBASE_SERVICE_ACCOUNT בהגדרות ה-Secrets" : data.error || 'Failed to create user in Auth');
          } else {
             // Basic duplicate check if not using auth
              const q = query(collection(db, 'users'), where('email', '==', newUser.email));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                  toast('שגיאה: המייל כבר קיים במערכת', 'error');
                  return;
              }
          }
          
          await setDoc(doc(db, 'users', uid), {
              uid,
              email: newUser.email,
              displayName: newUser.displayName,
              fullName: newUser.displayName,
              phone: newUser.phone,
              location: newUser.location,
              role: newUser.role,
              permissions: newUser.permissions,
              isVerified: true,
              createdAt: new Date().toISOString()
          });
          
          await logAuditAction('יצירת רשומה', 'משתמשים', 'updated', 'משתמש חדש התווסף בהצלחה');
          toast('משתמש חדש התווסף בהצלחה', 'success');
          setIsAddModalOpen(false);
          setNewUser({ displayName: '', email: '', role: UserRole.SEEKER, permissions: [], phone: '', location: '', password: '' });
      } catch (error: any) {
          console.error("Error adding user:", error);
          toast(error.message || 'שגיאה בהוספת משתמש', 'error');
      }
  };

  const handleDelete = (u: User) => {
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (reason: string) => {
    if (!userToDelete || !currentUser) return;
    
    try {
      const uid = (userToDelete as any).id || userToDelete.uid;
      const role = userToDelete.role;

      const batches = [];
      let currentBatch = writeBatch(db);
      let count = 0;
      let relatedData: any[] = [];

      const addToBatch = (ref: any, data: any, collectionName: string) => {
          if (count >= 499) {
              batches.push(currentBatch);
              currentBatch = writeBatch(db);
              count = 0;
          }
          relatedData.push({ collection: collectionName, id: ref.id, data });
          currentBatch.delete(ref);
          count++;
      };

      if (role === UserRole.EMPLOYER) {
          const jobsQuery = query(collection(db, 'jobs'), where('employerId', '==', uid));
          const jobsSnap = await getDocs(jobsQuery);
          
          for (const jobDoc of jobsSnap.docs) {
              addToBatch(jobDoc.ref, jobDoc.data(), 'jobs');
              
              const appsQuery = query(collection(db, 'applications'), where('jobId', '==', jobDoc.id));
              const appsSnap = await getDocs(appsQuery);
              appsSnap.forEach(appDoc => addToBatch(appDoc.ref, appDoc.data(), 'applications'));
          }
      } 
      else {
          const appsQuery = query(collection(db, 'applications'), where('seekerId', '==', uid));
          const appsSnap = await getDocs(appsQuery);
          appsSnap.forEach(appDoc => addToBatch(appDoc.ref, appDoc.data(), 'applications'));
      }

      await moveToRecycleBin('users', uid, { ...userToDelete, deleteReason: reason }, relatedData, currentUser.uid);

      currentBatch.delete(doc(db, 'users', uid));
      batches.push(currentBatch);

      for (const b of batches) {
          await b.commit();
      }

      await logAuditAction('עריכת רשומה', 'משתמשים', 'updated', 'המשתמש הועבר לסל המיחזור בהצלחה!');
          toast('המשתמש הועבר לסל המיחזור בהצלחה!', 'success');
    } catch (error) {
      console.error("Delete failed:", error);
      toast('שגיאה במחיקת המשתמש', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleEditOpen = (user: User) => {
      setUserToEdit({ ...user, permissions: user.permissions || [] });
      setNewPasswordForUser('');
      setIsEditModalOpen(true);
  };

  const handlePasswordReset = async () => {
      if (!userToEdit || !newPasswordForUser || newPasswordForUser.length < 6) {
          toast('חובה להזין סיסמה של 6 תווים לפחות', 'error');
          return;
      }
      setIsUpdatingPassword(true);
      try {
          const token = await (await import('../../lib/firebase')).auth.currentUser?.getIdToken();
          const res = await fetch('/api/admin/update-user-password', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  targetUid: (userToEdit as any).id || userToEdit.uid,
                  newPassword: newPasswordForUser
              })
          });
          const data = await res.json();
          if (data.success) {
              await logAuditAction('עריכת רשומה', 'משתמשים', 'updated', 'הסיסמה עודכנה בהצלחה');
          toast('הסיסמה עודכנה בהצלחה', 'success');
              setNewPasswordForUser('');
          } else {
              const errMsg = data.error === "Firebase Admin config missing" ? "יש להגדיר FIREBASE_SERVICE_ACCOUNT בהגדרות כדי לעדכן סיסמה" : data.error;
              toast(errMsg || 'שגיאה בעדכון הסיסמה', 'error');
          }
      } catch (err: any) {
           toast('שגיאה בתקשורת עם השרת', 'error');
      } finally {
          setIsUpdatingPassword(false);
      }
  };

  const handleClone = (user: User) => {

      setNewUser({
          displayName: user.displayName ? user.displayName + ' (עותק)' : '',
          email: user.email ? 'copy_' + user.email : '',
          role: user.role || UserRole.SEEKER,
          permissions: user.permissions || [],
          phone: user.phone || '',
          location: (user as any).location || '',
          password: ''
      });
      setIsAddModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userToEdit) return;
      try {
          if (!userToEdit.email || !userToEdit.displayName) {
             toast('נא למלא את כל שדות החובה', 'error');
             return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(userToEdit.email)) {
             toast('נא להזין כתובת אימייל תקינה', 'error');
             return;
          }

          const id = (userToEdit as any).id || userToEdit.uid;
          
          const q = query(collection(db, 'users'), where('email', '==', userToEdit.email));
          const querySnapshot = await getDocs(q);
          const duplicate = querySnapshot.docs.find(d => d.id !== id);
          if (duplicate) {
              toast('שגיאה: המייל כבר קיים במערכת עבור משתמש אחר', 'error');
              return;
          }

          await setDoc(doc(db, 'users', id), {
              displayName: userToEdit.displayName,
              email: userToEdit.email,
              phone: userToEdit.phone || null,
              location: (userToEdit as any).location || null,
              role: userToEdit.role,
              permissions: userToEdit.permissions || [],
              photoURL: userToEdit.photoURL || null,
              updatedAt: new Date().toISOString()
          }, { merge: true });
          
          try {
              const token = await (await import('../../lib/firebase')).auth.currentUser?.getIdToken();
              await fetch('/api/admin/update-user-email', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                      targetUid: id,
                      newEmail: userToEdit.email
                  })
              });
          } catch (err) {
               console.error("Failed to update email in Auth", err);
          }

          await logAuditAction('עריכת רשומה', 'משתמשים', 'updated', 'המשתמש עודכן בהצלחה');
          toast('המשתמש עודכן בהצלחה', 'success');
          setIsEditModalOpen(false);
          setUserToEdit(null);
      } catch (error) {
          console.error("Error updating user:", error);
          toast('שגיאה בעדכון המשתמש', 'error');
      }
  };

  const handleStatusChange = async (user: User, status: string) => {
      try {
          await setDoc(doc(db, 'users', (user as any).id || user.uid), {
              status,
              updatedAt: new Date().toISOString()
          }, { merge: true });
          
          toast(`סטטוס משתמש שונה ל-${status}`, 'success');
      } catch (error) {
          console.error("Error updating status:", error);
          toast('שגיאה בעדכון הסטטוס', 'error');
      }
  };

  const togglePermission = (permId: string, currentPerms: string[], role: string, isEdit: boolean) => {
      // kept for other usages if any
  };

  const renderPermissionsSelector = (currentRole: string, permissions: string[], isEdit: boolean) => {
      return (
          <UserPermissionsEditor 
              currentRole={currentRole as UserRole} 
              permissions={permissions} 
              onChange={(perms) => {
                  if (isEdit && userToEdit) {
                      setUserToEdit({ ...userToEdit, permissions: perms });
                  } else {
                      setNewUser({ ...newUser, permissions: perms });
                  }
              }} 
          />
      );
  };

  const columns = [
    { 
      key: 'displayName', 
      header: 'שם מלא',
      render: (u: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black relative overflow-hidden">
             {u.photoURL ? (
                <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
             ) : (
                u.displayName ? u.displayName[0] : '?'
             )}
          </div>
          <div>
            <p className="font-black text-slate-900 leading-tight">{u.displayName || 'ללא שם'}</p>
            <p className="text-[11px] text-slate-500 font-medium">{u.email || ''}</p>
            {(u.phone || u.location) && (
              <p className="text-[10px] text-slate-400 font-medium">
                  {u.phone && <span>{u.phone}</span>}
                  {u.phone && u.location && <span className="mx-1">•</span>}
                  {u.location && <span>{u.location}</span>}
              </p>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      header: 'תפקיד',
      render: (u: any) => (
        <select
          value={u.role}
          onChange={async (e) => {
            try {
              const newRole = e.target.value;
              await setDoc(doc(db, 'users', u.id || u.uid), { role: newRole }, { merge: true });
              await logAuditAction('עריכת רשומה', 'משתמשים', 'updated', 'התפקיד עודכן בהצלחה');
          toast('התפקיד עודכן בהצלחה', 'success');
            } catch (error) {
              console.error("Error updating role:", error);
              toast('שגיאה בעדכון התפקיד', 'error');
            }
          }}
          className="text-[12px] font-black tracking-wider border border-slate-200 text-slate-600 rounded-md bg-transparent focus:ring-primary focus:border-primary px-2 py-1 cursor-pointer min-w-[100px]"
          onClick={(e) => e.stopPropagation()}
        >
          <option value={UserRole.SEEKER}>SEEKER (מחפש עבודה)</option>
          <option value={UserRole.EMPLOYER}>EMPLOYER (מעסיק)</option>
          <option value={UserRole.SUPPORT_AGENT}>SUPPORT AGENT (אייגנט)</option>
          <option value={UserRole.ADMIN}>ADMIN (מנהל)</option>
          <option value={UserRole.SUPER_ADMIN}>SUPER ADMIN (מנהל על)</option>
        </select>
      )
    },
    {
      key: 'status',
      header: 'סטטוס',
      render: (u: any) => {
        const variants: any = {
          active: 'success',
          pending_verification: 'warning',
          suspended: 'error',
          rejected: 'error'
        };
        const labels: any = {
          active: 'פעיל',
          pending_verification: 'ממתין לאימות',
          suspended: 'מושעה',
          rejected: 'נדחה'
        };
        return (
          <Badge variant={variants[u.status] || 'default'} className="font-bold text-[10px]">
            {labels[u.status] || u.status}
          </Badge>
        );
      }
    },
    { 
      key: 'createdAt', 
      header: 'תאריך הצטרפות',
      render: (u: any) => <span className="text-xs text-slate-500 font-mono">{new Date(u.createdAt).toLocaleDateString('he-IL')}</span>
    },
    { 
      key: 'lastLogin', 
      header: 'התחברות אחרונה',
      render: (u: any) => <span className="text-xs text-slate-500 font-mono">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('he-IL') : 'לא ידוע'}</span>
    },
    {
      key: 'contact',
      header: 'פרטי קשר',
      render: (u: any) => (
        <div className="flex items-center gap-2">
          {u.phone && <span title={u.phone}><Phone size={14} className="text-slate-400" /></span>}
          {u.email && <span title={u.email}><Mail size={14} className="text-slate-400" /></span>}
        </div>
      )
    }
  ];

  return (
    <>
      <AdminTable 
        title="ניהול משתמשים"
        description="צפייה, עריכה וניהול הרשאות לכלל המשתמשים במערכת."
        data={users}
        columns={columns}
        searchFields={['displayName', 'email']}
        onAdd={() => setIsAddModalOpen(true)}
        onEdit={handleEditOpen}
        onClone={handleClone}
        onDelete={handleDelete}
        onView={(u: any) => navigate(`/admin/users/${u.id || u.uid}`)}
        onStatusChange={handleStatusChange}
        onExport={() => console.log('Exporting Users...')}
        bulkActions={[
          { label: 'חסימת נבחרים', action: (items) => alert(`חוסם ${items.length} משתמשים`), icon: Trash2 },
          { label: 'אימות נבחרים', action: (items) => alert(`מאמת ${items.length} משתמשים`), icon: ShieldCheck },
        ]}
        filters={[
          { 
            key: 'role', 
            label: 'סינון תפקיד', 
            options: [
              { label: 'מחפש עבודה', value: UserRole.SEEKER },
              { label: 'מעסיק', value: UserRole.EMPLOYER },
              { label: 'אדמין', value: UserRole.ADMIN },
            ] 
          },
          {
            key: 'status',
            label: 'סינון סטטוס',
            options: [
              { label: 'פעיל', value: 'active' },
              { label: 'מושעה', value: 'suspended' },
              { label: 'ממתין לאימות', value: 'pending_verification' },
            ]
          }
        ]}
      />

      {userToDelete && (
        <TwoStepConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="מחיקת משתמש לצמיתות (מחיקה רכה)"
          message={`האם אתה בטוח שברצונך למחוק את ${userToDelete.displayName}? המשתמש לא יוכל להתחבר יותר, אך הנתונים יישמרו בארכיון לצורכי ביקורת.`}
          confirmWord="מחק"
        />
      )}

      <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="הוספת משתמש חדש"
      >
          <form onSubmit={handleAdd} className="space-y-6">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">שם מלא</label>
                  <Input 
                      required
                      placeholder="למשל: יוקו אונו..." 
                      value={newUser.displayName}
                      onChange={(e) => setNewUser(prev => ({...prev, displayName: e.target.value}))}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">אימייל</label>
                  <Input 
                      type="email"
                      required
                      placeholder="yoko@example.com" 
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({...prev, email: e.target.value}))}
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                      <Input 
                          placeholder="למשל: 050-1234567" 
                          value={newUser.phone || ''}
                          onChange={(e) => setNewUser(prev => ({...prev, phone: e.target.value}))}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">מיקום</label>
                      <Input 
                          placeholder="תל אביב..." 
                          value={newUser.location || ''}
                          onChange={(e) => setNewUser(prev => ({...prev, location: e.target.value}))}
                      />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">תפקיד</label>
                  <select 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({...prev, role: e.target.value as UserRole}))}
                  >
                      <option value={UserRole.SEEKER}>מחפש עבודה (עובד)</option>
                      <option value={UserRole.EMPLOYER}>מעסיק (מעביד)</option>
                      <option value={UserRole.SUPPORT_AGENT}>נציג תמיכה / אייגנט (Agent)</option>
                      <option value={UserRole.ADMIN}>מנהל מערכת (Admin)</option>
                      <option value={UserRole.SUPER_ADMIN}>סופר אדמין (Super Admin)</option>
                  </select>
              </div>
              
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">סיסמה (אופציונלי - ליצירת משתמש אמיתי)</label>
                  <Input 
                      type="password"
                      placeholder="סיסמה (לפחות 6 תווים)" 
                      value={newUser.password || ''}
                      onChange={(e) => setNewUser(prev => ({...prev, password: e.target.value}))}
                  />
                  <p className="text-xs text-slate-500 mt-1">אם תוזן סיסמה, המשתמש יוכל להתחבר למערכת מיד.</p>
              </div>

              {renderPermissionsSelector(newUser.role, newUser.permissions, false)}

              <div className="flex justify-end gap-3 pt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>ביטול</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור משתמש</Button>
              </div>
          </form>
      </Modal>

      <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="עריכת פרטי משתמש"
      >
          {userToEdit && (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="flex gap-4 items-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative">
                          {userToEdit.photoURL ? (
                              <img src={userToEdit.photoURL} alt={userToEdit.displayName} className="w-full h-full object-cover" />
                          ) : (
                              <UserIcon className="text-slate-300" size={32} />
                          )}
                      </div>
                      <div className="flex-1">
                          <label className="block text-sm font-bold text-slate-700 mb-2">תמונת פרופיל / לוגו</label>
                          <input 
                              type="file"
                              accept="image/*"
                              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                              onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                      const fileExt = file.name.split('.').pop();
                                      const storageRef = ref(storage, `cvs/admin_${Date.now()}.${fileExt}`);
                                      const fileBytes = new Uint8Array(await file.arrayBuffer());
                                      await uploadBytes(storageRef, fileBytes, { contentType: file.type });
                                      const url = window.location.origin + '/file/' + storageRef.fullPath;
                                      
                                      // Save to files collection
                                      const userName = userToEdit.displayName || userToEdit.fullName || 'משתמש_ללא_שם';
                                      const cleanName = (userToEdit.companyName || userName).replace(/\s+/g, '_');
                                      const formattedDate = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');
                                      await addDoc(collection(db, 'files'), {
                                          name: `לוגו-${cleanName}-${formattedDate}.${fileExt}`,
                                          url,
                                          type: file.type,
                                          size: file.size,
                                          createdAt: serverTimestamp(),
                                          uploadedBy: currentUser?.uid
                                      });
                                      
                                      setUserToEdit({ ...userToEdit, photoURL: url });
                                      await logAuditAction('יצירת רשומה', 'משתמשים', 'updated', 'התמונה הועלתה בהצלחה נוסף לניהול קבצים (אל תשכחו לשמור)');
          toast('התמונה הועלתה בהצלחה נוסף לניהול קבצים (אל תשכחו לשמור)', 'success');
                                  } catch (error) {
                                      console.error('Error uploading image:', error);
                                      toast('שגיאה בהעלאת התמונה', 'error');
                                  }
                              }}
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">שם חדש</label>
                      <Input 
                          required
                          value={userToEdit.displayName}
                          onChange={(e) => setUserToEdit({ ...userToEdit, displayName: e.target.value })}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">אימייל</label>
                      <Input 
                          type="email"
                          required
                          value={userToEdit.email}
                          onChange={(e) => setUserToEdit({ ...userToEdit, email: e.target.value })}
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                          <Input 
                              value={userToEdit.phone || ''}
                              onChange={(e) => setUserToEdit({ ...userToEdit, phone: e.target.value })}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">מיקום</label>
                          <Input 
                              value={(userToEdit as any).location || ''}
                              onChange={(e) => setUserToEdit({ ...userToEdit, location: e.target.value } as any)}
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">תפקיד</label>
                      <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                          value={userToEdit.role}
                          onChange={(e) => setUserToEdit({ ...userToEdit, role: e.target.value as UserRole })}
                      >
                          <option value={UserRole.SEEKER}>מחפש עבודה (עובד)</option>
                          <option value={UserRole.EMPLOYER}>מעסיק (מעביד)</option>
                          <option value={UserRole.SUPPORT_AGENT}>נציג תמיכה / אייגנט (Agent)</option>
                          <option value={UserRole.ADMIN}>מנהל מערכת (Admin)</option>
                          <option value={UserRole.SUPER_ADMIN}>סופר אדמין (Super Admin)</option>
                      </select>
                  </div>

                  {renderPermissionsSelector(userToEdit.role, userToEdit.permissions || [], true)}

                  <div className="pt-4 border-t border-slate-200 mt-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">איפוס סיסמה למשתמש</label>
                      <div className="flex gap-2">
                          <Input 
                              type="text"
                              placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                              value={newPasswordForUser}
                              onChange={(e) => setNewPasswordForUser(e.target.value)}
                              className="flex-1"
                          />
                          <Button 
                              type="button" 
                              onClick={handlePasswordReset}
                              disabled={isUpdatingPassword || newPasswordForUser.length < 6}
                              className="bg-slate-800 hover:bg-slate-900 text-white shrink-0"
                          >
                              {isUpdatingPassword ? 'מעדכן...' : 'עדכן סיסמה'}
                          </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">שינוי סיסמה למשתמשי טסטים / קליינטים בלי גישה למייל</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-6">
                      <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>ביטול</Button>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">שמור שינויים</Button>
                  </div>
              </form>
          )}
      </Modal>
    </>
  );
};
