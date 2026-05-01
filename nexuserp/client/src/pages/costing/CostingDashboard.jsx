import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import api from '../../services/api'
import { Spinner } from '../../components/ui'
import { socket } from '../../services/socket'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const formatCurrency = (value) => currency.format(Number(value || 0))
const pieColors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b']

function StatTile({ label, value, hint, accent, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: delay * 0.1 }}
      className={`rounded-3xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all cursor-default ${accent}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tighter text-slate-950 dark:text-white drop-shadow-sm">{value}</p>
      {hint && <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{hint}</p>}
    </motion.div>
  )
}

export default function CostingDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/costing')
      setData(res.data.data)
    } catch (error) {
      console.error(error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    socket.on('costing:updated', loadData)
    return () => socket.off('costing:updated', loadData)
  }, [])

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Spinner /></div>
  }

  const overview = data?.overview || {}
  const charts = data?.charts || {}
  const recentJobs = data?.lists?.recentJobs || []
  const monthlyTrend = charts.monthlyTrend?.length ? charts.monthlyTrend : [{ month: 'Jan', setCost: 0, weight: 0 }]
  const topMaterials = charts.topMaterials?.length ? charts.topMaterials : [{ name: 'No data', value: 0 }]
  const designMix = charts.designMix?.length ? charts.designMix : [{ name: 'No data', value: 0 }]
  const departmentBreakdown = charts.departmentBreakdown?.length ? charts.departmentBreakdown : []

  return (
    <div className="pb-10 text-slate-900 dark:text-slate-100">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-400">Module Overview</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Costing & Weight Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
            Piece-wise weight calculation, set costing analysis, and material consumption visibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/costing/jobs')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
          >
            Open Costing Register
          </button>
          <button
            onClick={() => navigate('/costing/rubber')}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
          >
            Rubber Department
          </button>
          <button
            onClick={() => navigate('/costing/cork')}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Cork Department
          </button>
          <button
            onClick={() => navigate('/costing/aircell')}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
          >
            Aircell Department
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Total Jobs" value={overview.totalJobs || 0} accent="border-slate-200" hint="Saved drawing costings" />
        <StatTile label="Total Set Cost" value={formatCurrency(overview.totalSetCost)} accent="border-cyan-200" hint="Across all saved jobs" />
        <StatTile label="Total Weight" value={`${overview.totalWeight || 0} kg`} accent="border-emerald-200" hint="Computed material output" />
        <StatTile label="Average Set Cost" value={formatCurrency(overview.averageSetCost)} accent="border-amber-200" hint="Per drawing average" />
        <StatTile label="Avg Utilization" value={`${overview.avgUtilization || 0}%`} accent="border-violet-200" hint="Sheet usage efficiency" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {departmentBreakdown.map((department) => (
          <button
            key={department.name}
            onClick={() => navigate(`/costing/${department.name.toLowerCase()}`)}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-md"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{department.name}</p>
            <p className="mt-3 text-2xl font-black text-slate-950">{department.jobs} jobs</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{department.totalWeight} kg</p>
            <p className="mt-1 text-sm text-slate-500">{formatCurrency(department.totalSetCost)}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
          whileHover={{ y: -5, scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Monthly Costing Trend</h2>
              <p className="text-sm text-slate-500">Set cost and weight movement across saved jobs</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Line Items</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{overview.totalLineItems || 0}</p>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="costing-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                <Tooltip
                  formatter={(value, name) => name === 'setCost' ? formatCurrency(value) : `${value} kg`}
                  contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="setCost" stroke="#06b6d4" strokeWidth={3} fill="url(#costing-fill)" />
                <Bar dataKey="weight" fill="#0f172a" radius={[8, 8, 0, 0]} barSize={16} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
          whileHover={{ y: -5, scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300"
        >
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Design Mix</h2>
            <p className="text-sm text-slate-500">Most used formula types in saved jobs</p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={designMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {designMix.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Top Materials By Cost</h2>
            <p className="text-sm text-slate-500">Material families consuming the highest set value</p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMaterials} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0' }} />
                <Bar dataKey="value" fill="#0891b2" radius={[0, 8, 8, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Total Volume</p>
              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{(overview.totalVolume || 0).toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">mm3 processed in costing sheets</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Total Sheets</p>
              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{overview.totalSheets || 0}</p>
              <p className="mt-1 text-xs text-slate-500">Base plus additions like wastage and rejection</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Avg Weight / Job</p>
              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{overview.avgWeightPerJob || 0} kg</p>
              <p className="mt-1 text-xs text-slate-500">Helpful for comparing heavy vs light sets</p>
            </div>
          </div>
        </motion.section>
      </div>

      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
        whileHover={{ y: -5, scale: 1.005, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
        className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Costing Jobs</h2>
            <p className="text-sm text-slate-500">Latest saved drawings, PO item codes, and computed totals</p>
          </div>
          <button
            onClick={() => navigate('/costing/jobs')}
            className="text-sm font-bold text-cyan-700 transition hover:text-cyan-800"
          >
            View full register
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                <th className="pb-3 pr-4">Drawing</th>
                <th className="pb-3 pr-4">Department / Material</th>
                <th className="pb-3 pr-4">PO / Item</th>
                <th className="pb-3 pr-4">Weight</th>
                <th className="pb-3 pr-4">Sheets</th>
                <th className="pb-3 pr-4">Utilization</th>
                <th className="pb-3 pr-0 text-right">Set Cost</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-400">
                    No costing jobs saved yet.
                  </td>
                </tr>
              )}
              {recentJobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 pr-4">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{job.drawingNo}</p>
                    <p className="text-xs text-slate-500">{job.projectName || 'No project title'}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{job.departmentType}</p>
                    <p className="text-xs text-slate-500">{job.materialName}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{job.purchaseOrderNo || '-'}</p>
                    <p className="text-xs text-slate-500">{job.sourceItemCode || '-'}</p>
                  </td>
                  <td className="py-4 pr-4 text-sm text-slate-700 dark:text-slate-300">{job.totalWeight || 0} kg</td>
                  <td className="py-4 pr-4 text-sm text-slate-700 dark:text-slate-300">{job.totalSheets || 0}</td>
                  <td className="py-4 pr-4 text-sm text-slate-700 dark:text-slate-300">{job.utilizationPct || 0}%</td>
                  <td className="py-4 text-right text-sm font-black text-slate-900 dark:text-white">{formatCurrency(job.totalSetCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  )
}
