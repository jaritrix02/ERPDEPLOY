import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, SearchableSelect } from '../../components/ui'

export default function GRNPage() {
  const [list, setList]   = useState([])
  const [pos, setPOs]     = useState([])
  const [gps, setGPs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState({ poId:'', gatePassId:'', receivedQty:0, acceptedQty:0, rejectedQty:0 })
  const [search, setSearch] = useState('')

  const load = () => Promise.all([api.get('/grn'), api.get('/purchase-orders',{params:{status:'APPROVED'}}), api.get('/gate-pass')])
    .then(([g,p,gp]) => { setList(g.data.data); setPOs(p.data.data); setGPs(gp.data.data) }).finally(()=>setLoading(false))
  
  useEffect(() => { load() }, [])

  const save = async () => {
    try { await api.post('/grn', form); toast.success('GRN created'); setModal(false); load() }
    catch(e) { toast.error(e.response?.data?.message||'Error') }
  }
  
  const approve = async (id, status) => {
    await api.put(`/grn/${id}/approve`, { status }); toast.success(`GRN ${status}`); load()
  }

  const filtered = list.filter(g => 
    !search || 
    g.grnNo?.toLowerCase().includes(search.toLowerCase()) ||
    g.po?.poNo?.toLowerCase().includes(search.toLowerCase()) ||
    g.po?.vendor?.companyName?.toLowerCase().includes(search.toLowerCase())
  )

  const poOptions = pos.map(p => ({ value: p.id, label: p.poNo, subLabel: p.vendor?.companyName }))
  const gpOptions = gps.map(g => ({ value: g.id, label: g.gatePassNo, subLabel: `${g.vehicleNo} | ${g.vendor?.companyName}` }))

  return (
    <div className="pb-10 text-black dark:text-white">
      <PageHeader title="GRN — Goods Receipt Note" subtitle="Material inspection and receipt authorization"
        actions={<button className="btn-primary" onClick={()=>{setForm({poId:'',gatePassId:'',receivedQty:0,acceptedQty:0,rejectedQty:0});setModal(true)}}>+ Create GRN</button>} />
      
      <div className="card p-4 mb-6 flex items-center gap-4 border-t-4 border-emerald-500 shadow-xl">
        <div className="relative flex-1">
          <input 
            className="input-field pl-12" 
            placeholder="SEARCH BY GRN NO, PO NO OR SUPPLIER..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button onClick={() => setSearch('')} className="btn-secondary h-[50px] px-6 rounded-xl text-[10px]">RESET</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="card table-container shadow-2xl">
          <table className="w-full text-left">
            <thead className="table-head">
              <tr>{['GRN No','PO Ref','Received','Accepted','Rejected','Status','Date','Action'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1a2236]">
              {filtered.length===0 ? <tr><td colSpan={8}><div className="py-20 opacity-30"><Empty /></div></td></tr> : filtered.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-50 dark:border-white/5">
                  <td className="px-6 py-3 font-mono text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest">{g.grnNo}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                        <span className="font-black text-black dark:text-white uppercase text-[10px] tracking-tight">{g.po?.poNo}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{g.po?.vendor?.companyName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-black text-black dark:text-white text-sm">{g.receivedQty}</td>
                  <td className="px-6 py-3 font-black text-emerald-500 text-sm">{g.acceptedQty}</td>
                  <td className="px-6 py-3 font-black text-rose-500 text-sm">{g.rejectedQty}</td>
                  <td className="px-6 py-3"><Badge status={g.status} /></td>
                  <td className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{g.date?.slice(0,10)}</td>
                  <td className="px-6 py-3">
                    {g.status==='PENDING' && (
                      <div className="flex gap-3">
                        <button onClick={()=>approve(g.id,'APPROVED')} className="text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-500">Approve</button>
                        <button onClick={()=>approve(g.id,'REJECTED')} className="text-[10px] font-bold uppercase text-rose-600 hover:text-rose-500">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Create Inspection Receipt (GRN)" size="lg">
        <div className="space-y-4 text-black dark:text-white">
          <SearchableSelect 
            label="1. Link Purchase Order *"
            placeholder="SEARCH PO NO..."
            options={poOptions}
            value={form.poId}
            onChange={val => setForm(f => ({...f, poId: val}))}
          />

          <SearchableSelect 
            label="2. Gate Pass Reference (Optional)"
            placeholder="SEARCH GATE PASS..."
            options={gpOptions}
            value={form.gatePassId}
            onChange={val => setForm(f => ({...f, gatePassId: val}))}
          />

          <FormRow cols={3}>
            <div><label className="label">Received Qty *</label><input type="number" className="input-field" value={form.receivedQty} onChange={e=>setForm(p=>({...p,receivedQty:parseFloat(e.target.value)}))} /></div>
            <div><label className="label">Accepted Qty *</label><input type="number" className="input-field" value={form.acceptedQty} onChange={e=>setForm(p=>({...p,acceptedQty:parseFloat(e.target.value)}))} /></div>
            <div><label className="label">Rejected Qty</label><input type="number" className="input-field" value={form.rejectedQty} onChange={e=>setForm(p=>({...p,rejectedQty:parseFloat(e.target.value)}))} /></div>
          </FormRow>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5 mt-4">
            <button className="btn-secondary px-8" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-primary px-12" onClick={save}>Issue GRN</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
