import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Download,
  Plus,
  Building2,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react'
import { useCRM } from '../context/CRMContext'
import { useToast } from '../context/ToastContext'
import ContactDetailDrawer from '../components/ContactDetailDrawer'
import EmptyState from '../components/EmptyState'

export default function Contacts() {
  const { contacts, accounts, profiles, addContact, profile } = useCRM()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Lead' | 'Customer' | 'Vendor'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCreatingContact, setIsCreatingContact] = useState(false)

  // Add Contact Form State
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    type: 'Lead',
    stage: 'New',
    score: 60,
    deal_value: 25000,
    assigned_to: profile?.id || profiles[0]?.id || '',
  })

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAddModalOpen) {
        setIsAddModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAddModalOpen])

  // Filter contacts by RLS simulator
  const accessibleContacts = contacts.filter((c) => {
    if (profile?.role === 'Admin') return true
    return c.assigned_to === profile?.id || !c.assigned_to
  })

  // Filter by Tab and Search
  const filteredContacts = accessibleContacts.filter((c) => {
    if (activeTab !== 'All' && c.type !== activeTab) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const account = accounts.find((a) => a.id === c.account_id)
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      account?.company_name.toLowerCase().includes(q)
    )
  })

  // Export CSV Handler
  const exportCSV = () => {
    if (filteredContacts.length === 0) {
      addToast('No contacts available to export.', 'info')
      return
    }

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Type', 'Stage', 'Score', 'Deal Value', 'Assigned Rep']
    const rows = filteredContacts.map((c) => {
      const account = accounts.find((a) => a.id === c.account_id)
      const rep = profiles.find((p) => p.id === c.assigned_to)
      return [
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone || ''}"`,
        `"${account?.company_name || ''}"`,
        `"${c.type}"`,
        `"${c.stage}"`,
        c.score,
        c.deal_value || 0,
        `"${rep?.full_name || 'Unassigned'}"`,
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `07_CRM_Contacts_${activeTab}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast(`Exported ${filteredContacts.length} contacts to CSV.`)
  }

  const handleCreateContact = async (e) => {
    e.preventDefault()
    if (isCreatingContact) return
    setIsCreatingContact(true)

    try {
      let accId = null
      if (newContact.companyName.trim()) {
        const existing = accounts.find(
          (a) => a.company_name.toLowerCase() === newContact.companyName.trim().toLowerCase()
        )
        if (existing) {
          accId = existing.id
        }
      }

      await addContact({
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone,
        type: newContact.type,
        stage: newContact.stage,
        score: Number(newContact.score) || 50,
        deal_value: Number(newContact.deal_value) || 0,
        assigned_to: newContact.assigned_to,
        account_id: accId,
      })

      addToast(`Contact "${newContact.name}" added successfully.`)
      setIsAddModalOpen(false)
      setNewContact({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        type: 'Lead',
        stage: 'New',
        score: 60,
        deal_value: 25000,
        assigned_to: profile?.id || profiles[0]?.id || '',
      })
    } catch (err) {
      addToast(err.message || 'Error adding contact.', 'error')
    } finally {
      setIsCreatingContact(false)
    }
  }

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  const getTypeBadge = (type) => {
    if (type === 'Customer') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (type === 'Vendor') return 'bg-slate-100 text-slate-700 border-slate-200'
    return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Contacts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of leads, won customers, and vendors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-slate-100 border border-slate-200">
          {['All', 'Lead', 'Customer', 'Vendor'].map((tab) => {
            const count = accessibleContacts.filter((c) => tab === 'All' || c.type === tab).length
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-7 px-2.5 rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab === 'All' ? 'All' : tab + 's'}</span>
                <span className="text-[10px] text-slate-500 tabular-nums">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 rounded-md bg-white border border-slate-200 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {filteredContacts.length === 0 ? (
            <EmptyState
              title="No contacts found"
              description={searchQuery ? `No results matching "${searchQuery}".` : 'No contacts in this category yet.'}
              actionLabel={searchQuery ? 'Clear Search' : 'Add First Contact'}
              onAction={searchQuery ? () => setSearchQuery('') : () => setIsAddModalOpen(true)}
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Contact & Company</th>
                  <th className="py-2.5 px-4 font-medium">Type</th>
                  <th className="py-2.5 px-4 font-medium">Stage</th>
                  <th className="py-2.5 px-4 font-medium">Score</th>
                  <th className="py-2.5 px-4 font-medium">Deal Value</th>
                  <th className="py-2.5 px-4 font-medium">Assigned Rep</th>
                  <th className="py-2.5 px-4 font-medium text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((contact) => {
                  const account = accounts.find((a) => a.id === contact.account_id)
                  const rep = profiles.find((p) => p.id === contact.assigned_to)

                  return (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-900">{contact.name}</div>
                        <div className="text-[11px] text-slate-500">{account?.company_name || 'Independent'}</div>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getTypeBadge(contact.type)}`}>
                          {contact.type}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="text-slate-700 font-medium">{contact.stage}</span>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border tabular-nums ${getScoreBadge(contact.score)}`}>
                          {contact.score}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 font-medium text-slate-900 tabular-nums">
                        ${Number(contact.deal_value || 0).toLocaleString()}
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={rep?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt="Rep"
                            className="h-4 w-4 rounded-full object-cover border border-slate-200"
                          />
                          <span className="text-slate-700 truncate max-w-[120px]">
                            {rep?.full_name || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-400 inline" strokeWidth={1.75} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Contact Modal with ESC & backdrop dismiss */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-semibold text-slate-900">Add New Contact</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={newContact.companyName}
                    onChange={(e) => setNewContact({ ...newContact, companyName: e.target.value })}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Type</label>
                  <select
                    value={newContact.type}
                    onChange={(e) => setNewContact({ ...newContact, type: e.target.value })}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Customer">Customer</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Stage</label>
                  <select
                    value={newContact.stage}
                    onChange={(e) => setNewContact({ ...newContact, stage: e.target.value })}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Score</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newContact.score}
                    onChange={(e) => setNewContact({ ...newContact, score: e.target.value })}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Deal Value ($)</label>
                  <input
                    type="number"
                    value={newContact.deal_value}
                    onChange={(e) => setNewContact({ ...newContact, deal_value: e.target.value })}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Assigned Sales Rep</label>
                  <select
                    value={newContact.assigned_to}
                    onChange={(e) => setNewContact({ ...newContact, assigned_to: e.target.value })}
                    className="w-full h-8 rounded-md bg-white border border-slate-200 px-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingContact}
                  className="h-8 px-3.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-xs font-medium text-white transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isCreatingContact ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Contact</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Contact Detail Drawer */}
      <ContactDetailDrawer contact={selectedContact} onClose={() => setSelectedContact(null)} />
    </div>
  )
}
