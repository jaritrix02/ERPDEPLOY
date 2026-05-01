import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, Plus, Search, RotateCcw, 
  ShieldCheck, Package, MapPin, User, 
  Phone, CreditCard, ChevronRight, Download, 
  Zap, X, MoreVertical, ClipboardCheck, Clock
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, SearchableSelect, ExportButton } from '../../components/ui'
import { exportToCSV } from '../../utils/exportUtils'

const blankForm = {
  poId: '', vendorId: '', vehicleNo: '', driverName: '',
  driverPhone: '', driverAadhar: '',
  receivedQty: 0, remark: ''
}

export default function InwardGatePass() {
  const [list, setList]       = useState([])
  const [pos, setPOs]         = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(blankForm)

  const [search, setSearch]           = useState('')
  const [vendorFilter, setVendorFilter] = useState('')
  const [poFilter, setPoFilter]         = useState('')
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const load = async () => {
    setLoading(true)
    try {
      const [g, p] = await Promise.all([
        api.get('/gate-pass'),
        api.get('/purchase-orders', { params: { status: 'APPROVED' } })
      ])
      setList(g.data.data || [])
      setPOs(p.data.data || [])
    } catch (e) {
      toast.error('Logistics Link Failure')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const receivedByPO = (poId) => list.filter(g => g.poId === poId).reduce((sum, g) => sum + (g.receivedQty || 0), 0)

  const availablePOs = pos.filter(p => {
    const orderedQty = p.totalQty || p.quantity || 0
    const alreadyRecv = receivedByPO(p.id)
    return alreadyRecv < orderedQty
  })

  const poOptions = availablePOs.map(p => {
    const orderedQty = p.totalQty || p.quantity || 0
    const alreadyRecv = receivedByPO(p.id)
    const pending = orderedQty - alreadyRecv
    return {
      value: p.id,
      label: p.poNo,
      subLabel: `${p.vendor?.companyName} • Pnd: ${pending} Units`
    }
  })

  const handleExport = () => {
    const headers = [
      { label: 'GATE ID', key: 'gatePassNo' },
      { label: 'PO NO', key: 'po.poNo' },
      { label: 'SUPPLIER', key: 'vendor.companyName' },
      { label: 'VEHICLE', key: 'vehicleNo' },
      { label: 'QTY', key: 'receivedQty' },
      { label: 'DATE', key: 'date' }
    ]
    exportToCSV(list, 'Logistics_Inward_Archive', headers)
    toast.success('Logistics Ledger Exported')
  }

  const save = async () => {
    const tid = toast.loading('Synchronizing Logistics Data...')
    try {
      const po = pos.find(p => p.id === form.poId)
      const orderedQty = po?.totalQty || po?.quantity || 0
      const prevRecv = receivedByPO(form.poId)
      if (prevRecv + parseFloat(form.receivedQty) > orderedQty) {
        throw new Error(`Over-delivery detected. Max allowable: ${orderedQty - prevRecv}`)
      }
      await api.post('/gate-pass', form)
      toast.success('Material Inward Authorized', { id: tid }); setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || e.message || 'Transaction error', { id: tid }) }
  }

  const filtered = list.filter(g => {
    const s = search.toLowerCase()
    const matchSearch = !s || g.gatePassNo?.toLowerCase().includes(s) || g.po?.poNo?.toLowerCase().includes(s) || g.vendor?.companyName?.toLowerCase().includes(s) || g.vehicleNo?.toLowerCase().includes(s)
    const matchVendor = !vendorFilter || g.vendor?.companyName === vendorFilter
    const matchPO = !poFilter || g.po?.poNo === poFilter
    return matchSearch && matchVendor && matchPO
  })

  return (
    <div className="animate-fade-in space-y-10 pb-20 h-full overflow-y-auto custom-scrollbar">
      <PageHeader 
        title="Logistics Inward Register" 
        subtitle="Surveillance of inbound material shipments, vehicle tracking, and gate authorization protocols."
        icon={<Truck size={28} className="text-blue-600" />}
        actions={<>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setForm(blankForm); setModal(true); }}><Plus size={16} /> Record Inward</button>
        </>} 
      />

      <div className="card p-6 flex flex-col xl:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              placeholder="Search by Gate Identity, PO No, Supplier, or Vehicle Matrix..." 
              className="input-field pl-14"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full xl:w-64">
           <SearchableSelect
             placeholder="All Suppliers"
             options={[{ label: 'All Suppliers', value: '' }, ...Array.from(new Set(list.map(g => g.vendor?.companyName))).filter(Boolean).map(s => ({ label: s, value: s }))]}
             value={vendorFilter}
             onChange={v => setVendorFilter(v)}
           />
        </div>
        <button onClick={() => { setSearch(''); setVendorFilter(''); setPoFilter(''); }} className="btn-secondary py-3.5 px-8 transition-all hover:bg-slate-100"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {['Gate Identity','PO Reference','Source Node','Vehicle Matrix','Courier Detail','Logistics Vol','Timeline'].map(h => (
                    <th key={h} className="table-th text-white uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7}><Empty /></td></tr>
                  ) : filtered.map((g, idx) => (
                    <motion.tr 
                      key={g.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-blue-50/40 dark:hover:bg-blue-600/5 transition-all duration-300"
                    >
                      <td className="px-8 py-6 font-mono text-[11px] font-black text-blue-600 tracking-widest">{g.gatePassNo}</td>
                      <td className="py-6 font-mono text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{g.po?.poNo || 'DIRECT'}</td>
                      <td className="py-6">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none">{g.vendor?.companyName}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Supplier Origin</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500"><Truck size={14}/></div>
                           <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase font-mono tracking-widest">{g.vehicleNo}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none">{g.driverName}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{g.driverPhone}</span>
                        </div>
                      </td>
                      <td className="py-6 font-black text-blue-600 text-sm tracking-tighter">{g.receivedQty} <span className="text-[9px] text-slate-400 font-bold ml-1">UNITS</span></td>
                      <td className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{g.date?.slice(0, 10)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INWARD MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title="Logistics Inward Authorization" size="lg">
        <div className="flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
            <div className="p-10 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 shadow-inner">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3"><ClipboardCheck size={16}/> Source Protocol</p>
               <SearchableSelect
                 label="Procurement Link *"
                 placeholder={availablePOs.length === 0 ? 'NO PENDING AUTHORIZATIONS' : 'SEARCH PO IDENTITY...'}
                 options={poOptions}
                 value={form.poId}
                 onChange={(v) => { const po = pos.find(p => p.id === v); setForm(prev => ({ ...prev, poId: v, vendorId: po?.vendorId || '' })) }}
               />
            </div>

            <div className="space-y-8">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Truck size={16}/> Logistics Matrix</p>
               <FormRow cols={2}>
                 <div><label className="label">Vehicle Identity Code *</label><input className="input-field font-black font-mono tracking-widest uppercase" value={form.vehicleNo} onChange={e => set('vehicleNo', e.target.value.toUpperCase())} placeholder="DL-01-AB-1234" /></div>
                 <div><label className="label">Courier / Driver Name *</label><input className="input-field font-black uppercase" value={form.driverName} onChange={e => set('driverName', e.target.value.toUpperCase())} /></div>
               </FormRow>
               <FormRow cols={2}>
                 <div><label className="label">Communication Node (Phone)</label><input className="input-field font-black font-mono" value={form.driverPhone} onChange={e => set('driverPhone', e.target.value)} maxLength={10} /></div>
                 <div><label className="label">National ID (Aadhar)</label><input className="input-field font-black font-mono" value={form.driverAadhar} onChange={e => set('driverAadhar', e.target.value.replace(/\D/g, ''))} maxLength={12} /></div>
               </FormRow>
            </div>

            <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-inner">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3"><Package size={16}/> Load Verification</p>
               <FormRow cols={2}>
                 <div>
                    <label className="label">Inbound Volume *</label>
                    <input type="number" className="input-field font-black" value={form.receivedQty} onChange={e => set('receivedQty', parseFloat(e.target.value) || 0)} />
                    {form.poId && (() => {
                      const po = pos.find(p => p.id === form.poId);
                      const pending = (po?.totalQty || 0) - receivedByPO(form.poId);
                      return <p className="text-[9px] font-black uppercase mt-2 tracking-widest flex items-center gap-2"><Clock size={12} className="text-blue-500"/> Capacity Remaining: <span className={form.receivedQty > pending ? 'text-rose-600' : 'text-emerald-600'}>{pending} Units</span></p>
                    })()}
                 </div>
                 <div><label className="label">Technical Annotations</label><input className="input-field font-black uppercase" value={form.remark} onChange={e => set('remark', e.target.value.toUpperCase())} /></div>
               </FormRow>
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={() => setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[240px] shadow-blue-500/30" onClick={save}>AUTHORIZE LOGISTICS ENTRY</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
