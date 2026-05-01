import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { PageHeader, Modal, Spinner, Empty, Badge, SearchableSelect } from '../../components/ui'
import { format } from 'date-fns'

export default function BreakdownReports() {
  const [list, setList] = useState([])
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('INFO')
  const [form, setForm] = useState({
    reportNo: `BR-${Date.now().toString().slice(-6)}`,
    machineId: '',
    breakdownDate: format(new Date(), 'yyyy-MM-dd'),
    downTimeStart: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    downTimeEnd: '',
    type: 'RUNNING',
    reason: '',
    reportedBy: '',
    actionTaken: '',
    partsChanged: [],
    status: 'OPEN'
  })

  const load = async () => {
    setLoading(true)
    try {
      const [brRes, mRes] = await Promise.all([
        api.get('/breakdowns'),
        api.get('/machines')
      ])
      setList(brRes.data.data)
      setMachines(mRes.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    try {
      await api.post('/breakdowns', form)
      toast.success('Breakdown Report Saved')
      setShowModal(false)
      load()
    } catch (e) { toast.error('Error saving report') }
  }

  const addPart = () => {
    setForm(p => ({ ...p, partsChanged: [...p.partsChanged, { code: '', name: '', qty: 1, rate: 0, amount: 0 }] }))
  }

  const updatePart = (idx, field, val) => {
    const parts = [...form.partsChanged]
    parts[idx][field] = val
    if (field === 'qty' || field === 'rate') parts[idx].amount = parts[idx].qty * parts[idx].rate
    setForm(p => ({ ...p, partsChanged: parts }))
  }

  const totalPartsCost = form.partsChanged.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="pb-20 text-black dark:text-white">
      <PageHeader title="Breakdown Intimation & Entry" subtitle="Log machine failures and track repair actions"
        actions={<button className="btn-primary px-8" onClick={() => { setShowModal(true) }}>+ Log Breakdown</button>} />

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden shadow-2xl border-t-4 border-red-600">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Report Context</th>
                <th className="px-6 py-4">Machine</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.length === 0 ? <tr><td colSpan={4}><Empty /></td></tr> : list.map(br => (
                <tr key={br.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-black text-slate-400 uppercase tracking-widest">{br.reportNo}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{format(new Date(br.breakdownDate), 'dd MMM yyyy')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-xs uppercase">{br.machine?.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{br.machine?.code} | {br.type}</p>
                  </td>
                  <td className="px-6 py-4"><Badge status={br.status === 'OPEN' ? 'PENDING' : 'APPROVED'} /></td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-500 font-black uppercase text-[10px] hover:underline">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Break Intimation Entry" size="xl">
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
            <div><label className="label text-[9px] font-black uppercase text-slate-400 mb-1">Intimation No</label>
              <input className="bg-transparent border-b border-black/10 dark:border-white/10 w-full font-mono text-xs font-bold py-1" readOnly value={form.reportNo} /></div>
            <div><label className="label text-[9px] font-black uppercase text-slate-400 mb-1">Intimation Date</label>
              <input type="date" className="bg-transparent border-b border-black/10 dark:border-white/10 w-full font-bold text-xs py-1" value={form.breakdownDate} onChange={e => setForm(p => ({ ...p, breakdownDate: e.target.value }))} /></div>
            <div className="col-span-2">
              <SearchableSelect 
                label="Machine Code / Name *"
                options={machines.map(m => ({ label: m.name, subLabel: `CODE: ${m.code}`, value: m.id }))}
                value={form.machineId}
                onChange={val => setForm(p => ({ ...p, machineId: val }))}
                placeholder="Select Machine..."
              />
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
            {['INFO', 'PARTS', 'ACTION'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === t ? 'bg-white dark:bg-slate-800 shadow-md text-primary-500' : 'text-slate-500 hover:text-black dark:hover:text-white'}`}>
                {t === 'INFO' ? 'Intimation Details' : t === 'PARTS' ? 'Part Change Expenses' : 'Action Plan'}
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
            {activeTab === 'INFO' && (
              <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-4">
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Breakdown Type</label>
                    <select className="input-field font-bold uppercase" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="RUNNING">RUNNING (MINOR)</option>
                      <option value="CRITICAL">CRITICAL (MAJOR)</option>
                    </select></div>
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Nature of Problem / Reason *</label>
                    <textarea className="input-field font-bold" rows={4} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Explain what happened..." /></div>
                </div>
                <div className="space-y-4">
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Down Time Start</label>
                    <input type="datetime-local" className="input-field font-bold" value={form.downTimeStart} onChange={e => setForm(p => ({ ...p, downTimeStart: e.target.value }))} /></div>
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Reported By</label>
                    <input className="input-field font-bold uppercase" value={form.reportedBy} onChange={e => setForm(p => ({ ...p, reportedBy: e.target.value }))} placeholder="Employee Name/ID" /></div>
                </div>
              </div>
            )}

            {activeTab === 'PARTS' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Replaced Parts & Spares</h4>
                  <button onClick={addPart} className="text-primary-500 font-black uppercase text-[10px]">+ Add Entry</button>
                </div>
                <div className="card overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] font-black uppercase text-slate-400">
                      <tr><th className="px-4 py-3">Part Code</th><th className="px-4 py-3">Part Name</th><th className="px-4 py-3 text-center">Qty</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Amount</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {form.partsChanged.map((p, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1"><input className="w-full bg-transparent p-2 font-mono uppercase text-[10px]" value={p.code} onChange={e => updatePart(i, 'code', e.target.value)} /></td>
                          <td className="px-2 py-1"><input className="w-full bg-transparent p-2 font-bold uppercase text-[10px]" value={p.name} onChange={e => updatePart(i, 'name', e.target.value)} /></td>
                          <td className="px-2 py-1"><input type="number" className="w-full bg-transparent p-2 text-center font-bold" value={p.qty} onChange={e => updatePart(i, 'qty', parseFloat(e.target.value))} /></td>
                          <td className="px-2 py-1"><input type="number" className="w-full bg-transparent p-2 text-right font-black" value={p.rate} onChange={e => updatePart(i, 'rate', parseFloat(e.target.value))} /></td>
                          <td className="px-4 py-1 text-right font-black text-emerald-500">₹{p.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-900 font-black">
                        <td colSpan={4} className="px-4 py-3 text-right uppercase text-[10px]">Total Expenses:</td>
                        <td className="px-4 py-3 text-right text-emerald-500">₹{totalPartsCost}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'ACTION' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                <div><label className="label text-[10px] font-bold uppercase mb-1.5">Action Plan / Repair Procedure</label>
                  <textarea className="input-field font-bold" rows={6} value={form.actionTaken} onChange={e => setForm(p => ({ ...p, actionTaken: e.target.value }))} placeholder="Detailed repair steps..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label text-[10px] font-bold uppercase mb-1.5">Machine Release Status</label>
                    <select className="input-field font-bold uppercase" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="OPEN">UNDER REPAIR</option>
                      <option value="RESOLVED">RELEASED (OK)</option>
                    </select></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
            <button className="btn-secondary px-8" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary px-12" onClick={handleSubmit}>Save & Print Intimation</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
