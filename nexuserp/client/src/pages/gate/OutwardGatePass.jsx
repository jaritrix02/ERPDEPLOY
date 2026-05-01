import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogOut, Plus, Search, RotateCcw, 
  MapPin, Truck, User, Phone, 
  CreditCard, Package, Info, ChevronRight, 
  Download, Zap, X, MoreVertical, Printer, Eye
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, SearchableSelect, ExportButton } from '../../components/ui'
import { exportToCSV } from '../../utils/exportUtils'

const blankForm = {
  destination:  '',
  vehicleNo:    '',
  driverName:   '',
  driverPhone:  '',
  driverAadhar: '',
  materialDesc: '',
  qty:          '',
  remark:       ''
}

const Field = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{label}</p>
    <p className="text-[12px] font-black uppercase text-slate-900 dark:text-white tracking-tight">{value || '—'}</p>
  </div>
)

export default function OutwardGatePass() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [selected, setSelected]   = useState(null)
  const [form, setForm]       = useState(blankForm)
  const [saving, setSaving]   = useState(false)

  const [search, setSearch]       = useState('')
  const [destFilter, setDestFilter] = useState('')
  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/gate-pass/outward')
      setList(res.data.data || [])
    } catch (e) {
      toast.error('Outward Logistics Sync Failure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleExport = () => {
    const headers = [
      { label: 'PASS NO', key: 'passNo' },
      { label: 'DESTINATION', key: 'destination' },
      { label: 'VEHICLE', key: 'vehicleNo' },
      { label: 'MATERIAL', key: 'materialDesc' },
      { label: 'QTY', key: 'qty' },
      { label: 'DATE', key: 'date' }
    ]
    exportToCSV(list, 'Logistics_Outward_Archive', headers)
    toast.success('Outward Ledger Exported')
  }

  const save = async () => {
    const tid = toast.loading('Issuing Outward Authorization...')
    try {
      setSaving(true)
      await api.post('/gate-pass/outward', form)
      toast.success('Outward Pass Dispatched', { id: tid }); setModal(false); load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Authorization Failure', { id: tid })
    } finally { setSaving(false) }
  }

  const filtered = list.filter(g => {
    const s = search.toLowerCase()
    const matchSearch = !s || g.passNo?.toLowerCase().includes(s) || g.destination?.toLowerCase().includes(s) || g.vehicleNo?.toLowerCase().includes(s) || g.materialDesc?.toLowerCase().includes(s)
    const matchDest = !destFilter || g.destination === destFilter
    return matchSearch && matchDest
  })

  return (
    <div className="animate-fade-in space-y-10 pb-20 h-full overflow-y-auto custom-scrollbar">
      <PageHeader 
        title="Logistics Outward Register" 
        subtitle="Surveillance of outbound material dispatches, consignee tracking, and gate exit protocols."
        icon={<LogOut size={28} className="text-blue-600" />}
        actions={<>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setForm(blankForm); setModal(true); }}><Plus size={16} /> Issue Out-pass</button>
        </>} 
      />

      <div className="card p-6 flex flex-col xl:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              placeholder="Search by Pass Identity, Destination, Vehicle, or Material SKU..." 
              className="input-field pl-14"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full xl:w-64">
           <SearchableSelect
             placeholder="All Destinations"
             options={[{ label: 'All Destinations', value: '' }, ...Array.from(new Set(list.map(g => g.destination))).filter(Boolean).map(d => ({ label: d, value: d }))]}
             value={destFilter}
             onChange={v => setDestFilter(v)}
           />
        </div>
        <button onClick={() => { setSearch(''); setDestFilter(''); }} className="btn-secondary py-3.5 px-8 transition-all hover:bg-slate-100"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {['Pass Identity','Target Node','Vehicle Matrix','Logistics Vol','Material SKU','Timeline','Actions'].map(h => (
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
                      <td className="px-8 py-6 font-mono text-[11px] font-black text-blue-600 tracking-widest">{g.passNo}</td>
                      <td className="py-6">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">{g.destination}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Consignee Target</span>
                        </div>
                      </td>
                      <td className="py-6">
                         <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500"><Truck size={14}/></div>
                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase font-mono tracking-widest">{g.vehicleNo}</span>
                         </div>
                      </td>
                      <td className="py-6 font-black text-blue-600 text-sm tracking-tighter">{g.qty}</td>
                      <td className="py-6">
                         <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase max-w-[180px] truncate block" title={g.materialDesc}>{g.materialDesc}</span>
                      </td>
                      <td className="py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">{g.date?.slice(0, 10)}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button onClick={() => { setSelected(g); setViewModal(true); }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Eye size={14}/></button>
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

      {/* ISSUE MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title="Logistics Outward Authorization" size="lg">
        <div className="flex flex-col h-[75vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
            <div className="p-10 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 shadow-inner">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3"><MapPin size={16}/> Target Node Protocol</p>
               <FormRow cols={2}>
                 <div><label className="label">Destination / Consignee *</label><input className="input-field font-black uppercase" value={form.destination} onChange={e => setField('destination', e.target.value.toUpperCase())} placeholder="E.G. CLIENT SITE ALPHA" /></div>
                 <div><label className="label">Vehicle Identity Code *</label><input className="input-field font-black font-mono tracking-widest uppercase" value={form.vehicleNo} onChange={e => setField('vehicleNo', e.target.value.toUpperCase())} placeholder="DL-01-AB-1234" /></div>
               </FormRow>
            </div>

            <div className="space-y-8">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><User size={16}/> Courier Portfolio</p>
               <FormRow cols={2}>
                 <div><label className="label">Driver / Courier Name</label><input className="input-field font-black uppercase" value={form.driverName} onChange={e => setField('driverName', e.target.value.toUpperCase())} /></div>
                 <div><label className="label">Communication Node (Phone)</label><input className="input-field font-black font-mono" value={form.driverPhone} onChange={e => setField('driverPhone', e.target.value)} maxLength={10} /></div>
               </FormRow>
               <FormRow cols={2}>
                 <div><label className="label">National ID (Aadhar)</label><input className="input-field font-black font-mono" value={form.driverAadhar} onChange={e => setField('driverAadhar', e.target.value.replace(/\D/g, ''))} maxLength={12} /></div>
                 <div><label className="label">Dispatch Volume *</label><input className="input-field font-black uppercase" value={form.qty} onChange={e => setField('qty', e.target.value.toUpperCase())} placeholder="E.G. 40 NOS / 200 KG" /></div>
               </FormRow>
            </div>

            <div className="space-y-4">
              <label className="label">Material SKU Specification *</label>
              <textarea className="input-field min-h-[100px] font-black uppercase" rows={3} value={form.materialDesc} onChange={e => setField('materialDesc', e.target.value.toUpperCase())} placeholder="Describe items being dispatched for fulfillment..." />
            </div>

            <div>
              <label className="label">Technical Annotations</label>
              <input className="input-field font-black uppercase" value={form.remark} onChange={e => setField('remark', e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={() => setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[240px] shadow-blue-500/30" onClick={save} disabled={saving}>{saving ? 'AUTHORIZING...' : 'PRINT & AUTHORIZE EXIT'}</button>
          </div>
        </div>
      </Modal>

      {/* VIEW MODAL */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Logistics Certification Audit" size="lg">
        {selected && (
          <div className="space-y-10">
            <div className="p-10 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
               <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 blur-[80px] rounded-full" />
               <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Outward Pass Identity</p>
                    <h2 className="text-4xl font-black uppercase tracking-tighter">{selected.passNo}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Genesis Date</p>
                    <p className="text-xl font-black">{selected.date?.slice(0, 10)}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-8">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3"><MapPin size={16}/> Logistics Protocol</p>
                  <div className="grid grid-cols-2 gap-6">
                    <Field label="Consignee Node" value={selected.destination} />
                    <Field label="Dispatch Volume" value={selected.qty} />
                  </div>
                  <Field label="Material SKU Detail" value={selected.materialDesc} />
               </div>
               <div className="space-y-8">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3"><Truck size={16}/> Courier Portfolio</p>
                  <div className="grid grid-cols-2 gap-6">
                    <Field label="Vehicle Identity" value={selected.vehicleNo} />
                    <Field label="Driver Name" value={selected.driverName} />
                    <Field label="Comm Node" value={selected.driverPhone} />
                    <Field label="National ID" value={selected.driverAadhar} />
                  </div>
               </div>
            </div>

            {selected.remark && (
              <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-inner">
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Contextual Annotations</p>
                 <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase leading-relaxed">{selected.remark}</p>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-10 border-t dark:border-white/5">
              <button onClick={() => window.print()} className="btn-primary flex items-center gap-3 px-10 shadow-blue-500/30"><Printer size={18}/> Print Pass</button>
              <button className="btn-secondary px-8" onClick={() => setViewModal(false)}>Close Archive</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
