import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { PageHeader, Spinner, Empty, Modal } from '../../components/ui';

const IssueHistory = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const printRef = useRef();

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/manufacturing/issue');
      setList(res.data.data);
    } catch (err) { toast.error('Failed to fetch history'); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Material Issue Slip - ${selectedIssue?.issueNo}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .flex { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #f9f9f9; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .sign-box { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 10px; }
            .logo { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="pb-10">
      <PageHeader title="Material Issue History" subtitle="Archive of all store-to-floor material transfers" />

      {loading ? <Spinner /> : (
        <div className="card table-container border-b-4 border-black dark:border-white shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-black dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>{['Slip No','Work Order','Production Item','Issued By','Date','Items','Action'].map(h=><th key={h} className="px-6 py-4">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0f172a]">
              {list.length === 0 ? <tr><td colSpan={7}><Empty /></td></tr> : list.map(iss => (
                <tr key={iss.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400 tracking-widest">{iss.issueNo}</td>
                  <td className="px-6 py-4 font-bold text-blue-600 text-xs">{iss.workOrder.woNo}</td>
                  <td className="px-6 py-4 font-bold text-black dark:text-white uppercase text-xs">{iss.workOrder.bom.productName}</td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{iss.issuedBy.name}</td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">{iss.date.split('T')[0]}</td>
                  <td className="px-6 py-4 font-bold text-black dark:text-white text-xs">{iss.items.length} Materials</td>
                  <td className="px-6 py-4">
                    <button className="btn-secondary py-1 px-4 text-[10px]" onClick={() => { setSelectedIssue(iss); setShowModal(true); }}>View / Print</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Issue Slip Details" size="xl">
        <div className="space-y-6">
          <div ref={printRef} className="bg-white dark:bg-transparent p-2 text-black dark:text-white">
            <div className="header flex">
               <div className="logo text-primary-600">NEXUS ERP</div>
               <div className="text-right">
                  <h2 className="text-xl font-bold uppercase">Material Issue Slip</h2>
                  <p className="text-xs font-bold text-slate-400">SLIP NO: {selectedIssue?.issueNo}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Production Details</p>
                  <p className="text-sm font-bold uppercase">WO: {selectedIssue?.workOrder.woNo}</p>
                  <p className="text-sm font-bold uppercase">Item: {selectedIssue?.workOrder.bom.productName}</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Issuance Info</p>
                  <p className="text-sm font-bold uppercase">Date: {selectedIssue?.date.split('T')[0]}</p>
                  <p className="text-sm font-bold uppercase">Issued By: {selectedIssue?.issuedBy.name}</p>
               </div>
            </div>

            <table>
               <thead>
                  <tr>
                    <th>#</th>
                    <th>Material Description</th>
                    <th>Issue Quantity</th>
                    <th>Unit</th>
                  </tr>
               </thead>
               <tbody>
                  {selectedIssue?.items.map((it, idx) => (
                    <tr key={it.id}>
                      <td>{idx + 1}</td>
                      <td className="font-bold uppercase text-xs">{it.item.itemName}</td>
                      <td className="font-bold text-sm">{it.issueQty}</td>
                      <td className="text-xs font-bold text-slate-400 uppercase">NOS</td>
                    </tr>
                  ))}
               </tbody>
            </table>

            <div className="footer">
               <div className="sign-box">Store Keeper Signature</div>
               <div className="sign-box">Floor Supervisor Signature</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
            <button className="btn-secondary px-8" onClick={() => setShowModal(false)}>Close</button>
            <button className="btn-primary px-12" onClick={handlePrint}>Print Slip</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IssueHistory;
