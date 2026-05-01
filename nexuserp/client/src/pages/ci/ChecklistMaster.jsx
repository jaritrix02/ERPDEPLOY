import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, Modal, Spinner, Empty } from '../../components/ui'

export default function ChecklistMaster() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  
  const [form, setForm] = useState({ title: '', department: '', type: 'QUALITY', points: [''] })

  const loadData = () => api.get('/ci/checklists').then(r => setData(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { loadData() }, [])

  const handleSubmit = async () => {
    try {
      const payload = { ...form, points: JSON.stringify(form.points.filter(p => p.trim() !== '')) }
      if (editId) await api.put(`/ci/checklists/${editId}`, payload)
      else await api.post('/ci/checklists', payload)
      toast.success('Checklist saved')
      setModal(false)
      loadData()
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving') }
  }

  const deleteRecord = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.delete(`/ci/checklists/${id}`)
      toast.success('Deleted')
      loadData()
    } catch (e) { toast.error('Error deleting') }
  }

  const updatePoint = (idx, val) => {
    const newPoints = [...form.points]
    newPoints[idx] = val
    setForm(p => ({ ...p, points: newPoints }))
  }

  const addPoint = () => setForm(p => ({ ...p, points: [...p.points, ''] }))
  const removePoint = (idx) => setForm(p => ({ ...p, points: p.points.filter((_, i) => i !== idx) }))

  return (
    <div className="pb-20">
      <PageHeader title="Checklist Master" subtitle="Standardize operational checklists"
        actions={<button className="btn-primary" onClick={() => { setEditId(null); setForm({ title: '', department: '', type: 'QUALITY', points: [''] }); setModal(true) }}>+ Add Checklist</button>} />

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden shadow-2xl">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-500">
              <tr><th className="px-6 py-4 text-left">Title</th><th className="px-6 py-4 text-left">Type & Dept</th><th className="px-6 py-4 text-center">Points</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.length === 0 ? <tr><td colSpan={4}><Empty /></td></tr> : data.map(item => {
                const pts = typeof item.points === 'string' ? JSON.parse(item.points) : item.points
                return (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 font-black uppercase">{item.title}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">{item.type}</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{item.department || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-400">{pts?.length || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditId(item.id); setForm({ ...item, points: pts }); setModal(true) }} className="text-blue-500 font-black text-[10px] uppercase mr-4 hover:underline">Edit</button>
                    <button onClick={() => deleteRecord(item.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Delete</button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Checklist" : "New Checklist"} size="md">
        <div className="space-y-4">
          <div><label className="label text-[10px] font-black uppercase">Title *</label><input className="input-field font-black uppercase" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label text-[10px] font-black uppercase">Type</label><select className="input-field font-bold" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}><option value="QUALITY">QUALITY</option><option value="SAFETY">SAFETY</option><option value="MAINTENANCE">MAINTENANCE</option><option value="PROCESS">PROCESS</option></select></div>
            <div><label className="label text-[10px] font-black uppercase">Department</label><input className="input-field font-bold uppercase" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
          </div>
          <div>
            <label className="label text-[10px] font-black uppercase">Checklist Points</label>
            {form.points.map((pt, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="input-field font-bold flex-1" placeholder="Describe checkpoint..." value={pt} onChange={e => updatePoint(i, e.target.value)} />
                <button className="btn-secondary px-3" onClick={() => removePoint(i)}>✕</button>
              </div>
            ))}
            <button className="text-[10px] font-black text-primary-500 hover:underline uppercase mt-2" onClick={addPoint}>+ Add Point</button>
          </div>
          <button className="btn-primary w-full mt-4" onClick={handleSubmit}>Save Checklist</button>
        </div>
      </Modal>
    </div>
  )
}
