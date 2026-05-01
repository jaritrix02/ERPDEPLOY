import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Search, Plus, Filter, Download, MoreHorizontal, 
  MapPin, Phone, Mail, Globe, ShieldCheck, Clock, 
  ChevronRight, ArrowUpRight, Building2, UserCircle2, ClipboardList, Activity, Package
} from 'lucide-react';
import { PageHeader, StatCard, SearchableSelect, Spinner, Empty, Badge, Modal, FormRow, ExportButton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/exportUtils';

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactPerson: '', email: '', mobile: '', address: '', category: 'RAW MATERIAL', gstNo: '' });

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data || []);
    } catch (e) { toast.error('Failed to load vendors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadVendors(); }, []);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const s = search.toLowerCase();
      const matchesSearch = !s || v.companyName?.toLowerCase().includes(s) || v.contactPerson?.toLowerCase().includes(s) || v.email?.toLowerCase().includes(s);
      const matchesCat = categoryFilter === 'ALL' || v.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [vendors, search, categoryFilter]);

  const handleExport = () => {
    const headers = [
      { label: 'COMPANY', key: 'companyName' },
      { label: 'CONTACT', key: 'contactPerson' },
      { label: 'EMAIL', key: 'email' },
      { label: 'MOBILE', key: 'mobile' },
      { label: 'GST', key: 'gstNo' },
      { label: 'CATEGORY', key: 'category' }
    ];
    exportToCSV(filteredVendors, 'Vendors_Registry', headers);
    toast.success('Vendors exported successfully');
  };

  const saveVendor = async () => {
    try {
      await api.post('/vendors', form);
      toast.success('Vendor registered successfully');
      setModal(false);
      loadVendors();
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving vendor'); }
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Vendor Directory" 
        subtitle="Manage and track your supply chain partners and raw material providers."
        icon={<Truck size={24} className="text-blue-600" />}
        actions={<>
          <div className="w-56">
             <SearchableSelect 
               placeholder="Filter Category"
               options={[{ label: 'All Categories', value: 'ALL' }, { label: 'Raw Material', value: 'RAW MATERIAL' }, { label: 'Consumables', value: 'CONSUMABLES' }, { label: 'Services', value: 'SERVICES' }]}
               value={categoryFilter}
               onChange={v => setCategoryFilter(v)}
             />
          </div>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setForm({ companyName: '', contactPerson: '', email: '', mobile: '', address: '', category: 'RAW MATERIAL', gstNo: '' }); setModal(true); }}>
            <Plus size={16} /> Add Vendor
          </button>
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Vendors" value={vendors.length} icon={<Building2 size={20}/>} color="blue" />
        <StatCard label="Raw Material" value={vendors.filter(v => v.category === 'RAW MATERIAL').length} icon={<ShieldCheck size={20}/>} color="emerald" />
        <StatCard label="Consumables" value={vendors.filter(v => v.category === 'CONSUMABLES').length} icon={<Package size={20}/>} color="amber" />
        <StatCard label="Services" value={vendors.filter(v => v.category === 'SERVICES').length} icon={<Activity size={20}/>} color="purple" />
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
          {filteredVendors.length === 0 ? (
            <div className="col-span-full"><Empty /></div>
          ) : filteredVendors.map((vendor) => (
            <div 
              key={vendor.id}
              className="card p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <Building2 size={20} />
                 </div>
                 <Badge variant={vendor.category === 'RAW MATERIAL' ? 'emerald' : 'blue'}>{vendor.category}</Badge>
              </div>
              <div className="mb-4">
                 <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-tight">{vendor.companyName}</h3>
                 <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-2"><UserCircle2 size={12}/> {vendor.contactPerson}</p>
              </div>
              <div className="space-y-2 py-4 border-y border-gray-100 dark:border-gray-700">
                 <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-medium"><Mail size={12} className="text-blue-500"/> {vendor.email}</div>
                 <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-medium"><Phone size={12} className="text-blue-500"/> {vendor.mobile}</div>
                 <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 font-medium"><MapPin size={12} className="text-blue-500"/> {vendor.address}</div>
              </div>
              <div className="flex justify-between items-center mt-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GST Number</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{vendor.gstNo || 'Not Registered'}</span>
                 </div>
                 <button className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white transition-colors"><ChevronRight size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Vendor Registration" size="lg">
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
               <SearchableSelect label="Vendor Category" options={[{ label: 'Raw Material', value: 'RAW MATERIAL' }, { label: 'Consumables', value: 'CONSUMABLES' }, { label: 'Services', value: 'SERVICES' }]} value={form.category} onChange={v => setForm({...form, category: v})} />
               <div><label className="label">GST Number</label><input className="input-field font-bold uppercase" value={form.gstNo} onChange={e => setForm({...form, gstNo: e.target.value.toUpperCase()})} /></div>
            </FormRow>
            <div><label className="label">Office Address</label><textarea className="input-field" rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value.toUpperCase()})} /></div>
            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
               <button className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setModal(false)}>Cancel</button>
               <button className="btn-primary" onClick={saveVendor}>Register Vendor</button>
            </div>
         </div>
      </Modal>
    </div>
  );
}
