import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { SearchableSelect } from '../../components/ui';
import { socket } from '../../services/socket';
import { motion } from 'framer-motion';
import { SearchX, AlertCircle, X, Plus } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } }
};

const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [boms, setBoms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ bomId: '', plannedQty: '', startDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchData();

    socket.on('workorder:updated', () => {
        fetchWorkOrders();
    });

    return () => {
        socket.off('workorder:updated');
    }
  }, []);

  const fetchData = async () => {
    setInitialLoading(true);
    setError(null);
    try {
      await Promise.all([fetchWorkOrders(), fetchBoms()]);
    } catch (err) {
      setError(err);
    }
    setInitialLoading(false);
  };

  const fetchWorkOrders = async () => {
    try {
      const res = await api.get('/manufacturing');
      setWorkOrders(res.data.data);
    } catch (err) { toast.error('Failed to fetch Work Orders'); throw err; }
  };

  const fetchBoms = async () => {
    try {
      const res = await api.get('/bom');
      setBoms(res.data.data);
    } catch (err) { toast.error('Failed to fetch BOMs'); throw err; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/manufacturing', form);
      toast.success('Work Order Created & Material Indent Raised!');
      setShowModal(false);
      fetchWorkOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create WO'); }
    setLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-muted shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-32 rounded-full bg-muted" />
              <div className="h-3 w-20 rounded-full bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-xl bg-muted" />
            <div className="h-16 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Something went wrong</p>
          <p className="text-xs text-muted-foreground">{error?.message || 'Failed to load data.'}</p>
          <button onClick={fetchData} className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
            rounded-xl bg-primary text-white hover:bg-primary/90
            focus:outline-none focus:ring-2 focus:ring-primary/50
            transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="p-6 md:p-6 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Production Work Orders</h1>
        <button onClick={() => setShowModal(true)} 
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
            rounded-xl bg-primary text-white hover:bg-primary/90
            focus:outline-none focus:ring-2 focus:ring-primary/50
            transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none">
          <Plus className="size-4" /> New Work Order
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground">WO Number</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground">Formula / Product</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground">Planned Qty</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground">Start Date</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <SearchX className="size-6 text-muted-foreground/60" />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-1">No results found</p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        No work orders exist yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                workOrders.map(wo => (
                  <tr key={wo.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-primary">{wo.woNo}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{wo.bom.productName}</div>
                      <div className="text-xs text-muted-foreground">{wo.bom.bomCode}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{wo.plannedQty} PCS</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(wo.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        wo.status === 'APPROVED' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {wo.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <motion.div variants={scaleIn} initial="hidden" animate="visible" 
            className="z-61 bg-card rounded-2xl w-full max-w-lg shadow-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/50">
              <h2 className="text-lg font-semibold text-foreground">Create Production Order</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Select Formula (BOM)</label>
                <SearchableSelect
                  options={boms.map(b => ({ label: `${b.productName} (${b.bomCode})`, value: b.id }))}
                  value={form.bomId}
                  onChange={val => setForm({...form, bomId: val})}
                  placeholder="Select Formula..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Target Quantity</label>
                  <input type="number" required 
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200" 
                    value={form.plannedQty} onChange={e=>setForm({...form, plannedQty: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Start Date</label>
                  <input type="date" required 
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200" 
                    value={form.startDate} onChange={e=>setForm({...form, startDate: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={()=>setShowModal(false)} 
                  className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium
                    rounded-xl text-foreground hover:bg-muted
                    focus:outline-none focus:ring-2 focus:ring-border
                    transition-all duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={loading} 
                  className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium
                    rounded-xl bg-primary text-white hover:bg-primary/90
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none">
                  {loading ? 'Issuing...' : 'Launch Production'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default WorkOrders;
