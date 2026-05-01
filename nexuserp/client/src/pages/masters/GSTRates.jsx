import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow } from '../../components/ui'

export default function GSTRates() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ type:'CGST', rateName:'', rate:'' })
  const [editing, setEditing] = useState(null)

  const load = () => api.get('/gst').then(r => setList(r.data.data)).finally(()=>setLoading(false))
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      const payload = { ...form, rate: parseFloat(form.rate) }
      if (editing) await api.put(`/gst/${editing}`, payload)
      else await api.post('/gst', payload)
      toast.success('Saved'); setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  const typeColors = { CGST:'bg-blue-100 text-blue-700', SGST:'bg-green-100 text-green-700', IGST:'bg-purple-100 text-purple-700' }

  return (
    <div>
      <PageHeader title="GST Rates"
        actions={<button className="btn-primary" onClick={() => { setForm({type:'CGST',rateName:'',rate:''}); setEditing(null); setModal(true) }}>+ Add GST Rate</button>} />
      {loading ? <Spinner /> : (
        <div className="card table-container">
          <table className="w-full">
            <thead className="table-head"><tr>{['Type','Rate Name','Rate (%)','Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>
              {list.length===0 ? <tr><td colSpan={4}><Empty /></td></tr> : list.map(g => (
                <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="table-td"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${typeColors[g.type]}`}>{g.type}</span></td>
                  <td className="table-td font-medium">{g.rateName}</td>
                  <td className="table-td font-semibold">{g.rate}%</td>
                  <td className="table-td"><button onClick={() => { setForm({type:g.type,rateName:g.rateName,rate:String(g.rate)}); setEditing(g.id); setModal(true) }} className="text-xs text-primary-600 hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit GST Rate':'Add GST Rate'} size="sm">
        <div className="space-y-4">
          <div><label className="label">GST Type *</label>
            <select className="input-field" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
              <option value="CGST">CGST</option><option value="SGST">SGST</option><option value="IGST">IGST</option>
            </select>
          </div>
          <div><label className="label">Rate Name *</label><input className="input-field" value={form.rateName} onChange={e=>setForm(p=>({...p,rateName:e.target.value}))} placeholder="e.g. CGST 9%" /></div>
          <div><label className="label">Rate (%) *</label><input type="number" className="input-field" value={form.rate} onChange={e=>setForm(p=>({...p,rate:e.target.value}))} placeholder="e.g. 9" /></div>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></div>
        </div>
      </Modal>
    </div>
  )
}
