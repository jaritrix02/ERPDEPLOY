import { useState, useRef, useEffect } from 'react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay,
  eachDayOfInterval, isToday
} from 'date-fns'

export function CalendarPicker({ value, onChange, label, placeholder = "Select Date", mode = "date" }) {
  const [isOpen, setIsOpen]           = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date())
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null)
  const [inputValue, setInputValue]   = useState(
    value ? (mode === 'month' ? format(new Date(value), 'yyyy-MM') : format(new Date(value), 'yyyy-MM-dd')) : ''
  )
  const [view, setView] = useState(mode)
  const [animDir, setAnimDir] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (value) {
      setInputValue(mode === 'month' ? format(new Date(value), 'yyyy-MM') : format(new Date(value), 'yyyy-MM-dd'))
      setSelectedDate(new Date(value))
      setCurrentMonth(new Date(value))
    } else {
      setInputValue('')
      setSelectedDate(null)
    }
  }, [value, mode])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigate = (dir) => {
    setAnimDir(dir)
    setTimeout(() => setAnimDir(null), 250)
    const step = view === 'year' ? 120 : view === 'month' ? 12 : 1
    setCurrentMonth(dir === 'next' ? addMonths(currentMonth, step) : subMonths(currentMonth, step))
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    const parsed = new Date(val)
    if (!isNaN(parsed.getTime())) {
      setSelectedDate(parsed)
      setCurrentMonth(parsed)
      onChange(val)
    }
  }

  const handleOK = () => {
    if (selectedDate) {
      const formatted = format(selectedDate, mode === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd')
      onChange(formatted)
      setInputValue(formatted)
      setIsOpen(false)
    }
  }

  const handleToday = () => {
    const today = new Date()
    const formatted = format(today, mode === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd')
    setSelectedDate(today)
    setCurrentMonth(today)
    onChange(formatted)
    setInputValue(formatted)
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedDate(null)
    onChange('')
    setInputValue('')
    setIsOpen(false)
  }

  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end:   endOfWeek(endOfMonth(startOfMonth(currentMonth)))
  })

  const startYear = currentMonth.getFullYear() - 6
  const years = Array.from({ length: 18 }, (_, i) => startYear + i)

  return (
    <div className="relative w-full" ref={containerRef}>

      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {label}
          </label>
          {value && (
            <button
              onClick={handleClear}
              className="text-[9px] font-bold uppercase text-red-500 hover:text-red-400 transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* Input Trigger */}
      <div
        onClick={() => setIsOpen(o => !o)}
        className={`
          relative flex items-center gap-3 cursor-pointer
          bg-white dark:bg-slate-900/80
          border-2 rounded-xl px-4 py-2.5
          transition-all duration-200 group
          ${isOpen
            ? 'border-black dark:border-white shadow-[0_0_0_3px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
          }
        `}
      >
        {/* Calendar icon */}
        <svg
          className={`w-4 h-4 shrink-0 transition-colors ${isOpen ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <rect x="3" y="4" width="18" height="18" rx="3" strokeWidth={2} />
          <path d="M8 2v4M16 2v4M3 10h18" strokeWidth={2} strokeLinecap="round" />
        </svg>

        <input
          type="text"
          readOnly
          value={inputValue}
          placeholder={placeholder}
          className="
            flex-1 bg-transparent border-none outline-none
            text-sm font-bold uppercase tracking-wide
            text-black dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600
            cursor-pointer select-none
          "
        />

        {/* Chevron */}
        <svg
          className={`w-4 h-4 shrink-0 transition-all duration-200 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="
            absolute z-[200] mt-2 w-[292px]
            bg-white dark:bg-[#0d1117]
            border border-slate-200 dark:border-slate-800
            rounded-2xl overflow-hidden
            shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)]
            dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)]
          "
          style={{ animation: 'cpSlideIn 0.18s ease' }}
        >
          <style>{`
            @keyframes cpSlideIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0)   scale(1);    }
            }
          `}</style>

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => navigate('prev')}
              className="
                w-7 h-7 flex items-center justify-center
                rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800
                text-slate-500 dark:text-slate-400
                hover:text-black dark:hover:text-white
                transition-all duration-150 active:scale-90
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setView(v => v === 'month' ? 'date' : 'month')}
                className="
                  px-3 py-1 rounded-lg
                  text-[11px] font-black uppercase tracking-widest
                  text-black dark:text-white
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  transition-all duration-150
                "
              >
                {format(currentMonth, 'MMMM')}
              </button>
              <button
                onClick={() => setView(v => v === 'year' ? 'date' : 'year')}
                className="
                  px-3 py-1 rounded-lg
                  text-[11px] font-black uppercase tracking-widest
                  text-slate-500 dark:text-slate-400
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  hover:text-black dark:hover:text-white
                  transition-all duration-150
                "
              >
                {format(currentMonth, 'yyyy')}
              </button>
            </div>

            <button
              onClick={() => navigate('next')}
              className="
                w-7 h-7 flex items-center justify-center
                rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800
                text-slate-500 dark:text-slate-400
                hover:text-black dark:hover:text-white
                transition-all duration-150 active:scale-90
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* ── BODY ── */}
          <div className="p-3">

            {/* YEAR GRID */}
            {view === 'year' && (
              <div className="grid grid-cols-3 gap-1.5">
                {years.map(y => {
                  const isSel = selectedDate && selectedDate.getFullYear() === y
                  const isCur = new Date().getFullYear() === y
                  return (
                    <button
                      key={y}
                      onClick={() => { setCurrentMonth(new Date(y, currentMonth.getMonth(), 1)); setView('month') }}
                      className={`
                        py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all duration-150 active:scale-95
                        ${isSel
                          ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                          : isCur
                          ? 'border-2 border-black dark:border-white text-black dark:text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
                        }
                      `}
                    >
                      {y}
                    </button>
                  )
                })}
              </div>
            )}

            {/* MONTH GRID */}
            {view === 'month' && (
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((m, i) => {
                  const isSel = selectedDate &&
                    selectedDate.getMonth() === i &&
                    selectedDate.getFullYear() === currentMonth.getFullYear()
                  const isCur = new Date().getMonth() === i &&
                    new Date().getFullYear() === currentMonth.getFullYear()
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        const nd = new Date(currentMonth.getFullYear(), i, 1)
                        setSelectedDate(nd)
                        if (mode === 'month') {
                          const fmt = format(nd, 'yyyy-MM')
                          onChange(fmt); setInputValue(fmt); setIsOpen(false)
                        } else {
                          setCurrentMonth(nd); setView('date')
                        }
                      }}
                      className={`
                        py-3 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all duration-150 active:scale-95
                        ${isSel
                          ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                          : isCur
                          ? 'border-2 border-black dark:border-white text-black dark:text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white'
                        }
                      `}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            )}

            {/* DATE GRID */}
            {view === 'date' && (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_LABELS.map(d => (
                    <div key={d} className="py-1.5 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((day, i) => {
                    const inMonth  = isSameMonth(day, currentMonth)
                    const isSel    = selectedDate && isSameDay(day, selectedDate)
                    const isT      = isToday(day)
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square flex items-center justify-center
                          text-[11px] font-bold rounded-xl
                          transition-all duration-100 active:scale-90
                          ${!inMonth ? 'text-slate-300 dark:text-slate-700 hover:text-slate-400' : ''}
                          ${isSel
                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-md scale-105 font-black'
                            : inMonth
                              ? 'text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                              : ''
                          }
                          ${isT && !isSel ? 'border-2 border-black dark:border-white font-black' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="
            flex items-center justify-between
            px-4 py-3
            border-t border-slate-100 dark:border-slate-800
            bg-slate-50 dark:bg-slate-900/50
          ">
            <button
              onClick={handleClear}
              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
            >
              Clear
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="
                  px-3 py-1.5 rounded-lg
                  text-[10px] font-black uppercase tracking-widest
                  text-black dark:text-white
                  bg-slate-100 dark:bg-slate-800
                  hover:bg-slate-200 dark:hover:bg-slate-700
                  transition-all duration-150 active:scale-95
                "
              >
                Today
              </button>
              <button
                onClick={handleOK}
                disabled={!selectedDate}
                className="
                  px-5 py-1.5 rounded-lg
                  text-[10px] font-black uppercase tracking-widest
                  bg-black dark:bg-white
                  text-white dark:text-black
                  hover:opacity-80 transition-all duration-150
                  active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                  shadow-md
                "
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}