import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow, SearchableSelect, Badge, CalendarPicker } from '../../components/ui'
import { usePermissions } from '../../hooks/usePermissions'
import { TrendingUp, Trash2, Edit3, Plus, RotateCcw, Star, User, MessageSquare, Search, ShieldCheck, History } from 'lucide-react'

const blank = { employeeId: '', reviewDate: new Date().toISOString().slice(0, 10), rating: 5, comments: '', status: 'COMPLETED' }

export default function Performance() {
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
      const [perfRes, empRes] = await Promise.all([
        api.get('/performance'),
        api.get('/employees')
      ])
      setList(perfRes.data.data)
      setEmployees(empRes.data.data)
    } catch (e) {
      toast.error('Failed to load appraisal registry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to purge ${selectedIds.length} appraisal records?`)) return
    const tid = toast.loading('Purging records...')
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/performance/${id}`)))
      toast.success('Records purged successfully', { id: tid })
      setSelectedIds([]); load()
    } catch (e) { toast.error('Purge failed', { id: tid }) }
  }

  const save = async () => {
    if (!form.employeeId || !form.rating) return toast.error('Mandatory fields missing')
    const tid = toast.loading('Syncing appraisal record...')
    try {
      if (editing) await api.put(`/performance/${editing}`, form)
      else await api.post('/performance', form)
      toast.success(editing ? 'Dossier revised' : 'Appraisal archived', { id: tid })
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Sync failed', { id: tid }) }
  }

  const filtered = list.filter(item => 
    item.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.employee?.employeeCode?.toLowerCase().includes(search.toLowerCase())
  )

  const RatingBadge = ({ score }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-900 border dark:border-gray-800">
      <Star size={12} className={score >= 4 ? 'text-emerald-500 fill-emerald-500' : score >= 3 ? 'text-amber-500 fill-amber-500' : 'text-rose-500 fill-rose-500'} /> 
      <span className="text-gray-900 dark:text-white">{score}</span>
      <span className="text-gray-400">/ 5</span>
    </div>
  )

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Appraisal Registry" 
        subtitle="Industrial-grade performance monitoring, strategic personnel development history, and appraisal audits."
        icon={<TrendingUp size={24} className="text-indigo-600" />}
        actions={canWrite && <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button className="btn-secondary text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white h-[42px]" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Batch Purge ({selectedIds.length})
            </button>
          )}
          <button className="btn-primary h-[42px]" onClick={() => { setForm(blank); setEditing(null); setModal(true) }}><Plus size={14} /> Log Appraisal</button>
        </div>} 
      />

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Search by personnel name or identification code..." 
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
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Score Profile</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Audit Context</th>
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
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.employee?.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.employee?.employeeCode} • {item.employee?.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <RatingBadge score={item.rating} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                          <History size={12} className="text-indigo-500" /> {new Date(item.reviewDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        {item.comments && (
                          <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-tighter line-clamp-1 italic">
                            <MessageSquare size={10} /> {item.comments}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={item.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setForm(item); setEditing(item.id); setModal(true) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Appraisal"><Edit3 size={14} /></button>
                        <button onClick={() => { if(confirm('Permanently purge this appraisal record?')) api.delete(`/performance/${item.id}`).then(load) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white uppercase tracking-widest" title="Purge Record"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Performance Audit' : 'Record Personnel Appraisal'} size="xl">
        <div className="space-y-6 py-6">
          <SearchableSelect
            label="Personnel Identity *"
            options={employees.map(e => ({ label: `${e.employeeCode} - ${e.name}`, value: e.id, subLabel: e.department }))}
            value={form.employeeId}
            onChange={val => setForm({ ...form, employeeId: val })}
            placeholder="Search directory..."
          />
          <FormRow cols={2}>
            <CalendarPicker label="Audit Date *" value={form.reviewDate} onChange={v => setForm({ ...form, reviewDate: v })} />
            <SearchableSelect 
              label="Performance Score (1-5) *" 
              options={[1, 2, 3, 4, 5].map(s => ({ label: `${s} Stars`, value: s }))}
              value={form.rating} 
              onChange={v => setForm({ ...form, rating: v })} 
            />
          </FormRow>
          <SearchableSelect 
            label="Registry Audit Status" 
            options={[{ label: 'PENDING REVIEW', value: 'PENDING' }, { label: 'DRAFTING PROGRESS', value: 'IN_PROGRESS' }, { label: 'FINALIZED REGISTRY', value: 'COMPLETED' }]}
            value={form.status} 
            onChange={v => setForm({ ...form, status: v })} 
          />
          <div>
            <label className="label uppercase tracking-widest">Professional Feedback & Justification *</label>
            <div className="relative">
              <MessageSquare size={14} className="absolute left-3 top-4 text-gray-400" />
              <textarea className="input-field pl-9 h-32 font-bold" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} placeholder="Enter comprehensive performance summary or professional development notes..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel Audit</button>
            <button className="btn-primary px-12" onClick={save}>{editing ? 'Commit Revision' : 'Archive Appraisal'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



