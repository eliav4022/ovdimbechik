import React from 'react';
import { Search, MapPin, Filter, SlidersHorizontal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { JobType, WorkMode, ExperienceLevel } from '../types';
import { cn } from '../lib/utils';

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  locationFilter: string;
  setLocationFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  workModeFilter: string;
  setWorkModeFilter: (val: string) => void;
  experienceFilter: string;
  setExperienceFilter: (val: string) => void;
  salaryMinFilter: number;
  setSalaryMinFilter: (val: number) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (val: boolean) => void;
  clearFilters: () => void;
  onSearchClick?: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  typeFilter,
  setTypeFilter,
  workModeFilter,
  setWorkModeFilter,
  experienceFilter,
  setExperienceFilter,
  salaryMinFilter,
  setSalaryMinFilter,
  showAdvancedFilters,
  setShowAdvancedFilters,
  clearFilters,
  onSearchClick
}) => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white/10 backdrop-blur-3xl p-3 md:p-4 rounded-[2rem] md:rounded-[3rem] border border-white/20 shadow-2xl">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:gap-4">
          <div className="md:col-span-4 relative group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" size={24} />
            <input
              type="text"
              placeholder="מה המקצוע שלך?"
              className="w-full pr-14 pl-6 py-4 md:py-5 bg-white rounded-2xl md:rounded-3xl border-none focus:ring-4 focus:ring-primary/20 transition-all text-right font-black text-text-main placeholder:text-text-muted/40 shadow-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 relative group">
            <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" size={24} />
            <input
              type="text"
              placeholder="איפה?"
              className="w-full pr-14 pl-6 py-4 md:py-5 bg-white rounded-2xl md:rounded-3xl border-none focus:ring-4 focus:ring-primary/20 transition-all text-right font-black text-text-main placeholder:text-text-muted/40 shadow-xl"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 relative group">
            <Filter className="absolute right-5 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" size={24} />
            <select
              className="w-full pr-14 pl-6 py-4 md:py-5 bg-white rounded-2xl md:rounded-3xl border-none focus:ring-4 focus:ring-primary/20 transition-all text-right font-black text-text-main appearance-none shadow-xl cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">כל סוגי המשרות</option>
              <option value={JobType.FULL_TIME}>משרה מלאה</option>
              <option value={JobType.PART_TIME}>משרה חלקית</option>
              <option value={JobType.CONTRACT}>פרילאנס / פרויקט</option>
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2 md:gap-3">
            <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                    "flex-[1] md:flex-1 rounded-2xl md:rounded-3xl transition-all flex items-center justify-center shadow-xl active:scale-95 border-2 min-h-[56px]",
                    showAdvancedFilters 
                        ? "bg-highlight border-highlight text-primary-dark" 
                        : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                )}
                title="פילטרים"
            >
                <SlidersHorizontal size={24} className="md:w-7 md:h-7" />
            </button>
            <button 
                onClick={onSearchClick}
                className="flex-[4] md:flex-[2] bg-gradient-to-r from-primary to-highlight text-white font-black rounded-2xl md:rounded-3xl py-4 md:py-5 hover:shadow-2xl hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 text-xl tracking-tight min-h-[56px]"
            >
                חיפוש
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="space-y-2 text-right">
              <label className="text-xs font-black text-highlight uppercase pr-2 tracking-widest">מודל עבודה</label>
              <select
                className="w-full px-6 py-4 bg-white/5 text-white rounded-[1.5rem] border-2 border-white/10 focus:border-highlight transition-all text-right font-bold appearance-none cursor-pointer outline-none"
                value={workModeFilter}
                onChange={(e) => setWorkModeFilter(e.target.value)}
              >
                <option value="All" className="text-slate-900">הכל</option>
                <option value={WorkMode.REMOTE} className="text-slate-900">עבודה מהבית</option>
                <option value={WorkMode.HYBRID} className="text-slate-900">היברידי</option>
                <option value={WorkMode.OFFICE} className="text-slate-900">מהמשרד</option>
              </select>
            </div>
            <div className="space-y-2 text-right">
              <label className="text-xs font-black text-highlight uppercase pr-2 tracking-widest">רמת ניסיון</label>
              <select
                className="w-full px-6 py-4 bg-white/5 text-white rounded-[1.5rem] border-2 border-white/10 focus:border-highlight transition-all text-right font-bold appearance-none cursor-pointer outline-none"
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
              >
                <option value="All" className="text-slate-900">הכל</option>
                <option value={ExperienceLevel.NO_EXPERIENCE} className="text-slate-900">ללא ניסיון</option>
                <option value={ExperienceLevel.JUNIOR} className="text-slate-900">ג'וניור</option>
                <option value={ExperienceLevel.MIDDLE} className="text-slate-900">Middle</option>
                <option value={ExperienceLevel.SENIOR} className="text-slate-900">Senior</option>
              </select>
            </div>
            <div className="space-y-2 text-right">
              <label className="text-xs font-black text-highlight uppercase pr-2 tracking-widest">שכר מינימום</label>
              <input
                type="number"
                placeholder="למשל 12,000"
                className="w-full px-6 py-4 bg-white/5 text-white rounded-[1.5rem] border-2 border-white/10 focus:border-highlight transition-all text-right font-bold placeholder:text-white/30 outline-none"
                value={salaryMinFilter || ''}
                onChange={(e) => setSalaryMinFilter(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-2 px-2">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-black transition-all hover:translate-x-1"
              >
                <Trash2 size={20} />
                איפוס נתונים
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-12 justify-center">
        <span className="text-white/40 font-black ml-4 uppercase tracking-[0.2em] text-[10px] mt-2">חיפושים חמים 🔥</span>
        {['הייטק', 'דיגיטל', 'מכירות', 'ניהול', 'סטודנטים'].map(tag => (
          <button
            key={tag}
            onClick={() => setSearchTerm(tag)}
            className="text-white/70 hover:text-white hover:bg-white/10 hover:scale-105 px-6 py-2 rounded-full border border-white/10 transition-all text-sm font-black tracking-tight"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};
