import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, CalendarPicker, SearchableSelect, ExportButton, ImportButton } from '../../components/ui'
import { LogOut, LogIn, Trash2, Edit, Plus, RotateCcw, User, FileText, Clock, Search, ShieldCheck } from 'lucide-react'

const blank = { 
  employeeId: '', 
  employeeName: '', 
  passType: 'PERSONAL', 
  date: new Date().toISOString().slice(0, 10), 
  outTime: '', 
  inTime: '', 
  reason: '', 
  status: 'APPROVED' 
}

export default function EmployeeGatePass() {
  const [list, setList] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [lastPass, setLastPass] = useState(null)
  const fileInputRef = useRef(null)
  const [search, setSearch] = useState('')
  const [modalDept, setModalDept] = useState('')

  const load = async () => {
    try {
      const [gpRes, empRes, depRes] = await Promise.all([
        api.get('/gatepass'),
        api.get('/employees'),
        api.get('/departments')
      ])
      setList(gpRes.data.data)
      setEmployees(empRes.data.data)
      setDepartments(depRes.data.data)
    } catch (e) {
      toast.error('Failed to load gate pass registry')
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const selectEmployee = (empId) => {
    if(!empId) return setForm(p => ({ ...p, employeeId: '', employeeName: '' }));
    const emp = employees.find(e => e.id === empId)
    if (!emp) return
    setForm(p => ({ ...p, employeeId: emp.id, employeeName: emp.name }))
    const last = list.find(gp => gp.employeeId === emp.id)
    setLastPass(last)
  }

  const save = async () => {
    try {
      if (!form.employeeId || !form.outTime) return toast.error('Mandatory fields (Personnel/Exit Time) missing')
      const tid = toast.loading('Processing gate authorization...')
      if (editing) await api.put(`/gatepass/${editing}`, form)
      else await api.post('/gatepass', form)
      toast.success(editing ? 'Authorization revised' : 'Gate authorization issued', { id: tid })
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Authorization failed') }
  }

  const handleExport = () => {
    if (list.length === 0) return toast.error('Registry is empty')
    const headers = [
      { label: 'DATE', key: 'date' },
      { label: 'CODE', key: 'employee.employeeCode' },
      { label: 'NAME', key: 'employee.name' },
      { label: 'DEPARTMENT', key: 'employee.department' },
      { label: 'TYPE', key: 'passType' },
      { label: 'OUT', key: 'outTimeFormatted' },
      { label: 'IN', key: 'inTimeFormatted' },
      { label: 'STATUS', key: 'status' }
    ]
    
    const formatted = list.map(gp => ({
      ...gp,
      date: gp.date?.slice(0, 10),
      outTimeFormatted: gp.outTime ? new Date(gp.outTime).toLocaleTimeString() : '-',
      inTimeFormatted: gp.inTime ? new Date(gp.inTime).toLocaleTimeString() : '-'
    }))

    const csvContent = "data:text/csv;charset=utf-8," + 
      headers.map(h => h.label).join(",") + "\n" +
      formatted.map(row => headers.map(h => {
        const val = h.key.split('.').reduce((obj, key) => obj?.[key], row);
        return `"${val || ''}"`;
      }).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GatePass_Registry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success('Gate pass registry exported')
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
                if (h.toLowerCase().includes('type')) obj.type = val
                if (h.toLowerCase().includes('out')) obj.outTime = val
                if (h.toLowerCase().includes('in')) obj.inTime = val
                if (h.toLowerCase().includes('reason')) obj.reason = val
                if (h.toLowerCase().includes('status')) obj.status = val
            })
            const emp = employees.find(e => e.employeeCode === obj.employeeCode)
            if (!emp) return null
            return { employeeId: emp.id, employeeCode: obj.employeeCode, date: obj.date, passType: obj.type || 'PERSONAL', outTime: obj.outTime, inTime: obj.inTime, reason: obj.reason, status: obj.status || 'APPROVED' }
        }).filter(Boolean)

        const tid = toast.loading('Synchronizing gate records...')
        try {
            await api.post('/gatepass/bulk', data)
            toast.success(`Successfully synchronized ${data.length} records`, { id: tid })
            load()
        } catch (err) { toast.error('Synchronization failed', { id: tid }) }
    }
    reader.readAsText(file)
  }

  const filtered = list.filter(gp => 
    gp.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    gp.employee?.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
    gp.employee?.department?.toLowerCase().includes(search.toLowerCase()) ||
    gp.passType?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Gate Registry" 
        subtitle="Industrial-grade monitoring of personnel mobility, departmental exit authorizations, and site security compliance."
        icon={<ShieldCheck size={24} className="text-indigo-600" />}
        actions={<div className="flex gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
          <ImportButton onClick={() => fileInputRef.current.click()} />
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setForm(blank); setEditing(null); setLastPass(null); setModal(true) }}><Plus size={14} /> Log Authorization</button>
        </div>} 
      />

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Search by personnel, department, or authorization type..." 
                className="input-field pl-12 font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button onClick={() => setSearch('')} className="btn-secondary px-6 h-[42px]"><RotateCcw size={14} /> Reset Filters</button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Log Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Personnel Portfolio</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classification</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Exit (Out)</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Entry (In)</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Security Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7}><Empty /></td></tr>
                ) : filtered.map(gp => (
                  <tr key={gp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-tighter">{gp.date?.slice(0, 10)}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">LOGGED</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{gp.employee?.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{gp.employee?.employeeCode} • {gp.employee?.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${gp.passType === 'OFFICIAL' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'} tracking-widest`}>
                        {gp.passType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <LogOut size={12} className="text-rose-500 mb-1" />
                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 font-mono">{gp.outTime ? new Date(gp.outTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <LogIn size={12} className="text-emerald-500 mb-1" />
                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 font-mono">{gp.inTime ? new Date(gp.inTime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={gp.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setForm(gp); setEditing(gp.id); setModalDept(gp.employee?.department); setLastPass(null); setModal(true) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Entry"><Edit size={14} /></button>
                        <button onClick={() => { if(confirm('Are you sure you want to delete this gate authorization record?')) api.delete(`/gatepass/${gp.id}`).then(load) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white uppercase tracking-widest" title="Delete Entry"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Site Authorization' : 'Issue Gate Authorization'} size="xl">
        <div className="space-y-6 py-6">
          <FormRow cols={2}>
            <SearchableSelect
              label="Functional Unit"
              options={[{ name: 'All Departments', id: '' }, ...departments]}
              value={modalDept}
              labelKey="name"
              valueKey="name"
              onChange={val => { setModalDept(val === 'All Departments' ? '' : val); setForm(p => ({...p, employeeId: ''})) }}
              placeholder="All Units..."
            />
            <div className="relative">
              <SearchableSelect
                label="Personnel Identity *"
                options={employees.filter(e => !modalDept || e.department === modalDept).map(e => ({ label: `${e.employeeCode} - ${e.name}`, value: e.id, subLabel: e.department }))}
                value={form.employeeId}
                onChange={selectEmployee}
                placeholder="Search directory..."
              />
              {lastPass && (
                <div className="absolute top-0 right-0">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-[9px] font-black text-indigo-600 rounded border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest">
                    <Clock size={10} /> Active Entry
                  </div>
                </div>
              )}
            </div>
          </FormRow>

          <FormRow cols={2}>
            <SearchableSelect
              label="Authorization Protocol"
              options={['PERSONAL', 'OFFICIAL', 'LUNCH / TEA BREAK', 'MEDICAL EMERGENCY', 'BANK / GOVT WORK', 'FIELD VISIT', 'CLIENT MEETING', 'EARLY EXIT', 'OTHER'].map(t => ({ label: t, value: t }))}
              value={form.passType}
              onChange={val => set('passType', val)}
            />
            <CalendarPicker label="Authorization Date" value={form.date} onChange={v => set('date', v)} />
          </FormRow>

          <FormRow cols={2}>
            <div>
                <label className="label uppercase tracking-widest flex justify-between items-center">
                  <span>Exit Timestamp (Out)</span>
                  <button onClick={() => set('outTime', new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16))} className="text-[9px] font-black text-indigo-600 hover:underline">SET NOW</button>
                </label>
                <div className="relative">
                  <LogOut size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="datetime-local" className="input-field pl-9 font-black" value={form.outTime} onChange={e => set('outTime', e.target.value)} />
                </div>
            </div>
            <div>
                <label className="label uppercase tracking-widest flex justify-between items-center">
                  <span>Entry Timestamp (In)</span>
                  <button onClick={() => set('inTime', new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16))} className="text-[9px] font-black text-indigo-600 hover:underline">SET NOW</button>
                </label>
                <div className="relative">
                  <LogIn size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="datetime-local" className="input-field pl-9 font-black" value={form.inTime} onChange={e => set('inTime', e.target.value)} />
                </div>
            </div>
          </FormRow>

          <div>
            <label className="label uppercase tracking-widest">Justification Reason *</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-4 text-gray-400" />
              <textarea className="input-field pl-9 h-28 font-bold" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Explain primary purpose for exit authorization (e.g. LUNCH, BANK, MEDICAL)..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel Protocol</button>
              <button className="btn-primary px-10" onClick={save}>{editing ? 'Commit Revision' : 'Issue Authorization'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

