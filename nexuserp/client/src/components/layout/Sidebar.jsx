import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { 
  LayoutDashboard, Users, ShoppingCart, TrendingUp, Package, Shield, Factory, Star,
  Lightbulb, FileText, UserCog, CheckSquare, LogOut, ChevronRight, Activity,
  PlusCircle, FilePlus, UserPlus, ClipboardPlus, Truck, PieChart, Calculator, Globe
} from 'lucide-react'
import { logout } from '../../store/slices/authSlice'

const navItems = [
  { section: 'Dashboard', key:'dashboard', label:'Main Dashboard', to: '/', icon: <LayoutDashboard size={18}/> },
  { section: 'Dashboard', key:'tasks',     label:'Task Management', to: '/admin/tasks', icon: <CheckSquare size={18}/> },
  
  { section: 'Operational Registry', key:'partners', label:'Partners & Masters', icon: <Globe size={18}/>, children:[
    { to:'/partners/vendors',   label:'Vendor Portfolio' },
    { to:'/partners/customers', label:'Client Registry' },
    { to:'/partners/unified',   label:'Unified Partner Matrix' },
    { to:'/partners/master',    label:'Master SKU Archive' },
    { to:'/partners/groups',    label:'Corporate Hierarchy' },
    { to:'/partners/logistics', label:'Logistics & Transporters' }
  ]},

  { section: 'HR & People', key:'hr', label:'HR & Payroll', icon: <Users size={18}/>, children:[
    { to:'/hr/employees',      label:'Employee Master' },
    { to:'/hr/departments',    label:'Department Master' },
    { to:'/hr/designations',   label:'Designation Master' },
    { to:'/hr/categories',     label:'Category Master' },
    { to:'/hr/attendance',     label:'Attendance Entry' },
    { to:'/hr/salary-slips',   label:'Generate Salary Slip' },
    { to:'/hr/salary-records', label:'Salary History' },
    { to:'/hr/advances',       label:'Employee Advances' },
    { to:'/hr/recruitment',    label:'Recruitment' },
    { to:'/hr/leave',          label:'Leave Management' },
    { to:'/hr/performance',    label:'Performance' },
    { to:'/hr/training',       label:'Training' },
    { to:'/hr/exit',           label:'Exit Management' },
    { to:'/hr/ess-portal',     label:'ESS Portal' }
  ]},

  { section: 'Supply Chain', key:'purchase', label:'Purchase', icon: <ShoppingCart size={18}/>, children:[
    { to:'/purchase/indent',    label:'Material Indent' },
    { to:'/purchase/orders',    label:'Purchase Order (PO)' },
    { to:'/purchase/tracking',  label:'PO Tracker' },
    { to:'/purchase/bills',     label:'Vendor Bills' },
    { to:'/purchase/returns',   label:'Purchase Returns' },
    { to:'/purchase/grn',       label:'GRN Entry (Gate)' },
    { to:'/purchase/mrn',       label:'MRN Entry (Store)' }
  ]},

  { section: 'Supply Chain', key:'inventory', label:'Inventory', icon: <Package size={18}/>, children:[
    { to:'/masters/items',         label:'Item Master' },
    { to:'/masters/units',         label:'Units of Measure' },
    { to:'/masters/gst',           label:'GST Rates' },
    { to:'/inventory/stores',      label:'Store Setup' },
    { to:'/inventory/products',    label:'Current Stock' },
    { to:'/inventory/movements',   label:'Stock Ledger' }
  ]},

  { section: 'Supply Chain', key:'gate', label:'Gate Entry', icon: <Shield size={18}/>, children:[
    { to:'/gate/inward',   label:'Material Inward' },
    { to:'/gate/outward',  label:'Material Outward' },
    { to:'/gate/visitor',  label:'Visitor Reg.' },
    { to:'/gate/employee', label:'Employee Gate Pass' }
  ]},

  { section: 'Production', key:'manufacturing', label:'Manufacturing', icon: <Factory size={18}/>, children:[
    { to:'/manufacturing/bom',          label:'Recipe / BOM' },
    { to:'/manufacturing/work-orders',  label:'Production WO' },
    { to:'/manufacturing/job-card',     label:'Job Route Card' },
    { to:'/manufacturing/material-issue', label:'Issue Slip' },
    { to:'/manufacturing/output',       label:'Output Rec.' },
    { to:'/manufacturing/conversion',   label:'Stock Conversion' }
  ]},

  { section: 'Production', key:'costing', label:'Costing & Modeling', icon: <Calculator size={18}/>, children:[
    { to:'/costing',      label:'Costing Dashboard' },
    { to:'/costing/jobs', label:'Costing Register' }
  ]},

  { section: 'Production', key:'qc', label:'Quality Control', icon: <Star size={18}/>, children:[
    { to:'/qc/raw-material',  label:'RM Quality' },
    { to:'/qc/semi-finished', label:'SFG Quality' },
    { to:'/qc/process',       label:'In-Process QC' },
    { to:'/qc/final',         label:'Final Insp.' },
    { to:'/qc/parameters',    label:'QC Parameters' }
  ]},

  { section: 'Optimization', key:'ci', label:'CI & Lean', icon: <Lightbulb size={18}/>, children:[
    { to:'/ci/checklists', label:'Checklists' },
    { to:'/ci/kaizens',    label:'Kaizen Records' },
    { to:'/ci/pokayokes',  label:'Poka-Yoke' }
  ]},

  { section: 'Optimization', key:'sap_purchase', label:'SAP Analytics', icon: <PieChart size={18}/>, children:[
    { to:'/purchase/sap-create-order', label:'Create Order' },
    { to:'/purchase/sap-order-list', label:'Order List' },
    { to:'/purchase/sap-report/Purchase Budgets', label:'Budgets' },
    { to:'/purchase/sap-report/Purchase Analysis', label:'Analysis' }
  ]},

  { section: 'System', key:'admin', label:'User Management', icon: <UserCog size={18}/>, to: '/admin/users' },
  { section: 'System', key:'reports', label:'MIS Reports', icon: <FileText size={18}/>, to: '/reports' },
]

const quickActions = [
  { label: 'New Purchase Order', to: '/purchase/orders', icon: <PlusCircle size={14}/> },
  { label: 'New Production WO', to: '/manufacturing/work-orders', icon: <FilePlus size={14}/> },
  { label: 'Add New Employee', to: '/hr/employees', icon: <UserPlus size={14}/> },
  { label: 'Material Inward (RM)', to: '/gate/inward', icon: <ClipboardPlus size={14}/> },
  { label: 'Visitor Registration', to: '/gate/visitor', icon: <Truck size={14}/> },
]

const MODULE_BY_PATH = {
  '/admin/users': 'admin',
  '/reports': 'reports',
  '/partners/vendors': 'partners_access',
  '/partners/customers': 'partners_access',
  '/partners/unified': 'partners_access',
  '/partners/master': 'partners_access',
  '/partners/groups': 'partners_access',
  '/partners/logistics': 'partners_access',
  '/hr/employees': 'hr_employees',
  '/hr/departments': 'hr_departments',
  '/hr/designations': 'hr_designations',
  '/hr/categories': 'hr_categories',
  '/hr/attendance': 'hr_attendance',
  '/hr/salary-slips': 'hr_salary_slips',
  '/hr/salary-records': 'hr_salary_slips',
  '/hr/advances': 'hr_advances',
  '/hr/recruitment': 'hr_employees',
  '/hr/leave': 'hr_employees',
  '/hr/performance': 'hr_employees',
  '/hr/training': 'hr_employees',
  '/hr/exit': 'hr_employees',
  '/gate/inward': 'gate_inward',
  '/gate/outward': 'gate_outward',
  '/gate/visitor': 'gate_visitor',
  '/gate/employee': 'gate_employee',
  '/purchase/indent': 'purchase_indent',
  '/purchase/orders': 'purchase_orders',
  '/purchase/tracking': 'purchase_tracking',
  '/purchase/bills': 'purchase_bills',
  '/purchase/returns': 'purchase_returns',
  '/purchase/grn': 'inventory_grn',
  '/purchase/mrn': 'inventory_mrn',
  '/masters/items': 'masters_items',
  '/masters/units': 'masters_units',
  '/masters/gst': 'masters_gst',
  '/inventory/stores': 'inventory_stores',
  '/inventory/products': 'inventory_products',
  '/inventory/movements': 'inventory_movements',
  '/manufacturing/bom': 'manufacturing_bom',
  '/manufacturing/work-orders': 'manufacturing_work_orders',
  '/manufacturing/job-card': 'manufacturing_job_card',
  '/manufacturing/material-issue': 'manufacturing_material_issue',
  '/manufacturing/output': 'manufacturing_output',
  '/manufacturing/conversion': 'manufacturing_conversion',
  '/costing': 'costing_analysis',
  '/costing/jobs': 'costing_analysis',
  '/qc/raw-material': 'qc_raw',
  '/qc/semi-finished': 'qc_semifinished',
  '/qc/process': 'qc_process',
  '/qc/final': 'qc_final',
  '/qc/parameters': 'qc_parameters',
  '/ci/checklists': 'ci_checklists',
  '/ci/kaizens': 'ci_kaizens',
  '/ci/pokayokes': 'ci_pokayokes',
  '/purchase/sap-create-order': 'sap_reports',
  '/purchase/sap-order-list': 'sap_reports',
}

export default function Sidebar({ collapsed }) {
  const { user } = useSelector(s => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [open, setOpen] = useState({})

  const sections = [...new Set(navItems.map(m => m.section))];
  
  const hasPerm = (item) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const canRead = (path) => {
      const moduleName = MODULE_BY_PATH[path]
      if (!moduleName) return true
      return user.permissions?.some(p => p.moduleName === moduleName && p.canRead)
    }
    if (item.children) {
      return item.children.some(c => canRead(c.to));
    }
    return canRead(item.to); 
  }

  const toggleGroup = key => setOpen(p => ({ ...p, [key]: !p[key] }))

  return (
    <aside
      className={`h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 z-[100] transition-all duration-200 ${collapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <Activity size={22} className="text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-gray-900 dark:text-white font-bold text-lg tracking-tight truncate">Nucork<span className="text-blue-600">ERP</span></span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mt-0.5 truncate">Industrial Solutions</span>
          </div>
        )}
      </div>

      {/* Navigation Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-6 pb-10">
        {sections.map((sec) => (
          <div key={sec} className="space-y-1">
            {!collapsed && (
              <p className="px-4 pb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{sec}</p>
            )}
            {navItems.filter(m => m.section === sec).map((item) => {
              if (!hasPerm(item)) return null;

              if (item.children) {
                return (
                  <div key={item.key}>
                    <button 
                      onClick={() => collapsed && item.children?.[0] ? navigate(item.children[0].to) : toggleGroup(item.key)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors group ${open[item.key] ? 'bg-gray-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'sidebar-link'}`}
                    >
                      <span className={open[item.key] ? 'text-blue-600' : ''}>{item.icon}</span>
                      {!collapsed && <span className="flex-1 text-left font-medium truncate">{item.label}</span>}
                      {!collapsed && (
                        <ChevronRight size={14} className={`transition-transform duration-200 ${open[item.key] ? 'rotate-90' : 'opacity-40'}`} />
                      )}
                    </button>
                    
                    {!collapsed && open[item.key] && (
                      <div className="ml-9 mt-1 space-y-0.5 border-l border-gray-100 dark:border-gray-800 pl-4">
                        {item.children.map(child => (
                          <NavLink 
                            key={child.to} 
                            to={child.to}
                            className={({ isActive }) => `block py-2 px-2 rounded-md text-xs transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white'}`}
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <NavLink 
                  key={item.key} 
                  to={item.to}
                  className={({ isActive }) => isActive ? 'sidebar-active' : 'sidebar-link'}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      {/* User Identity Section */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg min-w-0">
          <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate uppercase tracking-wide">{user?.role || 'Admin'}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => { dispatch(logout()); navigate('/login') }} className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
