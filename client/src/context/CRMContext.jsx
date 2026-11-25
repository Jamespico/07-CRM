import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import {
  INITIAL_PROFILES,
  INITIAL_ACCOUNTS,
  INITIAL_CONTACTS,
  INITIAL_ACTIVITIES,
  INITIAL_CAMPAIGNS,
  INITIAL_CAMPAIGN_LOGS,
} from '../data/seedData'

const CRMContext = createContext(null)

export function CRMProvider({ children }) {
  // Current user / profile
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Data states
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('07_profiles')
    return saved ? JSON.parse(saved) : INITIAL_PROFILES
  })
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('07_accounts')
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS
  })
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('07_contacts')
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS
  })
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('07_activities')
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES
  })
  const [campaigns, setCampaigns] = useState(() => {
    const saved = localStorage.getItem('07_campaigns')
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS
  })
  const [campaignLogs, setCampaignLogs] = useState(() => {
    const saved = localStorage.getItem('07_campaign_logs')
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGN_LOGS
  })

  // Round-robin index for sales reps
  const [rrIndex, setRrIndex] = useState(0)

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('07_profiles', JSON.stringify(profiles))
  }, [profiles])
  useEffect(() => {
    localStorage.setItem('07_accounts', JSON.stringify(accounts))
  }, [accounts])
  useEffect(() => {
    localStorage.setItem('07_contacts', JSON.stringify(contacts))
  }, [contacts])
  useEffect(() => {
    localStorage.setItem('07_activities', JSON.stringify(activities))
  }, [activities])
  useEffect(() => {
    localStorage.setItem('07_campaigns', JSON.stringify(campaigns))
  }, [campaigns])
  useEffect(() => {
    localStorage.setItem('07_campaign_logs', JSON.stringify(campaignLogs))
  }, [campaignLogs])

  // Handle Supabase Auth or Local Demo Auth
  useEffect(() => {
    if (!isConfigured) {
      // Demo mode fallback: Default to Admin profile (Elena Rostova)
      const demoUser = {
        id: 'd1111111-1111-1111-1111-111111111111',
        email: 'elena.rostova@07crm.io',
      }
      setUser(demoUser)
      setProfile(profiles[0] || INITIAL_PROFILES[0])
      setAuthLoading(false)
      return
    }

    // Supabase Auth listener
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user.email)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Auth getSession error:', err)
      } finally {
        setAuthLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user.email)
        } else {
          setUser(null)
          setProfile(null)
        }
        setAuthLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const fetchProfile = async (userId, userEmail) => {
    if (!isConfigured) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile(data)
      } else {
        // Fallback default
        setProfile({
          id: userId,
          full_name: userEmail.split('@')[0],
          email: userEmail,
          role: 'Sales Rep',
        })
      }
    } catch (e) {
      console.warn('Could not fetch remote profile:', e)
    }
  }

  // Quick switch role / user for testing permissions smoothly
  const switchDemoUser = (repId) => {
    const selected = profiles.find((p) => p.id === repId)
    if (selected) {
      setUser({ id: selected.id, email: selected.email })
      setProfile(selected)
    }
  }

  const login = async (email, password) => {
    if (!isConfigured) {
      // Find matching demo profile or pick first
      const found = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) || profiles[0]
      setUser({ id: found.id, email: found.email })
      setProfile(found)
      return { success: true }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signup = async (email, password, fullName, role = 'Sales Rep') => {
    if (!isConfigured) {
      const newProfile = {
        id: 'u-' + Date.now(),
        full_name: fullName,
        email,
        role,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
      }
      setProfiles((prev) => [...prev, newProfile])
      setUser({ id: newProfile.id, email: newProfile.email })
      setProfile(newProfile)
      return { success: true }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    if (isConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setProfile(null)
  }

  // Round-robin Rep Assignment logic
  const getNextSalesRep = () => {
    const reps = profiles.filter((p) => p.role === 'Sales Rep')
    if (reps.length === 0) return profiles[0]?.id || null
    const chosen = reps[rrIndex % reps.length]
    setRrIndex((prev) => prev + 1)
    return chosen.id
  }

  // Lead Score Calculator (0-100)
  const calculateLeadScore = ({ email, phone, budget, companyName }) => {
    let score = 0
    // Phone provided: +30
    if (phone && phone.trim().length >= 7) {
      score += 30
    }
    // Work email (not gmail/yahoo/hotmail/outlook): +30
    if (email) {
      const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
      const domain = email.split('@')[1]?.toLowerCase()
      if (domain && !freeDomains.includes(domain)) {
        score += 30
      } else {
        score += 10
      }
    }
    // Estimated budget:
    const numBudget = Number(budget) || 0
    if (numBudget >= 50000) {
      score += 40
    } else if (numBudget >= 15000) {
      score += 25
    } else if (numBudget > 0) {
      score += 15
    }

    // Company Name provided
    if (companyName && companyName.trim().length > 2) {
      // capped at 100
    }

    return Math.min(100, Math.max(0, score))
  }

  // Public Lead Capture Handler
  const capturePublicLead = async ({ fullName, email, phone, companyName, budget, notes }) => {
    const score = calculateLeadScore({ email, phone, budget, companyName })
    const assignedRepId = getNextSalesRep()
    const dealVal = Number(budget) || 0

    // Find or create account
    let account = accounts.find(
      (a) => a.company_name.toLowerCase() === companyName.trim().toLowerCase()
    )
    if (!account) {
      account = {
        id: 'a-' + Date.now(),
        company_name: companyName.trim(),
        industry: 'General Commercial',
        website: `https://${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        created_at: new Date().toISOString(),
      }
      setAccounts((prev) => [...prev, account])
      if (isConfigured) {
        supabase.from('accounts').insert(account).then()
      }
    }

    // Create contact
    const newContact = {
      id: 'c-' + Date.now(),
      account_id: account.id,
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      type: 'Lead',
      stage: 'New',
      score: score,
      deal_value: dealVal,
      lost_reason: null,
      assigned_to: assignedRepId,
      created_at: new Date().toISOString(),
    }

    setContacts((prev) => [newContact, ...prev])

    // Log initial Welcome Email activity
    const welcomeActivity = {
      id: 'b-' + Date.now(),
      contact_id: newContact.id,
      user_id: assignedRepId,
      type: 'Email',
      notes: `Automated welcome email sent to ${email}. Lead captured with initial score of ${score}/100. Notes: "${notes || 'No extra notes'}"`,
      created_at: new Date().toISOString(),
    }
    setActivities((prev) => [welcomeActivity, ...prev])

    if (isConfigured) {
      supabase.from('contacts').insert(newContact).then()
      supabase.from('activities').insert(welcomeActivity).then()
    }

    return { contact: newContact, score, assignedRepId }
  }

  // Update Contact (Stage, Won, Lost, etc.)
  const updateContact = async (contactId, updates) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, ...updates } : c))
    )
    if (isConfigured) {
      await supabase.from('contacts').update(updates).eq('id', contactId)
    }
  }

  // Add Contact manually
  const addContact = async (contactData) => {
    const newContact = {
      id: 'c-' + Date.now(),
      created_at: new Date().toISOString(),
      score: contactData.score ?? 50,
      deal_value: Number(contactData.deal_value) || 0,
      stage: contactData.stage || 'New',
      type: contactData.type || 'Lead',
      ...contactData,
    }
    setContacts((prev) => [newContact, ...prev])
    if (isConfigured) {
      await supabase.from('contacts').insert(newContact)
    }
    return newContact
  }

  // Delete Contact
  const deleteContact = async (contactId) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId))
    setActivities((prev) => prev.filter((a) => a.contact_id !== contactId))
    if (isConfigured) {
      await supabase.from('contacts').delete().eq('id', contactId)
    }
  }

  // Add Activity
  const addActivity = async ({ contact_id, type, notes }) => {
    const newAct = {
      id: 'b-' + Date.now(),
      contact_id,
      user_id: profile?.id || null,
      type,
      notes,
      created_at: new Date().toISOString(),
    }
    setActivities((prev) => [newAct, ...prev])
    if (isConfigured) {
      await supabase.from('activities').insert(newAct)
    }
    return newAct
  }

  // Add Campaign and Dispatch
  const createCampaign = async ({ name, segment_filter, subject, body_html, cost, recipients }) => {
    const campaignId = 'e-' + Date.now()
    const newCampaign = {
      id: campaignId,
      name,
      segment_filter,
      subject,
      body_html,
      cost: Number(cost) || 0,
      attributed_revenue: 0,
      created_at: new Date().toISOString(),
    }

    setCampaigns((prev) => [newCampaign, ...prev])

    // Generate campaign logs for recipients
    const newLogs = recipients.map((r, i) => ({
      id: `f-${Date.now()}-${i}`,
      campaign_id: campaignId,
      contact_id: r.id,
      status: 'Sent',
      opened: false,
      clicked: false,
      sent_at: new Date().toISOString(),
    }))

    setCampaignLogs((prev) => [...newLogs, ...prev])

    if (isConfigured) {
      await supabase.from('campaigns').insert(newCampaign)
      await supabase.from('campaign_logs').insert(newLogs)
    }

    return { campaign: newCampaign, dispatchedCount: newLogs.length }
  }

  // Simulate Open and Click
  const simulateLogAction = async (logId, actionType) => {
    setCampaignLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          if (actionType === 'open') {
            return { ...log, opened: true }
          }
          if (actionType === 'click') {
            return { ...log, opened: true, clicked: true }
          }
        }
        return log
      })
    )

    // Also update attributed revenue on campaign if a click occurred
    if (actionType === 'click') {
      const targetLog = campaignLogs.find((l) => l.id === logId)
      if (targetLog) {
        setCampaigns((prev) =>
          prev.map((camp) => {
            if (camp.id === targetLog.campaign_id) {
              const boost = Math.floor(Math.random() * 8000) + 2000
              return { ...camp, attributed_revenue: Number(camp.attributed_revenue || 0) + boost }
            }
            return camp
          })
        )
      }
    }

    if (isConfigured) {
      const updates = actionType === 'click' ? { opened: true, clicked: true } : { opened: true }
      await supabase.from('campaign_logs').update(updates).eq('id', logId)
    }
  }

  // Update profile role (Admin only)
  const updateProfileRole = async (targetId, newRole) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === targetId ? { ...p, role: newRole } : p))
    )
    if (profile?.id === targetId) {
      setProfile((prev) => ({ ...prev, role: newRole }))
    }
    if (isConfigured) {
      await supabase.from('profiles').update({ role: newRole }).eq('id', targetId)
    }
  }

  // Reset demo data
  const resetDemoData = () => {
    localStorage.removeItem('07_profiles')
    localStorage.removeItem('07_accounts')
    localStorage.removeItem('07_contacts')
    localStorage.removeItem('07_activities')
    localStorage.removeItem('07_campaigns')
    localStorage.removeItem('07_campaign_logs')
    setProfiles(INITIAL_PROFILES)
    setAccounts(INITIAL_ACCOUNTS)
    setContacts(INITIAL_CONTACTS)
    setActivities(INITIAL_ACTIVITIES)
    setCampaigns(INITIAL_CAMPAIGNS)
    setCampaignLogs(INITIAL_CAMPAIGN_LOGS)
    setProfile(INITIAL_PROFILES[0])
    setUser({ id: INITIAL_PROFILES[0].id, email: INITIAL_PROFILES[0].email })
  }

  const value = {
    user,
    profile,
    authLoading,
    profiles,
    accounts,
    contacts,
    activities,
    campaigns,
    campaignLogs,
    isConfigured,
    login,
    signup,
    logout,
    switchDemoUser,
    capturePublicLead,
    calculateLeadScore,
    updateContact,
    addContact,
    deleteContact,
    addActivity,
    createCampaign,
    simulateLogAction,
    updateProfileRole,
    resetDemoData,
  }

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>
}

export function useCRM() {
  const context = useContext(CRMContext)
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider')
  }
  return context
}
