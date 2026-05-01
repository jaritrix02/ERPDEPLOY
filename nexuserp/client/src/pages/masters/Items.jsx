import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Boxes,
  Database,
  Edit3,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  Badge,
  Empty,
  ExportButton,
  FormRow,
  Modal,
  PageHeader,
  SearchableSelect,
  Spinner,
  StatCard,
} from '../../components/ui'
import { exportToCSV } from '../../utils/exportUtils'

const blankForm = {
  itemCode: '',
  itemName: '',
  itemType: 'RAW_MATERIAL',
  unitId: '',
  gstId: '',
  minStockLevel: 0,
  description: '',
}

const typeOptions = [
  { label: 'Raw Material', value: 'RAW_MATERIAL' },
  { label: 'Semi Finished', value: 'SEMI_FINISHED' },
  { label: 'Finished Goods', value: 'FINISHED' },
  { label: 'Consumable', value: 'CONSUMABLE' },
]

export default function Items() {
  const [items, setItems] = useState([])
  const [units, setUnits] = useState([])
  const [gstRates, setGstRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const load = async () => {
    setLoading(true)
    try {
      const [itemRes, unitRes, gstRes] = await Promise.all([
        api.get('/items'),
        api.get('/units'),
        api.get('/gst'),
      ])
      setItems(itemRes.data.data || [])
      setUnits(unitRes.data.data || [])
      setGstRates(gstRes.data.data || [])
    } catch (e) {
      toast.error('Failed to load item master')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const typeCounts = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.itemType] = (acc[item.itemType] || 0) + 1
      return acc
    }, {})
  }, [items])

  const filteredItems = useMemo(() => {
    const s = search.toLowerCase()
    return items.filter(item => {
      const matchesSearch = !s ||
        item.itemCode?.toLowerCase().includes(s) ||
        item.itemName?.toLowerCase().includes(s) ||
        item.itemType?.toLowerCase().includes(s)
      const matchesType = typeFilter === 'ALL' || item.itemType === typeFilter
      return matchesSearch && matchesType
    })
  }, [items, search, typeFilter])

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...blankForm, unitId: units[0]?.id || '' })
    setModal(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm({
      itemCode: item.itemCode || '',
      itemName: item.itemName || '',
      itemType: item.itemType || 'RAW_MATERIAL',
      unitId: item.unitId || '',
      gstId: item.gstId || '',
      minStockLevel: item.minStockLevel || 0,
      description: item.description || '',
    })
    setModal(true)
  }

  const save = async () => {
    const tid = toast.loading('Saving item data...')
    try {
      if (!form.itemName || !form.itemType || !form.unitId) {
        toast.error('Item name, type, and unit are required', { id: tid })
        return
      }
      const payload = {
        ...form,
        itemCode: form.itemCode || undefined,
        gstId: form.gstId || null,
        minStockLevel: Number(form.minStockLevel || 0),
      }
      if (editingId) await api.put(`/items/${editingId}`, payload)
      else await api.post('/items', payload)
      toast.success('Item saved successfully', { id: tid })
      setModal(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save item', { id: tid })
    }
  }

  const remove = async (item) => {
    if (!confirm(`Delete ${item.itemName}?`)) return
    try {
      await api.delete(`/items/${item.id}`)
      toast.success('Item deleted')
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to delete item')
    }
  }

  const handleExport = () => {
    exportToCSV(filteredItems, 'Item_Master_Registry', [
      { label: 'ITEM CODE', key: 'itemCode' },
      { label: 'ITEM NAME', key: 'itemName' },
      { label: 'TYPE', key: 'itemType' },
      { label: 'UNIT', key: 'unit.unitCode' },
      { label: 'GST RATE', key: 'gst.rate' },
      { label: 'MIN STOCK', key: 'minStockLevel' },
    ])
    toast.success('Items exported successfully')
  }

  return (
    <div className="space-y-8 pb-20 h-full overflow-y-auto custom-scrollbar">
      <PageHeader
        title="Item Master"
        subtitle="Repository for item codes, specifications, and stock thresholds."
        icon={<Database size={24} className="text-blue-600" />}
        actions={
          <>
            <ExportButton onClick={handleExport} />
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add Item
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Items" value={items.length} icon={<Boxes size={20} />} color="blue" />
        <StatCard label="Active Items" value={items.length} icon={<ShieldCheck size={20} />} color="emerald" />
        <StatCard label="Item Types" value={Object.keys(typeCounts).length} icon={<Tag size={20} />} color="amber" />
        <StatCard label="Stock Alerts" value={items.filter(i => Number(i.minStockLevel) > 0).length} icon={<Activity size={20} />} color="rose" />
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search by code, name, or type..."
                className="input-field pl-11"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <SearchableSelect
              placeholder="All Types"
              options={[{ label: 'All Types', value: 'ALL' }, ...typeOptions]}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>
          <button onClick={() => { setSearch(''); setTypeFilter('ALL') }} className="btn-secondary py-2 px-4 h-10 flex items-center justify-center">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Item Code', 'Item Name', 'Type', 'Unit', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={6}><Empty message="No items found" /></td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{item.itemCode}</span>
                        <span className="text-[10px] text-gray-400 font-medium mt-1">GST: {item.gst?.rateName || 'None'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">{item.itemName}</span>
                        <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[240px]">{item.description || 'No description'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase rounded-full tracking-wide">
                        {item.itemType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.unit?.unitCode}</span>
                        <span className="text-[10px] text-rose-500 font-bold mt-1">MIN: {item.minStockLevel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status="ACTIVE" /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"><Edit3 size={14} /></button>
                        <button onClick={() => remove(item)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Edit Item' : 'New Item Registration'} size="lg">
        <div className="space-y-6 py-4">
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <FormRow cols={2}>
              <div>
                <label className="label">Item Code</label>
                <input className="input-field uppercase tracking-wider" value={form.itemCode} onChange={e => setForm({ ...form, itemCode: e.target.value.toUpperCase() })} placeholder="Auto for most item types" />
              </div>
              <SearchableSelect
                label="GST Rate"
                options={[{ label: 'No GST', value: '' }, ...gstRates.map(g => ({ label: `${g.rateName} (${g.rate}%)`, value: g.id }))]}
                value={form.gstId}
                onChange={v => setForm({ ...form, gstId: v })}
              />
            </FormRow>
            <div className="mt-4">
              <label className="label">Item Name *</label>
              <input className="input-field uppercase" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value.toUpperCase() })} />
            </div>
          </div>

          <FormRow cols={2}>
            <SearchableSelect label="Type *" options={typeOptions} value={form.itemType} onChange={v => setForm({ ...form, itemType: v })} />
            <SearchableSelect
              label="Unit *"
              options={units.map(u => ({ label: `${u.unitName} (${u.unitCode})`, value: u.id }))}
              value={form.unitId}
              onChange={v => setForm({ ...form, unitId: v })}
            />
          </FormRow>

          <FormRow cols={2}>
            <div>
              <label className="label">Minimum Stock Level</label>
              <input type="number" className="input-field" value={form.minStockLevel} onChange={e => setForm({ ...form, minStockLevel: e.target.value })} />
            </div>
          </FormRow>

          <div>
            <label className="label">Description / Specifications</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Technical details, material composition..." />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
            <button className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={save}>{editingId ? 'Update Item' : 'Register Item'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
