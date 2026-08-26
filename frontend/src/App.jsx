import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MaintenancePage from './pages/MaintenancePage'
import BlockPlannerPage from './pages/BlockPlannerPage'
import WeeklyPlanPage from './pages/WeeklyPlanPage'
import BeforeAfterPage from './pages/BeforeAfterPage'
import AnalyticsPage from './pages/AnalyticsPage'
import { ThemeProvider } from './context/ThemeContext'

import './App.css'

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
      {/* LOGIN ROUTE */}
      <Route path="/login" element={<LoginPage />} />

      {/* DASHBOARD / OPERATIONAL LAYOUT ROUTES */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route
          path="/assets"
          element={
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-xl font-bold mb-2">Rolling Stock & Infrastructure Assets</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Real-time telematics integration with TMS, SMMS & TDMS asset inventory.
              </p>
            </div>
          }
        />
        <Route path="/block-planner" element={<BlockPlannerPage />} />
        <Route path="/weekly-plan" element={<WeeklyPlanPage />} />
        <Route path="/before-after" element={<BeforeAfterPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route
          path="/emergency"
          element={
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                Emergency Line Possession & Override
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Control Office emergency override interface for unscheduled derailment/breakdown response.
              </p>
            </div>
          }
        />

        {/* DEFAULT FALLBACK */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      </Routes>
    </ThemeProvider>
  )
}