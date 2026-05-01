import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, SearchableSelect } from '../../components/ui'
import { socket } from '../../services/socket'
import { usePermissions } from '../../hooks/usePermissions'
import ReportPrintTemplate from '../../components/ui/ReportPrintTemplate'
import { 
  FileText, Plus, Search, Filter, RotateCcw, 
  Printer, CheckCircle2, XCircle, ChevronRight, 
  Package, User, Activity, Download, Eye, Zap, MoreVertical
} from 'lucide-react'

export default function Indents() {
  const { user } = useSelector(s => s.auth)
  const { canWrite, canExecute } = usePermissions('purchase_indent')
  const navigate  = useNavigate()
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [printData, setPrintData] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]   = useState('')
  
  const [approveModal, setApproveModal] = useState(false)
  const [detailModal, setDetailModal]   = useState(false)
  const [selected, setSelected]         = useState(null)
  const [vendors, setVendors]           = useState([])
  const [approveData, setApproveData]   = useState({ status:'APPROVED', approvalRemark:'', vendorId:'' })

  const load = () => {
    setLoading(true)
    api.get('/indents', { params:{ type:typeFilter||undefined, status:statusFilter||undefined, search:search||undefined } })
      .then(r => setList(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { 
    load()
    socket.on('indent:created', () => { toast('New Indent Created', { icon: '📝' }); load(); })
    socket.on('indent:approved', () => { toast('Indent Status Updated', { icon: '✅' }); load(); })
    return () => { socket.off('indent:created'); socket.off('indent:approved'); }
  }, [typeFilter, statusFilter])
  
  useEffect(() => { api.get('/vendors').then(r => setVendors(r.data.data)) }, [])

  const openApprove = (indent) => { setSelected(indent); setApproveData({ status:'APPROVED', approvalRemark:'', vendorId:'' }); setApproveModal(true) }

  const submitApproval = async () => {
    try {
      await api.put(`/indents/${selected.id}/approve`, approveData)
      toast.success(`Request ${approveData.status}`)
      setApproveModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  const handlePrint = (indent) => {
    const columns = [
      { header: 'Item Specification', render: r => r.item?.itemName },
      { header: 'Qty Required', key: 'requestQty' },
      { header: 'Stock Availability', key: 'stockInHand' },
      { header: 'Last Acquisition Cost', render: r => r.lastPrice ? `₹${r.lastPrice}` : '—' },
      { header: 'Originator Remark', key: 'remark' }
    ];
    setPrintData({
      title: `MATERIAL ACQUISITION INDENT: ${indent.indentNo}`,
      subtitle: `Originator: ${indent.requestedBy?.name} (${indent.requestedBy?.department}) | Auth Chain: ${indent.status}`,
      data: indent.items || [],
      columns,
      summaryData: [
        { label: 'Workflow State', value: indent.status },
        { label: 'Target Completion', value: indent.dueDate ? new Date(indent.dueDate).toLocaleDateString() : 'IMMEDIATE' },
        { label: 'Line Item Count', value: `${indent.items?.length || 0} SKUs` }
      ]
    });
    setIsPreview(true);
  }

  const canApprove = canExecute || user?.role === 'ADMIN' || user?.role === 'HOD'

  const filtered = list.filter(i => 
    (!search || i.indentNo?.toLowerCase().includes(search.toLowerCase()) || i.requestedBy?.name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <PageHeader 
        title="Material Acquisition" 
        subtitle="Internal requisitions and material forecasting for enterprise consumption."
        icon={<FileText size={28} className="text-blue-600" />}
        actions={<>
          <button className="btn-secondary" onClick={() => {}}><Download size={14} /> Export</button>
          {canWrite && <button className="btn-primary" onClick={() => navigate('/purchase/indent/create')}><Plus size={16} /> Raise Indent</button>}
        </>} 
      />

      {/* Premium Search & Filter Architecture */}
      <div className="card p-5 flex flex-col lg:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl">
        <div className="flex-1 min-w-[300px]">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
            <input 
              placeholder="Search by Indent No, Originator name, or Department..." 
              className="input-field pl-11"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full lg:w-48">
          <SearchableSelect 
            options={[{ label: 'All Modalities', value: '' }, { label: 'Open Indent', value: 'OPEN_INDENT' }, { label: 'Against Order', value: 'AGAINST_ORDER' }, { label: 'Production', value: 'PRODUCTION' }]}
            value={typeFilter}
            onChange={v => setTypeFilter(v)}
          />
        </div>
        <div className="w-full lg:w-48">
          <SearchableSelect 
            options={[{ label: 'All States', value: '' }, { label: 'Pending Auth', value: 'PENDING' }, { label: 'Approved', value: 'APPROVED' }, { label: 'Rejected', value: 'REJECTED' }]}
            value={statusFilter}
            onChange={v => setStatusFilter(v)}
          />
        </div>
        <button onClick={() => {setSearch(''); setTypeFilter(''); setStatusFilter('')}} className="btn-secondary py-2.5 px-6"><RotateCcw size={16}/></button>
      </div>

      {/* Workflow Phase Indicator */}
      <div className="card p-6 bg-slate-100 dark:bg-[#1a2236] border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Enterprise Acquisition Lifecycle</h4>
        </div>
        <div className="flex items-center gap-6 overflow-x-auto pb-2 custom-scrollbar">
          {['Drafting','HOD Validation','Procurement Desk','Order Placement','Logistics','Verification','Registry'].map((step, i) => (
            <div key={step} className="flex items-center gap-3 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5">{i+1}</div>
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tighter whitespace-nowrap">{step}</span>
              {i < 6 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-700" />}
            </div>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>{['Reference','Modality','Originator Portfolio','Volume','Target Date','Authority State','Actions'].map(h=><th key={h} className="table-th text-white uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7}><Empty /></td></tr>
                  ) : filtered.map((indent, idx) => (
                    <motion.tr 
                      key={indent.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                      <td className="px-8 py-5 font-mono text-[11px] font-black text-slate-500 tracking-widest">{indent.indentNo}</td>
                      <td className="py-5">
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                          {indent.indentType?.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td className="py-5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">{indent.requestedBy?.name}</span>
                          <span className="text-[9px] font-bold text-blue-500 uppercase mt-1 tracking-tighter">{indent.requestedBy?.department}</span>
                        </div>
                      </td>
                      <td className="py-5 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{indent.items?.length} SKUs</td>
                      <td className="py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{indent.dueDate ? new Date(indent.dueDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : 'IMMEDIATE'}</td>
                      <td className="py-5"><Badge status={indent.status} /></td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setSelected(indent); setDetailModal(true) }} className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Eye size={14}/></button>
                          <button onClick={() => handlePrint(indent)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-indigo-600 hover:text-white transition-all"><Printer size={14}/></button>
                          {canApprove && indent.status === 'PENDING' && (
                            <button onClick={() => openApprove(indent)} className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle2 size={14}/></button>
                          )}
                          <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200"><MoreVertical size={14}/></button>
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
      <Modal open={approveModal} onClose={()=>setApproveModal(false)} title="HOD Acquisition Authority" size="sm">
        {selected && (
          <div className="space-y-6">
            <div className="bg-blue-600/5 rounded-2xl p-5 border border-blue-500/10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Indent Reference</span>
                <span className="font-mono font-black text-blue-600 tracking-widest">{selected.indentNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Line Item Volume</span>
                <span className="font-black text-slate-900 dark:text-white">{selected.items?.length} SKUs</span>
              </div>
            </div>
            <SearchableSelect 
              label="Recommended Procurement Partner"
              options={vendors.map(v => ({ value: v.id, label: `${v.vendorCode} — ${v.companyName}` }))}
              value={approveData.vendorId}
              onChange={val => setApproveData(p => ({...p, vendorId: val}))}
            />
            <div>
              <label className="label">Authorization Decision *</label>
              <SearchableSelect options={[{ label: 'APPROVE REQUEST', value: 'APPROVED' }, { label: 'REJECT REQUEST', value: 'REJECTED' }]} value={approveData.status} onChange={v => setApproveData(p => ({...p, status: v}))} />
            </div>
            <div>
              <label className="label">Authority Remarks</label>
              <textarea className="input-field" rows={3} value={approveData.approvalRemark} onChange={e=>setApproveData(p=>({...p,approvalRemark:e.target.value}))} placeholder="Decision rationale for audit trail..." />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t dark:border-white/5">
              <button className="btn-secondary px-8" onClick={()=>setApproveModal(false)}>Discard</button>
              <button className={approveData.status==='APPROVED' ? 'btn-primary px-12' : 'btn-danger px-12'} onClick={submitApproval}>Confirm Decision</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ANALYSIS / DETAIL MODAL */}
      <Modal open={detailModal} onClose={()=>setDetailModal(false)} title={`Indent Analysis — ${selected?.indentNo}`} size="xl">
        {selected && (
          <div className="flex flex-col h-[70vh]">
            <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b dark:border-white/5">
              {[ { l: 'Modality', v: selected.indentType?.replace(/_/g,' ') }, { l: 'Authority State', v: <Badge status={selected.status} /> }, { l: 'Originator', v: selected.requestedBy?.name }, { l: 'Target Completion', v: selected.dueDate ? new Date(selected.dueDate).toLocaleDateString() : 'IMMEDIATE' } ].map((item, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{item.l}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{item.v}</span>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar py-8">
              <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Package size={14}/> Material Specification Breakdown</h4>
              <div className="card overflow-hidden border-slate-200 dark:border-white/5 shadow-xl">
                <table className="w-full">
                  <thead className="table-head">
                    <tr><th className="px-6 py-4 text-[10px] text-white">Item Identity</th><th className="px-6 py-4 text-center text-[10px] text-white">Inventory</th><th className="px-6 py-4 text-center text-[10px] text-white">Demand</th><th className="px-6 py-4 text-right text-[10px] text-white">Acquisition Cost</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {selected.items?.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none">{item.item?.itemName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">CODE: {item.item?.itemCode}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase">{item.stockInHand} Units</td>
                        <td className="px-6 py-4 text-center text-[11px] font-black text-blue-600 uppercase bg-blue-500/5">{item.requestQty} Units</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none">{item.lastPrice ? `₹${item.lastPrice}` : '—'}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Vendor: {item.lastVendor || 'N/A'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="shrink-0 flex justify-end gap-3 pt-6 border-t dark:border-white/5">
              <button className="btn-secondary px-8" onClick={()=>setDetailModal(false)}>Close Analysis</button>
              {canApprove && selected.status === 'PENDING' && (
                <button className="btn-primary px-12" onClick={() => { setDetailModal(false); openApprove(selected); }}>Proceed to Authorization</button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* PRINT OVERLAY */}
      <AnimatePresence>
        {isPreview && printData && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[200] bg-slate-900 overflow-auto scrollbar-none p-4 md:p-10">
            <div className="no-print bg-slate-800 border border-slate-700/50 rounded-2xl px-6 py-4 flex justify-between items-center sticky top-0 mb-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl text-white"><Printer size={18}/></div>
                <h2 className="text-white font-black uppercase tracking-widest text-[10px]">Material Indent Formal Preview</h2>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsPreview(false)} className="px-6 py-2.5 bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Exit</button>
                <button onClick={() => window.print()} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Print Document</button>
              </div>
            </div>
            <div className="max-w-[950px] mx-auto bg-white shadow-2xl rounded-sm p-8">
              <ReportPrintTemplate {...printData} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
