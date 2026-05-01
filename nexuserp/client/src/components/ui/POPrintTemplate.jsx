import React from 'react';

export default function POPrintTemplate({ po }) {
  const vendor = po.vendor || {};
  const items = po.items || [];
  
  return (
    <div className="p-12 bg-white text-black min-h-screen font-serif print:p-0">
      {/* Company Header */}
      <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">NEXUS ERP</h1>
          <p className="text-sm font-bold opacity-80">Industrial Manufacturing Unit #4</p>
          <div className="mt-4 text-xs font-medium space-y-1">
            <p>Plot 45, Sector 18, IMT Manesar</p>
            <p>Gurgaon, Haryana - 122051</p>
            <p>GSTIN: 06AAAAA0000A1Z5</p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-black text-white px-6 py-2 inline-block mb-4">
            <h2 className="text-2xl font-black uppercase tracking-widest">Purchase Order</h2>
          </div>
          <div className="text-sm font-bold space-y-1">
            <p>PO Number: <span className="font-black underline">{po.poNo}</span></p>
            <p>PO Date: {new Date(po.createdAt).toLocaleDateString()}</p>
            <p>Indent Ref: {po.indent?.indentNo || 'Direct'}</p>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div className="border border-black p-6">
          <h3 className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 inline-block mb-3">Vendor Details</h3>
          <p className="text-lg font-black uppercase mb-2">{vendor.companyName}</p>
          <div className="text-xs space-y-1 font-medium opacity-80">
            <p>{vendor.address}</p>
            <p>{vendor.city}, {vendor.state} - {vendor.pincode}</p>
            <p className="font-bold">GSTIN: {vendor.gstNumber}</p>
            <p>Contact: {vendor.contactPerson} ({vendor.phone})</p>
          </div>
        </div>
        <div className="border border-black p-6">
          <h3 className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 inline-block mb-3">Ship To / Bill To</h3>
          <p className="text-lg font-black uppercase mb-2">NEXUS ERP CORP</p>
          <div className="text-xs space-y-1 font-medium opacity-80">
            <p>Warehouse A, Central Receiving</p>
            <p>Plot 45, Sector 18, IMT Manesar</p>
            <p>Gurgaon, Haryana - 122051</p>
            <p className="font-bold">GSTIN: 06AAAAA0000A1Z5</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-10">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y-2 border-black">
              <th className="px-4 py-3 text-left text-xs font-black uppercase w-12 text-center">#</th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase">Item Description</th>
              <th className="px-4 py-3 text-center text-xs font-black uppercase w-24">Quantity</th>
              <th className="px-4 py-3 text-right text-xs font-black uppercase w-32">Unit Rate</th>
              <th className="px-4 py-3 text-right text-xs font-black uppercase w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-black/10">
                <td className="px-4 py-4 text-xs font-bold text-center">{idx + 1}</td>
                <td className="px-4 py-4 text-xs font-black uppercase">{item.item?.itemName || item.itemName}</td>
                <td className="px-4 py-4 text-xs font-bold text-center">{item.qty}</td>
                <td className="px-4 py-4 text-xs font-bold text-right">₹{item.rate?.toLocaleString()}</td>
                <td className="px-4 py-4 text-xs font-black text-right">₹{(item.qty * item.rate)?.toLocaleString()}</td>
              </tr>
            ))}
            {/* Fill empty rows to maintain height */}
            {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-black/5 h-12">
                <td colSpan={5}></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black">
              <td colSpan={3} className="px-4 py-4 text-[10px] font-bold italic align-top">
                Total Amount in words: Indian Rupees Only
              </td>
              <td className="px-4 py-4 text-right text-xs font-black uppercase bg-slate-50">Grand Total</td>
              <td className="px-4 py-4 text-right text-lg font-black bg-slate-50 border-l border-black">
                ₹{po.totalAmount?.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Terms and Conditions */}
      <div className="grid grid-cols-2 gap-12 mt-12">
        <div>
          <h4 className="text-xs font-black uppercase underline mb-3">Terms & Conditions:</h4>
          <ol className="text-[9px] font-medium list-decimal ml-4 space-y-1 opacity-70">
            <li>Delivery must be made within 7 days of PO date.</li>
            <li>All items are subject to inspection at our site.</li>
            <li>Payment will be processed 30 days post-successful QC.</li>
            <li>PO number must be mentioned on all invoices and packages.</li>
            <li>Damaged goods will be returned at vendor's cost.</li>
          </ol>
        </div>
        <div className="flex flex-col items-center justify-end">
          <div className="w-full h-24 border border-black/10 flex items-end justify-center pb-2 relative">
             <div className="absolute top-2 right-2 opacity-10">
                <div className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center font-black text-xl rotate-12">STAMP</div>
             </div>
             <div className="h-0.5 w-48 bg-black mb-1"></div>
          </div>
          <p className="text-[10px] font-black uppercase mt-2">For NEXUS ERP CORP (Authorized Signatory)</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { margin: 1cm; size: A4; }
        }
      `}} />
    </div>
  );
}
