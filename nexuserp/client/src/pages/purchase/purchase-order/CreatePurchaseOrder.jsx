import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Spinner, SearchableSelect } from '../../../components/ui';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export default function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form State
  const [vendorId, setVendorId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [rows, setRows] = useState([{ id: Date.now(), itemId: '', qty: 1, rate: 0 }]);

  useEffect(() => {
    Promise.all([api.get('/vendors'), api.get('/items')])
      .then(([vRes, iRes]) => {
        setVendors(vRes.data.data || []);
        setItems(iRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load vendors/items'))
      .finally(() => setLoadingMeta(false));
  }, []);

  const addRow = () => setRows(r => [...r, { id: Date.now(), itemId: '', qty: 1, rate: 0 }]);
  const removeRow = (id) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = (id, field, value) => setRows(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));

  const handleItemChange = (rowId, itemId) => {
    const item = items.find(i => i.id === itemId);
    updateRow(rowId, 'itemId', itemId);
  };

  const subTotal = rows.reduce((s, r) => s + (Number(r.qty) * Number(r.rate)), 0);

  const submit = async (asDraft = false) => {
    if (!vendorId) return toast.error('Please select a vendor');
    const validRows = rows.filter(r => r.itemId && r.qty > 0 && r.rate >= 0);
    if (validRows.length === 0) return toast.error('Add at least one item with quantity and rate');

    setSaving(true);
    try {
      const payload = {
        vendorId,
        deliveryDate: deliveryDate || undefined,
        remarks,
        items: validRows.map(r => ({
          itemId: r.itemId,
          qty: Number(r.qty),
          rate: Number(r.rate),
          amount: Number(r.qty) * Number(r.rate),
        })),
      };
      await api.post('/purchase-orders', payload);
      toast.success('Purchase Order created successfully!');
      navigate('/purchase/sap-order-list');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create PO');
    } finally {
      setSaving(false);
    }
  };

  if (loadingMeta) return <div className="flex items-center justify-center h-64"><Spinner /></div>;

  return (
    <div className="pb-16 max-w-[1200px] mx-auto text-black dark:text-white">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-5 border-b border-slate-200 dark:border-white/10">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-black dark:hover:text-white transition-colors mb-3 uppercase tracking-wider">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to PO List
          </button>
          <h1 className="text-3xl font-black tracking-tight">Create Purchase Order</h1>
          <p className="text-sm text-slate-400 mt-1 font-bold">Generate a new procurement document</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary px-6 font-bold"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={() => submit()}
            className="btn-primary px-8 font-bold flex items-center gap-2"
            disabled={saving}
          >
            {saving && <Spinner className="w-4 h-4 text-white" />}
            Submit for Approval
          </button>
        </div>
      </div>

      {/* Vendor & Delivery Info */}
      <div className="card p-6 mb-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5 pb-3 border-b border-slate-100 dark:border-white/10">
          Vendor & Order Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <SearchableSelect
              label="Select Vendor *"
              placeholder="Search or choose vendor..."
              options={vendors.map(v => ({ ...v, label: `${v.companyName} (${v.vendorCode})`, value: v.id, subLabel: v.vendorCode }))}
              value={vendorId}
              onChange={setVendorId}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              className="input-field font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1.5">
              Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="input-field font-bold"
              placeholder="Optional notes..."
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Line Items</h2>
          <button onClick={addRow} className="btn-secondary text-xs px-4 py-2 font-bold flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="py-3 px-5 w-10">#</th>
                <th className="py-3 px-5">Material / Item</th>
                <th className="py-3 px-5 w-32 text-center">Quantity</th>
                <th className="py-3 px-5 w-40 text-right">Rate (INR)</th>
                <th className="py-3 px-5 w-36 text-right">Amount</th>
                <th className="py-3 px-5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-[#0f172a]"
                >
                  <td className="py-3 px-5 font-bold text-slate-400 text-xs">{index + 1}</td>
                  <td className="py-3 px-5">
                    <SearchableSelect
                      placeholder="Select item..."
                      options={items.map(i => ({ ...i, label: i.itemName, value: i.id, subLabel: i.itemCode }))}
                      value={row.itemId}
                      onChange={val => handleItemChange(row.id, val)}
                    />
                  </td>
                  <td className="py-3 px-5">
                    <input
                      type="number"
                      min="1"
                      className="input-field font-bold text-center text-xs w-full"
                      value={row.qty}
                      onChange={e => updateRow(row.id, 'qty', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field font-bold text-right text-xs w-full"
                      value={row.rate}
                      onChange={e => updateRow(row.id, 'rate', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-5 text-right font-black text-sm">
                    ₹{(Number(row.qty) * Number(row.rate)).toLocaleString()}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-black/20 flex justify-end border-t border-slate-100 dark:border-white/10">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span>₹{subTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-blue-600 dark:text-blue-400 pt-3 border-t border-slate-200 dark:border-white/10">
              <span>Grand Total</span>
              <span>₹{subTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary px-8 font-bold" disabled={saving}>
          Cancel
        </button>
        <button
          onClick={() => submit()}
          className="btn-primary px-12 font-bold flex items-center gap-2"
          disabled={saving}
        >
          {saving && <Spinner className="w-4 h-4 text-white" />}
          Submit for Approval
        </button>
      </div>
    </div>
  );
}
