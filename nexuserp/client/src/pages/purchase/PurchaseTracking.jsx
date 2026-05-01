import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import { Spinner, Badge } from '../../components/ui'

const Ic = ({ d, cls = 'w-5 h-5' }) => (
  <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

const ICONS = {
  indent:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  po:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  approve:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  gate:'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z',
  grn:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  qc:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  bill:'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  done:'M5 13l4 4L19 7',
  search:'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  clock:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
}

const getSteps = (po) => [
  { id:'INDENT', label:'Indent',       icon:ICONS.indent,  done:true,                             date:po.indent?.createdAt||po.createdAt },
  { id:'PO',     label:'PO Raised',    icon:ICONS.po,      done:true,                             date:po.createdAt },
  { id:'APPR',   label:'Authorized',   icon:ICONS.approve, done:po.status==='APPROVED',           date:po.approvalDate },
  { id:'GATE',   label:'Gate Pass',    icon:ICONS.gate,    done:(po.gatePasses?.length||0)>0,      date:po.gatePasses?.[0]?.date },
  { id:'GRN',    label:'GRN',          icon:ICONS.grn,     done:(po.grns?.length||0)>0,            date:po.grns?.[0]?.date },
  { id:'QC',     label:'QC Check',     icon:ICONS.qc,      done:po.grns?.some(g=>g.qcReports?.length>0), date:po.grns?.[0]?.qcReports?.[0]?.createdAt },
  { id:'BILL',   label:'Bill Done',    icon:ICONS.bill,    done:(po.purchaseBills?.length||0)>0,   date:po.purchaseBills?.[0]?.createdAt },
]

const TruckSVG = ({ size = 32, color = '#3b82f6' }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 64 40" fill="none" className="drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">
    <path d="M2 12C2 9.79086 3.79086 8 6 8H38V30H6C3.79086 30 2 28.2091 2 26V12Z" fill={color} />
    <path d="M38 14H54C56.2091 14 58 15.7909 58 18V30H38V14Z" fill="#60a5fa" />
    <path d="M58 18L63 24V30H58V18Z" fill="#93c5fd" />
    <rect x="42" y="17" width="10" height="6" rx="1" fill="white" fillOpacity="0.4" />
    <circle cx="14" cy="32" r="5" fill="#0f172a" />
    <circle cx="14" cy="32" r="2" fill="#64748b" />
    <circle cx="50" cy="32" r="5" fill="#0f172a" />
    <circle cx="50" cy="32" r="2" fill="#64748b" />
    <path d="M4 12H34" stroke="white" strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round" />
  </svg>
)

const PORow = ({ po }) => {
  const steps = getSteps(po)
  const doneCount = steps.filter(s => s.done).length
  const pct = (doneCount / steps.length) * 100

  return (
    <div className="group relative bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 transition-all duration-300 hover:border-blue-500/40 hover:bg-slate-900/50 shadow-xl mb-3 overflow-hidden">
      <div className="absolute -right-20 -top-20 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
        
        {/* Left: PO Info */}
        <div className="lg:w-1/5 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-base font-black text-white tracking-tighter">{po.poNo}</span>
            <Badge status={po.status} />
          </div>
          <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest truncate">{po.vendor?.companyName}</p>
          <p className="text-xl font-black text-white mt-2 flex items-center gap-2">
            ₹{(po.totalAmount||0).toLocaleString()}
            <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{Math.round(pct)}%</span>
          </p>
        </div>

        {/* Center: Fulfillment Tracker */}
        <div className="lg:flex-1 relative">
          <div className="relative h-16 flex flex-col justify-center px-4">
            <div className="relative h-1.5 bg-slate-800 rounded-full">
              <div className="absolute h-full bg-gradient-to-r from-blue-600 via-violet-500 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-1000" style={{ width: `${pct}%` }} />
              
              {/* Premium Steps Design */}
              <div className="absolute inset-0 flex justify-between px-0.5">
                 {steps.map((s, i) => (
                   <div key={i} className="relative">
                      <div className={`absolute -top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                        s.done ? 'bg-blue-600 border-white shadow-[0_0_12px_rgba(59,130,246,0.8)] scale-110' : 'bg-slate-900 border-slate-700'
                      }`}>
                         {s.done && <Ic d={ICONS.done} cls="w-2 h-2 text-white m-auto mt-0.5" />}
                      </div>
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                         <p className={`text-[8px] font-black uppercase tracking-tighter transition-colors ${s.done ? 'text-slate-200' : 'text-slate-600'}`}>{s.label}</p>
                         {s.done && s.date && <p className="text-[7px] font-bold text-slate-500 mt-0.5">{new Date(s.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</p>}
                      </div>
                   </div>
                 ))}
              </div>

              {/* Truck Animation */}
              <div className="absolute -top-7 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]" style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}>
                <div className="animate-bounce" style={{ animationDuration: '2.5s' }}>
                  <TruckSVG size={48} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Items Details (No Search Button here as requested) */}
        <div className="lg:w-1/12 flex flex-col items-end justify-center border-l border-slate-800/50 pl-8">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Items</p>
           <p className="text-xl font-black text-white">{po.items?.length || 0}</p>
        </div>

      </div>
    </div>
  )
}

export default function PurchaseTracking() {
  const [loading, setLoading] = useState(true)
  const [pos, setPos] = useState([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    api.get('/purchase-orders')
      .then(r => setPos(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = pos.filter(p =>
    (p.poNo||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.vendor?.companyName||'').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pb-10 text-white px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500 mb-1">Logistics Intelligence</p>
          <h1 className="text-5xl font-black tracking-tighter">PO Fulfillment Dashboard</h1>
        </div>

        {/* Search Bar with Dropdown List as requested */}
        <div className="relative group" ref={dropdownRef}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Ic d={ICONS.search} cls="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input 
            className="bg-slate-900 border border-slate-800 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-white placeholder-slate-600 outline-none transition-all shadow-2xl min-w-[380px]" 
            placeholder="Search PO / Select from List..." 
            value={search} 
            onFocus={() => { setSearch(''); setShowDropdown(true) }}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true) }} 
          />
          
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto white-scrollbar">
              {filtered.map(p => (
                <div key={p.id} onClick={() => { setSearch(p.poNo); setShowDropdown(false) }}
                  className="px-6 py-4 hover:bg-blue-600/10 cursor-pointer border-b border-slate-800 last:border-0 flex justify-between items-center group/item">
                  <div>
                    <p className="text-sm font-black text-white group-hover/item:text-blue-400">{p.poNo}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{p.vendor?.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white">₹{(p.totalAmount||0).toLocaleString()}</p>
                    <Badge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? <div className="flex items-center justify-center h-64"><Spinner /></div> : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <Ic d={ICONS.clock} cls="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p className="text-xs font-bold uppercase">No records found</p>
            </div>
          ) : filtered.map(po => (
            <PORow key={po.id} po={po} />
          ))}
        </div>
      )}
    </div>
  )
}
