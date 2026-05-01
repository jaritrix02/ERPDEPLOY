import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

import ReportPrintTemplate from '../../components/ui/ReportPrintTemplate';

export default function PurchaseReportViewer({ reportName, onBack }) {
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    // Simulate network delay for realistic feel
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [reportName]);

  // Determine which specialized template to use based on the report name
  const nameUpper = reportName.toUpperCase();
  let templateType = 'DEFAULT';
  
  if (nameUpper.includes('BUDGET') || nameUpper.includes('ANALYSIS')) {
    templateType = 'BUDGET';
  } else if (nameUpper.includes('VENDOR') || nameUpper.includes('PAYABLE')) {
    templateType = 'VENDOR';
  } else if (nameUpper.includes('INVENTORY') || nameUpper.includes('ITEM') || nameUpper.includes('COST')) {
    templateType = 'INVENTORY';
  }

  // --- MOCK DATA GENERATION BASED ON TEMPLATE ---

  // 1. BUDGET DATA
  const { budgetData, totalBudget, totalActual, budgetVariance } = React.useMemo(() => {
    const data = Array.from({ length: 12 }).map((_, i) => ({
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      budgeted: Math.floor(Math.random() * 50000) + 100000,
      actual: Math.floor(Math.random() * 70000) + 80000,
    }));
    const tB = data.reduce((sum, item) => sum + item.budgeted, 0);
    const tA = data.reduce((sum, item) => sum + item.actual, 0);
    return { budgetData: data, totalBudget: tB, totalActual: tA, budgetVariance: ((tA - tB) / tB) * 100 };
  }, [reportName]);

  // 2. VENDOR/PAYABLE DATA
  const vendorData = React.useMemo(() => [
    { vendor: 'Apex Raw Materials', '0-30 Days': 45000, '31-60 Days': 12000, '61-90 Days': 0, '>90 Days': 0 },
    { vendor: 'Global Tech Solutions', '0-30 Days': 20000, '31-60 Days': 15000, '61-90 Days': 5000, '>90 Days': 1000 },
    { vendor: 'Nu-Cork Logistics', '0-30 Days': 80000, '31-60 Days': 2000, '61-90 Days': 0, '>90 Days': 0 },
    { vendor: 'Sandeep Synthetics', '0-30 Days': 10000, '31-60 Days': 25000, '61-90 Days': 18000, '>90 Days': 4000 },
  ], []);
  const pieColors = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
  const totalPayable = 237000;

  // 3. INVENTORY DATA
  const inventoryData = React.useMemo(() => [
    { item: 'Steel Sheets 2mm', onHand: 1450, reserved: 400, unitCost: 125.50 },
    { item: 'Aluminum Coils', onHand: 890, reserved: 800, unitCost: 310.00 },
    { item: 'Industrial Adhesives', onHand: 5200, reserved: 1200, unitCost: 45.00 },
    { item: 'Packaging Boxes', onHand: 12000, reserved: 8000, unitCost: 12.50 },
    { item: 'Rubber Gaskets', onHand: 3400, reserved: 400, unitCost: 8.75 },
  ], []);

  // 4. DEFAULT DATA
  const defaultData = React.useMemo(() => {
    const seed = reportName.length;
    return Array.from({ length: 6 }).map((_, i) => ({
      name: `Category ${i+1}`,
      valueA: Math.floor(Math.random() * 100 * seed) + 100,
      valueB: Math.floor(Math.random() * 80 * seed) + 50,
    }));
  }, [reportName]);

  // --- PREPARE DATA FOR PRINT TEMPLATE ---
  const getPrintColumns = () => {
    if (templateType === 'VENDOR') {
      return [
        { header: 'Vendor Name', key: 'vendor' },
        { header: '0-30 Days', render: r => `₹${r['0-30 Days'].toLocaleString()}` },
        { header: '31-60 Days', render: r => `₹${r['31-60 Days'].toLocaleString()}` },
        { header: '61-90 Days', render: r => `₹${r['61-90 Days'].toLocaleString()}` },
        { header: '>90 Days', render: r => `₹${r['>90 Days'].toLocaleString()}` },
        { header: 'Total Balance', render: r => `₹${(r['0-30 Days'] + r['31-60 Days'] + r['61-90 Days'] + r['>90 Days']).toLocaleString()}` }
      ];
    }
    if (templateType === 'INVENTORY') {
      return [
        { header: 'Item Description', key: 'item' },
        { header: 'Available Qty', render: r => `${r.onHand - r.reserved} Units` },
        { header: 'Unit Cost', render: r => `₹${r.unitCost.toFixed(2)}` },
        { header: 'Total Value', render: r => `₹${((r.onHand - r.reserved) * r.unitCost).toLocaleString()}` }
      ];
    }
    return [
      { header: 'Category', key: 'name' },
      { header: 'Value A', key: 'valueA' },
      { header: 'Value B', key: 'valueB' }
    ];
  };

  const getPrintData = () => {
    if (templateType === 'VENDOR') return vendorData;
    if (templateType === 'INVENTORY') return inventoryData;
    return defaultData;
  };

  const getSummaryData = () => {
    if (templateType === 'VENDOR') return [{ label: 'Total Outstanding', value: `₹${totalPayable.toLocaleString()}` }];
    if (templateType === 'BUDGET') return [
      { label: 'Total Budget', value: `₹${totalBudget.toLocaleString()}` },
      { label: 'Total Actual', value: `₹${totalActual.toLocaleString()}` },
      { label: 'Variance', value: `${budgetVariance.toFixed(2)}%` }
    ];
    return [];
  };

  const handleExport = () => {
    const data = getPrintData();
    const columns = getPrintColumns();
    if (data.length === 0) return;

    const headers = columns.map(c => c.header);
    const rows = data.map(row => 
      columns.map(col => {
        const val = col.render ? col.render(row) : row[col.key];
        // Clean currency symbols and commas for CSV
        return typeof val === 'string' ? `"${val.replace(/[₹,]/g, '')}"` : val;
      })
    );

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#121212]">
        <Spinner />
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Generating {reportName} Data...</p>
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="bg-slate-900 min-h-screen overflow-auto scrollbar-none">
        <div className="no-print bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center sticky top-0 z-[100]">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-500 rounded-lg text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </span>
            <h2 className="text-white font-black uppercase tracking-widest text-sm">Print Preview</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsPreview(false)} className="px-5 py-2 bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-600 transition-all">
              Exit Preview
            </button>
            <button onClick={() => window.print()} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">
              Print Now
            </button>
          </div>
        </div>
        <div className="max-w-[1000px] mx-auto my-10 bg-white shadow-2xl rounded-sm overflow-hidden">
          <ReportPrintTemplate 
            title={reportName}
            subtitle={`Procurement Intelligence - ${templateType} Analysis`}
            data={getPrintData()}
            columns={getPrintColumns()}
            summaryData={getSummaryData()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-[#121212] min-h-screen text-slate-800 dark:text-slate-200 pb-12 font-sans -m-4 sm:-m-6 lg:-m-8">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-[#333] px-6 py-6 shadow-sm flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#333] transition-colors text-slate-500 dark:text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{reportName}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold text-blue-500">
              Module: {templateType} ENGINE
            </p>
          </div>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => {
               const link = document.createElement('a');
               let file = 'Purchase_Budget_Template.csv';
               if (templateType === 'VENDOR') file = 'Vendor_Aging_Template.csv';
               if (templateType === 'INVENTORY') file = 'Inventory_Costing_Template.csv';
               link.href = `/import_template/${file}`;
               link.download = file;
               // In a real dev env, these files are in root/import_template
               // For this demo, we'll trigger a mock toast if file not found in public
               toast.success(`Template ${file} downloading...`);
             }}
             className="px-4 py-2 bg-slate-100 dark:bg-[#333] text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-[#444] transition-colors"
           >
             Get Template
           </button>
           <div className="relative">
             <input 
               type="file" 
               id="report-import" 
               className="hidden" 
               accept=".csv" 
               onChange={(e) => {
                 const file = e.target.files[0];
                 if (file) {
                   toast.success(`Successfully imported ${file.name}. Analysis updated.`);
                   // Simulate data refresh
                   setLoading(true);
                   setTimeout(() => setLoading(false), 1000);
                 }
               }} 
             />
             <button 
               onClick={() => document.getElementById('report-import').click()}
               className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
             >
               Import Data
             </button>
           </div>
           <button 
             onClick={handleExport}
             className="px-4 py-2 bg-white dark:bg-[#252525] border border-slate-200 dark:border-[#444] rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#333] transition-colors"
           >
             Export CSV
           </button>
           <button 
             onClick={() => setIsPreview(true)}
             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
           >
             Print Report
           </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        
        {/* ======================================= */}
        {/*         BUDGET & ANALYSIS TEMPLATE        */}
        {/* ======================================= */}
        {templateType === 'BUDGET' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#333]">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-2">Total Allocated Budget</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-white">₹{totalBudget.toLocaleString()}</p>
               </div>
               <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#333]">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-2">Actual Consumed</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-white">₹{totalActual.toLocaleString()}</p>
               </div>
               <div className={`bg-gradient-to-br ${budgetVariance > 0 ? 'from-red-500 to-rose-600' : 'from-emerald-400 to-teal-500'} p-6 rounded-2xl shadow-sm text-white`}>
                  <p className="text-xs font-bold uppercase mb-2 text-white/80">Variance (Actual vs Budget)</p>
                  <p className="text-3xl font-black">{budgetVariance > 0 ? '+' : ''}{budgetVariance.toFixed(2)}%</p>
               </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-[#333] h-[450px]">
              <h2 className="text-lg font-bold mb-6">Budget vs Actual Spend - YTD</h2>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '8px'}} />
                  <Legend />
                  <Bar dataKey="budgeted" name="Budgeted Amount" fill="#3b82f6" radius={[4,4,0,0]} barSize={30} />
                  <Line type="monotone" dataKey="actual" name="Actual Spend" stroke="#f59e0b" strokeWidth={4} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ======================================= */}
        {/*         VENDOR & PAYABLE TEMPLATE         */}
        {/* ======================================= */}
        {templateType === 'VENDOR' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#333]">
                  <h2 className="text-sm font-bold mb-4">Aged Payables Overview</h2>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          {name: '0-30 Days', value: 155000}, {name: '31-60 Days', value: 54000},
                          {name: '61-90 Days', value: 23000}, {name: '>90 Days', value: 5000}
                        ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieColors.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-[#333]">
                 <h2 className="text-sm font-bold mb-6">Total Outstanding Payables</h2>
                 <p className="text-5xl font-black text-slate-800 dark:text-white mb-4">₹{totalPayable.toLocaleString()}</p>
                 <p className="text-sm text-slate-500 leading-relaxed">
                   2.1% of total payables are severely overdue (&gt;90 days). Vendor "Sandeep Synthetics" constitutes 80% of critical overdue balances. Please prioritize clearance to avoid material hold.
                 </p>
               </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-100 dark:border-[#333] overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-[#333]">
                  <h2 className="text-lg font-bold">Vendor Balances to Date</h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-[#252525] text-xs uppercase tracking-wider text-slate-500">
                       <th className="py-4 px-6 font-medium">Vendor Name</th>
                       <th className="py-4 px-6 font-medium text-emerald-500">0-30 Days</th>
                       <th className="py-4 px-6 font-medium text-amber-500">31-60 Days</th>
                       <th className="py-4 px-6 font-medium text-orange-500">61-90 Days</th>
                       <th className="py-4 px-6 font-medium text-red-500">&gt;90 Days</th>
                       <th className="py-4 px-6 font-bold text-right">Total Balance</th>
                     </tr>
                   </thead>
                   <tbody className="text-sm font-medium">
                     {vendorData.map((row, idx) => {
                       const total = row['0-30 Days'] + row['31-60 Days'] + row['61-90 Days'] + row['>90 Days'];
                       return (
                       <tr key={idx} className="border-b border-slate-100 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#2a2a2a]">
                         <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">{row.vendor}</td>
                         <td className="py-4 px-6">₹{row['0-30 Days'].toLocaleString()}</td>
                         <td className="py-4 px-6">₹{row['31-60 Days'].toLocaleString()}</td>
                         <td className="py-4 px-6">₹{row['61-90 Days'].toLocaleString()}</td>
                         <td className="py-4 px-6 font-bold text-red-500">₹{row['>90 Days'].toLocaleString()}</td>
                         <td className="py-4 px-6 text-right font-black">₹{total.toLocaleString()}</td>
                       </tr>
                     )})}
                   </tbody>
                 </table>
               </div>
            </div>
          </>
        )}

        {/* ======================================= */}
        {/*         INVENTORY & COSTING TEMPLATE      */}
        {/* ======================================= */}
        {templateType === 'INVENTORY' && (
          <>
            <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-[#333] h-[400px]">
              <h2 className="text-lg font-bold mb-6">Inventory Quantities (On-Hand vs Reserved)</h2>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                  <XAxis dataKey="item" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '8px'}} />
                  <Legend />
                  <Bar dataKey="onHand" name="Qty On Hand" fill="#6366f1" radius={[4,4,0,0]} barSize={40} />
                  <Bar dataKey="reserved" name="Qty Reserved (Allocated)" fill="#f43f5e" radius={[4,4,0,0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-100 dark:border-[#333] overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-[#333]">
                  <h2 className="text-lg font-bold">Item Valuation & Costing Register</h2>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-[#252525] text-xs uppercase tracking-wider text-slate-500">
                       <th className="py-4 px-6 font-medium">Item Description</th>
                       <th className="py-4 px-6 font-medium">Available Qty</th>
                       <th className="py-4 px-6 font-medium">Unit Cost (INR)</th>
                       <th className="py-4 px-6 font-bold text-right">Total Inventory Value</th>
                     </tr>
                   </thead>
                   <tbody className="text-sm font-medium">
                     {inventoryData.map((row, idx) => (
                       <tr key={idx} className="border-b border-slate-100 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#2a2a2a]">
                         <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400">{row.item}</td>
                         <td className="py-4 px-6">{row.onHand - row.reserved} Units</td>
                         <td className="py-4 px-6">₹{row.unitCost.toFixed(2)}</td>
                         <td className="py-4 px-6 text-right font-black">₹{((row.onHand - row.reserved) * row.unitCost).toLocaleString()}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </>
        )}

        {/* ======================================= */}
        {/*         DEFAULT GENERAL TEMPLATE          */}
        {/* ======================================= */}
        {templateType === 'DEFAULT' && (
          <>
            <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-[#333] h-[400px]">
              <h2 className="text-lg font-bold mb-6">General Report Distribution</h2>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={defaultData}>
                  <defs>
                    <linearGradient id="colorDef" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '8px'}} />
                  <Area type="monotone" dataKey="valueA" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDef)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
