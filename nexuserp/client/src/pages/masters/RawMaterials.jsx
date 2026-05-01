import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow, Badge } from '../../components/ui'

const blank = { itemName:'', itemType:'RAW_MATERIAL', unitId:'', gstId:'', description:'', minStockLevel:0 }

export default function RawMaterials() {
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
    // Only keep RAW_MATERIAL
    setItems(i.data.data.filter(it => it.itemType === 'RAW_MATERIAL')); 
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
      toast.success(editing ? 'Raw Material updated' : 'Raw Material added')
      setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const del = async id => {
    if (!isAdmin) return toast.error('Only ADMIN can delete inventory items')
    if (!confirm('Are you sure you want to delete this raw material?')) return
    try {
        await api.delete(`/items/${id}`)
        toast.success('Deleted'); load()
    } catch (e) {
        toast.error('Failed to delete item. It may be linked to active transactions.')
    }
  }

  const filtered = items.filter(i =>
    (i.itemName.toLowerCase().includes(search.toLowerCase()) || i.itemCode.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="text-black dark:text-white pb-10">
      <PageHeader title="Raw Material Master" subtitle={`Managing ${items.length} raw components`}
        actions={<>
          <div className="relative" ref={itemDropdownRef}>
            <input className="input-field w-64 font-bold rounded-xl" placeholder="Search Materials..." value={search} onFocus={() => setShowItemDropdown(true)} onChange={e => { setSearch(e.target.value); setShowItemDropdown(true); }} />
            {showItemDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                    {items.filter(i => i.itemName.toLowerCase().includes(search.toLowerCase()) || i.itemCode.toLowerCase().includes(search.toLowerCase())).map(i => (
                        <div key={i.id} onClick={() => { setSearch(i.itemName); setShowItemDropdown(false); }} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 group text-left">
                            <p className="text-xs font-bold uppercase text-black dark:text-white">{i.itemCode} - {i.itemName}</p>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">RAW MATERIAL</p>
                        </div>
                    ))}
                    {items.filter(i => i.itemName.toLowerCase().includes(search.toLowerCase()) || i.itemCode.toLowerCase().includes(search.toLowerCase())).length === 0 && <div className="p-4 text-center text-xs text-black dark:text-white font-bold uppercase">Not found</div>}
                </div>
            )}
          </div>
          <button className="btn-primary" onClick={openAdd}>+ Add Material</button>
        </>} />

      {loading ? <Spinner /> : (
        <div className="card table-container border-b-4 border-black dark:border-white shadow-2xl">
          <table className="w-full text-left">
            <thead className="table-head bg-black dark:bg-slate-900">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">RM Code</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Unit</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Min Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0f172a]">
              {filtered.length===0 ? <tr><td colSpan={5}><div className="py-20 opacity-30"><Empty /></div></td></tr> : filtered.map(it => (
                <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400 tracking-widest">{it.itemCode}</td>
                  <td className="px-6 py-4 font-bold text-black dark:text-white uppercase text-xs">{it.itemName}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center text-slate-500 dark:text-slate-400">{it.unit?.unitCode}</td>
                  <td className="px-6 py-4 font-bold text-center text-black dark:text-white">{it.minStockLevel}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEdit(it)} className="text-[10px] font-bold uppercase text-blue-600 hover:text-blue-500 transition-colors">Edit</button>
                      {isAdmin && (
                        <button onClick={() => del(it.id)} className="text-[10px] font-bold uppercase text-red-600 hover:text-red-500 transition-colors">Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Update Raw Material' : 'Register New Raw Material'} size="xl">
        <div className="space-y-6 text-black dark:text-white p-2">
          <FormRow cols={2}>
            <div>
                <label className="label">Item Type (Read Only)</label>
                <input className="input-field bg-slate-100 dark:bg-slate-800/50 font-bold" readOnly value="RAW_MATERIAL" />
            </div>
            <div>
              <label className="label">System Code (Auto-generated)</label>
              <input className="input-field bg-slate-50 dark:bg-slate-800/50 font-mono font-bold" readOnly value={form.itemCode || 'Auto: RM-XXX'} />
            </div>
          </FormRow>
          <div><label className="label">Raw Material Name *</label><input className="input-field font-bold uppercase" value={form.itemName} onChange={e => set('itemName',e.target.value)} /></div>
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
            <div className="relative" ref={gstDropdownRef}>
              <label className="label">Taxation (GST)</label>
              <input className="input-field font-bold uppercase rounded-xl" placeholder="Search GST..." value={gstSearch} onFocus={()=>setShowGstDropdown(true)} onChange={e=>{setGstSearch(e.target.value);setShowGstDropdown(true)}} />
              {showGstDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                      <div onClick={() => { set('gstId', ''); setGstSearch('No GST'); setShowGstDropdown(false); }} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase text-blue-500">No GST</div>
                      {gsts.filter(g => g.type.toLowerCase().includes(gstSearch.toLowerCase()) || String(g.rate).includes(gstSearch)).map(g => (
                          <div key={g.id} onClick={() => { set('gstId', g.id); setGstSearch(`${g.type} — ${g.rate}%`); setShowGstDropdown(false); }} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0 text-xs font-bold uppercase">{g.type} — {g.rate}%</div>
                      ))}
                  </div>
              )}
            </div>
          </FormRow>
          <FormRow cols={2}>
            <div><label className="label">Min Stock Level</label><input type="number" className="input-field font-bold" value={form.minStockLevel} onChange={e => set('minStockLevel',parseFloat(e.target.value))} /></div>
            <div><label className="label">Remarks / Specs</label><input className="input-field font-bold" value={form.description||''} onChange={e => set('description',e.target.value)} /></div>
          </FormRow>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button className="btn-secondary px-8" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary px-12" onClick={save}>{editing ? 'Update' : 'Save Material'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
