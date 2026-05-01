import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeftRight, Plus, Search, RotateCcw, 
  Warehouse, ArrowUpRight, ArrowDownLeft, 
  FileText, Activity, Info, ChevronRight, X
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, SearchableSelect } from '../../components/ui'

export default function StockMovements() {
  const [list, setList]     = useState([])
  const [products, setProducts] = useState([])
  const [stores, setStores]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState({ productId:'', itemId:'', movementType:'IN', quantity:0, fromStoreId:'', toStoreId:'', remark:'' })
  
  const [listSearch, setListSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/movements'),
      api.get('/products'),
      api.get('/stores')
    ]).then(([m,p,s]) => { setList(m.data.data); setProducts(p.data.data); setStores(s.data.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    const tid = toast.loading('Recording Movement...')
    try {
      if(!form.productId || !form.quantity) throw new Error('Mandatory fields missing')
      await api.post('/movements', form)
      toast.success('Transaction Dispatched', { id: tid }); setModal(false); load()
    } catch(e) { toast.error(e.message || 'Error', { id: tid }) }
  }

  const filteredList = list.filter(m => 
    m.item?.itemName.toLowerCase().includes(listSearch.toLowerCase()) ||
    m.product?.barcode?.toLowerCase().includes(listSearch.toLowerCase()) ||
    m.movementType.toLowerCase().includes(listSearch.toLowerCase()) ||
    m.remark?.toLowerCase().includes(listSearch.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <PageHeader 
        title="Stock Movements" 
        subtitle="End-to-end traceability of inventory intake, issuance, and warehouse transfers."
        icon={<ArrowLeftRight size={28} className="text-blue-600" />}
        actions={<button className="btn-primary" onClick={() => { setForm({productId:'',itemId:'',movementType:'IN',quantity:0,fromStoreId:'',toStoreId:'',remark:''}); setProductSearch(''); setModal(true) }}><Plus size={16} /> Record Transaction</button>} 
      />

      <div className="card p-5 flex flex-col md:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
            <input 
              placeholder="Filter by SKU Name, Barcode ID, Operation, or Remarks..." 
              className="input-field pl-11"
              value={listSearch}
              onChange={e => setListSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => setListSearch('')} className="btn-secondary py-2.5 px-6"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>{['Timeline','Material Specification','Operation','Quantity','Contextual Routing','Audit Notes'].map(h=><th key={h} className="table-th text-white uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {filteredList.length === 0 ? (
                    <tr><td colSpan={6}><Empty /></td></tr>
                  ) : filteredList.map((m, idx) => (
                    <motion.tr 
                      key={m.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(m.date).toLocaleDateString('en-IN')}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(m.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">{m.item?.itemName}</span>
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase mt-1 tracking-tighter">BARCODE: {m.product?.barcode?.slice(-8)}</span>
                        </div>
                      </td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${m.movementType === 'IN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : m.movementType === 'OUT' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'}`}>
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-5">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{m.quantity}</span>
                        <span className="text-[9px] font-bold text-slate-400 ml-1 uppercase">{m.item?.unit?.unitCode}</span>
                      </td>
                      <td className="py-5">
                        <div className="flex flex-col gap-1.5">
                          {m.fromStore && <div className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase"><ArrowUpRight size={12}/> {m.fromStore.storeName}</div>}
                          {m.toStore && <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase"><ArrowDownLeft size={12}/> {m.toStore.storeName}</div>}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase italic tracking-tighter leading-tight max-w-[200px] truncate">{m.remark || '—'}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TRANSACTION MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title="Log Inventory Transaction" size="lg">
        <div className="flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
            <SearchableSelect 
              label="Asset Portfolio Specification *"
              placeholder="Search SKU Code/Name/Batch..."
              options={products.map(p => ({ value: p.id, label: `${p.item?.itemCode} — ${p.item?.itemName}`, subLabel: `Batch: ${p.batchNo || 'N/A'} | Stock: ${p.quantity} | ${p.store?.storeName}` }))}
              value={form.productId}
              onChange={v => { const p = products.find(x=>x.id===v); setForm(prev => ({ ...prev, productId: v, itemId: p?.itemId || '' })) }}
            />
            
            <FormRow cols={2}>
              <SearchableSelect 
                label="Operation Modality *"
                options={[
                  { label: 'IN — Intake Receipt', value: 'IN' },
                  { label: 'OUT — Dispatch Issue', value: 'OUT' },
                  { label: 'TRANSFER — Store Reallocation', value: 'TRANSFER' }
                ]}
                value={form.movementType}
                onChange={v => setForm(p => ({...p, movementType: v}))}
              />
              <div><label className="label">Transaction Volume *</label><input type="number" className="input-field font-black" value={form.quantity} onChange={e=>setForm(p=>({...p, quantity: parseFloat(e.target.value)}))} /></div>
            </FormRow>

            <AnimatePresence mode="wait">
              <motion.div key={form.movementType} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Warehouse size={14}/> Contextual Routing</p>
                <FormRow cols={2}>
                  {(form.movementType === 'OUT' || form.movementType === 'TRANSFER') && (
                    <SearchableSelect 
                      label="Source Warehouse"
                      placeholder="Select Origin..."
                      options={stores.map(s => ({ value: s.id, label: s.storeName }))}
                      value={form.fromStoreId}
                      onChange={v => setForm(p => ({...p, fromStoreId: v}))}
                    />
                  )}
                  {(form.movementType === 'IN' || form.movementType === 'TRANSFER') && (
                    <SearchableSelect 
                      label="Destination Warehouse"
                      placeholder="Select Target..."
                      options={stores.map(s => ({ value: s.id, label: s.storeName }))}
                      value={form.toStoreId}
                      onChange={v => setForm(p => ({...p, toStoreId: v}))}
                    />
                  )}
                </FormRow>
              </motion.div>
            </AnimatePresence>
            
            <div>
              <label className="label">Audit Annotation</label>
              <textarea className="input-field" rows={4} value={form.remark} onChange={e=>setForm(p=>({...p, remark: e.target.value}))} placeholder="State the rationale for this movement (e.g., Against PO #102)..." />
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-3 pt-8 border-t dark:border-white/5 mt-auto">
            <button className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white px-8" onClick={() => setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[200px] shadow-lg shadow-blue-500/20" onClick={save}>AUTHORIZE TRANSACTION</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
