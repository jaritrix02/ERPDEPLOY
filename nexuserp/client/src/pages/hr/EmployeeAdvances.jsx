import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, CalendarPicker, SearchableSelect, ExportButton, ImportButton } from '../../components/ui'
import { IndianRupee, Trash2, Edit3, Plus, RotateCcw, ShieldCheck, User, Info, Search, FileText, Wallet, Building2, Calendar as CalendarIcon, ChevronRight } from 'lucide-react'

const blank = { employeeId: '', employeeName: '', amount: '', reason: '', date: new Date().toISOString().slice(0, 10), status: 'PENDING' }

export default function EmployeeAdvances() {
  const { user } = useSelector(s => s.auth)
  const [list, setList] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const fileInputRef = useRef(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalDept, setModalDept] = useState('')

  const load = async () => {
    try {
      const [advRes, empRes, depRes] = await Promise.all([
        api.get('/advances'),
        api.get('/employees'),
        api.get('/departments')
      ])
      setList(advRes.data.data)
      setEmployees(empRes.data.data)
      setDepartments(depRes.data.data)
    } catch (e) {
      toast.error('Failed to synchronize advance registry')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const selectEmployee = (empId) => {
    if(!empId) return setForm(p => ({ ...p, employeeId: '', employeeName: '' }));
    const emp = employees.find(e => e.id === empId)
    if (emp) setForm(p => ({ ...p, employeeId: emp.id, employeeName: emp.name }))
  }

  const approve = async (id) => {
    if (!confirm('Authorize this financial disbursement?')) return
    const tid = toast.loading('Authorizing disbursement...')
    try {
        await api.put(`/advances/${id}`, { status: 'APPROVED', approvedBy: user.name })
        toast.success('Disbursement authorized', { id: tid })
        load()
    } catch (e) { toast.error('Authorization failed', { id: tid }) }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Permanently purge ${selectedIds.length} advance records?`)) return
    const tid = toast.loading('Purging selected records...')
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/advances/${id}`)))
      toast.success('Records purged successfully', { id: tid })
      setSelectedIds([]); load()
    } catch (e) { toast.error('Batch purge failed', { id: tid }) }
  }

  const save = async () => {
    if (!form.employeeId || !form.amount) return toast.error('Mandatory fields missing')
    const tid = toast.loading('Synchronizing registry entry...')
    try {
      if (editing) await api.put(`/advances/${editing}`, form)
      else await api.post('/advances', form)
      toast.success(editing ? 'Record corrected' : 'Disbursement logged', { id: tid })
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Synchronization failed', { id: tid }) }
  }

  const handleExport = () => {
    if (list.length === 0) return toast.error('Registry is empty')
    const headers = ['Date', 'Code', 'Personnel', 'Department', 'Amount', 'Purpose', 'Status']
    const rows = list.map(adv => [
      adv.date?.slice(0, 10),
      adv.employee?.employeeCode,
      adv.employee?.name,
      adv.employee?.department,
      adv.amount,
      adv.purpose || adv.reason,
      adv.status
    ])
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `Advance_Registry_${new Date().toISOString().slice(0,10)}.csv`)
    link.click()
    toast.success('Registry data exported')
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
        const text = evt.target.result
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) return toast.error('Source file is invalid')
        const headers = lines[0].split(',').map(h => h.replace(/\(.*\)/g, '').replace(/"/g, '').trim())
        const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, '').trim())
            const obj = {}
            headers.forEach((h, i) => {
                const val = values[i]
                if (h.toLowerCase().includes('date')) obj.date = val
                if (h.toLowerCase().includes('code')) obj.employeeCode = val
                if (h.toLowerCase().includes('amount')) obj.amount = parseFloat(val) || 0
                if (h.toLowerCase().includes('reason')) obj.reason = val
                if (h.toLowerCase().includes('status')) obj.status = val
            })
            const emp = employees.find(e => e.employeeCode === obj.employeeCode)
            if (!emp) return null
            return { employeeId: emp.id, employeeCode: obj.employeeCode, date: obj.date, amount: obj.amount, reason: obj.reason, status: obj.status || 'PENDING' }
        }).filter(Boolean)

        const tid = toast.loading('Synchronizing advance records...')
        try {
            await api.post('/advances/bulk', data)
            toast.success(`Successfully synchronized ${data.length} records`, { id: tid })
            load()
        } catch (err) { toast.error('Synchronization failed', { id: tid }) }
    }
    reader.readAsText(file)
  }

  const filtered = list.filter(adv => {
    const s = search.toLowerCase()
    const matchSearch = !s || adv.employee?.name?.toLowerCase().includes(s) || adv.employee?.employeeCode?.toLowerCase().includes(s) || adv.referenceNo?.toLowerCase().includes(s)
    const matchStatus = !statusFilter || adv.status === statusFilter
    return matchSearch && matchStatus
  })

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR'
  const selectedEmployeeData = employees.find(e => e.id === form.employeeId)
  const lastAdvance = selectedEmployeeData?.employeeAdvances?.[0]

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Advance Ledger" 
        subtitle="Industrial-grade monitoring of personnel financial assistance, disbursement authorizations, and payroll deduction cycles."
        icon={<Wallet size={24} className="text-indigo-600" />}
        actions={<div className="flex gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
          <ImportButton onClick={() => fileInputRef.current.click()} />
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setForm(blank); setEditing(null); setModal(true) }}><Plus size={14} /> Log Disbursement</button>
        </div>} 
      />

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Search by personnel, code, or reference identifier..." 
                className="input-field pl-12 font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-56">
            <SearchableSelect
              options={[{ label: 'All Status Records', value: '' }, { label: 'Pending Audit', value: 'PENDING' }, { label: 'Authorized', value: 'APPROVED' }, { label: 'Declined', value: 'REJECTED' }]}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by status..."
            />
          </div>
          {isAdmin && selectedIds.length > 0 && (
            <button className="btn-secondary text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white px-6 h-[42px]" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Batch Purge ({selectedIds.length})
            </button>
          )}
          <button onClick={() => { setSearch(''); setStatusFilter('') }} className="btn-secondary px-6 h-[42px]"><RotateCcw size={14} /> Reset Filters</button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <input type="checkbox" className="accent-indigo-600 w-4 h-4 rounded cursor-pointer" onChange={e => setSelectedIds(e.target.checked ? list.map(a => a.id) : [])} checked={list.length > 0 && selectedIds.length === list.length} />
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Log Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Personnel Portfolio</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Amount (₹)</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purpose & Reference</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><Empty /></td></tr>
                ) : filtered.map(adv => (
                  <tr key={adv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="accent-indigo-600 w-4 h-4 rounded cursor-pointer" checked={selectedIds.includes(adv.id)} onChange={() => setSelectedIds(p => p.includes(adv.id) ? p.filter(i => i !== adv.id) : [...p, adv.id])} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-tighter">{adv.date?.slice(0, 10)}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">LOGGED</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{adv.employee?.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{adv.employee?.employeeCode} • {adv.employee?.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">₹{adv.amount?.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight line-clamp-1">{adv.purpose || adv.reason}</span>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{adv.referenceNo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={adv.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAdmin && adv.status === 'PENDING' && (
                          <button onClick={() => approve(adv.id)} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-600 hover:text-white" title="Authorize Disbursement"><ShieldCheck size={14} /></button>
                        )}
                        <button onClick={() => { setForm({...adv, reason: adv.purpose || adv.reason}); setEditing(adv.id); setModal(true) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Entry"><Edit3 size={14} /></button>
                        {isAdmin && (
                          <button onClick={() => { if(confirm('Permanently purge this disbursement record?')) api.delete(`/advances/${adv.id}`).then(load) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white" title="Delete Entry"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Disbursement Audit' : 'Authorize Advance Disbursement'} size="xl">
        <div className="space-y-6 py-6">
          {lastAdvance && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shrink-0 h-fit"><Info size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Financial Dossier Insight</p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed uppercase">Personnel received <span className="text-indigo-600">₹{lastAdvance.amount?.toLocaleString()}</span> on {new Date(lastAdvance.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}. Ensure recovery cycle alignment before new authorization.</p>
                </div>
              </div>
          )}

          <FormRow cols={2}>
            <SearchableSelect
              label="Functional Unit"
              options={[{ name: 'All Departments', id: '' }, ...departments]}
              value={modalDept}
              labelKey="name"
              valueKey="name"
              onChange={val => { setModalDept(val === 'All Departments' ? '' : val); setForm(p => ({...p, employeeId:''})) }}
              placeholder="Filter units..."
            />
            <SearchableSelect
              label="Personnel Identity *"
              options={employees.filter(e => !modalDept || e.department === modalDept).map(e => ({ label: `${e.employeeCode} - ${e.name}`, value: e.id, subLabel: e.department }))}
              value={form.employeeId}
              onChange={selectEmployee}
              placeholder="Search directory..."
            />
          </FormRow>

          <FormRow cols={2}>
            <div>
              <label className="label uppercase tracking-widest">Disbursement Amount (₹) *</label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" className="input-field pl-9 font-black" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <CalendarPicker label="Authorization Date" value={form.date} onChange={v => set('date', v)} />
          </FormRow>
          
          <div>
            <label className="label uppercase tracking-widest">Disbursement Justification *</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-4 text-gray-400" />
              <textarea className="input-field pl-9 h-28 font-bold" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Enter detailed justification for financial assistance (e.g., Medical Emergency, Critical Welfare)..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel Action</button>
            <button className="btn-primary px-12" onClick={save}>{editing ? 'Commit Revision' : 'Authorize Disbursement'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


