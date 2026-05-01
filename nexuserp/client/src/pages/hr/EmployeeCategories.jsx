import { useEffect, useState } from 'react'
import { Plus, Search, RotateCcw, Edit3, Trash2, Tag, Layers, Users } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, FormRow, SearchableSelect } from '../../components/ui'
import { CategoryForm } from '../../components/hr/MasterForms'
import { usePermissions } from '../../hooks/usePermissions'

const blank = { name: '' }

export default function EmployeeCategories() {
  const { canWrite } = usePermissions('hr_categories')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  const load = () => api.get('/employee-categories').then(r => setList(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(blank); setEditing(null); setModal(true) }
  const openEdit = (item) => { setForm({ name: item.name }); setEditing(item.id); setModal(true) }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return toast.error('Please select categories to delete');
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} categories?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/employee-categories/${id}`)));
      toast.success('Selected categories deleted successfully');
      setSelectedIds([]);
      load();
    } catch (e) { toast.error('Some categories could not be deleted'); }
  }

  const toggleSelectAll = (e) => setSelectedIds(e.target.checked ? filtered.map(d => d.id) : [])
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const filtered = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Personnel Classification" 
        subtitle="Manage employee grouping logic, contract categories, and payroll classification sets."
        icon={<Tag size={24} className="text-indigo-600" />}
        actions={canWrite && <>
          {selectedIds.length > 0 && (
            <button className="btn-secondary text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button className="btn-primary" onClick={openAdd}><Plus size={14} /> Create Category</button>
        </>} 
      />

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                placeholder="Search by personnel category or classification..." 
                className="input-field pl-12 font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button onClick={() => setSearch('')} className="btn-secondary px-6 h-[42px]"><RotateCcw size={14} /></button>
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
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Classification Set</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Member Count</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={4}><Empty /></td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Layers size={14} />
                        </div>
                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-50 dark:bg-gray-900/20 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                        {item._count?.employees || 0} PERSONNEL
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canWrite && (
                          <>
                            <button onClick={() => openEdit(item)} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Classification"><Edit3 size={14}/></button>
                            <button onClick={() => { if(confirm('Are you sure you want to delete this category?')) api.delete(`/employee-categories/${item.id}`).then(load) }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white transition-all" title="Remove Entry"><Trash2 size={14}/></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Revise Classification Logic' : 'Log New Classification Set'} size="md">
        <div className="py-6">
          <CategoryForm 
            initialData={editing ? form : blank}
            onSave={() => { setModal(false); load() }}
            onCancel={() => setModal(false)}
          />
        </div>
      </Modal>
    </div>
  )
}


