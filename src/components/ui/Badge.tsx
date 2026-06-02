import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'accent' | 'success' | 'danger' | 'warning' | 'neutral' | 'purple' | 'outline' | 'error';
}

export const Badge: React.FC<BadgeProps> = ({ className, children, variant = 'neutral', ...props }) => {
  const variants = {
    brand: 'bg-primary/10 text-primary',
    accent: 'bg-highlight/10 text-primary-dark',
    success: 'bg-highlight/10 text-primary-dark',
    danger: 'bg-red-50 text-red-600',
    error: 'bg-red-50 text-red-600',
    warning: 'bg-amber-50 text-amber-600',
    neutral: 'bg-bg-light text-text-muted',
    purple: 'bg-purple-50 text-purple-600',
    outline: 'bg-transparent border border-slate-200 text-slate-500',
  };

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
