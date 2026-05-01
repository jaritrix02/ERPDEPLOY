import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow } from '../../components/ui'

const blank = { poId:'', vendorId:'', itemId:'', invoiceNo:'', invoiceDate:'', batchNo:'', mfgDate:'', expDate:'', qty:1, rate:0, cgst:0, sgst:0, igst:0 }

export default function PurchaseBills() {
  const [list, setList]   = useState([])
  const [pos, setPOs]     = useState([])
  const [vendors, setVendors] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(blank)

  // Searchable Dropdown States
  const [poSearch, setPOSearch] = useState('')
  const [showPODropdown, setShowPODropdown] = useState(false)
  const poDropdownRef = useRef(null)

  const [itemSearch, setItemSearch] = useState('')
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const itemDropdownRef = useRef(null)

  const load = () => Promise.all([api.get('/purchase-bills'),api.get('/purchase-orders'),api.get('/vendors'),api.get('/items')])
    .then(([b,p,v,i])=>{setList(b.data.data);setPOs(p.data.data);setVendors(v.data.data);setItems(i.data.data)}).finally(()=>setLoading(false))
  useEffect(()=>{
    load()
    const handleClickOutside = (e) => {
        if (poDropdownRef.current && !poDropdownRef.current.contains(e.target)) setShowPODropdown(false)
        if (itemDropdownRef.current && !itemDropdownRef.current.contains(e.target)) setShowItemDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  },[])

  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const totalAmount = () => { const sub = form.qty * form.rate; return sub + (sub*form.cgst/100) + (sub*form.sgst/100) + (sub*form.igst/100) }

  const handlePOChange = (poId) => {
    const po = pos.find(p=>p.id===poId)
    setForm(prev=>({...prev, poId, vendorId: po?.vendorId||''}))
  }

  const save = async () => {
    try {
      await api.post('/purchase-bills', { ...form, totalAmount: totalAmount() })
      toast.success('Purchase bill saved'); setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  return (
    <div>
      <PageHeader title="Purchase Bill Entry"
        actions={<button className="btn-primary" onClick={()=>{setForm(blank);setModal(true)}}>+ Add Bill</button>} />
      {loading ? <Spinner /> : (
        <div className="card table-container">
          <table className="w-full">
            <thead className="table-head"><tr>{['Bill No','Vendor','Invoice No','Item','Qty','Rate','CGST','SGST','IGST','Total','Date'].map(h=><th key={h} className="table-th">{h}</th>)}</tr></thead>
            <tbody>
              {list.length===0 ? <tr><td colSpan={11}><Empty /></td></tr> : list.map(b=>(
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="table-td font-mono text-xs font-bold text-primary-600">{b.billNo}</td>
                  <td className="table-td text-sm">{b.vendor?.companyName}</td>
                  <td className="table-td font-mono text-xs">{b.invoiceNo}</td>
                  <td className="table-td text-sm">{b.item?.itemName}</td>
                  <td className="table-td">{b.qty}</td>
                  <td className="table-td">₹{b.rate}</td>
                  <td className="table-td text-xs">{b.cgst}%</td>
                  <td className="table-td text-xs">{b.sgst}%</td>
                  <td className="table-td text-xs">{b.igst}%</td>
                  <td className="table-td font-semibold text-green-600">₹{b.totalAmount?.toLocaleString()}</td>
                  <td className="table-td text-xs text-gray-400">{b.createdAt?.slice(0,10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={()=>setModal(false)} title="Purchase Bill Entry" size="xl">
        <div className="space-y-4">
          <FormRow cols={2}>
            <div className="relative" ref={poDropdownRef}>
              <label className="label">Purchase Order *</label>
              <input className="input-field font-bold uppercase rounded-xl" placeholder="Search PO..." value={poSearch} onFocus={()=>setShowPODropdown(true)} onChange={e=>{setPOSearch(e.target.value);setShowPODropdown(true)}} />
              {showPODropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                      {pos.filter(p => p.poNo.toLowerCase().includes(poSearch.toLowerCase()) || p.vendor?.companyName.toLowerCase().includes(poSearch.toLowerCase())).map(p => (
                          <div key={p.id} onClick={() => { handlePOChange(p.id); setPOSearch(`${p.poNo} — ${p.vendor?.companyName}`); setShowPODropdown(false); }} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 group">
                              <p className="text-xs font-bold uppercase text-black dark:text-white">{p.poNo} - {p.vendor?.companyName}</p>
                              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">₹{p.totalAmount?.toLocaleString()}</p>
                          </div>
                      ))}
                  </div>
              )}
            </div>
            <div className="relative" ref={itemDropdownRef}>
              <label className="label">Item *</label>
              <input className="input-field font-bold uppercase rounded-xl" placeholder="Search Item..." value={itemSearch} onFocus={()=>setShowItemDropdown(true)} onChange={e=>{setItemSearch(e.target.value);setShowItemDropdown(true)}} />
              {showItemDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e293b] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                      {items.filter(i => i.itemName.toLowerCase().includes(itemSearch.toLowerCase()) || i.itemCode.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
                          <div key={i.id} onClick={() => { set('itemId', i.id); setItemSearch(`${i.itemCode} — ${i.itemName}`); setShowItemDropdown(false); }} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 group">
                              <p className="text-xs font-bold uppercase text-black dark:text-white">{i.itemCode} - {i.itemName}</p>
                              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">{i.itemType}</p>
                          </div>
                      ))}
                  </div>
              )}
            </div>
          </FormRow>
          <FormRow cols={3}>
            <div><label className="label">Invoice No *</label><input className="input-field" value={form.invoiceNo} onChange={e=>set('invoiceNo',e.target.value)} /></div>
            <div><label className="label">Invoice Date *</label><input type="date" className="input-field" value={form.invoiceDate} onChange={e=>set('invoiceDate',e.target.value)} /></div>
            <div><label className="label">Batch No</label><input className="input-field" value={form.batchNo} onChange={e=>set('batchNo',e.target.value)} /></div>
          </FormRow>
          <FormRow cols={2}>
            <div><label className="label">Mfg Date</label><input type="date" className="input-field" value={form.mfgDate} onChange={e=>set('mfgDate',e.target.value)} /></div>
            <div><label className="label">Expiry Date</label><input type="date" className="input-field" value={form.expDate} onChange={e=>set('expDate',e.target.value)} /></div>
          </FormRow>
          <FormRow cols={2}>
            <div><label className="label">Quantity *</label><input type="number" className="input-field" value={form.qty} onChange={e=>set('qty',parseFloat(e.target.value))} /></div>
            <div><label className="label">Rate (₹) *</label><input type="number" className="input-field" value={form.rate} onChange={e=>set('rate',parseFloat(e.target.value))} /></div>
          </FormRow>
          <FormRow cols={3}>
            <div><label className="label">CGST %</label><input type="number" className="input-field" value={form.cgst} onChange={e=>set('cgst',parseFloat(e.target.value))} /></div>
            <div><label className="label">SGST %</label><input type="number" className="input-field" value={form.sgst} onChange={e=>set('sgst',parseFloat(e.target.value))} /></div>
            <div><label className="label">IGST %</label><input type="number" className="input-field" value={form.igst} onChange={e=>set('igst',parseFloat(e.target.value))} /></div>
          </FormRow>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-right">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-green-600">₹{totalAmount().toLocaleString(undefined,{maximumFractionDigits:2})}</p>
          </div>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="btn-primary" onClick={save}>Save Bill</button></div>
        </div>
      </Modal>
    </div>
  )
}
