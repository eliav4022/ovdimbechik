import React from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingProps> = ({ 
    message,
    fullScreen = false,
    size = 'md',
    className
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-20 h-20 md:w-24 md:h-24 border-4',
        lg: 'w-32 h-32 md:w-40 md:h-40 border-8'
    };

    const iconSizes = {
        sm: 12,
        md: 32,
        lg: 48
    };

    return (
        <div className={cn(
            fullScreen ? "fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-6" : "flex flex-col items-center justify-center gap-6",
            !fullScreen && size === 'md' ? 'p-12' : '',
            className
        )}>
            <div className="relative">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className={cn("rounded-full border-slate-100 border-t-primary shadow-xl shadow-primary/10", sizeClasses[size])}
                />
                <motion.div 
                    animate={{ y: [-2, 2, -2], rotate: [-45, -45, -45] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center text-primary"
                >
                    <Rocket size={iconSizes[size]} />
                </motion.div>
            </div>
            {message && (
                <div className="text-center">
                    <p className={cn("text-slate-900 font-black mb-2", size === 'sm' ? 'text-sm' : 'text-lg')}>{message}</p>
                    <div className="flex gap-1 justify-center">
                        {[0, 1, 2].map((i) => (
                            <motion.div 
                                key={i}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                className={cn("bg-highlight rounded-full", size === 'sm' ? 'w-1 h-1' : 'w-2 h-2')}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const FullPageLoading: React.FC<{ message?: string }> = ({ message = "מאמת נתוני משתמש..." }) => (
    <LoadingSpinner fullScreen message={message} />
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`animate-pulse bg-slate-100/80 rounded-2xl ${className}`} />
);

export const JobCardSkeleton: React.FC = () => (
    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-soft space-y-6">
        <div className="flex gap-4">
            <Skeleton className="w-20 h-20 shrink-0" />
            <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
        <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
        </div>
        <div className="pt-6 border-t border-slate-50 flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
        </div>
    </div>
);
