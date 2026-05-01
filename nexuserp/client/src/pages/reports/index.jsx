import { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Download, Filter, Search, RotateCcw, 
  BarChart3, Users, ShoppingCart, Package, ShieldCheck, 
  TrendingUp, Calendar, Zap, ChevronRight, Table, PieChart,
  Eye, Printer, CheckCircle2, X, Activity, Database, 
  Target, Layers, Boxes, DollarSign
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, FormRow, Badge, Empty, Spinner, SearchableSelect, ExportButton, Modal } from '../../components/ui'
import { exportToCSV } from '../../utils/exportUtils'

const REPORT_TYPES = [
  { id: 'hr', label: 'Workforce Registry', icon: <Users size={18}/>, roles: ['ADMIN', 'HR'], desc: 'Global personnel dossiers and departmental structure analysis.' },
  { id: 'attendance', label: 'Presence Analytics', icon: <Calendar size={18}/>, roles: ['ADMIN', 'HR', 'HOD'], desc: 'Surveillance of workforce duty cycles and shift chronometry.' },
  { id: 'purchase', label: 'Procurement Ledger', icon: <ShoppingCart size={18}/>, roles: ['ADMIN', 'PURCHASE', 'HOD'], desc: 'Audit trail of enterprise expenditure and vendor fulfillments.' },
  { id: 'inventory', label: 'SKU Valuation', icon: <Package size={18}/>, roles: ['ADMIN', 'STORE', 'HOD'], desc: 'Real-time monitoring of storage nodes and material throughput.' },
  { id: 'qc', label: 'Quality Integrity', icon: <ShieldCheck size={18}/>, roles: ['ADMIN', 'QC', 'HOD'], desc: 'Compliance tracking of material certifications and lab audits.' },
  { id: 'sales', label: 'Revenue Streams', icon: <TrendingUp size={18}/>, roles: ['ADMIN', 'SALES', 'HOD'], desc: 'Analytical synthesis of market demand and capital realization.' },
]

export default function Reports() {
  const { user } = useSelector(s => s.auth)
  const [activeReport, setActiveReport] = useState('hr')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [filters, setFilters] = useState({ from: '', to: '', search: '', department: '', status: 'ALL' })
  const [departments, setDepartments] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const printRef = useRef()

  useEffect(() => {
    api.get('/departments').then(r => setDepartments(r.data.data)).catch(() => {})
  }, [])

  const filteredReportTypes = useMemo(() => {
    return user?.role === 'ADMIN' ? REPORT_TYPES : REPORT_TYPES.filter(r => r.roles.includes(user?.role))
  }, [user])

  const generateReport = async () => {
    setLoading(true)
    const tid = toast.loading('Synthesizing Enterprise Intelligence...')
    try {
      let endpoint = ''
      switch(activeReport) {
        case 'hr': endpoint = '/employees'; break;
        case 'attendance': endpoint = '/attendance'; break;
        case 'purchase': endpoint = '/purchase-orders'; break;
        case 'inventory': endpoint = '/products'; break;
        case 'qc': endpoint = '/qc-reports'; break;
        case 'sales': endpoint = '/sales-orders'; break;
        default: endpoint = '/employees'
      }

      const res = await api.get(endpoint, { params: filters })
      setData(res.data.data || [])
      toast.success(`${res.data.data?.length || 0} Data Artifacts Isolated`, { id: tid })
    } catch (e) {
      toast.error('Data Transmission Failure', { id: tid })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!data.length) return toast.error('No artifact data available for export')
    let headers = []
    switch(activeReport) {
      case 'hr': headers = [{ label:'CODE', key:'employeeCode' }, { label:'NAME', key:'name' }, { label:'DEPT', key:'department' }, { label:'STATUS', key:'isActive' }]; break;
      case 'attendance': headers = [{ label:'DATE', key:'date' }, { label:'NAME', key:'employee.name' }, { label:'STATUS', key:'status' }, { label:'HOURS', key:'hoursWorked' }]; break;
      case 'purchase': headers = [{ label:'PO IDENTITY', key:'poNo' }, { label:'PARTNER', key:'vendor.companyName' }, { label:'CAPITAL', key:'totalAmount' }, { label:'AUTHORIZATION', key:'status' }]; break;
      case 'inventory': headers = [{ label:'SKU CODE', key:'itemCode' }, { label:'NOMENCLATURE', key:'itemName' }, { label:'CATEGORY', key:'category' }, { label:'MIN STOCK', key:'minStock' }]; break;
      default: headers = Object.keys(data[0] || {}).map(k => ({ label: k.toUpperCase(), key: k }));
    }
    exportToCSV(data, `${activeReport}_Full_Audit_Ledger`, headers)
    toast.success('Enterprise Data Portability Executed')
  }

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Enterprise Intelligence Report - ${activeReport.toUpperCase()}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 40px; }
            .title { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; }
            .meta { font-size: 10px; color: #64748b; margin-top: 5px; text-transform: uppercase; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px 15px; font-size: 10px; text-transform: uppercase; border: 1px solid #e2e8f0; font-weight: 900; }
            td { padding: 12px 15px; font-size: 11px; border: 1px solid #e2e8f0; font-weight: 500; }
            .footer { margin-top: 40px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">NEXUSERP INTELLIGENCE CORE</div>
            <div class="meta">${activeReport.replace(/_/g, ' ')} Analysis • Range: ${filters.from || 'All'} to ${filters.to || 'Present'} • Generated by ${user.name}</div>
          </div>
          ${content}
          <div class="footer">Confidential Enterprise Artifact • Synchronized: ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="animate-fade-in space-y-12 pb-32 h-full overflow-y-auto custom-scrollbar pr-2">
      <PageHeader 
        title="Enterprise Intelligence Center" 
        subtitle="Analytical synthesis of departmental data artifacts and cross-vertical performance modeling."
        icon={<BarChart3 size={28} className="text-blue-600" />}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* Sidebar: Report Selection */}
        <div className="space-y-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-3"><Database size={14}/> Operational Matrices</p>
          <div className="space-y-3">
            {filteredReportTypes.map(report => (
              <button
                key={report.id}
                onClick={() => { setActiveReport(report.id); setData([]); }}
                className={`w-full group text-left p-6 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden ${activeReport === report.id ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-600/20 scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-500 hover:border-blue-500/50'}`}
              >
                <div className="flex items-center gap-5 relative z-10">
                   <div className={`p-3 rounded-2xl ${activeReport === report.id ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600 shadow-sm'} transition-all`}>{report.icon}</div>
                   <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-widest">{report.label}</p>
                      <p className={`text-[8px] font-bold uppercase tracking-tighter opacity-60 line-clamp-1`}>{report.desc}</p>
                   </div>
                </div>
                <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000 ${activeReport === report.id ? 'text-white' : 'text-blue-500'}`}>{report.icon}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main: Report Configuration & Preview */}
        <div className="xl:col-span-3 space-y-10">
          <div className="card p-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border-slate-200 dark:border-white/5 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                   <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20"><Filter size={18}/></div>
                   Synthesis Parameters
                </h3>
                <button onClick={() => setFilters({ from:'', to:'', search:'', department:'', status:'ALL' })} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl transition-all"><RotateCcw size={14}/> Reset Matrix</button>
             </div>

             <FormRow cols={3}>
                <div><label className="label">Start Horizon (Chronicle)</label><input type="date" className="input-field font-black" value={filters.from} onChange={e => setFilters(p=>({...p, from:e.target.value}))} /></div>
                <div><label className="label">End Horizon (Chronicle)</label><input type="date" className="input-field font-black" value={filters.to} onChange={e => setFilters(p=>({...p, to:e.target.value}))} /></div>
                <div><label className="label">Departmental Node</label><SearchableSelect placeholder="Global Search" options={[{ name: 'All Enterprise Nodes' }, ...departments]} value={filters.department || 'All Enterprise Nodes'} labelKey="name" valueKey="name" onChange={v => setFilters(p => ({ ...p, department: v === 'All Enterprise Nodes' ? '' : v }))} /></div>
             </FormRow>

             <div className="flex gap-4 mt-12 pt-10 border-t dark:border-white/5">
                <button onClick={generateReport} className="btn-primary flex-1 py-5 shadow-blue-500/30 group">
                   <Zap size={18} className="group-hover:animate-pulse"/> 
                   <span className="ml-2">Initialize Data Synthesis</span>
                </button>
                <AnimatePresence>
                   {data.length > 0 && (
                      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="flex gap-4">
                         <ExportButton onClick={handleExport} />
                         <button onClick={() => setShowPreview(true)} className="btn-secondary px-8 bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20">
                            <Eye size={16} className="mr-2"/> Audit Preview
                         </button>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? <Spinner size="lg" /> : data.length > 0 ? (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="card overflow-hidden shadow-2xl border-slate-200 dark:border-white/5">
                 <div className="px-10 py-6 bg-slate-900 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><Layers size={100} className="text-white"/></div>
                    <div className="flex items-center gap-6 relative z-10">
                       <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/40"><Table size={18}/></div>
                       <p className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Isolated Intelligence Fragment: {data.length} Artifacts</p>
                    </div>
                    <div className="flex gap-4 relative z-10">
                       <button onClick={handlePrint} className="p-3 rounded-2xl bg-white/10 hover:bg-blue-600 transition-all text-white shadow-xl"><Printer size={16}/></button>
                    </div>
                 </div>
                 <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full">
                       <thead className="bg-slate-50 dark:bg-[#060912] border-b border-slate-100 dark:border-white/10">
                          <tr>
                             {Object.keys(data[0] || {}).slice(0, 10).map(key => (
                                <th key={key} className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">{key.replace(/_/g, ' ')}</th>
                             ))}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {data.map((row, idx) => (
                             <tr key={idx} className="hover:bg-blue-50/40 dark:hover:bg-blue-600/5 transition-all duration-300">
                                {Object.values(row).slice(0, 10).map((val, i) => (
                                   <td key={i} className="px-8 py-6 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                      {typeof val === 'object' ? 'FRAGMENT' : String(val)}
                                   </td>
                                ))}
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}><Empty message="Awaiting Intelligence Synthesis. Define vertical parameters and execute." /></motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Intelligence Audit Preview" size="xl">
        <div className="flex flex-col h-[80vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-50 dark:bg-[#060912] rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-inner" id="print-area" ref={printRef}>
             <div className="mb-12 flex justify-between items-start border-b-2 border-blue-600 pb-8">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4 uppercase">Operational Synthesis Report</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Vertical Matrix: {activeReport} • Global Timestamp: {new Date().toISOString()}</p>
                </div>
                <div className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-xl">
                   <BarChart3 size={32} className="text-blue-600" />
                </div>
             </div>

             <div className="grid grid-cols-4 gap-6 mb-12">
                {[
                  { l: 'Total Artifacts', v: data.length, i: <Layers size={14}/> },
                  { l: 'Synthesis Horizon', v: filters.from || 'Indefinite', i: <Calendar size={14}/> },
                  { l: 'Target Node', v: filters.department || 'All Nodes', i: <Target size={14}/> },
                  { l: 'Integrity Rating', v: '99.8%', i: <ShieldCheck size={14}/> }
                ].map((stat, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                     <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">{stat.i} {stat.l}</p>
                     <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">{stat.v}</p>
                  </div>
                ))}
             </div>

             <table className="w-full">
                <thead>
                   <tr>
                      {Object.keys(data[0] || {}).slice(0, 8).map(key => (
                         <th key={key}>{key.replace(/_/g, ' ')}</th>
                      ))}
                   </tr>
                </thead>
                <tbody>
                   {data.map((row, idx) => (
                      <tr key={idx}>
                         {Object.values(row).slice(0, 8).map((val, i) => (
                            <td key={i}>{typeof val === 'object' ? 'Object' : String(val)}</td>
                         ))}
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
             <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={() => setShowPreview(false)}>Exit Preview</button>
             <button className="btn-primary min-w-[200px] shadow-blue-500/30" onClick={handlePrint}><Printer size={16} className="mr-2"/> Authorize Print Execution</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
