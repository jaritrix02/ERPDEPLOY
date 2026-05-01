import { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { 
  Calendar, Clock, CheckCircle2, XCircle, Search, 
  Filter, RotateCcw, User, ClipboardList, Activity, 
  Trash2, Edit3, Download, Upload, Zap, ChevronRight, 
  MoreVertical, Users, Plus, FileText, Printer, ShieldAlert,
  Building2, LogIn, LogOut, Timer
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Modal, Badge, PageHeader, Spinner, Empty, FormRow, 
  CalendarPicker, SearchableSelect, ExportButton, ImportButton 
} from '../../components/ui'
import { exportToCSV } from '../../utils/exportUtils'

export default function Attendance() {
  const { user } = useSelector(s => s.auth)
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [records, setRecords]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [summary, setSummary]     = useState(null)
  const fileInputRef = useRef(null)

  const [filters, setFilters] = useState({ 
    from: new Date().toISOString().slice(0,10), 
    to: new Date().toISOString().slice(0,10), 
    employeeId: '',
    department: '',
    status: '',
    search: ''
  })

  const [modModal, setModModal]   = useState(false)
  const [modData, setModData]     = useState({ id:'', checkIn:'', checkOut:'', status:'', modifyReason:'' })
  const [markModal, setMarkModal] = useState(false)
  const [markData, setMarkData]   = useState({ employeeId:'', date: new Date().toISOString().slice(0,10), status:'PRESENT', checkIn:'', checkOut:'' })
  const [selectedIds, setSelectedIds] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const [empRes, depRes, attRes, sumRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/attendance', { params: filters }),
        api.get('/attendance/summary', { params: { date: filters.from } })
      ])
      setEmployees(empRes.data.data)
      setDepartments(depRes.data.data)
      setRecords(attRes.data.data)
      setSummary(sumRes.data.data)
    } catch (e) {
      toast.error('Failed to load attendance data')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleExport = () => {
    const headers = [
      { label: 'DATE', key: 'date' },
      { label: 'NAME', key: 'employee.name' },
      { label: 'CODE', key: 'employee.employeeCode' },
      { label: 'STATUS', key: 'status' },
      { label: 'CHECK IN', key: 'checkIn' },
      { label: 'CHECK OUT', key: 'checkOut' },
      { label: 'HOURS', key: 'hoursWorked' }
    ]
    exportToCSV(records, `Attendance_Report_${filters.from}`, headers)
    toast.success('Attendance report exported')
  }

  const saveMark = async () => {
    if(!markData.employeeId) return toast.error('Please select an employee')
    const tid = toast.loading('Saving attendance...')
    try {
      const payload = { ...markData, checkIn: markData.checkIn ? `${markData.date}T${markData.checkIn}:00` : null, checkOut: markData.checkOut ? `${markData.date}T${markData.checkOut}:00` : null }
      await api.post('/attendance', payload)
      toast.success('Attendance marked successfully', { id: tid }); setMarkModal(false); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving attendance', { id: tid }) }
  }

  const saveModify = async () => {
    if (!modData.modifyReason) return toast.error('Reason for modification is required')
    const tid = toast.loading('Updating attendance record...')
    try {
      await api.put(`/attendance/${modData.id}`, modData)
      toast.success('Attendance record updated', { id: tid }); setModModal(false); load()
    } catch (e) { toast.error('Failed to update record', { id: tid }) }
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Attendance Registry" 
        subtitle="Manage daily employee attendance, shift timings, and cumulative work hours."
        icon={<Activity size={24} className="text-indigo-600" />}
        actions={<div className="flex gap-3">
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => setMarkModal(true)}><Plus size={14} /> Mark Attendance</button>
        </div>} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { l: 'Present Today', v: summary?.totalPresent || 0, i: <CheckCircle2 size={20}/>, c: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', s: 'Active Personnel' },
          { l: 'Absent Today', v: summary?.totalAbsent || 0, i: <XCircle size={20}/>, c: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', s: 'On Leave/Absent' },
          { l: 'Total Work Hours', v: `${summary?.totalHours?.toFixed(1) || 0}h`, i: <Clock size={20}/>, c: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', s: 'Cumulative Today' },
          { l: 'Total Headcount', v: employees.length, i: <Users size={20}/>, c: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', s: 'Registered Personnel' }
        ].map((stat, i) => (
          <div key={i} className="card p-6 flex items-start justify-between group hover:border-indigo-200 transition-all">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{stat.l}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{stat.v}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{stat.s}</p>
            </div>
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.c} group-hover:scale-110 transition-transform`}>{stat.i}</div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <CalendarPicker label="From Date" value={filters.from} onChange={v => setFilters(p => ({...p, from: v}))} />
          <CalendarPicker label="To Date" value={filters.to} onChange={v => setFilters(p => ({...p, to: v}))} />
          <SearchableSelect label="Department Filter" options={[{ name: 'All Departments' }, ...departments]} value={filters.department || 'All Departments'} labelKey="name" valueKey="name" onChange={v => setFilters(p => ({...p, department: v === 'All Departments' ? '' : v}))} />
          <SearchableSelect label="Status Context" options={['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'].map(s => ({ label: s, value: s }))} value={filters.status} onChange={v => setFilters(p => ({...p, status: v}))} placeholder="All Status" />
          <div className="lg:col-span-1">
            <label className="label">Search Personnel</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9" placeholder="Code / Name..." value={filters.search} onChange={e => setFilters(p => ({...p, search: e.target.value}))} />
            </div>
          </div>
          <button className="btn-primary w-full" onClick={load}><RotateCcw size={14}/> Sync Data</button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <input type="checkbox" className="accent-indigo-600 w-4 h-4" />
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Personnel Details</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Duration</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {records.length === 0 ? (
                  <tr><td colSpan={8}><Empty /></td></tr>
                ) : records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={selectedIds.includes(r.id)} onChange={() => setSelectedIds(p => p.includes(r.id) ? p.filter(x=>x!==r.id) : [...p, r.id])} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">{r.date?.slice(0,10)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{r.employee?.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{r.employee?.employeeCode} • {r.employee?.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={r.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                        <LogIn size={12} /> {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '--:--'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                        <LogOut size={12} /> {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '--:--'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                        <Timer size={12} /> {r.hoursWorked ? `${r.hoursWorked.toFixed(1)}h` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setModData({ id: r.id, status: r.status, checkIn: r.checkIn?.slice(0,16), checkOut: r.checkOut?.slice(0,16), modifyReason: '' }); setModModal(true); }} className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Correct Record"><Edit3 size={14}/></button>
                         <button className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest" title="Print Statement"><Printer size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MARK ATTENDANCE MODAL */}
      <Modal open={markModal} onClose={() => setMarkModal(false)} title="Log Personnel Attendance" size="xl">
        <div className="space-y-6 py-6">
          <SearchableSelect 
            label="1. Select Personnel *"
            options={employees.map(e => ({ label: `${e.employeeCode} - ${e.name}`, value: e.id, subLabel: e.department }))}
            value={markData.employeeId}
            onChange={v => setMarkData(p => ({...p, employeeId: v}))}
            placeholder="Search personnel directory..."
          />
          <FormRow cols={2}>
            <CalendarPicker label="Log Date" value={markData.date} onChange={v => setMarkData(p => ({...p, date: v}))} />
            <SearchableSelect label="Registry Status" options={['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'].map(s => ({ label: s, value: s }))} value={markData.status} onChange={v => setMarkData(p => ({...p, status: v}))} />
          </FormRow>
          <FormRow cols={2}>
            <div>
              <label className="label">Entry Time</label>
              <div className="relative">
                <LogIn size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input type="time" className="input-field pl-10 font-black" value={markData.checkIn} onChange={e => setMarkData(p => ({...p, checkIn: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="label">Exit Time</label>
              <div className="relative">
                <LogOut size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                <input type="time" className="input-field pl-10 font-black" value={markData.checkOut} onChange={e => setMarkData(p => ({...p, checkOut: e.target.value}))} />
              </div>
            </div>
          </FormRow>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
            <button className="btn-secondary" onClick={() => setMarkModal(false)}>Cancel Action</button>
            <button className="btn-primary px-10" onClick={saveMark}>Commit Log</button>
          </div>
        </div>
      </Modal>

      {/* MODIFICATION MODAL */}
      <Modal open={modModal} onClose={() => setModModal(false)} title="Correct Registry Entry" size="xl">
        <div className="space-y-6 py-6">
          <SearchableSelect label="Corrected Status" options={['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'].map(s => ({ label: s, value: s }))} value={modData.status} onChange={v => setModData(p => ({...p, status: v}))} />
          <FormRow cols={2}>
            <div>
              <label className="label">Actual Entry Time</label>
              <input type="datetime-local" className="input-field font-black" value={modData.checkIn} onChange={e => setModData(p => ({...p, checkIn: e.target.value}))} />
            </div>
            <div>
              <label className="label">Actual Exit Time</label>
              <input type="datetime-local" className="input-field font-black" value={modData.checkOut} onChange={e => setModData(p => ({...p, checkOut: e.target.value}))} />
            </div>
          </FormRow>
          <div>
            <label className="label">Modification Justification *</label>
            <textarea className="input-field font-medium" rows={4} value={modData.modifyReason} onChange={e => setModData(p => ({...p, modifyReason: e.target.value}))} placeholder="Explain the discrepancy or reason for manual adjustment..." />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-800">
            <button className="btn-secondary" onClick={() => setModModal(false)}>Cancel Action</button>
            <button className="btn-primary px-10" onClick={saveModify}>Authorize Correction</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


