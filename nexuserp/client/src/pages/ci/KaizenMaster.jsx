import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, Modal, Spinner, Empty } from '../../components/ui'

export default function KaizenMaster() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  
  const [form, setForm] = useState({ 
    title: '', department: '', area: '', 
    problemStatement: '', solution: '', benefits: '', 
    status: 'OPEN', implementedBy: '', implementedDate: '' 
  })

  const loadData = () => api.get('/ci/kaizens').then(r => setData(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { loadData() }, [])

  const handleSubmit = async () => {
    try {
      const payload = { ...form }
      if (payload.implementedDate) payload.implementedDate = new Date(payload.implementedDate).toISOString()
      else delete payload.implementedDate

      if (editId) await api.put(`/ci/kaizens/${editId}`, payload)
      else await api.post('/ci/kaizens', payload)
      toast.success('Kaizen saved')
      setModal(false)
      loadData()
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving') }
  }

  const deleteRecord = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.delete(`/ci/kaizens/${id}`)
      toast.success('Deleted')
      loadData()
    } catch (e) { toast.error('Error deleting') }
  }

  return (
    <div className="pb-20">
      <PageHeader title="Kaizen Records" subtitle="Track continuous improvement ideas and implementation"
        actions={<button className="btn-primary" onClick={() => { setEditId(null); setForm({ title: '', department: '', area: '', problemStatement: '', solution: '', benefits: '', status: 'OPEN', implementedBy: '', implementedDate: '' }); setModal(true) }}>+ Add Kaizen</button>} />

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden shadow-2xl">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-500">
              <tr><th className="px-6 py-4 text-left">Kaizen No</th><th className="px-6 py-4 text-left">Title & Dept</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.length === 0 ? <tr><td colSpan={4}><Empty /></td></tr> : data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-black text-primary-600">{item.kaizenNo}</td>
                  <td className="px-6 py-4">
                    <p className="font-black uppercase text-sm">{item.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{item.department} | Area: {item.area}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'IMPLEMENTED' ? 'bg-emerald-100 text-emerald-700' : item.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditId(item.id); setForm({ ...item, implementedDate: item.implementedDate ? item.implementedDate.split('T')[0] : '' }); setModal(true) }} className="text-blue-500 font-black text-[10px] uppercase mr-4 hover:underline">Edit</button>
                    <button onClick={() => deleteRecord(item.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Kaizen" : "Log New Kaizen"} size="lg">
        <div className="space-y-4">
          <div><label className="label text-[10px] font-black uppercase">Title *</label><input className="input-field font-black uppercase" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label text-[10px] font-black uppercase">Department</label><input className="input-field font-bold uppercase" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
            <div><label className="label text-[10px] font-black uppercase">Area / Machine</label><input className="input-field font-bold uppercase" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label text-[10px] font-black uppercase">Problem Statement *</label><textarea rows={3} className="input-field font-bold" value={form.problemStatement} onChange={e => setForm(p => ({ ...p, problemStatement: e.target.value }))} /></div>
            <div><label className="label text-[10px] font-black uppercase">Proposed Solution *</label><textarea rows={3} className="input-field font-bold" value={form.solution} onChange={e => setForm(p => ({ ...p, solution: e.target.value }))} /></div>
          </div>

          <div><label className="label text-[10px] font-black uppercase">Expected / Actual Benefits</label><input className="input-field font-bold" value={form.benefits} onChange={e => setForm(p => ({ ...p, benefits: e.target.value }))} placeholder="e.g. Saved 2 mins per cycle, Improved Safety" /></div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div><label className="label text-[10px] font-black uppercase">Status</label>
              <select className="input-field font-bold" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="OPEN">OPEN</option><option value="IMPLEMENTED">IMPLEMENTED</option><option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div><label className="label text-[10px] font-black uppercase">Implemented By</label><input className="input-field font-bold uppercase" value={form.implementedBy} onChange={e => setForm(p => ({ ...p, implementedBy: e.target.value }))} /></div>
            <div><label className="label text-[10px] font-black uppercase">Implementation Date</label><input type="date" className="input-field font-bold" value={form.implementedDate} onChange={e => setForm(p => ({ ...p, implementedDate: e.target.value }))} /></div>
          </div>

          <button className="btn-primary w-full mt-4" onClick={handleSubmit}>Save Kaizen</button>
        </div>
      </Modal>
    </div>
  )
}
