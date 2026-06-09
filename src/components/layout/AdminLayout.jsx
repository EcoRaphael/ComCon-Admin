// src/components/layout/AdminLayout.jsx
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface dark:bg-bg-dark-primary transition-colors duration-200">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-surface dark:bg-bg-dark-primary transition-colors duration-200">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}