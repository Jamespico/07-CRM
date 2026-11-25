import React, { useState, useEffect } from 'react'
import {
  X,
  Phone,
  Mail,
  FileText,
  Building2,
  Calendar,
  Send,
  Award,
  AlertTriangle,
  Loader2,
  Clock,
  CalendarCheck,
} from 'lucide-react'
import { useCRM } from '../context/CRMContext'
import { useToast } from '../context/ToastContext'

export default function ContactDetailDrawer({ contact, onClose }) {
  const { accounts, profiles, activities, addActivity } = useCRM()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('activity') // 'activity' | 'appointment'
  const [activityType, setActivityType] = useState('Call')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Appointment Booking form state
  const [appointmentTitle, setAppointmentTitle] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('10:00')
  const [isBooking, setIsBooking] = useState(false)

  // Handle ESC key to close drawer cleanly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!contact) return null

  const account = accounts.find((a) => a.id === contact.account_id)
  const rep = profiles.find((p) => p.id === contact.assigned_to)
  const contactActivities = activities
    .filter((a) => a.contact_id === contact.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const handleAddActivity = async (e) => {
    e.preventDefault()
    if (!notes.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await addActivity({
        contact_id: contact.id,
        type: activityType,
        notes: notes.trim(),
      })
      setNotes('')
      addToast(`${activityType} activity logged successfully.`)
    } catch (err) {
      addToast(err.message || 'Failed to log activity.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBookAppointment = async (e) => {
    e.preventDefault()
    if (!appointmentTitle.trim() || !appointmentDate || isBooking) return
    setIsBooking(true)
    try {
      const scheduledDateTime = `${appointmentDate} at ${appointmentTime}`
      await addActivity({
        contact_id: contact.id,
        type: 'Note',
        notes: `Scheduled appointment: "${appointmentTitle.trim()}" for ${scheduledDateTime}`,
      })
      setAppointmentTitle('')
      setAppointmentDate('')
      addToast(`Appointment booked for ${scheduledDateTime}`)
      setActiveTab('activity')
    } catch (err) {
      addToast(err.message || 'Failed to book appointment.', 'error')
    } finally {
      setIsBooking(false)
    }
  }

  const getTypeBadge = (type) => {
    if (type === 'Customer') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (type === 'Vendor') return 'bg-slate-100 text-slate-700 border-slate-200'
    return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Contact Details"
    >
      <div
        className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
              {contact.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">{contact.name}</h2>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getTypeBadge(contact.type)}`}>
                  {contact.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                <span>{account?.company_name || 'Individual Prospect'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none transition-colors"
            aria-label="Close drawer (Escape)"
            title="Close (Escape)"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-center">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Score</span>
              <div className="mt-1 flex items-center justify-center gap-1 font-semibold text-slate-900 text-sm tabular-nums">
                <Award className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                <span>{contact.score}</span>
                <span className="text-xs font-normal text-slate-400">/100</span>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-center">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Stage</span>
              <div className="mt-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-700">
                  {contact.stage}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-center">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Deal Value</span>
              <div className="mt-1 text-xs font-semibold text-emerald-600 tabular-nums">
                ${Number(contact.deal_value || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Lost reason */}
          {contact.stage === 'Lost' && contact.lost_reason && (
            <div className="p-3 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" strokeWidth={1.75} />
              <div>
                <span className="font-medium block">Reason Lost:</span>
                <span>{contact.lost_reason}</span>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="rounded-md border border-slate-200 p-3.5 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-900">Contact Information</h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Email</span>
                <span className="text-slate-800 font-medium flex items-center gap-1.5 truncate mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                  {contact.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Phone</span>
                <span className="text-slate-800 font-medium flex items-center gap-1.5 truncate mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                  {contact.phone || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Sales Representative</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <img
                    src={rep?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="rep"
                    className="h-4 w-4 rounded-full object-cover border border-slate-200"
                  />
                  <span className="text-slate-800 font-medium truncate">{rep?.full_name || 'Unassigned'}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Added Date</span>
                <span className="text-slate-600 flex items-center gap-1.5 mt-0.5 tabular-nums">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                  {new Date(contact.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Interaction Box with Tabs: Log Activity vs Book Appointment */}
          <div className="rounded-md border border-slate-200 p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                    activeTab === 'activity'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Log Activity
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('appointment')}
                  className={`text-xs font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1 ${
                    activeTab === 'appointment'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CalendarCheck className="h-3 w-3" strokeWidth={1.75} />
                  <span>Book Appointment</span>
                </button>
              </div>
            </div>

            {activeTab === 'activity' ? (
              <form onSubmit={handleAddActivity} className="space-y-2.5">
                <div className="flex gap-2">
                  {['Call', 'Email', 'Note'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActivityType(type)}
                      className={`flex-1 h-8 rounded-md text-xs font-medium border transition-colors ${
                        activityType === type
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={2}
                  placeholder={`Notes for this ${activityType.toLowerCase()}...`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-md bg-white border border-slate-200 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || !notes.trim()}
                  className="h-8 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                      <span>Saving Activity...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>Save {activityType}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Meeting Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discovery Call or Product Demo"
                    value={appointmentTitle}
                    onChange={(e) => setAppointmentTitle(e.target.value)}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full h-8 rounded-md bg-white border border-slate-200 px-2 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Time</label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full h-8 rounded-md bg-white border border-slate-200 px-2 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBooking || !appointmentTitle.trim() || !appointmentDate}
                  className="h-8 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                      <span>Scheduling Appointment...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>Confirm Appointment</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Activity Timeline */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-2.5">
              Activity History ({contactActivities.length})
            </h4>

            {contactActivities.length === 0 ? (
              <p className="text-xs text-slate-400">No activities logged yet.</p>
            ) : (
              <div className="space-y-2">
                {contactActivities.map((act) => {
                  const actUser = profiles.find((p) => p.id === act.user_id)
                  const isScheduled = act.notes.startsWith('Scheduled appointment:')

                  return (
                    <div
                      key={act.id}
                      className="rounded-md border border-slate-200 bg-slate-50/50 p-3 flex items-start gap-2.5"
                    >
                      <div className="h-6 w-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        {isScheduled ? (
                          <CalendarCheck className="h-3.5 w-3.5 text-indigo-600" strokeWidth={1.75} />
                        ) : act.type === 'Call' ? (
                          <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                        ) : act.type === 'Email' ? (
                          <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                        ) : (
                          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-800">
                            {isScheduled ? 'Appointment' : act.type}
                          </span>
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            {new Date(act.created_at).toLocaleDateString()}{' '}
                            {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-normal">{act.notes}</p>
                        {actUser && (
                          <span className="text-[11px] text-slate-400 mt-0.5 block">Logged by {actUser.full_name}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
