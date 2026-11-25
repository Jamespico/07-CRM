import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  GitPullRequest,
  Users,
  Megaphone,
  ShieldCheck,
  Globe,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Database,
  Building2,
} from 'lucide-react'
import { useCRM } from '../context/CRMContext'

export default function Layout() {
  const { profile, profiles, switchDemoUser, logout, resetDemoData, isConfigured } = useCRM()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Pipeline', path: '/pipeline', icon: GitPullRequest },
    { name: 'Contacts', path: '/contacts', icon: Users },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    { name: 'Team', path: '/team', icon: ShieldCheck, adminOnly: true },
    { name: 'Public Capture', path: '/capture', icon: Globe },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-semibold text-xs tracking-tight shadow-xs">
              07
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-slate-900 block leading-tight">07 CRM</span>
              <span className="text-[11px] text-slate-500 font-normal">Workspace</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && profile?.role !== 'Admin') {
              return null
            }
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Test Profile Switcher */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
              {isConfigured ? 'Supabase Live' : 'Demo Mode'}
            </span>
            <button
              onClick={resetDemoData}
              title="Reset sample data"
              className="text-[10px] text-slate-500 hover:text-indigo-600 hover:underline"
            >
              Reset
            </button>
          </div>

          <div className="text-[11px] text-slate-600">
            <label className="block mb-1 text-slate-500">Active Profile:</label>
            <select
              value={profile?.id || ''}
              onChange={(e) => switchDemoUser(e.target.value)}
              className="w-full h-8 text-xs rounded-md bg-white border border-slate-200 text-slate-800 px-2 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-none"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                alt={profile?.full_name || 'User'}
                className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                <span className="inline-block text-[11px] text-slate-500 truncate">{profile?.role || 'Sales Rep'}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">Overview</span>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/capture"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 flex items-center gap-1.5 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
            >
              <Globe className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
              <span>Public Lead Form</span>
            </NavLink>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="h-8 flex items-center gap-2 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700"
              >
                <span className="font-medium text-slate-900">{profile?.full_name?.split(' ')[0]}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-48 rounded-lg bg-white border border-slate-200 shadow-md p-1 z-50"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-semibold text-slate-900">{profile?.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{profile?.email}</p>
                  </div>
                  {profile?.role === 'Admin' && (
                    <NavLink
                      to="/team"
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md"
                    >
                      <ShieldCheck className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                      <span>Team Settings</span>
                    </NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.75} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
