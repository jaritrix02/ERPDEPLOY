import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PackageCheck, Plus, Search, RotateCcw, 
  ClipboardCheck, Activity, Eye, Printer, 
  Settings2, Zap, ChevronRight, X, Info
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, QCReportTemplate, SearchableSelect } from '../../components/ui'

const STAGE = 'INCOMING'
const TITLE = 'Incoming Quality Control'

export default function QCIncoming() {
  const [reports, setReports]     = useState([])
  const [pending, setPending]     = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [tmplModal, setTmplModal] = useState(false)
  const [form, setForm]           = useState({ grnId:'', templateId:'', passOrFail:true, result:'' })
  const [tmplForm, setTmplForm]   = useState({ name:'', fields:'[{"label":"Visual Check","type":"pass_fail"}]' })
  const [paramValues, setParamValues] = useState({})
  const [selectedReport, setSelectedReport] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/qc/reports', { params:{stage:STAGE} }),
      api.get('/qc/pending/' + STAGE),
      api.get('/qc/templates', { params:{stage:STAGE} })
    ]).then(([r,p,t]) => { setReports(r.data.data); setPending(p.data.data); setTemplates(t.data.data) })
      .finally(()=>setLoading(false))
  }

  useEffect(() => { load() }, [])

  const selectedTemplate = templates.find(t => t.id === form.templateId)
  const parsedFields = selectedTemplate ? JSON.parse(selectedTemplate.fields || '[]') : []

  const openNew = (grn) => {
    const firstTmpl = templates[0]
    setForm({ grnId: grn.id, templateId: firstTmpl?.id||'', passOrFail:true, result:'' })
    setParamValues({})
    setModal(true)
  }

  const saveQC = async () => {
    const tid = toast.loading('Synchronizing Quality Protocol...')
    try {
      await api.post('/qc/reports', { ...form, stage: STAGE, parameters: paramValues })
      toast.success('Inspection Data Archived', { id: tid }); setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error', { id: tid }) }
  }

  const saveTmpl = async () => {
    const tid = toast.loading('Deploying Protocol Schema...')
    try {
      await api.post('/qc/templates', { ...tmplForm, stage: STAGE })
      toast.success('Protocol Online', { id: tid }); setTmplModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error', { id: tid }) }
  }

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <PageHeader 
        title={TITLE} 
        subtitle="Verification of incoming material batches against quality compliance standards."
        icon={<PackageCheck size={28} className="text-blue-600" />}
        actions={<button className="btn-primary" onClick={()=>{setTmplForm({name:'',fields:'[{"label":"Check","type":"pass_fail"}]'});setTmplModal(true)}}><Plus size={16} /> Deploy Template</button>} 
      />

      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="card p-6 bg-blue-600/5 border-blue-500/20 shadow-2xl shadow-blue-500/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Awaiting Verification ({pending.length} Batches)</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pending.map(grn => (
                <div key={grn.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-blue-500/10 shadow-lg group hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-mono text-[10px] font-black text-slate-400 tracking-widest">{grn.grnNo}</p>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight mt-1">{grn.po?.vendor?.companyName}</h3>
                    </div>
                    <button onClick={() => openNew(grn)} disabled={templates.length===0} className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform"><ClipboardCheck size={14}/></button>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                     <div className="flex items-center gap-1"><Activity size={10}/> Pending QC</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>{['Identity','Reference','Protocol','Compliance','State','Date','Actions'].map(h=><th key={h} className="table-th text-white uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {reports.length === 0 ? (
                    <tr><td colSpan={7}><Empty /></td></tr>
                  ) : reports.map((r, idx) => (
                    <motion.tr 
                      key={r.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                      <td className="px-8 py-5 font-mono text-[11px] font-black text-blue-600 tracking-widest">{r.qcNo}</td>
                      <td className="py-5 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.grn?.grnNo}</td>
                      <td className="py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase">{r.template?.name}</td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${r.passOrFail ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                          {r.passOrFail ? 'CONFORMANT' : 'NON-CONFORMANT'}
                        </span>
                      </td>
                      <td className="py-5"><Badge status={r.status} /></td>
                      <td className="py-5 text-[10px] font-bold text-slate-400 uppercase">{r.createdAt?.slice(0,10)}</td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => setSelectedReport(r)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Eye size={14}/></button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL */}
      <Modal open={modal} onClose={()=>setModal(false)} title="Material Compliance Execution" size="lg">
        <div className="flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
            <SearchableSelect 
              label="Selected Protocol Template *"
              options={templates.map(t => ({ value: t.id, label: t.name }))}
              value={form.templateId}
              onChange={val => setForm(p => ({ ...p, templateId: val }))}
            />

            <div className="space-y-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Settings2 size={14}/> Observation Schema</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parsedFields.map((f, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{f.label}</label>
                    {f.type === 'pass_fail' ? (
                      <SearchableSelect 
                        minimal={true}
                        placeholder="Select State..."
                        options={[{ label: 'PASS / CONFORMANT', value: 'PASS' }, { label: 'FAIL / NON-CONFORMANT', value: 'FAIL' }]}
                        value={paramValues[f.label] || ''}
                        onChange={val => setParamValues(p => ({ ...p, [f.label]: val }))}
                      />
                    ) : (
                      <input type={f.type === 'number' ? 'number' : 'text'} className="input-field" value={paramValues[f.label] || ''} onChange={e => setParamValues(p => ({ ...p, [f.label]: e.target.value }))} placeholder="Enter observation..." />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Inspector Observations</label>
              <textarea className="input-field" rows={3} value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))} placeholder="Summary of quality findings..." />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Final Compliance Decision *</label>
              <div className="flex gap-4">
                <button onClick={()=>setForm(p=>({...p,passOrFail:true}))} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 border-2 ${form.passOrFail ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl shadow-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-300'}`}>
                  <span className="text-[11px] font-black uppercase tracking-[0.1em]">CONFORMANT (PASS)</span>
                </button>
                <button onClick={()=>setForm(p=>({...p,passOrFail:false}))} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 border-2 ${!form.passOrFail ? 'bg-rose-600 border-rose-600 text-white shadow-2xl shadow-rose-500/20' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-300'}`}>
                  <span className="text-[11px] font-black uppercase tracking-[0.1em]">NON-CONFORMANT (REJECT)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-3 pt-8 border-t dark:border-white/5 mt-auto">
            <button className="text-xs font-black text-slate-500 uppercase tracking-widest px-8" onClick={()=>setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[200px] shadow-lg shadow-blue-500/20" onClick={saveQC}>DISPATCH REPORT</button>
          </div>
        </div>
      </Modal>

      {/* TEMPLATE MODAL */}
      <Modal open={tmplModal} onClose={()=>setTmplModal(false)} title="Deploy Compliance Protocol" size="sm">
        <div className="space-y-6">
          <div><label className="label">Protocol Designation *</label><input className="input-field font-black uppercase" value={tmplForm.name} onChange={e=>setTmplForm(p=>({...p,name:e.target.value.toUpperCase()}))} /></div>
          <div>
            <label className="label">Protocol Schema (JSON)</label>
            <textarea className="input-field font-mono text-xs" rows={6} value={tmplForm.fields} onChange={e=>setTmplForm(p=>({...p,fields:e.target.value}))} />
            <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10 mt-2">
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-relaxed">Schema guide: type [pass_fail, text, number]. Ensure valid JSON structure for field array.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-white/5">
            <button className="text-xs font-black text-slate-500 uppercase tracking-widest px-8" onClick={()=>setTmplModal(false)}>Discard</button>
            <button className="btn-primary min-w-[150px]" onClick={saveTmpl}>DEPLOY PROTOCOL</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selectedReport} onClose={()=>setSelectedReport(null)} title="QC Compliance Certification" size="lg">
          <div className="no-print mb-6 flex justify-end gap-3">
             <button onClick={() => window.print()} className="btn-primary flex items-center gap-2"><Printer size={16}/> Print Certification</button>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-auto">
             <QCReportTemplate report={selectedReport} />
          </div>
      </Modal>
    </div>
  )
}
