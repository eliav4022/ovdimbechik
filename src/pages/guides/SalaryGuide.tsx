import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { DollarSign, Monitor, BookOpen, Stethoscope, Briefcase, Megaphone, Wrench, Truck, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

const SALARY_DATA = [
    {
        category: 'הייטק וטכנולוגיה',
        icon: Monitor,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100',
        jobs: [
            { title: 'מפתח/ת Fullstack', range: '18,000 – 32,000 ₪' },
            { title: 'מפתח/ת Frontend', range: '17,000 – 28,000 ₪' },
            { title: 'מפתח/ת Backend', range: '18,000 – 32,000 ₪' },
            { title: 'DevOps', range: '22,000 – 38,000 ₪' },
            { title: 'QA / בדיקות תוכנה', range: '12,000 – 22,000 ₪' },
            { title: 'ניהול מוצר (Product)', range: '22,000 – 36,000 ₪' },
            { title: 'עיצוב UX/UI', range: '13,000 – 24,000 ₪' },
            { title: 'Data Analyst', range: '16,000 – 26,000 ₪' },
        ]
    },
    {
        category: 'חינוך והוראה',
        icon: BookOpen,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-100',
        jobs: [
            { title: 'מורה בבית ספר יסודי', range: '7,500 – 12,500 ₪' },
            { title: 'גננת', range: '7,000 – 11,500 ₪' },
            { title: 'מורה בתיכון', range: '8,500 – 14,000 ₪' },
            { title: 'מרצה במכללה', range: '10,000 – 19,000 ₪' },
        ]
    },
    {
        category: 'רפואה ובריאות',
        icon: Stethoscope,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-100',
        jobs: [
            { title: 'רופא/ה מומחה/ית', range: '30,000 – 65,000 ₪' },
            { title: 'רופא/ה מתמחה', range: '16,000 – 24,000 ₪' },
            { title: 'אחות מוסמכת', range: '10,000 – 16,000 ₪' },
            { title: 'פיזיותרפיסט/ית', range: '9,000 – 14,500 ₪' },
            { title: 'פסיכולוג/ית קליני/ת', range: '13,000 – 22,000 ₪' },
        ]
    },
    {
        category: 'אדמיניסטרציה ומזכירות',
        icon: Briefcase,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-100',
        jobs: [
            { title: 'מזכיר/ה', range: '6,500 – 9,500 ₪' },
            { title: 'מזכיר/ה בכיר/ה', range: '8,500 – 12,500 ₪' },
            { title: 'ניהול משרד', range: '9,500 – 15,000 ₪' },
            { title: 'עוזר/ת אישי/ת', range: '9,000 – 16,000 ₪' },
        ]
    },
    {
        category: 'שיווק ודיגיטל',
        icon: Megaphone,
        color: 'text-pink-500',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-100',
        jobs: [
            { title: 'מנהל/ת שיווק דיגיטלי', range: '12,000 – 22,000 ₪' },
            { title: 'מנהל/ת קמפיינים / PPC', range: '10,000 – 19,000 ₪' },
            { title: 'מקדם/ת SEO', range: '9,000 – 16,000 ₪' },
            { title: 'קופירייטר/ית', range: '8,000 – 14,000 ₪' },
            { title: 'אנליסט/ית שיווקי', range: '11,000 – 19,000 ₪' },
        ]
    },
    {
        category: 'עבודות טכניות ומכאניות',
        icon: Wrench,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        jobs: [
            { title: 'טכנאי/ת סלולר / מחשבים', range: '7,500 – 13,000 ₪' },
            { title: 'טכנאי/ת חשמל / מערכות', range: '8,500 – 15,000 ₪' },
            { title: 'מכונאי/ת רכב', range: '8,000 – 14,000 ₪' },
            { title: 'הנדסאי/ת / טכנאי/ת הנדסה', range: '9,000 – 16,000 ₪' },
        ]
    },
    {
        category: 'לוגיסטיקה ותחבורה',
        icon: Truck,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-100',
        jobs: [
            { title: 'מנהל/ת לוגיסטיקה', range: '12,000 – 20,000 ₪' },
            { title: 'נהג/ת משאית (מעל 15 טון)', range: '10,000 – 16,000 ₪' },
            { title: 'נהג/ת חלוקה (עד 15 טון)', range: '8,500 – 12,000 ₪' },
            { title: 'מחסנאי/ת / מלגזן/ית', range: '7,500 – 10,500 ₪' },
        ]
    }
];

export const SalaryGuide: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = SALARY_DATA.map(category => ({
        ...category,
        jobs: category.jobs.filter(job => 
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            category.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.jobs.length > 0);

    return (
        <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden text-right font-sans" dir="rtl">
            {/* Ambient Background Blur Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-100/30 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100/30 blur-[100px] pointer-events-none" />

            <div className="relative z-10 pt-24 pb-24 max-w-[1000px] mx-auto px-6 sm:px-8">
                <Helmet>
                    <title>טווחי שכר נפוצים לפי תחומים | עובדים בצ'יק</title>
                    <meta name="description" content="כמה מרוויחים בשוק העבודה כיום? מחירון משכורות עדכני למגוון תחומים: הייטק, חינוך, רפואה, שיווק, לוגיסטיקה ועוד." />
                </Helmet>

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-slate-200/60 rounded-full text-slate-600 text-sm font-medium mb-8 shadow-sm">
                        <DollarSign size={16} className="text-emerald-500" />
                        מעודכן לשנת 2026
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                        טווחי שכר נפוצים בישראל
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
                        רוצים לדעת כמה מרוויחים בתחום שלכם? אספנו עבורכם טווחי שכר חודשי ברוטו (למשרה מלאה) המייצגים את הממוצע בשוק כיום.
                    </p>
                    
                    <div className="max-w-md mx-auto relative">
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="חפש תפקיד או תחום..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-12 pl-4 py-6 rounded-2xl border-slate-200 bg-white/80 backdrop-blur-md shadow-sm text-lg w-full focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </motion.div>

                {/* Content */}
                <div className="space-y-8">
                    {filteredData.length > 0 ? (
                        filteredData.map((category, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                            >
                                <Card className="p-0 overflow-hidden border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-xl rounded-3xl">
                                    <div className={`px-6 py-4 border-b border-slate-100 flex items-center gap-3 ${category.bgColor}`}>
                                        <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${category.color}`}>
                                            <category.icon size={20} />
                                        </div>
                                        <h2 className="text-xl font-medium text-slate-900">{category.category}</h2>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {category.jobs.map((job, jIdx) => (
                                            <div key={jIdx} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors">
                                                <span className="font-medium text-slate-700">{job.title}</span>
                                                <span className="text-slate-900 font-semibold bg-slate-100 px-3 py-1 rounded-lg text-sm inline-block w-max">
                                                    {job.range}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Search size={32} />
                            </div>
                            <h3 className="text-xl font-medium text-slate-900 mb-2">לא נמצאו תוצאות</h3>
                            <p className="text-slate-500">נסה לחפש בשם אחר או תחום שונה.</p>
                        </div>
                    )}
                </div>

                <div className="mt-12 text-center text-slate-500 text-sm">
                    <p>* הנתונים המופיעים בעמוד זה הינם בגדר הערכה ומבוססים על סקרים, נתוני חברות השמה וממוצעים בשוק העבודה נכון לשנת 2026.</p>
                    <p>השכר בפועל עשוי להשתנות בהתאם לניסיון, אזור גיאוגרפי, גודל החברה והשכלה.</p>
                </div>
            </div>
        </div>
    );
};
