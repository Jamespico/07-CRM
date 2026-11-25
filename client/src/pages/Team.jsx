import React, { useState } from 'react'
import { ShieldCheck, UserCheck, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { useCRM } from '../context/CRMContext'
import { useToast } from '../context/ToastContext'

export default function Team() {
  const { profile, profiles, updateProfileRole, contacts } = useCRM()
  const { addToast } = useToast()
  const [updatingId, setUpdatingId] = useState(null)

  if (profile?.role !== 'Admin') {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center max-w-md mx-auto mt-8">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-slate-900">Admin Permissions Required</h2>
        <p className="text-xs text-slate-600 mt-1">
          You are signed in as a <span className="font-medium text-slate-900">{profile?.role}</span>. Only administrators can view and manage team member roles.
        </p>
      </div>
    )
  }

  const handleRoleToggle = async (userId, currentRole) => {
    const nextRole = currentRole === 'Admin' ? 'Sales Rep' : 'Admin'
    setUpdatingId(userId)
    try {
      await updateProfileRole(userId, nextRole)
      addToast(`Updated member role to ${nextRole}.`)
    } catch (err) {
      addToast(err.message || 'Error updating role.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Team Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization members, assigned accounts, and permissions.
          </p>
        </div>

        <span className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" strokeWidth={1.75} />
          <span>Admin Access Active</span>
        </span>
      </div>

      {/* Team Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {profiles.map((member) => {
          const assignedCount = contacts.filter((c) => c.assigned_to === member.id).length
          const wonCount = contacts.filter((c) => c.assigned_to === member.id && c.stage === 'Won').length
          const wonRevenue = contacts
            .filter((c) => c.assigned_to === member.id && c.stage === 'Won')
            .reduce((acc, c) => acc + (Number(c.deal_value) || 0), 0)

          const isUpdating = updatingId === member.id

          return (
            <div
              key={member.id}
              className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <img
                    src={member.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                    alt={member.full_name}
                    className="h-11 w-11 rounded-full object-cover border border-slate-200"
                  />
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                      member.role === 'Admin'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {member.role}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-xs font-semibold text-slate-900">{member.full_name}</h3>
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3 text-slate-400" strokeWidth={1.75} />
                    <span>{member.email}</span>
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Assigned Accounts:</span>
                    <span className="font-medium text-slate-900 tabular-nums">{assignedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Won Deals:</span>
                    <span className="font-medium text-emerald-600 tabular-nums">{wonCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Won Revenue:</span>
                    <span className="font-medium text-slate-900 tabular-nums">${wonRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100">
                <button
                  disabled={isUpdating}
                  onClick={() => handleRoleToggle(member.id, member.role)}
                  className="w-full h-8 rounded-md text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Set as {member.role === 'Admin' ? 'Sales Rep' : 'Admin'}</span>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
