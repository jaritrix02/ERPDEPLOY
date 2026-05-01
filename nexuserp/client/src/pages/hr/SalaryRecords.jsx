import { useState, useEffect } from 'react'
import api from '../../services/api'
import { PageHeader, Spinner, Modal, Empty, FormRow, CalendarPicker, SalarySlipTemplate, SearchableSelect, Badge, ExportButton } from '../../components/ui'
import toast from 'react-hot-toast'
import { FileText, Download, Trash2, Printer, RotateCcw, Landmark, User, CreditCard, Receipt, Search } from 'lucide-react'
import { exportToCSV } from '../../utils/exportUtils'

export default function SalaryRecords() {
  const [slips, setSlips] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [selectedSlip, setSelectedSlip] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  const [filters, setFilters] = useState({
    employeeId: '',
    department: '',
    month: '',
    year: new Date().getFullYear(),
    search: ''
  })

  const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const load = async () => {
    try {
        const [salRes, empRes, depRes] = await Promise.all([
            api.get('/salary'),
            api.get('/employees'),
            api.get('/departments')
        ])
        setSlips(salRes.data.data)
        setEmployees(empRes.data.data)
        setDepartments(depRes.data.data)
    } catch (e) { toast.error('Failed to load salary records') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleExport = () => {
    const dataToExport = filteredSlips.length > 0 ? filteredSlips : slips;
    if (dataToExport.length === 0) return toast.error('No data to export');
    
    const headers = [
      { label: 'CYCLE', key: 'cycle' },
      { label: 'NAME', key: 'employee.name' },
      { label: 'CODE', key: 'employee.employeeCode' },
      { label: 'DEPARTMENT', key: 'employee.department' },
      { label: 'EARNINGS', key: 'totalEarnings' },
      { label: 'DEDUCTIONS', key: 'totalDeductions' },
      { label: 'NET PAYABLE', key: 'netPayable' }
    ]
    
    const formatted = dataToExport.map(s => ({
      ...s,
      cycle: `${monthsList[s.month-1]} ${s.year}`
    }))

    exportToCSV(formatted, `Salary_Registry_${new Date().toISOString().slice(0,10)}`, headers)
    toast.success('Payroll registry exported')
  };

  const filteredSlips = slips.filter(s => {
    const matchEmp = !filters.employeeId || s.employeeId === filters.employeeId
    const matchDept = !filters.department || s.employee?.department === filters.department
    const matchMonth = !filters.month || s.month === Number(filters.month)
    const matchYear = !filters.year || s.year === Number(filters.year)
    const matchSearch = !filters.search || 
                       s.employee?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                       s.employee?.employeeCode?.toLowerCase().includes(filters.search.toLowerCase())
    return matchEmp && matchDept && matchMonth && matchYear && matchSearch
  })

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return toast.error('Please select records to delete');
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} salary records?`)) return;
    const tid = toast.loading('Deleting selected records...')
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/salary/${id}`)));
      toast.success('Selected records deleted successfully', { id: tid });
      setSelectedIds([]);
      load();
    } catch (e) { toast.error('Some records could not be deleted', { id: tid }); }
  }

  const toggleSelectAll = (e) => setSelectedIds(e.target.checked ? filteredSlips.map(s => s.id) : [])
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="space-y-8 pb-12 no-print">
      <PageHeader 
        title="Payroll Archive" 
        subtitle="Historical repository of verified salary disbursements, tax computations, and statutory compliance logs."
        icon={<Landmark size={24} className="text-indigo-600" />}
        actions={<div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button className="btn-secondary text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <ExportButton onClick={handleExport} />
        </div>}
      />

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <SearchableSelect 
             label="Department Unit"
             options={[{ name: 'All Departments', id: '' }, ...departments]}
             value={filters.department}
             labelKey="name"
             valueKey="name"
             onChange={val => setFilters(p => ({ ...p, department: val === 'All Departments' ? '' : val, employeeId: '' }))}
             placeholder="All Units..."
          />
          <SearchableSelect 
             label="Specific Personnel"
             options={employees.filter(e => !filters.department || e.department === filters.department).map(e => ({ label: `${e.employeeCode} - ${e.name}`, value: e.id, subLabel: e.department }))}
             value={filters.employeeId}
             onChange={val => setFilters(p => ({ ...p, employeeId: val }))}
             placeholder="Search directory..."
          />
          <CalendarPicker 
              mode="month" 
              label="Payroll Cycle" 
              value={filters.year && filters.month ? `${filters.year}-${String(filters.month).padStart(2, '0')}` : ''}
              onChange={v => {
                  if (v) {
                      const [y, m] = v.split('-')
                      setFilters({...filters, year: Number(y), month: Number(m)})
                  } else {
                      setFilters({...filters, year: '', month: ''})
                  }
              }}
          />
          <div className="lg:col-span-1">
            <label className="label">General Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9 font-medium" placeholder="Name or Code..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
            </div>
          </div>
          <button className="btn-secondary w-full h-[42px]" onClick={() => setFilters({ employeeId:'', department:'', month:'', year: new Date().getFullYear(), search:'' })}><RotateCcw size={14} /> Reset Filters</button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <input type="checkbox" className="accent-indigo-600 w-4 h-4" onChange={toggleSelectAll} checked={filteredSlips.length > 0 && selectedIds.length === filteredSlips.length} />
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disbursement Cycle</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Beneficiary Personnel</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Disbursement</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredSlips.length === 0 ? (
                  <tr><td colSpan={5}><Empty /></td></tr>
                ) : filteredSlips.map(slip => (
                  <tr key={slip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={selectedIds.includes(slip.id)} onChange={() => toggleSelect(slip.id)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Receipt size={14} className="text-gray-400" />
                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                          {(monthsList[slip.month-1] || 'CYCLE')} {slip.year}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{slip.employee?.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{slip.employee?.employeeCode} • {slip.employee?.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                        ₹{(Number(slip.netPayable) || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedSlip(slip); setPreviewOpen(true); }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Preview Statement"><Printer size={14}/></button>
                        <button className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Digital Download"><Download size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Disbursement Statement Protocol" size="4xl">
         {selectedSlip && (
            <div className="space-y-6 py-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="bg-white shadow-2xl mx-auto overflow-hidden rounded-sm ring-1 ring-gray-200">
                        <SalarySlipTemplate form={selectedSlip} monthsList={monthsList} />
                    </div>
                </div>
                <div className="flex gap-4 no-print border-t dark:border-gray-800 pt-6">
                    <button className="flex-1 py-3 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors" onClick={() => setPreviewOpen(false)}>Terminate Preview</button>
                    <button className="btn-primary flex-1 py-3" onClick={() => window.print()}><Printer size={16} /> Execute Print Protocol</button>
                </div>
            </div>
         )}
      </Modal>

      <div className="print-only">
        <SalarySlipTemplate form={selectedSlip} monthsList={monthsList} />
      </div>
    </div>
  )
}



