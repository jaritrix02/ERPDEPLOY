import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Search, Plus, MapPin, Phone, Mail, 
  ShieldCheck, Clock, Activity, ArrowUpRight, 
  Building2, Navigation, ClipboardCheck, Box
} from 'lucide-react';
import { PageHeader, StatCard, Spinner, Empty, Badge, Modal, FormRow, SearchableSelect, ExportButton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/exportUtils';

export default function TransportersMaster() {
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ transporterName: '', contactPerson: '', email: '', mobile: '', address: '', vehicleCount: '', registrationNo: '' });

  const loadTransporters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transporters');
      setTransporters(res.data.data || []);
    } catch (e) { toast.error('Failed to load transporter data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTransporters(); }, []);

  const filteredTransporters = useMemo(() => {
    return transporters.filter(t => {
      const s = search.toLowerCase();
      return !s || t.transporterName?.toLowerCase().includes(s) || t.contactPerson?.toLowerCase().includes(s);
    });
  }, [transporters, search]);

  const handleExport = () => {
    const headers = [
      { label: 'TRANSPORTER', key: 'transporterName' },
      { label: 'CONTACT', key: 'contactPerson' },
      { label: 'REGISTRATION', key: 'registrationNo' },
      { label: 'MOBILE', key: 'mobile' }
    ];
    exportToCSV(filteredTransporters, 'Transporters_Directory', headers);
    toast.success('Transporters exported successfully');
  };

  const saveTransporter = async () => {
    try {
      await api.post('/transporters', form);
      toast.success('Transporter record saved');
      setModal(false);
      loadTransporters();
    } catch (e) { toast.error('Error saving transporter record'); }
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Logistics & Transporters" 
        subtitle="Manage authorized logistical partners and freight carriers for material movement."
        icon={<Truck size={24} className="text-blue-600" />}
        actions={<>
          <ExportButton onClick={handleExport} />
          <button className="btn-primary" onClick={() => { setForm({ transporterName: '', contactPerson: '', email: '', mobile: '', address: '', vehicleCount: '', registrationNo: '' }); setModal(true); }}>
            <Plus size={16} /> Add Transporter
          </button>
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Transporters" value={transporters.length} icon={<Truck size={20}/>} color="blue" />
        <StatCard label="Fleet Units" value="120+" icon={<Box size={20}/>} color="emerald" />
        <StatCard label="Tracking" value="Real-time" icon={<Navigation size={20}/>} color="amber" />
        <StatCard label="Compliance" value="Verified" icon={<ShieldCheck size={20}/>} color="purple" />
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            placeholder="Search by company name, contact person, or registration number..." 
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
                       {['Transporter Name','Registration / Fleet','Contact Info','Service Hub','Status','Actions'].map(h => (
                         <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {filteredTransporters.length === 0 ? (
                      <tr><td colSpan={6}><Empty /></td></tr>
                    ) : filteredTransporters.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t.transporterName}</span>
                              <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">ID: {t.id?.slice(0,8)}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-blue-600 tracking-wider">{t.registrationNo || 'PENDING'}</span>
                              <span className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wide">{t.vehicleCount || '0'} ACTIVE UNITS</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">{t.contactPerson}</span>
                              <span className="text-[10px] font-medium text-gray-400 mt-1">{t.mobile}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate max-w-[200px]">
                           {t.address || 'Global Dispatch'}
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant="emerald">AUTHORIZED</Badge>
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

      <Modal open={modal} onClose={() => setModal(false)} title="Add Logistical Partner" size="lg">
         <div className="space-y-6 py-4">
            <FormRow cols={2}>
               <div><label className="label">Company Name *</label><input className="input-field" value={form.transporterName} onChange={e => setForm({...form, transporterName: e.target.value.toUpperCase()})} /></div>
               <div><label className="label">Registration Number</label><input className="input-field font-bold uppercase" value={form.registrationNo} onChange={e => setForm({...form, registrationNo: e.target.value.toUpperCase()})} /></div>
            </FormRow>
            <FormRow cols={2}>
               <div><label className="label">Contact Person *</label><input className="input-field" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value.toUpperCase()})} /></div>
               <div><label className="label">Mobile Number</label><input className="input-field" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} /></div>
            </FormRow>
            <FormRow cols={2}>
               <div><label className="label">Email Address</label><input className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
               <div><label className="label">Active Fleet Units</label><input type="number" className="input-field" value={form.vehicleCount} onChange={e => setForm({...form, vehicleCount: e.target.value})} /></div>
            </FormRow>
            <div><label className="label">Office Address</label><textarea className="input-field" rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value.toUpperCase()})} /></div>
            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
               <button className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setModal(false)}>Cancel</button>
               <button className="btn-primary" onClick={saveTransporter}>Save Transporter</button>
            </div>
         </div>
      </Modal>
    </div>
  );
}

