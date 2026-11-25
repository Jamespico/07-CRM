import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react'
import { useCRM } from '../context/CRMContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('elena.rostova@07crm.io')
  const [password, setPassword] = useState('password123')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('Sales Rep')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoggingIn, setDemoLoggingIn] = useState(null)

  const { login, signup, profiles, switchDemoUser } = useCRM()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name')
        }
        await signup(email, password, fullName, role)
        addToast(`Account created as ${role}! Welcome to 07 CRM.`)
      } else {
        await login(email, password)
        addToast('Signed in successfully.')
      }
      navigate(from, { replace: true })
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.')
      addToast(err.message || 'Authentication failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const quickDemoLogin = (p) => {
    setDemoLoggingIn(p.id)
    setTimeout(() => {
      switchDemoUser(p.id)
      addToast(`Logged in as ${p.full_name} (${p.role})`)
      navigate(from, { replace: true })
    }, 150)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-semibold text-sm mb-2 shadow-xs">
            07
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">07 CRM</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSignUp ? 'Create a workspace account' : 'Sign in to access your workspace'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          {errorMsg && (
            <div className="mb-3.5 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" strokeWidth={1.75} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('Sales Rep')}
                      className={`h-8 rounded-md text-xs font-medium border text-center transition-colors ${
                        role === 'Sales Rep'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Sales Rep
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('Admin')}
                      className={`h-8 rounded-md text-xs font-medium border text-center transition-colors ${
                        role === 'Admin'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-3.5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setErrorMsg('')
              }}
              className="text-xs text-indigo-600 hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Fast Switch Profiles */}
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block mb-2">1-Click Demo Logins:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {profiles.slice(0, 4).map((p) => {
                const isLoggingInThis = demoLoggingIn === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={Boolean(demoLoggingIn)}
                    onClick={() => quickDemoLogin(p)}
                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-1.5 text-left hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
                  >
                    {isLoggingInThis ? (
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600 shrink-0" strokeWidth={1.75} />
                    ) : (
                      <img src={p.avatar_url} alt={p.full_name} className="h-6 w-6 rounded-full object-cover shrink-0 border border-slate-200" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-900 truncate">{p.full_name.split(' ')[0]}</p>
                      <p className="text-[10px] text-slate-500 truncate">{p.role}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
