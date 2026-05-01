import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, QCReportTemplate, SearchableSelect } from '../../components/ui'

const STAGE = 'PROCESS'
const TITLE = 'In-Process Quality Inspection'

export default function QCProcess() {
  const [reports, setReports]     = useState([])
  const [templates, setTemplates] = useState([])
  const [qcParams, setQcParams]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [tmplModal, setTmplModal] = useState(false)
  const [editMode, setEditMode]   = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  
  const [form, setForm]           = useState({ grnId:null, templateId:'', passOrFail:true, result:'' })
  const [tmplForm, setTmplForm]   = useState({ name:'', fields: [] })
  const [paramValues, setParamValues] = useState({})
  const [selectedReport, setSelectedReport] = useState(null)

  const load = () => Promise.all([
    api.get('/qc/reports', { params:{stage:STAGE} }),
    api.get('/qc/templates', { params:{stage:STAGE} }),
    api.get('/qc-parameters')
  ]).then(([r,t, qcp]) => { 
    setReports(r.data.data); 
    setTemplates(t.data.data);
    setQcParams(qcp.data.data);
  }).finally(()=>setLoading(false))

  useEffect(() => { load() }, [])

  const selectedTemplate = templates.find(t => t.id === form.templateId)
  const parsedFields = selectedTemplate ? (typeof selectedTemplate.fields === 'string' ? JSON.parse(selectedTemplate.fields) : selectedTemplate.fields) : []

  const saveQC = async () => {
    try {
      if (editMode) {
        await api.put(`/qc/reports/${selectedId}`, { ...form, parameters: paramValues })
        toast.success('QC Report updated')
      } else {
        await api.post('/qc/reports', { ...form, stage: STAGE, parameters: paramValues })
        toast.success('QC Report saved')
      }
      setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const approveQC = async (id) => {
    try {
      await api.post(`/qc/reports/${id}/approve`)
      toast.success('Report Approved')
      load()
    } catch(e) { toast.error('Approval failed') }
  }

  const saveTmpl = async () => {
    try {
      await api.post('/qc/templates', { ...tmplForm, fields: JSON.stringify(tmplForm.fields), stage: STAGE })
      toast.success('Template saved')
      setTmplModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const addFieldToTmpl = (paramId) => {
    const p = qcParams.find(x => x.id === paramId)
    if (!p) return
    setTmplForm(prev => ({
      ...prev,
      fields: [...prev.fields, { 
        label: p.name, unit: p.unit, min: p.minValue, max: p.maxValue, type: p.type, instrument: p.instrument, method: p.method
      }]
    }))
  }

  return (
    <div className="pb-20 text-black dark:text-white">
      <PageHeader title={TITLE} subtitle="Production Line Surveillance & Audit"
        actions={<>
          <button className="btn-primary mr-3" onClick={()=>{ setEditMode(false); setForm({grnId:null, templateId:'', passOrFail:true, result:''}); setParamValues({}); setModal(true) }}>+ Log Process QC</button>
          <button className="btn-secondary" onClick={()=>{setTmplForm({name:'',fields:[]});setTmplModal(true)}}>+ Add Template</button>
        </>} />

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden shadow-2xl border-b-4 border-slate-900">
          <table className="w-full">
            <thead className="bg-black text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>{['Inspection ID','Template','Result','Status','Approval','Action'].map(h=><th key={h} className="px-6 py-4 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.length===0 ? <tr><td colSpan={6}><Empty /></td></tr>
               : reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-black text-primary-600">{r.qcNo}</td>
                  <td className="px-6 py-4 text-[11px] font-black uppercase">{r.template?.name}</td>
                  <td className="px-6 py-4">
                    <span className={'px-3 py-1 rounded-full text-[10px] font-black uppercase ' + (r.passOrFail ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {r.passOrFail ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td className="px-6 py-4"><div className={`text-[10px] font-black uppercase ${r.status === 'APPROVED' ? 'text-blue-500' : 'text-orange-500'}`}>{r.status}</div></td>
                  <td className="px-6 py-4">
                    {r.status === 'PENDING' ? (
                      <button onClick={() => approveQC(r.id)} className="text-emerald-500 font-black text-[10px] hover:underline uppercase">Approve</button>
                    ) : <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">By {r.approvedBy}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4">
                      <button onClick={() => setSelectedReport(r)} className="text-primary-600 font-black text-[10px] uppercase">View</button>
                      {r.status === 'PENDING' && (
                        <button onClick={() => { 
                          setEditMode(true); setSelectedId(r.id); 
                          setForm({ templateId: r.templateId, passOrFail: r.passOrFail, result: r.result });
                          setParamValues(typeof r.parameters === 'string' ? JSON.parse(r.parameters) : r.parameters);
                          setModal(true);
                        }} className="text-blue-500 font-black text-[10px] uppercase">Edit</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INSPECTION MODAL */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editMode ? 'Edit Process QC Data' : 'Log New Process Audit'} size="lg">
        <div className="space-y-6">
          <SearchableSelect label="Template *" options={templates.map(t => ({ label: t.name, value: t.id }))} value={form.templateId} onChange={val => setForm(p => ({ ...p, templateId: val }))} />
          <div className="grid grid-cols-1 gap-4">
            {parsedFields.map((f,i) => (
                <div key={i} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                    <div className="flex-1">
                        <p className="font-black text-xs uppercase">{f.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Target: {f.type === 'MIN_ONLY' ? `≥ ${f.min}` : f.type === 'MAX_ONLY' ? `≤ ${f.max}` : `${f.min}-${f.max}`} {f.unit}</p>
                    </div>
                    <input className="input-field w-40 font-black" value={paramValues[f.label]||''} onChange={e=>setParamValues(p=>({...p,[f.label]:e.target.value}))} placeholder="Result" />
                </div>
            ))}
          </div>
          <div><label className="label text-[10px] font-black uppercase mb-1.5 text-slate-400">Process Observations</label><input className="input-field font-bold" value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))} /></div>
          <div>
            <label className="label text-[10px] font-black uppercase mb-1.5 text-slate-400">Final Verification *</label>
            <div className="flex gap-4">
              <button onClick={()=>setForm(p=>({...p,passOrFail:true}))}  className={'flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ' + (form.passOrFail  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200' : 'border-slate-100 text-slate-400')}>✓ ACCEPTED</button>
              <button onClick={()=>setForm(p=>({...p,passOrFail:false}))} className={'flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all ' + (!form.passOrFail ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200'   : 'border-slate-100 text-slate-400')}>✗ REJECTED</button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
            <button className="btn-secondary px-8" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-primary px-12" onClick={saveQC}>{editMode ? 'Update Audit' : 'Authorize Audit'}</button>
          </div>
        </div>
      </Modal>

      {/* TEMPLATE MODAL */}
      <Modal open={tmplModal} onClose={()=>setTmplModal(false)} title="Define Process Audit Template" size="md">
        <div className="space-y-6">
          <div><label className="label text-[10px] font-black uppercase mb-1.5 text-slate-400">Template Name *</label><input className="input-field font-black uppercase" value={tmplForm.name} onChange={e=>setTmplForm(p=>({...p,name:e.target.value}))} /></div>
          <SearchableSelect options={qcParams.map(p => ({ label: p.name, value: p.id }))} onChange={addFieldToTmpl} placeholder="Add Checkpoint..." />
          {tmplForm.fields.map((f, i) => (
             <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="text-xs font-bold uppercase">{f.label}</span>
                <button onClick={() => setTmplForm(p => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }))} className="text-red-500 text-[10px] font-black uppercase hover:underline">Remove</button>
             </div>
          ))}
          <button className="btn-primary w-full shadow-lg" onClick={saveTmpl}>Save Template</button>
        </div>
      </Modal>

      <Modal open={!!selectedReport} onClose={()=>setSelectedReport(null)} title="In-Process Quality Report" size="lg">
          <div className="no-print mb-4 flex justify-end gap-2"><button onClick={() => window.print()} className="btn-primary px-8">Print Official Report</button></div>
          <QCReportTemplate report={selectedReport} />
      </Modal>
      <div className="print-only"><QCReportTemplate report={selectedReport} /></div>
    </div>
  )
}
