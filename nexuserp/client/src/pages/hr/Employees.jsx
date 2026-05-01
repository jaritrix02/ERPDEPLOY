import { useEffect, useState, useRef } from 'react'
import { Users, Trash2, Edit3, Search, RotateCcw, Printer, Image as ImageIcon, Plus, User, Phone, Mail, ShieldCheck, Briefcase, Building2, Wallet, Calendar, Fingerprint, MapPin, CreditCard, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, CalendarPicker, SearchableSelect, ExportButton } from '../../components/ui'
import { usePermissions } from '../../hooks/usePermissions'
import { exportToCSV } from '../../utils/exportUtils'

const blank = { employeeCode:'', name:'', fatherName:'', department:'', designation:'', employeeCategory:'', employeeType:'Full-Time', salary:'', phone:'', email:'', uanNumber:'', esiNumber:'', memberId:'', joiningDate: new Date().toISOString().slice(0, 10), resignationDate:'', aadharNumber:'', panNumber:'', alternativeNumber:'', accountNo:'', bankName:'', ifscCode:'', paymode:'Bank Transfer', isActive: true, profileImage: null }

export default function Employees() {
  const { canWrite, canExecute } = usePermissions('hr_employees')
  const [list, setList]   = useState([])
  const [departments, setDepartments] = useState([])
  const [designations, setDesignations] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(blank)
  const [editing, setEditing] = useState(null)
  const imgInputRef = useRef(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ department: '', status: 'ALL' })

  const load = async () => {
    try {
      const [empRes, depRes, desRes, catRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/designations'),
        api.get('/employee-categories')
      ])
      setList(empRes.data?.data || [])
      setDepartments(depRes.data?.data || [])
      setDesignations(desRes.data?.data || [])
      setCategories(catRes.data?.data || [])
    } catch (e) {
      toast.error('Data synchronization failed')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(p => ({...p, [k]:v}))
  
  const save = async () => {
    if (!form.employeeCode || !form.name) return toast.error('Mandatory fields missing')
    const tid = toast.loading('Syncing personnel record...')
    try {
      const payload = { ...form, salary: parseFloat(form.salary || 0), isActive: !!form.isActive }
      if (editing) await api.put(`/employees/${editing}`, payload)
      else await api.post('/employees', payload)
      toast.success('Personnel record synchronized', { id: tid }); setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Synchronization failed', { id: tid }) }
  }

  const filtered = list.filter(e => {
    const s = search.toLowerCase();
    const matchSearch = !s || e.name?.toLowerCase().includes(s) || e.employeeCode?.toLowerCase().includes(s);
    const matchDept = !filters.department || e.department === filters.department
    const matchStatus = filters.status === 'ALL' || (filters.status === 'ACTIVE' ? e.isActive : !e.isActive)
    return matchSearch && matchDept && matchStatus
  })

  const handleExport = () => {
    const headers = [
      { label: 'CODE', key: 'employeeCode' },
      { label: 'NAME', key: 'name' },
      { label: 'DEPARTMENT', key: 'department' },
      { label: 'DESIGNATION', key: 'designation' },
      { label: 'JOINING DATE', key: 'joiningDate' },
      { label: 'STATUS', key: 'isActive' }
    ]
    exportToCSV(filtered, `Personnel_Registry_${new Date().toISOString().slice(0,10)}`, headers)
    toast.success('Registry data exported')
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Personnel Registry" 
        subtitle="Manage the industrial workforce directory, departmental structures, and digital personnel files."
        icon={<ShieldCheck size={24} className="text-indigo-600" />}
        actions={<div className="flex gap-3">
          <ExportButton onClick={handleExport} />
          {canWrite && <button className="btn-primary" onClick={() => { setForm(blank); setEditing(null); setModal(true) }}><Plus size={16} /> Register Personnel</button>}
        </div>} 
      />

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="label uppercase tracking-widest text-[10px]">Personnel Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Search by code, name, or portfolio identifier..." 
                className="input-field pl-11 font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <SearchableSelect
            label="Department Unit"
            options={[{ name: 'All Departments', id: '' }, ...departments]}
            value={filters.department}
            labelKey="name" valueKey="name"
            onChange={val => setFilters(p => ({ ...p, department: val === 'All Departments' ? '' : val }))}
            placeholder="All Units..."
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchableSelect
                label="Registry Status"
                options={[{ label: 'All Personnel', value: 'ALL' }, { label: 'Active Service', value: 'ACTIVE' }, { label: 'Terminated / Inactive', value: 'INACTIVE' }]}
                value={filters.status}
                onChange={val => setFilters(p => ({ ...p, status: val }))}
              />
            </div>
            <button className="btn-secondary h-[42px] px-3 mt-auto" onClick={() => {setFilters({ department: '', status: 'ALL' }); setSearch('')}} title="Reset Filters"><RotateCcw size={16}/></button>
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Personnel Identity</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Portfolio & Unit</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classification</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deployment</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Security Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><Empty /></td></tr>
                ) : filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs overflow-hidden border border-gray-200 dark:border-gray-600 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
                          {emp.profileImage ? <img src={emp.profileImage} className="w-full h-full object-cover" /> : <User size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{emp.name}</p>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1 tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-sm w-fit">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{emp.designation}</span>
                        <span className="text-[10px] font-medium text-gray-400 uppercase mt-1 tracking-wider">{emp.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 tracking-tighter">
                          {emp.employeeCategory || 'STAFF'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>{new Date(emp.joiningDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                        <span className="text-[8px] text-gray-400 mt-0.5">COMMISSIONED</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={emp.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canWrite && <button onClick={() => { setForm({ ...blank, ...emp, salary: String(emp.salary || 0), joiningDate: emp.joiningDate?.slice(0,10) || '' }); setEditing(emp.id); setModal(true) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Dossier"><Edit3 size={14} /></button>}
                        <button className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Generate ID"><Printer size={14} /></button>
                        {canExecute && <button onClick={() => { if(confirm('Permanently purge this personnel dossier?')) api.delete(`/employees/${emp.id}`).then(load) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white uppercase tracking-widest" title="Purge Record"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Personnel Dossier' : 'Commission New Personnel'} size="2xl">
        <div className="max-h-[80vh] overflow-y-auto px-1 space-y-8 py-4 custom-scrollbar">
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-3 dark:border-gray-800"><Briefcase size={14}/> 1. Deployment Protocol</h3>
            <FormRow cols={3}>
               <div><label className="label uppercase tracking-widest">Personnel ID *</label><input className="input-field font-black" value={form.employeeCode} onChange={e => set('employeeCode',e.target.value.toUpperCase())} /></div>
               <div><label className="label uppercase tracking-widest">Legal Full Name *</label><input className="input-field font-bold" value={form.name} onChange={e => set('name',e.target.value.toUpperCase())} /></div>
               <SearchableSelect label="Service Type" options={['Full-Time', 'Contract', 'Consultant', 'Intern'].map(n => ({ label: n, value: n }))} value={form.employeeType} onChange={v => set('employeeType', v)} />
            </FormRow>
            <FormRow cols={3}>
              <SearchableSelect label="Department Unit" options={departments} value={form.department} labelKey="name" valueKey="name" onChange={v => set('department', v)} />
              <SearchableSelect label="Designation Title" options={designations} value={form.designation} labelKey="name" valueKey="name" onChange={v => set('designation', v)} />
              <SearchableSelect label="Classification" options={categories} value={form.employeeCategory} labelKey="name" valueKey="name" onChange={v => set('employeeCategory', v)} />
            </FormRow>
          </section>

          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-3 dark:border-gray-800"><Fingerprint size={14}/> 2. Identity & Contact</h3>
            <div className="flex items-center gap-6 p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-black overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center transition-colors group-hover:border-indigo-400">
                  {form.profileImage ? <img src={form.profileImage} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-400" />}
                </div>
                <button onClick={() => imgInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-xl hover:scale-110 active:scale-95 transition-all"><Plus size={14} /></button>
                <input type="file" ref={imgInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (evt) => set('profileImage', evt.target.result); reader.readAsDataURL(file); } }} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Identification Photo</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">Upload high-resolution biometric photo. PNG or JPG only.</p>
                {form.profileImage && <button onClick={() => set('profileImage', null)} className="text-[9px] font-black text-rose-500 uppercase mt-3 hover:underline tracking-widest flex items-center gap-1"><Trash2 size={10}/> REMOVE PHOTO</button>}
              </div>
            </div>
            <FormRow cols={2}>
              <div><label className="label uppercase tracking-widest">Aadhar (Biometric)</label><input className="input-field font-mono font-bold" maxLength={12} value={form.aadharNumber} onChange={e => set('aadharNumber',e.target.value)} /></div>
              <div><label className="label uppercase tracking-widest">PAN (Tax ID)</label><input className="input-field font-mono font-black" maxLength={10} value={form.panNumber} onChange={e => set('panNumber',e.target.value.toUpperCase())} /></div>
            </FormRow>
            <FormRow cols={3}>
              <div><label className="label uppercase tracking-widest">Email (Official)</label><input className="input-field font-bold" value={form.email} onChange={e => set('email',e.target.value.toLowerCase())} /></div>
              <div><label className="label uppercase tracking-widest">Contact Primary</label><input className="input-field font-bold" value={form.phone} onChange={e => set('phone',e.target.value)} /></div>
              <SearchableSelect label="Registry Status" options={[{ label: 'ACTIVE SERVICE', value: true }, { label: 'DEACTIVATED', value: false }]} value={form.isActive} onChange={v => set('isActive', v)} />
            </FormRow>
          </section>

          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b pb-3 dark:border-gray-800"><Wallet size={14}/> 3. Compensation & Banking</h3>
            <FormRow cols={3}>
              <div><label className="label uppercase tracking-widest">Banking Institution</label><input className="input-field font-bold" value={form.bankName} onChange={e => set('bankName',e.target.value.toUpperCase())} /></div>
              <div><label className="label uppercase tracking-widest">Account Structure</label><input className="input-field font-mono font-black" value={form.accountNo} onChange={e => set('accountNo',e.target.value)} /></div>
              <div><label className="label uppercase tracking-widest">IFSC Protocol</label><input className="input-field font-mono font-black" value={form.ifscCode} onChange={e => set('ifscCode',e.target.value.toUpperCase())} /></div>
            </FormRow>
            <FormRow cols={3}>
              <div><label className="label uppercase tracking-widest">Gross Remuneration</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span><input type="number" className="input-field pl-8 font-black" value={form.salary} onChange={e => set('salary',e.target.value)} /></div></div>
              <SearchableSelect label="Disbursement Mode" options={['Bank Transfer', 'Direct Cash', 'Cheque'].map(m => ({ label: m, value: m }))} value={form.paymode} onChange={v => set('paymode', v)} />
              <CalendarPicker label="Commissioning Date" value={form.joiningDate} onChange={v => set('joiningDate', v)} />
            </FormRow>
          </section>

          <div className="flex justify-end gap-3 pt-8 border-t dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900 py-4 -mx-1 px-4 z-10">
            <button className="btn-secondary" onClick={() => setModal(false)}>Terminate Process</button>
            <button className="btn-primary px-12" onClick={save}>{editing ? 'Commit Revision' : 'Register Dossier'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



