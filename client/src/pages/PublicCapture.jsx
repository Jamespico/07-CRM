import React, { useState } from 'react'
import {
  Building2,
  Mail,
  Phone,
  DollarSign,
  User,
  FileText,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { useCRM } from '../context/CRMContext'
import { useToast } from '../context/ToastContext'

export default function PublicCapture() {
  const { capturePublicLead, calculateLeadScore, profiles } = useCRM()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    budget: '50000',
    notes: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)

  // Real-time calculation of preview score
  const liveScore = calculateLeadScore({
    email: formData.email,
    phone: formData.phone,
    budget: formData.budget,
    companyName: formData.companyName,
  })

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await capturePublicLead(formData)
      setSubmittedData(res)
      addToast('Inquiry submitted! We have assigned a sales representative.')
    } catch (err) {
      addToast(err.message || 'Error submitting lead.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const assignedRep = profiles.find((p) => p.id === submittedData?.assignedRepId)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white px-6 py-3.5">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white font-semibold text-xs">
              07
            </div>
            <span className="font-semibold text-sm text-slate-900">07 CRM</span>
            <span className="text-xs text-slate-400 ml-1.5 hidden sm:inline">Lead Capture</span>
          </div>

          <a
            href="/dashboard"
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-xs"
          >
            <span>Workspace</span>
            <ArrowRight className="h-3 w-3 text-slate-400" strokeWidth={1.75} />
          </a>
        </div>
      </header>

      {/* Hero & Form Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl grid md:grid-cols-5 gap-6 items-start">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-4 pt-1">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Contact Sales
              </h1>
              <p className="mt-1 text-xs text-slate-500 leading-normal">
                Submit project requirements. Inquiries are automatically scored and assigned to an available representative.
              </p>
            </div>

            {/* Live Scoring Card Preview */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700">
                  Lead Score Preview
                </span>
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded border tabular-nums ${
                    liveScore >= 70
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : liveScore >= 40
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {liveScore} / 100
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mb-2.5">
                <div
                  className="bg-indigo-600 h-full transition-all duration-200"
                  style={{ width: `${liveScore}%` }}
                />
              </div>

              <div className="space-y-1 text-[11px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Phone (+30 pts)</span>
                  <span className={formData.phone?.length >= 7 ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                    {formData.phone?.length >= 7 ? '+30' : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Work Email (+30 pts)</span>
                  <span className={formData.email?.includes('@') && !formData.email?.includes('gmail') ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                    {formData.email?.includes('@') && !formData.email?.includes('gmail') ? '+30' : '+10'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Budget Tier (+15 to +40 pts)</span>
                  <span className={Number(formData.budget) >= 50000 ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                    {Number(formData.budget) >= 50000 ? '+40' : Number(formData.budget) >= 15000 ? '+25' : '+15'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form or Confirmation Screen */}
          <div className="md:col-span-3">
            {submittedData ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5 text-center space-y-4 shadow-xs">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Inquiry Submitted</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    A record for <span className="font-medium text-slate-900">{submittedData.contact.name}</span> has been logged to the database.
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Calculated Score</span>
                    <span className="font-semibold text-emerald-600 tabular-nums">{submittedData.score} / 100</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Assigned Representative</span>
                    <span className="text-slate-900 font-medium">
                      {assignedRep?.full_name || 'Sales Representative'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Company</span>
                    <span className="text-slate-900">{formData.companyName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Initial Stage</span>
                    <span className="font-medium text-indigo-700">New (Lead)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSubmittedData(null)
                      setFormData({
                        fullName: '',
                        email: '',
                        phone: '',
                        companyName: '',
                        budget: '50000',
                        notes: '',
                      })
                    }}
                    className="flex-1 h-9 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700"
                  >
                    Submit Another
                  </button>
                  <a
                    href="/pipeline"
                    className="flex-1 h-9 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white flex items-center justify-center gap-1.5"
                  >
                    <span>View in Pipeline</span>
                    <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-slate-900">Lead Details</h2>
                  <p className="text-[11px] text-slate-500">
                    Provide contact details and project requirements below.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        name="fullName"
                        placeholder="Alex Morgan"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        name="companyName"
                        placeholder="Acme Inc."
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Work Email *</label>
                      <input
                        type="email"
                        required
                        name="email"
                        placeholder="alex@acme.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        name="phone"
                        placeholder="+1 (555) 234-5678"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Estimated Budget (USD)
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full h-9 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    >
                      <option value="10000">$5,000 - $15,000</option>
                      <option value="35000">$15,000 - $50,000</option>
                      <option value="75000">$50,000 - $100,000</option>
                      <option value="150000">$100,000+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      name="notes"
                      placeholder="Requirements or questions..."
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full rounded-md bg-white border border-slate-200 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-9 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <span>Submit Inquiry</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-xs text-slate-400">
        07 CRM &copy; 2026.
      </footer>
    </div>
  )
}
