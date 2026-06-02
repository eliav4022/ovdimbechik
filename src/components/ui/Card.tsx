import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, children, hoverable = true, ...props }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-[2.5rem] p-8 border border-primary/5 shadow-xl shadow-bg-light transition-all",
        hoverable && "hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
