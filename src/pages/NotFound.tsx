import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Search, Home, ArrowRight, Ghost } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Force Vite cache invalidation
const NotFound: React.FC = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-20" dir="rtl">
            <Helmet>
                <title>אופס! העמוד לא נמצא | עובדים בצ'יק</title>
                <meta name="robots" content="noindex, follow" />
            </Helmet>

            <div className="max-w-2xl w-full text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative inline-block mb-12"
                >
                    <div className="text-[12rem] md:text-[16rem] font-black leading-none text-slate-100 select-none">
                        404
                    </div>
                    
                    <motion.div 
                        animate={{ 
                            y: [-10, 10, -10],
                            rotate: [-5, 5, -5]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Ghost size={120} className="text-primary opacity-20" />
                    </motion.div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-primary/10 border border-slate-100">
                            <Search className="text-primary w-16 h-16" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                        אופס! העמוד הזה <br />
                        <span className="text-primary">יצא להפסקה</span>
                    </h1>
                    
                    <p className="text-xl text-slate-500 max-w-lg mx-auto">
                        נראה שהכתובת שחיפשת לא קיימת או שהעמוד הועבר למקום אחר. אל דאגה, המשרה הבאה שלך עדיין מחכה לך!
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Link to="/">
                            <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg rounded-[1.25rem] gap-3">
                                <Home size={22} />
                                חזרה לדף הבית
                            </Button>
                        </Link>
                        
                        <Link to="/jobs">
                            <Button variant="ghost" size="lg" className="w-full sm:w-auto h-16 px-10 text-lg rounded-[1.25rem] gap-3">
                                חיפוש משרות
                                <ArrowRight size={22} className="rotate-180" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Decorative Elements */}
                <div className="hidden md:block absolute top-1/4 left-10 opacity-10">
                    <Search size={100} />
                </div>
                <div className="hidden md:block absolute bottom-1/4 right-10 opacity-10">
                    <Ghost size={100} />
                </div>
            </div>
        </div>
    );
};

export default NotFound;
