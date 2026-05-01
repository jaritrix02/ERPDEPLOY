import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calculator, Plus, Search, RotateCcw, 
  Layers, Package, Ruler, Droplets, ShoppingCart,
  Trash2, Edit3, ChevronRight, Download, 
  Zap, X, Info, DollarSign, Activity, 
  Box, Maximize, Printer, ClipboardList, Target
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Modal, Badge, PageHeader, Spinner, Empty, FormRow, SearchableSelect, ExportButton } from '../../components/ui'
import { socket } from '../../services/socket'
import { usePermissions } from '../../hooks/usePermissions'
import { exportToCSV } from '../../utils/exportUtils'
import {
  blankCostingJob,
  blankLine,
  calculateCostingSummary,
  DEPARTMENT_CONFIG,
  FORMULA_OPTIONS,
  getDepartmentConfig,
  getPresetDensity,
  toEditorState,
} from './costingUtils'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const formatCurrency = (value) => currency.format(Number(value || 0))

const buildBlankForm = (departmentType) => {
  const base = blankCostingJob()
  const activeType = departmentType ? String(departmentType).toUpperCase() : 'RUBBER'
  const config = getDepartmentConfig(activeType)
  return {
    ...base,
    departmentType: activeType,
    materialName: config.defaultMaterial,
    density: getPresetDensity(config.defaultMaterial) ?? base.density,
    items: [{ ...blankLine(), formulaType: config.formulas[0] || 'A_OD_ID' }],
  }
}

export default function CostingJobs({ departmentType = null, title, subtitle }) {
  const normalizedDepartment = departmentType ? String(departmentType).toUpperCase() : null
  const { canWrite, canExecute } = usePermissions('costing_analysis')
  const [jobs, setJobs] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [poLoading, setPoLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [materialFilter, setMaterialFilter] = useState('ALL')
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => buildBlankForm(normalizedDepartment))

  const activeDepartment = normalizedDepartment || form.departmentType || 'RUBBER'
  const departmentConfig = useMemo(() => getDepartmentConfig(activeDepartment), [activeDepartment])
  const allowedFormulaOptions = useMemo(
    () => FORMULA_OPTIONS.filter((option) => departmentConfig.formulas.includes(option.value)),
    [departmentConfig],
  )

  const pageTitle = title || (normalizedDepartment ? `${departmentConfig.label} Portfolio` : 'Strategic Costing Registry')
  const pageSubtitle = subtitle || (normalizedDepartment ? `Management of ${departmentConfig.label} technical specifications and cost modeling.` : 'Centralized repository for multi-departmental weight analysis and fiscal projections.')

  const loadJobs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/costing', { params: normalizedDepartment ? { departmentType: normalizedDepartment } : {} })
      setJobs(res.data.data || [])
    } catch (error) { toast.error('Costing Data Sync Failure') }
    finally { setLoading(false) }
  }

  const loadPurchaseOrders = async () => {
    if (purchaseOrders.length > 0) return
    setPoLoading(true)
    try {
      const res = await api.get('/purchase-orders', { params: { status: 'APPROVED' } })
      setPurchaseOrders(res.data.data || [])
    } catch (error) { toast.error('Procurement Linkage Failure') }
    finally { setPoLoading(false) }
  }

  useEffect(() => {
    loadJobs()
    socket.on('costing:updated', loadJobs)
    return () => socket.off('costing:updated', loadJobs)
  }, [normalizedDepartment])

  const materials = useMemo(() => {
    const source = normalizedDepartment ? departmentConfig.materials : Object.keys(DEPARTMENT_CONFIG).flatMap((key) => DEPARTMENT_CONFIG[key].materials)
    const set = new Set(source); jobs.forEach((job) => { if (job.materialName) set.add(job.materialName) });
    return Array.from(set)
  }, [normalizedDepartment, departmentConfig, jobs])

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const s = search.toLowerCase()
      const matchesSearch = !s || job.drawingNo?.toLowerCase().includes(s) || job.projectName?.toLowerCase().includes(s) || job.materialName?.toLowerCase().includes(s) || job.purchaseOrderNo?.toLowerCase().includes(s) || job.sourceItemCode?.toLowerCase().includes(s)
      const matchesMaterial = materialFilter === 'ALL' || job.materialName === materialFilter
      return matchesSearch && matchesMaterial
    })
  }, [jobs, search, materialFilter])

  const preview = useMemo(() => calculateCostingSummary(form), [form])
  const selectedPurchaseOrder = useMemo(() => purchaseOrders.find((po) => po.id === form.purchaseOrderId) || null, [purchaseOrders, form.purchaseOrderId])
  const availablePoItems = selectedPurchaseOrder?.items || []

  const handleExport = () => {
    const headers = [
      { label: 'DRAWING NO', key: 'drawingNo' },
      { label: 'PROJECT', key: 'projectName' },
      { label: 'PO NO', key: 'purchaseOrderNo' },
      { label: 'MATERIAL', key: 'materialName' },
      { label: 'TOTAL WEIGHT', key: 'totalWeight' },
      { label: 'SET COST', key: 'totalSetCost' }
    ]
    exportToCSV(filteredJobs, 'Strategic_Costing_Archive', headers)
    toast.success('Costing Ledger Exported')
  }

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const updateDepartment = (nextDepartment) => {
    const config = getDepartmentConfig(nextDepartment)
    const materialName = config.defaultMaterial
    const density = getPresetDensity(materialName)
    setForm((prev) => ({
      ...prev,
      departmentType: nextDepartment,
      materialName,
      density: density ?? prev.density,
      items: prev.items.map((item, index) => ({
        ...item,
        formulaType: config.formulas.includes(item.formulaType) ? item.formulaType : (index === 0 ? config.formulas[0] : item.formulaType),
      })),
    }))
  }

  const updateMaterial = (materialName) => {
    const density = getPresetDensity(materialName)
    setForm((prev) => ({ ...prev, materialName, density: density ?? prev.density }))
  }

  const updateLine = (index, key, value) => {
    setForm((prev) => ({ ...prev, items: prev.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }))
  }

  const addLine = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...blankLine(), formulaType: departmentConfig.formulas[0] || 'A_OD_ID' }] }))
  const removeLine = (index) => setForm((prev) => ({ ...prev, items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : [{ ...blankLine(), formulaType: departmentConfig.formulas[0] || 'A_OD_ID' }] }))

  const openCreate = async () => { setEditingId(null); setForm(buildBlankForm(normalizedDepartment)); await loadPurchaseOrders(); setModal(true); }
  const openEdit = async (job) => { setEditingId(job.id); setForm(toEditorState(job)); await loadPurchaseOrders(); setModal(true); }

  const handlePOChange = (poId) => {
    const po = purchaseOrders.find((entry) => entry.id === poId)
    setForm((prev) => ({ ...prev, purchaseOrderId: po?.id || '', purchaseOrderNo: po?.poNo || '', sourceItemId: '', sourceItemCode: '', sourceItemName: '' }))
  }

  const handleSourceItemChange = (poItemId) => {
    const poItem = availablePoItems.find((entry) => entry.itemId === poItemId || entry.id === poItemId)
    const item = poItem?.item
    setForm((prev) => ({ ...prev, sourceItemId: item?.id || poItem?.itemId || '', sourceItemCode: item?.itemCode || '', sourceItemName: item?.itemName || '', projectName: prev.projectName || item?.itemName || '' }))
  }

  const saveJob = async () => {
    const tid = toast.loading('Synchronizing Technical Artifact...');
    try {
      const payload = { 
        ...form, 
        departmentType: activeDepartment,
        density: Number(form.density),
        sheetLength: Number(form.sheetLength),
        sheetWidth: Number(form.sheetWidth),
        sheetThickness: Number(form.sheetThickness),
        sheetCostPerSheet: Number(form.sheetCostPerSheet),
        packagingCost: Number(form.packagingCost),
        wastagePct: Number(form.wastagePct),
        profitPct: Number(form.profitPct),
        designPct: Number(form.designPct),
        holesPct: Number(form.holesPct),
        rejectionPct: Number(form.rejectionPct),
      }
      if (editingId) await api.put(`/costing/${editingId}`, payload)
      else await api.post('/costing', payload)
      toast.success('Costing Artifact Authorized', { id: tid }); setModal(false); loadJobs()
    } catch (e) { toast.error(e.response?.data?.message || 'Transaction error', { id: tid }) }
  }

  return (
    <div className="animate-fade-in space-y-10 pb-20 h-full overflow-y-auto custom-scrollbar">
      <PageHeader 
        title={pageTitle} 
        subtitle={pageSubtitle}
        icon={<Calculator size={28} className="text-blue-600" />}
        actions={<>
          <div className="w-56">
             <SearchableSelect 
               placeholder="All Material Compositions"
               options={[{ label: 'All Compositions', value: 'ALL' }, ...materials.map(m => ({ label: m, value: m }))]}
               value={materialFilter}
               onChange={v => setMaterialFilter(v)}
             />
          </div>
          <ExportButton onClick={handleExport} />
          {canWrite && <button className="btn-primary" onClick={openCreate}><Plus size={16} /> New Costing Job</button>}
        </>} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { l: 'Authorized Jobs', v: filteredJobs.length, i: <ClipboardList size={20}/>, c: 'blue' },
          { l: 'Portfolio Value', v: formatCurrency(filteredJobs.reduce((s,j) => s + Number(j.totalSetCost || 0), 0)), i: <DollarSign size={20}/>, c: 'amber' },
          { l: 'Aggregate Weight', v: `${filteredJobs.reduce((s,j) => s + Number(j.totalWeight || 0), 0).toFixed(2)} KG`, i: <Package size={20}/>, c: 'emerald' },
          { l: 'Avg Utilization', v: `${(filteredJobs.length ? filteredJobs.reduce((s,j) => s + Number(j.utilizationPct || 0), 0) / filteredJobs.length : 0).toFixed(1)}%`, i: <Activity size={20}/>, c: 'cyan' }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.1 }}
            className="card p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group"
          >
            <div className={`absolute -right-4 -bottom-4 w-32 h-32 bg-${stat.c}-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000`} />
            <div className="flex justify-between items-start relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.l}</p>
              <div className={`p-3 rounded-2xl bg-${stat.c}-600/10 text-${stat.c}-600 shadow-sm`}>{stat.i}</div>
            </div>
            <p className="mt-6 text-3xl font-black text-slate-900 dark:text-white relative z-10 tracking-tighter">{stat.v}</p>
          </motion.div>
        ))}
      </div>

      <div className="card p-6 flex flex-col md:flex-row gap-6 items-end bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="flex-1">
          <div className="relative group">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              placeholder="Search by Drawing Identity, Project Set, PO Reference, or Technical Material..." 
              className="input-field pl-14"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => { setSearch(''); setMaterialFilter('ALL'); }} className="btn-secondary py-3.5 px-8 transition-all hover:bg-slate-100"><RotateCcw size={16}/></button>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {['Technical Artifact','Project/PO Link','Material Composition','Metrics','Fiscal Modeling','Actions'].map(h => (
                    <th key={h} className="table-th text-white uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {filteredJobs.length === 0 ? (
                    <tr><td colSpan={6}><Empty /></td></tr>
                  ) : filteredJobs.map((job, idx) => (
                    <motion.tr 
                      key={job.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-blue-50/40 dark:hover:bg-blue-600/5 transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-[12px] font-black text-blue-600 tracking-widest leading-none">{job.drawingNo}</span>
                           <span className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-[0.2em]">{job.departmentType} PHASE</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">{job.projectName || 'STANDALONE ARTIFACT'}</span>
                           <span className="text-[9px] font-bold text-slate-400 mt-2 tracking-tighter">PO: {job.purchaseOrderNo || '—'}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none">{job.materialName}</span>
                           <span className="text-[9px] font-bold text-slate-400 mt-2 tracking-widest">DENSITY: {job.density}</span>
                        </div>
                      </td>
                      <td className="py-6">
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black text-emerald-600 leading-none">{job.totalWeight} KG</span>
                            <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{job.totalLineItems} SEGMENTS</span>
                         </div>
                      </td>
                      <td className="py-6">
                         <div className="flex flex-col">
                            <span className="text-[12px] font-black text-slate-900 dark:text-white tracking-tighter leading-none">{formatCurrency(job.totalSetCost)}</span>
                            <span className="text-[9px] font-black text-cyan-600 mt-2 uppercase tracking-widest">{job.utilizationPct}% UTIL</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          {canWrite && <button onClick={() => openEdit(job)} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={14}/></button>}
                          <button className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Printer size={14}/></button>
                          {canExecute && <button onClick={() => { if(confirm('Authorize permanent archival?')) api.delete(`/costing/${job.id}`).then(loadJobs) }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={14}/></button>}
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

      {/* COSTING MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Refine Technical Cost Modeling' : 'Strategic Costing Initialization'} size="xl">
        <div className="flex flex-col h-[85vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-12">
            <div className="p-10 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 shadow-inner">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-10 flex items-center gap-3"><Target size={16}/> Project Identity Registry</p>
               <FormRow cols={2}>
                 <div><label className="label">Drawing Identity Code *</label><input className="input-field font-black uppercase tracking-widest" value={form.drawingNo} onChange={e => updateField('drawingNo', e.target.value.toUpperCase())} /></div>
                 <div><label className="label">Strategic Project Name</label><input className="input-field font-black uppercase" value={form.projectName} onChange={e => updateField('projectName', e.target.value.toUpperCase())} /></div>
               </FormRow>
               <FormRow cols={3}>
                  <SearchableSelect label="Operational Sector" options={Object.keys(DEPARTMENT_CONFIG).map(k => ({ label: DEPARTMENT_CONFIG[k].label.toUpperCase(), value: k }))} value={form.departmentType} onChange={v => updateDepartment(v)} />
                  <SearchableSelect label="Material Composition *" options={materials.filter(m => departmentConfig.materials.includes(m) || m === form.materialName).map(m => ({ label: m.toUpperCase(), value: m }))} value={form.materialName} onChange={v => updateMaterial(v)} />
                  <div><label className="label">Composition Density *</label><input type="number" step="0.01" className="input-field font-black" value={form.density} onChange={e => updateField('density', e.target.value)} /></div>
               </FormRow>
            </div>

            <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-inner">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3"><ShoppingCart size={16}/> Procurement Linkage</p>
               <FormRow cols={2}>
                 <SearchableSelect label="Approved Purchase Order *" placeholder={poLoading ? 'SYNCHRONIZING...' : 'SEARCH PO IDENTITY...'} options={purchaseOrders.map(p => ({ label: p.poNo, value: p.id, subLabel: p.vendor?.companyName }))} value={form.purchaseOrderId} onChange={handlePOChange} />
                 <SearchableSelect label="Procurement SKU Identity *" options={availablePoItems.map(pi => ({ label: pi.item?.itemCode, value: pi.itemId, subLabel: pi.item?.itemName }))} value={form.sourceItemId} onChange={handleSourceItemChange} />
               </FormRow>
            </div>

            <div className="space-y-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Maximize size={16}/> Dimensional Framework</p>
               <FormRow cols={4}>
                 <div><label className="label">Sheet Length (mm)</label><input type="number" className="input-field font-black" value={form.sheetLength} onChange={e => updateField('sheetLength', e.target.value)} /></div>
                 <div><label className="label">Sheet Width (mm)</label><input type="number" className="input-field font-black" value={form.sheetWidth} onChange={e => updateField('sheetWidth', e.target.value)} /></div>
                 <div><label className="label">Sheet Thick (mm)</label><input type="number" step="0.01" className="input-field font-black" value={form.sheetThickness} onChange={e => updateField('sheetThickness', e.target.value)} /></div>
                 <div><label className="label">Fiscal / Sheet (₹)</label><input type="number" step="0.01" className="input-field font-black" value={form.sheetCostPerSheet} onChange={e => updateField('sheetCostPerSheet', e.target.value)} /></div>
               </FormRow>
            </div>

            <div className="space-y-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Calculator size={16}/> Fiscal Efficiency Modifiers (%)</p>
               <FormRow cols={4}>
                  <div><label className="label">Wastage Factor</label><input type="number" step="0.01" className="input-field" value={form.wastagePct} onChange={e => updateField('wastagePct', e.target.value)} /></div>
                  <div><label className="label">Yield Rejection</label><input type="number" step="0.01" className="input-field" value={form.rejectionPct} onChange={e => updateField('rejectionPct', e.target.value)} /></div>
                  <div><label className="label">Operational Profit</label><input type="number" step="0.01" className="input-field" value={form.profitPct} onChange={e => updateField('profitPct', e.target.value)} /></div>
                  <div><label className="label">Design Overhead</label><input type="number" step="0.01" className="input-field" value={form.designPct} onChange={e => updateField('designPct', e.target.value)} /></div>
               </FormRow>
            </div>

            <div className="space-y-8">
               <div className="flex justify-between items-center px-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3"><Layers size={16}/> Segment Decomposition</p>
                  <button onClick={addLine} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 px-6 py-2 bg-blue-600/5 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Plus size={14}/> Add Technical Segment</button>
               </div>

               <div className="card overflow-hidden border border-slate-200 dark:border-white/5">
                 <div className="overflow-x-auto">
                    <table className="w-full">
                       <thead className="bg-slate-50 dark:bg-white/5">
                          <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                             <th className="px-6 py-4">Decomp Type</th>
                             <th className="px-6 py-4">L / D1</th>
                             <th className="px-6 py-4">W / D2</th>
                             <th className="px-6 py-4">T / D3</th>
                             <th className="px-6 py-4">Vol (mm³)</th>
                             <th className="px-6 py-4">Weight (g)</th>
                             <th className="px-6 py-4 text-right">Action</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {form.items.map((line, idx) => {
                             const metrics = calculateCostingSummary({ ...form, items: [line] }).items[0] || { volume: 0, weight: 0 };
                             return (
                               <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                  <td className="px-4 py-4 min-w-[200px]">
                                     <SearchableSelect minimal={true} options={allowedFormulaOptions} value={line.formulaType} onChange={v => updateLine(idx, 'formulaType', v)} />
                                  </td>
                                  <td className="px-4 py-4"><input type="number" step="0.01" className="input-field py-2 text-xs font-black text-center" value={line.dim1} onChange={e => updateLine(idx, 'dim1', e.target.value)} /></td>
                                  <td className="px-4 py-4"><input type="number" step="0.01" className="input-field py-2 text-xs font-black text-center" value={line.dim2} onChange={e => updateLine(idx, 'dim2', e.target.value)} /></td>
                                  <td className="px-4 py-4"><input type="number" step="0.01" className="input-field py-2 text-xs font-black text-center" value={line.dim3} onChange={e => updateLine(idx, 'dim3', e.target.value)} /></td>
                                  <td className="px-4 py-4 font-black text-slate-400 text-[10px] text-center">{metrics.volume?.toFixed(0)}</td>
                                  <td className="px-4 py-4 font-black text-blue-600 text-[10px] text-center">{metrics.weight?.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right">
                                     <button onClick={() => removeLine(idx)} className="p-2 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"><X size={14}/></button>
                                  </td>
                               </tr>
                             )
                          })}
                       </tbody>
                    </table>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
               {[
                 { l: 'Aggregate Volume', v: `${preview.totals.totalVolume.toFixed(0)} MM³`, c: 'blue' },
                 { l: 'Aggregate Weight', v: `${preview.totals.totalWeight.toFixed(3)} KG`, c: 'emerald' },
                 { l: 'Utilization Index', v: `${preview.totals.utilizationPct.toFixed(1)} %`, c: 'cyan' },
                 { l: 'Unit Sheets', v: `${preview.totals.totalSheets.toFixed(2)} PCS`, c: 'amber' },
                 { l: 'Estimated Set Cost', v: formatCurrency(preview.totals.totalSetCost), c: 'indigo' }
               ].map((res, i) => (
                 <div key={i} className={`p-6 rounded-[2rem] border bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm`}>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-3">{res.l}</p>
                    <p className={`text-lg font-black tracking-tighter text-slate-900 dark:text-white`}>{res.v}</p>
                 </div>
               ))}
            </div>

            <div>
               <label className="label">Technical Annotations & Assumptions</label>
               <textarea className="input-field min-h-[120px]" rows={4} value={form.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Specify tooling constraints, manufacturing assumptions, or segment-specific logic..." />
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={() => setModal(false)}>Discard</button>
            <button className="btn-primary min-w-[240px] shadow-blue-500/30" onClick={saveJob}>{editingId ? 'ARCHIVE REFINEMENTS' : 'AUTHORIZE COSTING MODEL'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
