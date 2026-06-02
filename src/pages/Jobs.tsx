import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Job, JobStatus } from '../types';
import { isJobActive } from '../lib/jobUtils';
import { JobCard } from '../components/JobCard';
import { SearchFilters } from '../components/SearchFilters';
import { useAuth } from '../lib/AuthContext';
import { Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { EmptyState } from '../components/ui/EmptyState';
import { JobCardSkeleton } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { trackEvent } from '../lib/analytics';
import { cn } from '../lib/utils';
import { useLocation } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';

const Jobs: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Parse initial query params
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const updatedSearch = queryParams.get('company') || queryParams.get('q') || '';
    setSearchTerm(updatedSearch);
  }, [location.search]);
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [workModeFilter, setWorkModeFilter] = useState<string>('All');
  const [experienceFilter, setExperienceFilter] = useState<string>('All');
  const [salaryMinFilter, setSalaryMinFilter] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const initialTab = new URLSearchParams(location.search).get('tab') === 'casual' ? 'casual' : 'standard';
  const [jobCategoryTab, setJobCategoryTab] = useState<'standard' | 'casual'>(initialTab);
  
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'casual' || tab === 'standard') {
      setJobCategoryTab(tab);
    }
  }, [location.search]);

  const [sortBy, setSortBy] = useState<'newest' | 'salary' | 'views'>('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('status', 'in', [JobStatus.ACTIVE, 'Published']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    return () => unsubscribe();
  }, []);

  const filteredAndSortedJobs = jobs
    .filter(job => {
        const isCurrentlyValid = isJobActive(job);

        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (job.category && job.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (job.tags && job.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
        const matchesLocation = locationFilter === '' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
        const matchesType = typeFilter === 'All' || job.type === typeFilter;
        const matchesWorkMode = workModeFilter === 'All' || job.workMode === workModeFilter;
        const matchesExperience = experienceFilter === 'All' || job.experienceLevel === experienceFilter;
        
        const getSalaryVal = (s: string) => {
            if (!s) return 0;
            const parts = s.split('-');
            const minPart = parts[0] || '';
            const min = parseInt(minPart.replace(/[^0-9]/g, '')) || 0;
            if (s.includes('שעתית')) {
                // Approximate monthly for hourly, assuming 180 hours/month to normalize against expected monthly searches, or just use the number.
                // It's safer to just return min directly but usually users search by monthly. 
                // We'll multiply by 186 for normalization if we want to compare with a monthly filter, but the filter is primitive, so just return min.
                return min;
            }
            return min;
        };
        const matchesSalary = salaryMinFilter === 0 || getSalaryVal(job.salary || '') >= salaryMinFilter;

        const matchesCategory = !selectedCategory || (job.category && job.category.includes(selectedCategory));
        const matchesJobCategoryTab = jobCategoryTab === 'casual' ? job.isCasual === true : !job.isCasual;
        
        return isCurrentlyValid && matchesSearch && matchesLocation && matchesType && matchesWorkMode && matchesExperience && matchesSalary && matchesCategory && matchesJobCategoryTab;
    })
    .sort((a, b) => {
        if (sortBy === 'salary') {
            const getVal = (s: string) => parseInt(s.replace(/[^0-9]/g, '')) || 0;
            return getVal(b.salary) - getVal(a.salary);
        }
        if (sortBy === 'views') {
            return (b.views || 0) - (a.views || 0);
        }
        return 0; // Default is newest from Firebase
    });

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('All');
    setWorkModeFilter('All');
    setExperienceFilter('All');
    setSalaryMinFilter(0);
    setSelectedCategory(null);
  };

  const handleSearchClick = () => {
    trackEvent({
        type: 'search',
        metadata: {
            searchTerm,
            location: locationFilter
        }
    });
  };

  return (
    <div className="pb-20 font-sans bg-slate-50 min-h-screen" dir="rtl">
      <Helmet>
        <title>חיפוש עבודה | עובדים בצ'יק</title>
        <meta name="description" content="לוח הדרושים המהיר בישראל. חפשו מתוך אלפי משרות חמות." />
      </Helmet>

      <section className="bg-primary-dark pb-32">
        <Breadcrumbs theme="dark" />
        <div className="max-w-7xl mx-auto px-4 text-center mt-6">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 md:mb-6 tracking-tight">
            מצאו את המשרה הבאה שלכם
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            אלפי משרות פנויות מכל התחומים מחכות לכם. השתמשו במסננים כדי למצוא בדיוק מה שאתם מחפשים.
          </p>
          
          <div className="max-w-4xl mx-auto">
            <SearchFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                workModeFilter={workModeFilter}
                setWorkModeFilter={setWorkModeFilter}
                experienceFilter={experienceFilter}
                setExperienceFilter={setExperienceFilter}
                salaryMinFilter={salaryMinFilter}
                setSalaryMinFilter={setSalaryMinFilter}
                showAdvancedFilters={showAdvancedFilters}
                setShowAdvancedFilters={setShowAdvancedFilters}
                clearFilters={clearFilters}
                onSearchClick={handleSearchClick}
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-grow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-50 pb-4">
              <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-full md:w-auto shadow-inner">
                 <button
                    className={cn("flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all", jobCategoryTab === 'standard' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')}
                    onClick={() => {
                        setJobCategoryTab('standard');
                        window.history.replaceState(null, '', '/jobs?tab=standard');
                    }}
                 >
                     משרות לטווח ארוך
                 </button>
                 <button
                    className={cn("flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2", jobCategoryTab === 'casual' ? 'bg-white text-purple-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')}
                    onClick={() => {
                        setJobCategoryTab('casual');
                        window.history.replaceState(null, '', '/jobs?tab=casual');
                    }}
                 >
                     עבודות מזדמנות 🍕
                 </button>
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-900 border-r-4 border-primary pr-3 flex items-center justify-between">
              <span>{loading ? 'טוען משרות...' : `${filteredAndSortedJobs.length} משרות נמצאו`}</span>
              <div className="flex gap-2">
                {(['newest', 'salary', 'views'] as const).map((view) => (
                    <Button 
                        key={view}
                        variant={sortBy === view ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setSortBy(view)}
                        className={cn(
                            "px-4 py-1.5 rounded-xl text-xs",
                            sortBy === view ? "" : "text-slate-400"
                        )}
                    >
                        {view === 'newest' ? 'הכל' : view === 'salary' ? 'שכר' : 'פופולרי'}
                    </Button>
                ))}
            </div>
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <JobCardSkeleton key={i} />)}
          </div>
        ) : filteredAndSortedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAndSortedJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                isSaved={user?.savedJobs?.includes(job.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            title="לא מצאנו משרות מתאימות..." 
            description="נסו לשנות את התגיות או את אזור החיפוש."
            icon={Search}
            action={{
              label: "הצגת כל המשרות",
              onClick: clearFilters
            }}
          />
        )}
      </section>
    </div>
  );
};

export default Jobs;
