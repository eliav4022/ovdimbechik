import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { useToast } from '../../context/ToastContext';
import { 
  X, 
  Search, 
  UserX, 
  UserCheck, 
  FileText, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface OrphanedSeekersModalProps {
  isOpen: boolean;
  onClose: () => void;
  seekers: User[];
  adminsList: User[];
  onSeekerUpdated?: (updatedSeeker: User) => void;
}

export const OrphanedSeekersModal: React.FC<OrphanedSeekersModalProps> = ({
  isOpen,
  onClose,
  seekers,
  adminsList,
  onSeekerUpdated,
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'no_cv' | 'unassigned' | 'incomplete' | 'unverified'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Compute orphan status and metadata for seekers
  const analyzedSeekers = useMemo(() => {
    return seekers.map(s => {
      const hasCv = Boolean(s.cvUrl || s.seekerProfile?.cvUrl);
      const isAssigned = Boolean(s.assignedAdminId);
      const isVerified = Boolean(s.isVerified);
      const hasCompleteProfile = Boolean((s.jobTitle || s.seekerProfile?.jobTitle) && (s.phone || s.location));
      
      const reasons: string[] = [];
      if (!isAssigned) reasons.push('unassigned');
      if (!hasCv) reasons.push('no_cv');
      if (!hasCompleteProfile) reasons.push('incomplete');
      if (!isVerified) reasons.push('unverified');

      const isOrphaned = reasons.length > 0;

      return {
        ...s,
        hasCv,
        isAssigned,
        isVerified,
        hasCompleteProfile,
        reasons,
        isOrphaned
      };
    }).filter(s => s.isOrphaned);
  }, [seekers]);

  const counts = useMemo(() => {
    return {
      all: analyzedSeekers.length,
      no_cv: analyzedSeekers.filter(s => !s.hasCv).length,
      unassigned: analyzedSeekers.filter(s => !s.isAssigned).length,
      incomplete: analyzedSeekers.filter(s => !s.hasCompleteProfile).length,
      unverified: analyzedSeekers.filter(s => !s.isVerified).length,
    };
  }, [analyzedSeekers]);

  const filteredSeekers = useMemo(() => {
    return analyzedSeekers.filter(seeker => {
      // Filter by active tab
      if (activeFilter === 'no_cv' && seeker.hasCv) return false;
      if (activeFilter === 'unassigned' && seeker.isAssigned) return false;
      if (activeFilter === 'incomplete' && seeker.hasCompleteProfile) return false;
      if (activeFilter === 'unverified' && seeker.isVerified) return false;

      // Filter by search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const name = (seeker.displayName || seeker.fullName || '').toLowerCase();
        const email = (seeker.email || '').toLowerCase();
        const phone = (seeker.phone || '').toLowerCase();
        const title = (seeker.jobTitle || seeker.seekerProfile?.jobTitle || '').toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query) || title.includes(query);
      }

      return true;
    });
  }, [analyzedSeekers, activeFilter, searchTerm]);

  const handleAssignAdmin = async (seekerId: string, adminId: string) => {
    setUpdatingId(seekerId);
    try {
      await updateDoc(doc(db, 'users', seekerId), { assignedAdminId: adminId });
      toast('המגייס/מנהל שויך למועסק בהצלחה', 'success');
      if (onSeekerUpdated) {
        const current = seekers.find(s => s.id === seekerId);
        if (current) onSeekerUpdated({ ...current, assignedAdminId: adminId });
      }
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast('שגיאה בשיוך מנהל', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleVerify = async (seekerId: string, currentStatus: boolean) => {
    setUpdatingId(seekerId);
    try {
      await updateDoc(doc(db, 'users', seekerId), { isVerified: !currentStatus });
      toast(!currentStatus ? 'המועסק אומת בהצלחה' : 'אימות המועסק בוטל', 'success');
      if (onSeekerUpdated) {
        const current = seekers.find(s => s.id === seekerId);
        if (current) onSeekerUpdated({ ...current, isVerified: !currentStatus });
      }
    } catch (error) {
      console.error('Error verifying seeker:', error);
      toast('שגיאה בעדכון סטטוס אימות', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 shadow-sm">
              <UserX size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">מועסקים יתומים</h2>
                <Badge variant="neutral" className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full text-xs">
                  {counts.all} דורשים טיפול
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                מחפשי עבודה הדורשים השלמת פרטים, העלאת קו״ח, שיוך למנהל או אימות
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-5 border-b border-slate-100 space-y-4 bg-white">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="חיפוש לפי שם מועסק, דוא״ל, טלפון או מקצוע..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              הכל ({counts.all})
            </button>
            <button
              onClick={() => setActiveFilter('no_cv')}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === 'no_cv'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <FileText size={14} />
              ללא קורות חיים ({counts.no_cv})
            </button>
            <button
              onClick={() => setActiveFilter('unassigned')}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === 'unassigned'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <UserPlus size={14} />
              ללא מנהל משויך ({counts.unassigned})
            </button>
            <button
              onClick={() => setActiveFilter('incomplete')}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === 'incomplete'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <AlertCircle size={14} />
              פרופיל חלקי ({counts.incomplete})
            </button>
            <button
              onClick={() => setActiveFilter('unverified')}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === 'unverified'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <ShieldAlert size={14} />
              לא מאומתים ({counts.unverified})
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
          {filteredSeekers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">אין מועסקים יתומים בחתך זה!</h3>
              <p className="text-xs text-slate-500 mt-1">כל מחפשי העבודה מעודכנים, משויכים ומוכנים לפעילות.</p>
            </div>
          ) : (
            filteredSeekers.map((seeker) => {
              const assignedAdmin = adminsList.find(a => a.id === seeker.assignedAdminId);
              const jobTitle = seeker.jobTitle || seeker.seekerProfile?.jobTitle;

              return (
                <div 
                  key={seeker.id} 
                  className="pt-3.5 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                      {(seeker.displayName || seeker.fullName || seeker.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link 
                          to={`/admin/users/${seeker.id}`}
                          onClick={onClose}
                          className="font-bold text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1.5 text-base"
                        >
                          {seeker.displayName || seeker.fullName || 'ללא שם'}
                          <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                        </Link>
                        {seeker.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <ShieldCheck size={12} /> מאומת
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <ShieldAlert size={12} /> לא מאומת
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Mail size={12} className="text-slate-400" />
                          <a href={`mailto:${seeker.email}`} className="hover:text-indigo-600">{seeker.email}</a>
                        </span>
                        {seeker.phone && (
                          <span className="flex items-center gap-1 font-medium">
                            <Phone size={12} className="text-slate-400" />
                            <a href={`tel:${seeker.phone}`} className="hover:text-indigo-600" dir="ltr">{seeker.phone}</a>
                          </span>
                        )}
                        {jobTitle && (
                          <span className="flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            <Briefcase size={12} className="text-slate-400" />
                            {jobTitle}
                          </span>
                        )}
                      </div>

                      {/* Reasons Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {!seeker.hasCv && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <FileText size={12} /> חסר קו״ח
                          </span>
                        )}
                        {!seeker.isAssigned && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <UserPlus size={12} /> ללא שיוך מנהל
                          </span>
                        )}
                        {!seeker.hasCompleteProfile && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <AlertCircle size={12} /> פרופיל חלקי
                          </span>
                        )}
                        {assignedAdmin && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700">
                            מנהל: {assignedAdmin.displayName || assignedAdmin.fullName || assignedAdmin.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2 shrink-0 justify-end">
                    {/* Assign Admin Select */}
                    <div className="w-full sm:w-auto min-w-[170px]">
                      <select
                        disabled={updatingId === seeker.id}
                        value={seeker.assignedAdminId || ''}
                        onChange={(e) => handleAssignAdmin(seeker.id, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-all"
                      >
                        <option value="">שייך מנהל/מגייס...</option>
                        {adminsList.map(admin => (
                          <option key={admin.id} value={admin.id}>
                            {admin.displayName || admin.fullName || admin.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Verify Toggle */}
                    <button
                      disabled={updatingId === seeker.id}
                      onClick={() => handleToggleVerify(seeker.id, seeker.isVerified)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        seeker.isVerified 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title={seeker.isVerified ? 'בטל אימות' : 'אמת מועסק'}
                    >
                      <ShieldCheck size={14} />
                      {seeker.isVerified ? 'בטל אימות' : 'אמת מועסק'}
                    </button>

                    {/* Go to Record */}
                    <Link
                      to={`/admin/users/${seeker.id}`}
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1 transition-all"
                    >
                      צפה ברשומה
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>מציג {filteredSeekers.length} מתוך {analyzedSeekers.length} מועסקים יתומים</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
