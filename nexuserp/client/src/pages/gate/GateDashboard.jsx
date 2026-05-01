import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { Spinner } from '../../components/ui'

const StatBox = ({ label, value, color, icon, delay = 0 }) => {
  const colors = {
    blue:   'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500',
    green:  'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500',
    amber:  'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500',
    red:    'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500',
    purple: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" }}
      // ✅ FIX: merged into one transition — default for entry, hover for spring
      transition={{
        default: { duration: 0.5, delay: delay * 0.1 },
        hover:   { type: "spring", stiffness: 400, damping: 25 }
      }}
      className={`bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 border-l-[6px] rounded-2xl p-5 shadow-xl transition-all cursor-default ${colors[color] || colors.blue}`}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</p>
        <span className="text-xl drop-shadow-sm">{icon}</span>
      </div>
      <p className="text-3xl font-black drop-shadow-sm text-slate-800 dark:text-white">{value ?? '0'}</p>
    </motion.div>
  )
}

const QuickLink = ({ to, label, icon, delay = 0 }) => {
  const navigate = useNavigate()
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, scale: 1.05, borderColor: '#6366f1' }}
      whileTap={{ scale: 0.95 }}
      // ✅ FIX: merged into one transition
      transition={{
        default: { duration: 0.5, delay: delay * 0.1 },
        hover:   { type: "spring", stiffness: 400, damping: 20 }
      }}
      onClick={() => navigate(to)}
      className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 p-4 text-left rounded-2xl transition-all shadow-lg group"
    >
      <div className="text-2xl mb-3 drop-shadow-sm">{icon}</div>
      <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">{label}</p>
    </motion.button>
  )
}

export default function GateDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/gate-pass').catch(() => ({ data: { data: [] } })),
      api.get('/gatepass').catch(() => ({ data: { data: [] } })),
    ]).then(([materialRes, empRes]) => {
      const material = materialRes.data.data || []
      const emp = empRes.data.data || []
      const today = new Date().toISOString().slice(0, 10)
      setStats({
        totalMaterial:  material.length,
        todayMaterial:  material.filter(m => m.date?.slice(0, 10) === today).length,
        totalEmpPasses: emp.length,
        todayEmpPasses: emp.filter(e => e.date?.slice(0, 10) === today).length,
        officialPasses: emp.filter(e => e.passType === 'OFFICIAL').length,
        personalPasses: emp.filter(e => e.passType === 'PERSONAL').length,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-96 flex items-center justify-center"><Spinner /></div>

  return (
    <div className="pb-10 text-black dark:text-white">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-2">Module Overview</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">🔐 Gate Entry (Security)</h1>
          <p className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-3 uppercase">Inbound/outbound movement and access control</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary h-[50px] px-8 rounded-2xl shadow-lg">Export Logs</button>
          <button className="btn-primary h-[50px] px-10 rounded-2xl shadow-xl shadow-indigo-500/20">Import Records</button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-10">
        <StatBox label="Total Material In"  value={stats?.totalMaterial}  color="blue"   icon="📦" delay={1} />
        <StatBox label="Today Inward"        value={stats?.todayMaterial}  color="green"  icon="📥" delay={2} />
        <StatBox label="Total Emp Passes"   value={stats?.totalEmpPasses} color="purple" icon="🪪" delay={3} />
        <StatBox label="Today Passes"       value={stats?.todayEmpPasses} color="indigo" icon="📅" delay={4} />
        <StatBox label="Official Passes"    value={stats?.officialPasses} color="amber"  icon="💼" delay={5} />
        <StatBox label="Personal Passes"    value={stats?.personalPasses} color="red"    icon="🚶" delay={6} />
      </div>

      <div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <QuickLink to="/gate/inward"   label="Material Inward"    icon="📦" delay={1} />
          <QuickLink to="/gate/outward"  label="Material Outward"   icon="📤" delay={2} />
          <QuickLink to="/gate/visitor"  label="Visitor Pass"       icon="🪪" delay={3} />
          <QuickLink to="/gate/employee" label="Employee Gate Pass" icon="👤" delay={4} />
        </div>
      </div>
    </div>
  )
}