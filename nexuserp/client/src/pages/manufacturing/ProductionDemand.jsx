import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { PageHeader, Spinner, Empty, Badge } from '../../components/ui';

const ProductionDemand = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    try {
      const res = await api.get('/indents', { params: { type: 'PRODUCTION' } });
      setList(res.data.data);
    } catch (err) { toast.error('Failed to fetch demands'); }
    finally { setLoading(false); }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Production Demand (Indents)" subtitle="Real-time material requirements from the production floor" />

      {loading ? <Spinner /> : (
        <div className="card table-container border-b-4 border-black dark:border-white shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-black dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>{['Demand No','Work Order','Requested By','Department','Items','Status','Date'].map(h=><th key={h} className="px-6 py-4">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0f172a]">
              {list.length === 0 ? <tr><td colSpan={7}><Empty /></td></tr> : list.map(ind => (
                <tr key={ind.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400 tracking-widest">{ind.indentNo}</td>
                  <td className="px-6 py-4 font-bold text-blue-600 text-xs">{ind.orderId ? 'LINKED' : 'DIRECT'}</td>
                  <td className="px-6 py-4 font-bold text-black dark:text-white uppercase text-xs">{ind.requestedBy?.name}</td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{ind.requestedBy?.department}</td>
                  <td className="px-6 py-4 font-bold text-black dark:text-white text-xs">{ind.items?.length} Items</td>
                  <td className="px-6 py-4"><Badge status={ind.status} /></td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">{ind.createdAt?.split('T')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductionDemand;
