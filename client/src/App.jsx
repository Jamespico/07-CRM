import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CRMProvider, useCRM } from './context/CRMContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Contacts from './pages/Contacts'
import Campaigns from './pages/Campaigns'
import Team from './pages/Team'
import PublicCapture from './pages/PublicCapture'
import Login from './pages/Login'

function AppBootLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 transition-opacity duration-300">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center shadow-xs">
          07
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900 tracking-tight">07 CRM</span>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-500">Initializing...</span>
        </div>
        {/* Subtle progress bar */}
        <div className="w-36 h-1 bg-slate-200 rounded-full overflow-hidden mt-1">
          <div className="h-full bg-indigo-600 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, authLoading } = useCRM()

  if (authLoading) {
    return <AppBootLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <ToastProvider>
      <CRMProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Lead Capture */}
            <Route path="/capture" element={<PublicCapture />} />

            {/* Auth Login / Signup */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated Workspace */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="team" element={<Team />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </CRMProvider>
    </ToastProvider>
  )
}
