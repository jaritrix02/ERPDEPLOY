import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow, Badge } from '../../components/ui'

const blank = { itemName:'', itemType:'SEMI_FINISHED', unitId:'', gstId:'', description:'', minStockLevel:0 }

export default function SemiFinished() {
  const { user } = useSelector(s => s.auth)
  const isAdmin = user?.role === 'ADMIN'

  const [items, setItems] = useState([])
  const [units, setUnits] = useState([])
  const [gsts,  setGsts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(blank)
  const [editing, setEditing] = useState(null)

  const [search, setSearch]   = useState('')
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const itemDropdownRef = useRef(null)

  const [unitSearch, setUnitSearch] = useState('')
  const [showUnitDropdown, setShowUnitDropdown] = useState(false)
  const unitDropdownRef = useRef(null)

  const [gstSearch, setGstSearch] = useState('')
  const [showGstDropdown, setShowGstDropdown] = useState(false)
  const gstDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
        if (itemDropdownRef.current && !itemDropdownRef.current.contains(e.target)) setShowItemDropdown(false)
        if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target)) setShowUnitDropdown(false)
        if (gstDropdownRef.current && !gstDropdownRef.current.contains(e.target)) setShowGstDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const load = () => Promise.all([
    api.get('/items'),
    api.get('/units'),
    api.get('/gst')
  ]).then(([i,u,g]) => { 
    setItems(i.data.data.filter(it => it.itemType === 'SEMI_FINISHED')); 
    setUnits(u.data.data); 
    setGsts(g.data.data) 
  }).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const set = (k,v) => setForm(p => ({...p,[k]:v}))

  const openAdd  = () => { setForm(blank); setEditing(null); setUnitSearch(''); setGstSearch(''); setModal(true) }
  const openEdit = it => { 
    setForm({...it}); 
    setEditing(it.id); 
    setUnitSearch(it.unit ? `${it.unit.unitName} (${it.unit.unitCode})` : '');
    setGstSearch(it.gst ? `${it.gst.type} — ${it.gst.rate}%` : '');
    setModal(true) 
  }

  const save = async () => {
    try {
      if (editing) await api.put(`/items/${editing}`, form)
      else         await api.post('/items', form)
      toast.success(editing ? 'Semi-Finished updated' : 'Semi-Finished added')
      setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const del = async id => {
    if (!isAdmin) return toast.error('Only ADMIN can delete items')
    if (!confirm('Are you sure?')) return
    try {
        await api.delete(`/items/${id}`)
        toast.success('Deleted'); load()
    } catch (e) { toast.error('Failed to delete') }
  }

  const filtered = items.filter(i =>
    (i.itemName.toLowerCase().includes(search.toLowerCase()) || i.itemCode.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="text-black dark:text-white pb-10">
      <PageHeader title="Semi-Finished Master" subtitle={`Managing ${items.length} in-process materials`}
        actions={<>
          <div className="relative" ref={itemDropdownRef}>
            <input className="input-field w-64 font-bold rounded-xl" placeholder="Search Materials..." value={search} onFocus={() => setShowItemDropdown(true)} onChange={e => { setSearch(e.target.value); setShowItemDropdown(true); }} />
            {showItemDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                    {items.filter(i => i.itemName.toLowerCase().includes(search.toLowerCase()) || i.itemCode.toLowerCase().includes(search.toLowerCase())).map(i => (
                        <div key={i.id} onClick={() => { setSearch(i.itemName); setShowItemDropdown(false); }} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 group text-left">
                            <p className="text-xs font-bold uppercase text-black dark:text-white">{i.itemCode} - {i.itemName}</p>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">SEMI-FINISHED</p>
                        </div>
                    ))}
                </div>
            )}
          </div>
          <button className="btn-primary" onClick={openAdd}>+ Add SFG</button>
        </>} />

      {loading ? <Spinner /> : (
        <div className="card table-container border-b-4 border-black dark:border-white shadow-2xl">
          <table className="w-full text-left">
            <thead className="table-head bg-black dark:bg-slate-900">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">SF Code</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Unit</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0f172a]">
              {filtered.length===0 ? <tr><td colSpan={4}><div className="py-20 opacity-30"><Empty /></div></td></tr> : filtered.map(it => (
                <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400 tracking-widest">{it.itemCode}</td>
                  <td className="px-6 py-4 font-bold text-black dark:text-white uppercase text-xs">{it.itemName}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center text-slate-500 dark:text-slate-400">{it.unit?.unitCode}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEdit(it)} className="text-[10px] font-bold uppercase text-blue-600 hover:text-blue-500 transition-colors">Edit</button>
                      {isAdmin && <button onClick={() => del(it.id)} className="text-[10px] font-bold uppercase text-red-600 hover:text-red-500 transition-colors">Remove</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Update Semi-Finished' : 'Register New SFG'} size="xl">
        <div className="space-y-6 text-black dark:text-white p-2">
          <FormRow cols={2}>
            <div>
                <label className="label">Item Type (Read Only)</label>
                <input className="input-field bg-slate-100 dark:bg-slate-800/50 font-bold" readOnly value="SEMI_FINISHED" />
            </div>
            <div>
              <label className="label">System Code</label>
              <input className="input-field bg-slate-50 dark:bg-slate-800/50 font-mono font-bold" readOnly value={form.itemCode || 'Auto: SF-XXX'} />
            </div>
          </FormRow>
          <div><label className="label">Item Name *</label><input className="input-field font-bold uppercase" value={form.itemName} onChange={e => set('itemName',e.target.value)} /></div>
          <FormRow cols={2}>
            <div className="relative" ref={unitDropdownRef}>
              <label className="label">Unit *</label>
              <input className="input-field font-bold uppercase rounded-xl" placeholder="Search Unit..." value={unitSearch} onFocus={()=>setShowUnitDropdown(true)} onChange={e=>{setUnitSearch(e.target.value);setShowUnitDropdown(true)}} />
              {showUnitDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                      {units.filter(u => u.unitName.toLowerCase().includes(unitSearch.toLowerCase()) || u.unitCode.toLowerCase().includes(unitSearch.toLowerCase())).map(u => (
                          <div key={u.id} onClick={() => { set('unitId', u.id); setUnitSearch(`${u.unitName} (${u.unitCode})`); setShowUnitDropdown(false); }} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0 text-xs font-bold uppercase">{u.unitName} ({u.unitCode})</div>
                      ))}
                  </div>
              )}
            </div>
            <div><label className="label">Min Stock Level</label><input type="number" className="input-field font-bold" value={form.minStockLevel} onChange={e => set('minStockLevel',parseFloat(e.target.value))} /></div>
          </FormRow>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button className="btn-secondary px-8" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary px-12" onClick={save}>Save SFG</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
