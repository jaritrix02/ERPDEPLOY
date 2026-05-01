import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { PageHeader, Spinner, Empty, Modal, FormRow, SearchableSelect } from '../../components/ui';

const MaterialIssue = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [issueItems, setIssueItems] = useState([]);
  const [issuedById, setIssuedById] = useState('');

  useEffect(() => {
    fetchWorkOrders();
    fetchStores();
    fetchEmployees();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const res = await api.get('/manufacturing');
      setWorkOrders(res.data.data.filter(wo => wo.status === 'APPROVED' || wo.status === 'PENDING'));
    } catch (err) { toast.error('Failed to fetch Work Orders'); }
    finally { setLoading(false); }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      setStores(res.data.data.filter(s => s.storeType === 'RAW_MATERIAL'));
    } catch (err) { toast.error('Failed to fetch stores'); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data.data);
    } catch (err) { toast.error('Failed to fetch employees'); }
  };

  const openIssueModal = (wo) => {
    setSelectedWO(wo);
    setIssuedById('');
    // Auto-calculate required items from BOM
    const items = wo.bom.items.map(it => ({
      itemId: it.itemId,
      itemName: it.item.itemName,
      requiredQty: it.qty * wo.plannedQty,
      issueQty: it.qty * wo.plannedQty,
      storeId: ''
    }));
    setIssueItems(items);
    setShowModal(true);
  };

  const handleIssue = async () => {
    if (!issuedById) return toast.error('Please select an issuing employee');
    if (issueItems.some(it => !it.storeId)) return toast.error('Please select store for all items');
    
    try {
      await api.post('/manufacturing/issue', {
        woId: selectedWO.id,
        issuedById,
        items: issueItems.map(it => ({ itemId: it.itemId, qty: it.issueQty, storeId: it.storeId }))
      });
      toast.success('Material Issued to Floor!');
      setShowModal(false);
      fetchWorkOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Issue failed'); }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Material Issue (Store to Floor)" subtitle="Issuing raw materials against approved Work Orders" />

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workOrders.length === 0 ? <div className="col-span-full"><Empty /></div> : workOrders.map(wo => (
            <div key={wo.id} className="card p-6 border-l-4 border-primary-500 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => openIssueModal(wo)}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-black dark:text-white uppercase">{wo.woNo}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase">{wo.bom.productName}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-500/10 text-primary-600 text-[10px] font-bold uppercase tracking-widest">
                  {wo.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Target Qty:</span><span className="font-bold text-black dark:text-white">{wo.plannedQty} Nos</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold uppercase">Start Date:</span><span className="font-bold text-black dark:text-white">{wo.startDate.split('T')[0]}</span></div>
              </div>
              <button className="btn-primary w-full mt-6 py-2 text-[10px]">Generate Issue Slip</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={`Material Issue: ${selectedWO?.woNo}`} size="xl">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
             <div><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Production Item</p><p className="font-bold text-black dark:text-white text-base">{selectedWO?.bom.productName}</p></div>
             <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Batch Size</p><p className="font-bold text-black dark:text-white text-2xl">{selectedWO?.plannedQty} Nos</p></div>
          </div>

          <div className="p-5 bg-primary-50 dark:bg-primary-500/5 rounded-2xl border border-primary-100 dark:border-primary-500/10">
             <label className="label text-primary-600 dark:text-primary-400 font-bold uppercase text-[10px] mb-2 block">Authorized Issuer (Select Employee) *</label>
             <SearchableSelect
                options={employees.map(emp => ({ label: `${emp.employeeCode} - ${emp.name} (${emp.department})`, value: emp.id }))}
                value={issuedById}
                onChange={val => setIssuedById(val)}
                placeholder="-- Search / Select Employee --"
             />
          </div>

          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                   <th className="py-3 px-2">Ingredient</th>
                   <th className="py-3 px-2">Required</th>
                   <th className="py-3 px-2 w-32">Issue Qty</th>
                   <th className="py-3 px-2">Source Store</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {issueItems.map((it, idx) => (
                   <tr key={idx} className="text-xs">
                      <td className="py-4 px-2 font-bold text-black dark:text-white uppercase">{it.itemName}</td>
                      <td className="py-4 px-2 font-mono font-bold text-slate-400">{it.requiredQty.toFixed(2)}</td>
                      <td className="py-4 px-2">
                         <input type="number" className="input-field py-1 text-xs font-bold" value={it.issueQty} 
                            onChange={e => {
                               const newItems = [...issueItems];
                               newItems[idx].issueQty = parseFloat(e.target.value);
                               setIssueItems(newItems);
                            }} 
                         />
                      </td>
                      <td className="py-4 px-2">
                         <SearchableSelect
                            options={stores.map(s => ({ label: s.storeName, value: s.id }))}
                            value={it.storeId}
                            onChange={val => {
                               const newItems = [...issueItems];
                               newItems[idx].storeId = val;
                               setIssueItems(newItems);
                            }}
                            placeholder="Select Store"
                            small={true}
                         />
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
            <button className="btn-secondary px-8" onClick={() => setShowModal(false)}>Discard</button>
            <button className="btn-primary px-12" onClick={handleIssue}>Issue & Sign Slip</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialIssue;
