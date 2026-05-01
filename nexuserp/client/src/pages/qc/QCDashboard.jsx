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
    teal: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border-teal-500',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: delay * 0.1 }}
      className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 border-l-[6px] rounded-3xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all cursor-default ${colors[color] || colors.blue}`}>
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
    <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: delay * 0.1 }} onClick={() => navigate(to)}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 text-left rounded-3xl hover:border-green-500 transition-all hover:-translate-y-1 hover:shadow-xl group">
      <div className="text-2xl mb-3 drop-shadow-sm">{icon}</div>
      <p className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">{label}</p>
    </motion.button>
  )
}

export default function QCDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/qc').catch(() => ({ data: { data: [] } })),
      api.get('/qc/parameters').catch(() => ({ data: { data: [] } })),
    ]).then(([qcRes, paramRes]) => {
      const reports = qcRes.data.data || []
      const params = paramRes.data.data || []
      setStats({
        total: reports.length,
        passed: reports.filter(r => r.passOrFail).length,
        failed: reports.filter(r => !r.passOrFail).length,
        recent7d: reports.filter(r => new Date(r.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length,
        byRM: reports.filter(r => r.stage === 'RAW').length,
        bySFG: reports.filter(r => r.stage === 'SFG').length,
        byFinal: reports.filter(r => r.stage === 'FINAL').length,
        totalParams: params.length,
      })
    }).finally(() => setLoading(false))
  }, [])

  const passRate = stats?.total ? Math.round((stats.passed / stats.total) * 100) : 0

  if (loading) return <div className="h-96 flex items-center justify-center"><Spinner /></div>

  return (
    <div className="pb-10 text-black dark:text-white">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 mb-2">Module Overview</p>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">🔬 Quality Control</h1>
        <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-2 uppercase">Inspection and compliance tracking</p>
      </motion.div>

      {/* Pass Rate Banner */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className={`rounded-3xl p-8 mb-10 text-white shadow-2xl relative overflow-hidden ${passRate >= 90 ? 'bg-gradient-to-br from-emerald-500 to-teal-700' : passRate >= 70 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-700'}`}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-white/80 mb-2">Overall Pass Rate (All Time)</p>
            <p className="text-6xl font-black drop-shadow-md">{passRate}%</p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-black opacity-40">🔬</p>
            <p className="text-xs font-bold text-white/80 mt-2 uppercase tracking-widest">{stats?.passed} passed / {stats?.failed} failed</p>
          </div>
        </div>
        <div className="mt-6 h-3 bg-black/20 rounded-full overflow-hidden shadow-inner relative z-10">
          <motion.div initial={{ width: 0 }} animate={{ width: `${passRate}%` }} transition={{ duration: 1.5, delay: 0.5, type: 'spring' }} className="h-full bg-white rounded-full" />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-5 mb-10">
        <StatBox label="Total Reports" value={stats?.total} color="blue" icon="📊" delay={1} />
        <StatBox label="Failed (7 days)" value={stats?.recent7d} color="red" icon="⚠️" delay={2} />
        <StatBox label="RM Inspections" value={stats?.byRM} color="amber" icon="🧱" delay={3} />
        <StatBox label="Final Inspections" value={stats?.byFinal} color="purple" icon="🏆" delay={4} />
      </div>

      <div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <QuickLink to="/qc/raw-material" label="RM Quality Check" icon="🧱" delay={1} />
          <QuickLink to="/qc/semi-finished" label="SFG Quality Check" icon="⚗️" delay={2} />
          <QuickLink to="/qc/process" label="In-Process QC" icon="⚙️" delay={3} />
          <QuickLink to="/qc/final" label="Final Inspection" icon="🏆" delay={4} />
          <QuickLink to="/qc/parameters" label="QC Parameters" icon="📐" delay={5} />
        </div>
      </div>
    </div>
  )
}
