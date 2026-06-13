import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  MoreHorizontal, 
  ArrowUpDown,
  History,
  Edit,
  Trash2,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Eye,
  Copy
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface AdminTableProps<T> {
  title: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onClone?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onStatusChange?: (item: T, newStatus: string) => void;
  onExport?: () => void;
  onAdd?: () => void;
  searchFields?: (keyof T)[];
  bulkActions?: { label: string; action: (items: T[]) => void; icon: React.ElementType }[];
  filters?: { key: string; label: string; options: { label: string; value: string }[] }[];
}

export function AdminTable<T extends { id: string; status?: string }>({ 
  title, 
  description, 
  data, 
  columns, 
  onEdit, 
  onClone,
  onDelete,
  onView,
  onStatusChange,
  onExport,
  onAdd,
  searchFields,
  bulkActions,
  filters 
}: AdminTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const itemsPerPage = 10;

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredData = data.filter((item: any) => {
    // Check Search Term
    if (searchTerm) {
        let match = false;
        if (searchFields && searchFields.length > 0) {
            match = searchFields.some(field => {
                const val = item[field];
                return val && val.toString().toLowerCase().includes(searchTerm.toLowerCase());
            });
        } else {
            // Default generic search
            match = Object.values(item).some(val => 
                val !== null && val !== undefined && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (!match) return false;
    }

    // Check Filters
    for (const [key, val] of Object.entries(activeFilters)) {
        if (val === '') continue; // skip empty filter
        
        // Ensure values match string representation
        const itemVal = item[key]?.toString();
        if (itemVal !== val) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedItems.length === paginatedData.length && paginatedData.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedData.map(i => i.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
          {description && <p className="text-slate-500 font-medium mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {onExport && (
            <Button variant="ghost" size="sm" onClick={onExport} className="gap-2 font-black text-slate-600">
              <Download size={18} />
              ייצוא CSV
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd} className="gap-2 rounded-xl font-black shadow-lg shadow-indigo-500/20">
              הוספה חדשה
            </Button>
          )}
        </div>
      </div>

      {/* Controls Card */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 space-y-4 border border-slate-50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap lg:flex-nowrap flex-grow items-center gap-4 max-w-2xl w-full">
            <div className="relative flex-grow min-w-[200px] w-full lg:w-auto">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="חיפוש חופשי..." 
                className="pr-12 h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-sm font-bold w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {filters?.map(filter => (
                <select 
                  key={filter.key}
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="h-12 px-4 rounded-xl border-none bg-slate-50 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 flex-grow md:min-w-[140px]"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ))}
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shrink-0">
                <Filter size={18} />
              </Button>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-4 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 animate-in slide-in-from-left duration-300">
              <span className="text-xs font-black text-indigo-600">{selectedItems.length} נבחרו</span>
              <div className="h-4 w-px bg-indigo-200" />
              {bulkActions?.map(action => (
                  <button 
                  key={action.label} 
                  onClick={() => action.action(data.filter(i => selectedItems.includes(i.id)))}
                  className="text-xs font-black text-indigo-700 hover:underline flex items-center gap-1"
                >
                  <action.icon size={14} />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* The Table (Desktop View) */}
        <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] rounded-2xl border border-slate-100 relative">
          <table className="w-full text-right min-w-max">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm shadow-sm">
              <tr className="text-slate-500 text-xs font-black border-b border-slate-100">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                    checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                {columns.map(col => (
                  <th key={col.key as string} className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 group cursor-pointer hover:text-slate-900 transition-colors">
                      {col.header}
                      {col.sortable && <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-left whitespace-nowrap">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-slate-50/50 transition-colors ${onView ? 'cursor-pointer' : ''}`}
                  onClick={(e) => {
                    // Prevent row click if clicking checkbox, action buttons, or select menus
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('select')) {
                      return;
                    }
                    if (onView) onView(item);
                  }}
                >
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col.key as string} className="px-6 py-4 whitespace-nowrap">
                      {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-left flex items-center justify-end gap-1">
                    {onView && (
                      <Button variant="ghost" size="icon" onClick={() => onView(item)} className="text-slate-400 hover:text-blue-500 h-8 w-8">
                        <Eye size={16} />
                      </Button>
                    )}
                    {onEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="text-slate-400 hover:text-indigo-600 h-8 w-8 text-xs relative group/tooltip">
                        <Edit size={16} />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible whitespace-nowrap transition-all z-10">עריכה</span>
                      </Button>
                    )}
                    {onClone && (
                      <Button variant="ghost" size="icon" onClick={() => onClone(item)} className="text-slate-400 hover:text-emerald-600 h-8 w-8 text-xs relative group/tooltip">
                        <Copy size={16} />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible whitespace-nowrap transition-all z-10">שכפול</span>
                      </Button>
                    )}
                    <div className="group relative">
                      <Button variant="ghost" size="icon" className="text-slate-400 h-8 w-8">
                        <MoreHorizontal size={16} />
                      </Button>
                      <div className="hidden group-hover:block absolute left-0 top-full mt-1 bg-white border border-slate-100 shadow-xl rounded-xl p-2 min-w-[140px] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {onStatusChange && (
                          <>
                            <button 
                              onClick={() => onStatusChange(item, 'active')}
                              className="w-full text-right px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center justify-between"
                            >
                              אישור
                              <CheckCircle size={14} />
                            </button>
                            <button 
                              onClick={() => onStatusChange(item, 'rejected')}
                              className="w-full text-right px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-between"
                            >
                              דחייה
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <button className="w-full text-right px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg flex items-center justify-between">
                          לוג שינויים
                          <History size={14} />
                        </button>
                        <div className="h-px bg-slate-100 my-1" />
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(item)}
                            className="w-full text-right px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-between"
                          >
                            מחיקה רכה
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The Cards (Mobile View) */}
        <div className="block md:hidden space-y-4">
          <div className="flex items-center justify-between bg-slate-50/50 p-4 rounded-xl border border-slate-100">
             <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                  checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                  onChange={toggleSelectAll}
                />
                <span className="text-xs font-bold text-slate-600">בחר הכל</span>
             </div>
             <span className="text-xs font-bold text-slate-500">{paginatedData.length} רשומות בדף זה</span>
          </div>

          {paginatedData.map((item) => (
             <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 relative hover:border-indigo-100 transition-colors">
                  {/* Card Header (First Column) */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-50 pb-3">
                      <div className="flex items-center gap-3 w-full overflow-hidden">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 w-5 h-5" 
                            checked={selectedItems.includes(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                          />
                          <div className="font-bold text-slate-800 truncate w-full text-sm flex items-center gap-3">
                              {columns[0]?.render ? columns[0].render(item) : (item[columns[0]?.key as keyof T] as React.ReactNode)}
                          </div>
                      </div>
                  </div>
                  
                  {/* Card Body (Remaining Columns) */}
                  <div className="flex flex-col gap-3 pt-1">
                      {columns.slice(1).map(col => (
                          <div key={col.key as string} className="flex justify-between items-start gap-4 text-sm">
                              <span className="text-slate-500 font-medium shrink-0">{col.header}</span>
                              <div className="text-left text-slate-700 max-w-[65%] text-ellipsis overflow-hidden">
                                  {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                              </div>
                          </div>
                      ))}
                  </div>
                  
                  {/* Card Footer (Actions) */}
                  <div className="pt-3 mt-1 border-t border-slate-50 flex items-center justify-end gap-2 bg-slate-50/30 -mx-4 -mb-4 px-4 pb-4">
                      {onView && (
                          <Button variant="ghost" size="sm" onClick={() => onView(item)} className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 text-xs px-3 gap-1.5 rounded-lg border border-transparent hover:border-blue-100 h-9">
                            <Eye size={16} /> <span>צפייה</span>
                          </Button>
                      )}
                      {onEdit && (
                          <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs px-3 gap-1.5 rounded-lg border border-transparent hover:border-indigo-100 h-9">
                            <Edit size={16} /> <span>עריכה</span>
                          </Button>
                      )}
                      {onClone && (
                          <Button variant="ghost" size="sm" onClick={() => onClone(item)} className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 text-xs px-3 gap-1.5 rounded-lg border border-transparent hover:border-emerald-100 h-9">
                            <Copy size={16} /> <span>שכפול</span>
                          </Button>
                      )}
                      <div className="group relative">
                          <Button variant="ghost" size="icon" className="text-slate-500 h-9 w-9 bg-slate-50 hover:bg-slate-100 border border-slate-200">
                            <MoreHorizontal size={16} />
                          </Button>
                          <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 bg-white border border-slate-100 shadow-xl rounded-xl p-2 min-w-[160px] z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {onStatusChange && (
                              <>
                                <button 
                                  onClick={() => onStatusChange(item, 'active')}
                                  className="w-full text-right px-3 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center justify-between"
                                >
                                  אישור <CheckCircle size={14} />
                                </button>
                                <button 
                                  onClick={() => onStatusChange(item, 'rejected')}
                                  className="w-full text-right px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-between"
                                >
                                  דחייה <XCircle size={14} />
                                </button>
                              </>
                            )}
                            <button className="w-full text-right px-3 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg flex items-center justify-between">
                              לוג שינויים <History size={14} />
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            {onDelete && (
                              <button 
                                onClick={() => onDelete(item)}
                                className="w-full text-right px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-between"
                              >
                                מחיקה רכה <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                      </div>
                  </div>
             </div>
          ))}
          {paginatedData.length === 0 && (
             <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                לא נמצאו תוצאות לחיפוש הנוכחי
             </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-bold">מציג {(currentPage - 1) * itemsPerPage + (filteredData.length > 0 ? 1 : 0)}-{Math.min(currentPage * itemsPerPage, filteredData.length)} מתוך {filteredData.length} תוצאות</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="h-8 w-8 rounded-lg border border-slate-100">
              <ChevronRight size={16} />
            </Button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              return (
              <button 
                key={p} 
                onClick={() => setCurrentPage(p)}
                className={cn(
                  "h-8 w-8 rounded-lg text-xs font-black transition-colors",
                  currentPage === p ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "hover:bg-slate-100 text-slate-500"
                )}
              >
                {p}
              </button>
            )})}
            <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="h-8 w-8 rounded-lg border border-slate-100">
              <ChevronLeft size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
