import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty } from '../../components/ui'

export default function Units() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ unitName:'', unitCode:'' })
  const [editing, setEditing] = useState(null)

  const load = () => api.get('/units').then(r => setList(r.data.data)).finally(()=>setLoading(false))
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      if (editing) await api.put(`/units/${editing}`, form)
      else await api.post('/units', form)
      toast.success('Saved'); setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  return (
    <div>
      <PageHeader title="Units of Measurement"
        actions={<button className="btn-primary" onClick={() => { setForm({unitName:'',unitCode:''}); setEditing(null); setModal(true) }}>+ Add Unit</button>} />
      {loading ? <Spinner /> : (
        <div className="card table-container">
          <table className="w-full">
            <thead className="table-head"><tr>{['Unit Name','Unit Code','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>
              {list.length===0 ? <tr><td colSpan={3}><Empty /></td></tr> : list.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="table-td font-medium">{u.unitName}</td>
                  <td className="table-td"><span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{u.unitCode}</span></td>
                  <td className="table-td"><button onClick={() => { setForm({unitName:u.unitName,unitCode:u.unitCode}); setEditing(u.id); setModal(true) }} className="text-xs text-primary-600 hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit Unit':'Add Unit'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Unit Name *</label><input className="input-field" value={form.unitName} onChange={e=>setForm(p=>({...p,unitName:e.target.value}))} placeholder="e.g. Kilogram" /></div>
          <div><label className="label">Unit Code *</label><input className="input-field" value={form.unitCode} onChange={e=>setForm(p=>({...p,unitCode:e.target.value.toUpperCase()}))} placeholder="e.g. KG" /></div>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></div>
        </div>
      </Modal>
    </div>
  )
}
