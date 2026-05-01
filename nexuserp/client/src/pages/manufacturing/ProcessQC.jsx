import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { PageHeader, Spinner, Empty, Modal, FormRow } from '../../components/ui';

const ProcessQC = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [form, setForm] = useState({
    templateId: '',
    parameters: {},
    result: '',
    passOrFail: true
  });

  useEffect(() => {
    fetchWorkOrders();
    fetchTemplates();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const res = await api.get('/manufacturing');
      setWorkOrders(res.data.data.filter(wo => wo.status === 'APPROVED'));
    } catch (err) { toast.error('Failed to fetch Work Orders'); }
    finally { setLoading(false); }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/qc/templates'); // Use existing QC templates
      setTemplates(res.data.data.filter(t => t.stage === 'PROCESS'));
    } catch (err) { toast.error('Failed to fetch QC templates'); }
  };

  const openQCModal = (wo) => {
    setSelectedWO(wo);
    setForm({ templateId: '', parameters: {}, result: '', passOrFail: true });
    setShowModal(true);
  };

  const handleTemplateChange = (tid) => {
    const t = templates.find(x => x.id === tid);
    const params = {};
    if (t?.fields) {
      t.fields.forEach(f => params[f.name] = '');
    }
    setForm(p => ({ ...p, templateId: tid, parameters: params }));
  };

  const handleSubmit = async () => {
    if (!form.templateId) return toast.error('Select a QC template');
    try {
      await api.post('/manufacturing/qc', {
        woId: selectedWO.id,
        ...form
      });
      toast.success('Process QC Recorded!');
      setShowModal(false);
    } catch (err) { toast.error('Failed to record QC'); }
  };

  return (
    <div className="pb-10">
      <PageHeader title="In-Process Quality Control" subtitle="Recording technical test results during production stages" />

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workOrders.length === 0 ? <div className="col-span-full"><Empty /></div> : workOrders.map(wo => (
            <div key={wo.id} className="card p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => openQCModal(wo)}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-black dark:text-white uppercase">{wo.woNo}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase">{wo.bom.productName}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Batch Status:</span><span className="font-bold text-black dark:text-white">ON FLOOR</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Target:</span><span className="font-bold text-black dark:text-white">{wo.plannedQty} Nos</span></div>
              </div>
              <button className="btn-secondary w-full mt-6 py-2 text-[10px] text-yellow-600 border-yellow-500/20 bg-yellow-500/5">Add Inspection Entry</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Process QC Entry: ${selectedWO?.woNo}`} size="lg">
        <div className="space-y-6">
          <div>
            <label className="label uppercase text-[10px] tracking-widest text-slate-400 font-bold mb-2 block">1. Selection Inspection Template</label>
            <select className="input-field font-bold" value={form.templateId} onChange={e => handleTemplateChange(e.target.value)}>
              <option value="">Select Template</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {form.templateId && (
            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
              {Object.keys(form.parameters).map(key => (
                <div key={key}>
                  <label className="label uppercase text-[9px] font-bold text-slate-500">{key}</label>
                  <input className="input-field py-2 text-sm font-bold" value={form.parameters[key]} 
                    onChange={e => {
                      const newParams = { ...form.parameters };
                      newParams[key] = e.target.value;
                      setForm(p => ({ ...p, parameters: newParams }));
                    }} 
                  />
                </div>
              ))}
            </div>
          )}

          <FormRow cols={2}>
             <div>
                <label className="label">Inspection Result (Pass/Fail)</label>
                <div className="flex gap-4 mt-2">
                   <button className={`flex-1 py-3 rounded-xl font-bold uppercase text-xs transition-all ${form.passOrFail ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`} onClick={()=>setForm(p=>({...p,passOrFail:true}))}>Pass</button>
                   <button className={`flex-1 py-3 rounded-xl font-bold uppercase text-xs transition-all ${!form.passOrFail ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`} onClick={()=>setForm(p=>({...p,passOrFail:false}))}>Fail</button>
                </div>
             </div>
             <div>
                <label className="label">Technical Remarks</label>
                <textarea className="input-field h-full py-2 font-bold" value={form.result} onChange={e=>setForm(p=>({...p,result:e.target.value}))} />
             </div>
          </FormRow>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
            <button className="btn-secondary px-8" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary px-12" onClick={handleSubmit}>Authorize Inspection</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProcessQC;
