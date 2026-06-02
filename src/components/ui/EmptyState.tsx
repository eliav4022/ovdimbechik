import React from 'react';
import { LucideIcon, SearchX } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon: Icon = SearchX, action }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200"
    >
        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-6">
            <Icon size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 font-bold text-sm max-w-sm leading-relaxed mb-8">{description}</p>
        
        {action && (
            <button 
                onClick={action.onClick}
                className="bg-brand-dark text-white px-8 py-3 rounded-xl font-black shadow-lg hover:scale-105 transition-all text-sm"
            >
                {action.label}
            </button>
        )}
    </motion.div>
);
