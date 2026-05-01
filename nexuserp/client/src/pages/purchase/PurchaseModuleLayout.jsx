import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PurchaseDashboard from './PurchaseDashboard';
import PurchaseReportViewer from './PurchaseReportViewer';
import PurchaseOrderList from './purchase-order/PurchaseOrderList';
import CreatePurchaseOrder from './purchase-order/CreatePurchaseOrder';

// Sidebar Menu Structure
const menuStructure = [
  {
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    items: ['Overview']
  },
  {
    title: 'Purchase Order',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    items: ['Create Purchase Order', 'Purchase Order List', 'Purchase Order Approval', 'Purchase Order Return', 'Purchase Order Invoice']
  },
  {
    title: 'Budgets & Analysis',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    items: ['Purchase Budgets', 'Purchase Analysis Reports', 'Purchase Analysis by Dimensions', 'Item Dimensions - Detail', 'Item Dimensions - Total']
  },
  {
    title: 'Reports & Setup',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    items: ['Purchase Advice', 'Item/Vendor Catalog', 'Aged Accounts Payable', 'Vendor Purchases by Item', 'Item Charges - Specification', 'Purchasing Deferral Summary']
  },
  {
    title: 'Vendor Masters',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    items: ['Vendor Balance to Date', 'Top Vendor List', 'Vendor Listing', 'Vendor Trial Balance', 'Vendor Purchase Statistics']
  },
  {
    title: 'Inventory Costing',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    items: ['Inventory Cost Variance', 'Inventory Availability Plan', 'Inventory Inbound Transfer', 'Item Age Composition', 'Item Expiration - Quantity']
  }
];

export default function PurchaseModuleLayout() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [activeItem, setActiveItem] = useState('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Determine what to render based on selection
  const renderContent = () => {
    if (activeItem === 'Overview') return <PurchaseDashboard />;
    if (activeItem === 'Purchase Order List') return <PurchaseOrderList />;
    if (activeItem === 'Create Purchase Order') return <CreatePurchaseOrder />;
    
    return <PurchaseReportViewer reportName={activeItem} onBack={() => setActiveItem('Overview')} />;
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] dark:bg-[#0a0a0a] overflow-hidden font-sans">
      
      {/* Enterprise Sidebar */}
      <motion.div 
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white dark:bg-[#151515] border-r border-slate-200 dark:border-[#2a2a2a] flex flex-col shadow-xl z-20 relative"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#2a2a2a]">
          {isSidebarOpen && (
            <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent truncate">
              Nexus Purchasing
            </h1>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#252525] text-slate-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {menuStructure.map((menu, idx) => (
            <div key={idx} className="mb-2 px-3">
              <button 
                onClick={() => {
                  setActiveMenu(activeMenu === menu.title ? null : menu.title);
                  if (!isSidebarOpen) setIsSidebarOpen(true);
                }}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 ${activeMenu === menu.title ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#252525]'}`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menu.icon} /></svg>
                {isSidebarOpen && (
                  <>
                    <span className="ml-3 text-sm truncate flex-1 text-left">{menu.title}</span>
                    <svg className={`w-4 h-4 transition-transform ${activeMenu === menu.title ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </>
                )}
              </button>

              <AnimatePresence>
                {isSidebarOpen && activeMenu === menu.title && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-9 mt-1 space-y-1 overflow-hidden"
                  >
                    {menu.items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveItem(item)}
                        className={`w-full text-left text-[13px] py-2 px-3 rounded-lg transition-colors truncate ${activeItem === item ? 'bg-white dark:bg-[#222] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-[#333] font-bold' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="h-16 bg-white dark:bg-[#151515] border-b border-slate-200 dark:border-[#2a2a2a] flex items-center justify-between px-8 shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live Auto-Sync Active</span>
          </div>
          <div className="flex items-center gap-4">
             {/* Notification Bell */}
             <button className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-[#252525] relative">
               <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
             </button>
          </div>
        </div>
        
        {/* Render Dashboard or Report Viewer */}
        <div className="flex-1 overflow-y-auto">
           {renderContent()}
        </div>
      </div>

    </div>
  );
}
