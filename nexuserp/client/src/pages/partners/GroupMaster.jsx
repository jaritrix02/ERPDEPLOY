import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, Search, Plus, Building2, ChevronRight, 
  ChevronDown, MapPin, Phone, Mail, ShieldCheck, 
  Layers, Globe, Activity, ArrowUpRight, GitBranch
} from 'lucide-react';
import { PageHeader, StatCard, Spinner, Empty, Badge, Modal, FormRow, SearchableSelect } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function GroupMaster() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ groupName: '', parentId: '', headOffice: '', email: '', mobile: '' });

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      setGroups(res.data.data || []);
    } catch (e) { toast.error('Failed to load corporate hierarchy'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadGroups(); }, []);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const saveGroup = async () => {
    try {
      await api.post('/groups', form);
      toast.success('Group record saved successfully');
      setModal(false);
      loadGroups();
    } catch (e) { toast.error('Error saving group record'); }
  };

  const renderGroup = (group, depth = 0) => {
    const isExpanded = expanded[group.id];
    const hasChildren = group.children && group.children.length > 0;

    return (
      <div key={group.id} className="space-y-4">
        <div 
          className={`card p-6 flex items-center gap-6 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow ${depth > 0 ? 'ml-12' : ''}`}
        >
           <button onClick={() => hasChildren && toggleExpand(group.id)} className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 transition-all ${isExpanded ? 'rotate-90' : ''}`}>
              {hasChildren ? <ChevronRight size={14}/> : <div className="w-[14px] h-[14px] rounded-full border-2 border-gray-200 dark:border-gray-700" />}
           </button>
           <div className={`w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm`}>
              <Building2 size={20} />
           </div>
           <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight leading-none">{group.groupName}</h3>
              <p className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-2"><MapPin size={12}/> {group.headOffice || 'No address provided'}</p>
           </div>
           <div className="hidden lg:flex items-center gap-10">
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sub-Branches</span>
                 <span className="text-xs font-bold text-gray-900 dark:text-white">{group.children?.length || 0} Nodes</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Email</span>
                 <span className="text-xs font-bold text-gray-900 dark:text-white">{group.email || 'N/A'}</span>
              </div>
           </div>
           <button className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600 transition-colors"><ArrowUpRight size={14}/></button>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="space-y-4 border-l border-gray-200 dark:border-gray-700 ml-6 pl-4">
             {group.children.map(child => renderGroup(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Corporate Hierarchy" 
        subtitle="Manage conglomerate structures, holding groups, and subsidiary branches."
        icon={<Network size={24} className="text-blue-600" />}
        actions={<>
          <button className="btn-primary" onClick={() => { setForm({ groupName: '', parentId: '', headOffice: '', email: '', mobile: '' }); setModal(true); }}>
            <Plus size={16} /> Add Group/Branch
          </button>
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Parent Groups" value={groups.length} icon={<Building2 size={20}/>} color="blue" />
        <StatCard label="Total Branches" value="14" icon={<GitBranch size={20}/>} color="emerald" />
        <StatCard label="Regional Hubs" value="06" icon={<Globe size={20}/>} color="amber" />
        <StatCard label="Active Nodes" value="20" icon={<Activity size={20}/>} color="purple" />
      </div>

      <div className="space-y-4">
         {loading ? <Spinner size="lg" /> : (
            <div className="space-y-4">
               {groups.length === 0 ? <Empty /> : groups.map(group => renderGroup(group))}
            </div>
         )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Corporate Node" size="lg">
         <div className="space-y-6 py-4">
            <FormRow cols={2}>
               <div><label className="label">Group/Branch Name *</label><input className="input-field" value={form.groupName} onChange={e => setForm({...form, groupName: e.target.value.toUpperCase()})} /></div>
               <SearchableSelect label="Parent Entity" options={[{ label: 'Root (No Parent)', value: '' }, ...groups.map(g => ({ label: g.groupName, value: g.id }))]} value={form.parentId} onChange={v => setForm({...form, parentId: v})} />
            </FormRow>
            <FormRow cols={2}>
               <div><label className="label">Contact Email</label><input className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
               <div><label className="label">Phone Number</label><input className="input-field" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} /></div>
            </FormRow>
            <div><label className="label">Registered Address</label><textarea className="input-field" rows={3} value={form.headOffice} onChange={e => setForm({...form, headOffice: e.target.value.toUpperCase()})} /></div>
            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
               <button className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setModal(false)}>Cancel</button>
               <button className="btn-primary" onClick={saveGroup}>Save Group Node</button>
            </div>
         </div>
      </Modal>
    </div>
  );
}

