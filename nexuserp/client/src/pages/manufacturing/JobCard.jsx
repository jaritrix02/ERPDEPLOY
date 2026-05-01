import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Plus, Search, RotateCcw, 
  Activity, Play, CheckCircle2, XCircle, 
  Trash2, Edit3, ChevronRight, Download, 
  Zap, X, Info, Filter, LayoutGrid, 
  Printer, Target, Layers, Box, Cpu, 
  Users, Clock, AlertTriangle, ShieldCheck, FlaskConical
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Modal, Badge, PageHeader, Spinner, Empty, FormRow, 
  SearchableSelect, ExportButton 
} from '../../components/ui';
import { exportToCSV } from '../../utils/exportUtils';

const JobCard = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWO, setSelectedWO] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [entryForm, setEntryForm] = useState({ qtyProduced: '', qtyRejected: '', operatorName: '', shift: 'MORNING', remarks: '' });
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/manufacturing');
      setWorkOrders(res.data.data || []);
      if (selectedWO) {
        const updated = res.data.data.find(wo => wo.id === selectedWO.id);
        if (updated) setSelectedWO(updated);
      }
    } catch (err) { toast.error('Production Archive Link Failure'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredWOs = useMemo(() => {
    return workOrders.filter(wo => {
      const s = search.toLowerCase();
      return !s || wo.woNo?.toLowerCase().includes(s) || wo.bom?.productName?.toLowerCase().includes(s);
    });
  }, [workOrders, search]);

  const handleExport = () => {
    const headers = [
      { label: 'JOB NO', key: 'woNo' },
      { label: 'PRODUCT', key: 'bom.productName' },
      { label: 'TARGET QTY', key: 'plannedQty' },
      { label: 'STATUS', key: 'status' }
    ];
    exportToCSV(filteredWOs, 'Production_Job_Archive', headers);
    toast.success('Production Ledger Exported');
  };

  const finishProcess = async (proc) => {
    const tid = toast.loading(`Archiving ${proc.processName}...`);
    try {
        await api.put('/manufacturing/process-status', { processId: proc.id, status: 'COMPLETED', woId: selectedWO.id });
        toast.success('Operation Finalized', { id: tid }); load();
    } catch (err) { toast.error('Authorization Denied', { id: tid }); }
  };

  const submitEntry = async () => {
    if (!entryForm.qtyProduced || !entryForm.operatorName) return toast.error('Technical parameters incomplete');
    const tid = toast.loading('Synchronizing Production Logs...');
    try {
      await api.post('/manufacturing/daily-output', { woId: selectedWO.id, processId: selectedProcess.id, processName: selectedProcess.processName, ...entryForm });
      toast.success('Log Synchronized', { id: tid }); setShowEntryModal(false); load();
    } catch (err) { toast.error('Transmission Failure', { id: tid }); }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 h-full overflow-y-auto custom-scrollbar pr-2">
      <PageHeader 
        title="Job Route Command Center" 
        subtitle="Real-time surveillance of production stages, process synchronization, and factory floor telemetry."
        icon={<Cpu size={28} className="text-blue-600" />}
        actions={<>
          <ExportButton onClick={handleExport} />
          <div className="w-64">
             <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input placeholder="Search Job/Product..." className="input-field pl-11" value={search} onChange={e => setSearch(e.target.value)} />
             </div>
          </div>
        </>} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { l: 'Live Job Cards', v: workOrders.filter(w => w.status === 'APPROVED').length, i: <Activity size={20}/>, c: 'blue' },
          { l: 'Yield Efficiency', v: '96.2%', i: <ShieldCheck size={20}/>, c: 'emerald' },
          { l: 'Pending Operations', v: workOrders.reduce((acc, w) => acc + w.processes.filter(p => p.status === 'PENDING').length, 0), i: <Clock size={20}/>, c: 'amber' },
          { l: 'Critical Deviations', v: '02', i: <AlertTriangle size={20}/>, c: 'rose' }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.1 }}
            className="card p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group"
          >
            <div className={`absolute -right-4 -bottom-4 w-32 h-32 bg-${stat.c}-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000`} />
            <div className="flex justify-between items-start relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{stat.l}</p>
              <div className={`p-3 rounded-2xl bg-${stat.c}-600/10 text-${stat.c}-600 shadow-sm transition-transform group-hover:rotate-12`}>{stat.i}</div>
            </div>
            <p className="mt-6 text-3xl font-black text-slate-900 dark:text-white relative z-10 tracking-tighter">{stat.v}</p>
          </motion.div>
        ))}
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredWOs.length === 0 ? (
              <div className="col-span-full"><Empty message="No operational job cards detected in registry" /></div>
            ) : filteredWOs.map((wo, idx) => (
              <motion.div 
                key={wo.id} 
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -8 }}
                className="card p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group relative overflow-hidden cursor-pointer"
                onClick={() => { setSelectedWO(wo); setShowModal(true); }}
              >
                <div className="absolute top-0 right-0 p-8 text-blue-600/5 group-hover:scale-150 transition-transform duration-1000"><Box size={120}/></div>
                
                <div className="flex justify-between items-start relative z-10 mb-8">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em]">Card Registry: {wo.woNo}</p>
                      <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mt-2">{wo.bom.productName}</h3>
                   </div>
                   <Badge status={wo.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10 mb-8">
                   <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 group-hover:bg-blue-600/5 transition-colors">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Qty</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{wo.plannedQty} <span className="text-[10px]">LOT</span></p>
                   </div>
                   <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 group-hover:bg-blue-600/5 transition-colors">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Operations</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{wo.processes?.length || 0} <span className="text-[10px]">PHASES</span></p>
                   </div>
                </div>

                <div className="flex items-center gap-1.5 relative z-10">
                   {wo.processes?.map((p, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${p.status === 'COMPLETED' ? 'bg-emerald-500' : p.status === 'IN_PROGRESS' ? 'bg-blue-500 animate-pulse' : 'bg-slate-200 dark:bg-white/10'}`} />
                   ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center relative z-10">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={10}/> Last Synced: {new Date(wo.updatedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                   <button className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20"><ChevronRight size={16}/></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* JOB CARD DETAIL MODAL */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Tactical Route Audit — ${selectedWO?.woNo}`} size="xl">
        <div className="flex flex-col h-[85vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
            {/* Mission Critical Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />
               <div className="col-span-2 space-y-2">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-3"><Target size={16}/> Production Payload Identity</p>
                  <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{selectedWO?.bom.productName}</h2>
                  <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-4">BOM Protocol: {selectedWO?.bom.bomCode} • Version {selectedWO?.bom.version}</p>
               </div>
               <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Target Yield</p>
                  <p className="text-5xl font-black tracking-tighter leading-none">{selectedWO?.plannedQty} <span className="text-xs text-blue-500">LOT</span></p>
               </div>
               <div className="flex flex-col justify-center items-end gap-6">
                  <Badge status={selectedWO?.status} />
                  <div className="flex flex-col items-end">
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Operational Safety</p>
                     <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Material Authorization Verified</p>
                  </div>
               </div>
            </div>

            {/* Process Synchronization Timeline */}
            <div className="space-y-8">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-4"><Layers size={16}/> Synchronization Timeline</p>
               <div className="card p-10 bg-white dark:bg-[#060912] border-slate-200 dark:border-white/5 shadow-2xl">
                  <div className="flex justify-between relative px-10">
                     <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 dark:bg-white/5 -z-0 rounded-full" />
                     {selectedWO?.processes?.map((proc, i) => (
                        <div key={proc.id} className="flex flex-col items-center gap-4 relative z-10">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 border-4 ${
                              proc.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500/20 text-white shadow-xl shadow-emerald-500/30' :
                              proc.status === 'IN_PROGRESS' ? 'bg-blue-600 border-blue-600/20 text-white animate-pulse shadow-xl shadow-blue-500/30' :
                              'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-400'
                           }`}>
                              {proc.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : i + 1}
                           </div>
                           <div className="text-center space-y-1">
                              <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${proc.status === 'PENDING' ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{proc.processName}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">{proc.status}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
               {/* Technical Routing Matrix */}
               <div className="lg:col-span-3 card overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl">
                  <div className="bg-slate-50 dark:bg-[#060912] px-8 py-5 border-b dark:border-white/5 flex justify-between items-center">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Job Routing Control Matrix</p>
                     <div className="flex gap-4">
                        <button className="p-2 rounded-lg bg-white dark:bg-white/5 text-slate-400 hover:text-blue-600 transition-colors"><Printer size={14}/></button>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                       <thead className="bg-white dark:bg-[#0f172a] border-b dark:border-white/5">
                          <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                             <th className="px-8 py-4">Sequence</th>
                             <th className="px-8 py-4">Operational Phase</th>
                             <th className="px-8 py-4 text-center">Protocol Load</th>
                             <th className="px-8 py-4 text-center">Actual Yield</th>
                             <th className="px-8 py-4 text-center">Variance (Rej)</th>
                             <th className="px-8 py-4 text-right">Synchronization</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {selectedWO?.processes?.map((proc) => (
                             <tr key={proc.id} className={`hover:bg-blue-50/30 dark:hover:bg-blue-600/5 transition-all duration-300 ${proc.status === 'IN_PROGRESS' ? 'bg-blue-600/5' : ''}`}>
                                <td className="px-8 py-6 font-mono font-black text-slate-400 text-[11px]">#{proc.sequence.toString().padStart(2, '0')}</td>
                                <td className="px-8 py-6">
                                   <div className="flex flex-col">
                                      <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{proc.processName}</span>
                                      <span className="text-[8px] font-bold text-slate-400 mt-2 uppercase">ID: {proc.id.slice(0,8)}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-6 text-center font-black text-slate-500 text-[12px]">{proc.plannedQty}</td>
                                <td className="px-8 py-6 text-center">
                                   <span className="px-4 py-1 bg-slate-100 dark:bg-white/5 rounded-lg font-black text-slate-900 dark:text-white text-[12px]">{proc.actualQty}</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                   <span className={`font-black text-[12px] ${proc.rejectQty > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{proc.rejectQty}</span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <div className="flex justify-end gap-3">
                                      {proc.status === 'PENDING' && <button onClick={()=> { setSelectedProcess(proc); setShowEntryModal(true); }} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">Initialize</button>}
                                      {proc.status === 'IN_PROGRESS' && (
                                        <>
                                          <button onClick={()=> { setSelectedProcess(proc); setShowEntryModal(true); }} className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Zap size={14}/></button>
                                          <button onClick={()=>finishProcess(proc)} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">Finalize</button>
                                        </>
                                      )}
                                      {proc.status === 'COMPLETED' && <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 size={16}/></div>}
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>

               {/* Tactical Side Panel */}
               <div className="space-y-8">
                  <div className="card p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-150 transition-transform duration-1000"><FlaskConical size={100}/></div>
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">Formula Nodes</p>
                     <div className="space-y-4">
                        {selectedWO?.bom?.items?.map((it, idx) => (
                           <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                              <span className="text-[10px] font-bold uppercase text-slate-400 truncate w-32">{it.item.itemName}</span>
                              <span className="text-[11px] font-black text-white">{(it.qty * selectedWO.plannedQty).toFixed(2)} KG</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="card p-8 bg-white dark:bg-[#060912] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Yield Efficiency</p>
                     <div className="space-y-6">
                        {(() => {
                           const prod = selectedWO?.dailyOutputs?.reduce((s, l) => s + (l.qtyProduced || 0), 0) || 0;
                           const rej = selectedWO?.dailyOutputs?.reduce((s, l) => s + (l.qtyRejected || 0), 0) || 0;
                           const total = prod + rej;
                           const yieldPct = total > 0 ? ((prod / total) * 100).toFixed(1) : '100';
                           return (
                             <>
                               <div className="relative pt-1">
                                  <div className="flex mb-2 items-center justify-between">
                                     <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Quality Yield</span>
                                     <span className="text-[10px] font-black text-emerald-600">{yieldPct}%</span>
                                  </div>
                                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-emerald-500/10">
                                     <motion.div initial={{ width: 0 }} animate={{ width: `${yieldPct}%` }} transition={{ duration: 1.5 }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></motion.div>
                                  </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-white/5">
                                  <div className="text-center">
                                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Produced</p>
                                     <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{prod}</p>
                                  </div>
                                  <div className="text-center">
                                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Rejected</p>
                                     <p className="text-lg font-black text-rose-500 leading-none">{rej}</p>
                                  </div>
                               </div>
                             </>
                           );
                        })()}
                     </div>
                  </div>
               </div>
            </div>

            <div className="card p-10 bg-white dark:bg-[#060912] border border-slate-200 dark:border-white/5 shadow-2xl rounded-[3rem]">
               <h3 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-3"><Activity size={18} className="text-blue-600"/> Real-time Production Telemetry Log</h3>
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead className="bg-slate-50 dark:bg-white/5 border-b dark:border-white/10">
                        <tr className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
                           <th className="px-6 py-4">Chronology</th>
                           <th className="px-6 py-4">Operational Phase</th>
                           <th className="px-6 py-4 text-center">Auth Yield</th>
                           <th className="px-6 py-4 text-center">Deviations</th>
                           <th className="px-6 py-4">Operator Entity</th>
                           <th className="px-6 py-4">Deployment Shift</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {selectedWO?.dailyOutputs?.length === 0 ? <tr><td colSpan={6}><Empty /></td></tr> : selectedWO?.dailyOutputs?.map((log, idx) => (
                           <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-600/5 transition-all">
                              <td className="px-6 py-5 font-mono text-[10px] font-black text-slate-500 tracking-widest">{new Date(log.date).toLocaleDateString()}</td>
                              <td className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.processName}</td>
                              <td className="px-6 py-5 text-center font-black text-emerald-600 text-[12px]">{log.qtyProduced} NOS</td>
                              <td className="px-6 py-5 text-center font-black text-rose-500 text-[12px]">{log.qtyRejected} NOS</td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 text-[10px] font-black">{log.operatorName.charAt(0)}</div>
                                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">{log.operatorName}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5"><span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-[9px] font-black text-slate-400 tracking-widest uppercase">{log.shift}</span></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={() => setShowModal(false)}>Terminate Session</button>
            <button className="btn-primary min-w-[240px] shadow-blue-500/30" onClick={handleExport}><Download size={16} className="mr-2"/> Audit Export</button>
          </div>
        </div>
      </Modal>

      {/* DAILY OUTPUT ENTRY MODAL */}
      <Modal open={showEntryModal} onClose={()=>setShowEntryModal(false)} title={`Tactical Entry Protocol: ${selectedProcess?.processName}`} size="md">
         <div className="space-y-8">
            <div className="p-8 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 shadow-inner">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3"><Activity size={16}/> Yield Authorization</p>
               <FormRow cols={2}>
                  <div><label className="label">Produced Artifacts *</label><input type="number" className="input-field font-black" value={entryForm.qtyProduced} onChange={e=>setEntryForm(p=>({...p, qtyProduced: e.target.value}))} placeholder="0" /></div>
                  <div><label className="label">Deviations (Rej)</label><input type="number" className="input-field font-black" value={entryForm.qtyRejected} onChange={e=>setEntryForm(p=>({...p, qtyRejected: e.target.value}))} placeholder="0" /></div>
               </FormRow>
            </div>
            
            <div className="space-y-6">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-2"><Users size={16}/> Operator Deployment</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="label">Operator Personnel Entity *</label><input className="input-field font-black uppercase tracking-widest" value={entryForm.operatorName} onChange={e=>setEntryForm(p=>({...p, operatorName: e.target.value.toUpperCase()}))} placeholder="ENTITY IDENTITY..." /></div>
                  <SearchableSelect label="Deployment Shift Matrix" options={['MORNING', 'EVENING', 'NIGHT'].map(s => ({ label: s, value: s }))} value={entryForm.shift} onChange={v => setEntryForm(p=>({...p, shift: v}))} />
               </div>
            </div>

            <div><label className="label">Technical Operational Notes</label><textarea className="input-field font-black text-[10px]" rows={3} value={entryForm.remarks} onChange={e=>setEntryForm(p=>({...p, remarks: e.target.value}))} placeholder="Specify phase-specific telemetry or manufacturing deviations..." /></div>

            <div className="flex justify-end gap-4 pt-8 border-t dark:border-white/5">
               <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-8" onClick={()=>setShowEntryModal(false)}>Abort</button>
               <button className="btn-primary px-12 shadow-blue-500/30" onClick={submitEntry}>Authorize Entry</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default JobCard;
