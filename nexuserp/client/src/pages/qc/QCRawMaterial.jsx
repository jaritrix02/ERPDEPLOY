import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, Plus, Search, RotateCcw, 
  ClipboardCheck, AlertCircle, CheckCircle2, 
  XCircle, Eye, Edit3, Printer, FileText, 
  Settings2, Activity, Zap, ChevronRight, X, Trash2, Download, Package
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Modal, Badge, PageHeader, Spinner, Empty, QCReportTemplate, SearchableSelect, ExportButton } from '../../components/ui'
import { exportToCSV } from '../../utils/exportUtils'

const STAGE = 'RAW_MATERIAL_TEST'
const TITLE = 'Material Compliance Portfolio'

export default function QCRawMaterial() {
  const [reports, setReports]     = useState([])
  const [pending, setPending]     = useState([])
  const [templates, setTemplates] = useState([])
  const [qcParams, setQcParams]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [tmplModal, setTmplModal] = useState(false)
  const [editMode, setEditMode]   = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  
  const [form, setForm]           = useState({ grnId:'', templateId:'', passOrFail:true, result:'' })
  const [tmplForm, setTmplForm]   = useState({ name:'', fields: [] })
  const [paramValues, setParamValues] = useState({})
  const [selectedReport, setSelectedReport] = useState(null)
  const [search, setSearch]       = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [r, p, t, qcp] = await Promise.all([
        api.get('/qc/reports', { params:{stage:STAGE} }),
        api.get('/qc/pending/' + STAGE),
        api.get('/qc/templates', { params:{stage:STAGE} }),
        api.get('/qc-parameters')
      ])
      setReports(r.data.data)
      setPending(p.data.data)
      setTemplates(t.data.data)
      setQcParams(qcp.data.data)
    } catch (e) {
      toast.error('Quality Link Failure')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const selectedTemplate = templates.find(t => t.id === form.templateId)
  const parsedFields = selectedTemplate ? (typeof selectedTemplate.fields === 'string' ? JSON.parse(selectedTemplate.fields) : selectedTemplate.fields) : []

  const handleExport = () => {
    const headers = [
      { label: 'QC NO', key: 'qcNo' },
      { label: 'GRN NO', key: 'grn.grnNo' },
      { label: 'RESULT', key: 'passOrFail' },
      { label: 'STATUS', key: 'status' },
      { label: 'DATE', key: 'createdAt' }
    ]
    exportToCSV(reports, 'Material_Compliance_Archive', headers)
    toast.success('Compliance Registry Exported')
  }

  const openNew = (grn) => {
    const firstTmpl = templates[0]
    setEditMode(false)
    setForm({ grnId: grn.id, templateId: firstTmpl?.id||'', passOrFail:true, result:'' })
    setParamValues({})
    setModal(true)
  }

  const saveQC = async () => {
    const tid = toast.loading('Synchronizing Quality Protocol...')
    try {
      if (editMode) await api.put(`/qc/reports/${selectedId}`, { ...form, parameters: paramValues })
      else await api.post('/qc/reports', { ...form, stage: STAGE, parameters: paramValues })
      toast.success('Quality Artifact Synchronized', { id: tid })
      setModal(false); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Transaction Failure', { id: tid }) }
  }

  const filtered = reports.filter(r => 
    r.qcNo?.toLowerCase().includes(search.toLowerCase()) || 
    r.grn?.grnNo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <PageHeader 
        title={TITLE} 
        subtitle="Surveillance of inward material integrity, compliance verification, and laboratory audit trails."
        icon={<ShieldCheck size={28} className="text-blue-600" />}
        actions={<>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={()=>{setTmplForm({name:'',fields:[]});setTmplModal(true)}}><Plus size={16} /> Deploy Protocol</button>
        </>} 
      />

      {/* Pending Inspection Banner */}
      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="card p-8 bg-blue-600 shadow-[0_32px_64px_-12px_rgba(37,99,235,0.3)] border-none relative overflow-hidden group">
            <motion.div 
               animate={{ x: [0, 50, 0], y: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity }}
               className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full"
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="space-y-2">
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Pending Verification Registry</h4>
                  <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] opacity-80">System Alert: {pending.length} Material Batches require compliance certification.</p>
               </div>
               <div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-none">
                  {pending.map(grn => (
                    <div key={grn.id} className="min-w-[280px] bg-white/10 backdrop-blur-3xl rounded-[1.5rem] p-6 border border-white/20 flex justify-between items-center group/item hover:bg-white/20 transition-all">
                       <div>
                          <p className="font-mono text-[9px] font-black text-blue-100 tracking-widest">{grn.grnNo}</p>
                          <h3 className="text-xs font-black text-white uppercase mt-1 truncate max-w-[140px]">{grn.po?.vendor?.companyName}</h3>
                       </div>
                       <button onClick={() => openNew(grn)} disabled={templates.length===0} className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"><ClipboardCheck size={20}/></button>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card p-6 flex flex-col md:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              placeholder="Search by QC Identity, GRN Reference, or Supplier..." 
              className="input-field pl-14"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => setSearch('')} className="btn-secondary py-3.5 px-8 transition-all hover:bg-slate-100"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {['QC Identity','Source Reference','Result State','Authority State','Authorization','Actions'].map(h => (
                    <th key={h} className="table-th text-white uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6}><Empty /></td></tr>
                  ) : filtered.map((r, idx) => (
                    <motion.tr 
                      key={r.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-blue-50/40 dark:hover:bg-blue-600/5 transition-all duration-300"
                    >
                      <td className="px-8 py-6 font-mono text-[11px] font-black text-blue-600 tracking-widest">{r.qcNo}</td>
                      <td className="py-6">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">{r.grn?.grnNo}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Inward Ref</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${r.passOrFail ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                          {r.passOrFail ? 'CONFORMANT' : 'NON-CONFORMANT'}
                        </span>
                      </td>
                      <td className="py-6"><Badge status={r.status} /></td>
                      <td className="py-6">
                        {r.status === 'PENDING' ? (
                          <button onClick={() => {}} className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase hover:underline decoration-2 underline-offset-4"><CheckCircle2 size={12}/> Authorize</button>
                        ) : <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Verified: {r.approvedBy}</span>}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button onClick={() => setSelectedReport(r)} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Eye size={14}/></button>
                          <button onClick={() => window.print()} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Printer size={14}/></button>
                          {r.status === 'PENDING' && (
                            <button onClick={() => { setEditMode(true); setSelectedId(r.id); setForm({ grnId: r.grnId, templateId: r.templateId, passOrFail: r.passOrFail, result: r.result }); setParamValues(typeof r.parameters === 'string' ? JSON.parse(r.parameters) : r.parameters); setModal(true); }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={14}/></button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTION EXECUTION MODAL */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editMode ? 'Refining Quality Protocol' : 'Compliance Verification Execution'} size="xl">
        <div className="flex flex-col h-[75vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
            <div className="p-10 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 shadow-inner">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Zap size={14}/> Intelligence Protocol</p>
              <SearchableSelect 
                label="Compliance Template *"
                placeholder="Search Logic Template..."
                options={templates.map(t => ({ value: t.id, label: t.name }))}
                value={form.templateId}
                onChange={val => { const t = templates.find(x=>x.id===val); setForm(p=>({...p, templateId: val})); const parsed = typeof t.fields === 'string' ? JSON.parse(t.fields) : t.fields; const init = {}; parsed.forEach(f => init[f.label] = ''); setParamValues(init); }}
              />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3"><Settings2 size={16} className="text-blue-500" /> Parameter Matrix</h4>
                <SearchableSelect 
                  minimal={true}
                  placeholder="Append Specific Parameter..."
                  options={qcParams.filter(p => !parsedFields.some(f => f.label === p.name)).map(p => ({ label: p.name, value: p.id }))} 
                  onChange={(paramId) => {
                    const p = qcParams.find(x => x.id === paramId);
                    if (!p) return;
                    const newFields = [...parsedFields, { label: p.name, unit: p.unit, min: p.minValue, max: p.maxValue, type: p.type, instrument: p.instrument, method: p.method }];
                    setTemplates(prev => prev.map(t => t.id === form.templateId ? { ...t, fields: JSON.stringify(newFields) } : t));
                    setParamValues(prev => ({ ...prev, [p.name]: '' }));
                  }} 
                />
              </div>

              <div className="card overflow-hidden shadow-xl border-slate-200 dark:border-white/5">
                <table className="w-full">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-left">Parameter Identity</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Bound Integrity</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right w-56">Observed Metric</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {parsedFields.map((f, i) => (
                      <tr key={i} className="hover:bg-blue-50/20 transition-colors duration-300">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-tight leading-none">{f.label}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">Unit: {f.unit || '—'} | Node: {f.method || 'Standard'}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                            {f.min !== null || f.max !== null ? (f.type === 'MIN_ONLY' ? `≥ ${f.min}` : f.type === 'MAX_ONLY' ? `≤ ${f.max}` : `${f.min} ↔ ${f.max}`) : 'QUALITATIVE'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <input 
                            className="w-full bg-slate-100 dark:bg-white/5 border-none px-5 py-3 rounded-2xl text-[12px] font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-right"
                            value={paramValues[f.label] || ''} 
                            onChange={e => {
                              const val = e.target.value;
                              const newVals = { ...paramValues, [f.label]: val };
                              setParamValues(newVals);
                              const isComplete = parsedFields.every(field => newVals[field.label]?.trim());
                              if (!isComplete) { setForm(p => ({ ...p, passOrFail: true })); return; }
                              let allPassed = true;
                              parsedFields.forEach(field => {
                                const obs = parseFloat(newVals[field.label]);
                                if (!isNaN(obs)) {
                                  if (field.min !== null && obs < field.min) allPassed = false;
                                  if (field.max !== null && obs > field.max) allPassed = false;
                                } else {
                                  const rej = ['fail', 'reject', 'crack', 'pitting'].some(k => newVals[field.label].toLowerCase().includes(k));
                                  if (rej) allPassed = false;
                                }
                              });
                              setForm(p => ({ ...p, passOrFail: allPassed }));
                            }} 
                            placeholder="METRIC..." 
                          />
                        </td>
                        <td className="pr-6"><button onClick={() => { const nf = parsedFields.filter((_, idx) => idx !== i); setTemplates(prev => prev.map(t => t.id === form.templateId ? { ...t, fields: JSON.stringify(nf) } : t)); }} className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"><Trash2 size={14}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <label className="label">Inspector Annotations</label>
              <textarea className="input-field min-h-[120px]" rows={4} value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))} placeholder="Provide technical rationale for compliance certification..." />
            </div>

            <div className="pt-10 border-t dark:border-white/5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Final Integrity Decision</p>
              {Object.keys(paramValues).length > 0 && parsedFields.every(f => paramValues[f.label]?.trim()) ? (
                <div className="flex gap-6">
                  <div className={`flex-1 py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all duration-700 border-2 ${form.passOrFail ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl shadow-emerald-500/30 scale-[1.02]' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-300'}`}>
                    {form.passOrFail && <CheckCircle2 size={24}/>}
                    <span className="text-[12px] font-black uppercase tracking-[0.2em]">CONFORMANT (PASS)</span>
                  </div>
                  <div className={`flex-1 py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all duration-700 border-2 ${!form.passOrFail ? 'bg-rose-600 border-rose-600 text-white shadow-2xl shadow-rose-500/30 scale-[1.02]' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-300'}`}>
                    {!form.passOrFail && <XCircle size={24}/>}
                    <span className="text-[12px] font-black uppercase tracking-[0.2em]">NON-CONFORMANT (REJECT)</span>
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10 text-center shadow-inner">
                  <Activity size={32} className="mx-auto text-slate-200 mb-4 animate-bounce" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Awaiting analytical data for {parsedFields.length} parameters...</p>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={()=>setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[240px] shadow-blue-500/40" onClick={saveQC}>{editMode ? 'ARCHIVE REFINEMENTS' : 'AUTHORIZE PROTOCOL'}</button>
          </div>
        </div>
      </Modal>

      {/* TEMPLATE DEPLOYMENT MODAL */}
      <Modal open={tmplModal} onClose={()=>setTmplModal(false)} title="Compliance Protocol Deployment" size="md">
        <div className="space-y-10">
          <div className="space-y-3"><label className="label">Protocol Designation *</label><input className="input-field font-black uppercase tracking-widest" value={tmplForm.name} onChange={e=>setTmplForm(p=>({...p,name:e.target.value.toUpperCase()}))} placeholder="E.G. SPECTROSCOPY STANDARD V4" /></div>
          
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Settings2 size={16} className="text-blue-500"/> Schema Matrix</p>
                <SearchableSelect minimal={true} options={qcParams.map(p => ({ label: p.name, value: p.id }))} onChange={(id) => { const p = qcParams.find(x => x.id === id); setTmplForm(prev => ({ ...prev, fields: [...prev.fields, { label: p.name, unit: p.unit, min: p.minValue, max: p.maxValue, type: p.type, instrument: p.instrument, method: p.method }] })) }} placeholder="Append Param..." />
             </div>
             <div className="space-y-3">
                {tmplForm.fields.map((f, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-5 rounded-[1.5rem] border border-slate-100 dark:border-white/5 group hover:border-blue-500/30 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">{f.label}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">{f.unit} | {f.method}</span>
                    </div>
                    <button onClick={() => setTmplForm(p => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }))} className="p-3 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"><Trash2 size={14}/></button>
                  </div>
                ))}
                {tmplForm.fields.length === 0 && <div className="py-20 text-center opacity-10"><Settings2 size={64} className="mx-auto mb-4"/><p className="text-[10px] font-black uppercase tracking-[0.4em]">Protocol Empty</p></div>}
             </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-10 border-t dark:border-white/5">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={()=>setTmplModal(false)}>Discard</button>
            <button className="btn-primary min-w-[200px] shadow-blue-500/30" onClick={() => { api.post('/qc/templates', { ...tmplForm, fields: JSON.stringify(tmplForm.fields), stage: STAGE }).then(() => { toast.success('Protocol Online'); setTmplModal(false); load(); }) }}>DEPLOY PROTOCOL</button>
          </div>
        </div>
      </Modal>

      {/* REPORT VIEW MODAL */}
      <Modal open={!!selectedReport} onClose={()=>setSelectedReport(null)} title="QC Compliance Certification" size="lg">
          <div className="no-print mb-8 flex justify-end gap-4">
             <button onClick={() => window.print()} className="btn-primary flex items-center gap-3 px-10 shadow-blue-500/40"><Printer size={18}/> Print Certification</button>
          </div>
          <div className="bg-white dark:bg-slate-950 p-12 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
             <QCReportTemplate report={selectedReport} />
          </div>
      </Modal>
    </div>
  )
}
