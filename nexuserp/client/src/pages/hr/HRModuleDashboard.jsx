import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Spinner } from '../../components/ui'
import { Users, UserCheck, UserX, Clock, Building, Briefcase, FileText, IndianRupee, TrendingUp, GraduationCap, LogOut, LayoutDashboard, Calendar, History, ClipboardCheck, ShieldCheck } from 'lucide-react'

const StatBox = ({ label, value, color, icon: Icon, sub }) => {
  const colors = {
    blue: 'border-blue-500 text-blue-600',
    green: 'border-emerald-500 text-emerald-600',
    amber: 'border-amber-500 text-amber-600',
    red: 'border-rose-500 text-rose-600',
    purple: 'border-purple-500 text-purple-600',
    indigo: 'border-indigo-500 text-indigo-600',
  }
  return (
    <div className={`card p-5 border-t-4 shadow-sm ${colors[color]?.split(' ')[0] || 'border-blue-500'}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 ${colors[color]?.split(' ')[1] || 'text-blue-600'}`}><Icon size={18} /></div>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{value ?? '0'}</p>
      {sub && <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{sub}</p>}
    </div>
  )
}

const QuickLink = ({ to, label, icon: Icon, color }) => {
  const navigate = useNavigate()
  const colors = {
    blue: 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30',
    green: 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30',
    purple: 'text-purple-600 bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30',
    amber: 'text-amber-600 bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30',
    red: 'text-rose-600 bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30',
    indigo: 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30',
  }
  return (
    <button 
      onClick={() => navigate(to)}
      className={`card p-6 flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] border shadow-sm hover:shadow-md ${colors[color] || colors.blue}`}
    >
      <Icon size={28} strokeWidth={2.5} />
      <p className="text-[10px] font-black uppercase tracking-widest text-center">{label}</p>
    </button>
  )
}

export default function HRModuleDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    Promise.all([
      api.get('/employees').catch(() => ({ data: { data: [] } })),
      api.get('/attendance').catch(() => ({ data: { data: [] } })),
    ]).then(([empRes, attRes]) => {
      const emps = empRes.data.data || []
      const att = attRes.data.data || []
      const today = new Date().toISOString().slice(0, 10)
      const todayAtt = att.filter(a => a.date?.slice(0, 10) === today)
      setStats({
        total: emps.length,
        active: emps.filter(e => e.isActive).length,
        presentToday: todayAtt.filter(a => a.status === 'PRESENT').length,
        absentToday: todayAtt.filter(a => a.status === 'ABSENT').length,
        halfDay: todayAtt.filter(a => a.status === 'HALF_DAY').length,
        departments: [...new Set(emps.map(e => e.department))].length,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-96 flex items-center justify-center"><Spinner /></div>

  return (
    <div className="space-y-12 pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b dark:border-gray-800 pb-8">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none"><ShieldCheck size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Human Resources</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Enterprise Personnel Management System</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-end">
          <p className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tighter">{time.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</p>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{new Date().toLocaleDateString('en-IN', {weekday:'long', day:'2-digit', month:'short', year:'numeric'})}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatBox label="Total Staff" value={stats?.total} color="blue" icon={Users} />
        <StatBox label="Active Workforce" value={stats?.active} color="green" icon={UserCheck} />
        <StatBox label="Present Today" value={stats?.presentToday} color="green" icon={Clock} />
        <StatBox label="Absent Alerts" value={stats?.absentToday} color="red" icon={UserX} />
        <StatBox label="Half Day" value={stats?.halfDay} color="amber" icon={Clock} />
        <StatBox label="Departments" value={stats?.departments} color="indigo" icon={Building} />
      </div>

      <div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 flex items-center gap-4">
          Operational Core <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          <QuickLink to="/hr/employees" label="Personnel Master" icon={Users} color="blue" />
          <QuickLink to="/hr/departments" label="Departments" icon={Building} color="purple" />
          <QuickLink to="/hr/designations" label="Designations" icon={Briefcase} color="amber" />
          <QuickLink to="/hr/categories" label="Staff Categories" icon={FileText} color="green" />
          <QuickLink to="/hr/attendance" label="Live Attendance" icon={ClipboardCheck} color="green" />
          <QuickLink to="/hr/salary-slips" label="Payroll Processing" icon={IndianRupee} color="amber" />
          <QuickLink to="/hr/salary-records" label="Payroll Registry" icon={History} color="indigo" />
          <QuickLink to="/hr/advances" label="Salary Advances" icon={TrendingUp} color="red" />
          <QuickLink to="/hr/recruitment" label="Recruitment" icon={UserCheck} color="blue" />
          <QuickLink to="/hr/leave" label="Leave Systems" icon={Calendar} color="green" />
          <QuickLink to="/hr/performance" label="Performance" icon={TrendingUp} color="purple" />
          <QuickLink to="/hr/training" label="Training & Dev" icon={GraduationCap} color="blue" />
          <QuickLink to="/hr/exit" label="Exit Protocols" icon={LogOut} color="red" />
          <QuickLink to="/hr/ess-portal" label="Employee Portal" icon={LayoutDashboard} color="indigo" />
        </div>
      </div>
    </div>
  )
}


