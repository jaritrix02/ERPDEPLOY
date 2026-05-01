import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ComposedChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
const formatDate = (value) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const statusTone = {
  OPEN: 'bg-sky-50 text-sky-700 border-sky-200',
  CONFIRMED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  IN_PRODUCTION: 'bg-amber-50 text-amber-700 border-amber-200',
  READY_TO_DISPATCH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DISPATCHED: 'bg-green-50 text-green-700 border-green-200',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  ON_HOLD: 'bg-rose-50 text-rose-700 border-rose-200',
}

function StatPanel({ label, value, accent, hint, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      whileHover={{ y: -8, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.5, delay: delay * 0.1, type: "spring", stiffness: 400, damping: 25 }}
      className={`rounded-3xl border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl transition-all cursor-default ${accent}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tighter text-slate-900 dark:text-white drop-shadow-sm">{value}</p>
      {hint && <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{hint}</p>}
    </motion.div>
  )
}

export default function SalesDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/dashboard/sales')
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
    socket.on('sales:updated', loadData)
    return () => socket.off('sales:updated', loadData)
  }, [])

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Spinner /></div>
  }

  const overview = data?.overview || {}
  const charts = data?.charts || {}
  const lists = data?.lists || {}
  const monthlyBookings = charts.monthlyBookings?.length ? charts.monthlyBookings : [{ month: 'Jan', orders: 0, value: 0 }]
  const statusMix = charts.statusMix?.length ? charts.statusMix : [{ name: 'NO DATA', value: 0 }]
  const topCustomers = charts.topCustomers?.length ? charts.topCustomers : [{ name: 'No customers yet', value: 0 }]
  const upcomingDispatches = lists.upcomingDispatches || []
  const recentOrders = lists.recentOrders || []

  return (
    <div className="pb-10 text-slate-900 dark:text-slate-100">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-400">Module Overview</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 dark:text-white">Sales Control Tower</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
            Order pipeline, dispatch readiness, and customer demand in one operating view.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/sales/orders')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Open Order Register
          </button>
          <button
            onClick={() => navigate('/sales/orders')}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Create Sales Order
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatPanel label="Total Orders" value={overview.totalOrders || 0} accent="border-slate-200" hint="Live order book" />
        <StatPanel label="Open Pipeline" value={overview.openOrders || 0} accent="border-sky-200" hint="Still in action" />
        <StatPanel label="Ready To Dispatch" value={overview.readyToDispatch || 0} accent="border-emerald-200" hint="Can move today" />
        <StatPanel label="Overdue Orders" value={overview.overdueOrders || 0} accent="border-rose-200" hint="Needs follow-up" />
        <StatPanel label="Fulfillment Rate" value={`${overview.fulfillmentRate || 0}%`} accent="border-amber-200" hint="Closed or dispatched" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
          whileHover={{ y: -5, scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Monthly Booking Trend</h2>
              <p className="text-sm text-slate-500">Current year order intake and booked value</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Booked Value</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(overview.bookedValue)}</p>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyBookings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sales-booking-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                <Tooltip
                  formatter={(value, name) => name === 'value' ? formatCurrency(value) : value}
                  contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fill="url(#sales-booking-fill)" />
                <Bar dataKey="orders" fill="#0f172a" radius={[8, 8, 0, 0]} barSize={18} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
          whileHover={{ y: -5, scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300"
        >
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Status Distribution</h2>
            <p className="text-sm text-slate-500">How the pipeline is currently spread</p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusMix} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: 14, borderColor: '#e2e8f0' }} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 8, 8, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
          whileHover={{ y: -5, scale: 1.005, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Upcoming Dispatch Window</h2>
              <p className="text-sm text-slate-500">Closest due orders that still need action</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Current Month</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(overview.currentMonthValue)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  <th className="pb-3 pr-4">Order</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Due</th>
                  <th className="pb-3 pr-0 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingDispatches.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-slate-400">
                      No pending dispatch commitments yet.
                    </td>
                  </tr>
                )}
                {upcomingDispatches.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 pr-4">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{order.orderNo}</p>
                      <p className="text-xs text-slate-500">{order.productName}</p>
                    </td>
                    <td className="py-4 pr-4 text-sm font-medium text-slate-700 dark:text-slate-300">{order.customerName}</td>
                    <td className="py-4 pr-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(order.dueDate)}</td>
                    <td className="py-4 text-right">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone[order.status] || 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                        {String(order.status || 'OPEN').replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
          whileHover={{ y: -5, scale: 1.005, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300"
        >
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Top Customers</h2>
            <p className="text-sm text-slate-500">Highest contribution by booked value</p>
          </div>

          <div className="space-y-4">
            {topCustomers.map((customer) => (
              <div key={customer.name}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{customer.name}</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(customer.value)}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.max((customer.value / (topCustomers[0]?.value || 1)) * 100, customer.value > 0 ? 14 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
        whileHover={{ y: -5, scale: 1.005, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
        className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Orders</h2>
            <p className="text-sm text-slate-500">Fresh order activity from the register</p>
          </div>
          <button
            onClick={() => navigate('/sales/orders')}
            className="text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
          >
            View full register
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Order Date</th>
                <th className="pb-3 pr-4">Value</th>
                <th className="pb-3 pr-0 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                    No sales orders yet. Create the first one from the register.
                  </td>
                </tr>
              )}
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 pr-4">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{order.orderNo}</p>
                    <p className="text-xs text-slate-500">{order.productName}</p>
                  </td>
                  <td className="py-4 pr-4 text-sm font-medium text-slate-700 dark:text-slate-300">{order.customerName}</td>
                  <td className="py-4 pr-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(order.orderDate)}</td>
                  <td className="py-4 pr-4 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(order.totalAmount)}</td>
                  <td className="py-4 text-right">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone[order.status] || 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                      {String(order.status || 'OPEN').replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  )
}
