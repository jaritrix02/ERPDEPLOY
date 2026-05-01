import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Spinner } from '../../../components/ui';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export default function PurchaseOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/purchase-orders', { params: { status: statusFilter || undefined } })
      .then(r => setOrders(r.data.data || []))
      .catch(() => toast.error('Failed to load purchase orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = orders.filter(o =>
    (o.poNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.vendor?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    approved: orders.filter(o => o.status === 'APPROVED').length,
    totalSpend: orders.filter(o => o.status === 'APPROVED').reduce((s, o) => s + (o.totalAmount || 0), 0),
  };

  return (
    <div className="pb-10 text-black dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track all procurement documents.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            className="input-field w-36 font-bold text-xs"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <input
            type="text"
            placeholder="Search PO / Vendor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field w-52 font-bold text-xs"
          />
          <button
            onClick={() => navigate('/purchase/sap-create-order')}
            className="btn-primary px-6 font-bold whitespace-nowrap"
          >
            + Create PO
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <div className="card p-5 border-l-4 border-blue-500">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total POs</p>
          <p className="text-3xl font-black">{stats.total}</p>
        </div>
        <div className="card p-5 border-l-4 border-amber-500">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pending Approval</p>
          <p className="text-3xl font-black text-amber-500">{stats.pending}</p>
        </div>
        <div className="card p-5 border-l-4 border-emerald-500">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Approved</p>
          <p className="text-3xl font-black text-emerald-500">{stats.approved}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-blue-600 to-indigo-600 border-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Total Approved Spend</p>
          <p className="text-2xl font-black text-white">₹{(stats.totalSpend / 100000).toFixed(1)}L</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="card overflow-hidden shadow-xl border-b-4 border-black dark:border-white">
          <table className="w-full text-left">
            <thead className="bg-black dark:bg-slate-900 text-[10px] font-bold text-white uppercase tracking-widest">
              <tr>
                {['PO Number', 'Date', 'Vendor', 'Indent Ref', 'Amount (INR)', 'Status'].map(h => (
                  <th key={h} className="py-4 px-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0f172a]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-bold text-sm uppercase">
                    No purchase orders found
                  </td>
                </tr>
              ) : filtered.map(po => (
                <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="py-4 px-6 font-mono text-xs font-black text-blue-500">{po.poNo}</td>
                  <td className="py-4 px-6 text-xs text-slate-500 font-bold">{new Date(po.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-xs uppercase">{po.vendor?.companyName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{po.vendor?.vendorCode}</p>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-400 font-bold">{po.indent?.indentNo || 'DIRECT'}</td>
                  <td className="py-4 px-6 font-black text-sm">₹{(po.totalAmount || 0).toLocaleString()}</td>
                  <td className="py-4 px-6"><Badge status={po.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
