import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow, SearchableSelect, Badge, CalendarPicker } from '../../components/ui'
import { usePermissions } from '../../hooks/usePermissions'
import { LogOut, Trash2, Edit3, Plus, RotateCcw, User, FileText, Search, ShieldCheck, ClipboardCheck, History } from 'lucide-react'

const blank = { employeeId: '', exitDate: new Date().toISOString().slice(0, 10), reason: '', type: 'RESIGNATION', status: 'PENDING' }

export default function ExitManagement() {
  const { canWrite } = usePermissions('hr_employees')
  const [list, setList] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  const load = async () => {
    try {
      const [exitRes, empRes] = await Promise.all([
        api.get('/exits'),
        api.get('/employees')
      ])
      setList(exitRes.data.data)
      setEmployees(empRes.data.data)
    } catch (e) {
      toast.error('Failed to load separation registry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to purge ${selectedIds.length} separation records?`)) return
    const tid = toast.loading('Purging records...')
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/exits/${id}`)))
      toast.success('Records purged successfully', { id: tid })
      setSelectedIds([]); load()
    } catch (e) { toast.error('Purge failed', { id: tid }) }
  }

  const save = async () => {
    if (!form.employeeId || !form.exitDate) return toast.error('Mandatory fields missing')
    const tid = toast.loading('Syncing separation record...')
    try {
      if (editing) await api.put(`/exits/${editing}`, form)
      else await api.post('/exits', form)
      toast.success(editing ? 'Dossier revised' : 'Separation archived', { id: tid })
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Sync failed', { id: tid }) }
  }

  const filtered = list.filter(item => 
    item.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.employee?.employeeCode?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Exit Protocols" 
        subtitle="Manage industrial personnel separation, decommissioning workflows, and terminal settlement archives."
        icon={<LogOut size={24} className="text-indigo-600" />}
        actions={canWrite && <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button className="btn-secondary text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white h-[42px]" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Batch Purge ({selectedIds.length})
            </button>
          )}
          <button className="btn-primary h-[42px]" onClick={() => { setForm(blank); setEditing(null); setModal(true) }}><Plus size={14} /> Log Separation</button>
        </div>} 
      />

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Search by personnel name or identification ID..." 
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
                  <th className="px-6 py-3 w-10">
                    <input type="checkbox" className="accent-indigo-600 w-4 h-4 rounded cursor-pointer" onChange={e => setSelectedIds(e.target.checked ? filtered.map(i => i.id) : [])} checked={filtered.length > 0 && selectedIds.length === filtered.length} />
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Personnel Portfolio</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Separation Profile</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Security Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}><Empty /></td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="accent-indigo-600 w-4 h-4 rounded cursor-pointer" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds(p => p.includes(item.id) ? p.filter(i => i !== item.id) : [...p, item.id])} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.employee?.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.employee?.employeeCode} • {item.employee?.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                          <History size={12} className="text-indigo-500" /> {new Date(item.exitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 w-fit tracking-[0.1em]">
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={item.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setForm(item); setEditing(item.id); setModal(true) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Dossier"><Edit3 size={14} /></button>
                        <button onClick={() => { if(confirm('Permanently purge this separation record?')) api.delete(`/exits/${item.id}`).then(load) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white uppercase tracking-widest" title="Purge Record"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Separation Dossier' : 'Commission Decommissioning Protocol'} size="xl">
        <div className="space-y-6 py-6">
          <SearchableSelect
            label="Personnel Identity *"
            options={employees.map(e => ({ label: `${e.employeeCode} - ${e.name}`, value: e.id, subLabel: e.department }))}
            value={form.employeeId}
            onChange={val => setForm({ ...form, employeeId: val })}
            placeholder="Search directory..."
          />
          <FormRow cols={2}>
            <CalendarPicker label="Separation Date *" value={form.exitDate} onChange={v => setForm({ ...form, exitDate: v })} />
            <SearchableSelect 
              label="Exit Classification *" 
              options={['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'DEATH', 'ABSCONDING'].map(t => ({ label: t, value: t }))}
              value={form.type} 
              onChange={v => setForm({ ...form, type: v })} 
            />
          </FormRow>
          <SearchableSelect 
            label="Separation Workflow Status" 
            options={[{ label: 'PENDING (NOTICE PERIOD)', value: 'PENDING' }, { label: 'IN PROGRESS (CLEARANCE)', value: 'IN_PROGRESS' }, { label: 'COMPLETED (SETTLED)', value: 'COMPLETED' }]}
            value={form.status} 
            onChange={v => setForm({ ...form, status: v })} 
          />
          <div>
            <label className="label uppercase tracking-widest">Justification & Final Feedback *</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-4 text-gray-400" />
              <textarea className="input-field pl-9 h-32 font-bold" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Enter primary reason for separation or terminal feedback summary..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel Protocol</button>
            <button className="btn-primary px-12" onClick={save}>{editing ? 'Commit Revision' : 'Archive Separation'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



