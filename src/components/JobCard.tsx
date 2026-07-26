import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Building2, ChevronRight, Heart, ShieldCheck, Zap, Home, Award, Eye, Trash2, Tags, Shield, Pencil, Phone, Mail, ExternalLink } from 'lucide-react';
import { TrustBadge } from './ui/TrustBadge';
import { Job, JobType, WorkMode, ExperienceLevel, UserRole } from '../types';
import { cn } from '../lib/utils';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
}

const getJobTypeLabel = (type: JobType) => {
    switch (type) {
        case JobType.FULL_TIME: return 'משרה מלאה';
        case JobType.PART_TIME: return 'משרה חלקית';
        case JobType.CONTRACT: return 'פרילאנס / קבלן';
        case JobType.FREELANCE: return 'פרויקט זמני';
        case JobType.INTERNSHIP: return 'התמחות';
        case JobType.SHIFTS: return 'משמרות';
        default: return type;
    }
};

export const JobCard: React.FC<JobCardProps> = ({ job, isSaved = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
        navigate('/login');
        return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        savedJobs: isSaved ? arrayRemove(job.id) : arrayUnion(job.id)
      });
    } catch (error) {
      console.error("Error toggling saved job:", error);
    }
  };

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/admin/jobs/${job.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/employer/edit-job/${job.id}`);
  };

  return (
    <Link
      to={`/job/${job.id}`}
      className="group block h-full"
    >
      <div
        className="group relative h-full flex flex-col justify-between bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-primary to-highlight opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
        <div className="flex flex-col h-full z-10 relative">
          <div className="flex justify-between items-start mb-4 md:mb-5">
            <div className="flex gap-4 md:gap-5 pl-10">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-primary shadow-sm border border-slate-100 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                {job.companyLogo ? (
                    <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
                ) : (
                    <Building2 className="w-7 h-7 md:w-8 md:h-8 opacity-70" />
                )}
              </div>
              <div className="text-right pt-0.5">
                <h3 className="font-black text-lg md:text-xl text-slate-800 group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {job.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm md:text-base text-slate-500 font-medium">{job.companyName}</span>
                    {job.category && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md">
                            <span className="text-[10px] md:text-xs text-slate-600 font-bold">{job.category}</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 mb-2">
                  {job.isUrgent && (
                    <Badge variant="danger" className="animate-pulse shadow-sm text-[10px] md:text-xs py-0.5 rounded-lg">
                      <Zap size={10} fill="currentColor" className="ml-1" />
                      דחוף 🔥
                    </Badge>
                  )}
                  {job.isImmediate && (
                    <Badge variant="accent" className="shadow-sm text-[10px] md:text-xs py-0.5 rounded-lg">
                      <Clock size={10} className="ml-1" />
                      מיידי ⚡
                    </Badge>
                  )}
                  {job.isVerified && (
                    <TrustBadge type="verified-job" size="sm" className="shadow-sm rounded-lg" />
                  )}
                </div>
              </div>
            </div>
            {user && (
                <div className="absolute top-0 left-0">
                    <button
                        onClick={toggleSave}
                        className={cn(
                            "p-2.5 rounded-full transition-all duration-300 flex items-center justify-center",
                            isSaved ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        )}
                    >
                        <Heart className="w-5 h-5 md:w-5 md:h-5" fill={isSaved ? "currentColor" : "none"} />
                    </button>
                </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4 md:mb-6 mt-auto">
            {job.location && (
              <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-medium border border-slate-100/50">
                <MapPin size={14} className="text-primary/70" />
                {job.location}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-medium border border-slate-100/50">
              <Clock size={14} className="text-primary/70" />
              {getJobTypeLabel(job.type)}
            </div>
            {job.salary && (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold border border-emerald-100/50">
              <Zap size={14} className="text-emerald-500" />
              {job.salary}
            </div>
            )}
            {job.workMode && (
              <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-medium border border-slate-100/50">
                <Home size={14} className="text-primary/70" />
                {job.workMode}
              </div>
            )}
            {job.experienceLevel && (
              <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-medium border border-slate-100/50">
                <Award size={14} className="text-primary/70" />
                {job.experienceLevel}
              </div>
            )}
          </div>
             
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {job.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="text-[10px] md:text-xs text-slate-500 font-medium bg-white border border-slate-200 px-3 py-1 rounded-full">
                    {tag}
                </span>
              ))}
              {job.tags.length > 3 && (
                <span className="text-[10px] md:text-xs text-slate-500 font-medium bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                  +{job.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto bg-slate-50/50 -mx-5 -mb-5 px-5 pb-5 md:-mx-6 md:-mb-6 md:px-6 md:pb-6 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px] font-bold text-slate-400">
              <Eye size={14} />
              <span>{job.views || 0} צפיות</span>
            </div>
            {user?.role === UserRole.ADMIN && (
              <button onClick={handleAdminClick} className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded ml-1 hover:bg-indigo-200">
                <Shield size={10} /> מנהל
              </button>
            )}
            {(user?.role === UserRole.ADMIN || user?.uid === job.employerId) && (
              <button onClick={handleEditClick} className="flex items-center gap-1 text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded hover:bg-slate-300">
                <Pencil size={10} /> ערוך
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(job?.isCasual && job.directContact) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  let url = job.directContact!;
                  if (url.includes('http') || url.includes('wa.me')) {
                    url = url.startsWith('http') ? url : `https://${url}`;
                  } else if (url.includes('@')) {
                    url = `mailto:${url}`;
                  } else {
                    url = `tel:${url.replace(/\D/g, '')}`;
                  }
                  window.open(url, '_blank', 'noreferrer');
                }}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-black transition-colors"
                title="צור קשר ישירות"
              >
                {job.directContact.includes('wa.me') || job.directContact.includes('whatsapp') ? (
                    <>
                        <Phone size={14} /> לוואטסאפ
                    </>
                ) : (!job.directContact.includes('http') && !job.directContact.includes('@') && /[0-9]{3}/.test(job.directContact)) ? (
                    <>
                        <Phone size={14} /> חייג
                    </>
                ) : job.directContact.includes('@') ? (
                    <>
                        <Mail size={14} /> דוא"ל
                    </>
                ) : (
                    <>
                        <ExternalLink size={14} /> קשר ישיר
                    </>
                )}
              </button>
            )}
            <div className="flex items-center gap-1 text-xs md:text-sm font-black text-primary group-hover:-translate-x-2 transition-all">
              פרטי המשרה
              <ChevronRight size={16} className="rotate-180 md:w-[18px] md:h-[18px]" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
