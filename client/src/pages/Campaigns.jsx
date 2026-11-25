import React, { useState } from 'react'
import {
  Megaphone,
  Plus,
  Send,
  Users,
  Eye,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Filter,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { useCRM } from '../context/CRMContext'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/EmptyState'

export default function Campaigns() {
  const { campaigns, campaignLogs, contacts, createCampaign, simulateLogAction } = useCRM()
  const { addToast } = useToast()

  const [isCreating, setIsCreating] = useState(false)
  const [selectedCampaignForLogs, setSelectedCampaignForLogs] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [simulatingLogId, setSimulatingLogId] = useState(null)

  // Split-Screen Designer State
  const [campaignName, setCampaignName] = useState('Product Update & Customer Briefing')
  const [subject, setSubject] = useState('Update on your account: {{name}}')
  const [bodyHtml, setBodyHtml] = useState(
    `<p>Hello {{name}},</p>\n<p>We've added new features to your 07 CRM account. You can review the changes and schedule a walkthrough below.</p>\n<p>Best regards,<br>The 07 CRM Team</p>`
  )
  const [ctaText, setCtaText] = useState('View Details')
  const [ctaUrl, setCtaUrl] = useState('https://07crm.io')
  const [cost, setCost] = useState('1500')

  // Segmentation Filters
  const [segType, setSegType] = useState('Lead')
  const [segStage, setSegStage] = useState('All')
  const [segMinScore, setSegMinScore] = useState(60)

  // Target audience
  const audience = contacts.filter((c) => {
    if (segType !== 'All' && c.type !== segType) return false
    if (segStage !== 'All' && c.stage !== segStage) return false
    if (c.score < segMinScore) return false
    return true
  })

  // Sample recipient for live preview
  const previewRecipient = audience[0] || {
    name: 'Alexander Wright',
    email: 'a.wright@acmelogistics.com',
  }

  const renderedPreviewBody = bodyHtml.replace(
    /\{\{\s*name\s*\}\}/gi,
    `<strong class="text-indigo-600">${previewRecipient.name}</strong>`
  )

  const handleLaunchCampaign = async (e) => {
    e.preventDefault()
    if (audience.length === 0) {
      addToast('Target audience is 0 contacts. Adjust your segmentation filters.', 'error')
      return
    }

    if (isSending) return
    setIsSending(true)

    try {
      await createCampaign({
        name: campaignName,
        segment_filter: { type: segType, stage: segStage, min_score: segMinScore },
        subject,
        body_html: bodyHtml,
        cost: Number(cost) || 0,
        recipients: audience,
      })

      addToast(`Campaign "${campaignName}" dispatched to ${audience.length} contacts!`)
      setIsCreating(false)
    } catch (err) {
      addToast(err.message || 'Error creating campaign.', 'error')
    } finally {
      setIsSending(false)
    }
  }

  const handleSimulateAction = async (logId, action) => {
    setSimulatingLogId(logId + '-' + action)
    try {
      await simulateLogAction(logId, action)
      addToast(`Simulated ${action === 'click' ? 'Click' : 'Open'} event! ROI & rates updated.`)
    } catch (err) {
      addToast(err.message || 'Failed to simulate action.', 'error')
    } finally {
      setSimulatingLogId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Campaigns</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create segmented email campaigns, preview recipient content, and monitor open, click, and ROI metrics.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="h-9 inline-flex items-center gap-1.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors shadow-xs"
        >
          {isCreating ? (
            <span>Close Designer</span>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Create Campaign</span>
            </>
          )}
        </button>
      </div>

      {/* Split-Screen Designer */}
      {isCreating && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-sm font-semibold text-slate-900">Campaign Designer</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Matching Contacts:</span>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium tabular-nums">
                {audience.length}
              </span>
            </div>
          </div>

          {/* Segmentation Filter Bar */}
          <div className="p-3 rounded-md border border-slate-200 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Type</label>
              <select
                value={segType}
                onChange={(e) => setSegType(e.target.value)}
                className="w-full h-8 rounded-md bg-white border border-slate-200 px-2 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              >
                <option value="All">All Contact Types</option>
                <option value="Lead">Leads</option>
                <option value="Customer">Customers</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Pipeline Stage</label>
              <select
                value={segStage}
                onChange={(e) => setSegStage(e.target.value)}
                className="w-full h-8 rounded-md bg-white border border-slate-200 px-2 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              >
                <option value="All">All Stages</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Minimum Score: <span className="text-slate-900 font-semibold">{segMinScore}</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={segMinScore}
                onChange={(e) => setSegMinScore(Number(e.target.value))}
                className="w-full accent-indigo-600 mt-1"
              />
            </div>
          </div>

          {/* Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Input Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subject Line (Supports <code className="text-indigo-600">{'{{name}}'}</code>) *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Body HTML (Supports <code className="text-indigo-600">{'{{name}}'}</code>) *
                </label>
                <textarea
                  rows={5}
                  required
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  className="w-full rounded-md bg-white border border-slate-200 p-2.5 text-xs text-slate-900 font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cost ($)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isSending}
                onClick={handleLaunchCampaign}
                className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                    <span>Dispatching Campaign...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Send to {audience.length} Contacts</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Live Preview */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs text-slate-500">
                  <span className="font-medium text-[11px]">Email Preview</span>
                  <span>Recipient: {previewRecipient.name}</span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="text-xs">
                    <span className="text-slate-400">From: </span>
                    <span className="text-slate-700">07 CRM &lt;campaigns@resend.dev&gt;</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400">Subject: </span>
                    <span className="text-slate-900 font-medium">
                      {subject.replace(/\{\{\s*name\s*\}\}/gi, previewRecipient.name)}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed bg-white p-3 rounded border border-slate-200">
                    <div dangerouslySetInnerHTML={{ __html: renderedPreviewBody }} />

                    {ctaText && (
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1.5 rounded bg-indigo-600 text-white font-medium text-xs">
                          {ctaText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                Connected to Edge Function / Resend API
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900">Campaign Performance</h3>
          <span className="text-xs text-slate-500 tabular-nums">{campaigns.length} campaigns</span>
        </div>

        <div className="overflow-x-auto">
          {campaigns.length === 0 ? (
            <EmptyState
              title="No campaigns created"
              description="Create your first campaign to nurture leads and track open/click ROI."
              actionLabel="Create Campaign"
              onAction={() => setIsCreating(true)}
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Campaign Name</th>
                  <th className="py-2.5 px-4 font-medium">Sent</th>
                  <th className="py-2.5 px-4 font-medium">Open Rate</th>
                  <th className="py-2.5 px-4 font-medium">Click Rate</th>
                  <th className="py-2.5 px-4 font-medium">Cost</th>
                  <th className="py-2.5 px-4 font-medium">Attributed Rev</th>
                  <th className="py-2.5 px-4 font-medium">ROI</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((camp) => {
                  const logs = campaignLogs.filter((l) => l.campaign_id === camp.id)
                  const totalSent = logs.length
                  const totalOpened = logs.filter((l) => l.opened).length
                  const totalClicked = logs.filter((l) => l.clicked).length

                  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0
                  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0

                  const costNum = Number(camp.cost) || 1
                  const revNum = Number(camp.attributed_revenue) || 0
                  const roi = Math.round(((revNum - costNum) / costNum) * 100)

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">{camp.name}</div>
                        <div className="text-[11px] text-slate-500 tabular-nums">{new Date(camp.created_at).toLocaleDateString()}</div>
                      </td>

                      <td className="py-2.5 px-4 tabular-nums text-slate-700">{totalSent}</td>

                      <td className="py-2.5 px-4 tabular-nums">
                        <span className="font-medium text-slate-900">{openRate}%</span>
                        <span className="text-[10px] text-slate-400 ml-1">({totalOpened})</span>
                      </td>

                      <td className="py-2.5 px-4 tabular-nums">
                        <span className="font-medium text-indigo-600">{clickRate}%</span>
                        <span className="text-[10px] text-slate-400 ml-1">({totalClicked})</span>
                      </td>

                      <td className="py-2.5 px-4 text-slate-700 tabular-nums">${costNum.toLocaleString()}</td>

                      <td className="py-2.5 px-4 font-medium text-emerald-600 tabular-nums">${revNum.toLocaleString()}</td>

                      <td className="py-2.5 px-4 tabular-nums">
                        <span
                          className={`font-medium px-1.5 py-0.5 rounded border text-[11px] ${
                            roi > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          +{roi}%
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() =>
                            setSelectedCampaignForLogs(selectedCampaignForLogs?.id === camp.id ? null : camp)
                          }
                          className="h-7 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
                        >
                          {selectedCampaignForLogs?.id === camp.id ? 'Hide Logs' : 'View Logs'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Campaign Logs Simulation Deck */}
      {selectedCampaignForLogs && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Campaign Logs: {selectedCampaignForLogs.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Simulate recipient open or click actions to verify live stat recalculations.
              </p>
            </div>
            <button
              onClick={() => setSelectedCampaignForLogs(null)}
              className="text-xs text-slate-500 hover:text-slate-700 font-medium"
            >
              Close
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {campaignLogs
              .filter((l) => l.campaign_id === selectedCampaignForLogs.id)
              .map((log) => {
                const contact = contacts.find((c) => c.id === log.contact_id)
                const isOpenLoading = simulatingLogId === `${log.id}-open`
                const isClickLoading = simulatingLogId === `${log.id}-click`

                return (
                  <div key={log.id} className="py-2 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 text-xs">
                        {contact?.name || 'Contact #' + log.contact_id.slice(0, 6)}
                      </div>
                      <div className="text-[11px] text-slate-500">{contact?.email}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                          log.opened
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {log.opened ? 'Opened' : 'Unopened'}
                      </span>

                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                          log.clicked
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {log.clicked ? 'Clicked' : 'No Click'}
                      </span>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          disabled={log.opened || Boolean(simulatingLogId)}
                          onClick={() => handleSimulateAction(log.id, 'open')}
                          className="h-7 px-2 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-[11px] text-slate-700 font-medium inline-flex items-center gap-1"
                        >
                          {isOpenLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                          <span>Simulate Open</span>
                        </button>
                        <button
                          disabled={log.clicked || Boolean(simulatingLogId)}
                          onClick={() => handleSimulateAction(log.id, 'click')}
                          className="h-7 px-2 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-[11px] text-indigo-600 font-medium inline-flex items-center gap-1"
                        >
                          {isClickLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                          <span>Simulate Click</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
