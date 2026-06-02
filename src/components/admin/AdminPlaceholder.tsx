import React from 'react';
import { ShieldAlert, Construction } from 'lucide-react';

interface AdminPlaceholderProps {
  title: string;
  description: string;
}

export const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ title, description }) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center shadow-sm">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-indigo-50/50">
        <Construction size={40} strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{title}</h2>
      <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      
      <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-sm font-black">
        <ShieldAlert size={18} />
        הממשק פותח בקרוב עבור המנהלים
      </div>
    </div>
  );
};
