import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, MessageSquare, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TrustBadgeProps {
    type: 'verified-employer' | 'verified-job' | 'secure' | 'whatsapp';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    label?: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ 
    type, 
    size = 'md', 
    className,
    label
}) => {
    const configs = {
        'verified-employer': {
            icon: CheckCircle2,
            text: label || 'מעסיק מאומת',
            color: 'text-blue-600 bg-blue-50 border-blue-100',
        },
        'verified-job': {
            icon: ShieldCheck,
            text: label || 'משרה מאומתת',
            color: 'text-brand-teal bg-brand-teal/5 border-brand-teal/10',
        },
        'secure': {
            icon: Lock,
            text: label || 'פרסום מאובטח',
            color: 'text-slate-600 bg-slate-50 border-slate-100',
        },
        'whatsapp': {
            icon: MessageSquare,
            text: label || 'תמיכה בוואטסאפ',
            color: 'text-green-600 bg-green-50 border-green-100 font-black',
        },
    };

    const config = configs[type];
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'px-2 py-1 text-[10px] gap-1',
        md: 'px-3 py-1.5 text-xs gap-1.5',
        lg: 'px-4 py-2 text-sm gap-2',
    };

    const iconSizes = {
        sm: 12,
        md: 14,
        lg: 18,
    };

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center rounded-full border font-bold h-fit",
                config.color,
                sizeClasses[size],
                className
            )}
        >
            <Icon size={iconSizes[size]} />
            <span>{config.text}</span>
        </motion.span>
    );
};

export const TrustSection: React.FC = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 py-6">
        <TrustBadge type="secure" size="md" />
        <TrustBadge type="verified-job" size="md" />
        <TrustBadge type="whatsapp" size="md" />
    </div>
);
