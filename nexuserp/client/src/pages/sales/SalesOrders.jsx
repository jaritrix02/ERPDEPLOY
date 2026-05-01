import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, Plus, Search, RotateCcw, 
  TrendingUp, Package, Clock, ShieldCheck, 
  Eye, Edit3, Trash2, ChevronRight, 
  X, Info, Download, Zap, DollarSign, User,
  Calendar, CheckCircle2, XCircle, AlertTriangle, MoreVertical, Printer
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Modal, Badge, PageHeader, Spinner, Empty, SearchableSelect, FormRow, CalendarPicker, ExportButton } from '../../components/ui'
import { socket } from '../../services/socket'
import { usePermissions } from '../../hooks/usePermissions'
import { exportToCSV } from '../../utils/exportUtils'

const STATUS_OPTIONS = ['OPEN', 'CONFIRMED', 'IN_PRODUCTION', 'READY_TO_DISPATCH', 'DISPATCHED', 'CLOSED', 'ON_HOLD']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const CHANNEL_OPTIONS = ['DIRECT', 'DEALER', 'EXPORT', 'ONLINE']

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

const todayValue = () => new Date().toISOString().slice(0, 10)

const blankForm = () => ({
  customerName: '',
  customerCode: '',
  productName: '',
  quantity: 1,
  unitPrice: 0,
  orderDate: todayValue(),
  dueDate: '',
  status: 'OPEN',
  priority: 'MEDIUM',
  channel: 'DIRECT',
  assignedTo: '',
  remarks: '',
})

export default function SalesOrders() {
  const { canWrite, canExecute } = usePermissions('sales_orders')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankForm())

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/sales-orders')
      setOrders(res.data.data || [])
    } catch (error) {
      toast.error('Sales Ledger Sync Failure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    socket.on('sales:updated', loadOrders)
    return () => socket.off('sales:updated', loadOrders)
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const s = search.toLowerCase();
      const matchesSearch = !s || order.orderNo?.toLowerCase().includes(s) || order.customerName?.toLowerCase().includes(s) || order.productName?.toLowerCase().includes(s)
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  const summary = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      acc.total += 1
      acc.value += Number(order.totalAmount || 0)
      if (order.status === 'READY_TO_DISPATCH') acc.ready += 1
      if (order.status === 'ON_HOLD') acc.hold += 1
      return acc
    }, { total: 0, value: 0, ready: 0, hold: 0 })
  }, [filteredOrders])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleExport = () => {
    const headers = [
      { label: 'ORDER NO', key: 'orderNo' },
      { label: 'CUSTOMER', key: 'customerName' },
      { label: 'PRODUCT', key: 'productName' },
      { label: 'QUANTITY', key: 'quantity' },
      { label: 'TOTAL AMOUNT', key: 'totalAmount' },
      { label: 'STATUS', key: 'status' }
    ]
    exportToCSV(filteredOrders, 'Sales_Portfolio_Archive', headers)
    toast.success('Sales Ledger Exported')
  }

  const saveOrder = async () => {
    const tid = toast.loading('Synchronizing Transaction...')
    try {
      const payload = { ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) }
      if (editingId) await api.put(`/sales-orders/${editingId}`, payload)
      else await api.post('/sales-orders', payload)
      toast.success('Sales Ledger Updated', { id: tid }); setModal(false); loadOrders()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transaction Failure', { id: tid })
    }
  }

  return (
    <div className="animate-fade-in space-y-10 pb-20 h-full overflow-y-auto custom-scrollbar">
      <PageHeader 
        title="Sales Orders Portfolio" 
        subtitle="Manage customer acquisition, revenue fulfillment, and strategic dispatch pipelines."
        icon={<ShoppingBag size={28} className="text-blue-600" />}
        actions={<>
          <div className="w-64">
            <SearchableSelect 
              placeholder="All Lifecycle States"
              options={[{ label: 'All Lifecycle States', value: 'ALL' }, ...STATUS_OPTIONS.map(s => ({ label: s.replace(/_/g, ' '), value: s }))]}
              value={statusFilter}
              onChange={v => setStatusFilter(v)}
            />
          </div>
          <ExportButton onClick={handleExport} />
          {canWrite && <button className="btn-primary" onClick={() => { setEditingId(null); setForm(blankForm()); setModal(true); }}><Plus size={16} /> Raise sales order</button>}
        </>} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { l: 'Open Portfolio', v: summary.total, i: <ShoppingBag size={20}/>, c: 'blue' },
          { l: 'Ledger Value', v: formatCurrency(summary.value), i: <TrendingUp size={20}/>, c: 'indigo' },
          { l: 'Ready Dispatch', v: summary.ready, i: <Package size={20}/>, c: 'emerald' },
          { l: 'Pipeline Holds', v: summary.hold, i: <Clock size={20}/>, c: 'rose' }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.1 }}
            className="card p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group"
          >
            <div className={`absolute -right-4 -bottom-4 w-32 h-32 bg-${stat.c}-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000`} />
            <div className="flex justify-between items-start relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.l}</p>
              <div className={`p-3 rounded-2xl bg-${stat.c}-600/10 text-${stat.c}-600 shadow-sm`}>{stat.i}</div>
            </div>
            <p className="mt-6 text-4xl font-black text-slate-900 dark:text-white relative z-10 tracking-tighter">{stat.v}</p>
          </motion.div>
        ))}
      </div>

      <div className="card p-6 flex flex-col md:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              placeholder="Search by Order ID, Customer Name, SKU Identity, or Stakeholder..." 
              className="input-field pl-14"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => {setSearch(''); setStatusFilter('ALL');}} className="btn-secondary py-3.5 px-8 transition-all hover:bg-slate-100"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {['Identity','Acquisition Detail','Commodity','Timeline','Pricing','Priority','Lifecycle','Actions'].map(h => (
                    <th key={h} className="table-th text-white uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan={8}><Empty /></td></tr>
                  ) : filteredOrders.map((order, idx) => (
                    <motion.tr 
                      key={order.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-blue-50/40 dark:hover:bg-blue-600/5 transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-blue-600 tracking-widest leading-none">{order.orderNo}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-[0.2em]">{order.channel || 'DIRECT'}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">{order.customerName}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-tighter">ID: {order.customerCode || 'UNCODED'}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none">{order.productName}</span>
                          <span className="text-[9px] font-black text-blue-600 uppercase mt-2 tracking-widest">{order.quantity} UNITS</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter flex items-center gap-2"><Clock size={10} className="text-amber-500"/> {formatDate(order.dueDate)}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{formatDate(order.orderDate)}</span>
                        </div>
                      </td>
                      <td className="py-6 font-black text-slate-900 dark:text-white text-xs tracking-tighter">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${order.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="py-6 text-center"><Badge status={order.status} /></td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          {canWrite && <button onClick={() => { setEditingId(order.id); setForm({ ...order, orderDate: order.orderDate ? String(order.orderDate).slice(0, 10) : todayValue(), dueDate: order.dueDate ? String(order.dueDate).slice(0, 10) : '' }); setModal(true); }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={14}/></button>}
                          <button className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Printer size={14}/></button>
                          {canExecute && <button onClick={() => { if(confirm('Authorize permanent deletion?')) api.delete(`/sales-orders/${order.id}`).then(loadOrders) }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={14}/></button>}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SALES ORDER MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Refine Sales Artifact' : 'Raise New Sales Artifact'} size="xl">
        <div className="flex flex-col h-[75vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
            <div className="p-10 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 shadow-inner">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3"><User size={16}/> Customer Portfolio</p>
              <FormRow cols={2}>
                <div><label className="label">Customer Name *</label><input className="input-field font-black uppercase" value={form.customerName} onChange={(e) => setField('customerName', e.target.value.toUpperCase())} /></div>
                <div><label className="label">System Identity Code</label><input className="input-field font-black uppercase tracking-widest" value={form.customerCode} onChange={(e) => setField('customerCode', e.target.value.toUpperCase())} /></div>
              </FormRow>
            </div>

            <div className="space-y-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Package size={16}/> Commodity Matrix</p>
              <FormRow cols={2}>
                <div><label className="label">Product / Service Specification *</label><input className="input-field font-black uppercase" value={form.productName} onChange={(e) => setField('productName', e.target.value.toUpperCase())} /></div>
                <div><label className="label">Engagement Handler</label><input className="input-field font-black uppercase" value={form.assignedTo} onChange={(e) => setField('assignedTo', e.target.value.toUpperCase())} /></div>
              </FormRow>
              <FormRow cols={3}>
                <CalendarPicker label="Order Genesis" value={form.orderDate} onChange={v => setField('orderDate', v)} />
                <CalendarPicker label="Fulfillment Deadline" value={form.dueDate} onChange={v => setField('dueDate', v)} />
                <SearchableSelect label="Distribution Vector" options={CHANNEL_OPTIONS.map(c => ({ label: c, value: c }))} value={form.channel} onChange={v => setField('channel', v)} />
              </FormRow>
            </div>

            <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-inner">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3"><DollarSign size={16}/> Transactional Valuation</p>
               <FormRow cols={3}>
                 <div><label className="label">Volume Unit *</label><input type="number" className="input-field font-black" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} /></div>
                 <div><label className="label">Unit Valuation (₹) *</label><div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span><input type="number" className="input-field pl-10 font-black" value={form.unitPrice} onChange={(e) => setField('unitPrice', e.target.value)} /></div></div>
                 <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 border border-slate-200 dark:border-white/5 flex flex-col justify-center shadow-sm">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Synthesis Total</p>
                    <p className="text-2xl font-black text-blue-600 leading-none">{formatCurrency(Number(form.quantity || 0) * Number(form.unitPrice || 0))}</p>
                 </div>
               </FormRow>
            </div>

            <FormRow cols={2}>
              <SearchableSelect label="Lifecycle Maturity" options={STATUS_OPTIONS.map(s => ({ label: s.replace(/_/g, ' '), value: s }))} value={form.status} onChange={v => setField('status', v)} />
              <SearchableSelect label="Strategic Priority" options={PRIORITY_OPTIONS.map(p => ({ label: p, value: p }))} value={form.priority} onChange={v => setField('priority', v)} />
            </FormRow>

            <div>
              <label className="label">Stakeholder Annotations</label>
              <textarea className="input-field min-h-[120px]" rows={4} value={form.remarks} onChange={(e) => setField('remarks', e.target.value)} placeholder="Special logistics, packaging specifications, or engagement constraints..." />
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={() => setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[240px] shadow-blue-500/30" onClick={saveOrder}>{editingId ? 'ARCHIVE REFINEMENTS' : 'AUTHORIZE ARTIFACT'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
