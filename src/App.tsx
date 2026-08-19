import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AIAssistant } from './components/AIAssistant';
import { AccessibilityMenu } from './components/AccessibilityMenu';
import { CookieConsent } from './components/CookieConsent';
import { PopupsManager } from './components/PopupsManager';
import { SEOHelmet } from './components/SEOHelmet';
import { LoadingSpinner, FullPageLoading } from './components/ui/Loading';
import { UserRole } from './types';
import { Phone, Facebook, Mail, Send as TelegramIcon } from 'lucide-react';

// Lazy load pages
const Home = React.lazy(() => import('./pages/Home'));
const Jobs = React.lazy(() => import('./pages/Jobs'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const AuthAction = React.lazy(() => import('./pages/AuthAction'));
const JobDetails = React.lazy(() => import('./pages/JobDetails'));
const SeekerDashboard = React.lazy(() => import('./pages/SeekerDashboard'));
const EmployerDashboard = React.lazy(() => import('./pages/EmployerDashboard'));
const JobPost = React.lazy(() => import('./pages/JobPost'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Terms = React.lazy(() => import('./pages/Legal').then(m => ({ default: m.Terms })));
const Privacy = React.lazy(() => import('./pages/Legal').then(m => ({ default: m.Privacy })));
const Security = React.lazy(() => import('./pages/Legal').then(m => ({ default: m.Security })));
const AccessibilityStatement = React.lazy(() => import('./pages/AccessibilityStatement').then(m => ({ default: m.AccessibilityStatement })));
const EmployerLanding = React.lazy(() => import('./pages/EmployerLanding').then(m => ({ default: m.EmployerLanding })));
const WhatsappJobs = React.lazy(() => import('./pages/WhatsappJobs').then(m => ({ default: m.WhatsappJobs })));
const QuickInfo = React.lazy(() => import('./pages/QuickInfo').then(m => ({ default: m.QuickInfo })));
const CvGuide = React.lazy(() => import('./pages/guides/CvGuide').then(m => ({ default: m.CvGuide })));
const SalaryGuide = React.lazy(() => import('./pages/guides/SalaryGuide').then(m => ({ default: m.SalaryGuide })));
const InterviewGuide = React.lazy(() => import('./pages/guides/InterviewGuide').then(m => ({ default: m.InterviewGuide })));
const RightsGuide = React.lazy(() => import('./pages/guides/RightsGuide').then(m => ({ default: m.RightsGuide })));
const RemoteWorkGuide = React.lazy(() => import('./pages/guides/RemoteWorkGuide').then(m => ({ default: m.RemoteWorkGuide })));
const JobPostGuide = React.lazy(() => import('./pages/guides/JobPostGuide').then(m => ({ default: m.JobPostGuide })));
const WhatsappFiringGuide = React.lazy(() => import('./pages/guides/WhatsappFiringGuide').then(m => ({ default: m.WhatsappFiringGuide })));
const CvMistakesGuide = React.lazy(() => import('./pages/guides/CvMistakesGuide').then(m => ({ default: m.CvMistakesGuide })));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Admin Pages
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminUserDetail = React.lazy(() => import('./pages/admin/AdminUserDetail').then(m => ({ default: m.AdminUserDetail })));
const AdminJobs = React.lazy(() => import('./pages/admin/AdminJobs').then(m => ({ default: m.AdminJobs })));
const AdminJobDetail = React.lazy(() => import('./pages/admin/AdminJobDetail').then(m => ({ default: m.AdminJobDetail })));
const AdminTaskDetail = React.lazy(() => import('./pages/admin/AdminTaskDetail').then(m => ({ default: m.AdminTaskDetail })));
const AdminSeekers = React.lazy(() => import('./pages/admin/AdminSeekers').then(m => ({ default: m.AdminSeekers })));
const AdminEmployers = React.lazy(() => import('./pages/admin/AdminEmployers').then(m => ({ default: m.AdminEmployers })));
const AdminEmployerDetail = React.lazy(() => import('./pages/admin/AdminEmployerDetail').then(m => ({ default: m.AdminEmployerDetail })));
const AdminCompanies = React.lazy(() => import('./pages/admin/AdminCompanies').then(m => ({ default: m.AdminCompanies })));
const AdminCompanyDetail = React.lazy(() => import('./pages/admin/AdminCompanyDetail').then(m => ({ default: m.AdminCompanyDetail })));
const AdminApplications = React.lazy(() => import('./pages/admin/AdminApplications').then(m => ({ default: m.AdminApplications })));
const AdminPayments = React.lazy(() => import('./pages/admin/AdminPayments').then(m => ({ default: m.AdminPayments })));
const AdminContacts = React.lazy(() => import('./pages/admin/AdminContacts').then(m => ({ default: m.AdminContacts })));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminAudit = React.lazy(() => import('./pages/admin/AdminAudit').then(m => ({ default: m.AdminAudit })));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminPopups = React.lazy(() => import('./pages/admin/AdminPopups').then(m => ({ default: m.AdminPopups })));
const AdminTags = React.lazy(() => import('./pages/admin/AdminTags').then(m => ({ default: m.AdminTags })));
const AdminFiles = React.lazy(() => import('./pages/admin/AdminFiles').then(m => ({ default: m.AdminFiles })));
const AdminFileDetail = React.lazy(() => import('./pages/admin/AdminFileDetail').then(m => ({ default: m.AdminFileDetail })));

import { ToastProvider, useToast } from './context/ToastContext';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ErrorBoundary } from './components/ErrorBoundary';
import Breadcrumbs from './components/Breadcrumbs';
import { PagesProvider } from './context/PagesContext';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      toast('אין לך הרשאה לגשת לעמוד זה', 'error');
    }
  }, [user, loading, allowedRoles, toast]);

  if (loading) return <FullPageLoading />;
  if (!user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

import { trackEvent, updateTrackedEvent } from './lib/analytics';

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Only track actual pages, ignore admin backend. Wait for auth to load.
    if (!isAdminRoute && !loading) {
      trackEvent({ 
        type: 'page_view', 
        metadata: { 
          path: location.pathname,
          role: user?.role || 'guest'
        } 
      });
      
      const currentRole = user?.role || 'guest';

      // Log site visit once per session, but upgrade the role if user logs in
      if (!sessionStorage.getItem('has_tracked_visit')) {
        sessionStorage.setItem('has_tracked_visit', 'true');
        sessionStorage.setItem('tracked_visit_role', currentRole);
        
        trackEvent({ 
          type: 'site_visit', 
          metadata: { 
            path: location.pathname,
            role: currentRole
          } 
        }).then(docId => {
          if (docId) sessionStorage.setItem('site_visit_doc_id', docId);
        });
      } else {
        // Visit was already tracked this session. Check if role upgraded from guest to user.
        const trackedRole = sessionStorage.getItem('tracked_visit_role');
        const visitDocId = sessionStorage.getItem('site_visit_doc_id');
        
        if (trackedRole === 'guest' && currentRole !== 'guest' && visitDocId) {
            // User just logged in during this session! Update the existing site_visit event.
            sessionStorage.setItem('tracked_visit_role', currentRole);
            updateTrackedEvent(visitDocId, { role: currentRole });
        }
      }
    }
  }, [location.pathname, user, loading, isAdminRoute]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-brand-teal selection:text-white" dir="rtl">
      <SEOHelmet />
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && location.pathname !== '/jobs' && <Breadcrumbs />}
      {!isAdminRoute && <AIAssistant />}
      <AccessibilityMenu />
      <CookieConsent />
      <PopupsManager />
      <main className="flex-grow flex flex-col">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="טוען עמוד..." />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/action" element={<AuthAction />} />
              <Route path="/job/:id" element={<JobDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/security" element={<Security />} />
              <Route path="/accessibility" element={<AccessibilityStatement />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/employers-landing" element={<EmployerLanding />} />
              <Route path="/whatsapp-jobs" element={<WhatsappJobs />} />
              <Route path="/quick-info" element={<QuickInfo />} />
              <Route path="/guides/cv-writing" element={<CvGuide />} />
              <Route path="/guides/salary-ranges" element={<SalaryGuide />} />
              <Route path="/guides/interview-prep" element={<InterviewGuide />} />
              <Route path="/guides/employee-rights" element={<RightsGuide />} />
              <Route path="/guides/remote-work" element={<RemoteWorkGuide />} />
              <Route path="/guides/job-post-tips" element={<JobPostGuide />} />
              <Route path="/guides/whatsapp-firing" element={<WhatsappFiringGuide />} />
              <Route path="/guides/cv-mistakes" element={<CvMistakesGuide />} />
              <Route path="/whatsapp" element={<Navigate to="/whatsapp-jobs" replace />} />
              
              {/* Seeker Routes */}
              <Route path="/seeker" element={<Navigate to="/seeker/dashboard" replace />} />
              <Route
                path="/seeker/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.SEEKER]}>
                    <SeekerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Employer/Admin Routes */}
              <Route path="/employer" element={<Navigate to="/employer/dashboard" replace />} />
              <Route
                path="/employer/*"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYER]}>
                    <Routes>
                      <Route path="dashboard" element={<EmployerDashboard />} />
                      <Route path="post-job" element={<JobPost />} />
                      <Route path="edit-job/:id" element={<JobPost />} />
                      <Route path="jobs/:id" element={<AdminJobDetail />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="jobs" element={<AdminJobs key="jobs" />} />
                <Route path="jobs/:id" element={<AdminJobDetail />} />
                <Route path="jobs-casual" element={<AdminJobs key="jobs-casual" isCasual={true} />} />
                <Route path="jobs-casual/:id" element={<AdminJobDetail />} />
                <Route path="tasks/:id" element={<AdminTaskDetail />} />
                <Route path="seekers" element={<AdminSeekers />} />
                <Route path="employers" element={<AdminEmployers />} />
                <Route path="employers/:id" element={<AdminEmployerDetail />} />
                <Route path="companies" element={<AdminCompanies />} />
                <Route path="companies/:id" element={<AdminCompanyDetail />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="contacts" element={<AdminContacts />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="popups" element={<AdminPopups />} />
                <Route path="tags" element={<AdminTags />} />
                <Route path="files" element={<AdminFiles />} />
                <Route path="files/:id" element={<AdminFileDetail />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <AuthProvider>
          <PagesProvider>
            <Router>
              <AppContent />
            </Router>
          </PagesProvider>
        </AuthProvider>
      </ToastProvider>
    </HelmetProvider>
  );
}

// trigger deploy
