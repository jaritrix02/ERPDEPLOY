import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, PageHeader, Spinner, Empty, QCReportTemplate, SearchableSelect } from '../../components/ui'

const STAGE = 'FINAL'
const TITLE = 'Final Inspection & PDI'

export default function QCFinal() {
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
        toast.success('PDI Report updated')
      } else {
        await api.post('/qc/reports', { ...form, stage: STAGE, parameters: paramValues })
        toast.success('PDI Report saved')
      }
      setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const approveQC = async (id) => {
    try {
      await api.post(`/qc/reports/${id}/approve`)
      toast.success('Report Authorized')
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
      <PageHeader title={TITLE} subtitle="Pre-Despatch Inspection & Final Quality Clearance"
        actions={<>
          <button className="btn-primary mr-3 shadow-lg shadow-primary-200 dark:shadow-none" onClick={()=>{ setEditMode(false); setForm({grnId:null, templateId:'', passOrFail:true, result:''}); setParamValues({}); setModal(true) }}>+ Perform Final QC</button>
          <button className="btn-secondary" onClick={()=>{setTmplForm({name:'',fields:[]});setTmplModal(true)}}>+ Config Template</button>
        </>} />

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden shadow-2xl border-t-4 border-emerald-500">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>{['Inspection ID','Template Name','Final Decision','Status','Audit Trail','Actions'].map(h=><th key={h} className="px-6 py-4 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.length===0 ? <tr><td colSpan={6}><Empty /></td></tr>
               : reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-black text-primary-600">{r.qcNo}</td>
                  <td className="px-6 py-4 text-[11px] font-black uppercase">{r.template?.name}</td>
                  <td className="px-6 py-4">
                    <span className={'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ' + (r.passOrFail ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {r.passOrFail ? 'ACCEPTED' : 'REJECTED'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className={`text-[10px] font-black uppercase ${r.status === 'APPROVED' ? 'text-blue-500' : 'text-orange-500'}`}>
                        {r.status}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    {r.status === 'PENDING' ? (
                      <button onClick={() => approveQC(r.id)} className="text-emerald-500 font-black text-[10px] hover:underline uppercase tracking-widest">Approve</button>
                    ) : (
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">By {r.approvedBy}</p>
                        <p className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">{r.approvedAt?.slice(0,10)}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4">
                      <button onClick={() => setSelectedReport(r)} className="text-primary-600 font-black text-[10px] uppercase hover:underline">View Report</button>
                      {r.status === 'PENDING' && (
                        <button onClick={() => { 
                          setEditMode(true); setSelectedId(r.id); 
                          setForm({ templateId: r.templateId, passOrFail: r.passOrFail, result: r.result });
                          setParamValues(typeof r.parameters === 'string' ? JSON.parse(r.parameters) : r.parameters);
                          setModal(true);
                        }} className="text-blue-500 font-black text-[10px] uppercase hover:underline">Modify</button>
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
      <Modal open={modal} onClose={()=>setModal(false)} title={editMode ? 'Amend Final Quality Report' : 'Execute Final PDI Inspection'} size="lg">
        <div className="space-y-6 text-black dark:text-white">
          <SearchableSelect label="Select PDI Template *" options={templates.map(t => ({ label: t.name, value: t.id }))} value={form.templateId} onChange={val => setForm(p => ({ ...p, templateId: val }))} />
          
          <div className="grid grid-cols-1 gap-3">
            {parsedFields.map((f,i) => (
                <div key={i} className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-white/5">
                    <div className="flex-1">
                        <p className="font-black text-xs uppercase tracking-tight">{f.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Standard: {f.type === 'MIN_ONLY' ? `≥ ${f.min}` : f.type === 'MAX_ONLY' ? `≤ ${f.max}` : `${f.min}-${f.max}`} {f.unit}</p>
                    </div>
                    <input className="input-field w-48 font-black text-center shadow-inner" value={paramValues[f.label]||''} onChange={e=>setParamValues(p=>({...p,[f.label]:e.target.value}))} placeholder="Measured Val" />
                </div>
            ))}
          </div>

          <div><label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Despatch Remarks</label><input className="input-field font-bold" value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))} placeholder="E.G. Ready for packing, all accessories included..." /></div>
          <div>
            <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Final Release Authorization *</label>
            <div className="flex gap-4">
              <button onClick={()=>setForm(p=>({...p,passOrFail:true}))}  className={'flex-1 py-4 rounded-3xl text-[10px] font-black uppercase border-2 transition-all ' + (form.passOrFail  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-200 dark:shadow-none' : 'border-slate-100 dark:border-slate-800 text-slate-400')}>✓ RELEASE FOR DESPATCH</button>
              <button onClick={()=>setForm(p=>({...p,passOrFail:false}))} className={'flex-1 py-4 rounded-3xl text-[10px] font-black uppercase border-2 transition-all ' + (!form.passOrFail ? 'bg-red-600 text-white border-red-600 shadow-xl shadow-red-200 dark:shadow-none'   : 'border-slate-100 dark:border-slate-800 text-slate-400')}>✗ HOLD DESPATCH</button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
            <button className="btn-secondary px-8" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn-primary px-12" onClick={saveQC}>{editMode ? 'Update PDI' : 'Complete PDI'}</button>
          </div>
        </div>
      </Modal>

      {/* TEMPLATE MODAL */}
      <Modal open={tmplModal} onClose={()=>setTmplModal(false)} title="Final PDI Configuration" size="md">
        <div className="space-y-6">
          <div><label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Template Name *</label><input className="input-field font-black uppercase" value={tmplForm.name} onChange={e=>setTmplForm(p=>({...p,name:e.target.value}))} /></div>
          <SearchableSelect options={qcParams.map(p => ({ label: p.name, value: p.id }))} onChange={addFieldToTmpl} placeholder="Search PDI Checkpoint..." />
          <div className="space-y-2">
            {tmplForm.fields.map((f, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <span className="text-xs font-black uppercase tracking-tight">{f.label}</span>
                  <button onClick={() => setTmplForm(p => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }))} className="text-red-500 text-[10px] font-black uppercase hover:underline">Remove</button>
              </div>
            ))}
          </div>
          <button className="btn-primary w-full shadow-lg" onClick={saveTmpl}>Save PDI Template</button>
        </div>
      </Modal>

      <Modal open={!!selectedReport} onClose={()=>setSelectedReport(null)} title="Final Inspection Certificate" size="lg">
          <div className="no-print mb-4 flex justify-end gap-3"><button onClick={() => window.print()} className="btn-primary px-8">Generate Certificate</button></div>
          <QCReportTemplate report={selectedReport} />
      </Modal>
      <div className="print-only"><QCReportTemplate report={selectedReport} /></div>
    </div>
  )
}
