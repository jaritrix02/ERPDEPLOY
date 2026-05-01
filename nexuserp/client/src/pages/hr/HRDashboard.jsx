import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../services/api'
import { Spinner, Empty } from '../../components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { socket } from '../../services/socket'
import { Users, CreditCard, UserCheck, Award, AlertTriangle, DollarSign, LayoutDashboard, Calendar } from 'lucide-react'

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10',
    green: 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10',
    amber: 'border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-900/10',
    purple: 'border-purple-500 text-purple-600 bg-purple-50/50 dark:bg-purple-900/10',
  }
  return (
    <div className={`card p-6 border-t-4 shadow-sm ${colors[color] || colors.blue}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</p>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
        </div>
        <div className={`p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm ${colors[color]?.split(' ')[1]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

export default function HRDashboard() {
  const { user } = useSelector(s => s.auth)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const [empRes, attRes, salRes, advRes, monthAttRes] = await Promise.all([
        api.get('/employees'),
        api.get('/attendance/summary', { params: { date: today } }),
        api.get('/salary'),
        api.get('/employee-advances'),
        api.get('/attendance', { params: { from: new Date(new Date().setDate(1)).toISOString().slice(0,10), to: today } })
      ])
      
      const employees = empRes.data.data
      const todaySummary = attRes.data.data
      const salaryRecords = salRes.data.data.filter(s => s.month === currentMonth && s.year === currentYear)
      const allAdvances = advRes.data.data
      const monthAdvances = allAdvances.filter(a => {
          const d = new Date(a.date)
          return (d.getMonth() + 1) === currentMonth && d.getFullYear() === currentYear
      })

      const monthAtt = monthAttRes.data.data
      const attendanceMap = {}
      monthAtt.forEach(a => {
          if (!attendanceMap[a.employeeId]) attendanceMap[a.employeeId] = { name: a.employee?.name, code: a.employee?.employeeCode, absent: 0, present: 0 }
          if (a.status === 'ABSENT') attendanceMap[a.employeeId].absent++
          else attendanceMap[a.employeeId].present++
      })

      const sortedByAbsent = Object.values(attendanceMap).sort((a,b) => b.absent - a.absent)
      const mostAbsent = sortedByAbsent[0] || null
      const leastAbsent = Object.values(attendanceMap).sort((a,b) => a.absent - b.absent || b.present - a.present)[0] || null

      const totalPaid = salaryRecords.reduce((sum, s) => sum + (s.netPayable || 0), 0)
      const totalAdvances = monthAdvances.reduce((sum, a) => sum + (a.amount || 0), 0)

      const deptSalary = {}
      salaryRecords.forEach(s => {
          const dept = s.employee?.department || 'Others'
          deptSalary[dept] = (deptSalary[dept] || 0) + (s.netPayable || 0)
      })
      const deptChartData = Object.entries(deptSalary).map(([name, value]) => ({ name, value }))

      setData({
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.isActive).length,
        presentToday: todaySummary?.totalPresent || 0,
        absentToday: todaySummary?.totalAbsent || 0,
        totalPaidThisMonth: totalPaid,
        totalAdvancesThisMonth: totalAdvances,
        mostAbsent,
        leastAbsent,
        deptChartData
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    socket.on('attendance:updated', fetchDashboardData)
    socket.on('advance:updated', fetchDashboardData)
    socket.on('salary:updated', fetchDashboardData)
    return () => {
        socket.off('attendance:updated')
        socket.off('advance:updated')
        socket.off('salary:updated')
    }
  }, [])

  if (loading || !data) return <div className="h-screen flex items-center justify-center"><Spinner /></div>

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"><LayoutDashboard size={24} /></div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">HR Insights</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Workforce Analytics & Performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <Calendar size={14} className="text-indigo-600" />
            <span className="text-xs font-black text-gray-900 dark:text-white uppercase">{new Date().toLocaleString('default', { month: 'long' })} {currentYear}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Monthly Payroll" value={`₹${data.totalPaidThisMonth.toLocaleString()}`} icon={DollarSign} color="blue" />
        <StatCard label="Monthly Advances" value={`₹${data.totalAdvancesThisMonth.toLocaleString()}`} icon={CreditCard} color="amber" />
        <StatCard label="Total Workforce" value={data.activeEmployees} icon={Users} color="green" />
        <StatCard label="Daily Attendance" value={data.presentToday} icon={UserCheck} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg"><Award size={18} /></div>
                    <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Attendance Star</h3>
                </div>
                {data.leastAbsent ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{data.leastAbsent.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 tracking-wider uppercase">{data.leastAbsent.code}</p>
                        <div className="mt-4 flex justify-between items-end">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Days Present</span>
                          <span className="text-2xl font-black text-emerald-500 tracking-tighter">{data.leastAbsent.present}</span>
                        </div>
                    </div>
                ) : <Empty />}
            </div>

            <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg"><AlertTriangle size={18} /></div>
                    <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Absence Alert</h3>
                </div>
                {data.mostAbsent ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{data.mostAbsent.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 tracking-wider uppercase">{data.mostAbsent.code}</p>
                        <div className="mt-4 flex justify-between items-end">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Days Absent</span>
                          <span className="text-2xl font-black text-rose-500 tracking-tighter">{data.mostAbsent.absent}</span>
                        </div>
                    </div>
                ) : <Empty />}
            </div>
        </div>

        <div className="lg:col-span-2 card p-6">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Departmental Cost Analysis</h3>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full uppercase">Current Cycle</span>
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.deptChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#111827', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(v) => [`₹${v.toLocaleString()}`, 'Salary']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                            {data.deptChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
            <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-8 border-b dark:border-gray-800 pb-4">Personnel Distribution</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-[180px] h-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={[
                                    { name: 'Active', value: data.activeEmployees },
                                    { name: 'Inactive', value: data.totalEmployees - data.activeEmployees }
                                ]}
                                cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none"
                            >
                                <Cell fill="#4f46e5" />
                                <Cell fill="#e5e7eb" className="dark:fill-gray-700" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{data.totalEmployees}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                    </div>
                </div>
                <div className="flex-1 w-full space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Employees</span>
                            <span className="text-[10px] font-black text-indigo-600">{Math.round((data.activeEmployees/data.totalEmployees)*100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(data.activeEmployees/data.totalEmployees)*100}%` }}></div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Attendance Rate</span>
                            <span className="text-[10px] font-black text-emerald-600">{Math.round((data.presentToday/data.activeEmployees)*100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(data.presentToday/data.activeEmployees)*100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="card p-6 bg-gray-900 dark:bg-black border-none shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-white"><DollarSign size={120} /></div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8 border-b border-gray-800 pb-4">Financial Overview</h3>
            <div className="space-y-8 relative z-10">
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Payroll Burden</span>
                        <span className="text-sm font-black text-white tracking-tight">₹{data.totalPaidThisMonth.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Salary Advance Exposure</span>
                        <span className="text-sm font-black text-amber-500 tracking-tight">₹{data.totalAdvancesThisMonth.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '40%' }}></div>
                    </div>
                </div>
                <div className="pt-6 mt-6 border-t border-gray-800">
                    <p className="text-[9px] font-bold text-gray-500 leading-relaxed uppercase tracking-widest italic">
                        Real-time data synced via system oracle. Last updated: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

