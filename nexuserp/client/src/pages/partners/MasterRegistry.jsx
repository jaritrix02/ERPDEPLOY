import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Search, Download, Filter, Package, 
  Layers, Settings, ShieldCheck, Activity, 
  Archive, FileText, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { PageHeader, StatCard, Spinner, Empty, Badge, SearchableSelect, ExportButton } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/exportUtils';

export default function MasterRegistry() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/items');
      setItems(res.data.data || []);
    } catch (e) { toast.error('Failed to load item master'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, []);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const s = search.toLowerCase();
      const matchesSearch = !s || i.itemCode?.toLowerCase().includes(s) || i.itemName?.toLowerCase().includes(s);
      const matchesType = typeFilter === 'ALL' || i.itemType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, search, typeFilter]);

  const handleExport = () => {
    const headers = [
      { label: 'CODE', key: 'itemCode' },
      { label: 'NAME', key: 'itemName' },
      { label: 'TYPE', key: 'itemType' },
      { label: 'UNIT', key: 'uom' },
      { label: 'HSN', key: 'hsnCode' }
    ];
    exportToCSV(filteredItems, 'Master_Item_Registry', headers);
    toast.success('Item registry exported');
  };

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Item Master Registry" 
        subtitle="Consolidated database of all raw materials, semi-finished goods, and finished products."
        icon={<Database size={24} className="text-blue-600" />}
        actions={<>
          <div className="w-56">
             <SearchableSelect 
               placeholder="Filter Item Type"
               options={[{ label: 'All Item Types', value: 'ALL' }, { label: 'Raw Material', value: 'RAW_MATERIAL' }, { label: 'Finished Good', value: 'FINISHED_GOOD' }, { label: 'Semi-Finished', value: 'SEMI_FINISHED' }]}
               value={typeFilter}
               onChange={v => setTypeFilter(v)}
             />
          </div>
          <ExportButton onClick={handleExport} />
        </>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Items" value={items.length} icon={<Layers size={20}/>} color="blue" />
        <StatCard label="Raw Materials" value={items.filter(i => i.itemType === 'RAW_MATERIAL').length} icon={<ShieldCheck size={20}/>} color="amber" />
        <StatCard label="Finished Products" value={items.filter(i => i.itemType === 'FINISHED_GOOD').length} icon={<Package size={20}/>} color="emerald" />
        <StatCard label="Data Status" value="Optimized" icon={<Activity size={20}/>} color="purple" />
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            placeholder="Search by item code, name, or HSN code..." 
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
                       {['Item Details','Type','UOM / HSN','Specifications','Created On','Actions'].map(h => (
                         <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {filteredItems.length === 0 ? (
                      <tr><td colSpan={6}><Empty /></td></tr>
                    ) : filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-blue-600 tracking-wider">{item.itemCode}</span>
                              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase mt-1">{item.itemName}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant={item.itemType === 'RAW_MATERIAL' ? 'amber' : item.itemType === 'FINISHED_GOOD' ? 'emerald' : 'blue'}>
                              {item.itemType?.replace('_', ' ')}
                           </Badge>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">UOM: {item.uom || 'PCS'}</span>
                              <span className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">HSN: {item.hsnCode || '—'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex gap-2">
                              {item.size && <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{item.size}</div>}
                              {item.color && <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{item.color}</div>}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                           {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'N/A'}
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

