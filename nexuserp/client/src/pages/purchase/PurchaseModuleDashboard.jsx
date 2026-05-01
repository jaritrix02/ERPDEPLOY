import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Spinner } from '../../components/ui'

const StatBox = ({ label, value, color, icon, sub }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-700 shadow-blue-500/30',
    green: 'from-emerald-500 to-emerald-700 shadow-emerald-500/30',
    amber: 'from-amber-500 to-amber-700 shadow-amber-500/30',
    red: 'from-red-500 to-red-700 shadow-red-500/30',
    purple: 'from-purple-500 to-purple-700 shadow-purple-500/30',
    indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-500/30',
    orange: 'from-orange-500 to-orange-700 shadow-orange-500/30',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color] || colors.blue} rounded-3xl p-6 text-white shadow-2xl`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-4xl font-black">{value ?? '—'}</p>
      {sub && <p className="text-[10px] font-bold text-white/60 mt-2 uppercase">{sub}</p>}
    </div>
  )
}

const QuickLink = ({ to, label, icon }) => {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)}
      className="card p-5 text-left border-2 border-transparent hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 hover:shadow-xl group">
      <div className="text-2xl mb-3">{icon}</div>
      <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">{label}</p>
    </button>
  )
}

export default function PurchaseModuleDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/indents').catch(() => ({ data: { data: [] } })),
      api.get('/purchase-orders').catch(() => ({ data: { data: [] } })),
      api.get('/vendors').catch(() => ({ data: { data: [] } })),
      api.get('/grn').catch(() => ({ data: { data: [] } })),
    ]).then(([indRes, poRes, vendRes, grnRes]) => {
      const indents = indRes.data.data || []
      const pos = poRes.data.data || []
      const grns = grnRes.data.data || []
      setStats({
        totalIndents: indents.length,
        pendingIndents: indents.filter(i => i.status === 'PENDING').length,
        totalPOs: pos.length,
        pendingPOs: pos.filter(p => p.status === 'PENDING').length,
        approvedPOs: pos.filter(p => p.status === 'APPROVED').length,
        totalVendors: vendRes.data.data?.length || 0,
        totalGRNs: grns.length,
        pendingGRNs: grns.filter(g => g.status === 'PENDING').length,
        totalSpend: pos.filter(p => p.status === 'APPROVED').reduce((s, p) => s + (p.totalAmount || 0), 0),
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-96 flex items-center justify-center"><Spinner /></div>

  return (
    <div className="pb-10 text-black dark:text-white">
      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-2">Module Overview</p>
        <h1 className="text-4xl font-black uppercase tracking-tighter">🛒 Purchase & Procurement</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">End-to-end procurement lifecycle management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
        <StatBox label="Total Indents" value={stats?.totalIndents} color="blue" icon="📋" />
        <StatBox label="Pending Indents" value={stats?.pendingIndents} color="amber" icon="⏳" />
        <StatBox label="Total POs" value={stats?.totalPOs} color="purple" icon="📄" />
        <StatBox label="Pending POs" value={stats?.pendingPOs} color="orange" icon="🔔" />
        <StatBox label="Approved POs" value={stats?.approvedPOs} color="green" icon="✅" />
        <StatBox label="Total Vendors" value={stats?.totalVendors} color="indigo" icon="🏭" />
        <StatBox label="Total GRNs" value={stats?.totalGRNs} color="blue" icon="📦" />
        <StatBox label="Total Spend" value={`₹${((stats?.totalSpend || 0) / 100000).toFixed(1)}L`} color="green" icon="💰" />
      </div>

      <div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <QuickLink to="/purchase/indent" label="Material Indent" icon="📋" />
          <QuickLink to="/purchase/orders" label="Purchase Orders" icon="📄" />
          <QuickLink to="/purchase/tracking" label="PO Tracker" icon="📡" />
          <QuickLink to="/purchase/grn" label="GRN Entry" icon="📦" />
          <QuickLink to="/purchase/mrn" label="MRN Entry" icon="🏪" />
          <QuickLink to="/purchase/bills" label="Vendor Bills" icon="🧾" />
        </div>
      </div>
    </div>
  )
}
