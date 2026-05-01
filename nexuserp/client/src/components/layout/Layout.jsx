import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200 m-0 p-0">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Topbar onToggleSidebar={() => setCollapsed(p => !p)} collapsed={collapsed} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full min-h-full flex flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
