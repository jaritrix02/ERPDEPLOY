import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const SFGConversion = () => {
  const [sfgProducts, setSfgProducts] = useState([]);
  const [fgItems, setFgItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    sourceProductId: '',
    targetItemId: '',
    targetStoreId: '',
    sourceQty: 1,
    targetQty: 15,
    batchNo: ''
  });

  useEffect(() => {
    fetchSfgProducts();
    fetchFgItems();
    fetchStores();
  }, []);

  const fetchSfgProducts = async () => {
    try {
      const res = await api.get('/products');
      setSfgProducts(res.data.data.filter(p => p.item.itemType === 'SEMI_FINISHED' && p.quantity > 0));
    } catch (err) { toast.error('Failed to fetch SFG stock'); }
  };

  const fetchFgItems = async () => {
    try {
      const res = await api.get('/items');
      setFgItems(res.data.data.filter(i => i.itemType === 'FINISHED'));
    } catch (err) { toast.error('Failed to fetch items'); }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      setStores(res.data.data.filter(s => s.storeType === 'FINISHED'));
    } catch (err) { toast.error('Failed to fetch stores'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/manufacturing/convert', form);
      toast.success('Conversion Successful!');
      setShowModal(false);
      fetchSfgProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Conversion failed'); }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Block to Sheet Conversion</h1>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">Process Conversion</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-3xl shadow-xl shadow-indigo-500/20">
          <h3 className="font-black uppercase text-xs tracking-widest opacity-80 mb-1">Stock in Hand (Blocks)</h3>
          <p className="text-3xl font-black">{sfgProducts.reduce((acc, p) => acc + p.quantity, 0)} PCS</p>
        </div>
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <h3 className="font-black uppercase text-xs tracking-widest text-slate-400 mb-1">Active Batches</h3>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{sfgProducts.length}</p>
        </div>
      </div>

      <div className="card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Barcode</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Block Type</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Batch No</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-right">Available Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sfgProducts.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-primary-600">{p.barcode}</td>
                <td className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 uppercase">{p.item.itemName}</td>
                <td className="px-6 py-4 font-bold text-slate-500 uppercase tracking-tighter">{p.batchNo}</td>
                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">{p.quantity} PCS</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">SFG to FG Conversion</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Select Source Block (SFG)</label>
                <select required className="input-field font-bold" value={form.sourceProductId} onChange={e=>setForm({...form, sourceProductId: e.target.value})}>
                  <option value="">Select Block from Stock</option>
                  {sfgProducts.map(p => <option key={p.id} value={p.id}>{p.item.itemName} ({p.batchNo}) - Qty: {p.quantity}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Source (Consume)</h4>
                  <div className="flex items-center gap-2">
                    <input type="number" required className="input-field font-black w-24 text-center" value={form.sourceQty} onChange={e=>setForm({...form, sourceQty: e.target.value})} />
                    <span className="font-black text-[10px] text-slate-500">BLOCKS</span>
                  </div>
                </div>
                <div className="bg-primary-50/30 dark:bg-primary-900/10 p-4 rounded-2xl border border-dashed border-primary-200 dark:border-primary-900/50">
                  <h4 className="text-[10px] font-black uppercase text-primary-500 mb-2">Output (Produce)</h4>
                  <div className="flex items-center gap-2">
                    <input type="number" required className="input-field font-black w-24 text-center border-primary-300" value={form.targetQty} onChange={e=>setForm({...form, targetQty: e.target.value})} />
                    <span className="font-black text-[10px] text-primary-600">SHEETS</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Target Item (Sheet)</label>
                  <select required className="input-field font-bold" value={form.targetItemId} onChange={e=>setForm({...form, targetItemId: e.target.value})}>
                    <option value="">Select Finished Item</option>
                    {fgItems.map(i => <option key={i.id} value={i.id}>{i.itemName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">Finished Store</label>
                  <select required className="input-field font-bold" value={form.targetStoreId} onChange={e=>setForm({...form, targetStoreId: e.target.value})}>
                    <option value="">Select Store</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.storeName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-[10px] font-black uppercase text-slate-400 mb-1.5">New FG Batch Number</label>
                <input required className="input-field font-bold" placeholder="BATCH-FG-001" value={form.batchNo} onChange={e=>setForm({...form, batchNo: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 border border-slate-200 dark:border-slate-800">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg disabled:opacity-50">
                  {loading ? 'Processing...' : 'Run Conversion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SFGConversion;
