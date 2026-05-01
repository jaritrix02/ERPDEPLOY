import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow, SearchableSelect, Badge, ExportButton } from '../../components/ui'
import { usePermissions } from '../../hooks/usePermissions'
import { Briefcase, Trash2, Edit3, Plus, RotateCcw, Users, UserPlus, Building2, Search, FileText, Globe } from 'lucide-react'

const blank = { title: '', department: '', positionType: 'FULL_TIME', openings: 1, status: 'OPEN', description: '', requirements: '' }

export default function Recruitment() {
  const { canWrite } = usePermissions('hr_employees')
  const [list, setList] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  const load = async () => {
    try {
      const [jobRes, deptRes] = await Promise.all([
        api.get('/jobs'),
        api.get('/departments')
      ])
      setList(jobRes.data.data)
      setDepartments(deptRes.data.data)
    } catch (e) {
      toast.error('Failed to load job registry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to purge ${selectedIds.length} job mandates?`)) return
    const tid = toast.loading('Purging mandates...')
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/jobs/${id}`)))
      toast.success('Mandates purged successfully', { id: tid })
      setSelectedIds([]); load()
    } catch (e) { toast.error('Purge failed', { id: tid }) }
  }

  const save = async () => {
    if (!form.title || !form.department) return toast.error('Mandatory fields missing')
    const tid = toast.loading('Syncing mandate...')
    try {
      if (editing) await api.put(`/jobs/${editing}`, form)
      else await api.post('/jobs', form)
      toast.success(editing ? 'Mandate corrected' : 'Mandate published', { id: tid })
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Sync failed', { id: tid }) }
  }

  const filtered = list.filter(item => 
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.department?.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    if (filtered.length === 0) return toast.error('Registry is empty')
    const headers = ['Title', 'Department', 'Type', 'Openings', 'Status']
    const rows = filtered.map(j => [j.title, j.department, j.positionType, j.openings, j.status])
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `Recruitment_Registry_${new Date().toISOString().slice(0,10)}.csv`)
    link.click()
    toast.success('Registry data exported')
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Talent Acquisition" 
        subtitle="Industrial-grade recruitment monitoring, active sourcing mandates, and strategic headcount planning."
        icon={<Briefcase size={24} className="text-indigo-600" />}
        actions={canWrite && <div className="flex gap-3">
          <ExportButton onClick={handleExport} />
          {selectedIds.length > 0 && (
            <button className="btn-secondary text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white h-[42px]" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Batch Purge ({selectedIds.length})
            </button>
          )}
          <button className="btn-primary h-[42px]" onClick={() => { setForm(blank); setEditing(null); setModal(true) }}><Plus size={14} /> Log Mandate</button>
        </div>} 
      />

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Search by mandate title, role, or functional unit..." 
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
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mandate Profile</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Functional Context</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Headcount</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><Empty /></td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="accent-indigo-600 w-4 h-4 rounded cursor-pointer" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds(p => p.includes(item.id) ? p.filter(i => i !== item.id) : [...p, item.id])} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <UserPlus size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.positionType.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        <Building2 size={12} className="text-indigo-500" /> {item.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                        <Users size={12} /> {item.openings}
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={item.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setForm(item); setEditing(item.id); setModal(true) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Mandate"><Edit3 size={14} /></button>
                        <button onClick={() => { if(confirm('Permanently purge this recruitment mandate?')) api.delete(`/jobs/${item.id}`).then(load) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white uppercase tracking-widest" title="Purge Record"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Mandate Protocol' : 'Log Strategic Career Opportunity'} size="xl">
        <div className="space-y-6 py-6">
          <FormRow cols={2}>
            <div>
              <label className="label uppercase tracking-widest">Mandate Title *</label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" className="input-field pl-9 font-black uppercase tracking-tight" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. OPERATIONS ANALYST" />
              </div>
            </div>
            <SearchableSelect
              label="Functional Unit *"
              options={departments.map(d => ({ label: d.name, value: d.name }))}
              value={form.department}
              onChange={val => setForm({ ...form, department: val })}
              placeholder="Search units..."
            />
          </FormRow>
          <FormRow cols={2}>
            <SearchableSelect
              label="Engagement Classification *"
              options={[{ label: 'PERMANENT (FULL TIME)', value: 'FULL_TIME' }, { label: 'ASSOCIATE (PART TIME)', value: 'PART_TIME' }, { label: 'PROJECT (CONTRACT)', value: 'CONTRACT' }, { label: 'APPRENTICE (INTERN)', value: 'INTERN' }]}
              value={form.positionType}
              onChange={v => setForm({ ...form, positionType: v })}
            />
            <div>
              <label className="label uppercase tracking-widest">Target Headcount *</label>
              <div className="relative">
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" className="input-field pl-9 font-black" value={form.openings} onChange={e => setForm({ ...form, openings: e.target.value })} />
              </div>
            </div>
          </FormRow>
          <SearchableSelect 
            label="Mandate Audit Status" 
            options={[{ label: 'OPEN (ACTIVE SOURCING)', value: 'OPEN' }, { label: 'CLOSED (ARCHIVED)', value: 'CLOSED' }, { label: 'ON HOLD (PENDING BUDGET)', value: 'ON_HOLD' }]}
            value={form.status} 
            onChange={v => setForm({ ...form, status: v })} 
          />
          <div>
            <label className="label uppercase tracking-widest">Mandate Scope & Technical Requirements *</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-4 text-gray-400" />
              <textarea className="input-field pl-9 h-32 font-bold" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Enter comprehensive job scope, technical mandates, and professional requirements..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel Mandate</button>
            <button className="btn-primary px-12" onClick={save}>{editing ? 'Commit Revision' : 'Publish Mandate'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


