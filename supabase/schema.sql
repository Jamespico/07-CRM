-- ==============================================================================
-- 07 CRM DATABASE SCHEMA
-- Tables: profiles, accounts, contacts, activities, campaigns, campaign_logs
-- Includes Row-Level Security (RLS) policies for 'Admin' and 'Sales Rep'
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Sales Rep')) DEFAULT 'Sales Rep',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Create ACCOUNTS Table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Create CONTACTS Table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    type TEXT NOT NULL CHECK (type IN ('Lead', 'Customer', 'Vendor')) DEFAULT 'Lead',
    stage TEXT NOT NULL CHECK (stage IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost')) DEFAULT 'New',
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    deal_value NUMERIC(12, 2) DEFAULT 0.00,
    lost_reason TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Create ACTIVITIES Table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('Call', 'Email', 'Note')),
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Create CAMPAIGNS Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    segment_filter JSONB DEFAULT '{}'::jsonb,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    attributed_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Create CAMPAIGN_LOGS Table
CREATE TABLE IF NOT EXISTS public.campaign_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Sent',
    opened BOOLEAN NOT NULL DEFAULT FALSE,
    clicked BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if authenticated user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES Policies
-- Everyone authenticated can read profiles (needed for rep assignment & team roster)
CREATE POLICY "Allow authenticated read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile; Admins can update any profile
CREATE POLICY "Allow users to update own profile or Admin update all"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- Allow insert profile on user creation
CREATE POLICY "Allow user insert own profile or Admin"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());

-- ACCOUNTS Policies
-- Authenticated users can view, create, and update accounts
CREATE POLICY "Authenticated users view accounts"
ON public.accounts FOR SELECT
TO authenticated
USING (true);

-- Anonymous users (public capture form) can insert accounts or find existing
CREATE POLICY "Public insert accounts"
ON public.accounts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated update accounts"
ON public.accounts FOR UPDATE
TO authenticated
USING (true);

-- CONTACTS Policies
-- Admin can view all contacts; Sales Reps can view contacts assigned to them or unassigned
CREATE POLICY "Contacts view policy"
ON public.contacts FOR SELECT
TO authenticated
USING (public.is_admin() OR assigned_to = auth.uid() OR assigned_to IS NULL);

-- Anonymous users (public capture form) can insert leads
CREATE POLICY "Public lead capture insert"
ON public.contacts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin can update all contacts; Sales Reps can update assigned contacts
CREATE POLICY "Contacts update policy"
ON public.contacts FOR UPDATE
TO authenticated
USING (public.is_admin() OR assigned_to = auth.uid())
WITH CHECK (public.is_admin() OR assigned_to = auth.uid());

-- Admin can delete contacts
CREATE POLICY "Contacts delete policy"
ON public.contacts FOR DELETE
TO authenticated
USING (public.is_admin());

-- ACTIVITIES Policies
-- View: Admins can view all, Sales Reps can view activities for contacts they have access to
CREATE POLICY "Activities select policy"
ON public.activities FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.contacts
    WHERE contacts.id = activities.contact_id
      AND (contacts.assigned_to = auth.uid() OR contacts.assigned_to IS NULL)
  )
);

-- Insert: Authenticated users can log activities, and anon capture form can log initial welcome email activity
CREATE POLICY "Activities insert policy"
ON public.activities FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- CAMPAIGNS Policies
-- All authenticated users can view and manage campaigns
CREATE POLICY "Campaigns select policy"
ON public.campaigns FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Campaigns write policy"
ON public.campaigns FOR ALL
TO authenticated
USING (true);

-- CAMPAIGN_LOGS Policies
CREATE POLICY "Campaign logs select policy"
ON public.campaign_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Campaign logs write policy"
ON public.campaign_logs FOR ALL
TO authenticated
USING (true);

-- Allow public read of profiles for round-robin assignment in public capture if needed
CREATE POLICY "Public read sales reps for assignment"
ON public.profiles FOR SELECT
TO anon
USING (role = 'Sales Rep');

-- Trigger to handle new auth user -> public.profiles record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Sales Rep')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
