import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty } from '../../components/ui'

export default function PurchaseReturns() {
  const [list, setList] = useState([])
  const [grns, setGRNs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ grnId:'', returnQty:0, reason:'' })

  // Searchable Dropdown States
  const [grnSearch, setGRNSearch] = useState('')
  const [showGRNDropdown, setShowGRNDropdown] = useState(false)
  const grnDropdownRef = useRef(null)

  const load = () => Promise.all([api.get('/purchase-returns'),api.get('/grn')])
    .then(([r,g])=>{setList(r.data.data);setGRNs(g.data.data)}).finally(()=>setLoading(false))
  useEffect(()=>{
    load()
    const handleClickOutside = (e) => {
        if (grnDropdownRef.current && !grnDropdownRef.current.contains(e.target)) setShowGRNDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  },[])

  const save = async () => {
    try { await api.post('/purchase-returns', form); toast.success('Return created'); setModal(false); load() }
    catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  return (
    <div>
      <PageHeader title="Purchase Returns"
        actions={<button className="btn-primary" onClick={()=>{setForm({grnId:'',returnQty:0,reason:''});setModal(true)}}>+ New Return</button>} />
      {loading ? <Spinner /> : (
        <div className="card table-container">
          <table className="w-full">
            <thead className="table-head"><tr>{['Return No','GRN Ref','Vendor','Return Qty','Reason','Date'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>
              {list.length===0 ? <tr><td colSpan={6}><Empty /></td></tr> : list.map(r=>(
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="table-td font-mono text-xs font-bold text-red-500">{r.returnNo}</td>
                  <td className="table-td font-mono text-xs">{r.grn?.grnNo}</td>
                  <td className="table-td text-sm">{r.grn?.po?.vendor?.companyName||'—'}</td>
                  <td className="table-td font-semibold text-red-500">{r.returnQty}</td>
                  <td className="table-td text-sm text-gray-500">{r.reason}</td>
                  <td className="table-td text-xs text-gray-400">{r.date?.slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={()=>setModal(false)} title="New Purchase Return" size="sm">
        <div className="space-y-4">
          <div className="relative" ref={grnDropdownRef}>
            <label className="label">GRN Reference *</label>
            <input className="input-field font-bold uppercase rounded-xl" placeholder="Search GRN..." value={grnSearch} onFocus={()=>setShowGRNDropdown(true)} onChange={e=>{setGRNSearch(e.target.value);setShowGRNDropdown(true)}} />
            {showGRNDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                    {grns.filter(g => g.grnNo.toLowerCase().includes(grnSearch.toLowerCase())).map(g => (
                        <div key={g.id} onClick={() => { setForm(p=>({...p, grnId: g.id})); setGRNSearch(g.grnNo); setShowGRNDropdown(false); }} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 group">
                            <p className="text-xs font-bold uppercase text-black dark:text-white">{g.grnNo}</p>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">{g.po?.vendor?.companyName}</p>
                        </div>
                    ))}
                </div>
            )}
          </div>
          <div><label className="label">Return Quantity *</label><input type="number" className="input-field" value={form.returnQty} onChange={e=>setForm(p=>({...p,returnQty:parseFloat(e.target.value)}))} /></div>
          <div><label className="label">Reason *</label><textarea className="input-field" rows={3} value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} placeholder="Reason for return: damaged, excess, wrong item..." /></div>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn-danger" onClick={save}>Create Return</button></div>
        </div>
      </Modal>
    </div>
  )
}
