import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../services/api'
import { PageHeader, Spinner, Badge, Empty } from '../../components/ui'
import { User, Clock, IndianRupee, FileText, Download, Briefcase, Mail, Phone, Calendar, ShieldCheck, MapPin, ClipboardList } from 'lucide-react'

const StatCard = ({ label, value, color, icon: Icon }) => {
  const colors = {
    blue: 'border-blue-500 text-blue-600',
    green: 'border-emerald-500 text-emerald-600',
    amber: 'border-amber-500 text-amber-600',
    purple: 'border-purple-500 text-purple-600',
  }
  return (
    <div className={`card p-6 border-t-4 shadow-sm ${colors[color] || colors.blue}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-400"><Icon size={18} /></div>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
    </div>
  )
}

export default function ESSPortal() {
  const { user } = useSelector(s => s.auth)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await api.get('/ess/me')
      setData(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="h-96 flex items-center justify-center"><Spinner /></div>
  if (!data) return <div className="py-24"><Empty message="PERSONNEL PROFILE NOT FOUND" /></div>

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b dark:border-gray-800 pb-8">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none"><User size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{user.name}</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">{data.employee?.designation} • {data.employee?.department}</p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
            <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Code</p>
                <p className="text-sm font-black text-indigo-600 uppercase tracking-tight">{data.employee?.employeeCode}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Monthly Attendance" value={data.attendanceCount || 0} color="green" icon={Clock} />
        <StatCard label="Pending Applications" value={data.pendingLeaves || 0} color="amber" icon={Calendar} />
        <StatCard label="Outstanding Advances" value={`₹${data.totalAdvances?.toLocaleString() || 0}`} color="blue" icon={IndianRupee} />
        <StatCard label="Last Processed Slip" value={data.lastSalaryMonth || 'N/A'} color="purple" icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Profile */}
        <div className="card p-8">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
            Personnel Profile <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-1">
                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Corporate Identity</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{data.employee?.employeeCode}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Joining Date</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{data.employee?.joiningDate || 'N/A'}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Primary Contact</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{data.employee?.primaryPhone}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Corporate Email</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white lowercase tracking-tight">{data.employee?.corporateEmail || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Live Attendance Log */}
        <div className="card p-8">
          <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
            Live Attendance Log <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
          </h3>
          <div className="space-y-4">
            {data.recentAttendance?.length > 0 ? data.recentAttendance.map((att, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm text-gray-400"><Calendar size={14} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{att.date}</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white tracking-tight">{att.checkIn || '--:--'} - {att.checkOut || '--:--'}</p>
                  </div>
                </div>
                <Badge status={att.status} />
              </div>
            )) : <p className="text-[10px] font-bold text-gray-400 uppercase text-center py-12 tracking-widest bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl">No recent log entries</p>}
          </div>
        </div>

        {/* Payroll History */}
        <div className="card p-8">
          <h3 className="text-[11px] font-black text-purple-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
            Payroll History <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
          </h3>
          <div className="space-y-4">
            {data.recentSalarySlips?.length > 0 ? data.recentSalarySlips.map((slip, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm text-gray-400"><IndianRupee size={14} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{slip.month} {slip.year}</p>
                    <p className="text-xs font-black text-emerald-600 tracking-tight">₹{slip.netPayable?.toLocaleString()}</p>
                  </div>
                </div>
                <button className="btn-secondary py-2 px-4 flex items-center gap-2 hover:bg-white dark:hover:bg-gray-800"><Download size={12} /> <span className="text-[10px] font-black uppercase tracking-widest">Download Slip</span></button>
              </div>
            )) : <p className="text-[10px] font-bold text-gray-400 uppercase text-center py-12 tracking-widest bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl">No processed slips found</p>}
          </div>
        </div>

        {/* Workflow Requests */}
        <div className="card p-8">
          <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
            Workflow Requests <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
          </h3>
          <div className="space-y-4">
            {data.myRequests?.length > 0 ? data.myRequests.map((req, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm text-gray-400"><ClipboardList size={14} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{req.type}</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white tracking-tight">{req.date}</p>
                  </div>
                </div>
                <Badge status={req.status} />
              </div>
            )) : <p className="text-[10px] font-bold text-gray-400 uppercase text-center py-12 tracking-widest bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl">No active workflow requests</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

