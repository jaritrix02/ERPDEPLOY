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
    orange: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500',
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
      whileHover={{ y: -5, scale: 1.05, borderColor: '#14b8a6' }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.5, delay: delay * 0.1, type: "spring", stiffness: 400, damping: 20 }}
      onClick={() => navigate(to)}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-5 text-left rounded-3xl transition-all shadow-lg group">
      <div className="text-2xl mb-3 drop-shadow-sm">{icon}</div>
      <p className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest">{label}</p>
    </motion.button>
  )
}

export default function InventoryDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/products').catch(() => ({ data: { data: [] } })),
      api.get('/stores').catch(() => ({ data: { data: [] } })),
      api.get('/movements').catch(() => ({ data: { data: [] } })),
    ]).then(([prodRes, storeRes, movRes]) => {
      const products = prodRes.data.data || []
      const stores = storeRes.data.data || []
      const movements = movRes.data.data || []
      const today = new Date().toISOString().slice(0, 10)
      setStats({
        totalSKUs: products.length,
        lowStock: products.filter(p => p.currentQty <= (p.minStock || 10) && p.currentQty > 0).length,
        outOfStock: products.filter(p => p.currentQty <= 0).length,
        totalStores: stores.length,
        totalMovements: movements.length,
        todayMovements: movements.filter(m => m.createdAt?.slice(0, 10) === today).length,
        inMovements: movements.filter(m => m.type === 'IN' || m.type === 'GRN').length,
        outMovements: movements.filter(m => m.type === 'OUT' || m.type === 'ISSUE').length,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-96 flex items-center justify-center"><Spinner /></div>

  return (
    <div className="pb-10 text-black dark:text-white">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 mb-2">Module Overview</p>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">📦 Store Management</h1>
        <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-2 uppercase">Inventory control and stock management</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatBox label="Total SKUs" value={stats?.totalSKUs} color="blue" icon="📦" delay={1} />
        <StatBox label="Low Stock" value={stats?.lowStock} color="amber" icon="⚠️" delay={2} />
        <StatBox label="Out of Stock" value={stats?.outOfStock} color="red" icon="🚫" delay={3} />
        <StatBox label="Total Stores" value={stats?.totalStores} color="indigo" icon="🏪" delay={4} />
        <StatBox label="Total Movements" value={stats?.totalMovements} color="purple" icon="🔄" delay={5} />
        <StatBox label="Today Movements" value={stats?.todayMovements} color="teal" icon="📅" delay={6} />
        <StatBox label="IN Movements" value={stats?.inMovements} color="green" icon="📥" delay={7} />
        <StatBox label="OUT Movements" value={stats?.outMovements} color="orange" icon="📤" delay={8} />
      </div>

      <div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <QuickLink to="/masters/raw-materials" label="RM Master" icon="🧱" delay={1} />
          <QuickLink to="/masters/semi-finished" label="SFG Master" icon="⚗️" delay={2} />
          <QuickLink to="/masters/finished" label="FG Master" icon="🏆" delay={3} />
          <QuickLink to="/masters/consumables" label="Consumables" icon="🔧" delay={4} />
          <QuickLink to="/inventory/products" label="Stock List" icon="📊" delay={5} />
          <QuickLink to="/inventory/movements" label="Stock Ledger" icon="📒" delay={6} />
        </div>
      </div>
    </div>
  )
}
