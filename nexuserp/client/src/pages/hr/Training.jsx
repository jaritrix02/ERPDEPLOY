import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow, Badge, CalendarPicker, SearchableSelect, ExportButton } from '../../components/ui'
import { usePermissions } from '../../hooks/usePermissions'
import { GraduationCap, Trash2, Edit3, Plus, RotateCcw, User, BookOpen, Presentation, Search, History, ShieldCheck, FileText } from 'lucide-react'

const blank = { title: '', type: 'TECHNICAL', trainer: '', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), status: 'PLANNED', description: '' }

export default function Training() {
  const { canWrite } = usePermissions('hr_employees')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  const load = async () => {
    try {
      const res = await api.get('/trainings')
      setList(res.data.data)
    } catch (e) {
      toast.error('Failed to load training registry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to purge ${selectedIds.length} training programs?`)) return
    const tid = toast.loading('Purging programs...')
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/trainings/${id}`)))
      toast.success('Programs purged successfully', { id: tid })
      setSelectedIds([]); load()
    } catch (e) { toast.error('Purge failed', { id: tid }) }
  }

  const save = async () => {
    if (!form.title || !form.startDate) return toast.error('Mandatory fields missing')
    const tid = toast.loading('Syncing program...')
    try {
      if (editing) await api.put(`/trainings/${editing}`, form)
      else await api.post('/trainings', form)
      toast.success(editing ? 'Program revised' : 'Program scheduled', { id: tid })
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Sync failed', { id: tid }) }
  }

  const filtered = list.filter(item => 
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.trainer?.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    if (filtered.length === 0) return toast.error('Registry is empty')
    const headers = ['Title', 'Type', 'Trainer', 'Start', 'End', 'Status']
    const rows = filtered.map(t => [t.title, t.type, t.trainer, t.startDate, t.endDate, t.status])
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `Training_Registry_${new Date().toISOString().slice(0,10)}.csv`)
    link.click()
    toast.success('Registry data exported')
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Training Registry" 
        subtitle="Industrial-grade professional development monitoring, technical certifications, and compliance mandates."
        icon={<GraduationCap size={24} className="text-indigo-600" />}
        actions={canWrite && <div className="flex gap-3">
          <ExportButton onClick={handleExport} />
          {selectedIds.length > 0 && (
            <button className="btn-secondary text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white h-[42px]" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Batch Purge ({selectedIds.length})
            </button>
          )}
          <button className="btn-primary h-[42px]" onClick={() => { setForm(blank); setEditing(null); setModal(true) }}><Plus size={14} /> Schedule Program</button>
        </div>} 
      />

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Search by program title, lead trainer, or technical scope..." 
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
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Program Detail</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trainer Context</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schedule Portfolio</th>
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
                          <BookOpen size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        <Presentation size={12} className="text-indigo-500" /> {item.trainer}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                          <History size={12} className="text-indigo-500" /> {new Date(item.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter italic">TO {new Date(item.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={item.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setForm(item); setEditing(item.id); setModal(true) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Program"><Edit3 size={14} /></button>
                        <button onClick={() => { if(confirm('Permanently purge this training program?')) api.delete(`/trainings/${item.id}`).then(load) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white uppercase tracking-widest" title="Purge Record"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Training Protocol' : 'Schedule Strategic Development'} size="xl">
        <div className="space-y-6 py-6">
          <div>
            <label className="label uppercase tracking-widest">Program Title *</label>
            <div className="relative">
              <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" className="input-field pl-9 font-black uppercase tracking-tight" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. TECHNICAL COMPLIANCE MODULE" />
            </div>
          </div>
          <FormRow cols={2}>
            <SearchableSelect
              label="Program Category *"
              options={[{ label: 'TECHNICAL AUDIT', value: 'TECHNICAL' }, { label: 'PROFESSIONAL SKILLS', value: 'SOFT_SKILLS' }, { label: 'REGULATORY COMPLIANCE', value: 'COMPLIANCE' }, { label: 'CORPORATE INDUCTION', value: 'ONBOARDING' }]}
              value={form.type}
              onChange={v => setForm({ ...form, type: v })}
            />
            <div>
              <label className="label uppercase tracking-widest">Lead Facilitator *</label>
              <div className="relative">
                <Presentation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" className="input-field pl-9 font-bold uppercase" value={form.trainer} onChange={e => setForm({ ...form, trainer: e.target.value })} placeholder="Agency or Lead Name" />
              </div>
            </div>
          </FormRow>
          <FormRow cols={2}>
            <CalendarPicker label="Commencement Date *" value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} />
            <CalendarPicker label="Conclusion Date *" value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} />
          </FormRow>
          <SearchableSelect 
            label="Registry Audit Status" 
            options={[{ label: 'PLANNED (SCHEDULED)', value: 'PLANNED' }, { label: 'IN PROGRESS (ACTIVE)', value: 'IN_PROGRESS' }, { label: 'COMPLETED (ARCHIVED)', value: 'COMPLETED' }, { label: 'CANCELLED (VOID)', value: 'CANCELLED' }]}
            value={form.status} 
            onChange={v => setForm({ ...form, status: v })} 
          />
          <div>
            <label className="label uppercase tracking-widest">Program Scope & Objectives</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-4 text-gray-400" />
              <textarea className="input-field pl-9 h-32 font-bold" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Enter comprehensive program scope and learning objectives..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel Protocol</button>
            <button className="btn-primary px-12" onClick={save}>{editing ? 'Commit Revision' : 'Archive Schedule'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



