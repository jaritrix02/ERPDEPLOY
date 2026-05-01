import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import api from '../../services/api';
import { Spinner, Badge, SearchableSelect } from '../../components/ui';
import { socket } from '../../services/socket';
import PurchaseReportViewer from './PurchaseReportViewer';

export default function PurchaseDashboard() {
  const { user } = useSelector(s => s.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedReport, setSelectedReport] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/purchase');
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    socket.on('indent:updated', loadData);
    socket.on('po:updated', loadData);

    return () => {
        socket.off('indent:updated');
        socket.off('po:updated');
    }
  }, []);

  if (loading || !data) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-[#121212]"><Spinner /></div>;

  const { overview, charts } = data;
  const variancePositive = overview.variance > 0;

  const tabs = ['Overview', 'Details', 'Context', 'Compliance', 'Off Contract'];

  // Mock compliance data
  const complianceData = [
    { name: 'Compliant', value: 98.06, fill: '#10b981' },
    { name: 'Noncompliant', value: 1.94, fill: '#ef4444' }
  ];

  const offContractData = [
    { name: 'On Contract', value: 85, fill: '#3b82f6' },
    { name: 'Off Contract', value: 15, fill: '#f59e0b' }
  ];

  const renderHorizontalBar = (title, chartData, color = '#3b82f6') => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      whileHover={{ y: -5, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
      transition={{ duration: 0.4, type: "spring", stiffness: 400, damping: 25 }}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 transition-all group"
    >
      <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-1 group-hover:text-blue-500 transition-colors">{title}</h3>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4">in Million INR | Top 5</p>
      <div className="h-40 w-full text-[10px] font-bold">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{top: 0, right: 30, left: 0, bottom: 0}}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.1} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill:'#888'}} width={90} />
            <Tooltip cursor={{fill: 'rgba(128,128,128,0.1)'}} contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '8px'}} />
            <Bar dataKey="value" fill={color} radius={[0,4,4,0]} barSize={14}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? color : `${color}99`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );

  if (selectedReport) {
    return <PurchaseReportViewer reportName={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <div className="bg-slate-50 dark:bg-[#121212] min-h-screen text-slate-800 dark:text-slate-200 pb-12 font-sans -m-4 sm:-m-6 lg:-m-8">
      
      {/* Header Section */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-[#333] px-6 py-8 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-1 tracking-tight">
              Purchasing Spend Intelligence
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Advanced Analytics & Live Expenditure Tracking</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-slate-100 dark:bg-[#252525] p-1.5 rounded-xl shadow-inner overflow-x-auto w-full md:w-auto hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-md transform scale-100' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 scale-95'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.3)" }}
                transition={{ duration: 0.5, type: "spring", stiffness: 400, damping: 25 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group border border-blue-500/30 transition-all"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                <h3 className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2">Current Year Spend</h3>
                <div className="flex items-end gap-2">
                   <span className="text-4xl font-black drop-shadow-sm">{overview.currentYearTotal.toFixed(2)}</span>
                   <span className="text-sm font-bold text-blue-200 mb-1 tracking-tighter">M INR</span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
                className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl transition-all"
              >
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Previous Year Spend</h3>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-slate-800 dark:text-white drop-shadow-sm">{overview.previousYearTotal.toFixed(2)}</span>
                  <span className="text-sm font-bold text-slate-400 mb-1 tracking-tighter">M INR</span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                whileHover={{ y: -8, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl transition-all"
              >
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Variance</h3>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-black drop-shadow-sm ${variancePositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {variancePositive ? '↑' : '↓'} {Math.abs(overview.variance).toFixed(2)}%
                  </span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all flex flex-col justify-center">
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-4">Spend Ratio (CY vs PY)</h3>
                <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex relative shadow-inner">
                  <div className="bg-blue-500 h-full flex items-center justify-center text-[10px] font-black tracking-widest text-white z-10 transition-all duration-1000" style={{width: `${(overview.currentYearTotal / (overview.currentYearTotal + overview.previousYearTotal)) * 100}%`}}>CY</div>
                  <div className="bg-slate-400 dark:bg-slate-600 h-full flex items-center justify-center text-[10px] font-black tracking-widest text-white transition-all duration-1000" style={{width: `${(overview.previousYearTotal / (overview.currentYearTotal + overview.previousYearTotal)) * 100}%`}}>PY</div>
                </div>
              </motion.div>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl">
                <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 uppercase tracking-widest">Spend by Quarter</h2>
                <div className="h-[300px] w-full text-xs font-bold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.byQuarter} margin={{top: 20, right: 0, left: -20, bottom: 0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#888', fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#888', fontWeight: 700}} />
                      <Tooltip cursor={{fill: 'rgba(128,128,128,0.1)'}} contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '12px', fontWeight: 700}} />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{fontWeight: 700}} />
                      <Bar dataKey="CY" fill="#3b82f6" radius={[4,4,0,0]} barSize={25} name="Current Year" />
                      <Bar dataKey="PY" fill="#94a3b8" radius={[4,4,0,0]} barSize={25} name="Previous Year" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl">
                <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6 uppercase tracking-widest">Spend Trend</h2>
                <div className="h-[300px] w-full text-xs font-bold">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.byTrend} margin={{top: 20, right: 0, left: -20, bottom: 0}}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.1} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#888', fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#888', fontWeight: 700}} />
                      <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '12px', fontWeight: 700}} />
                      <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Bottom Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderHorizontalBar("by Supplier", charts.topSuppliers, '#f43f5e')}
              {renderHorizontalBar("by Material Group", charts.topMaterialGroups, '#10b981')}
              {renderHorizontalBar("by Purchasing Group", charts.topSuppliers.map(s => ({name: `PG-${s.name.slice(0,3).toUpperCase()}`, value: s.value * 0.8})), '#f59e0b')}
              {renderHorizontalBar("by Plant", [{name:'Plant Alpha', value: overview.currentYearTotal * 0.6}, {name:'Plant Beta', value: overview.currentYearTotal * 0.4}], '#6366f1')}
              {renderHorizontalBar("by Org", [{name:'Global Procurement', value: overview.currentYearTotal}], '#8b5cf6')}
              {renderHorizontalBar("by Country", [{name:'India', value: overview.currentYearTotal * 0.9}, {name:'China', value: overview.currentYearTotal * 0.1}], '#ec4899')}
            </div>
          </div>
        )}

        {/* ==================== DETAILS TAB ==================== */}
        {activeTab === 'Details' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black text-slate-800 dark:text-white">Report Explorer</h2>
               <div className="w-80">
                 <SearchableSelect 
                   placeholder="Search & Jump to Report..."
                   options={[
                     ...['Purchase Budgets', 'Purchase Analysis Reports', 'Purchase Analysis by Dimensions', 'Item Dimensions - Detail', 'Item Dimensions - Total'].map(r => ({ label: r, value: r, subLabel: 'Budgets & Analysis' })),
                     ...['Purchase Advice', 'Item/Vendor Catalog', 'Aged Accounts Payable', 'Vendor Purchases by Item', 'Item Charges - Specification', 'Item Substitutions', 'Purchasing Deferral Summary'].map(r => ({ label: r, value: r, subLabel: 'General Reports' })),
                     ...['Vendor - Balance to Date', 'Vendor - Purchase List', 'Vendor - Trial Balance', 'Top Vendor List', 'Vendor - Listing', 'Vendor Purchase Statistics'].map(r => ({ label: r, value: r, subLabel: 'Vendor Analytics' })),
                     ...['Inventory - Cost Variance', 'Inventory - Availability Plan', 'Inventory - Inbound Transfer', 'Invt. Valuation - Cost Spec.', 'Item Age Composition - Qty.', 'Item Age Composition - Value', 'Item Register - Value', 'Item Expiration - Quantity'].map(r => ({ label: r, value: r, subLabel: 'Inventory Analytics' }))
                   ]}
                   stayCleared={true}
                   onChange={(val) => setSelectedReport(val)}
                 />
               </div>
            </div>
            
            {/* 3-Column Detailed Report Explorer */}
            <div className="bg-white dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#333] p-8 rounded-2xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                
                {/* Column 1 */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Purchasing <span className="text-slate-400 font-normal">(2)</span></h2>
                    
                    <div className="ml-4 mb-4 border-l-2 border-slate-100 dark:border-[#333] pl-4">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">- Budgets & Analysis <span className="text-slate-400 font-normal">(5)</span></h3>
                      <ul className="ml-2 space-y-2 text-[12px] text-blue-500 dark:text-blue-400">
                        <li><button onClick={() => setSelectedReport('Purchase Budgets')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Purchase Budgets</button></li>
                        <li><button onClick={() => setSelectedReport('Purchase Analysis Reports')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Purchase Analysis Reports</button></li>
                        <li><button onClick={() => setSelectedReport('Purchase Analysis by Dimensions')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Purchase Analysis by Dimensions</button></li>
                        <li><button onClick={() => setSelectedReport('Item Dimensions - Detail')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Dimensions - Detail</button></li>
                        <li><button onClick={() => setSelectedReport('Item Dimensions - Total')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Dimensions - Total</button></li>
                      </ul>
                    </div>

                    <div className="ml-4 border-l-2 border-slate-100 dark:border-[#333] pl-4">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">- Reports <span className="text-slate-400 font-normal">(8)</span></h3>
                      <ul className="ml-2 space-y-2 text-[12px] text-blue-500 dark:text-blue-400">
                        <li><button onClick={() => setSelectedReport('Purchase Advice')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Purchase Advice</button></li>
                        <li><button onClick={() => setSelectedReport('Item/Vendor Catalog')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item/Vendor Catalog</button></li>
                        <li><button onClick={() => setSelectedReport('Aged Accounts Payable')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Aged Accounts Payable</button></li>
                        <li><button onClick={() => setSelectedReport('Vendor Purchases by Item')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Vendor Purchases by Item</button></li>
                        <li><button onClick={() => setSelectedReport('Item Charges - Specification')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Charges - Specification</button></li>
                        <li><button onClick={() => setSelectedReport('Item Substitutions')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Substitutions</button></li>
                        <li><button onClick={() => setSelectedReport('Purchasing Deferral Summary')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Purchasing Deferral Summary</button></li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Setup <span className="text-slate-400 font-normal">(1)</span></h2>
                    <div className="ml-4 border-l-2 border-slate-100 dark:border-[#333] pl-4">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">- Purchase Analysis <span className="text-slate-400 font-normal">(1)</span></h3>
                      <ul className="ml-2 space-y-2 text-[12px] text-blue-500 dark:text-blue-400">
                        <li><button onClick={() => setSelectedReport('Purchase Analysis by Dimensions')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Purchase Analysis by Dimensions</button></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Planning <span className="text-slate-400 font-normal">(1)</span></h2>
                    <div className="ml-4 border-l-2 border-slate-100 dark:border-[#333] pl-4">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">- Reports <span className="text-slate-400 font-normal">(7)</span></h3>
                      <ul className="ml-2 space-y-2 text-[12px] text-blue-500 dark:text-blue-400">
                        <li><button onClick={() => setSelectedReport('Purchase Reservation Avail')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Purchase Reservation Avail.</button></li>
                        <li><button onClick={() => setSelectedReport('Nonstock Item Sales')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Nonstock Item Sales</button></li>
                        <li><button onClick={() => setSelectedReport('Item/Vendor Catalog')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item/Vendor Catalog</button></li>
                        <li><button onClick={() => setSelectedReport('Vendor Purchase Statistics')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Vendor Purchase Statistics</button></li>
                        <li><button onClick={() => setSelectedReport('Item Substitutions')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Substitutions</button></li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Vendor <span className="text-slate-400 font-normal">(8)</span></h2>
                    <div className="ml-4 mb-4 border-l-2 border-slate-100 dark:border-[#333] pl-4">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">- Vendor <span className="text-slate-400 font-normal">(8)</span></h3>
                      <ul className="ml-2 space-y-2 text-[12px] text-blue-500 dark:text-blue-400">
                        <li><button onClick={() => setSelectedReport('Vendor - Balance to Date')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Vendor - Balance to Date</button></li>
                        <li><button onClick={() => setSelectedReport('Vendor Purchases by Item')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Vendor Purchases by Item</button></li>
                        <li><button onClick={() => setSelectedReport('Vendor - Purchase List')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Vendor - Purchase List</button></li>
                        <li><button onClick={() => setSelectedReport('Vendor - Trial Balance')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Vendor - Trial Balance</button></li>
                        <li><button onClick={() => setSelectedReport('Top Vendor List')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Top Vendor List</button></li>
                        <li><button onClick={() => setSelectedReport('Vendor - Listing')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Vendor - Listing</button></li>
                        <li><button onClick={() => setSelectedReport('Aged Accounts Payable')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Aged Accounts Payable</button></li>
                        <li><button onClick={() => setSelectedReport('Vendor Purchase Statistics')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Vendor Purchase Statistics</button></li>
                      </ul>
                    </div>

                    <div className="ml-4 border-l-2 border-slate-100 dark:border-[#333] pl-4">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">- Inventory <span className="text-slate-400 font-normal">(4)</span></h3>
                      <ul className="ml-2 space-y-2 text-[12px] text-blue-500 dark:text-blue-400">
                        <li><button onClick={() => setSelectedReport('Inventory - Cost Variance')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Inventory - Cost Variance</button></li>
                        <li><button onClick={() => setSelectedReport('Inventory - Availability Plan')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Inventory - Availability Plan</button></li>
                        <li><button onClick={() => setSelectedReport('Purchase Advice')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Purchase Advice</button></li>
                        <li><button onClick={() => setSelectedReport('Inventory - Inbound Transfer')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Inventory - Inbound Transfer</button></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Inventory & Costing <span className="text-slate-400 font-normal">(1)</span></h2>
                    <div className="ml-4 border-l-2 border-slate-100 dark:border-[#333] pl-4">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">- Reports <span className="text-slate-400 font-normal">(9)</span></h3>
                      <ul className="ml-2 space-y-2 text-[12px] text-blue-500 dark:text-blue-400">
                        <li><button onClick={() => setSelectedReport('Item Age Composition - Qty')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Age Composition - Qty.</button></li>
                        <li><button onClick={() => setSelectedReport('Inventory - Cost Variance')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Inventory - Cost Variance</button></li>
                        <li><button onClick={() => setSelectedReport('Item Charges - Specification')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Charges - Specification</button></li>
                        <li><button onClick={() => setSelectedReport('Inventory - Inbound Transfer')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Inventory - Inbound Transfer</button></li>
                        <li><button onClick={() => setSelectedReport('Invt. Valuation - Cost Spec')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Invt. Valuation - Cost Spec.</button></li>
                        <li><button onClick={() => setSelectedReport('Item Age Composition - Value')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Age Composition - Value</button></li>
                        <li><button onClick={() => setSelectedReport('Item Register - Value')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Register - Value</button></li>
                        <li><button onClick={() => setSelectedReport('Item Expiration - Quantity')} className="hover:underline hover:text-blue-600 dark:hover:text-blue-300">- Item Expiration - Quantity</button></li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ==================== CONTEXT TAB ==================== */}
        {activeTab === 'Context' && (
          <div className="space-y-6">
             <div className="bg-white dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#333] p-8 rounded-2xl shadow-sm">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Cost Center Pricing Context</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Trailing 12-month analysis of WBS element allocations vs General Spends.</p>
                </div>
                
                <div className="h-[400px] w-full text-xs font-bold">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.byTrend} margin={{top: 20, right: 30, left: -20, bottom: 0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#888'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#888'}} />
                      <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '8px'}} />
                      <Legend verticalAlign="top" height={36}/>
                      <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={4} dot={{strokeWidth: 2, r: 4}} name="Cost Center A (Marketing)" />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" name="WBS Project 401" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        )}

        {/* ==================== COMPLIANCE TAB ==================== */}
        {activeTab === 'Compliance' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Risk Gauge */}
                <div className="bg-white dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#333] p-8 rounded-2xl shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                   <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-red-500"></div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 z-10">Compliance Risk</h3>
                   <div className="h-48 w-full z-10">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={complianceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                           {complianceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                         </Pie>
                         <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '8px'}} />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="absolute flex flex-col items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-4 z-0">
                      <span className="text-3xl font-black text-red-500">1.94%</span>
                   </div>
                </div>

                <div className="col-span-2 bg-white dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#333] p-8 rounded-2xl shadow-sm">
                   <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Noncompliant Payment Terms</h2>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="border-b border-slate-200 dark:border-[#333] text-xs uppercase tracking-wider text-slate-500">
                           <th className="pb-3 px-4">PO Number</th>
                           <th className="pb-3 px-4">Vendor</th>
                           <th className="pb-3 px-4">Org Group</th>
                           <th className="pb-3 px-4">Status</th>
                         </tr>
                       </thead>
                       <tbody className="text-sm">
                         <tr className="border-b border-slate-100 dark:border-[#222] hover:bg-slate-50 dark:hover:bg-[#252525]">
                           <td className="py-3 px-4 font-bold text-blue-500">PO-2026-0091</td>
                           <td className="py-3 px-4 text-slate-800 dark:text-slate-300">Global Tech Solutions</td>
                           <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Electronics</td>
                           <td className="py-3 px-4"><Badge type="danger">Noncompliant</Badge></td>
                         </tr>
                         <tr className="border-b border-slate-100 dark:border-[#222] hover:bg-slate-50 dark:hover:bg-[#252525]">
                           <td className="py-3 px-4 font-bold text-blue-500">PO-2026-0114</td>
                           <td className="py-3 px-4 text-slate-800 dark:text-slate-300">Apex Raw Materials</td>
                           <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Steel</td>
                           <td className="py-3 px-4"><Badge type="danger">Noncompliant</Badge></td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ==================== OFF CONTRACT ==================== */}
        {activeTab === 'Off Contract' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="col-span-1 bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-2xl shadow-lg text-white">
                   <h2 className="text-xl font-bold mb-6">Off-Contract Spend</h2>
                   <div className="h-48 w-full mb-4">
                     <ResponsiveContainer width="100%" height="100%">
                       <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={offContractData}>
                         <RadialBar minAngle={15} background clockWise dataKey="value" />
                         <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" wrapperStyle={{fontSize:'12px', color:'#fff'}} />
                       </RadialBarChart>
                     </ResponsiveContainer>
                   </div>
                   <p className="text-sm text-orange-100 bg-black/20 p-4 rounded-xl leading-relaxed">
                     15% of your total spend is completely off-contract. Negotiating master agreements for these vendors could reduce overall costs by up to 4.2%.
                   </p>
                </div>

                <div className="col-span-2 bg-white dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#333] p-8 rounded-2xl shadow-sm">
                   <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Off Contract Quarters Trend</h2>
                   <div className="h-[300px] w-full text-xs font-bold">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={charts.byQuarter} margin={{top: 20, right: 0, left: -20, bottom: 0}}>
                         <defs>
                           <linearGradient id="colorOff" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
                             <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#888'}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill:'#888'}} />
                         <Tooltip contentStyle={{backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff', borderRadius: '8px'}} />
                         <Area type="monotone" dataKey="CY" stroke="#f59e0b" strokeWidth={3} fill="url(#colorOff)" name="Current Year Off-Contract" />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                </div>

             </div>
          </div>
        )}

      </div>
    </div>
  );
}
