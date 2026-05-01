import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { fetchMe } from './store/slices/authSlice'
import Layout from './components/layout/Layout'
import { connectSocket, disconnectSocket } from './services/socket'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
// HR
import Employees from './pages/hr/Employees'
import Departments from './pages/hr/Departments'
import Designations from './pages/hr/Designations'
import EmployeeCategories from './pages/hr/EmployeeCategories'
import Attendance from './pages/hr/Attendance'
import SalarySlips from './pages/hr/SalarySlips'
import SalaryRecords from './pages/hr/SalaryRecords'
import EmployeeAdvances from './pages/hr/EmployeeAdvances'
import LeaveManagement from './pages/hr/LeaveManagement'
import Recruitment from './pages/hr/Recruitment'
import Performance from './pages/hr/Performance'
import Training from './pages/hr/Training'
import ExitManagement from './pages/hr/ExitManagement'
import ESSPortal from './pages/hr/ESSPortal'
import EmployeeGatePass from './pages/hr/EmployeeGatePass'

import InwardGatePass from './pages/gate/InwardGatePass'
import OutwardGatePass from './pages/gate/OutwardGatePass'
import VisitorPass from './pages/gate/VisitorPass'
import GateDashboard from './pages/gate/GateDashboard'
// Masters
import Items from './pages/masters/Items'
import RawMaterials from './pages/masters/RawMaterials'
import SemiFinished from './pages/masters/SemiFinished'
import FinishedGoods from './pages/masters/FinishedGoods'
import Consumables from './pages/masters/Consumables'
import Vendors from './pages/masters/Vendors'
import Units from './pages/masters/Units'
import GSTRates from './pages/masters/GSTRates'
import Terms from './pages/masters/Terms'
import MastersDashboard from './pages/masters/MastersDashboard'
// Inventory
import Stores from './pages/inventory/Stores'
import Products from './pages/inventory/Products'
import StockMovements from './pages/inventory/StockMovements'
import InventoryDashboard from './pages/inventory/InventoryDashboard'
// Purchase
import Indents from './pages/purchase/Indents'
import CreateIndent from './pages/purchase/CreateIndent'
import PurchaseOrders from './pages/purchase/PurchaseOrders'
import GatePass from './pages/purchase/GatePass'
import GRNPage from './pages/purchase/GRN'
import MRNPage from './pages/purchase/MRN'
import PurchaseBills from './pages/purchase/PurchaseBills'
import PurchaseReturns from './pages/purchase/PurchaseReturns'
import PurchaseOrderList from './pages/purchase/purchase-order/PurchaseOrderList'
import CreatePurchaseOrder from './pages/purchase/purchase-order/CreatePurchaseOrder'
import PurchaseReportViewer from './pages/purchase/PurchaseReportViewer'
import CostingDashboard from './pages/costing/CostingDashboard'
import CostingJobs from './pages/costing/CostingJobs'
import SalesDashboard from './pages/sales/SalesDashboard'
import SalesOrders from './pages/sales/SalesOrders'
import { useParams } from 'react-router-dom'

const DynamicReport = () => {
  const { reportName } = useParams();
  return <PurchaseReportViewer reportName={reportName} onBack={() => window.history.back()} />
}

// QC
import QCRawMaterial from './pages/qc/QCRawMaterial'
import QCSemiFinished from './pages/qc/QCSemiFinished'
import QCProcess from './pages/qc/QCProcess'
import QCFinal from './pages/qc/QCFinal'
import PurchaseTracking from './pages/purchase/PurchaseTracking'
import QCParameters from './pages/qc/QCParameters'
import MachineMaster from './pages/maintenance/MachineMaster'
import BreakdownReports from './pages/maintenance/BreakdownReports'
import Reports from './pages/reports'

// Manufacturing
import BOMManagement from './pages/manufacturing/BOMManagement'
import WorkOrders from './pages/manufacturing/WorkOrders'
import JobCard from './pages/manufacturing/JobCard'
import MaterialIssue from './pages/manufacturing/MaterialIssue'
import IssueHistory from './pages/manufacturing/IssueHistory'
import ProductionDemand from './pages/manufacturing/ProductionDemand'
import ProcessQC from './pages/manufacturing/ProcessQC'
import ProductionOutput from './pages/manufacturing/ProductionOutput'
import SFGConversion from './pages/manufacturing/SFGConversion'

// CI Modules
import ChecklistMaster from './pages/ci/ChecklistMaster'
import KaizenMaster from './pages/ci/KaizenMaster'
import PokaYokeMaster from './pages/ci/PokaYokeMaster'
import CIDashboard from './pages/ci/CIDashboard'

import TaskMaster from './pages/admin/TaskMaster'

// Manufacturing Dashboards
import ManufacturingDashboard from './pages/manufacturing/ManufacturingDashboard'
import QCDashboard from './pages/qc/QCDashboard'
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard'
import HRModuleDashboard from './pages/hr/HRModuleDashboard'
import PurchaseModuleDashboard from './pages/purchase/PurchaseModuleDashboard'

// Admin
import Users from './pages/admin/Users'

// Partners & Masters
import VendorList from './pages/partners/VendorList'
import CustomerList from './pages/partners/CustomerList'
import PartnerConsolidated from './pages/partners/PartnerConsolidated'
import MasterRegistry from './pages/partners/MasterRegistry'
import GroupMaster from './pages/partners/GroupMaster'
import TransportersMaster from './pages/partners/TransportersMaster'

const ProtectedRoute = ({ children, roles, module }) => {
  const { user, token } = useSelector(s => s.auth)
  if (!token) return <Navigate to="/login" replace />
  
  if (user) {
    if (user.role === 'ADMIN') return children;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
    
    if (module) {
      const hasAccess = user.permissions?.some(p => p.moduleName === module && p.canRead);
      if (!hasAccess) return <Navigate to="/" replace />
    }
  }
  
  return children
}

export default function App() {
  const dispatch = useDispatch()
  const { token } = useSelector(s => s.auth)

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  useEffect(() => { 
    if (token) {
      dispatch(fetchMe())
      connectSocket(token)
    } else {
      disconnectSocket()
    }
  }, [token])

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          
          {/* HR */}
          <Route path="hr" element={<ProtectedRoute module="hr_employees"><HRModuleDashboard /></ProtectedRoute>} />
          <Route path="hr/employees"      element={<ProtectedRoute module="hr_employees"><Employees /></ProtectedRoute>} />
          <Route path="hr/departments"    element={<ProtectedRoute module="hr_departments"><Departments /></ProtectedRoute>} />
          <Route path="hr/designations"   element={<ProtectedRoute module="hr_departments"><Designations /></ProtectedRoute>} />
          <Route path="hr/categories"     element={<ProtectedRoute module="hr_departments"><EmployeeCategories /></ProtectedRoute>} />
          <Route path="hr/attendance"     element={<ProtectedRoute module="hr_attendance"><Attendance /></ProtectedRoute>} />
          <Route path="hr/salary-slips"   element={<ProtectedRoute module="hr_salary_slips"><SalarySlips /></ProtectedRoute>} />
          <Route path="hr/salary-records" element={<ProtectedRoute module="hr_salary_slips"><SalaryRecords /></ProtectedRoute>} />
          <Route path="hr/advances"       element={<ProtectedRoute module="hr_advances"><EmployeeAdvances /></ProtectedRoute>} />
          <Route path="hr/recruitment"    element={<ProtectedRoute module="hr_employees"><Recruitment /></ProtectedRoute>} />
          <Route path="hr/leave"          element={<ProtectedRoute module="hr_employees"><LeaveManagement /></ProtectedRoute>} />
          <Route path="hr/performance"    element={<ProtectedRoute module="hr_employees"><Performance /></ProtectedRoute>} />
          <Route path="hr/training"       element={<ProtectedRoute module="hr_employees"><Training /></ProtectedRoute>} />
          <Route path="hr/exit"           element={<ProtectedRoute module="hr_employees"><ExitManagement /></ProtectedRoute>} />
          <Route path="hr/ess-portal"     element={<ProtectedRoute><ESSPortal /></ProtectedRoute>} />

          {/* Gate Entry */}
          <Route path="gate" element={<ProtectedRoute module="gate_inward"><GateDashboard /></ProtectedRoute>} />
          <Route path="gate/inward"   element={<ProtectedRoute module="gate_inward"><InwardGatePass /></ProtectedRoute>} />
          <Route path="gate/outward"  element={<ProtectedRoute module="gate_outward"><OutwardGatePass /></ProtectedRoute>} />
          <Route path="gate/visitor"  element={<ProtectedRoute module="gate_visitor"><VisitorPass /></ProtectedRoute>} />
          <Route path="gate/employee" element={<ProtectedRoute module="gate_employee"><EmployeeGatePass /></ProtectedRoute>} />
          
          {/* Purchase */}
          <Route path="purchase" element={<ProtectedRoute module="purchase_indent"><PurchaseModuleDashboard /></ProtectedRoute>} />
          <Route path="purchase/indent"         element={<ProtectedRoute module="purchase_indent"><Indents /></ProtectedRoute>} />
          <Route path="purchase/indent/create"  element={<ProtectedRoute module="purchase_indent"><CreateIndent /></ProtectedRoute>} />
          <Route path="purchase/orders"         element={<ProtectedRoute module="purchase_orders"><PurchaseOrders /></ProtectedRoute>} />
          <Route path="purchase/tracking"       element={<ProtectedRoute module="purchase_tracking"><PurchaseTracking /></ProtectedRoute>} />
          <Route path="purchase/bills"          element={<ProtectedRoute module="purchase_bills"><PurchaseBills /></ProtectedRoute>} />
          <Route path="purchase/returns"        element={<ProtectedRoute module="purchase_returns"><PurchaseReturns /></ProtectedRoute>} />
          
          {/* SAP Integration */}
          <Route path="purchase/sap-order-list" element={<ProtectedRoute module="sap_reports"><PurchaseOrderList /></ProtectedRoute>} />
          <Route path="purchase/sap-create-order" element={<ProtectedRoute module="sap_reports"><CreatePurchaseOrder /></ProtectedRoute>} />
          <Route path="purchase/sap-report/:reportName" element={<ProtectedRoute module="sap_reports"><DynamicReport /></ProtectedRoute>} />

          {/* Sales */}
          <Route path="sales" element={<ProtectedRoute module="sales_orders"><SalesDashboard /></ProtectedRoute>} />
          <Route path="sales/orders" element={<ProtectedRoute module="sales_orders"><SalesOrders /></ProtectedRoute>} />

          {/* Costing */}
          <Route path="costing" element={<ProtectedRoute module="costing_analysis"><CostingDashboard /></ProtectedRoute>} />
          <Route path="costing/jobs" element={<ProtectedRoute module="costing_analysis"><CostingJobs /></ProtectedRoute>} />

          {/* Masters */}
          <Route path="masters" element={<ProtectedRoute module="masters_items"><MastersDashboard /></ProtectedRoute>} />
          <Route path="masters/vendors"       element={<ProtectedRoute module="masters_vendors"><Vendors /></ProtectedRoute>} />
          <Route path="masters/items"         element={<ProtectedRoute module="masters_items"><Items /></ProtectedRoute>} />
          <Route path="masters/raw-materials" element={<ProtectedRoute module="masters_items"><RawMaterials /></ProtectedRoute>} />
          <Route path="masters/semi-finished" element={<ProtectedRoute module="masters_items"><SemiFinished /></ProtectedRoute>} />
          <Route path="masters/finished"      element={<ProtectedRoute module="masters_items"><FinishedGoods /></ProtectedRoute>} />
          <Route path="masters/consumables"   element={<ProtectedRoute module="masters_items"><Consumables /></ProtectedRoute>} />
          <Route path="masters/terms"         element={<ProtectedRoute module="masters_terms"><Terms /></ProtectedRoute>} />
          <Route path="masters/units"         element={<ProtectedRoute module="masters_units"><Units /></ProtectedRoute>} />
          <Route path="masters/gst"           element={<ProtectedRoute module="masters_gst"><GSTRates /></ProtectedRoute>} />

          {/* Inventory */}
          <Route path="inventory" element={<ProtectedRoute module="inventory_products"><InventoryDashboard /></ProtectedRoute>} />
          <Route path="inventory/stores"   element={<ProtectedRoute module="inventory_stores"><Stores /></ProtectedRoute>} />
          <Route path="inventory/products" element={<ProtectedRoute module="inventory_products"><Products /></ProtectedRoute>} />
          <Route path="inventory/movements"element={<ProtectedRoute module="inventory_movements"><StockMovements /></ProtectedRoute>} />
          <Route path="purchase/grn"       element={<ProtectedRoute module="inventory_grn"><GRNPage /></ProtectedRoute>} />
          <Route path="purchase/mrn"       element={<ProtectedRoute module="inventory_mrn"><MRNPage /></ProtectedRoute>} />

          {/* QC */}
          <Route path="qc" element={<ProtectedRoute module="qc_raw"><QCDashboard /></ProtectedRoute>} />
          <Route path="qc/raw-material"  element={<ProtectedRoute module="qc_raw"><QCRawMaterial /></ProtectedRoute>} />
          <Route path="qc/semi-finished" element={<ProtectedRoute module="qc_semifinished"><QCSemiFinished /></ProtectedRoute>} />
          <Route path="qc/process"       element={<ProtectedRoute module="qc_process"><QCProcess /></ProtectedRoute>} />
          <Route path="qc/final"         element={<ProtectedRoute module="qc_final"><QCFinal /></ProtectedRoute>} />
          <Route path="qc/parameters"    element={<ProtectedRoute module="qc_parameters"><QCParameters /></ProtectedRoute>} />

          {/* Manufacturing */}
          <Route path="manufacturing" element={<ProtectedRoute module="manufacturing_bom"><ManufacturingDashboard /></ProtectedRoute>} />
          <Route path="manufacturing/bom"           element={<ProtectedRoute module="manufacturing_bom"><BOMManagement /></ProtectedRoute>} />
          <Route path="manufacturing/work-orders"   element={<ProtectedRoute module="manufacturing_work_orders"><WorkOrders /></ProtectedRoute>} />
          <Route path="manufacturing/job-card"      element={<ProtectedRoute module="manufacturing_job_card"><JobCard /></ProtectedRoute>} />
          <Route path="manufacturing/material-issue" element={<ProtectedRoute module="manufacturing_material_issue"><MaterialIssue /></ProtectedRoute>} />
          <Route path="manufacturing/issue-history" element={<ProtectedRoute module="manufacturing_material_issue"><IssueHistory /></ProtectedRoute>} />
          <Route path="manufacturing/demand"        element={<ProtectedRoute module="manufacturing_work_orders"><ProductionDemand /></ProtectedRoute>} />
          <Route path="manufacturing/process-qc"    element={<ProtectedRoute module="qc_process"><ProcessQC /></ProtectedRoute>} />
          <Route path="manufacturing/output"        element={<ProtectedRoute module="manufacturing_output"><ProductionOutput /></ProtectedRoute>} />
          <Route path="manufacturing/conversion"    element={<ProtectedRoute module="manufacturing_conversion"><SFGConversion /></ProtectedRoute>} />

          {/* Maintenance */}
          <Route path="maintenance" element={<ProtectedRoute module="maintenance_machines"><MaintenanceDashboard /></ProtectedRoute>} />
          <Route path="maintenance/machines"   element={<ProtectedRoute module="maintenance_machines"><MachineMaster /></ProtectedRoute>} />
          <Route path="maintenance/breakdowns" element={<ProtectedRoute module="maintenance_breakdowns"><BreakdownReports /></ProtectedRoute>} />

          {/* Continuous Improvement */}
          <Route path="ci" element={<ProtectedRoute module="ci_checklists"><CIDashboard /></ProtectedRoute>} />
          <Route path="ci/checklists" element={<ProtectedRoute module="ci_checklists"><ChecklistMaster /></ProtectedRoute>} />
          <Route path="ci/kaizens"    element={<ProtectedRoute module="ci_kaizens"><KaizenMaster /></ProtectedRoute>} />
          <Route path="ci/pokayokes"  element={<ProtectedRoute module="ci_pokayokes"><PokaYokeMaster /></ProtectedRoute>} />

          {/* Partners & Masters */}
          <Route path="partners/vendors"      element={<ProtectedRoute module="partners_access"><VendorList /></ProtectedRoute>} />
          <Route path="partners/customers"    element={<ProtectedRoute module="partners_access"><CustomerList /></ProtectedRoute>} />
          <Route path="partners/unified"      element={<ProtectedRoute module="partners_access"><PartnerConsolidated /></ProtectedRoute>} />
          <Route path="partners/master"       element={<ProtectedRoute module="partners_access"><MasterRegistry /></ProtectedRoute>} />
          <Route path="partners/groups"       element={<ProtectedRoute module="partners_access"><GroupMaster /></ProtectedRoute>} />
          <Route path="partners/logistics"    element={<ProtectedRoute module="partners_access"><TransportersMaster /></ProtectedRoute>} />

          {/* Admin & Other */}
          <Route path="reports"     element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute module="admin"><Users /></ProtectedRoute>} />
          <Route path="admin/tasks" element={<TaskMaster />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
