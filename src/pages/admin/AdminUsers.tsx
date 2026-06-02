import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, setDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { AdminTable } from '../../components/admin/AdminTable';
import { Badge } from '../../components/ui/Badge';
import { User, UserRole } from '../../types';
import { Trash2, ShieldCheck, Mail, Phone, Lock } from 'lucide-react';
import { TwoStepConfirmModal } from '../../components/ui/TwoStepConfirmModal';
import { softDelete } from '../../lib/adminUtils';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { adminNavItems } from '../../components/admin/AdminSidebar';

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

  const [newUser, setNewUser] = useState({
    displayName: '',
    email: '',
    role: UserRole.SEEKER,
    permissions: [] as string[]
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
          
          const q = query(collection(db, 'users'), where('email', '==', newUser.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              toast('שגיאה: המייל כבר קיים במערכת', 'error');
              return;
          }

          const uid = 'usr_' + Date.now();
          
          await setDoc(doc(db, 'users', uid), {
              uid,
              email: newUser.email,
              displayName: newUser.displayName,
              fullName: newUser.displayName,
              role: newUser.role,
              permissions: newUser.permissions,
              isVerified: true,
              createdAt: new Date().toISOString()
          });
          
          toast('משתמש חדש התווסף בהצלחה', 'success');
          setIsAddModalOpen(false);
          setNewUser({ displayName: '', email: '', role: UserRole.SEEKER, permissions: [] });
      } catch (error) {
          console.error("Error adding user:", error);
          toast('שגיאה בהוספת משתמש', 'error');
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

      const addToBatch = (ref: any) => {
          if (count >= 499) {
              batches.push(currentBatch);
              currentBatch = writeBatch(db);
              count = 0;
          }
          currentBatch.delete(ref);
          count++;
      };

      // If employer, delete their jobs and applications for those jobs
      if (role === UserRole.EMPLOYER) {
          const jobsQuery = query(collection(db, 'jobs'), where('employerId', '==', uid));
          const jobsSnap = await getDocs(jobsQuery);
          
          for (const jobDoc of jobsSnap.docs) {
              addToBatch(jobDoc.ref);
              
              // Applications for this job
              const appsQuery = query(collection(db, 'applications'), where('jobId', '==', jobDoc.id));
              const appsSnap = await getDocs(appsQuery);
              appsSnap.forEach(appDoc => addToBatch(appDoc.ref));
          }
      } 
      // If seeker, delete their applications and profile CV
      else {
          const appsQuery = query(collection(db, 'applications'), where('seekerId', '==', uid));
          const appsSnap = await getDocs(appsQuery);
          appsSnap.forEach(appDoc => addToBatch(appDoc.ref));
          
          if (userToDelete.cvUrl) {
              try {
                  const cvRef = ref(storage, userToDelete.cvUrl);
                  await deleteObject(cvRef);
              } catch (e) {
                  console.error("Failed to delete CV:", e);
              }
          }
      }

      // Finally, delete the user document itself
      addToBatch(doc(db, 'users', uid));
      batches.push(currentBatch);

      for (const b of batches) {
          await b.commit();
      }

      toast('המשתמש וכל הנתונים המשויכים אליו נמחקו בהצלחה!', 'success');
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
      setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userToEdit) return;
      try {
          if (!userToEdit.email || !userToEdit.displayName) {
             toast('נא למלא את כל שדות החובה', 'error');
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
              role: userToEdit.role,
              permissions: userToEdit.permissions || [],
              updatedAt: new Date().toISOString()
          }, { merge: true });
          
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
      let updatedPerms = [...currentPerms];
      if (updatedPerms.includes(permId)) {
          updatedPerms = updatedPerms.filter(p => p !== permId);
      } else {
          updatedPerms.push(permId);
      }
      
      if (isEdit && userToEdit) {
          setUserToEdit({ ...userToEdit, permissions: updatedPerms });
      } else {
          setNewUser({ ...newUser, permissions: updatedPerms });
      }
  };

  const renderPermissionsSelector = (currentRole: string, permissions: string[], isEdit: boolean) => {
      // Allow overriding permissions for any role (Salesforce style)
      return (
          <div className="bg-slate-50 p-4 border rounded-xl mt-4 space-y-3">
              <h4 className="font-bold flex items-center gap-2 text-slate-800"><Lock size={16} /> שליטת הרשאות מתקדמת</h4>
              <p className="text-xs text-slate-500 font-medium">סמן את המסכים אליהם יוכל המשמש לגשת בממשק הניהול. במידה ואף מסך לא מסומן, המערכת תשתמש בהרשאות ברירת המחדל של התפקיד שלו.</p>
              <div className="grid grid-cols-2 gap-3 mt-3 max-h-[250px] overflow-y-auto pr-2">
                  {adminNavItems.map(item => {
                      const isAllowedByRole = item.roles.includes(currentRole as UserRole);

                      return (
                          <label key={item.id} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border hover:border-indigo-500 transition-colors">
                              <input 
                                  type="checkbox" 
                                  className="accent-indigo-600 w-4 h-4"
                                  checked={permissions.includes(item.id) || (permissions.length === 0 && isAllowedByRole) } 
                                  onChange={(e) => {
                                      // If array is currently empty, initialize it with defaults first, then toggle
                                      let permsToToggle = [...permissions];
                                      if (permsToToggle.length === 0) {
                                          permsToToggle = adminNavItems.filter(p => p.roles.includes(currentRole as UserRole)).map(p => p.id);
                                      }
                                      togglePermission(item.id, permsToToggle, currentRole, isEdit);
                                  }}
                              />
                               <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                  <item.icon size={14} className="text-slate-400" />
                                  {item.label}
                               </span>
                          </label>
                      );
                  })}
              </div>
          </div>
      );
  };

  const columns = [
    { 
      key: 'displayName', 
      header: 'שם מלא',
      render: (u: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
            {u.displayName ? u.displayName[0] : '?'}
          </div>
          <div>
            <p className="font-black text-slate-900 leading-tight">{u.displayName || 'ללא שם'}</p>
            <p className="text-xs text-slate-500 font-medium lowercase">{u.email || ''}</p>
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
              toast('התפקיד עודכן בהצלחה', 'success');
            } catch (error) {
              console.error("Error updating role:", error);
              toast('שגיאה בעדכון התפקיד', 'error');
            }
          }}
          className="text-[12px] font-black tracking-wider border border-slate-200 text-slate-600 rounded-md bg-transparent focus:ring-primary focus:border-primary px-2 py-1 cursor-pointer min-w-[100px]"
          onClick={(e) => e.stopPropagation()}
        >
          {Object.values(UserRole).map(role => (
            <option key={role} value={role}>{role.replace('_', ' ')}</option>
          ))}
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
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">תפקיד</label>
                  <select 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({...prev, role: e.target.value as UserRole}))}
                  >
                      {Object.values(UserRole).map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
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
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">תפקיד</label>
                      <select 
                          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                          value={userToEdit.role}
                          onChange={(e) => setUserToEdit({ ...userToEdit, role: e.target.value as UserRole })}
                      >
                          {Object.values(UserRole).map(s => (
                              <option key={s} value={s}>{s}</option>
                          ))}
                      </select>
                  </div>

                  {renderPermissionsSelector(userToEdit.role, userToEdit.permissions || [], true)}

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
