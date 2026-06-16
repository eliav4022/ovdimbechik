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
      className="group block"
    >
      <Card
        className="group relative h-full overflow-hidden border-primary/5 p-4 md:p-6 flex flex-col justify-between shadow-soft hover:shadow-primary/10"
      >
        <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary to-highlight opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div>
          <div className="flex justify-between items-start mb-4 md:mb-6 relative z-20">
            <div className="flex gap-3 md:gap-4 pl-10 md:pl-12">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-bg-light flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner border border-primary/10 flex-shrink-0 overflow-hidden">
                {job.companyLogo ? (
                    <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
                ) : (
                    <Building2 className="w-6 h-6 md:w-8 md:h-8" />
                )}
              </div>
              <div className="text-right">
                <h3 className="font-black text-lg md:text-xl text-text-main group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {job.title}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 mb-2">
                  {job.isUrgent && (
                    <Badge variant="danger" className="animate-pulse shadow-sm text-[10px] md:text-xs py-0.5">
                      <Zap size={10} fill="currentColor" />
                      דחוף 🔥
                    </Badge>
                  )}
                  {job.isImmediate && (
                    <Badge variant="accent" className="shadow-sm text-[10px] md:text-xs py-0.5">
                      <Clock size={10} />
                      מיידי ⚡
                    </Badge>
                  )}
                  {job.isVerified && (
                    <TrustBadge type="verified-job" size="sm" className="shadow-sm" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs md:text-sm text-text-muted font-bold">{job.companyName}</span>
                    {job.category && <Badge variant="neutral" className="text-[10px]">{job.category}</Badge>}
                </div>
              </div>
            </div>
            {user && (
                <div className="absolute top-0 left-0 bg-white/80 backdrop-blur-sm rounded-2xl">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSave}
                        className={cn(
                            "p-2.5 md:p-3 rounded-2xl transition-all duration-300",
                            isSaved ? "text-red-500 bg-red-50 shadow-inner" : "text-text-muted hover:text-red-500 hover:bg-red-50"
                        )}
                    >
                        <Heart className="w-5 h-5 md:w-6 md:h-6" fill={isSaved ? "currentColor" : "none"} />
                    </Button>
                </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-3 mb-3 md:mb-6">
            {job.location && (
              <div className="flex items-center gap-1 md:gap-2 text-text-muted bg-bg-light/50 px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border border-primary/5">
                <MapPin size={12} className="text-primary md:w-4 md:h-4" />
                {job.location}
              </div>
            )}
            <div className="flex items-center gap-1 md:gap-2 text-text-muted bg-bg-light/50 px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border border-primary/5">
              <Clock size={12} className="text-primary md:w-4 md:h-4" />
              {getJobTypeLabel(job.type)}
            </div>
            {job.salary && (
            <div className="flex items-center gap-1 md:gap-2 text-primary-dark bg-primary/10 px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black border border-primary/10">
              <Zap size={12} className="md:w-4 md:h-4" />
              {job.salary}
            </div>
            )}
            {job.workMode && (
              <div className="flex items-center gap-1 md:gap-2 text-text-muted bg-bg-light/50 px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border border-primary/5">
                <Home size={12} className="text-primary md:w-4 md:h-4" />
                {job.workMode}
              </div>
            )}
            {job.experienceLevel && (
              <div className="flex items-center gap-1 md:gap-2 text-text-muted bg-bg-light/50 px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold border border-primary/5">
                <Award size={12} className="text-primary md:w-4 md:h-4" />
                {job.experienceLevel}
              </div>
            )}
          </div>
          
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 md:mb-8">
              {job.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="flex items-center gap-1 text-[10px] text-text-muted bg-slate-100 px-2 py-1 rounded-md mb-2">
                    <Tags size={10} />
                    {tag}
                </span>
              ))}
              {job.tags.length > 3 && (
                <span className="text-[10px] text-text-muted bg-slate-100 px-2 py-1 rounded-md mb-2">
                  +{job.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-5 md:pt-6 border-t border-bg-light">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px] font-bold text-text-muted opacity-70">
              <Eye size={14} />
              <span>{job.views || 0} צפיות</span>
            </div>
            {user?.role === UserRole.ADMIN && (
              <button onClick={handleAdminClick} className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded ml-1 hover:bg-indigo-200">
                <Shield size={10} /> מנהל
              </button>
            )}
            {(user?.role === UserRole.ADMIN || user?.uid === job.employerId) && (
              <button onClick={handleEditClick} className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded hover:bg-slate-200">
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
                    url = `tel:${url.replace(/\\D/g, '')}`;
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
            <div className="flex items-center gap-1 text-xs md:text-sm font-black text-primary group-hover:translate-x-[-8px] transition-all">
              פרטי המשרה
              <ChevronRight size={16} className="rotate-180 md:w-[18px] md:h-[18px]" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
