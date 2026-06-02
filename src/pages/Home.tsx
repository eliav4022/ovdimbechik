import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Job, JobStatus } from '../types';
import { isJobActive } from '../lib/jobUtils';
import { JobCard } from '../components/JobCard';
import { useAuth } from '../lib/AuthContext';
import { Rocket, Star, Heart, TrendingUp, Laptop, Utensils, Shield, ShoppingBag, Truck, Construction, Users, CheckCircle, Zap, Search, Briefcase, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Helmet } from 'react-helmet-async';
import { JobCardSkeleton } from '../components/ui/Loading';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TrustSection } from '../components/ui/TrustBadge';
import { Link, useNavigate } from 'react-router-dom';

const CATEGORIES = [
    { name: 'הייטק', icon: Laptop, color: 'brand' as const },
    { name: 'אבטחה', icon: Shield, color: 'neutral' as const },
    { name: 'אוכל', icon: Utensils, color: 'accent' as const },
    { name: 'אופנה', icon: ShoppingBag, color: 'purple' as const },
    { name: 'הובלות', icon: Truck, color: 'neutral' as const },
    { name: 'בנייה', icon: Construction, color: 'warning' as const },
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobCategoryTab, setJobCategoryTab] = useState<'standard' | 'casual'>('standard');

  useEffect(() => {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('status', 'in', [JobStatus.ACTIVE, 'Published']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      const validJobs = jobsData.filter(job => isJobActive(job));
      setRecentJobs(validJobs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    return () => unsubscribe();
  }, []);

  const displayedJobs = recentJobs
     .filter(job => jobCategoryTab === 'casual' ? job.isCasual === true : !job.isCasual)
     .slice(0, 6);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/jobs?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="pb-20 font-sans" dir="rtl">
      <Helmet>
        <title>עובדים בצ'יק | לוח הדרושים המהיר והחכם בישראל</title>
        <meta name="description" content="מצאו עבודה תוך דקות או גייסו עובדים מוכשרים בצ'יק. לוח הדרושים המתקדם ביותר בישראל המבוסס על בינה מלאכותית." />
      </Helmet>
      
      {/* Dynamic Hero Section */}
      <section className="relative bg-primary-dark pt-16 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-primary rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-highlight rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-1.5 rounded-full text-highlight text-sm font-bold mb-6 border border-white/10"
          >
            <Rocket size={16} />
            פלטפורמת הדרושים המובילה בישראל
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight mb-4 md:mb-6 tracking-tight">
            מצאו את המשרה<br />הבאה שלכם <span className="text-highlight">בצ'יק.</span>
          </h1>
          
          <p className="text-base md:text-xl text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed mb-8 md:mb-10 opacity-90 px-2 lg:px-0">
            הפלטפורמה המודרנית לחיבור ישיר בין כישרון להזדמנות. 
            מהיר יותר, חכם יותר, פשוט יותר.
          </p>

          <div className="max-w-xl mx-auto">
            <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row p-1.5 bg-white sm:rounded-full rounded-2xl shadow-xl gap-2">
              <input 
                type="text" 
                placeholder="מה אתם מחפשים? (תפקיד, תחום...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow bg-transparent px-4 py-3 text-slate-800 font-bold focus:outline-none text-sm text-center sm:text-right"
              />
              <Button type="submit" className="rounded-xl sm:rounded-full w-full sm:w-auto px-6 py-3 font-bold flex items-center justify-center gap-2 text-sm">
                <Search size={18} />
                חפש עבודה
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Category Tabs Section */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
          <Card className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-4 md:p-6 border-white/50">
              <h2 className="text-base md:text-lg font-black text-text-main mb-4 md:mb-6 flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary" />
                  תחומי עיסוק פופולריים
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                  {CATEGORIES.map((cat, i) => (
                      <Link
                        key={i}
                        to={`/jobs?category=${encodeURIComponent(cat.name)}`}
                        className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border group relative overflow-hidden bg-slate-50 border-transparent text-slate-600 hover:border-primary/20 hover:bg-white hover:shadow-md"
                        )}
                      >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-primary shadow-sm transition-transform group-hover:scale-105">
                              <cat.icon size={20} />
                          </div>
                          <span className="font-bold text-xs">{cat.name}</span>
                      </Link>
                  ))}
              </div>
          </Card>
      </section>

      {/* Recent Jobs Content Area */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="text-right">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 border-r-6 border-primary pr-4">
              משרות אחרונות
            </h2>
            <p className="text-slate-500 mt-1 font-bold text-sm md:text-base">הזדמנויות מגיוס ראשון שנוספו בצ'יק</p>
          </div>
          <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl justify-center shadow-inner">
             <button
                className={cn("px-6 py-2.5 rounded-xl font-bold text-sm transition-all", jobCategoryTab === 'standard' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')}
                onClick={() => setJobCategoryTab('standard')}
             >
                 משרות לטווח ארוך
             </button>
             <button
                className={cn("px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2", jobCategoryTab === 'casual' ? 'bg-white text-purple-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50')}
                onClick={() => setJobCategoryTab('casual')}
             >
                 עבודות מזדמנות 🍕
             </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <JobCardSkeleton key={i} />)}
          </div>
        ) : displayedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                isSaved={user?.savedJobs?.includes(job.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center bg-white p-10 rounded-2xl border-2 border-dashed border-slate-200">
             <p className="text-slate-500 font-bold mb-2">לא נמצאו משרות מתאימות בקטגוריה זו כרגע.</p>
          </div>
        )}
        
        <div className="mt-10 text-center">
            <Link to="/jobs">
                <Button size="lg" className="rounded-full px-8 py-3 text-base font-bold shadow-md hover:scale-105 transition-transform">
                    צפו בכל המשרות בלוח
                </Button>
            </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-black text-slate-800 mb-3">איך זה עובד? פשוט בצ'יק!</h2>
                  <p className="text-slate-500 font-bold text-sm md:text-base">הצטרפו לאלפי הישראלים שמגדירים מחדש את הקריירה שלהם</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
                  <div className="hidden md:block absolute top-[40%] left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-primary/20 -translate-y-1/2 z-0" />

                  {[
                      { step: '01', title: 'פרופיל אישי', text: 'מעלים קורות חיים ומגדירים את הציפיות שלכם', icon: Users, color: 'bg-primary' },
                      { step: '02', title: 'איתור משרה', text: 'מחפשים מתוך אלפי משרות חמות', icon: Search, color: 'bg-highlight' },
                      { step: '03', title: 'סגירת עבודה', text: 'מגישים מועמדות וסוגרים חוזה במהירות', icon: Zap, color: 'bg-primary-dark' }
                  ].map((item, i) => (
                      <div key={i} className="relative z-10 bg-white p-6 rounded-3xl border border-slate-100 shadow-lg hover:-translate-y-2 transition-all">
                          <div className={cn("inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white mb-4 shadow-md", item.color)}>
                              <item.icon size={24} />
                          </div>
                          <div className="text-[10px] font-black text-primary uppercase mb-2">שלב {item.step}</div>
                          <h4 className="text-lg font-black text-slate-800 mb-2">{item.title}</h4>
                          <p className="text-slate-500 font-bold text-sm leading-relaxed">{item.text}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      <section className="max-w-7xl mx-auto px-2 md:px-4 pb-12 md:pb-20 mt-8">
          <div className="bg-gradient-to-r from-primary-dark via-primary to-highlight rounded-3xl p-6 sm:p-10 md:p-14 text-center text-white relative overflow-hidden shadow-xl">
              <div className="relative z-10">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 md:mb-4 tracking-tight">המשרה הבאה מחכה לך.</h2>
                  <p className="text-base md:text-xl font-bold opacity-90 mb-6 md:mb-8 max-w-xl mx-auto leading-relaxed">
                      אלפי מעסיקים מחפשים ברגע זה את הכישרון הבא שלהם. הצטרפו עכשיו!
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                      <Link to="/register" className="w-full sm:w-auto bg-white text-primary px-6 md:px-8 py-3 rounded-full font-bold text-sm md:text-base hover:scale-105 transition-transform shadow-md">
                          רישום מחפשי עבודה
                      </Link>
                      <Link to="/employer/dashboard" className="w-full sm:w-auto bg-primary-dark text-white border border-white/20 px-6 md:px-8 py-3 rounded-full font-bold text-sm md:text-base hover:bg-slate-800 transition-colors shadow-md">
                          מרכז מעסיקים
                      </Link>
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
};

export default Home;
