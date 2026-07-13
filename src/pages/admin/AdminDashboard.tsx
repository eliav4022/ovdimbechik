import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { JobType, WorkMode, ExperienceLevel, JobStatus, ApplicationStatus, UserRole, Job, User, Application, Report } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../lib/AuthContext';
import { AdminAudit } from './AdminAudit';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  CircleDollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/Loading';

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [myTasks, setMyTasks] = useState<Report[]>([]);
  const [unassignedEmployersList, setUnassignedEmployersList] = useState<User[]>([]);
  const [pendingJobsList, setPendingJobsList] = useState<Job[]>([]);
  const [adminsList, setAdminsList] = useState<User[]>([]);
  
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showPendingJobsModal, setShowPendingJobsModal] = useState(false);
  const [showUnassignedModal, setShowUnassignedModal] = useState(false);
  const [unassignedEmployers, setUnassignedEmployers] = useState(0);
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  
  const [pendingJobReportsCount, setPendingJobReportsCount] = useState(0);
  const [stats, setStats] = useState({
    usersCount: 0,
    jobsCount: 0,
    applicationsCount: 0,
    revenue: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const unassignedList = usersSnap.docs.map(d => ({ id: d.id, ...d.data()} as User)).filter(data => data.role === UserRole.EMPLOYER && !data.assignedAdminId);
            setUnassignedEmployersList(unassignedList);
            setUnassignedEmployers(unassignedList.length);

            const admins = usersSnap.docs.map(d => ({id: d.id, ...d.data()} as User)).filter(data => data.role === UserRole.ADMIN);
            setAdminsList(admins);
            setStats(prev => ({ ...prev, usersCount: usersSnap.size }));
        } catch (error) {
            console.error("Error fetching users: ", error);
        }

        try {
            const jobsSnap = await getDocs(collection(db, 'jobs'));
            const pendingList = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job)).filter(data => data.status === JobStatus.PENDING_REVIEW);
            setPendingJobsList(pendingList);
            setPendingJobsCount(pendingList.length);
            setStats(prev => ({ ...prev, jobsCount: jobsSnap.size }));
        } catch (error) {
            console.error("Error fetching jobs: ", error);
        }

        try {
            const appsSnap = await getDocs(collection(db, 'applications'));
            setStats(prev => ({ ...prev, applicationsCount: appsSnap.size }));
        } catch (error) {
            console.error("Error fetching applications: ", error);
        }

        try {
            const jobReportsSnap = await getDocs(collection(db, 'jobReports'));
            const pendingReportsList = jobReportsSnap.docs.filter(doc => !doc.data().status || doc.data().status === 'pending');
            setPendingJobReportsCount(pendingReportsList.length);
        } catch (error) {
            console.error("Error fetching jobReports: ", error);
        }

        if (user) {
            try {
                const tasksQ = query(collection(db, 'reports'), where('assigneeId', '==', user.uid), where('isResolved', '==', false));
                const tasksSnap = await getDocs(tasksQ);
                setMyTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
            } catch (error) {
                console.error("Error fetching reports: ", error);
            }
        }

      } catch (error) {
        console.error("Error fetching dashboard data: ", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
        fetchDashboardData();
    }
  }, [toast, user]);

  const handleAssignAdmin = async (employerId: string, adminId: string) => {
      try {
          await writeBatch(db).update(doc(db, 'users', employerId), { assignedAdminId: adminId }).commit();
          const newList = unassignedEmployersList.filter(e => e.id !== employerId);
          setUnassignedEmployersList(newList);
          setUnassignedEmployers(newList.length);
          toast('השיוך בוצע בהצלחה', 'success');
      } catch (err) {
          toast('שגיאה בשיוך מנהל אישי', 'error');
      }
  };

  const handleApproveJob = async (jobId: string) => {
      try {
          await writeBatch(db).update(doc(db, 'jobs', jobId), { status: JobStatus.ACTIVE }).commit();
          const newList = pendingJobsList.filter(j => j.id !== jobId);
          setPendingJobsList(newList);
          setPendingJobsCount(newList.length);
          toast('המשרה אושרה בהצלחה', 'success');
      } catch (err) {
          toast('שגיאה באישור המשרה', 'error');
      }
  };


  const statsData = [
    { label: 'משתמשים רשומים', value: stats.usersCount.toString(), trend: '+5%', isUp: true, icon: Users, color: 'indigo' },
    { label: 'משרות במערכת', value: stats.jobsCount.toString(), trend: '+12%', isUp: true, icon: Briefcase, color: 'emerald' },
    { label: 'מועמדויות', value: stats.applicationsCount.toString(), trend: '+20%', isUp: true, icon: FileText, color: 'amber' },
    { label: 'הכנסות', value: `₪${stats.revenue}`, trend: '+0%', isUp: true, icon: CircleDollarSign, color: 'blue' },
  ];

  const chartData = [
    { name: 'א', jobs: 40, applications: 24 },
    { name: 'ב', jobs: 30, applications: 13 },
    { name: 'ג', jobs: 20, applications: 98 },
    { name: 'ד', jobs: 27, applications: 39 },
    { name: 'ה', jobs: 18, applications: 48 },
    { name: 'ו', jobs: 23, applications: 38 },
    { name: 'ש', jobs: 34, applications: 43 },
  ];

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner size="lg" />
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 font-sans tracking-tight">סקירה כללית</h1>
          <p className="text-slate-500 font-medium">ברוך הבא למרכז הבקרה של עובדים בצ׳יק.</p>
      </div>

      {/* General Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-3 md:p-6 border-none shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform cursor-default">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0`}>
                  <Icon size={20} className="md:w-6 md:h-6" />
                </div>
                <Badge variant={stat.isUp ? 'success' : 'error'} className="rounded-lg px-2 flex items-center gap-1 font-bold text-[10px] w-fit">
                  {stat.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trend}
                </Badge>
              </div>
              <div>
                <p className="text-slate-500 text-xs md:text-sm font-bold mb-1">{stat.label}</p>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 font-mono tracking-tighter">{stat.value}</h3>
              </div>
            </Card>
          );
        })}
      </div>

      <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 font-sans tracking-tight mt-6">פעולות לביצוע</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Tasks Card */}
        <Card onClick={() => setShowTasksModal(true)} className="p-3 md:p-6 border-none shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform cursor-pointer ring-2 ring-transparent hover:ring-indigo-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0`}>
              <CheckCircle2 size={20} className="md:w-6 md:h-6" />
            </div>
            <Badge variant="warning" className="rounded-lg px-2 flex items-center gap-1 font-bold text-[10px] w-fit">
              לביצוע
            </Badge>
          </div>
          <div>
            <p className="text-slate-500 text-xs md:text-sm font-bold mb-1">משימות</p>
            <h3 className="text-xl md:text-3xl font-black text-slate-900 font-mono tracking-tighter">{myTasks.length}</h3>
          </div>
        </Card>

        {/* Pending Job Reports Card */}
        <div onClick={() => navigate('/admin/reports?tab=users')} className="block outline-none">
            <Card className="h-full p-3 md:p-6 border-none shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform cursor-pointer ring-2 ring-transparent hover:ring-red-500 bg-red-50/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shrink-0`}>
                <AlertTriangle size={20} className="md:w-6 md:h-6" />
                </div>
                {pendingJobReportsCount > 0 && (
                     <Badge variant="error" className="rounded-lg px-2 flex items-center gap-1 font-bold text-[10px] w-fit line-clamp-1">
                        דחוף
                     </Badge>
                )}
            </div>
            <div>
                <p className="text-slate-500 text-xs md:text-sm font-bold mb-1">דיווחים</p>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 font-mono tracking-tighter">{pendingJobReportsCount}</h3>
            </div>
            </Card>
        </div>

        {/* Pending Jobs Card */}
        <div onClick={() => setShowPendingJobsModal(true)} className="block outline-none">
            <Card className="h-full p-3 md:p-6 border-none shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform cursor-pointer ring-2 ring-transparent hover:ring-amber-500 bg-amber-50/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0`}>
                <Clock size={20} className="md:w-6 md:h-6" />
                </div>
                {pendingJobsCount > 0 && (
                     <Badge variant="warning" className="rounded-lg px-2 flex items-center gap-1 font-bold text-[10px] w-fit line-clamp-1">
                        טיפול
                     </Badge>
                )}
            </div>
            <div>
                <p className="text-slate-500 text-xs md:text-sm font-bold mb-1">ממתינות</p>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 font-mono tracking-tighter">{pendingJobsCount}</h3>
            </div>
            </Card>
        </div>

        {/* Unassigned Employers Card */}
        <div onClick={() => setShowUnassignedModal(true)} className="block outline-none">
            <Card className="h-full p-3 md:p-6 border-none shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform cursor-pointer ring-2 ring-transparent hover:ring-emerald-500 bg-emerald-50/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0`}>
                <UserPlus size={20} className="md:w-6 md:h-6" />
                </div>
                {unassignedEmployers > 0 && (
                     <Badge variant="error" className="rounded-lg px-2 flex items-center gap-1 font-bold text-[10px] w-fit line-clamp-1">
                        לשיוך
                     </Badge>
                )}
            </div>
            <div>
                <p className="text-slate-500 text-xs md:text-sm font-bold mb-1">יתומים</p>
                <h3 className="text-xl md:text-3xl font-black text-slate-900 font-mono tracking-tighter">{unassignedEmployers}</h3>
            </div>
            </Card>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 gap-6 md:gap-8 mb-8">
        <Card className="p-4 md:p-8 border-none shadow-xl shadow-slate-200/50 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-none">גרף צמיחה שימוש</h3>
              <p className="text-sm text-slate-500 mt-2">מעקב שבועי אחר משרות ומועמדויות</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto">
              <option>7 ימים אחרונים</option>
              <option>30 ימים אחרונים</option>
            </select>
          </div>
          <div className="h-[200px] md:h-[350px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} width={40} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '800' }}
                />
                <Area type="monotone" dataKey="jobs" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorJobs)" />
                <Area type="monotone" dataKey="applications" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mb-12">
        <AdminAudit />
      </div>

      {showTasksModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                      <h2 className="text-xl font-black text-slate-800">משימות בטיפולי</h2>
                      <button onClick={() => setShowTasksModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      {myTasks.length === 0 ? (
                          <div className="text-center text-slate-500 font-medium py-8">אין משימות פתוחות המיועדות לך כרגע.</div>
                      ) : (
                          <div className="space-y-4">
                              {myTasks.map(task => (
                                  <Link to="/admin/reports" key={task.id} className="block p-4 border border-slate-200 rounded-xl hover:border-indigo-500 transition-colors bg-slate-50 cursor-pointer text-right">
                                      <div className="flex items-start justify-between">
                                          <div>
                                              <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold mb-2 inline-block">
                                                  עדיפות: {task.priority}
                                              </span>
                                              <h4 className="font-bold text-slate-800 mb-1">{task.title}</h4>
                                              <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
                                          </div>
                                      </div>
                                  </Link>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {showPendingJobsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock /> משרות ממתינות לאישור</h2>
                      <button onClick={() => setShowPendingJobsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      {pendingJobsList.length === 0 ? (
                          <div className="text-center text-slate-500 font-medium py-8">אין משרות הממתינות לאישור.</div>
                      ) : (
                          <div className="space-y-4">
                              {pendingJobsList.map(job => (
                                  <div key={job.id} className="block p-4 border border-amber-200 rounded-xl bg-amber-50 text-right">
                                      <div className="flex items-start justify-between">
                                          <div>
                                              <h4 className="font-bold text-slate-800 mb-1"><Link to={`/admin/jobs/${job.id}`} className="hover:text-amber-600 hover:underline">{job.title}</Link></h4>
                                              <p className="text-sm text-slate-600 line-clamp-2 mb-2">{job.companyName} - {job.description}</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleApproveJob(job.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-sm shadow flex items-center gap-2">
                                              <CheckCircle2 size={16} /> אשר משרה
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {showUnassignedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><UserPlus /> מעסיקים ללא שיוך</h2>
                      <button onClick={() => setShowUnassignedModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      {unassignedEmployersList.length === 0 ? (
                          <div className="text-center text-slate-500 font-medium py-8">אין מעסיקים יתומים במערכת. כל המעסיקים משויכים!</div>
                      ) : (
                          <div className="space-y-4">
                              {unassignedEmployersList.map(employer => (
                                  <div key={employer.id} className="block p-4 border border-emerald-200 rounded-xl bg-emerald-50 text-right">
                                      <div className="flex items-start justify-between flex-col md:flex-row gap-4">
                                          <div>
                                              <h4 className="font-bold text-slate-800 mb-1"><Link to={`/admin/employers/${employer.id}`} className="hover:text-emerald-600 hover:underline">{employer.companyName || employer.displayName || employer.email}</Link></h4>
                                              <p className="text-sm text-slate-600">{employer.email}</p>
                                          </div>
                                          <div className="min-w-[200px] w-full md:w-auto">
                                                <select 
                                                    className="w-full bg-white border border-emerald-300 rounded-lg p-2 outline-none font-medium text-slate-800 shadow-sm"
                                                    value=""
                                                    onChange={(e) => handleAssignAdmin(employer.id, e.target.value)}
                                                >
                                                    <option value="" disabled>שייך למנהל בחר...</option>
                                                    {adminsList.map(a => (
                                                        <option key={a.id} value={a.id}>{a.displayName || a.fullName || a.email}</option>
                                                    ))}
                                                </select>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

