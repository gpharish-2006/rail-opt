import Sidebar from './Sidebar'
import TopNav from './TopNav'
import { Outlet } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'

export default function Layout() {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 p-5 overflow-auto max-w-[1800px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
