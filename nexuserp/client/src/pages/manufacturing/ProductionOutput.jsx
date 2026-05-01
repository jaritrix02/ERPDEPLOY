import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const ProductionOutput = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    woId: '',
    itemId: '',
    storeId: '',
    quantity: '',
    batchNo: '',
    rate: '1200'
  });

  useEffect(() => {
    fetchWorkOrders();
    fetchStores();
    fetchItems();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const res = await api.get('/manufacturing');
      setWorkOrders(res.data.data.filter(wo => wo.status === 'APPROVED'));
    } catch (err) { toast.error('Failed to fetch Work Orders'); }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      setStores(res.data.data.filter(s => s.storeType === 'SEMI_FINISHED_1'));
    } catch (err) { toast.error('Failed to fetch stores'); }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data.data.filter(i => i.itemType === 'SEMI_FINISHED'));
    } catch (err) { toast.error('Failed to fetch items'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/manufacturing/production', form);
      toast.success('Production Recorded & Stock Updated!');
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record production'); }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Production Output (SFG Entry)</h1>
        <button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/20">Record Output</button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-6 rounded-3xl mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-tight">Step-by-Step Workflow</h3>
            <p className="text-xs text-slate-500 font-medium">1. Select Approved WO ➡️ 2. Record Block Output ➡️ 3. Auto-update SFG Store Stock</p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Record Production Entry</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Source Work Order</label>
                <select required className="input-field font-bold" value={form.woId} onChange={e=>setForm({...form, woId: e.target.value})}>
                  <option value="">Select Work Order</option>
                  {workOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.woNo} - {wo.bom.productName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Output Item (SFG)</label>
                  <select required className="input-field font-bold" value={form.itemId} onChange={e=>setForm({...form, itemId: e.target.value})}>
                    <option value="">Select Item</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.itemName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">SFG Store</label>
                  <select required className="input-field font-bold" value={form.storeId} onChange={e=>setForm({...form, storeId: e.target.value})}>
                    <option value="">Select Store</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.storeName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Produced Quantity</label>
                  <input type="number" required className="input-field font-bold" placeholder="e.g. 40" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Batch Number</label>
                  <input required className="input-field font-bold" placeholder="BATCH-2026-X" value={form.batchNo} onChange={e=>setForm({...form, batchNo: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 border border-slate-200 dark:border-slate-800">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg disabled:opacity-50">
                  {loading ? 'Processing...' : 'Complete Production'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionOutput;
