import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Plus, Search, RotateCcw, 
  MapPin, Phone, Mail, Globe, 
  Trash2, Edit3, ChevronRight, Download, 
  Zap, X, Info, Filter, LayoutGrid, 
  FileText, BarChart3, ShieldCheck, Printer, 
  Briefcase, Building2, CreditCard, User
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Modal, Badge, PageHeader, Spinner, Empty, FormRow, 
  SearchableSelect, ExportButton, ImportButton 
} from '../../components/ui'
import { socket } from '../../services/socket'
import { exportToCSV } from '../../utils/exportUtils'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ companyName: '', contactPerson: '', email: '', phone: '', address: '', city: '', state: '', gstNo: '', panNo: '', isActive: true })
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/vendors')
      setVendors(res.data.data || [])
    } catch (e) { toast.error('Vendor Registry Link Failure') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const s = search.toLowerCase()
      return !s || v.companyName?.toLowerCase().includes(s) || v.contactPerson?.toLowerCase().includes(s) || v.city?.toLowerCase().includes(s) || v.gstNo?.toLowerCase().includes(s)
    })
  }, [vendors, search])

  const handleExport = () => {
    const headers = [
      { label: 'COMPANY', key: 'companyName' },
      { label: 'CONTACT', key: 'contactPerson' },
      { label: 'EMAIL', key: 'email' },
      { label: 'PHONE', key: 'phone' },
      { label: 'CITY', key: 'city' },
      { label: 'GST NO', key: 'gstNo' }
    ]
    exportToCSV(filteredVendors, 'Supply_Chain_Partners', headers)
    toast.success('Partner Portfolio Exported')
  }

  const save = async () => {
    const tid = toast.loading('Synchronizing Partner Data...')
    try {
      if (editingId) await api.put(`/vendors/${editingId}`, form)
      else await api.post('/vendors', form)
      toast.success('Partner Authorized', { id: tid }); setModal(false); load()
    } catch (e) { toast.error('Registry Entry Denied', { id: tid }) }
  }

  return (
    <div className="animate-fade-in space-y-10 pb-20 h-full overflow-y-auto custom-scrollbar">
      <PageHeader 
        title="Supply Chain Partners" 
        subtitle="Global directory of authorized vendors, procurement entities, and logistical nodes."
        icon={<Building2 size={28} className="text-blue-600" />}
        actions={<>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setEditingId(null); setForm({ companyName:'', contactPerson:'', email:'', phone:'', address:'', city:'', state:'', gstNo:'', panNo:'', isActive:true }); setModal(true); }}><Plus size={16} /> Enroll New Partner</button>
        </>} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { l: 'Authorized Partners', v: vendors.length, i: <Briefcase size={20}/>, c: 'blue' },
          { l: 'Operational Nodes', v: vendors.filter(v => v.isActive).length, i: <ShieldCheck size={20}/>, c: 'emerald' },
          { l: 'Regional Hubs', v: new Set(vendors.map(v => v.city)).size, i: <MapPin size={20}/>, c: 'amber' },
          { l: 'Financial Compliance', v: vendors.filter(v => v.gstNo).length, i: <CreditCard size={20}/>, c: 'indigo' }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.1 }}
            className="card p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group"
          >
            <div className={`absolute -right-4 -bottom-4 w-32 h-32 bg-${stat.c}-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000`} />
            <div className="flex justify-between items-start relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.l}</p>
              <div className={`p-3 rounded-2xl bg-${stat.c}-600/10 text-${stat.c}-600 shadow-sm transition-transform group-hover:rotate-12`}>{stat.i}</div>
            </div>
            <p className="mt-6 text-3xl font-black text-slate-900 dark:text-white relative z-10 tracking-tighter">{stat.v}</p>
          </motion.div>
        ))}
      </div>

      <div className="card p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
          <div className="lg:col-span-3">
            <label className="label">Search Partner Matrix</label>
            <div className="relative group">
              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                placeholder="Search by Company Nomenclature, Contact Identity, City, or GST Registry..." 
                className="input-field pl-14"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button onClick={() => setSearch('')} className="btn-secondary py-3.5 h-[50px]"><RotateCcw size={16}/> Reset Feed</button>
        </div>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredVendors.length === 0 ? (
              <div className="col-span-full"><Empty message="No operational partners detected in registry" /></div>
            ) : filteredVendors.map((vendor, idx) => (
              <motion.div 
                key={vendor.id} 
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: idx * 0.05 }}
                className="card p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-blue-600/5 group-hover:scale-150 transition-transform duration-1000"><Building2 size={120}/></div>
                
                <div className="flex justify-between items-start relative z-10 mb-8">
                   <div className="space-y-1">
                      <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-blue-600 transition-colors">{vendor.companyName}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={10} className="text-blue-500"/> {vendor.contactPerson}</p>
                   </div>
                   <Badge status={vendor.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>

                <div className="space-y-4 relative z-10">
                   <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 group-hover:bg-blue-600/5 transition-colors">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-blue-500"><Phone size={12}/></div>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 tracking-widest">{vendor.phone || 'NO CONTACT'}</span>
                   </div>
                   <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 group-hover:bg-blue-600/5 transition-colors">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-emerald-500"><MapPin size={12}/></div>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 tracking-widest uppercase">{vendor.city}, {vendor.state}</span>
                   </div>
                   <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 group-hover:bg-blue-600/5 transition-colors">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500"><CreditCard size={12}/></div>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 tracking-widest">{vendor.gstNo || 'GST UNREGISTERED'}</span>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3 relative z-10">
                   <button onClick={() => { setEditingId(vendor.id); setForm(vendor); setModal(true); }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={14}/></button>
                   <button className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Printer size={14}/></button>
                   <button onClick={() => { if(confirm('Archive partner portfolio?')) api.delete(`/vendors/${vendor.id}`).then(load) }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={14}/></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* VENDOR MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Refine Partner Profile' : 'Supply Chain Partner Initialization'} size="lg">
        <div className="space-y-10">
          <div className="p-8 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 shadow-inner">
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3"><Building2 size={16}/> Corporate Identity</p>
             <div className="mb-8"><label className="label">Full Legal Company Nomenclature *</label><input className="input-field font-black uppercase tracking-tight" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value.toUpperCase()})} /></div>
             <FormRow cols={2}>
               <div><label className="label">Chief Contact Executive *</label><input className="input-field font-black uppercase" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value.toUpperCase()})} /></div>
               <div><label className="label">Authorized Contact Phone *</label><input className="input-field font-black" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
             </FormRow>
          </div>

          <div className="space-y-8">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><CreditCard size={16}/> Fiscal Compliance Registry</p>
             <FormRow cols={2}>
               <div><label className="label">GST Registration Number</label><input className="input-field font-black uppercase tracking-widest" value={form.gstNo} onChange={e => setForm({...form, gstNo: e.target.value.toUpperCase()})} /></div>
               <div><label className="label">Corporate PAN Identity</label><input className="input-field font-black uppercase tracking-widest" value={form.panNo} onChange={e => setForm({...form, panNo: e.target.value.toUpperCase()})} /></div>
             </FormRow>
          </div>

          <div className="space-y-8">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><MapPin size={16}/> Logistical Deployment</p>
             <div><label className="label">Registered Corporate Address</label><textarea className="input-field" rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
             <FormRow cols={2}>
               <div><label className="label">Operations City</label><input className="input-field font-black uppercase" value={form.city} onChange={e => setForm({...form, city: e.target.value.toUpperCase()})} /></div>
               <div><label className="label">Deployment State</label><input className="input-field font-black uppercase" value={form.state} onChange={e => setForm({...form, state: e.target.value.toUpperCase()})} /></div>
             </FormRow>
          </div>

          <div className="flex justify-end gap-4 pt-10 border-t dark:border-white/5">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-8" onClick={() => setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[200px] shadow-blue-500/30" onClick={save}>{editingId ? 'AUTHORIZE PROFILE REFINEMENT' : 'INITIALIZE PARTNER ENROLLMENT'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
