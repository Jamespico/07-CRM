import React, { useState, useEffect } from 'react'
import {
  GitPullRequest,
  Plus,
  DollarSign,
  User,
  Building2,
  List,
  Columns,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'
import { useCRM } from '../context/CRMContext'
import { useToast } from '../context/ToastContext'
import ContactDetailDrawer from '../components/ContactDetailDrawer'
import EmptyState from '../components/EmptyState'

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost']

export default function Pipeline() {
  const { contacts, accounts, profiles, updateContact, profile } = useCRM()
  const { addToast } = useToast()

  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'list'
  const [selectedContact, setSelectedContact] = useState(null)

  // Stage change modal state
  const [stageChangeModal, setStageChangeModal] = useState(null)
  const [wonValue, setWonValue] = useState('')
  const [lostReason, setLostReason] = useState('')
  const [isUpdatingStage, setIsUpdatingStage] = useState(false)

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && stageChangeModal) {
        setStageChangeModal(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stageChangeModal])

  // RLS filter
  const pipelineContacts = contacts.filter((c) => {
    if (profile?.role === 'Admin') return true
    return c.assigned_to === profile?.id || !c.assigned_to
  })

  const initiateStageChange = async (contact, nextStage) => {
    if (nextStage === 'Won') {
      setWonValue(contact.deal_value || '50000')
      setStageChangeModal({ contact, nextStage })
      return
    }
    if (nextStage === 'Lost') {
      setLostReason('')
      setStageChangeModal({ contact, nextStage })
      return
    }

    try {
      await updateContact(contact.id, { stage: nextStage })
      addToast(`Moved ${contact.name} to ${nextStage}.`)
    } catch (err) {
      addToast(err.message || 'Failed to update stage.', 'error')
    }
  }

  const confirmStageChange = async () => {
    if (!stageChangeModal || isUpdatingStage) return
    const { contact, nextStage } = stageChangeModal
    setIsUpdatingStage(true)

    try {
      if (nextStage === 'Won') {
        await updateContact(contact.id, {
          stage: 'Won',
          type: 'Customer',
          deal_value: Number(wonValue) || 0,
        })
        addToast(`Deal won! ${contact.name} converted to Customer with $${Number(wonValue || 0).toLocaleString()} value.`)
      } else if (nextStage === 'Lost') {
        await updateContact(contact.id, {
          stage: 'Lost',
          lost_reason: lostReason || 'No reason provided.',
        })
        addToast(`Marked ${contact.name} as Lost.`)
      }
      setStageChangeModal(null)
    } catch (err) {
      addToast(err.message || 'Error updating stage.', 'error')
    } finally {
      setIsUpdatingStage(false)
    }
  }

  const getBadgeStyle = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage deal stages. Converting to Won registers customer status; Lost tracks reasons.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-md bg-white border border-slate-200 shadow-xs">
          <button
            onClick={() => setViewMode('kanban')}
            className={`h-7 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
              viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Kanban Board View"
          >
            <Columns className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`h-7 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
              viewMode === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Table List View"
          >
            <List className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = pipelineContacts.filter((c) => c.stage === stage)
            const totalStageValue = stageLeads.reduce((acc, c) => acc + (Number(c.deal_value) || 0), 0)

            return (
              <div
                key={stage}
                className="flex flex-col rounded-lg border border-slate-200 bg-slate-100/70 p-3 min-w-[210px] max-h-[780px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-800">{stage}</span>
                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 tabular-nums">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 mb-2 flex justify-between">
                  <span>Volume:</span>
                  <span className="text-slate-700 font-medium tabular-nums">${totalStageValue.toLocaleString()}</span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                  {stageLeads.map((contact) => {
                    const account = accounts.find((a) => a.id === contact.account_id)
                    const rep = profiles.find((p) => p.id === contact.assigned_to)

                    return (
                      <div
                        key={contact.id}
                        className="rounded-md border border-slate-200 bg-white p-3 hover:border-slate-300 hover:shadow-xs transition-all space-y-2 cursor-pointer shadow-2xs"
                        onClick={() => setSelectedContact(contact)}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-medium text-slate-900 truncate">
                            {contact.name}
                          </h4>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border tabular-nums shrink-0 ${getBadgeStyle(
                              contact.score
                            )}`}
                          >
                            {contact.score}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400 shrink-0" strokeWidth={1.75} />
                          <span className="truncate">{account?.company_name || 'Independent'}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                          <span className="font-semibold text-slate-900 tabular-nums">
                            ${Number(contact.deal_value || 0).toLocaleString()}
                          </span>
                          <img
                            src={rep?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt="Rep"
                            className="h-4.5 w-4.5 rounded-full object-cover border border-slate-200"
                            title={rep?.full_name}
                          />
                        </div>

                        {/* Move stage selector */}
                        <div
                          className="pt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={contact.stage}
                            onChange={(e) => initiateStageChange(contact, e.target.value)}
                            className="w-full h-7 text-[11px] rounded bg-slate-50 border border-slate-200 text-slate-700 px-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                Move: {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })}

                  {stageLeads.length === 0 && (
                    <div className="p-3 rounded border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
          {pipelineContacts.length === 0 ? (
            <EmptyState title="No pipeline contacts" description="No opportunities currently in the sales pipeline." />
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Contact</th>
                  <th className="py-2.5 px-4 font-medium">Stage</th>
                  <th className="py-2.5 px-4 font-medium">Deal Value</th>
                  <th className="py-2.5 px-4 font-medium">Score</th>
                  <th className="py-2.5 px-4 font-medium">Stage Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pipelineContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      <button
                        onClick={() => setSelectedContact(contact)}
                        className="hover:text-indigo-600 text-left font-medium"
                      >
                        {contact.name}
                      </button>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 font-medium text-[11px]">
                        {contact.stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 tabular-nums">
                      ${Number(contact.deal_value || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 tabular-nums">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getBadgeStyle(contact.score)}`}>
                        {contact.score}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <select
                        value={contact.stage}
                        onChange={(e) => initiateStageChange(contact, e.target.value)}
                        className="h-8 text-xs rounded-md bg-white border border-slate-200 text-slate-700 px-2 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Stage Change Modal with Escape & Backdrop dismiss */}
      {stageChangeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setStageChangeModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                {stageChangeModal.nextStage === 'Won' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" strokeWidth={1.75} />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0" strokeWidth={1.75} />
                )}
                <h3 className="text-sm font-semibold text-slate-900">
                  {stageChangeModal.nextStage === 'Won' ? 'Confirm Won Deal Value' : 'Record Lost Reason'}
                </h3>
              </div>
              <button
                onClick={() => setStageChangeModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            {stageChangeModal.nextStage === 'Won' ? (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Moving <span className="font-semibold text-slate-900">{stageChangeModal.contact.name}</span> to Won updates their record type to Customer.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Contract Value ($ USD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={wonValue}
                    onChange={(e) => setWonValue(e.target.value)}
                    className="w-full h-9 rounded-md bg-white border border-slate-200 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Specify why this opportunity with <span className="font-semibold text-slate-900">{stageChangeModal.contact.name}</span> did not close.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Loss Reason *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Budget constraints, opted for incumbent solution..."
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    className="w-full rounded-md bg-white border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStageChangeModal(null)}
                className="h-9 px-3 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStage}
                onClick={confirmStageChange}
                className="h-9 px-3.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isUpdatingStage ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Transition</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Contact Detail Drawer */}
      <ContactDetailDrawer contact={selectedContact} onClose={() => setSelectedContact(null)} />
    </div>
  )
}
