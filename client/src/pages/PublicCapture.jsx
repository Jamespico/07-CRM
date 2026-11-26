import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Building2,
  UserCheck,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCRM } from '../context/CRMContext'
import { useToast } from '../context/ToastContext'

const BUDGET_OPTIONS = [
  { label: 'Under $5,000', value: 2500, points: 15 },
  { label: '$5,000 - $15,000', value: 10000, points: 40 },
  { label: '$15,000 - $50,000', value: 30000, points: 40 },
  { label: '$50,000+', value: 60000, points: 40 },
]

const PERSONAL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'live.com',
]

export default function PublicCapture() {
  const navigate = useNavigate()
  const crm = useCRM() || {}
  const { currentUser, user, profiles = [], refreshData } = crm
  const toastCtx = useToast() || {}
  const addToast = toastCtx.addToast || (() => { })

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [budgetLabel, setBudgetLabel] = useState('$5,000 - $15,000')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedLead, setSubmittedLead] = useState(null)

  const scoreBreakdown = useMemo(() => {
    const cleanPhone = phone.replace(/\D/g, '')
    const phonePoints = cleanPhone.length >= 7 ? 30 : 0

    const trimmedEmail = email.trim().toLowerCase()
    let emailPoints = 0
    if (trimmedEmail.includes('@') && trimmedEmail.split('@')[1]?.includes('.')) {
      const domain = trimmedEmail.split('@')[1]
      emailPoints = PERSONAL_DOMAINS.includes(domain) ? 10 : 30
    }

    const selectedBudget =
      BUDGET_OPTIONS.find((b) => b.label === budgetLabel) || BUDGET_OPTIONS[1]
    const budgetPoints = selectedBudget.points

    const total = Math.min(100, phonePoints + emailPoints + budgetPoints)

    return {
      phonePoints,
      emailPoints,
      budgetPoints,
      budgetValue: selectedBudget.value,
      total,
    }
  }, [phone, email, budgetLabel])

  const handleGoToWorkspace = async () => {
    if (currentUser || user) {
      navigate('/dashboard')
      return
    }

    try {
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        navigate('/dashboard')
        return
      }
    } catch {
      // Fallback to localStorage check below
    }

    const hasStoredUser = Object.keys(localStorage).some(
      (key) =>
        (key.includes('crm') || key.includes('sb-')) &&
        localStorage.getItem(key) &&
        localStorage.getItem(key) !== 'null'
    )

    navigate(hasStoredUser ? '/dashboard' : '/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)

    try {
      const cleanName = fullName.trim()
      const cleanCompany = companyName.trim()
      const cleanEmail = email.trim()
      const cleanPhone = phone.trim()
      const cleanNotes = notes.trim()

      // 1. Find or create matching Account
      let accountId = null
      const { data: existingAccounts } = await supabase
        .from('accounts')
        .select('id, company_name')
        .ilike('company_name', cleanCompany)
        .limit(1)

      if (existingAccounts && existingAccounts.length > 0) {
        accountId = existingAccounts[0].id
      } else {
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert([{ company_name: cleanCompany }])
          .select('id')
          .single()

        if (accountError) throw accountError
        accountId = newAccount.id
      }

      // 2. Round-robin Sales Rep assignment
      let availableReps = profiles.filter((p) => p.role === 'Sales Rep')
      if (availableReps.length === 0) {
        const { data: fetchedReps } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'Sales Rep')
        availableReps = fetchedReps || []
      }
      if (availableReps.length === 0 && profiles.length > 0) {
        availableReps = profiles
      }

      let assignedRep = null
      if (availableReps.length > 0) {
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
        const index = (count || 0) % availableReps.length
        assignedRep = availableReps[index]
      }

      // 3. Insert new Lead into contacts
      const { data: createdContact, error: contactError } = await supabase
        .from('contacts')
        .insert([
          {
            account_id: accountId,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            type: 'Lead',
            stage: 'New',
            score: scoreBreakdown.total,
            deal_value: scoreBreakdown.budgetValue,
            assigned_to: assignedRep?.id || null,
          },
        ])
        .select('*')
        .single()

      if (contactError) throw contactError

      // 4. Log Form Capture activity
      const activityNotes = [
        `Submitted inquiry via Public Lead Capture (${budgetLabel}).`,
        cleanNotes ? `Notes: ${cleanNotes}` : null,
      ]
        .filter(Boolean)
        .join(' ')

      await supabase.from('activities').insert([
        {
          contact_id: createdContact.id,
          user_id: assignedRep?.id || null,
          type: 'Form Capture',
          notes: activityNotes,
        },
      ])

      // 5. Trigger Resend welcome email Edge Function (non-blocking fallback)
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: cleanEmail,
            subject: `We received your inquiry, ${cleanName}`,
            html: `<p>Hi ${cleanName},</p><p>Thank you for reaching out to <strong>07 CRM</strong> regarding <strong>${cleanCompany}</strong>. ${assignedRep
                ? `${assignedRep.full_name} has been assigned to your inquiry and will follow up shortly.`
                : 'A member of our team will follow up shortly.'
              }</p>`,
          },
        })
      } catch {
        // Graceful fallback if Resend Edge Function is not deployed yet
      }

      if (typeof refreshData === 'function') {
        await refreshData()
      }

      setSubmittedLead({
        name: cleanName,
        company: cleanCompany,
        score: scoreBreakdown.total,
        repName: assignedRep?.full_name || 'Available Sales Rep',
      })
      addToast('Inquiry submitted successfully!', 'success')
    } catch (err) {
      addToast(err?.message || 'Failed to submit inquiry. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setFullName('')
    setCompanyName('')
    setEmail('')
    setPhone('')
    setBudgetLabel('$5,000 - $15,000')
    setNotes('')
    setSubmittedLead(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              07
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              07 CRM
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Lead Capture
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoToWorkspace}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
          >
            <span>Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Info + Live Lead Score Preview */}
          <div className="md:col-span-5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Contact Sales
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Submit project requirements. Inquiries are automatically scored and
              assigned to an available representative.
            </p>

            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">
                  Lead Score Preview
                </span>
                <span className="text-xs font-bold text-amber-600 tabular-nums">
                  {scoreBreakdown.total} / 100
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Phone (+30 pts)</span>
                  <span className="font-medium text-slate-700 tabular-nums">
                    {scoreBreakdown.phonePoints > 0
                      ? `+${scoreBreakdown.phonePoints}`
                      : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Work Email (+30 pts)</span>
                  <span className="font-medium text-slate-700 tabular-nums">
                    {scoreBreakdown.emailPoints > 0
                      ? `+${scoreBreakdown.emailPoints}`
                      : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Budget Tier (+15 to +40 pts)</span>
                  <span className="font-medium text-slate-700 tabular-nums">
                    +{scoreBreakdown.budgetPoints}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Lead Details Form or Confirmation */}
          <div className="md:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              {submittedLead ? (
                <div className="text-center py-4">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h2 className="mt-4 text-base font-bold text-slate-900">
                    Inquiry Received
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Thank you, {submittedLead.name}. Your inquiry for{' '}
                    <span className="font-medium text-slate-700">
                      {submittedLead.company}
                    </span>{' '}
                    has been routed to our team.
                  </p>

                  <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Calculated Lead Score
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {submittedLead.score} / 100
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 inline-flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Assigned Representative
                      </span>
                      <span className="font-semibold text-slate-800">
                        {submittedLead.repName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        Pipeline Stage
                      </span>
                      <span className="font-medium text-indigo-600">New</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      Submit Another Inquiry
                    </button>
                    <button
                      type="button"
                      onClick={handleGoToWorkspace}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Back to Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Lead Details
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Provide contact details and project requirements below.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Alex Morgan"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Acme Inc."
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Work Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@acme.com"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 234-5678"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Estimated Budget (USD)
                      </label>
                      <select
                        value={budgetLabel}
                        onChange={(e) => setBudgetLabel(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        {BUDGET_OPTIONS.map((option) => (
                          <option key={option.label} value={option.label}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Notes
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Requirements or questions..."
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Inquiry...</span>
                        </>
                      ) : (
                        <span>Submit Inquiry</span>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400">
        07 CRM © 2026.
      </footer>
    </div>
  )
}