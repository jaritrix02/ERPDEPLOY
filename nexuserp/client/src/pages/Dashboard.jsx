import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { 
  Users, ShoppingCart, Package, Shield, Factory, 
  Calendar, Filter, ChevronRight, Eye, ClipboardList, Activity, LayoutDashboard, Star, TrendingUp, ShieldCheck, Zap, DollarSign, Clock, UserPlus, XCircle, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Globe, Layers, Download, RefreshCw, Box, Terminal, Monitor, Cpu, Search, Maximize2, History
} from 'lucide-react';
import { Spinner, StatCard } from "../components/ui";
import api from "../services/api";

const DASHBOARDS = [
  { id: 'executive', label: 'Executive Overview', icon: <Activity size={14}/>, roles: ['ADMIN'], color: 'blue' },
  { id: 'hr', label: 'Human Resources', icon: <Users size={14}/>, roles: ['ADMIN', 'HR', 'HOD'], color: 'indigo' },
  { id: 'purchase', label: 'Procurement', icon: <ShoppingCart size={14}/>, roles: ['ADMIN', 'PURCHASE', 'HOD'], color: 'amber' },
  { id: 'sales', label: 'Sales & Revenue', icon: <TrendingUp size={14}/>, roles: ['ADMIN', 'SALES', 'HOD'], color: 'emerald' },
  { id: 'inventory', label: 'Inventory Control', icon: <Package size={14}/>, roles: ['ADMIN', 'STORE', 'HOD'], color: 'cyan' },
  { id: 'qc', label: 'Quality Control', icon: <Star size={14}/>, roles: ['ADMIN', 'QC', 'HOD'], color: 'rose' },
]

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('executive');
  const [viewMode, setViewMode] = useState('single'); 
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    if (user?.role !== 'ADMIN') {
      const defaultDash = DASHBOARDS.find(d => d.roles.includes(user?.role));
      if (defaultDash) setActiveTab(defaultDash.id);
    }
    return () => clearTimeout(timer);
  }, [user]);

  const filteredDashboards = useMemo(() => {
    const roleAllowed = user?.role === 'ADMIN' ? DASHBOARDS : DASHBOARDS.filter(d => d.roles.includes(user?.role));
    if (!search) return roleAllowed;
    return roleAllowed.filter(d => d.label.toLowerCase().includes(search.toLowerCase()));
  }, [user, search]);

  const renderDashboardContent = (id) => {
    switch (id) {
      case 'hr': return <HRDashboard />;
      case 'purchase': return <PurchaseDashboard />;
      case 'sales': return <SalesDashboard />;
      case 'inventory': return <InventoryDashboard />;
      case 'qc': return <QCDashboard />;
      default: return <ExecutiveDashboard />;
    }
  }

  if (loading) return <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 pb-10 overflow-y-auto custom-scrollbar h-full pr-2">
      {/* Dashboard Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {viewMode === 'matrix' ? 'Operational Matrix' : DASHBOARDS.find(d => d.id === activeTab)?.label}
          </h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
            System Online • Logged in as {user?.role}
          </p>
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
           {/* Dashboard Search */}
           <div className="relative flex-1 xl:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search modules..." 
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>

           {user?.role === 'ADMIN' && (
              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                 <button onClick={() => setViewMode('single')} className={`p-2 rounded-md transition-colors ${viewMode === 'single' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Single View"><Monitor size={16}/></button>
                 <button onClick={() => setViewMode('matrix')} className={`p-2 rounded-md transition-colors ${viewMode === 'matrix' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Matrix View"><Cpu size={16}/></button>
              </div>
           )}

           {viewMode === 'single' && (
             <div className="hidden lg:flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
               {filteredDashboards.map(dash => (
                 <button
                   key={dash.id}
                   onClick={() => setActiveTab(dash.id)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === dash.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                 >
                   {dash.icon}
                   <span>{dash.label.split(' ')[0]}</span>
                 </button>
               ))}
             </div>
           )}
        </div>
      </div>

      <div className="min-h-[400px]">
        {viewMode === 'matrix' ? (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredDashboards.map((dash) => (
                 <div 
                    key={dash.id}
                    className="card relative overflow-hidden group cursor-pointer border border-gray-200 dark:border-gray-700"
                    onClick={() => { setActiveTab(dash.id); setViewMode('single'); }}
                 >
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                       <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"><div className="text-blue-600">{dash.icon}</div> {dash.label}</h3>
                       <Maximize2 size={12} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="p-6 scale-[0.75] origin-top h-[320px] overflow-hidden pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                       {renderDashboardContent(dash.id)}
                    </div>
                 </div>
              ))}
           </div>
        ) : (
           <div key={activeTab}>
             {renderDashboardContent(activeTab)}
           </div>
        )}
      </div>
    </div>
  );
}

// --- Dashboard Sub-Components ---

function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.data);
      } catch (e) { console.error('Dashboard error'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <Spinner size="md" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Employees" value={data?.totalEmployees || '0'} icon={<Users size={20}/>} color="blue" />
        <StatCard label="Pending Indents" value={data?.pendingIndents || '0'} icon={<ClipboardList size={20}/>} color="orange" />
        <StatCard label="Open POs" value={data?.pendingPOs || '0'} icon={<ShoppingCart size={20}/>} color="purple" />
        <StatCard label="QC Failures" value={data?.criticalQCFailures || '0'} icon={<AlertTriangle size={20}/>} color="rose" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-6 h-[450px]">
          <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                 <TrendingUp size={16} className="text-blue-600"/>
                 Enterprise Activity
              </h3>
              <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"><RefreshCw size={14}/></button>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={[{n:'Jan', v:4000}, {n:'Feb', v:6200}, {n:'Mar', v:8800}, {n:'Apr', v:7500}, {n:'May', v:9900}]}>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="v" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6 h-[450px] flex flex-col justify-between">
           <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">Resource Allocation</p>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'Employees', A: data?.totalEmployees || 0, fullMark: 150 },
                    { subject: 'Indents', A: data?.pendingIndents || 0, fullMark: 150 },
                    { subject: 'PO', A: data?.pendingPOs || 0, fullMark: 150 },
                    { subject: 'Products', A: data?.totalProducts || 0, fullMark: 150 },
                    { subject: 'QC Fail', A: data?.criticalQCFailures || 0, fullMark: 150 },
                  ]}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 600 }} />
                    <Radar name="Activity" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
           </div>
           <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                 <span className="text-gray-500">System Status</span>
                 <span className="text-emerald-600">Stable</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                 <div className="h-full bg-blue-600 w-[95%]" />
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

function HRDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Total Force" value="1,248" icon={<Users size={20}/>} color="blue" />
        <StatCard label="Retention" value="98.2%" icon={<ShieldCheck size={20}/>} color="green" />
        <StatCard label="Open Positions" value="15" icon={<UserPlus size={20}/>} color="orange" />
        <StatCard label="Payroll" value="₹ 4.2 Cr" icon={<DollarSign size={20}/>} color="purple" />
      </div>
      <div className="card p-12 text-center bg-blue-600 text-white rounded-xl shadow-sm">
        <Users size={48} className="mx-auto mb-6 opacity-80" />
        <h2 className="text-3xl font-bold mb-2">Workforce Management</h2>
        <p className="text-blue-100 text-sm max-w-xl mx-auto leading-relaxed">Centralized employee records, payroll integration, and performance tracking optimized for Nucork industrial operations.</p>
      </div>
    </div>
  )
}

function PurchaseDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/dashboard/purchase');
        setData(res.data.data);
      } catch (e) { console.error('Purchase error'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <Spinner size="md" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Yearly PO" value={`₹ ${data?.overview?.currentYearTotal?.toFixed(2)}M`} icon={<ShoppingCart size={20}/>} color="blue" />
        <StatCard label="Previous Year" value={`₹ ${data?.overview?.previousYearTotal?.toFixed(2)}M`} icon={<History size={20}/>} color="orange" />
        <StatCard label="Variance" value={`${data?.overview?.variance?.toFixed(1)}%`} icon={<Activity size={20}/>} color={data?.overview?.variance > 0 ? "green" : "rose"} />
        <StatCard label="Suppliers" value={data?.charts?.topSuppliers?.length || '0'} icon={<Globe size={20}/>} color="purple" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         <div className="card p-6 h-[400px]">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8 flex items-center gap-2"><Layers size={14} className="text-blue-600"/> Expenditures By Group</h3>
            <ResponsiveContainer width="100%" height="75%">
               <BarChart data={data?.charts?.topMaterialGroups || []}>
                  <XAxis dataKey="name" hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
               </BarChart>
            </ResponsiveContainer>
         </div>
         <div className="card p-8 bg-gray-900 text-white flex flex-col items-center justify-center text-center">
            <ShoppingCart size={64} className="text-blue-500 mb-6 opacity-60" />
            <h3 className="text-2xl font-bold">Procurement Control</h3>
            <p className="text-gray-400 text-xs mt-3 max-w-xs leading-relaxed">Systematic monitoring of supplier performance and material procurement cycles for manufacturing stability.</p>
         </div>
      </div>
    </div>
  )
}

function SalesDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/dashboard/sales');
        setData(res.data.data);
      } catch (e) { console.error('Sales error'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <Spinner size="md" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value={`₹ ${data?.metrics?.totalValue?.toLocaleString()}`} icon={<TrendingUp size={20}/>} color="blue" />
        <StatCard label="Avg Order Val" value={`₹ ${data?.metrics?.avgOrderValue?.toLocaleString()}`} icon={<DollarSign size={20}/>} color="emerald" />
        <StatCard label="Total Orders" value={data?.metrics?.totalOrders || '0'} icon={<ShoppingCart size={20}/>} color="orange" />
        <StatCard label="Market Share" value="+8.4%" icon={<Zap size={20}/>} color="purple" />
      </div>
      <div className="card p-10 bg-emerald-600 text-white flex flex-col md:flex-row items-center gap-10 rounded-xl">
         <div className="p-8 bg-white/10 rounded-xl border border-white/20"><TrendingUp size={48} className="text-white" /></div>
         <div className="flex-1 text-center md:text-left space-y-2">
            <h3 className="text-3xl font-bold">Sales & Distribution</h3>
            <p className="text-emerald-100 text-sm tracking-wide">Monitoring {data?.metrics?.totalOrders} active sales channels and revenue trajectories.</p>
         </div>
      </div>
    </div>
  )
}

function InventoryDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Total SKUs" value="4,850" icon={<Package size={20}/>} color="blue" />
        <StatCard label="Restock Alerts" value="15" icon={<Zap size={20}/>} color="rose" />
        <StatCard label="Occupancy" value="78.2%" icon={<Factory size={20}/>} color="green" />
        <StatCard label="Turnover" value="4.2x" icon={<Activity size={20}/>} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="card p-8 bg-gray-900 text-white flex flex-col justify-between h-[400px]">
            <div className="flex justify-between items-start">
               <div className="p-3 bg-blue-600 rounded-lg"><Box size={24}/></div>
               <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Inventory Status</span>
            </div>
            <div className="space-y-4">
               <div className="flex items-baseline gap-3">
                  <h3 className="text-5xl font-bold">78%</h3>
                  <p className="text-xs font-bold text-blue-500 uppercase">Capacity Used</p>
               </div>
               <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-blue-600 w-[78%]" />
               </div>
            </div>
         </div>
         <div className="lg:col-span-2 card p-6 h-[400px]">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-10 flex items-center gap-2"><Activity size={14} className="text-blue-600"/> Stock Velocity</h3>
            <ResponsiveContainer width="100%" height="75%">
               <LineChart data={[{n:'W1', v:42}, {n:'W2', v:58}, {n:'W3', v:52}, {n:'W4', v:78}, {n:'W5', v:72}, {n:'W6', v:94}]}>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Line type="stepAfter" dataKey="v" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
               </LineChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  )
}

function QCDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Quality Index" value="98.5%" icon={<CheckCircle2 size={20}/>} color="green" />
        <StatCard label="Variance" value="1.5%" icon={<XCircle size={20}/>} color="rose" />
        <StatCard label="Tests Pending" value="24" icon={<Clock size={20}/>} color="orange" />
        <StatCard label="Status" value="Online" icon={<ShieldCheck size={20}/>} color="blue" />
      </div>
      <div className="card p-12 text-center bg-gray-900 text-white border-b-8 border-emerald-600 rounded-xl">
         <ShieldCheck size={64} className="mx-auto text-emerald-500 mb-6 opacity-80" />
         <h2 className="text-3xl font-bold mb-4">Quality Management System</h2>
         <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">Monitoring product conformance and parameter variances across all Nucork manufacturing units.</p>
      </div>
    </div>
  )
}

