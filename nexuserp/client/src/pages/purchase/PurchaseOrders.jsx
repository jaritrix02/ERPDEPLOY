import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, SearchableSelect, FormRow, ExportButton, ImportButton } from '../../components/ui'
import POPrintTemplate from '../../components/ui/POPrintTemplate'
import { 
  ShoppingCart, Plus, Search, Filter, RotateCcw, 
  Printer, CheckCircle, XCircle, ChevronRight, 
  DollarSign, FileText, Package, Briefcase, Download, Upload,
  Zap, MoreVertical, Eye, Trash2, Edit3, Shield
} from 'lucide-react'
import { exportToCSV } from '../../utils/exportUtils'

export default function PurchaseOrders() {
  const { user } = useSelector(s => s.auth)
  const [list, setList]   = useState([])
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [printData, setPrintData] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const [approveModal, setApproveModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [approveData, setApproveData] = useState({ status:'APPROVED', approvalRemark:'' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/purchase-orders')
      setList(res.data.data || [])
    } catch (e) {
      toast.error('Surveillance failure: Unable to retrieve ledger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = list.filter(po => {
    const s = search.toLowerCase()
    const matchesSearch = !s || 
      po.poNo?.toLowerCase().includes(s) || 
      po.vendor?.companyName?.toLowerCase().includes(s) ||
      po.department?.name?.toLowerCase().includes(s)
    
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleExport = () => {
    const headers = [
      { label: 'PO NUMBER', key: 'poNo' },
      { label: 'VENDOR', key: 'vendor.companyName' },
      { label: 'DEPARTMENT', key: 'department.name' },
      { label: 'DATE', key: 'date' },
      { label: 'TOTAL AMOUNT', key: 'totalAmount' },
      { label: 'STATUS', key: 'status' }
    ]
    exportToCSV(filtered, 'Purchase_Orders_Registry', headers)
    toast.success('Ledger Exported Successfully')
  }

  const handleApprove = async () => {
    const tid = toast.loading('Authorizing Transaction...')
    try {
      await api.post(`/purchase-orders/${selected.id}/approve`, approveData)
      toast.success('Authorization Complete', { id: tid })
      setApproveModal(false); load()
    } catch (e) {
      toast.error('Authorization Failed', { id: tid })
    }
  }

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <PageHeader 
        title="Procurement Registry" 
        subtitle="Manage secure purchase authorizations, vendor commitments, and ledger tracking."
        icon={<ShoppingCart size={28} className="text-blue-600" />}
        actions={<>
          <div className="w-56">
            <SearchableSelect 
              placeholder="All Statuses"
              options={[{ label: 'All Statuses', value: 'ALL' }, { label: 'PENDING', value: 'PENDING' }, { label: 'APPROVED', value: 'APPROVED' }, { label: 'REJECTED', value: 'REJECTED' }]}
              value={statusFilter}
              onChange={v => setStatusFilter(v)}
            />
          </div>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => {}}><Plus size={16} /> Raise PO</button>
        </>} 
      />

      <div className="card p-6 flex flex-col md:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              placeholder="Search by PO Identity, Vendor Name, or Departmental Unit..." 
              className="input-field pl-14"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => {setSearch(''); setStatusFilter('ALL');}} className="btn-secondary py-3.5 px-8 transition-all hover:bg-slate-100"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {['Identity','Acquisition Source','Operational Unit','Commitment','Valuation','State','Authorization','Actions'].map(h => (
                    <th key={h} className="table-th text-white uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8}><Empty /></td></tr>
                  ) : filtered.map((po, idx) => (
                    <motion.tr 
                      key={po.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-blue-50/30 dark:hover:bg-blue-600/5 transition-all duration-300"
                    >
                      <td className="px-8 py-6 font-mono text-[11px] font-black text-blue-600 tracking-widest">{po.poNo}</td>
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">{po.vendor?.companyName}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-tighter">Verified Supply Node</span>
                        </div>
                      </td>
                      <td className="py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{po.department?.name || 'GENERIC'}</td>
                      <td className="py-6 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{po.date?.slice(0,10)}</td>
                      <td className="py-6 font-black text-slate-900 dark:text-white text-xs tracking-tight">₹ {po.totalAmount?.toLocaleString()}</td>
                      <td className="py-6 text-center"><Badge status={po.status} /></td>
                      <td className="py-6">
                        {po.status === 'PENDING' ? (
                          <button onClick={() => { setSelected(po); setApproveModal(true); }} className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase hover:underline underline-offset-4 decoration-2"><CheckCircle size={12}/> Authorize</button>
                        ) : <span className="text-[9px] font-bold text-slate-400 uppercase">Verified by {po.approvedBy}</span>}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setPrintData(po); setIsPreview(true); }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Eye size={14}/></button>
                          <button className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Printer size={14}/></button>
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

      {/* AUTHORIZATION MODAL */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)} title="Operational Authorization" size="md">
        <div className="space-y-8">
           <div className="p-8 bg-blue-600/5 rounded-[2rem] border border-blue-500/10 flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/20"><Shield size={28}/></div>
              <div>
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Transaction Identity</p>
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{selected?.poNo}</h3>
              </div>
           </div>
           
           <FormRow cols={2}>
              <div className="space-y-3">
                 <label className="label">Authorization State</label>
                 <div className="flex gap-4">
                    <button onClick={() => setApproveData(d => ({ ...d, status: 'APPROVED' }))} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 border-2 ${approveData.status === 'APPROVED' ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl shadow-emerald-500/20' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-400'}`}>
                       <CheckCircle size={18}/> <span className="text-[11px] font-black uppercase tracking-widest">Approve</span>
                    </button>
                    <button onClick={() => setApproveData(d => ({ ...d, status: 'REJECTED' }))} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 border-2 ${approveData.status === 'REJECTED' ? 'bg-rose-600 border-rose-600 text-white shadow-2xl shadow-rose-500/20' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-400'}`}>
                       <XCircle size={18}/> <span className="text-[11px] font-black uppercase tracking-widest">Reject</span>
                    </button>
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="label">Verification Remark</label>
                 <textarea className="input-field min-h-[96px]" rows={3} value={approveData.approvalRemark} onChange={e => setApproveData(d => ({ ...d, approvalRemark: e.target.value }))} placeholder="Provide technical rationale for this decision..." />
              </div>
           </FormRow>

           <div className="flex justify-end gap-4 pt-8 border-t dark:border-white/5">
              <button className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-8" onClick={() => setApproveModal(false)}>Discard</button>
              <button className="btn-primary min-w-[220px]" onClick={handleApprove}>Authorize Transaction</button>
           </div>
        </div>
      </Modal>

      {/* PRINT PREVIEW */}
      <Modal open={isPreview} onClose={() => setIsPreview(false)} title="Transaction Certification" size="xl">
          <div className="no-print mb-8 flex justify-end gap-4">
             <button onClick={() => window.print()} className="btn-primary flex items-center gap-3 px-10 shadow-blue-600/40"><Printer size={18}/> Print Certification</button>
          </div>
          <div className="bg-white dark:bg-[#0b0f1a] p-12 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-auto">
             <POPrintTemplate data={printData} />
          </div>
      </Modal>
    </div>
  )
}
