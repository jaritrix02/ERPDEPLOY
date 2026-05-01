import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { PageHeader, Spinner, Modal, FormRow, CalendarPicker, SalarySlipTemplate, SearchableSelect, ExportButton, ImportButton } from '../../components/ui'
import toast from 'react-hot-toast'
import { Calculator, Download, Upload, Printer, Database, Save, Eye, X, Wallet, User, Building2, Calendar, ClipboardList, Coins, ShieldAlert } from 'lucide-react'

const initialSlip = {
  employeeId: '', employeeName: '', employeeCode: '', department: '', designation: '', 
  month: new Date().getMonth() + 1, year: new Date().getFullYear(),
  periodStart: new Date().toISOString().slice(0, 7) + '-01',
  basic: 0, basicArrear: 0, hra: 0, hraArrear: 0, conveyance: 0, conveyanceArrear: 0,
  ot: 0, otArrear: 0, other: 0, otherArrear: 0, spl: 0, splArrear: 0,
  incentive: 0, incentiveArrear: 0, proInc: 0, proIncArrear: 0, tea: 0, teaArrear: 0,
  teaC: 0, teaCArrear: 0, advAgIncen: 0, advAgIncenArrear: 0,
  tds: 0, pf: 0, esi: 0, loan: 0, advanced: 0, advance: 0, pfAdditional: 0, tdsExtra: 0,
  present: 0, weekOff: 0, holiday: 0, oThrs: 0, totAbs: 0, leave: 0, payDays: 31,
  totalEarnings: 0, totalDeductions: 0, netPayable: 0,
  modifyReason: '',
  bankName: '', accountNo: '', ifscCode: '', panNumber: '', aadharNumber: '', uanNumber: '', esiNumber: '', joiningDate: '', fatherName: ''
}

export default function SalarySlips() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(initialSlip)
  const [selectedDept, setSelectedDept] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef(null)

  const load = async () => {
    try {
      const [eRes, dRes] = await Promise.all([api.get('/employees'), api.get('/departments')])
      setEmployees(eRes.data.data)
      setDepartments(dRes.data.data)
    } catch (e) {
      toast.error('Failed to load payroll data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const exportTemplate = () => {
    const headers = ['Emp Code', 'Name', 'Month', 'Year', 'Basic', 'HRA', 'Conveyance', 'OT', 'Other', 'Spl', 'Incentive', 'ProInc', 'Tea', 'AdvAgIncen', 'TDS', 'PF', 'ESI', 'Loan', 'Advance', 'Present', 'WeekOff', 'Holiday', 'OT Hours', 'Absent', 'Leave', 'PayDays'];
    const csvContent = headers.join(",") + "\n" + "NC-001,John Doe,4,2026,25000,5000,2000,0,0,0,0,0,0,0,0,1800,250,0,0,26,4,0,0,0,0,30";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Salary_Import_Template.csv");
    link.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return toast.error('Invalid CSV file');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        const emp = employees.find(e => e.employeeCode === obj['Emp Code']);
        if (!emp) return null;
        return {
          employeeId: emp.id,
          month: Number(obj['Month']),
          year: Number(obj['Year']),
          netPayable: 0,
          earnings: {
            basic: Number(obj['Basic'] || 0), hra: Number(obj['HRA'] || 0), conveyance: Number(obj['Conveyance'] || 0),
            ot: Number(obj['OT'] || 0), other: Number(obj['Other'] || 0), spl: Number(obj['Spl'] || 0),
            incentive: Number(obj['Incentive'] || 0), proInc: Number(obj['ProInc'] || 0), tea: Number(obj['Tea'] || 0),
            advAgIncen: Number(obj['AdvAgIncen'] || 0)
          },
          deductions: {
            tds: Number(obj['TDS'] || 0), pf: Number(obj['PF'] || 0), esi: Number(obj['ESI'] || 0),
            loan: Number(obj['Loan'] || 0), advance: Number(obj['Advance'] || 0)
          },
          attendance: {
            present: Number(obj['Present'] || 0), weekOff: Number(obj['WeekOff'] || 0), holiday: Number(obj['Holiday'] || 0),
            oThrs: Number(obj['OT Hours'] || 0), totAbs: Number(obj['Absent'] || 0), leave: Number(obj['Leave'] || 0),
            payDays: Number(obj['PayDays'] || 30)
          }
        };
      }).filter(Boolean);

      const tid = toast.loading('Importing payroll data...')
      try {
        await api.post('/salary/bulk', data);
        toast.success(`Bulk imported ${data.length} records successfully`, { id: tid });
      } catch (err) { toast.error('Bulk import failed', { id: tid }) }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const earnings = 
        (Number(form.basic) + Number(form.basicArrear)) +
        (Number(form.hra) + Number(form.hraArrear)) +
        (Number(form.conveyance) + Number(form.conveyanceArrear)) +
        (Number(form.ot) + Number(form.otArrear)) +
        (Number(form.other) + Number(form.otherArrear)) +
        (Number(form.spl) + Number(form.splArrear)) +
        (Number(form.incentive) + Number(form.incentiveArrear)) +
        (Number(form.proInc) + Number(form.proIncArrear)) +
        (Number(form.tea) + Number(form.teaArrear)) +
        (Number(form.teaC) + Number(form.teaCArrear)) +
        (Number(form.advAgIncen) + Number(form.advAgIncenArrear))

    const deductions = 
        Number(form.tds) + Number(form.pf) + Number(form.esi) + 
        Number(form.loan) + Number(form.advanced) + Number(form.advance) + 
        Number(form.pfAdditional) + Number(form.tdsExtra)

    setForm(p => ({ ...p, totalEarnings: earnings, totalDeductions: deductions, netPayable: earnings - deductions }))
  }, [
      form.basic, form.basicArrear, form.hra, form.hraArrear, form.conveyance, form.conveyanceArrear, 
      form.ot, form.otArrear, form.other, form.otherArrear, form.spl, form.splArrear,
      form.incentive, form.incentiveArrear, form.proInc, form.proIncArrear, form.tea, form.teaArrear,
      form.teaC, form.teaCArrear, form.advAgIncen, form.advAgIncenArrear,
      form.tds, form.pf, form.esi, form.loan, form.advanced, form.advance, form.pfAdditional, form.tdsExtra
  ])

  const selectEmployee = (empId) => {
    if(!empId) return setForm(initialSlip);
    const emp = employees.find(e => e.id === empId);
    if(!emp) return;
    setForm(p => ({
      ...p,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeCode: emp.employeeCode,
      department: emp.department,
      designation: emp.designation,
      basic: emp.salary || 0,
      bankName: emp.bankName, accountNo: emp.accountNo, ifscCode: emp.ifscCode,
      panNumber: emp.panNumber, aadharNumber: emp.aadharNumber, uanNumber: emp.uanNumber,
      esiNumber: emp.esiNumber, joiningDate: emp.joiningDate, fatherName: emp.fatherName
    }))
  }

  const handlePeriodChange = (dateStr) => {
      const date = new Date(dateStr)
      setForm(p => ({ ...p, periodStart: dateStr, month: date.getMonth() + 1, year: date.getFullYear() }))
  }

  const save = async () => {
    if (!form.employeeId) return toast.error('Please select personnel to proceed')
    const tid = toast.loading('Finalizing payroll disbursement...')
    const payload = {
      employeeId: form.employeeId,
      month: form.month,
      year: form.year,
      netPayable: form.netPayable,
      modifyReason: form.modifyReason,
      earnings: {
        basic: form.basic, basicArrear: form.basicArrear,
        hra: form.hra, hraArrear: form.hraArrear,
        conveyance: form.conveyance, conveyanceArrear: form.conveyanceArrear,
        ot: form.ot, otArrear: form.otArrear,
        other: form.other, otherArrear: form.otherArrear,
        spl: form.spl, splArrear: form.splArrear,
        incentive: form.incentive, incentiveArrear: form.incentiveArrear,
        proInc: form.proInc, proIncArrear: form.proIncArrear,
        tea: form.tea, teaArrear: form.teaArrear,
        teaC: form.teaC, teaCArrear: form.teaCArrear,
        advAgIncen: form.advAgIncen, advAgIncenArrear: form.advAgIncenArrear
      },
      deductions: {
        tds: form.tds, pf: form.pf, esi: form.esi, 
        loan: form.loan, advanced: form.advanced, advance: form.advance, 
        pfAdditional: form.pfAdditional, tdsExtra: form.tdsExtra
      },
      attendance: {
        present: form.present, weekOff: form.weekOff, holiday: form.holiday, 
        oThrs: form.oThrs, totAbs: form.totAbs, leave: form.leave, payDays: form.payDays
      }
    }

    try {
      await api.post('/salary', payload)
      toast.success('Disbursement finalized successfully', { id: tid })
      setForm(initialSlip);
    } catch (e) { toast.error(e.response?.data?.message || 'Error processing payroll', { id: tid }) }
  }

  const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  if (loading) return <Spinner />

  return (
    <div className="pb-20 space-y-8 no-print">
      <PageHeader 
        title="Payroll Computation" 
        subtitle="Finalize monthly compensation matrix, variable benefits, and statutory deduction sets." 
        icon={<Calculator size={24} className="text-indigo-600" />}
        actions={<div className="flex gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
          <ImportButton onClick={() => fileInputRef.current.click()} />
          <ExportButton onClick={exportTemplate} label="Get Template" />
        </div>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                 <SearchableSelect 
                    label="Department Unit"
                    options={[{ name: 'All Departments', id: '' }, ...departments]}
                    value={selectedDept}
                    labelKey="name"
                    valueKey="name"
                    onChange={val => { setSelectedDept(val === 'All Departments' ? '' : val); setForm(initialSlip); }}
                    placeholder="All Units..."
                 />
                 <SearchableSelect 
                    label="Specific Personnel"
                    options={employees.filter(e => !selectedDept || e.department === selectedDept).map(e => ({ label: `${e.employeeCode} - ${e.name}`, value: e.id, subLabel: e.department }))}
                    value={form.employeeId}
                    onChange={selectEmployee}
                    placeholder="Search personnel..."
                 />
                <CalendarPicker 
                    mode="month" 
                    label="Payroll Cycle" 
                    value={form.periodStart?.slice(0,7) || ''} 
                    onChange={v => handlePeriodChange(v + '-01')} 
                />
                <div>
                    <label className="label">Payable Days (Cycle)</label>
                    <input type="number" className="input-field font-black" value={form.payDays} onChange={e => setForm({...form, payDays: e.target.value})} />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card p-6 flex flex-col hover:border-emerald-200 transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                      <Coins size={16} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Earnings Matrix</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-[9px] font-black text-emerald-600 rounded-full uppercase tracking-tighter border border-emerald-100 dark:border-emerald-800">Credit Breakdown</span>
                </div>
                <div className="space-y-4">
                    {['basic', 'hra', 'conveyance', 'ot', 'other', 'spl', 'incentive', 'proInc', 'tea', 'teaC', 'advAgIncen'].map(field => (
                        <div key={field} className="flex gap-3 items-end group">
                            <div className="flex-1">
                                <label className="label text-[9px] uppercase font-black text-gray-400 group-hover:text-emerald-600 transition-colors">{field.replace(/([A-Z])/g, ' $1')}</label>
                                <input type="number" className="input-field py-2 font-black" value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})} />
                            </div>
                            <div className="w-24">
                                <label className="label text-[9px] uppercase font-black text-amber-500">Arrears</label>
                                <input type="number" className="input-field py-2 font-black border-amber-100 bg-amber-50/10 focus:bg-amber-50/20 transition-all" value={form[`${field}Arrear`]} onChange={e => setForm({...form, [`${field}Arrear`]: e.target.value})} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                <div className="card p-6 flex flex-col hover:border-rose-200 transition-colors">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg">
                          <ShieldAlert size={16} />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Deduction Set</h3>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/20 text-[9px] font-black text-rose-600 rounded-full uppercase tracking-tighter border border-rose-100 dark:border-rose-800">Debit Breakup</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {['tds', 'pf', 'esi', 'loan', 'advanced', 'advance', 'pfAdditional', 'tdsExtra'].map(field => (
                            <div key={field} className="group">
                                <label className="label text-[9px] uppercase font-black text-gray-400 group-hover:text-rose-600 transition-colors">{field.replace(/([A-Z])/g, ' $1')}</label>
                                <input type="number" className="input-field py-2 font-black" value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6 flex flex-col hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                          <ClipboardList size={16} />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Log Metrics</h3>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-[9px] font-black text-blue-600 rounded-full uppercase tracking-tighter border border-blue-100 dark:border-blue-800">Attendance Data</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {['present', 'weekOff', 'holiday', 'oThrs', 'totAbs', 'leave'].map(field => (
                            <div key={field} className="group">
                                <label className="label text-[9px] uppercase font-black text-gray-400 group-hover:text-blue-600 transition-colors">{field === 'oThrs' ? 'OT HOURS' : field.replace(/([A-Z])/g, ' $1')}</label>
                                <input type="number" className="input-field py-2 font-black" value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
            <div className="card p-8 bg-gray-900 dark:bg-slate-950 text-white shadow-2xl sticky top-24 border-none overflow-hidden group">
                <div className="absolute -top-10 -right-10 p-6 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700"><Wallet size={160} /></div>
                <div className="text-center space-y-8 relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Net Payable Amount</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-black text-gray-400">₹</span>
                        <p className="text-4xl font-black text-white tracking-tighter">{(Number(form.netPayable) || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-6 border-t border-gray-800">
                      <div className="flex justify-between items-center group/gross">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover/gross:text-emerald-400 transition-colors">Gross Credits</span>
                          <span className="text-sm font-black text-emerald-400 tracking-tight">₹{(Number(form.totalEarnings) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center group/debit">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover/debit:text-rose-400 transition-colors">Total Debits</span>
                          <span className="text-sm font-black text-rose-400 tracking-tight">₹{(Number(form.totalDeductions) || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <label className="label text-[9px] uppercase font-black text-gray-500 mb-2 block text-left">Commitment Reason / Note</label>
                      <textarea className="input-field bg-gray-800 border-none text-white text-xs font-bold focus:ring-1 focus:ring-indigo-500" rows={3} value={form.modifyReason} onChange={e => setForm({...form, modifyReason: e.target.value})} placeholder="Optional adjustment justification..." />
                    </div>

                    <div className="space-y-3 pt-6">
                      <button className="btn-primary w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={save}>
                        <Save size={18} className="mr-2 inline" /> Commit Registry
                      </button>
                      <button className="btn-secondary w-full py-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border-none text-gray-400 hover:bg-white/10 hover:text-white transition-all" onClick={() => setShowPreview(true)}>
                        <Eye size={16} className="mr-2 inline" /> Document Audit
                      </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Payslip Document Protocol Audit" size="4xl">
         <div className="space-y-8 py-6">
            <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800">
                <div className="bg-white shadow-2xl mx-auto overflow-hidden rounded-sm ring-1 ring-gray-200">
                    <SalarySlipTemplate form={form} monthsList={monthsList} />
                </div>
            </div>
            <div className="flex gap-4 border-t dark:border-gray-800 pt-8">
                <button className="flex-1 py-3 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors" onClick={() => setShowPreview(false)}>Terminate Audit</button>
                <button className="btn-primary flex-1 py-3 px-8 text-xs font-black uppercase tracking-[0.2em]" onClick={() => window.print()}>
                  <Printer size={18} className="mr-2 inline" /> Execute Print Protocol
                </button>
            </div>
         </div>
      </Modal>

      <div className="print-only">
          <SalarySlipTemplate form={form} monthsList={monthsList} />
      </div>
    </div>
  )
}



