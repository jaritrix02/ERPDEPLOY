import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, Plus, Search, Filter, RotateCcw, 
  Printer, Barcode as BarcodeIcon, Edit3, Trash2, 
  Warehouse, Calendar, Tag, DollarSign, Info, 
  ChevronRight, Download, Zap, X, MoreVertical, Box
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, SearchableSelect, ExportButton, CalendarPicker } from '../../components/ui'
import JsBarcode from 'jsbarcode'
import { exportToCSV } from '../../utils/exportUtils'

const blank = { itemId:'', storeId:'', batchNo:'', mfgDate:'', expDate:'', quantity:0, rate:0, size:'', remark:'' }

export default function Products() {
  const [list, setList]   = useState([])
  const [items, setItems] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [barcodeModal, setBarcodeModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  
  const [listSearch, setListSearch] = useState('')
  const [filterStore, setFilterStore] = useState('')
  const barcodeRef = useRef(null)
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const load = async () => {
    setLoading(true)
    try {
      const [p, i, s] = await Promise.all([
        api.get('/products', { params: filterStore ? { storeId:filterStore } : {} }),
        api.get('/items'),
        api.get('/stores')
      ])
      setList(p.data.data)
      setItems(i.data.data)
      setStores(s.data.data)
    } catch (e) {
      toast.error('Inventory Feed Failure')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterStore])

  useEffect(() => {
    if (barcodeModal && selectedProduct && barcodeRef.current) {
      setTimeout(() => {
        try {
          JsBarcode(barcodeRef.current, selectedProduct.barcode, {
            format: 'CODE128', width: 2, height: 60,
            displayValue: true, fontSize: 12, margin: 10
          })
        } catch(e) { console.log(e) }
      }, 100)
    }
  }, [barcodeModal, selectedProduct])

  const printBarcode = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head><title>Dispatch Label</title></head>
        <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
          <h2 style="margin-bottom:0; text-transform:uppercase; font-size:14px; letter-spacing:2px;">${selectedProduct.item?.itemName}</h2>
          <p style="margin-top:5px; font-weight:bold; color:#666; font-size:10px;">BATCH: ${selectedProduct.batchNo || 'N/A'}</p>
          <img src="${barcodeRef.current.toDataURL()}" style="margin:20px 0; max-width:80%;" />
          <p style="font-family:monospace; font-weight:bold; letter-spacing:4px; font-size:12px;">${selectedProduct.barcode}</p>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  const handleExport = () => {
    const headers = [
      { label: 'SKU CODE', key: 'item.itemCode' },
      { label: 'ITEM NAME', key: 'item.itemName' },
      { label: 'WAREHOUSE', key: 'store.storeName' },
      { label: 'BATCH', key: 'batchNo' },
      { label: 'QUANTITY', key: 'quantity' },
      { label: 'RATE', key: 'rate' }
    ]
    exportToCSV(list, 'Inventory_Artifacts', headers)
    toast.success('Inventory Ledger Exported')
  }

  const save = async () => {
    const tid = toast.loading(editing ? 'Refining Archive...' : 'Recording New Artifact...')
    try {
      if (editing) await api.put(`/products/${editing}`, form)
      else await api.post('/products', form)
      toast.success('Inventory Synchronized', { id: tid }); setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Transaction failure', { id: tid }) }
  }

  const remove = async (product) => {
    if (!confirm(`Delete stock batch ${product.batchNo || product.barcode}?`)) return
    try {
      await api.delete(`/products/${product.id}`)
      toast.success('Stock batch deleted')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to delete stock batch')
    }
  }

  const filteredList = list.filter(p => 
    p.item?.itemName.toLowerCase().includes(listSearch.toLowerCase()) ||
    p.item?.itemCode.toLowerCase().includes(listSearch.toLowerCase()) ||
    p.batchNo?.toLowerCase().includes(listSearch.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <PageHeader 
        title="Inventory Artifacts" 
        subtitle="Surveillance of physical stock, batch genealogy, and secure vault storage nodes."
        icon={<Box size={28} className="text-blue-600" />}
        actions={<>
          <div className="w-64">
            <SearchableSelect 
              placeholder="All Warehouses"
              options={[{ label: 'All Warehouses', value: '' }, ...stores.map(s => ({ label: s.storeName, value: s.id }))]}
              value={filterStore}
              onChange={val => setFilterStore(val)}
            />
          </div>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setForm(blank); setEditing(null); setModal(true) }}><Plus size={16} /> Register stock</button>
        </>} 
      />

      <div className="card p-6 flex flex-col md:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              placeholder="Search by SKU Code, Name, Batch No, or Barcode ID..." 
              className="input-field pl-14"
              value={listSearch}
              onChange={e => setListSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => {setListSearch(''); setFilterStore('');}} className="btn-secondary py-3.5 px-8 transition-all hover:bg-slate-100"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {['Artifact Identity','Warehouse / Location','Batch Genealogy','Inventory Volume','Valuation','Actions'].map(h => (
                    <th key={h} className="table-th text-white uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {filteredList.length === 0 ? (
                    <tr><td colSpan={6}><Empty /></td></tr>
                  ) : filteredList.map((p, idx) => (
                    <motion.tr 
                      key={p.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-blue-50/40 dark:hover:bg-blue-600/5 transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{p.item?.itemName}</span>
                          <span className="text-[9px] font-mono font-black text-blue-600 uppercase mt-2 tracking-widest">SKU: {p.item?.itemCode}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center"><Warehouse size={14} /></div>
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{p.store?.storeName}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none tracking-tighter">{p.batchNo || '—'}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-tighter">MFG: {p.mfgDate?.slice(0,10) || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900 dark:text-white">{p.quantity}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">{p.item?.unit?.unitCode}</span>
                        </div>
                      </td>
                      <td className="py-6 font-black text-slate-900 dark:text-white text-xs tracking-tighter">₹ {p.rate?.toLocaleString()}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button onClick={() => { setSelectedProduct(p); setBarcodeModal(true) }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><BarcodeIcon size={14}/></button>
                          <button onClick={() => { setForm({...p, mfgDate:p.mfgDate?.slice(0,10)||'', expDate:p.expDate?.slice(0,10)||''}); setEditing(p.id); setModal(true) }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={14}/></button>
                          <button onClick={() => remove(p)} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={14}/></button>
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

      {/* STOCK REGISTRATION MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Refine Inventory Artifact' : 'Archive New Stock Protocol'} size="lg">
        <div className="flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
            <FormRow cols={2}>
              <SearchableSelect 
                label="Item Specification *"
                placeholder="Search SKU Code/Name..."
                options={items.map(i => ({ value: i.id, label: `${i.itemCode} — ${i.itemName}`, subLabel: i.itemType }))}
                value={form.itemId}
                onChange={v => setForm(p => ({...p, itemId: v}))}
              />
              <SearchableSelect 
                label="Target Warehouse Node *"
                placeholder="Select Storage Location..."
                options={stores.map(s => ({ value: s.id, label: s.storeName }))}
                value={form.storeId}
                onChange={v => setForm(p => ({...p, storeId: v}))}
              />
            </FormRow>

            <div className="p-10 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 space-y-8 shadow-inner">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3"><Tag size={14}/> Batch Genealogy</p>
               <FormRow cols={3}>
                 <div><label className="label">Batch Reference</label><input className="input-field font-black uppercase tracking-widest" value={form.batchNo} onChange={e=>set('batchNo', e.target.value.toUpperCase())} /></div>
                 <CalendarPicker label="Manufacturing Date" value={form.mfgDate} onChange={v => set('mfgDate', v)} />
                 <CalendarPicker label="Expiration Date" value={form.expDate} onChange={v => set('expDate', v)} />
               </FormRow>
            </div>

            <FormRow cols={3}>
              <div><label className="label">Registry Volume *</label><input type="number" className="input-field font-black" value={form.quantity} onChange={e=>set('quantity', parseFloat(e.target.value))} /></div>
              <div><label className="label">Acquisition Rate (₹) *</label><div className="relative"><span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span><input type="number" className="input-field pl-10 font-black" value={form.rate} onChange={e=>set('rate', parseFloat(e.target.value))} /></div></div>
              <div><label className="label">Artifact Dimension</label><input className="input-field font-black uppercase" value={form.size} onChange={e=>set('size', e.target.value.toUpperCase())} /></div>
            </FormRow>

            <div>
              <label className="label">Technical Annotations</label>
              <textarea className="input-field min-h-[120px]" rows={4} value={form.remark} onChange={e=>set('remark', e.target.value)} placeholder="Provide contextual annotations for audit trails..." />
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={() => setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[240px] shadow-blue-500/30" onClick={save}>{editing ? 'ARCHIVE REFINEMENTS' : 'AUTHORIZE REGISTRY'}</button>
          </div>
        </div>
      </Modal>

      {/* BARCODE MODAL */}
      <Modal open={barcodeModal} onClose={() => setBarcodeModal(false)} title="Security Asset Tracking" size="sm">
        {selectedProduct && (
          <div className="text-center space-y-10 py-10">
            <div className="space-y-3">
              <div className="w-20 h-20 bg-blue-600/10 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/10"><BarcodeIcon size={40}/></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">{selectedProduct.item?.itemName}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BATCH: {selectedProduct.batchNo || 'GENERIC'} • {selectedProduct.store?.storeName}</p>
            </div>

            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] inline-block group hover:scale-105 transition-transform duration-500">
               <svg ref={barcodeRef} className="mx-auto"></svg>
               <p className="mt-8 font-mono text-sm font-black text-slate-900 tracking-[0.4em]">{selectedProduct.barcode}</p>
            </div>

            <div className="flex flex-col gap-4 max-w-xs mx-auto">
               <button onClick={printBarcode} className="btn-primary py-5 shadow-blue-500/40"><Printer size={18}/> Dispatch Physical Label</button>
               <button onClick={() => setBarcodeModal(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors">Dismiss Surveillance</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
