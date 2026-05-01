import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Warehouse, Plus, Search, RotateCcw, 
  Settings, Package, Database, Shield, 
  ChevronRight, ArrowRight, X, Info
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, SearchableSelect } from '../../components/ui'

const storeTypeLabel = { RAW_MATERIAL:'Raw Material Repository', SEMI_FINISHED_1:'Intermediary Depot 01', SEMI_FINISHED_2:'Intermediary Depot 02', FINISHED:'Finished Material Archive' }

export default function Stores() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ storeName:'', storeType:'RAW_MATERIAL' })
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => api.get('/stores').then(r => setList(r.data.data)).finally(()=>setLoading(false))
  useEffect(() => { load() }, [])

  const save = async () => {
    const tid = toast.loading('Synchronizing Configuration...')
    try {
      if (!form.storeName) throw new Error('Identity required')
      if (editing) await api.put(`/stores/${editing}`, form)
      else await api.post('/stores', form)
      toast.success('Warehouse Established Successfully', { id: tid })
      setModal(false); load()
    } catch(e) { toast.error(e.message || 'Configuration Failure', { id: tid }) }
  }

  const filteredList = list.filter(s => 
    s.storeName.toLowerCase().includes(search.toLowerCase()) ||
    s.storeCode.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <PageHeader 
        title="Warehouse Infrastructure" 
        subtitle="Strategic management of physical storage locations and inventory segregation centers."
        icon={<Warehouse size={28} className="text-blue-600" />}
        actions={<button className="btn-primary" onClick={() => { setForm({storeName:'',storeType:'RAW_MATERIAL'}); setEditing(null); setModal(true) }}><Plus size={16} /> Establish Center</button>} 
      />

      {/* Premium Search Infrastructure */}
      <div className="card p-5 flex flex-col md:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
            <input 
              placeholder="Search by Warehouse ID, Official Designation, or Type..." 
              className="input-field pl-11"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => setSearch('')} className="btn-secondary py-2.5 px-6"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredList.length === 0 ? (
              <div className="col-span-full py-20"><Empty /></div>
            ) : filteredList.map((s, idx) => (
              <motion.div 
                key={s.id} 
                initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay: idx * 0.05 }}
                className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                {/* Dynamic Gradient Background */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-20 transition-transform duration-700 group-hover:scale-150 ${s.storeType === 'FINISHED' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${s.storeType === 'FINISHED' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'}`}>
                    <Database size={24} />
                  </div>
                  <button onClick={() => { setForm({storeName:s.storeName,storeType:s.storeType}); setEditing(s.id); setModal(true) }} className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Settings size={14}/></button>
                </div>

                <div className="relative z-10 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 leading-none">REF ID: {s.storeCode}</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{s.storeName}</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-4">
                    <span className={`inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border w-fit ${
                        s.storeType === 'RAW_MATERIAL' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 
                        s.storeType === 'FINISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                        'bg-slate-50 text-slate-500 border-slate-100 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                    }`}>
                        {storeTypeLabel[s.storeType] || s.storeType.replace(/_/g,' ')}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                       <Shield size={12}/> Secure Access Protocol Active
                    </div>
                  </div>
                </div>

                {/* Arrow Icon on Hover */}
                <div className="absolute bottom-8 right-8 text-slate-300 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                  <ArrowRight size={20}/>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* CONFIGURATION MODAL */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Refine Center Parameters':'Establish New Infrastructure Center'} size="sm">
        <div className="space-y-8">
          <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={14}/> Architectural Context</p>
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed">Unique warehouse identities are used for physical item segregation and batch genealogy tracking.</p>
          </div>

          <div className="space-y-6">
            <div><label className="label">Official Center Designation *</label><input className="input-field font-black uppercase" value={form.storeName} onChange={e=>setForm(p=>({...p,storeName:e.target.value.toUpperCase()}))} placeholder="E.G. RAW MATERIAL MAIN" /></div>
            <div>
              <label className="label">Infrastructural Classification *</label>
              <SearchableSelect 
                options={[
                  { label: 'Raw Material Repository', value: 'RAW_MATERIAL' },
                  { label: 'Intermediary Floor Depot 01', value: 'SEMI_FINISHED_1' },
                  { label: 'Intermediary Floor Depot 02', value: 'SEMI_FINISHED_2' },
                  { label: 'Finished Goods Archive', value: 'FINISHED' }
                ]}
                value={form.storeType}
                onChange={v => setForm(p => ({...p, storeType: v}))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-8 border-t dark:border-white/5">
            <button className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white px-8" onClick={() => setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[200px] shadow-lg shadow-blue-500/20" onClick={save}>{editing ? 'REFINE CENTER' : 'ESTABLISH CENTER'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
