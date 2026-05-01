import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, Modal, Spinner, Badge, LiveMeter, SearchableSelect } from '../../components/ui'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, differenceInSeconds } from 'date-fns'

const Icon = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const paths = {
  plus: 'M12 4v16m8-8H4',
  chevronLeft: 'M15 19l-7-7 7-7',
  chevronRight: 'M9 5l7 7-7 7',
  download: 'M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 21v-5a2 2 0 00-2-2H10a2 2 0 00-2 2v5m4-9V3m0 0l-4 4m4-4l4 4',
  print: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
  check: 'M5 13l4 4L19 7',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  play: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
  stop: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 9h6v6H9z'
}

export default function TaskMaster() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    date: format(new Date(), 'yyyy-MM-dd'), 
    category: 'DAILY', 
    priority: 'NORMAL', 
    completion: 0,
    assignedTo: '',
    deadline: '',
    estimatedHours: 0
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksRes, empRes] = await Promise.all([
        api.get('/tasks', {
          params: {
            start: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
            end: format(endOfMonth(currentMonth), 'yyyy-MM-dd')
          }
        }),
        api.get('/employees')
      ])
      setTasks(tasksRes.data.data)
      setEmployees(empRes.data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [currentMonth])

  const handleSubmit = async () => {
    try {
      if (editTask) {
        await api.put(`/tasks/${editTask.id}`, form)
        toast.success('Task updated')
      } else {
        await api.post('/tasks', form)
        toast.success('Task added')
      }
      setShowModal(false)
      loadData()
    } catch (e) { toast.error('Error saving task') }
  }

  const toggleTimer = async (id) => {
    try {
        await api.put(`/tasks/${id}`, { toggleTimer: true })
        toast.success('Timer state changed')
        loadData()
    } catch (e) { toast.error('Timer error') }
  }

  const deleteTask = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.delete(`/tasks/${id}`)
      toast.success('Task deleted')
      loadData()
    } catch (e) { toast.error('Error deleting task') }
  }

  const exportExcel = () => {
    const headers = ['Date', 'Title', 'Category', 'Priority', 'Status', 'Completion %']
    const rows = tasks.map(t => [t.date.split('T')[0], t.title, t.category, t.priority, t.status, t.completion])
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Tasks_${format(currentMonth, 'MMM_yyyy')}.csv`
    a.click()
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })

  return (
    <div className="pb-20 text-black dark:text-white">
      <PageHeader title="Task Master & Calendar" subtitle="Manage your daily schedule, legal notices, and meetings"
        actions={<>
          <button className="btn-secondary flex items-center gap-2" onClick={exportExcel}>
            <Icon d={paths.download} /> Export CSV
          </button>
          <button className="btn-primary flex items-center gap-2 px-6" onClick={() => { setEditTask(null); setForm({ title: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), category: 'DAILY', priority: 'NORMAL', completion: 0, assignedTo:'', deadline:'', estimatedHours:0 }); setShowModal(true) }}>
            <Icon d={paths.plus} /> Add Task
          </button>
        </>} />
      {/* Productivity Pulse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="card p-6 flex items-center justify-between shadow-2xl border-t-4 border-blue-500">
              <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Monthly Target</p>
                  <p className="text-2xl font-black mt-1">{(tasks.filter(t=>t.status==='COMPLETED').length / (tasks.length || 1) * 100).toFixed(0)}%</p>
              </div>
              <LiveMeter value={parseFloat((tasks.filter(t=>t.status==='COMPLETED').length / (tasks.length || 1) * 100).toFixed(0))} size={60} color="#3b82f6" />
          </div>
          <div className="card p-6 flex items-center justify-between shadow-2xl border-t-4 border-emerald-500">
              <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Focus</p>
                  <p className="text-2xl font-black mt-1">{tasks.filter(t=>t.timerActive).length}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center animate-ping">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
              </div>
          </div>
          <div className="card p-6 flex items-center justify-between shadow-2xl border-t-4 border-orange-500">
              <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Critical Notices</p>
                  <p className="text-2xl font-black mt-1">{tasks.filter(t=>t.priority==='URGENT').length}</p>
              </div>
              <LiveMeter value={tasks.filter(t=>t.priority==='URGENT').length * 10} size={60} color="#f97316" />
          </div>
          <div className="card p-6 flex items-center justify-between shadow-2xl border-t-4 border-purple-500">
              <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Efficiency</p>
                  <p className="text-2xl font-black mt-1">0.92</p>
              </div>
              <LiveMeter value={92} size={60} color="#a855f7" />
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Column */}
        <div className="lg:col-span-3">
          <div className="card p-6 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-slate-800">
              <h2 className="text-2xl font-black uppercase tracking-tighter">{format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <Icon d={paths.chevronLeft} />
                </button>
                <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <Icon d={paths.chevronRight} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-slate-50 dark:bg-slate-900 p-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{d}</div>
              ))}
              {/* Dummy start days */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white dark:bg-[#0f172a] h-32 opacity-20"></div>
              ))}
              {days.map(day => {
                const dayTasks = tasks.filter(t => {
                  return t.date.split('T')[0] === format(day, 'yyyy-MM-dd');
                })
                return (
                  <div key={day.toString()} className="bg-white dark:bg-[#0f172a] h-32 p-2 border-r border-b border-slate-50 dark:border-slate-800 group transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <span className={`text-xs font-black p-1 inline-block rounded ${isSameDay(day, new Date()) ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-slate-400'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-1 overflow-y-auto h-20 scrollbar-hide">
                      {dayTasks.map(t => (
                        <div key={t.id} onClick={() => { setEditTask(t); setForm({ ...t, date: t.date.split('T')[0], deadline: t.deadline ? t.deadline.split('T')[0] : '' }); setShowModal(true) }} className={`text-[9px] p-1 rounded font-bold uppercase truncate border-l-2 cursor-pointer ${t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-500' : 'bg-blue-50 text-blue-600 border-blue-500'}`}>
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Task List Column */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[80vh] pr-2">
           <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Upcoming Highlights</h3>
           {loading ? <Spinner /> : tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').map(t => (
             <div key={t.id} className="card p-4 border-l-4 border-red-500 shadow-xl bg-red-50/10">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">{t.priority}</span>
                    <span className="text-[10px] font-bold text-slate-400">{format(new Date(t.date), 'dd MMM')}</span>
                </div>
                <h4 className="text-sm font-black uppercase text-black dark:text-white leading-tight mb-2">{t.title}</h4>
                <div className="flex justify-between items-center mt-4">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${t.completion}%` }}></div>
                    </div>
                    <span className="text-[10px] font-black ml-3">{t.completion}%</span>
                </div>
             </div>
           ))}
           {tasks.length === 0 && <div className="text-center py-20 opacity-30 font-black uppercase text-xs">No special tasks noted</div>}
        </div>
      </div>

      {/* Task Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTask ? "Edit Activity / Notice" : "Record New Activity"} size="md">
          <div className="space-y-6 text-black dark:text-white">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                  <SearchableSelect 
                    label="Assign To Employee"
                    options={employees.map(e => ({ label: e.name, subLabel: `CODE: ${e.employeeCode || 'N/A'}`, value: e.name }))}
                    value={form.assignedTo}
                    onChange={val => setForm(p => ({ ...p, assignedTo: val }))}
                    placeholder="Search Employee..."
                  /></div>
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Category *</label>
                  <select className="input-field font-bold" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      <option value="DAILY">DAILY TASK</option><option value="MEETING">COMPANY MEETING</option><option value="LEGAL">LEGAL NOTICE</option><option value="NOTICE">GENERAL NOTICE</option><option value="OTHER">OTHER ACTIVITY</option>
                  </select></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Start Date *</label>
                  <input type="date" className="input-field font-bold" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Deadline (End Date)</label>
                  <input type="date" className="input-field font-bold" value={form.deadline?.split('T')[0] || ''} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} /></div>
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Est. Hours</label>
                  <input type="number" className="input-field font-bold" value={form.estimatedHours} onChange={e => setForm(p => ({ ...p, estimatedHours: parseInt(e.target.value) }))} /></div>
              </div>
              <div><label className="label text-[10px] font-bold uppercase mb-1.5">Activity Title *</label>
              <input className="input-field font-black uppercase" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="E.G. BOARD MEETING ON ANNUAL GROWTH" /></div>
              <div><label className="label text-[10px] font-bold uppercase mb-1.5">Description / Agenda</label>
              <textarea className="input-field font-bold" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief summary of the activity..." /></div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Priority Level</label>
                  <select className="input-field font-bold" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                      <option value="LOW">LOW</option><option value="NORMAL">NORMAL</option><option value="HIGH">HIGH</option><option value="URGENT">URGENT</option>
                  </select></div>
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Current Progress ({form.completion}%)</label>
                  <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white" min="0" max="100" value={form.completion} onChange={e => setForm(p => ({ ...p, completion: parseInt(e.target.value), status: parseInt(e.target.value) === 100 ? 'COMPLETED' : 'PENDING' }))} /></div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t dark:border-slate-800">
                  {editTask && <button className="text-red-500 font-bold uppercase text-xs hover:underline" onClick={() => deleteTask(editTask.id)}>Delete Activity</button>}
                  <div className="flex gap-3 ml-auto">
                    <button className="btn-secondary px-8" onClick={() => setShowModal(false)}>Discard</button>
                    <button className="btn-primary px-12" onClick={handleSubmit}>Save Entry</button>
                  </div>
              </div>
          </div>
      </Modal>

      <div className="mt-8">
          <div className="card p-0 overflow-hidden shadow-2xl">
              <div className="bg-black dark:bg-slate-900 p-4 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Detailed Ledger of Activities</h3>
                  <button className="text-[10px] font-black text-white uppercase flex items-center gap-2 hover:text-primary-400 transition-colors" onClick={() => window.print()}>
                      <Icon d={paths.print} /> Print Report
                  </button>
              </div>
              <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-[#0f172a] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <tr><th className="px-6 py-3">Assignee / Task</th><th className="px-6 py-3">Timing & Deadline</th><th className="px-6 py-3">Category</th><th className="px-6 py-3 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {tasks.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-b dark:border-slate-800/50">
                              <td className="px-6 py-4">
                                  <div className="flex items-start gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-400">
                                          {t.assignedTo ? t.assignedTo.charAt(0) : '?'}
                                      </div>
                                      <div>
                                          <p className="font-black text-sm uppercase leading-none">{t.title}</p>
                                          <p className="text-[9px] font-bold text-primary-500 uppercase mt-1 tracking-widest">{t.assignedTo || 'Unassigned'}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
                                          <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-3 h-3" />
                                          {format(new Date(t.date), 'dd MMM')} → {t.deadline ? format(new Date(t.deadline), 'dd MMM') : 'No Deadline'}
                                      </div>
                                      <div className="flex items-center gap-4 mt-2">
                                          <div className="flex items-center gap-1.5">
                                              <button onClick={() => toggleTimer(t.id)} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${t.timerActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-emerald-500 hover:text-white'}`}>
                                                  <Icon d={t.timerActive ? paths.stop : paths.play} className="w-2.5 h-2.5" />
                                              </button>
                                              <span className="text-[10px] font-black font-mono">
                                                  {Math.floor(t.totalSeconds / 3600).toString().padStart(2,'0')}:
                                                  {Math.floor((t.totalSeconds % 3600) / 60).toString().padStart(2,'0')}:
                                                  {(t.totalSeconds % 60).toString().padStart(2,'0')}
                                              </span>
                                          </div>
                                          <span className="text-[9px] font-bold text-slate-400">EST: {t.estimatedHours}h</span>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 w-fit">{t.category}</span>
                                      <Badge status={t.status} />
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-6">
                                      <div className="text-right flex flex-col items-end">
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className="text-[10px] font-black">{t.completion}%</span>
                                              <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                  <div className={`h-full transition-all duration-700 ${t.completion === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${t.completion}%` }}></div>
                                              </div>
                                          </div>
                                          {t.status === 'COMPLETED' && <span className="text-[8px] font-black text-emerald-500 uppercase">Signed by {t.completedBy}</span>}
                                      </div>
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                          <button onClick={() => { setEditTask(t); setForm({ ...t, date: t.date.split('T')[0], deadline: t.deadline ? t.deadline.split('T')[0] : '' }); setShowModal(true) }} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                                              <Icon d={paths.plus} className="w-4 h-4 rotate-45" />
                                          </button>
                                      </div>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  )
}
