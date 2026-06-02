import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const isActuallyLoading = isLoading || loading;
    const variants = {
      primary: 'bg-gradient-to-r from-primary to-highlight text-white hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95 border-none',
      secondary: 'bg-primary-dark text-white hover:bg-primary-dark/90 active:scale-95',
      outline: 'bg-transparent border-2 border-primary/20 text-primary hover:border-primary hover:bg-primary/5 active:scale-95',
      ghost: 'bg-transparent text-text-muted hover:bg-bg-light active:scale-95',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/10 active:scale-95',
      warning: 'bg-highlight text-white hover:bg-highlight/90 shadow-lg shadow-highlight/10 active:scale-95',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs font-black rounded-xl',
      md: 'px-6 py-3 text-sm font-black rounded-2xl',
      lg: 'px-8 py-4 text-base font-black rounded-[1.5rem]',
      icon: 'p-3 rounded-2xl',
    };

    return (
      <button
        ref={ref}
        disabled={isActuallyLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isActuallyLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
