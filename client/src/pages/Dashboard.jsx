import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  DollarSign,
  Users,
  Award,
  Download,
  Filter,
  Layers,
  RotateCcw,
  Inbox,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { useCRM } from '../context/CRMContext'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/EmptyState'
import { KPICardSkeleton, ChartSkeleton } from '../components/Skeletons'

export default function Dashboard() {
  const { contacts, activities, campaigns, campaignLogs, profiles, accounts } = useCRM()
  const { addToast } = useToast()

  // 3 Global filters
  const [dateRange, setDateRange] = useState('all') // '7' | '30' | '90' | 'all'
  const [selectedRep, setSelectedRep] = useState('all') // 'all' | repId
  const [selectedType, setSelectedType] = useState('all') // 'all' | 'Lead' | 'Customer' | 'Vendor'

  const hasActiveFilters = dateRange !== 'all' || selectedRep !== 'all' || selectedType !== 'all'

  const resetFilters = () => {
    setDateRange('all')
    setSelectedRep('all')
    setSelectedType('all')
    addToast('Filters reset to default.')
  }

  // Global Filter Logic applied across ALL 4 charts and summary cards
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // 1. Date Range
      if (dateRange !== 'all') {
        const days = Number(dateRange)
        const contactDate = new Date(c.created_at).getTime()
        const cutoff = Date.now() - days * 86400000
        if (contactDate < cutoff) return false
      }
      // 2. Sales Rep
      if (selectedRep !== 'all' && c.assigned_to !== selectedRep) {
        return false
      }
      // 3. Contact Type
      if (selectedType !== 'all' && c.type !== selectedType) {
        return false
      }
      return true
    })
  }, [contacts, dateRange, selectedRep, selectedType])

  const filteredContactIds = useMemo(() => {
    return new Set(filteredContacts.map((c) => c.id))
  }, [filteredContacts])

  // Summary Metrics
  const totalPipelineValue = useMemo(() => {
    return filteredContacts.reduce((acc, c) => acc + (Number(c.deal_value) || 0), 0)
  }, [filteredContacts])

  const wonCustomers = useMemo(() => {
    return filteredContacts.filter((c) => c.stage === 'Won')
  }, [filteredContacts])

  const wonRevenue = useMemo(() => {
    return wonCustomers.reduce((acc, c) => acc + (Number(c.deal_value) || 0), 0)
  }, [wonCustomers])

  const averageLeadScore = useMemo(() => {
    if (filteredContacts.length === 0) return 0
    const sum = filteredContacts.reduce((acc, c) => acc + (c.score || 0), 0)
    return Math.round(sum / filteredContacts.length)
  }, [filteredContacts])

  // CHART 1: Sales Funnel (Bar chart of leads by stage)
  const funnelData = useMemo(() => {
    const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost']
    return stages.map((st) => {
      const stageMatches = filteredContacts.filter((c) => c.stage === st)
      const count = stageMatches.length
      const value = stageMatches.reduce((acc, c) => acc + (Number(c.deal_value) || 0), 0)
      return { stage: st, count, value }
    })
  }, [filteredContacts])

  // CHART 2: Activities by Rep
  const repActivitiesData = useMemo(() => {
    const relevantActivities = activities.filter((a) => filteredContactIds.has(a.contact_id))
    const repsToInclude = selectedRep === 'all' ? profiles : profiles.filter((p) => p.id === selectedRep)

    return repsToInclude.map((rep) => {
      const repActs = relevantActivities.filter((a) => a.user_id === rep.id)
      const calls = repActs.filter((a) => a.type === 'Call').length
      const emails = repActs.filter((a) => a.type === 'Email').length
      const notes = repActs.filter((a) => a.type === 'Note').length
      return {
        name: rep.full_name.split(' ')[0],
        Calls: calls,
        Emails: emails,
        Notes: notes,
        Total: calls + emails + notes,
      }
    })
  }, [activities, filteredContactIds, profiles, selectedRep])

  // CHART 3: Campaign Performance
  const campaignChartData = useMemo(() => {
    return campaigns.map((camp) => {
      const logs = campaignLogs.filter(
        (l) => l.campaign_id === camp.id && (filteredContactIds.has(l.contact_id) || selectedType === 'all')
      )
      const opens = logs.filter((l) => l.opened).length
      const clicks = logs.filter((l) => l.clicked).length
      const cost = Number(camp.cost) || 1
      const rev = Number(camp.attributed_revenue) || 0
      const roi = Math.round(((rev - cost) / cost) * 100)
      return {
        name: camp.name.length > 15 ? camp.name.substring(0, 15) + '...' : camp.name,
        Opens: opens,
        Clicks: clicks,
        ROI: roi,
      }
    })
  }, [campaigns, campaignLogs, filteredContactIds, selectedType])

  // CHART 4: Revenue by Sales Rep
  const salesCustomerPerformance = useMemo(() => {
    const repsToInclude = selectedRep === 'all' ? profiles : profiles.filter((p) => p.id === selectedRep)

    return repsToInclude.map((rep) => {
      const repWon = wonCustomers.filter((c) => c.assigned_to === rep.id)
      const totalRev = repWon.reduce((acc, c) => acc + (Number(c.deal_value) || 0), 0)
      return {
        repId: rep.id,
        name: rep.full_name,
        wonCount: repWon.length,
        totalRevenue: totalRev,
      }
    })
  }, [profiles, selectedRep, wonCustomers])

  // Export Customer Listing CSV
  const exportWonCustomersCSV = () => {
    if (wonCustomers.length === 0) {
      addToast('No won customers available to export with current filters.', 'info')
      return
    }

    const headers = ['Customer Name', 'Account / Company', 'Assigned Sales Rep', 'Contract Value ($)', 'Won Date']
    const rows = wonCustomers.map((c) => {
      const acc = accounts.find((a) => a.id === c.account_id)
      const rep = profiles.find((p) => p.id === c.assigned_to)
      return [
        `"${c.name}"`,
        `"${acc?.company_name || 'Independent'}"`,
        `"${rep?.full_name || 'Unassigned'}"`,
        c.deal_value || 0,
        `"${new Date(c.created_at).toLocaleDateString()}"`,
      ]
    })
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `07_CRM_Won_Customers_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast(`Exported ${wonCustomers.length} won customers to CSV.`)
  }

  const chartTooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    fontSize: '12px',
    color: '#0f172a',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Overview of sales performance, pipeline status, and activities.</p>
        </div>

        <button
          onClick={exportWonCustomersCSV}
          className="h-9 inline-flex items-center gap-1.5 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
          <span>Export Won Customers CSV</span>
        </button>
      </div>

      {/* 3 Global Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Filters ({filteredContacts.length} matching)</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-9 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="7">Past 7 Days</option>
              <option value="30">Past 30 Days</option>
              <option value="90">Past 90 Days</option>
            </select>
          </div>

          {/* Sales Rep */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Sales Representative</label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="w-full h-9 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            >
              <option value="all">All Sales Representatives</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          {/* Contact Type */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-9 rounded-md bg-white border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="Lead">Leads</option>
              <option value="Customer">Customers</option>
              <option value="Vendor">Vendors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pipeline Value</span>
            <DollarSign className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="mt-2">
            <div className="text-xl font-semibold text-slate-900 tabular-nums">
              ${totalPipelineValue.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">{filteredContacts.length} contacts</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Closed Revenue</span>
            <TrendingUp className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="mt-2">
            <div className="text-xl font-semibold text-emerald-600 tabular-nums">
              ${wonRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">{wonCustomers.length} won deals</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Lead Score</span>
            <Award className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="mt-2">
            <div className="text-xl font-semibold text-slate-900 tabular-nums">
              {averageLeadScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Calculated score</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Activities Logged</span>
            <Layers className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="mt-2">
            <div className="text-xl font-semibold text-slate-900 tabular-nums">
              {activities.filter((a) => filteredContactIds.has(a.contact_id)).length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Calls, Emails, & Notes</p>
          </div>
        </div>
      </div>

      {/* 4 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1: Sales Funnel */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Sales Funnel</h3>
              <p className="text-[11px] text-slate-500">Number of contacts per pipeline stage</p>
            </div>
          </div>

          <div className="h-60 w-full mt-2">
            {filteredContacts.length === 0 ? (
              <EmptyState title="No pipeline data" description="Adjust filters to view sales funnel breakdown." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="stage" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(val, name) => [name === 'count' ? `${val} contacts` : `$${Number(val).toLocaleString()}`, name === 'count' ? 'Count' : 'Deal Value']}
                  />
                  <Bar dataKey="count" name="Count" fill="#4338ca" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 2: Activities by Rep */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Activities by Sales Rep</h3>
              <p className="text-[11px] text-slate-500">Distribution of calls, emails, and notes</p>
            </div>
          </div>

          <div className="h-60 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repActivitiesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="Calls" stackId="a" fill="#6366f1" />
                <Bar dataKey="Emails" stackId="a" fill="#94a3b8" />
                <Bar dataKey="Notes" stackId="a" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Campaign Performance */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Campaign Performance</h3>
              <p className="text-[11px] text-slate-500">Recipient opens vs clicks</p>
            </div>
          </div>

          <div className="h-60 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="Opens" fill="#4338ca" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Clicks" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Revenue by Sales Rep */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Revenue by Sales Rep</h3>
              <p className="text-[11px] text-slate-500">Won deal value generated</p>
            </div>
            <span className="text-xs font-semibold text-slate-900 tabular-nums">
              ${wonRevenue.toLocaleString()} Total
            </span>
          </div>

          <div className="h-60 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesCustomerPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Closed Revenue']}
                />
                <Bar dataKey="totalRevenue" fill="#4338ca" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Won Customers Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900">Won Customers ({wonCustomers.length})</h3>
          <button
            onClick={exportWonCustomersCSV}
            className="h-7 inline-flex items-center gap-1 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors shadow-xs"
          >
            <Download className="h-3 w-3 text-slate-400" strokeWidth={1.75} />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {wonCustomers.length === 0 ? (
            <EmptyState
              title="No won deals"
              description="No customers match your active filter criteria."
              actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Customer</th>
                  <th className="py-2.5 px-4 font-medium">Company</th>
                  <th className="py-2.5 px-4 font-medium">Sales Rep</th>
                  <th className="py-2.5 px-4 font-medium">Deal Value</th>
                  <th className="py-2.5 px-4 font-medium">Won Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wonCustomers.map((cust) => {
                  const acc = accounts.find((a) => a.id === cust.account_id)
                  const rep = profiles.find((p) => p.id === cust.assigned_to)
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-900">{cust.name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{acc?.company_name || 'Independent'}</td>
                      <td className="py-2.5 px-4 text-slate-600">{rep?.full_name || 'Unassigned'}</td>
                      <td className="py-2.5 px-4 font-medium text-emerald-600 tabular-nums">
                        ${Number(cust.deal_value || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 tabular-nums">
                        {new Date(cust.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
