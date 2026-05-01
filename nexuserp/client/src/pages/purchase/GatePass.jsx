import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow } from '../../components/ui'

export default function GatePass() {
  const [list, setList]   = useState([])
  const [pos, setPOs]     = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState({ poId:'', vendorId:'', vehicleNo:'', driverName:'', receivedQty:0, remark:'' })
  const [selectedPO, setSelectedPO] = useState(null)
  
  // Searchable Dropdown
  const [poSearch, setPOSearch] = useState('')
  const [showPODropdown, setShowPODropdown] = useState(false)
  const poDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
        if (poDropdownRef.current && !poDropdownRef.current.contains(e.target)) setShowPODropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const load = () => Promise.all([api.get('/gate-pass'), api.get('/purchase-orders',{params:{status:'APPROVED'}}), api.get('/vendors')])
    .then(([g,p,v]) => { setList(g.data.data); setPOs(p.data.data); setVendors(v.data.data) })
    .finally(()=>setLoading(false))
  useEffect(() => { load() }, [])

  const handlePOChange = (poId) => {
    const po = pos.find(p => p.id === poId)
    setSelectedPO(po)
    setForm(prev => ({ ...prev, poId, vendorId: po?.vendorId || '' }))
  }

  const save = async () => {
    try {
      await api.post('/gate-pass', form)
      toast.success('Gate pass created'); setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  return (
    <div className="text-black dark:text-white pb-10">
      <PageHeader title="Gate Pass Entry" subtitle={`Tracking ${list.length} inbound material shipments`}
        actions={<button className="btn-primary" onClick={()=>{setForm({poId:'',vendorId:'',vehicleNo:'',driverName:'',receivedQty:0,remark:''});setSelectedPO(null);setPOSearch('');setModal(true)}}>+ New Gate Pass</button>} />
      
      {loading ? <Spinner /> : (
        <div className="card table-container border-b-4 border-black dark:border-white shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-black dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>{['Gate Pass No','PO Reference','Partner','Vehicle No','Driver','Received Qty','Timestamp'].map(h=><th key={h} className="px-6 py-4">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0f172a]">
              {list.length===0 ? <tr><td colSpan={7}><div className="py-20 opacity-30"><Empty /></div></td></tr> : list.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400 tracking-widest">{g.gatePassNo}</td>
                  <td className="px-6 py-4 font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">{g.po?.poNo || 'DIRECT'}</td>
                  <td className="px-6 py-4 font-bold text-black dark:text-white uppercase text-xs">{g.vendor?.companyName}</td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-black dark:text-white">{g.vehicleNo||'—'}</td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{g.driverName||'—'}</td>
                  <td className="px-6 py-4 font-bold text-black dark:text-white text-base">{g.receivedQty}</td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">{g.date?.slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={()=>setModal(false)} title="New Gate Pass Entry" size="lg">
        <div className="space-y-6 text-black dark:text-white p-2">
          <div className="relative" ref={poDropdownRef}>
            <label className="label">1. Linked Purchase Order *</label>
            <input className="input-field font-bold uppercase rounded-xl text-xs" placeholder="Search Order No..." value={poSearch} onFocus={() => setShowPODropdown(true)} onChange={e => { setPOSearch(e.target.value); setShowPODropdown(true); }} />
            {showPODropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                    {pos.filter(p => p.poNo.toLowerCase().includes(poSearch.toLowerCase()) || p.vendor?.companyName.toLowerCase().includes(poSearch.toLowerCase())).map(p => (
                        <div key={p.id} onClick={() => { handlePOChange(p.id); setPOSearch(`${p.poNo} — ${p.vendor?.companyName}`); setShowPODropdown(false); }} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 group">
                            <p className="text-xs font-bold uppercase text-black dark:text-white">{p.poNo} - {p.vendor?.companyName}</p>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">₹{p.totalAmount?.toLocaleString()}</p>
                        </div>
                    ))}
                    {pos.filter(p => p.poNo.toLowerCase().includes(poSearch.toLowerCase()) || p.vendor?.companyName.toLowerCase().includes(poSearch.toLowerCase())).length === 0 && <div className="p-4 text-center text-xs text-black dark:text-white font-bold uppercase">Not found</div>}
                </div>
            )}
          </div>
          {selectedPO && (
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5 flex flex-col gap-1">
              <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Supplier</span><span className="text-[10px] font-bold uppercase">{selectedPO.vendor?.companyName}</span></div>
              <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Order Total</span><span className="text-[10px] font-bold uppercase">₹{selectedPO.totalAmount?.toLocaleString()}</span></div>
            </div>
          )}
          <FormRow cols={2}>
            <div><label className="label">Vehicle Registration No</label><input className="input-field font-mono font-bold uppercase" value={form.vehicleNo} onChange={e=>setForm(p=>({...p,vehicleNo:e.target.value}))} placeholder="DL01AB1234" /></div>
            <div><label className="label">Operator / Driver Name</label><input className="input-field font-bold uppercase" value={form.driverName} onChange={e=>setForm(p=>({...p,driverName:e.target.value}))} /></div>
          </FormRow>
          <FormRow cols={2}>
            <div><label className="label">Received Quantity *</label><input type="number" className="input-field font-bold" value={form.receivedQty} onChange={e=>setForm(p=>({...p,receivedQty:parseFloat(e.target.value)}))} /></div>
            <div><label className="label">Receiving Remark</label><input className="input-field font-bold" value={form.remark} onChange={e=>setForm(p=>({...p,remark:e.target.value}))} /></div>
          </FormRow>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button className="btn-secondary px-8" onClick={()=>setModal(false)}>Discard</button>
            <button className="btn-primary px-12" onClick={save}>Authorize Pass</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
