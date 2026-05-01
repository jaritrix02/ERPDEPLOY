import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Sun, Moon, Bell, Search, Menu, MessageSquare, ChevronDown, Sparkles } from 'lucide-react'

export default function Topbar({ onToggleSidebar, collapsed }) {
  const { user } = useSelector(s => s.auth)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="h-20 bg-card border-b border-border flex items-center px-8 justify-between z-[90] sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-6 flex-1">
        <button 
          onClick={onToggleSidebar} 
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar - As seen in Image */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              placeholder="Search anything... (PO, GRN, Employee, Item, WO)" 
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-24 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-foreground placeholder:text-slate-400"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-400 shadow-sm">
              Ctrl + K
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 ml-8">
        {/* Theme Toggle */}
        <button 
          onClick={() => setDark(d => !d)}
          className="p-2.5 rounded-2xl hover:bg-muted text-muted-foreground transition-all"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-2xl hover:bg-muted text-muted-foreground transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-card flex items-center justify-center">12</span>
        </button>

        {/* Messages / Comments */}
        <button className="relative p-2.5 rounded-2xl hover:bg-muted text-muted-foreground transition-all">
          <MessageSquare size={20} />
          <span className="absolute top-2 right-2 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full border-2 border-card flex items-center justify-center">5</span>
        </button>

        {/* Company Identity */}
        <div className="hidden lg:flex flex-col items-end border-l border-border pl-6 ml-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-foreground">Nexus Industries Pvt. Ltd.</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5 flex items-center gap-1">
             <Sparkles size={10} /> Platinum Enterprise
          </p>
        </div>
      </div>
    </header>
  )
}
