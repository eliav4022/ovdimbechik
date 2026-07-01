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
        'whatsapp-jobs': 'דרושים בוואטסאפ'
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
                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const name = routeNames[value] || value;

                    // Skip structural URLs and numeric IDs
                    if (['seeker', 'employer', 'admin'].includes(value)) return null;
                    if (!routeNames[value] && value.length > 15) return null;

                    return (
                        <li key={to} className="flex items-center gap-2">
                            <ChevronLeft size={14} />
                            {last ? (
                                <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{name}</span>
                            ) : (
                                <Link to={to} className={`transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-brand-teal'}`}>
                                    {name}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
