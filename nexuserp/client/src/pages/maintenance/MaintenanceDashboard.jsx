import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { Spinner } from '../../components/ui'

const StatBox = ({ label, value, color, icon, delay = 0 }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500',
    green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500',
    amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500',
    red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500',
    purple: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      whileHover={{ y: -8, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
      transition={{ duration: 0.5, delay: delay * 0.1, type: "spring", stiffness: 400, damping: 25 }}
      className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 border-l-[6px] rounded-3xl p-6 shadow-xl transition-all cursor-default ${colors[color] || colors.blue}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">{label}</p>
        <span className="text-2xl drop-shadow-sm">{icon}</span>
      </div>
      <p className="text-4xl font-black drop-shadow-sm text-slate-800 dark:text-white">{value ?? '—'}</p>
    </motion.div>
  )
}

const QuickLink = ({ to, label, icon, delay = 0 }) => {
  const navigate = useNavigate()
  return (
    <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
      whileHover={{ y: -5, scale: 1.05, borderColor: '#ef4444' }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.5, delay: delay * 0.1, type: "spring", stiffness: 400, damping: 20 }}
      onClick={() => navigate(to)}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 text-left rounded-3xl transition-all shadow-lg group">
      <div className="text-2xl mb-3 drop-shadow-sm">{icon}</div>
      <p className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">{label}</p>
    </motion.button>
  )
}

export default function MaintenanceDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/machines').catch(() => ({ data: { data: [] } })),
      api.get('/breakdowns').catch(() => ({ data: { data: [] } })),
    ]).then(([machRes, bdRes]) => {
      const machines = machRes.data.data || []
      const bds = bdRes.data.data || []
      const today = new Date().toISOString().slice(0, 10)
      setStats({
        totalMachines: machines.length,
        activeMachines: machines.filter(m => m.status === 'ACTIVE').length,
        underMaintenance: machines.filter(m => m.status === 'MAINTENANCE').length,
        totalBreakdowns: bds.length,
        openBreakdowns: bds.filter(b => b.status === 'OPEN').length,
        todayBreakdowns: bds.filter(b => b.reportedAt?.slice(0, 10) === today).length,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-96 flex items-center justify-center"><Spinner /></div>

  return (
    <div className="pb-10 text-black dark:text-white">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 mb-2">Module Overview</p>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">🔧 Plant Maintenance</h1>
        <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-2 uppercase">Machine health and breakdown management</p>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-10">
        <StatBox label="Total Machines" value={stats?.totalMachines} color="blue" icon="⚙️" delay={1} />
        <StatBox label="Active" value={stats?.activeMachines} color="green" icon="✅" delay={2} />
        <StatBox label="Under Maintenance" value={stats?.underMaintenance} color="amber" icon="🔧" delay={3} />
        <StatBox label="Total Breakdowns" value={stats?.totalBreakdowns} color="red" icon="⚠️" delay={4} />
        <StatBox label="Open Breakdowns" value={stats?.openBreakdowns} color="purple" icon="🔴" delay={5} />
        <StatBox label="Today Breakdowns" value={stats?.todayBreakdowns} color="indigo" icon="📅" delay={6} />
      </div>
      <div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Quick Access</h2>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <QuickLink to="/maintenance/machines" label="Machine Master" icon="⚙️" delay={1} />
          <QuickLink to="/maintenance/breakdowns" label="Breakdown Entry" icon="⚠️" delay={2} />
        </div>
      </div>
    </div>
  )
}
