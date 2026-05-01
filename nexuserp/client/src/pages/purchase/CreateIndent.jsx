import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FilePlus, ArrowLeft, Send, Package, Activity,
  User, Calendar, Clipboard, Trash2, 
  Plus, Search, Info, CheckCircle2, ChevronRight 
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, FormRow, SearchableSelect, CalendarPicker, Spinner } from '../../components/ui'

const emptyItem = { itemId:'', stockInHand:0, requestQty:1, lastVendor:'', lastPurchaseDate:'', lastPrice:'', remark:'' }

export default function CreateIndent() {
  const navigate = useNavigate()
  const [indentType, setIndentType] = useState('OPEN_INDENT')
  const [employees, setEmployees]   = useState([])
  const [items, setItems]           = useState([])
  const [form, setForm] = useState({ requestedById:'', dueDate:'', remarks:'', orderId:'' })
  const [indentItems, setIndentItems] = useState([{ ...emptyItem }])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    Promise.all([
      api.get('/employees'),
      api.get('/items')
    ]).then(([empRes, itemRes]) => {
      setEmployees(empRes.data.data)
      setItems(itemRes.data.data)
    }).finally(() => setLoading(false))
  }, [])

  const addRow    = () => setIndentItems(p => [...p, { ...emptyItem }])
  const removeRow = (i) => setIndentItems(p => p.filter((_,idx) => idx !== i))

  const updateItem = (idx, key, val) => {
    setIndentItems(p => p.map((it, i) => i === idx ? { ...it, [key]: val } : it))
  }

  const submit = async () => {
    if (!form.requestedById) { toast.error('Select requester portfolio'); return }
    if (indentItems.some(i => !i.itemId || i.requestQty <= 0)) { toast.error('Ensure all line items are specified correctly'); return }
    
    setSaving(true)
    const tid = toast.loading('Synchronizing Requisition...')
    try {
      await api.post('/indents', { ...form, indentType, items: indentItems })
      toast.success('Material Indent Dispatched Successfully', { id: tid })
      navigate('/purchase/indent')
    } catch(e) { 
      toast.error(e.response?.data?.message || 'Transaction Failure', { id: tid }) 
    } finally { setSaving(false) }
  }

  const typeLabels = { OPEN_INDENT:'General Requisition', AGAINST_ORDER:'Against Sales Order', PRODUCTION:'Production Component' }
  const typeDescs  = { OPEN_INDENT:'Unlinked material request for general utility.', AGAINST_ORDER:'Derived from an active customer sales agreement.', PRODUCTION:'Requirement for active shop-floor manufacturing.' }

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Spinner /></div>

  return (
    <div className="animate-fade-in space-y-10 pb-20 max-w-[1400px] mx-auto">
      <PageHeader 
        title="Raise Material Indent" 
        subtitle="Initialize a formal request for material procurement or internal allocation."
        icon={<FilePlus size={28} className="text-blue-600" />}
        actions={<button className="btn-secondary" onClick={() => navigate('/purchase/indent')}><ArrowLeft size={14} /> Back to Ledger</button>} 
      />

      {/* High-Fidelity Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(typeLabels).map(([type, label]) => (
          <button 
            key={type} 
            onClick={() => setIndentType(type)}
            className={`group relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-500 border-2 ${indentType===type ? 'border-blue-600 bg-blue-600/5 shadow-2xl shadow-blue-500/10' : 'border-slate-100 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-900 bg-white/50 dark:bg-slate-900/50'}`}
          >
            <div className={`mb-4 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${indentType===type ? 'bg-blue-600 text-white rotate-12 scale-110' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-blue-500'}`}>
              {type === 'OPEN_INDENT' ? <Package size={20}/> : type === 'AGAINST_ORDER' ? <Clipboard size={20}/> : <Activity size={20}/>}
            </div>
            <h3 className={`text-sm font-black uppercase tracking-tight ${indentType===type ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>{label}</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-2 leading-relaxed">{typeDescs[type]}</p>
            {indentType === type && <div className="absolute top-4 right-4 text-blue-600"><CheckCircle2 size={20}/></div>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Side: Header Context */}
        <div className="lg:col-span-1 space-y-8">
          <div className="card p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-2xl">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Info size={14} className="text-blue-500"/> Originator Context
            </h3>
            <div className="space-y-6">
              <SearchableSelect 
                label="Requested By Portfolio *"
                placeholder="Search Name or Code..."
                options={employees.map(e => ({ value: e.id, label: `${e.employeeCode} — ${e.name}`, subLabel: e.department }))}
                value={form.requestedById}
                onChange={v => setForm(p => ({...p, requestedById: v}))}
              />
              <CalendarPicker 
                label="Required Deployment Date" 
                value={form.dueDate} 
                onChange={v => setForm(p => ({...p, dueDate: v}))} 
              />
              {indentType === 'AGAINST_ORDER' && (
                <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
                  <label className="label">Order Link Reference</label>
                  <input className="input-field" placeholder="Sales Order No." value={form.orderId} onChange={e=>setForm(p=>({...p,orderId:e.target.value}))} />
                </motion.div>
              )}
              <div>
                <label className="label">Acquisition Rationale</label>
                <textarea className="input-field" rows={4} value={form.remarks} onChange={e=>setForm(p=>({...p,remarks:e.target.value}))} placeholder="Briefly state why this material is being requested..." />
              </div>
            </div>
          </div>

          <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10">
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Auto-Verification Active</p>
             <p className="text-[11px] font-bold text-slate-500 leading-relaxed">Line items will be cross-referenced with active inventory and last acquisition prices to ensure procurement integrity.</p>
          </div>
        </div>

        {/* Right Side: Line Items Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden shadow-2xl bg-white dark:bg-slate-900">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/2">
               <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2"><Package size={14}/> Material Specification Breakdown</h3>
               <button onClick={addRow} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"><Plus size={12}/> Append SKU</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-head">
                  <tr className="bg-slate-900 text-white">
                    <th className="px-6 py-4 text-[10px] uppercase">Item Portfolio</th>
                    <th className="px-4 py-4 text-center text-[10px] uppercase w-32">Stock</th>
                    <th className="px-4 py-4 text-center text-[10px] uppercase w-32">Demand</th>
                    <th className="px-6 py-4 text-right text-[10px] uppercase">Last Cost</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  <AnimatePresence>
                    {indentItems.map((row, idx) => (
                      <motion.tr 
                        key={idx} 
                        initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                        className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                      >
                        <td className="px-6 py-4">
                          <SearchableSelect 
                            minimal={true}
                            placeholder="Identify Material..."
                            options={items.map(i => ({ value: i.id, label: `${i.itemCode} — ${i.itemName}`, subLabel: i.itemType }))}
                            value={row.itemId}
                            onChange={val => updateItem(idx, 'itemId', val)}
                          />
                          <div className="mt-2 pl-2">
                             <input className="bg-transparent border-none text-[10px] font-bold text-slate-400 focus:outline-none w-full" placeholder="Internal remark for this item..." value={row.remark} onChange={e=>updateItem(idx, 'remark', e.target.value)} />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center">
                            <input type="number" className="w-20 text-center bg-slate-100 dark:bg-white/5 border-none rounded-lg py-2 text-xs font-black text-slate-500" value={row.stockInHand} onChange={e=>updateItem(idx,'stockInHand',parseFloat(e.target.value)||0)} />
                            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Available</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-center">
                            <input type="number" className="w-20 text-center bg-blue-600/10 border-2 border-blue-500/20 rounded-lg py-2 text-xs font-black text-blue-600 focus:border-blue-600 transition-all" value={row.requestQty} onChange={e=>updateItem(idx,'requestQty',parseFloat(e.target.value)||0)} />
                            <span className="text-[9px] font-bold text-blue-500 mt-1 uppercase tracking-tighter">Required</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <div className="relative">
                              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">₹</span>
                              <input type="number" className="w-24 text-right bg-transparent border-b border-slate-200 dark:border-white/10 py-1 pl-4 text-xs font-black text-slate-900 dark:text-white" value={row.lastPrice} onChange={e=>updateItem(idx,'lastPrice',parseFloat(e.target.value)||'')} />
                            </div>
                            <input className="mt-1 text-right bg-transparent border-none text-[8px] font-black text-slate-400 uppercase tracking-widest focus:outline-none" placeholder="LAST VENDOR" value={row.lastVendor} onChange={e=>updateItem(idx, 'lastVendor', e.target.value)} />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {indentItems.length > 1 && (
                            <button onClick={()=>removeRow(idx)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={14}/></button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {indentItems.length === 0 && <div className="py-20 flex flex-col items-center opacity-20"><Package size={48} className="mb-4"/><p className="text-[10px] font-black uppercase tracking-widest">No SKUs listed for requisition</p></div>}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
             <button className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all px-6" onClick={()=>navigate('/purchase/indent')}>Discard Draft</button>
             <button className="btn-primary min-w-[200px] shadow-2xl shadow-blue-500/20" onClick={submit} disabled={saving}>
               <Send size={16} className={saving ? 'animate-pulse' : ''} /> {saving ? 'Dispatching...' : 'Dispatch Requisition'}
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
