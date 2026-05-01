import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, Plus, Search, RotateCcw, 
  Layers, Beaker, ClipboardList, Activity, 
  Trash2, Edit3, ChevronRight, Download, 
  Zap, X, Info, Filter, LayoutGrid, 
  Printer, Archive, Database, Droplets, Target
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Modal, Badge, PageHeader, Spinner, Empty, FormRow, 
  SearchableSelect, ExportButton 
} from '../../components/ui';
import { exportToCSV } from '../../utils/exportUtils';

const BOMManagement = () => {
  const [boms, setBoms] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    productName: '',
    version: 'V1.0',
    bomItems: [{ itemId: '', qty: 1, unit: 'KG' }]
  });
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [bomRes, itemRes] = await Promise.all([
        api.get('/bom'),
        api.get('/products')
      ]);
      setBoms(bomRes.data.data || []);
      setItems(itemRes.data.data?.filter(i => i.category === 'RAW MATERIAL' || i.category === 'SEMI FINISHED') || []);
    } catch (err) { toast.error('Recipe Archive Sync Failure'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredBoms = useMemo(() => {
    return boms.filter(b => {
      const s = search.toLowerCase();
      return !s || b.productName?.toLowerCase().includes(s) || b.bomCode?.toLowerCase().includes(s);
    });
  }, [boms, search]);

  const handleExport = () => {
    const headers = [
      { label: 'BOM CODE', key: 'bomCode' },
      { label: 'PRODUCT', key: 'productName' },
      { label: 'VERSION', key: 'version' },
      { label: 'INGREDIENTS', key: 'items.length' }
    ];
    exportToCSV(filteredBoms, 'Manufacturing_Recipes', headers);
    toast.success('Formula Ledger Exported');
  };

  const handleAddItem = () => setForm({ ...form, bomItems: [...form.bomItems, { itemId: '', qty: 1, unit: 'KG' }] });
  const handleRemoveItem = (index) => setForm({ ...form, bomItems: form.bomItems.length > 1 ? form.bomItems.filter((_, i) => i !== index) : form.bomItems });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading('Synchronizing Production Recipe...');
    setLoading(true);
    try {
      if (editingId) await api.put(`/bom/${editingId}`, { productName: form.productName, version: form.version, items: form.bomItems });
      else await api.post('/bom', { productName: form.productName, version: form.version, items: form.bomItems });
      toast.success('Formula Authorized', { id: tid }); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Transaction error', { id: tid }); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 h-full overflow-y-auto custom-scrollbar">
      <PageHeader 
        title="Manufacturing Formula Registry" 
        subtitle="Master repository for production recipes, material compositions, and bill of materials management."
        icon={<FlaskConical size={28} className="text-blue-600" />}
        actions={<>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setEditingId(null); setForm({ productName:'', version:'V1.0', bomItems:[{ itemId:'', qty:1, unit:'KG' }] }); setShowModal(true); }}><Plus size={16} /> Initialize New Recipe</button>
        </>} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { l: 'Active Formulas', v: boms.length, i: <FlaskConical size={20}/>, c: 'blue' },
          { l: 'Material Ingredients', v: new Set(boms.flatMap(b => b.items.map(i => i.itemId))).size, i: <Droplets size={20}/>, c: 'cyan' },
          { l: 'Product Verticals', v: new Set(boms.map(b => b.productName)).size, i: <Target size={20}/>, c: 'emerald' },
          { l: 'Recipe Iterations', v: boms.filter(b => b.version.startsWith('V2')).length + ' Updates', i: <Activity size={20}/>, c: 'amber' }
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

      <div className="card p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
          <div className="lg:col-span-3">
            <label className="label">Search Recipe Matrix</label>
            <div className="relative group">
              <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                placeholder="Search by Product Identity, Formula Code, or Operational Version..." 
                className="input-field pl-14"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button onClick={() => setSearch('')} className="btn-secondary py-3.5 h-[50px]"><RotateCcw size={16}/> Reset Feed</button>
        </div>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredBoms.length === 0 ? (
              <div className="col-span-full"><Empty message="No production formulas detected in registry" /></div>
            ) : filteredBoms.map((bom, idx) => (
              <motion.div 
                key={bom.id} 
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: idx * 0.05 }}
                className="card p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200 dark:border-white/5 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-blue-600/5 group-hover:scale-150 transition-transform duration-1000"><FlaskConical size={120}/></div>
                
                <div className="flex justify-between items-start relative z-10 mb-8">
                   <div className="space-y-1">
                      <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none group-hover:text-blue-600 transition-colors">{bom.productName}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 leading-none">{bom.bomCode} • {bom.version}</p>
                   </div>
                   <Badge status="ACTIVE" />
                </div>

                <div className="space-y-3 relative z-10 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                   {bom.items.map((bi, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 group-hover:bg-blue-600/5 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"/>
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight line-clamp-1">{bi.item.itemName}</span>
                         </div>
                         <span className="text-[10px] font-black text-blue-600">{bi.qty} {bi.unit}</span>
                      </div>
                   ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3 relative z-10">
                   <button onClick={() => { setEditingId(bom.id); setForm({ productName: bom.productName, version: bom.version, bomItems: bom.items }); setShowModal(true); }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit3 size={14}/></button>
                   <button className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Printer size={14}/></button>
                   <button onClick={() => { if(confirm('Archive production recipe?')) api.delete(`/bom/${bom.id}`).then(load) }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={14}/></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* BOM MODAL */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Refine Production Formula' : 'Recipe Authorization Initialization'} size="lg">
        <div className="flex flex-col h-[80vh]">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-10">
            <div className="p-8 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 shadow-inner">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3"><Target size={16}/> Product Framework</p>
               <FormRow cols={2}>
                 <div><label className="label">Product Nomenclature *</label><input className="input-field font-black uppercase tracking-tight" placeholder="E.G. AIRCELL BLOCK G4" value={form.productName} onChange={e => setForm({...form, productName: e.target.value.toUpperCase()})} /></div>
                 <div><label className="label">Recipe Version Identity</label><input className="input-field font-black uppercase" placeholder="V1.0" value={form.version} onChange={e => setForm({...form, version: e.target.value.toUpperCase()})} /></div>
               </FormRow>
            </div>

            <div className="space-y-8">
               <div className="flex justify-between items-center px-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Beaker size={16}/> Ingredient Decomposition</p>
                  <button onClick={handleAddItem} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 px-6 py-2 bg-blue-600/5 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Plus size={14}/> Add Raw Material</button>
               </div>

               <div className="space-y-4">
                  {form.bomItems.map((bi, idx) => (
                    <motion.div key={idx} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                      className="p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/10 flex gap-6 items-end group hover:border-blue-500/20 transition-all"
                    >
                      <div className="flex-1">
                        <label className="label text-[9px] font-black uppercase text-slate-400 mb-2">Material SKU Identity</label>
                        <SearchableSelect
                          options={items.map(i => ({ label: i.itemName, value: i.id, subLabel: i.itemCode }))}
                          value={bi.itemId || bi.item?.id}
                          onChange={val => {
                            const newItems = [...form.bomItems];
                            newItems[idx].itemId = val;
                            setForm({...form, bomItems: newItems});
                          }}
                          placeholder="Search Registry..."
                        />
                      </div>
                      <div className="w-32">
                        <label className="label text-[9px] font-black uppercase text-slate-400 mb-2">Quantity</label>
                        <input type="number" step="any" className="input-field font-black text-center" value={bi.qty} onChange={e=>{
                          const newItems = [...form.bomItems];
                          newItems[idx].qty = parseFloat(e.target.value);
                          setForm({...form, bomItems: newItems});
                        }} />
                      </div>
                      <div className="w-24">
                        <label className="label text-[9px] font-black uppercase text-slate-400 mb-2">Unit</label>
                        <input className="input-field font-black text-center bg-slate-100 dark:bg-white/5 opacity-60" value={bi.unit || bi.item?.unit || 'KG'} readOnly />
                      </div>
                      <button onClick={()=>handleRemoveItem(idx)} className="p-3 mb-1 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><X size={14}/></button>
                    </motion.div>
                  ))}
               </div>
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={() => setShowModal(false)}>Discard</button>
            <button className="btn-primary min-w-[240px] shadow-blue-500/30" onClick={handleSubmit}>{editingId ? 'AUTHORIZE REFINEMENTS' : 'AUTHORIZE RECIPE INITIALIZATION'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BOMManagement;
