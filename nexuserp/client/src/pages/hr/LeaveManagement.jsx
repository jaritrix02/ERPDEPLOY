import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow, SearchableSelect, Badge, CalendarPicker } from '../../components/ui'
import { usePermissions } from '../../hooks/usePermissions'
import { CalendarRange, Trash2, CheckCircle, XCircle, Edit, Plus, RotateCcw, User, Info, Search, Filter } from 'lucide-react'

const blank = { employeeId: '', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '', status: 'PENDING' }

export default function LeaveManagement() {
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
      const [leaveRes, empRes] = await Promise.all([
        api.get('/leaves'),
        api.get('/employees')
      ])
      setList(leaveRes.data.data)
      setEmployees(empRes.data.data)
    } catch (e) {
      toast.error('Failed to load leave records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return toast.error('Please select records to delete');
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} leave records?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/leaves/${id}`)));
      toast.success('Selected records deleted successfully');
      setSelectedIds([]);
      load();
    } catch (e) { toast.error('Some records could not be deleted'); }
  }

  const toggleSelectAll = (e) => setSelectedIds(e.target.checked ? filtered.map(item => item.id) : [])
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const save = async () => {
    try {
      if (!form.employeeId || !form.startDate || !form.endDate) return toast.error('Mandatory fields missing')
      const tid = toast.loading('Processing leave record...')
      if (editing) await api.put(`/leaves/${editing}`, form)
      else await api.post('/leaves', form)
      toast.success(editing ? 'Leave protocol updated' : 'Leave request logged', { id: tid })
      setModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Error processing leave') }
  }

  const approve = async (id, status) => {
    const tid = toast.loading(`Setting status to ${status}...`)
    try {
      await api.put(`/leaves/${id}`, { status })
      toast.success(`Leave status updated to ${status}`, { id: tid })
      load()
    } catch (e) { toast.error('Action failed', { id: tid }) }
  }

  const filtered = list.filter(item => 
    item.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.employee?.employeeCode?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Leave Registry" 
        subtitle="Orchestrate personnel absence requests, departmental coverage, and leave balance protocols."
        icon={<CalendarRange size={24} className="text-indigo-600" />}
        actions={canWrite && <>
          {selectedIds.length > 0 && (
            <button className="btn-secondary text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button className="btn-primary" onClick={() => { setForm(blank); setEditing(null); setModal(true) }}><Plus size={14} /> Log Request</button>
        </>} 
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
                    <input type="checkbox" className="accent-indigo-600 w-4 h-4" onChange={toggleSelectAll} checked={filtered.length > 0 && selectedIds.length === filtered.length} />
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Personnel Details</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classification</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requested Tenure</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Approval Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><Empty /></td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.employee?.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.employee?.employeeCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-0.5 rounded-full w-fit tracking-widest border border-indigo-100 dark:border-indigo-800">
                          {item.leaveType}
                        </span>
                        {item.reason && (
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                            <Info size={12} className="shrink-0" /> <span className="truncate max-w-[150px]">{item.reason}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-tighter">{item.startDate}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UNTIL {item.endDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={item.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.status === 'PENDING' && canWrite && (
                          <>
                            <button onClick={() => approve(item.id, 'APPROVED')} className="btn-secondary py-1.5 px-3 text-[10px] font-black text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-widest" title="Approve"><CheckCircle size={14} /></button>
                            <button onClick={() => approve(item.id, 'REJECTED')} className="btn-secondary py-1.5 px-3 text-[10px] font-black text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white transition-all uppercase tracking-widest" title="Reject"><XCircle size={14} /></button>
                          </>
                        )}
                        <button onClick={() => { setForm(item); setEditing(item.id); setModal(true) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Entry"><Edit size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Absence Protocol' : 'Log New Tenure Request'} size="xl">
        <div className="space-y-6 py-6">
          <SearchableSelect
            label="Personnel Selection *"
            options={employees.map(e => ({ ...e, label: `${e.employeeCode} - ${e.name}`, value: e.id }))}
            value={form.employeeId}
            onChange={val => setForm({ ...form, employeeId: val })}
            placeholder="Search organizational directory..."
          />
          <FormRow cols={2}>
            <SearchableSelect 
              label="Leave Classification" 
              options={['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'LOP'].map(s => ({ label: s, value: s }))} 
              value={form.leaveType} 
              onChange={val => setForm({ ...form, leaveType: val })} 
            />
            <SearchableSelect 
              label="Approval Authorization" 
              options={['PENDING', 'APPROVED', 'REJECTED'].map(s => ({ label: s, value: s }))} 
              value={form.status} 
              onChange={val => setForm({ ...form, status: val })} 
            />
          </FormRow>
          <FormRow cols={2}>
            <CalendarPicker label="Tenure Start" value={form.startDate} onChange={val => setForm({ ...form, startDate: val })} />
            <CalendarPicker label="Tenure End" value={form.endDate} onChange={val => setForm({ ...form, endDate: val })} />
          </FormRow>
          <div>
            <label className="label">Justification Reason</label>
            <textarea className="input-field font-medium" rows={4} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="State primary objective or necessity for absence tenure..." />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel Action</button>
            <button className="btn-primary px-10" onClick={save}>{editing ? 'Commit Revision' : 'Authorize Log'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



