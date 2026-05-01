import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Truck, Search, Download, Filter, Building2, 
  ArrowUpRight, ArrowDownRight, Activity, ShieldCheck, 
  Globe, Briefcase, UserCircle2
} from 'lucide-react';
import { PageHeader, StatCard, Spinner, Empty, Badge, SearchableSelect, ExportButton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/exportUtils';

export default function PartnerConsolidated() {
  const [data, setData] = useState({ vendors: [], customers: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [v, c] = await Promise.all([api.get('/vendors'), api.get('/customers')]);
      setData({ vendors: v.data.data || [], customers: c.data.data || [] });
    } catch (e) { toast.error('Failed to sync consolidated data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const allPartners = useMemo(() => {
    const list = [
      ...data.vendors.map(v => ({ ...v, partnerRole: 'VENDOR', icon: <Truck size={14}/>, color: 'blue' })),
      ...data.customers.map(c => ({ ...c, partnerRole: 'CUSTOMER', icon: <Users size={14}/>, color: 'indigo' }))
    ];
    return list.filter(p => {
      const s = search.toLowerCase();
      const matchesSearch = !s || p.companyName?.toLowerCase().includes(s) || p.contactPerson?.toLowerCase().includes(s);
      const matchesRole = roleFilter === 'ALL' || p.partnerRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [data, search, roleFilter]);

  const handleExport = () => {
    const headers = [
      { label: 'ROLE', key: 'partnerRole' },
      { label: 'COMPANY', key: 'companyName' },
      { label: 'CONTACT', key: 'contactPerson' },
      { label: 'GST', key: 'gstNo' }
    ];
    exportToCSV(allPartners, 'Unified_Partner_Directory', headers);
    toast.success('Partner directory exported');
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Unified Partner Directory" 
        subtitle="A consolidated view of all suppliers, vendors, and customers in the enterprise network."
        icon={<Globe size={24} className="text-blue-600" />}
        actions={<>
          <div className="w-56">
             <SearchableSelect 
               placeholder="Filter by Role"
               options={[{ label: 'All Partners', value: 'ALL' }, { label: 'Vendors Only', value: 'VENDOR' }, { label: 'Customers Only', value: 'CUSTOMER' }]}
               value={roleFilter}
               onChange={v => setRoleFilter(v)}
             />
          </div>
          <ExportButton onClick={handleExport} />
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Partners" value={allPartners.length} icon={<Globe size={20}/>} color="blue" />
        <StatCard label="Active Vendors" value={data.vendors.length} icon={<Truck size={20}/>} color="amber" />
        <StatCard label="Active Customers" value={data.customers.length} icon={<Users size={20}/>} color="indigo" />
        <StatCard label="Network Coverage" value="Active" icon={<ShieldCheck size={20}/>} color="emerald" />
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            placeholder="Search across all vendors and customers..." 
            className="input-field pl-12"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full">
                 <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                       {['Company Name','Partner Role','Contact Person','GST Number','Status','Actions'].map(h => (
                         <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {allPartners.length === 0 ? (
                      <tr><td colSpan={6}><Empty /></td></tr>
                    ) : allPartners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600`}>{partner.icon}</div>
                              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{partner.companyName}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant={partner.partnerRole === 'VENDOR' ? 'amber' : 'indigo'}>{partner.partnerRole}</Badge>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{partner.contactPerson}</td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-900 dark:text-white">{partner.gstNo || 'Not Registered'}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Verified
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600 transition-colors"><ArrowUpRight size={14}/></button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
}

