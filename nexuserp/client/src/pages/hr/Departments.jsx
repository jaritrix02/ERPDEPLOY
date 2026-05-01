import { useEffect, useState, useRef } from 'react'
import { 
  Briefcase, Plus, Search, Filter, RotateCcw, 
  Edit3, Trash2, Download, Upload, MapPin, Building2,
  GitBranch, Users
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, SearchableSelect } from '../../components/ui'
import { DepartmentForm } from '../../components/hr/MasterForms'
import { usePermissions } from '../../hooks/usePermissions'

const blank = { name: '', location: '' }

export default function Departments() {
  const { canWrite } = usePermissions('hr_departments')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const fileInputRef = useRef(null)

  const load = () => api.get('/departments').then(r => setList(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(blank); setEditing(null); setModal(true) }
  const openEdit = (dep) => { setForm({ name: dep.name, location: dep.location || '' }); setEditing(dep.id); setModal(true) }
  const resetAll = () => setSearch('')

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return toast.error('Please select departments to delete');
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} departments?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/departments/${id}`)));
      toast.success('Selected departments deleted successfully');
      setSelectedIds([]);
      load();
    } catch (e) { toast.error('Some departments could not be deleted'); }
  }

  const toggleSelectAll = (e) => setSelectedIds(e.target.checked ? filtered.map(d => d.id) : [])
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const filtered = list.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.location && d.location.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Functional Departments" 
        subtitle="Orchestrate corporate hierarchy, physical site locations, and departmental mandates."
        icon={<Building2 size={24} className="text-indigo-600" />}
        actions={canWrite && <>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={(e) => {}} />
          {selectedIds.length > 0 && (
            <button className="btn-secondary text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button className="btn-secondary" onClick={() => fileInputRef.current.click()}><Upload size={14} /> Import CSV</button>
          <button className="btn-primary" onClick={openAdd}><Plus size={14} /> Create Department</button>
        </>} 
      />

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Search by functional name or site location..." 
                className="input-field pl-12 font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button onClick={resetAll} className="btn-secondary px-6 h-[42px]"><RotateCcw size={14} /> Reset Filters</button>
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
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Functional Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Site Location</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Headcount</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}><Empty /></td></tr>
                ) : filtered.map((dep) => (
                  <tr key={dep.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={selectedIds.includes(dep.id)} onChange={() => toggleSelect(dep.id)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <GitBranch size={14} />
                        </div>
                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{dep.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                        <MapPin size={12} className="text-gray-400" />
                        {dep.location || 'SITE NOT SPECIFIED'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-900/20 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                        <Users size={12} /> {dep._count?.employees || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canWrite && (
                          <>
                            <button onClick={() => openEdit(dep)} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Entry"><Edit3 size={14}/></button>
                            <button onClick={() => { if(confirm('Are you sure you want to delete this department?')) api.delete(`/departments/${dep.id}`).then(load) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white transition-all" title="Remove Entry"><Trash2 size={14}/></button>
                          </>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Department Protocol' : 'Log New Functional Unit'} size="md">
        <div className="py-6">
          <DepartmentForm 
            initialData={editing ? form : blank}
            onSave={() => { setModal(false); load() }}
            onCancel={() => setModal(false)}
          />
        </div>
      </Modal>
    </div>
  )
}