import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2 text-right">
        {label && (
          <label className="text-sm font-black text-text-main pr-2 block">
            {label}
            {props.required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-bg-light border-2 border-transparent rounded-2xl py-4 text-sm font-bold text-text-main transition-all focus:bg-white focus:border-primary/20 focus:ring-8 focus:ring-primary/5 outline-none placeholder:text-text-muted/50 shadow-inner",
              icon ? "pr-12 pl-4" : "px-6",
              error && "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/5",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] font-bold text-red-500 pr-2">{error}</p>}
        {helperText && !error && <div className="text-[10px] font-bold text-text-muted pr-2">{helperText}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';
