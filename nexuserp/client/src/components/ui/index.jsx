import { useEffect } from 'react';
import { X, Download, Upload, Printer, Trash2, Edit3, Filter, Search, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

// Simple Modal
export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const widths = { sm:'max-w-md', md:'max-w-2xl', lg:'max-w-4xl', xl:'max-w-6xl', '2xl':'max-w-7xl' };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40"
      />
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${widths[size]} border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[92vh]`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// Simple Status Badge
export function Badge({ status, variant, children }) {
  const map = {
    PENDING:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    REJECTED:  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    ACTIVE:    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    INACTIVE:  'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20',
    COMPLETED: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
    OPEN:      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
    CLOSED:    'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-500 dark:border-gray-500/20',
  }

  const variantMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  }
  
  const label = children || (status ? status.replace('_', ' ') : 'UNKNOWN');
  const style = variant ? (variantMap[variant] || map.PENDING) : (map[status] || map.PENDING);

  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${style}`}>
      {label}
    </span>
  );
}

// Simple Spinner
export function Spinner({ size = 'md' }) {
  const s = { sm:'w-5 h-5 border-2', md:'w-10 h-10 border-2', lg:'w-16 h-16 border-4' }
  return (
    <div className="flex justify-center items-center p-12">
      <div className={`${s[size]} border-blue-600/10 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
}

// Simple Page Header
export function PageHeader({ title, subtitle, icon, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-blue-600">
             {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

// Simple Stats Card
export function StatCard({ label, value, color = 'blue', icon }) {
  const colors = {
    blue:   'text-blue-600',
    green:  'text-emerald-600',
    emerald:'text-emerald-600',
    orange: 'text-orange-600',
    amber:  'text-amber-600',
    rose:   'text-rose-600',
    purple: 'text-violet-600',
    indigo: 'text-indigo-600',
  }
  
  return (
    <div className="card p-6 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value ?? '0'}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${colors[color]}`}>
        {icon}
      </div>
    </div>
  );
}

// Simple Export/Import Buttons
export function ExportButton({ onClick, loading }) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className="btn-secondary px-4"
    >
      <Download size={14} />
      <span>{loading ? 'Processing...' : 'Export'}</span>
    </button>
  );
}

export function ImportButton({ onFileSelect }) {
  return (
    <label className="btn-secondary px-4 cursor-pointer">
      <Upload size={14} />
      <span>Import</span>
      <input type="file" className="hidden" onChange={e => onFileSelect?.(e.target.files[0])} accept=".csv,.xlsx" />
    </label>
  );
}

// Simple Empty State
export function Empty({ message = 'No operational data found' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
      <AlertCircle size={32} className="text-gray-300 dark:text-gray-600 mb-4" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

// Simple Form Row
export function FormRow({ cols = 2, children }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
  }
  return <div className={`grid ${gridCols[cols] || gridCols[2]} gap-6 mb-6`}>{children}</div>;
}

export { CalendarPicker } from './CalendarPicker'
export { default as QCReportTemplate } from './QCReportTemplate'
export { default as SalarySlipTemplate } from './SalarySlipTemplate'
export { default as LiveMeter } from './LiveMeter'
export { SearchableSelect } from './SearchableSelect'
export { default as FlipClock } from './FlipClock'
