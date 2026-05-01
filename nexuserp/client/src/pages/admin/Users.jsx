import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import toast from "react-hot-toast";
import { 
  Edit2, Trash2, ShieldCheck, UserPlus, Mail, 
  Shield, User as UserIcon, Zap, CheckCircle2, 
  XCircle, ChevronRight, Lock, Key, Layout,
  Activity, ShoppingCart, Package, Settings,
  Eye, Save, X, RotateCcw, Filter, MoreVertical
} from "lucide-react";
import {
  Modal, Badge, PageHeader, Spinner, 
  Empty, FormRow, SearchableSelect 
} from "../../components/ui";

const MODULE_GROUPS = [
  {
    category: "Strategic Command",
    modules: [
      { key: "dashboard_main", label: "Executive Overview" },
      { key: "dashboard_hr", label: "Human Capital Dashboard" },
      { key: "dashboard_purchase", label: "Procurement Dashboard" },
      { key: "dashboard_sales", label: "Sales & Revenue Dashboard" },
      { key: "dashboard_inventory", label: "Inventory Dashboard" },
      { key: "dashboard_manufacturing", label: "Operations Dashboard" },
      { key: "dashboard_qc", label: "Compliance Dashboard" },
    ]
  },
  {
    category: "Human Capital Management",
    modules: [
      { key: "hr_employees", label: "Personnel Portfolio" },
      { key: "hr_departments", label: "Department Matrix" },
      { key: "hr_designations", label: "Designation Matrix" },
      { key: "hr_attendance", label: "Attendance Surveillance" },
      { key: "hr_salary_slips", label: "Payroll Artifacts" },
      { key: "hr_advances", label: "Financial Advances" },
    ]
  },
  {
    category: "Logistics & Surveillance",
    modules: [
      { key: "gate_inward", label: "Logistics Inward" },
      { key: "gate_outward", label: "Logistics Outward" },
      { key: "gate_visitor", label: "Visitor Surveillance" },
      { key: "gate_employee", label: "Employee Transit" },
    ]
  },
  {
    category: "Procurement & Assets",
    modules: [
      { key: "purchase_indent", label: "Material Requisition" },
      { key: "purchase_orders", label: "Purchase Ledger" },
      { key: "inventory_products", label: "Inventory Artifacts" },
      { key: "inventory_stores", label: "Storage Matrix" },
    ]
  },
  {
    category: "Industrial Operations",
    modules: [
      { key: "manufacturing_bom", label: "Product Blueprint (BOM)" },
      { key: "manufacturing_work_orders", label: "Operational Directives" },
      { key: "manufacturing_output", label: "Industrial Output" },
    ]
  },
  {
    category: "Quality & Compliance",
    modules: [
      { key: "qc_raw", label: "Material Verification" },
      { key: "qc_final", label: "Final Certification" },
      { key: "qc_reports", label: "Compliance Intelligence" },
    ]
  },
  {
    category: "Revenue & Sales",
    modules: [
      { key: "sales_orders", label: "Sales Portfolio" },
      { key: "sales_customers", label: "Client Portfolio" },
    ]
  }
];

const ALL_MODULES = MODULE_GROUPS.flatMap(g => g.modules);
const defaultPerms = () => ALL_MODULES.map((m) => ({ moduleName: m.key, canRead: false, canWrite: false, canExecute: false }));

export default function Users() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF", isActive: true });
  const [perms, setPerms] = useState(defaultPerms());
  const [editing, setEditing] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/users");
      setList(r.data.data || []);
    } catch (e) {
      toast.error("User Directory Sync Failure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ name: "", email: "", password: "", role: "STAFF", isActive: true });
    setPerms(defaultPerms());
    setEditing(null);
    setModal(true);
  };

  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: "", role: u.role, isActive: u.isActive });
    const restoredPerms = defaultPerms().map((def) => {
      const existing = u.permissions?.find((x) => x.moduleName === def.moduleName);
      return existing ? { ...def, canRead: !!existing.canRead, canWrite: !!existing.canWrite, canExecute: !!existing.canExecute } : def;
    });
    setPerms(restoredPerms);
    setEditing(u.id);
    setModal(true);
  };

  const setPermVal = (moduleKey, key, val) => {
    setPerms(prev => prev.map(m => {
      if (m.moduleName !== moduleKey) return m;
      const updated = { ...m, [key]: val };
      if (updated.canWrite || updated.canExecute) updated.canRead = true;
      return updated;
    }));
  };

  const bulkToggle = (key, val) => {
    const visibleModules = categoryFilter === 'All' 
      ? ALL_MODULES.map(m => m.key) 
      : MODULE_GROUPS.find(g => g.category === categoryFilter).modules.map(m => m.key);
    
    setPerms(prev => prev.map(m => {
      if (!visibleModules.includes(m.moduleName)) return m;
      const updated = { ...m, [key]: val };
      if ((key === 'canWrite' || key === 'canExecute') && val) updated.canRead = true;
      return updated;
    }));
  };

  const save = async () => {
    const tid = toast.loading("Authorizing Access Policies...");
    try {
      const payload = { ...form, permissions: perms.filter((p) => p.canRead || p.canWrite || p.canExecute) };
      if (editing) await api.put(`/users/${editing}`, payload);
      else await api.post("/users", payload);
      toast.success(editing ? "Access Policies Re-indexed" : "Operator Successfully Registered", { id: tid });
      setModal(false);
      load();
    } catch (e) { toast.error("Authorization synchronization failed", { id: tid }); }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 h-full overflow-y-auto custom-scrollbar">
      <PageHeader
        title="Access Matrix Control"
        subtitle="Manage encrypted identity protocols, departmental authorities, and secure module access policies."
        icon={<ShieldCheck className="text-blue-600" size={28} />}
        actions={<button onClick={openAdd} className="btn-primary"><UserPlus size={16} /> Register Operator</button>}
      />

      {loading ? <Spinner size="lg" /> : (
        <div className="card overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  {['System Identity','Security Role','Authorized Modules','Lifecycle','Actions'].map(h => (
                    <th key={h} className="table-th text-white uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                <AnimatePresence>
                  {list.map((u, idx) => (
                    <motion.tr 
                      key={u.id} 
                      initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-blue-50/40 dark:hover:bg-blue-600/5 transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-blue-500/20">{u.name[0]}</div>
                          <div>
                            <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{u.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-2 tracking-tighter uppercase">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <span className="px-4 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center"><Shield size={14}/></div>
                           <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{u.permissions?.length || 0} SECTORS</span>
                        </div>
                      </td>
                      <td className="py-6"><Badge status={u.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button onClick={() => openEdit(u)} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit2 size={14} /></button>
                          <button onClick={() => { if(confirm('Authorize permanent termination?')) api.delete(`/users/${u.id}`).then(load) }} className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACCESS MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Refine Access Policies" : "Operator Authorization Protocol"} size="xl">
        <div className="flex flex-col h-[80vh]">
          {/* HEADER: Identity & Universal Toggles */}
          <div className="shrink-0 space-y-10 pb-10 border-b dark:border-white/5">
            <div className="p-10 bg-blue-600/5 rounded-[2.5rem] border border-blue-500/10 shadow-inner">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3"><UserIcon size={16}/> Identity Registry</p>
               <FormRow cols={3}>
                 <div><label className="label">Operator Name *</label><input className="input-field font-black uppercase" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} /></div>
                 <div><label className="label">Operator Email (Identity) *</label><input className="input-field font-black" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                 <div><label className="label">Access Level *</label>
                   <SearchableSelect options={["ADMIN", "HOD", "HR", "QC", "STORE", "PURCHASE", "SALES", "STAFF"].map(r => ({ label: r, value: r }))} value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))} />
                 </div>
               </FormRow>
               {!editing && (
                 <div className="mt-8">
                   <label className="label">Temporary Passcode *</label>
                   <input type="password" placeholder="System initialization passcode..." className="input-field font-black" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                 </div>
               )}
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"><Layout size={20}/></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Policy Vector</p>
                   <div className="w-64 mt-1"><SearchableSelect minimal={true} options={[{ label: 'ALL MODULES', value: 'All' }, ...MODULE_GROUPS.map(g => ({ label: g.category.toUpperCase(), value: g.category }))]} value={categoryFilter} onChange={v => setCategoryFilter(v)} /></div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => bulkToggle('canRead', true)} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"><Eye size={14}/> View Matrix</button>
                <button onClick={() => bulkToggle('canWrite', true)} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20"><Edit2 size={14}/> Edit Matrix</button>
                <button onClick={() => bulkToggle('canExecute', true)} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"><Zap size={14}/> Action Matrix</button>
                <button onClick={() => setPerms(defaultPerms())} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"><RotateCcw size={14}/> Reset</button>
              </div>
            </div>
          </div>

          {/* SCROLLABLE: Permission Matrix */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {MODULE_GROUPS.filter(g => categoryFilter === 'All' || g.category === categoryFilter).flatMap(g => g.modules).map(mod => {
                const p = perms.find(x => x.moduleName === mod.key) || {};
                const isViewRequired = p.canWrite || p.canExecute;

                return (
                  <motion.div 
                    layout
                    key={mod.key} 
                    className={`p-8 rounded-[2rem] border transition-all duration-500 relative group ${isViewRequired ? 'bg-blue-600/5 border-blue-500/30 shadow-lg shadow-blue-500/5' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'}`}
                  >
                    <div className="flex justify-between items-start mb-8">
                       <div>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                             <ChevronRight size={14} className="text-blue-600" />
                             {mod.label}
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{mod.key.replace(/_/g, ' • ')}</p>
                       </div>
                       <div className={`p-2 rounded-xl ${isViewRequired ? 'bg-blue-600/10 text-blue-600' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                          <Shield size={12}/>
                       </div>
                    </div>

                    <div className="flex justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                      {/* VIEW */}
                      <div className="flex flex-col items-center gap-2">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">View</p>
                         <label className={`relative inline-flex items-center ${isViewRequired ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                            <input 
                              type="checkbox" 
                              checked={p.canRead || false} 
                              disabled={isViewRequired}
                              onChange={e => setPermVal(mod.key, "canRead", e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                         </label>
                      </div>

                      {/* EDIT */}
                      <div className="flex flex-col items-center gap-2">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Edit</p>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={p.canWrite || false} 
                              onChange={e => setPermVal(mod.key, "canWrite", e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:bg-emerald-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                         </label>
                      </div>

                      {/* ACTION */}
                      <div className="flex flex-col items-center gap-2">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Action</p>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={p.canExecute || false} 
                              onChange={e => setPermVal(mod.key, "canExecute", e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                         </label>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* FOOTER */}
          <div className="shrink-0 flex justify-end gap-4 pt-10 border-t dark:border-white/5 mt-auto">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-10" onClick={() => setModal(false)}>Discard Changes</button>
            <button className="btn-primary min-w-[240px] shadow-blue-500/30" onClick={save}>AUTHORIZE POLICY MATRIX</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
