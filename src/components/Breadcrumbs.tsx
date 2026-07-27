import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';

interface BreadcrumbsProps {
    theme?: 'light' | 'dark';
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ theme = 'light' }) => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);

    if (pathnames.length === 0) return null;

    const routeNames: { [key: string]: string } = {
        'job': 'משרה',
        'employer': 'מעסיק',
        'seeker': 'מחפש עבודה',
        'dashboard': 'לוח בקרה',
        'post': 'פרסום משרה',
        'about': 'אודות',
        'contact': 'צור קשר',
        'faq': 'שאלות ותשובות',
        'terms': 'תנאי שימוש',
        'privacy': 'מדיניות פרטיות',
        'security': 'אבטחת מידע',
        'admin': 'ניהול',
        'employers-landing': 'גיוס עובדים',
        'whatsapp-jobs': 'דרושים בוואטסאפ',
        'quick-info': 'מידע בצ\'יק',
        'guides': 'מדריכים',
        'cv-writing': 'כתיבת קורות חיים',
        'salary-ranges': 'טווחי שכר נפוצים',
        'interview-prep': 'הכנה לראיון',
        'employee-rights': 'זכויות עובדים',
        'remote-work': 'עבודה מרחוק',
        'job-post-tips': 'כתיבת מודעת דרושים',
        'whatsapp-firing': 'פיטורים בוואטסאפ',
        'cv-mistakes': 'טעויות בקורות חיים'
    };

    return (
        <nav className="max-w-7xl mx-auto px-4 py-4" dir="rtl">
            <ol className={`flex items-center justify-center gap-2 text-xs font-black ${theme === 'dark' ? 'text-white/60' : 'text-slate-400'}`}>
                <li>
                    <Link to="/" className={`flex items-center gap-1 transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-brand-teal'}`}>
                        <Home size={14} />
                        <span>ראשי</span>
                    </Link>
                </li>
                {(() => {
                    const crumbs = [];
                    let currentPath = '';

                    for (let i = 0; i < pathnames.length; i++) {
                        const value = pathnames[i];
                        const last = i === pathnames.length - 1;
                        currentPath += `/${value}`;

                        // Skip structural URLs
                        if (['seeker', 'employer', 'admin'].includes(value)) continue;

                        // Special case for Job Details: merge "job" and "jobId" into one breadcrumb
                        if (value === 'job' && !last) {
                            const jobId = pathnames[i + 1];
                            const shortId = jobId.length > 15 ? jobId.slice(-6).toUpperCase() : jobId;
                            crumbs.push({
                                to: `/${value}/${jobId}`,
                                name: `משרה ${shortId}`,
                                last: true // It's the last part of the path anyway for job pages
                            });
                            i++; // skip the id
                            continue;
                        }

                        if (!routeNames[value] && value.length > 15) continue;

                        crumbs.push({
                            to: currentPath,
                            name: routeNames[value] || value,
                            last: last
                        });
                    }

                    return crumbs.map((crumb, index) => (
                        <li key={crumb.to} className="flex items-center gap-2">
                            <ChevronLeft size={14} />
                            {crumb.last ? (
                                <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{crumb.name}</span>
                            ) : (
                                <Link to={crumb.to} className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-brand-teal'}`}>
                                    {crumb.name}
                                </Link>
                            )}
                        </li>
                    ));
                })()}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
