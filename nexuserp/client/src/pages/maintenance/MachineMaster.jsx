import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, Modal, Spinner, Empty, Badge } from '../../components/ui'

export default function MachineMaster() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', location: '', department: '', status: 'OPERATIONAL', make: '', model: '', checkpoints: [] })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/machines')
      setList(res.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    try {
      if (editData) {
        await api.put(`/machines/${editData.id}`, form)
        toast.success('Machine updated')
      } else {
        await api.post('/machines', form)
        toast.success('Machine added')
      }
      setShowModal(false)
      load()
    } catch (e) { toast.error('Error saving machine') }
  }

  const addCheckpoint = () => {
    setForm(p => ({ ...p, checkpoints: [...p.checkpoints, { parameter: '', frequency: 'DAILY' }] }))
  }

  const exportExcel = () => {
    const headers = ['Code', 'Name', 'Location', 'Department', 'Status', 'Make', 'Model']
    const rows = list.map(m => [m.code, m.name, m.location, m.department, m.status, m.make, m.model])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'Machine_Master.csv'; a.click()
  }

  const importCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const lines = text.split('\n').slice(1) // Skip headers
      for (let line of lines) {
        const [code, name, location, department, status, make, model] = line.split(',')
        if (code && name) {
          await api.post('/machines', { code, name, location, department, status: status || 'OPERATIONAL', make, model })
        }
      }
      toast.success('Imported successfully')
      load()
    }
    reader.readAsText(file)
  }

  return (
    <div className="pb-20 text-black dark:text-white">
      <PageHeader title="Machine Master" subtitle="Manage plant assets and maintenance checkpoints"
        actions={<>
          <input type="file" id="import-csv" className="hidden" accept=".csv" onChange={importCSV} />
          <button className="btn-secondary px-6" onClick={() => document.getElementById('import-csv').click()}>Import CSV</button>
          <button className="btn-secondary px-6" onClick={exportExcel}>Export CSV</button>
          <button className="btn-primary px-8" onClick={() => { setEditData(null); setForm({ code: '', name: '', location: '', department: '', status: 'OPERATIONAL', make: '', model: '', checkpoints: [] }); setShowModal(true) }}>+ Add Machine</button>
        </>} />

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden shadow-2xl border-b-4 border-slate-900">
          <table className="w-full text-left">
            <thead className="bg-black text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Machine Context</th>
                <th className="px-6 py-4">Location / Dept</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.length === 0 ? <tr><td colSpan={4}><Empty /></td></tr> : list.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-black text-slate-400 tracking-tighter uppercase">{m.code}</p>
                    <p className="font-black text-sm uppercase mt-1">{m.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{m.location}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{m.department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={m.status === 'OPERATIONAL' ? 'APPROVED' : 'REJECTED'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditData(m); setForm({ ...m, checkpoints: m.checkpoints || [] }); setShowModal(true) }} className="text-primary-500 font-black uppercase text-[10px] hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Register/Update Machine" size="lg">
        <div className="space-y-8 text-black dark:text-white">
          <div className="grid grid-cols-2 gap-6">
            <div><label className="label text-[10px] font-bold uppercase mb-1.5">Machine Code *</label>
              <input className="input-field font-black uppercase" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="MCH-001" /></div>
            <div><label className="label text-[10px] font-bold uppercase mb-1.5">Machine Name *</label>
              <input className="input-field font-black uppercase" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="HYDRAULIC PRESS 500T" /></div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div><label className="label text-[10px] font-bold uppercase mb-1.5">Location</label>
              <input className="input-field font-bold uppercase" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
            <div><label className="label text-[10px] font-bold uppercase mb-1.5">Department</label>
              <input className="input-field font-bold uppercase" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
          </div>

          <div className="border-t dark:border-slate-800 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Maintenance Checkpoints</h4>
              <button onClick={addCheckpoint} className="text-primary-500 font-bold uppercase text-[10px]">+ Add Checkpoint</button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {form.checkpoints.map((cp, i) => (
                <div key={i} className="flex gap-4 items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <input className="flex-1 bg-transparent text-xs font-bold uppercase outline-none" placeholder="Parameter (e.g. Oil Level)" value={cp.parameter} onChange={e => {
                    const n = [...form.checkpoints]; n[i].parameter = e.target.value; setForm(p => ({ ...p, checkpoints: n }))
                  }} />
                  <select className="bg-transparent text-[10px] font-black uppercase outline-none" value={cp.frequency} onChange={e => {
                    const n = [...form.checkpoints]; n[i].frequency = e.target.value; setForm(p => ({ ...p, checkpoints: n }))
                  }}>
                    <option value="DAILY">DAILY</option><option value="WEEKLY">WEEKLY</option><option value="MONTHLY">MONTHLY</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
            <button className="btn-secondary px-8" onClick={() => setShowModal(false)}>Discard</button>
            <button className="btn-primary px-12" onClick={handleSubmit}>Save Machine</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
