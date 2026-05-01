import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings2, Plus, Search, RotateCcw, 
  Ruler, Thermometer, Gauge, Activity, 
  Info, Edit3, Trash2, ChevronRight, 
  X, ShieldCheck, Zap, Database
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, Modal, Spinner, Empty, FormRow, SearchableSelect } from '../../components/ui'

const DEFAULT_FORM = { 
  name: '', 
  unit: '', 
  minValue: '', 
  maxValue: '', 
  type: 'RANGE', 
  instrument: '', 
  method: '', 
  description: '' 
}

export default function QCParameters() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/qc-parameters')
      setList(res.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    const tid = toast.loading('Synchronizing Quality Standard...')
    try {
      const payload = { ...form }
      if (payload.type === 'MIN_ONLY') payload.maxValue = null
      if (payload.type === 'MAX_ONLY') payload.minValue = null
      if (payload.type === 'FIXED') payload.maxValue = null

      if (editData) await api.put(`/qc-parameters/${editData.id}`, payload)
      else await api.post('/qc-parameters', payload)
      
      toast.success('Standard Online', { id: tid }); setShowModal(false); load()
    } catch (e) { toast.error('Standard authorization failed', { id: tid }) }
  }

  const deleteParam = async (id) => {
    if (!confirm('Are you sure?')) return
    const tid = toast.loading('Decommissioning Standard...')
    try {
      await api.delete(`/qc-parameters/${id}`)
      toast.success('Decommissioned', { id: tid }); load()
    } catch (e) { toast.error('Standard is currently linked and cannot be removed', { id: tid }) }
  }

  const getRangeDisplay = (p) => {
    if (p.type === 'MIN_ONLY') return `≥ ${p.minValue}`
    if (p.type === 'MAX_ONLY') return `≤ ${p.maxValue}`
    if (p.type === 'FIXED') return `${p.minValue}`
    return `${p.minValue} - ${p.maxValue}`
  }

  const filtered = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <PageHeader 
        title="Quality Control Master" 
        subtitle="Global registry of testing parameters, tolerance bounds, and measuring methodologies."
        icon={<Settings2 size={28} className="text-blue-600" />}
        actions={<button className="btn-primary" onClick={() => { setEditData(null); setForm(DEFAULT_FORM); setShowModal(true) }}><Plus size={16} /> Add Parameter</button>} 
      />

      <div className="card p-5 flex flex-col md:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
            <input 
              placeholder="Search by Parameter Name, Instrument, or Methodology..." 
              className="input-field pl-11"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => setSearch('')} className="btn-secondary py-2.5 px-6"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="col-span-full py-20"><Empty /></div>
            ) : filtered.map((p, idx) => (
              <motion.div 
                key={p.id} 
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: idx * 0.05 }}
                className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] bg-blue-500 opacity-10 transition-transform duration-700 group-hover:scale-150" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Gauge size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditData(p); setForm(p); setShowModal(true) }} className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14}/></button>
                    <button onClick={() => deleteParam(p.id)} className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={14}/></button>
                  </div>
                </div>

                <div className="relative z-10 space-y-5">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{p.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2"><Ruler size={10}/> {p.instrument || 'MANUAL VERIFICATION'}</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compliance Range</span>
                       <span className="px-2 py-0.5 bg-blue-600/10 text-blue-600 rounded-md text-[8px] font-black uppercase">{p.type?.replace(/_/g,' ')}</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                       <span className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none tracking-tighter">{getRangeDisplay(p)}</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase">{p.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t dark:border-white/5 pt-4">
                     <Activity size={12} className="text-blue-500"/> Protocol: {p.method || 'STANDARD PROCEDURE'}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* PARAMETER MODAL */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editData ? "Refine Quality Standard" : "New Quality Standard"} size="lg">
        <div className="flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
            <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14}/> Artifact Specification</p>
              <FormRow cols={2}>
                <div><label className="label">Parameter Identity *</label><input className="input-field font-black uppercase" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} placeholder="E.G. SURFACE ROUGHNESS" /></div>
                <div><label className="label">UOM (Unit of Measure)</label><input className="input-field font-black uppercase" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value.toUpperCase() }))} placeholder="MM, %, KG..." /></div>
              </FormRow>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Ruler size={14}/> Compliance Architecture</p>
              <FormRow cols={2}>
                <SearchableSelect 
                  label="Standardization Modality"
                  options={[
                    { label: 'RANGE (MIN — MAX)', value: 'RANGE' },
                    { label: 'MINIMUM REQUIRED (≥)', value: 'MIN_ONLY' },
                    { label: 'MAXIMUM ALLOWED (≤)', value: 'MAX_ONLY' },
                    { label: 'FIXED VALUE (≡)', value: 'FIXED' }
                  ]}
                  value={form.type}
                  onChange={v => setForm(p => ({ ...p, type: v }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  {(form.type === 'RANGE' || form.type === 'MIN_ONLY' || form.type === 'FIXED') && (
                    <div><label className="label">{form.type === 'FIXED' ? 'Absolute' : 'Minimum'}</label><input type="number" className="input-field font-black" value={form.minValue} onChange={e => setForm(p => ({ ...p, minValue: parseFloat(e.target.value) }))} /></div>
                  )}
                  {(form.type === 'RANGE' || form.type === 'MAX_ONLY') && (
                    <div><label className="label">Maximum</label><input type="number" className="input-field font-black" value={form.maxValue} onChange={e => setForm(p => ({ ...p, maxValue: parseFloat(e.target.value) }))} /></div>
                  )}
                </div>
              </FormRow>
            </div>

            <FormRow cols={2}>
              <div><label className="label">Measuring Apparatus</label><input className="input-field font-bold uppercase" value={form.instrument} onChange={e => setForm(p => ({ ...p, instrument: e.target.value.toUpperCase() }))} placeholder="VERNIER, MICROMETER..." /></div>
              <div><label className="label">Methodology / Standard</label><input className="input-field font-bold uppercase" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value.toUpperCase() }))} placeholder="ISO-9001, ASTM..." /></div>
            </FormRow>

            <div>
              <label className="label">Technical Procedure Notes</label>
              <textarea className="input-field" rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Define the step-by-step verification procedure for this standard..." />
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-3 pt-8 border-t dark:border-white/5 mt-auto">
            <button className="text-xs font-black text-slate-500 uppercase tracking-widest px-8" onClick={() => setShowModal(false)}>Discard</button>
            <button className="btn-primary min-w-[200px] shadow-lg shadow-blue-500/20" onClick={handleSubmit}>AUTHORIZE STANDARD</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
