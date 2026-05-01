import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Plus, Filter, Download, MoreHorizontal, 
  MapPin, Phone, Mail, Globe, ShieldCheck, Clock, 
  ChevronRight, ArrowUpRight, Building2, UserCircle2, ClipboardList, TrendingUp, CreditCard
} from 'lucide-react';
import { PageHeader, StatCard, SearchableSelect, Spinner, Empty, Badge, Modal, FormRow, ExportButton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/exportUtils';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactPerson: '', email: '', mobile: '', address: '', type: 'DOMESTIC', gstNo: '' });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data || []);
    } catch (e) { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCustomers(); }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const s = search.toLowerCase();
      const matchesSearch = !s || c.companyName?.toLowerCase().includes(s) || c.contactPerson?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s);
      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [customers, search, typeFilter]);

  const handleExport = () => {
    const headers = [
      { label: 'COMPANY', key: 'companyName' },
      { label: 'CONTACT', key: 'contactPerson' },
      { label: 'EMAIL', key: 'email' },
      { label: 'MOBILE', key: 'mobile' },
      { label: 'GST', key: 'gstNo' },
      { label: 'TYPE', key: 'type' }
    ];
    exportToCSV(filteredCustomers, 'Customers_Directory', headers);
    toast.success('Customers exported successfully');
  };

  const saveCustomer = async () => {
    try {
      await api.post('/customers', form);
      toast.success('Customer registered successfully');
      setModal(false);
      loadCustomers();
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving customer'); }
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Customer Directory" 
        subtitle="Manage your revenue partners, distributors, and direct clients."
        icon={<Users size={24} className="text-blue-600" />}
        actions={<>
          <div className="w-56">
             <SearchableSelect 
               placeholder="Filter Region"
               options={[{ label: 'All Regions', value: 'ALL' }, { label: 'Domestic', value: 'DOMESTIC' }, { label: 'Export', value: 'EXPORT' }]}
               value={typeFilter}
               onChange={v => setTypeFilter(v)}
             />
          </div>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setForm({ companyName: '', contactPerson: '', email: '', mobile: '', address: '', type: 'DOMESTIC', gstNo: '' }); setModal(true); }}>
            <Plus size={16} /> Add Customer
          </button>
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Customers" value={customers.length} icon={<Building2 size={20}/>} color="blue" />
        <StatCard label="Domestic" value={customers.filter(c => c.type === 'DOMESTIC').length} icon={<TrendingUp size={20}/>} color="emerald" />
        <StatCard label="Export" value={customers.filter(c => c.type === 'EXPORT').length} icon={<Globe size={20}/>} color="purple" />
        <StatCard label="Active Accounts" value={customers.length} icon={<ShieldCheck size={20}/>} color="amber" />
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            placeholder="Search by company name, contact person, or email..." 
            className="input-field pl-12"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full"><Empty /></div>
          ) : filteredCustomers.map((customer) => (
            <div 
              key={customer.id}
              className="card p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                    <Users size={20} />
                 </div>
                 <Badge variant={customer.type === 'EXPORT' ? 'purple' : 'blue'}>{customer.type}</Badge>
              </div>
              <div className="mb-4">
                 <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-tight">{customer.companyName}</h3>
                 <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-2"><UserCircle2 size={12}/> {customer.contactPerson}</p>
              </div>
              <div className="space-y-2 py-4 border-y border-gray-100 dark:border-gray-700">
                 <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-medium"><Mail size={12} className="text-indigo-500"/> {customer.email}</div>
                 <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-medium"><Phone size={12} className="text-indigo-500"/> {customer.mobile}</div>
                 <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-medium"><MapPin size={12} className="text-indigo-500"/> {customer.address}</div>
              </div>
              <div className="flex justify-between items-center mt-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GST Number</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{customer.gstNo || 'Not Registered'}</span>
                 </div>
                 <button className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-indigo-600 hover:text-white transition-colors"><ChevronRight size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Customer Registration" size="lg">
         <div className="space-y-6 py-4">
            <FormRow cols={2}>
               <div><label className="label">Company Name *</label><input className="input-field" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value.toUpperCase()})} /></div>
               <div><label className="label">Contact Person *</label><input className="input-field" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value.toUpperCase()})} /></div>
            </FormRow>
            <FormRow cols={2}>
               <div><label className="label">Email Address</label><input className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
               <div><label className="label">Mobile Number</label><input className="input-field" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} /></div>
            </FormRow>
            <FormRow cols={2}>
               <SearchableSelect label="Customer Type" options={[{ label: 'Domestic', value: 'DOMESTIC' }, { label: 'Export', value: 'EXPORT' }]} value={form.type} onChange={v => setForm({...form, type: v})} />
               <div><label className="label">GST Number</label><input className="input-field font-bold uppercase" value={form.gstNo} onChange={e => setForm({...form, gstNo: e.target.value.toUpperCase()})} /></div>
            </FormRow>
            <div><label className="label">Billing Address</label><textarea className="input-field" rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value.toUpperCase()})} /></div>
            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
               <button className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setModal(false)}>Cancel</button>
               <button className="btn-primary" onClick={saveCustomer}>Register Customer</button>
            </div>
         </div>
      </Modal>
    </div>
  );
}

