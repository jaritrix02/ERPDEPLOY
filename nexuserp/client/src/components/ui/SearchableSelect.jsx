import React, { useState, useRef, useEffect } from 'react';

/**
 * SearchableSelect — Premium combobox component.
 * Features:
 * - Persistent selection display.
 * - Full list reveal on focus/click.
 * - Premium UI with visible scrollbar.
 */
export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  labelKey = "label",
  valueKey = "value",
  stayCleared = false,
  label,
  minimal = false,
}) {
  // Find selected option
  const selectedOption = options.find(o => o[valueKey] === value);
  
  // Initialize query with selected label if available
  const [query, setQuery]     = useState(selectedOption ? String(selectedOption[labelKey]) : "");
  const [isOpen, setIsOpen]   = useState(false);
  const containerRef          = useRef(null);
  const inputRef              = useRef(null);

  // Update query if value changes from outside
  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption ? String(selectedOption[labelKey]) : "");
    }
  }, [value, selectedOption, isOpen]);

  // Filtered list
  const filtered = options.filter(o =>
    String(o[labelKey]).toLowerCase().includes(query.toLowerCase()) ||
    (o.subLabel && String(o.subLabel).toLowerCase().includes(query.toLowerCase()))
  );

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Reset query to selected label if we closed without selecting
        setQuery(selectedOption ? String(selectedOption[labelKey]) : "");
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [selectedOption, labelKey]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleFocus = () => {
    setQuery("");
    setIsOpen(true);
  };

  // Handle clicking specifically to ensure it clears if already open
  const handleClick = () => {
    if (isOpen) {
      setQuery("");
    }
  };

  const handleSelect = (opt) => {
    onChange(opt[valueKey]);
    setIsOpen(false);
    setQuery(String(opt[labelKey]));
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {!minimal && label && (
        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-1">
          {label}
        </p>
      )}

      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          className={`w-full bg-white dark:bg-[#1a2236] border-2 border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-black dark:text-white placeholder-slate-400 ${
            minimal 
              ? "px-3 py-1.5 text-xs" 
              : "px-5 py-3 pr-12 text-sm font-bold"
          }`}
          placeholder={placeholder}
          value={isOpen ? query : (selectedOption ? String(selectedOption[labelKey]) : "")}
          onFocus={handleFocus}
          onClick={handleClick}
          onChange={handleInputChange}
          autoComplete="off"
        />
        
        <div
          className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-blue-500 transition-colors ${minimal ? 'hidden' : ''}`}
          onClick={() => {
            if (isOpen) {
               setIsOpen(false);
               setQuery(selectedOption ? String(selectedOption[labelKey]) : "");
            } else {
               inputRef.current?.focus();
            }
          }}
        >
          <svg className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden animate-in slide-in-from-top-2 fade-in zoom-in-95 duration-200 origin-top">
          <div className="max-h-[300px] overflow-y-auto white-scrollbar p-1.5">
            {(query === "" ? options : filtered).length > 0 ? (
              (query === "" ? options : filtered).map((opt) => {
                const isSelected = value === opt[valueKey];
                
                // Determine status colors for specific keywords
                const getStatusStyle = (label) => {
                  const l = String(label).toUpperCase();
                  if (l.includes('PRESENT') || l.includes('APPROVED') || l.includes('SUCCESS') || l.includes('CONFIRMED')) 
                    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                  if (l.includes('ABSENT') || l.includes('REJECTED') || l.includes('FAILED') || l.includes('CANCELLED') || l.includes('CRITICAL')) 
                    return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                  if (l.includes('PENDING') || l.includes('ON_HOLD') || l.includes('WAITING') || l.includes('WARNING')) 
                    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                  if (l.includes('HALF') || l.includes('PRODUCTION') || l.includes('IN_PROGRESS')) 
                    return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
                  return null;
                };

                const statusStyle = getStatusStyle(opt[labelKey]);

                return (
                  <div
                    key={opt[valueKey]}
                    onClick={() => handleSelect(opt)}
                    className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-all rounded-xl mb-0.5 last:mb-0 group
                      ${isSelected
                        ? 'bg-blue-600/10 text-blue-500'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                  >
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-black uppercase tracking-widest
                          ${isSelected
                            ? 'text-blue-500'
                            : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-500'
                          }`}>
                          {opt[labelKey]}
                        </span>
                        {statusStyle && (
                          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter border ${statusStyle}`}>
                            Status
                          </span>
                        )}
                      </div>
                      {opt.subLabel && (
                        <span className={`text-[9px] font-bold mt-0.5 tracking-tight
                          ${isSelected ? 'text-blue-400/60' : 'text-slate-400 dark:text-slate-500'}`}>
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                       <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                       </svg>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full text-slate-300 dark:text-slate-700">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2.5} />
                   </svg>
                </div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">No Matches</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
