import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty } from '../../components/ui'

export default function MRNPage() {
  const [list, setList] = useState([])
  const [grns, setGRNs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ grnId:'', remark:'' })

  // Searchable Dropdown States
  const [grnSearch, setGRNSearch] = useState('')
  const [showGRNDropdown, setShowGRNDropdown] = useState(false)
  const grnDropdownRef = useRef(null)

  const load = () => Promise.all([api.get('/mrn'), api.get('/grn',{params:{status:'APPROVED'}})])
    .then(([m,g]) => { setList(m.data.data); setGRNs(g.data.data) }).finally(()=>setLoading(false))
  useEffect(() => {
    load()
    const handleClickOutside = (e) => {
        if (grnDropdownRef.current && !grnDropdownRef.current.contains(e.target)) setShowGRNDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const save = async () => {
    try { await api.post('/mrn', form); toast.success('MRN created'); setModal(false); load() }
    catch(e) { toast.error(e.response?.data?.message||'Error') }
  }
  const updateStatus = async (id, status) => {
    await api.put(`/mrn/${id}`, { status }); toast.success(`MRN ${status}`); load()
  }

  return (
    <div>
      <PageHeader title="MRN — Material Receipt Note"
        actions={<button className="btn-primary" onClick={()=>{setForm({grnId:'',remark:''});setModal(true)}}>+ Create MRN</button>} />
      {loading ? <Spinner /> : (
        <div className="card table-container">
          <table className="w-full">
            <thead className="table-head"><tr>{['MRN No','GRN Ref','Status','Date','Remark','Action'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>
              {list.length===0 ? <tr><td colSpan={6}><Empty /></td></tr> : list.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="table-td font-mono text-xs font-bold text-primary-600">{m.mrnNo}</td>
                  <td className="table-td font-mono text-xs text-gray-500">{m.grn?.grnNo}</td>
                  <td className="table-td"><Badge status={m.status} /></td>
                  <td className="table-td text-xs text-gray-400">{m.date?.slice(0,10)}</td>
                  <td className="table-td text-xs text-gray-500">{m.remark||'—'}</td>
                  <td className="table-td">
                    {m.status==='PENDING' && (
                      <div className="flex gap-2">
                        <button onClick={()=>updateStatus(m.id,'APPROVED')} className="text-xs text-green-600 hover:underline">Approve</button>
                        <button onClick={()=>updateStatus(m.id,'REJECTED')} className="text-xs text-red-500 hover:underline">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={()=>setModal(false)} title="Create MRN" size="sm">
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
          <div><label className="label">Remark</label><textarea className="input-field" rows={2} value={form.remark} onChange={e=>setForm(p=>({...p,remark:e.target.value}))} /></div>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn-primary" onClick={save}>Create MRN</button></div>
        </div>
      </Modal>
    </div>
  )
}
