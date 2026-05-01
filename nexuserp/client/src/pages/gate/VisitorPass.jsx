import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow } from '../../components/ui'

export default function VisitorPass() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ 
    visitorName: '',
    purpose: '',
    contactNo: '',
    idProof: '',
    whomToMeet: '',
    inTime: new Date().toLocaleTimeString(),
    date: new Date().toISOString().split('T')[0]
  })

  const [search, setSearch] = useState('')

  const load = () => {
    setTimeout(() => {
        setList([
            { id: 1, name: 'Amit Sharma', purpose: 'Machine Maintenance', contact: '9876543210', meet: 'Prashant (Maintenance)', inTime: '10:15 AM', outTime: '12:30 PM', date: '2026-04-22' },
            { id: 2, name: 'John Doe', purpose: 'Audit', contact: '9988776655', meet: 'Rajesh (Admin)', inTime: '11:00 AM', outTime: '-', date: '2026-04-22' }
        ])
        setLoading(false)
    }, 500)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    toast.success('Visitor Entry Recorded')
    setModal(false)
  }

  const filtered = list.filter(v => 
    !search || 
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.purpose?.toLowerCase().includes(search.toLowerCase()) ||
    v.contact?.toLowerCase().includes(search.toLowerCase()) ||
    v.meet?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="text-black dark:text-white pb-10">
      <PageHeader title="Visitor Gate Pass" subtitle="Recording entry/exit of guests and service personnel"
        actions={<button className="btn-primary" onClick={()=>setModal(true)}>+ New Visitor</button>} />
      
      <div className="card p-4 mb-6 flex items-center gap-4 border-t-4 border-purple-500 shadow-xl">
        <div className="relative flex-1">
          <input 
            className="input-field pl-12" 
            placeholder="SEARCH BY VISITOR NAME, PURPOSE, CONTACT OR WHOM TO MEET..." 
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
              <tr>{['Visitor Name','Purpose','Contact','Whom to Meet','In Time','Out Time','Date'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1a2236]">
              {list.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-50 dark:border-white/5">
                  <td className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-black text-black dark:text-white uppercase text-[11px] tracking-tight">{v.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{v.contact}</span>
                      </div>
                  </td>
                  <td className="px-6 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">{v.purpose}</td>
                  <td className="px-6 py-3 text-xs font-bold text-black dark:text-white uppercase">{v.contact}</td>
                  <td className="px-6 py-3 font-black text-blue-600 dark:text-blue-400 uppercase text-[10px] tracking-tighter">{v.meet}</td>
                  <td className="px-6 py-3 font-black text-green-600 dark:text-green-400 text-[10px]">{v.inTime}</td>
                  <td className="px-6 py-3 font-black text-red-600 dark:text-red-400 text-[10px]">{v.outTime}</td>
                  <td className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{v.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Visitor Registration" size="lg">
        <div className="space-y-4 text-black dark:text-white">
          <FormRow cols={2}>
            <div><label className="label">Visitor Full Name *</label><input className="input-field font-bold uppercase" value={form.visitorName} onChange={e=>setForm(p=>({...p,visitorName:e.target.value}))} /></div>
            <div><label className="label">Mobile Number *</label><input className="input-field font-bold" value={form.contactNo} onChange={e=>setForm(p=>({...p,contactNo:e.target.value}))} /></div>
          </FormRow>
          <FormRow cols={2}>
            <div><label className="label">Whom to Meet (Employee/Dept) *</label><input className="input-field font-bold uppercase" value={form.whomToMeet} onChange={e=>setForm(p=>({...p,whomToMeet:e.target.value}))} /></div>
            <div><label className="label">ID Proof (Aadhar/PAN/Driving) *</label><input className="input-field font-bold uppercase" value={form.idProof} onChange={e=>setForm(p=>({...p,idProof:e.target.value}))} /></div>
          </FormRow>
          <div><label className="label">Purpose of Visit *</label><textarea className="input-field font-bold h-20" value={form.purpose} onChange={e=>setForm(p=>({...p,purpose:e.target.value}))}></textarea></div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5 mt-4">
            <button className="btn-secondary px-8" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-primary px-12" onClick={save}>Issue Visitor Badge</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
