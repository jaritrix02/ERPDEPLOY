import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, Modal, Spinner, Empty } from '../../components/ui'

export default function PokaYokeMaster() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  
  const [form, setForm] = useState({ 
    processName: '', department: '', defectPrevented: '', 
    mechanism: '', verificationMethod: '', isActive: true 
  })

  const loadData = () => api.get('/ci/pokayokes').then(r => setData(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { loadData() }, [])

  const handleSubmit = async () => {
    try {
      if (editId) await api.put(`/ci/pokayokes/${editId}`, form)
      else await api.post('/ci/pokayokes', form)
      toast.success('Poka-Yoke saved')
      setModal(false)
      loadData()
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving') }
  }

  const deleteRecord = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.delete(`/ci/pokayokes/${id}`)
      toast.success('Deleted')
      loadData()
    } catch (e) { toast.error('Error deleting') }
  }

  return (
    <div className="pb-20">
      <PageHeader title="Poka-Yoke (Mistake Proofing)" subtitle="Manage defect prevention mechanisms across processes"
        actions={<button className="btn-primary" onClick={() => { setEditId(null); setForm({ processName: '', department: '', defectPrevented: '', mechanism: '', verificationMethod: '', isActive: true }); setModal(true) }}>+ Add Poka-Yoke</button>} />

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden shadow-2xl">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-500">
              <tr><th className="px-6 py-4 text-left">PY No & Process</th><th className="px-6 py-4 text-left">Defect Prevented</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.length === 0 ? <tr><td colSpan={4}><Empty /></td></tr> : data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded mr-2">{item.pyNo}</span>
                    <span className="font-black uppercase text-sm">{item.processName}</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.department}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-red-500">{item.defectPrevented}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditId(item.id); setForm(item); setModal(true) }} className="text-blue-500 font-black text-[10px] uppercase mr-4 hover:underline">Edit</button>
                    <button onClick={() => deleteRecord(item.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Poka-Yoke" : "New Poka-Yoke Mechanism"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label text-[10px] font-black uppercase">Process Name *</label><input className="input-field font-black uppercase" value={form.processName} onChange={e => setForm(p => ({ ...p, processName: e.target.value }))} placeholder="e.g. Assembly Line 1" /></div>
            <div><label className="label text-[10px] font-black uppercase">Department</label><input className="input-field font-bold uppercase" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
          </div>
          
          <div><label className="label text-[10px] font-black uppercase text-red-500">Defect Being Prevented *</label><input className="input-field font-bold" value={form.defectPrevented} onChange={e => setForm(p => ({ ...p, defectPrevented: e.target.value }))} placeholder="e.g. Reverse polarity insertion" /></div>
          <div><label className="label text-[10px] font-black uppercase text-emerald-500">Poka-Yoke Mechanism (Solution) *</label><textarea rows={2} className="input-field font-bold" value={form.mechanism} onChange={e => setForm(p => ({ ...p, mechanism: e.target.value }))} placeholder="e.g. Guide pin added to fixture so part only fits one way" /></div>
          
          <div className="grid grid-cols-2 gap-4">
             <div><label className="label text-[10px] font-black uppercase">Verification Method</label><input className="input-field font-bold" value={form.verificationMethod} onChange={e => setForm(p => ({ ...p, verificationMethod: e.target.value }))} placeholder="e.g. Daily shift start check" /></div>
             <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-5 h-5 accent-primary-600" />
                  <span className="text-sm font-black uppercase">Mechanism Active</span>
                </label>
             </div>
          </div>

          <button className="btn-primary w-full mt-4" onClick={handleSubmit}>Save Poka-Yoke</button>
        </div>
      </Modal>
    </div>
  )
}
