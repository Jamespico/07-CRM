-- ==============================================================================
-- 07 CRM SYNTHETIC SEED DATA
-- 40+ realistic records across profiles, accounts, contacts, activities, campaigns, and campaign_logs
-- ==============================================================================

-- 1. Insert Sample Profiles (Using fixed UUIDs so foreign keys match)
-- In a real Supabase Auth instance, these match auth.users, but for local/preview or demo testing
-- we populate profiles directly.
INSERT INTO public.profiles (id, full_name, email, role, avatar_url) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Elena Rostova', 'elena.rostova@07crm.io', 'Admin', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
  ('d2222222-2222-2222-2222-222222222222', 'Marcus Vance', 'marcus.vance@07crm.io', 'Sales Rep', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
  ('d3333333-3333-3333-3333-333333333333', 'Sophia Chen', 'sophia.chen@07crm.io', 'Sales Rep', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'),
  ('d4444444-4444-4444-4444-444444444444', 'Devon Brooks', 'devon.brooks@07crm.io', 'Sales Rep', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url;

-- 2. Insert Accounts (10 realistic companies)
INSERT INTO public.accounts (id, company_name, industry, website) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Acme Logistics Global', 'Supply Chain', 'https://acmelogistics.com'),
  ('a2222222-2222-2222-2222-222222222222', 'Apex Health Innovations', 'Healthcare', 'https://apexhealth.org'),
  ('a3333333-3333-3333-3333-333333333333', 'CyberShield Systems', 'Cybersecurity', 'https://cybershield.tech'),
  ('a4444444-4444-4444-4444-444444444444', 'OmniCommerce Labs', 'E-Commerce', 'https://omnicommerce.io'),
  ('a5555555-5555-5555-5555-555555555555', 'Veritas Wealth Advisors', 'Finance & FinTech', 'https://veritaswealth.com'),
  ('a6666666-6666-6666-6666-666666666666', 'Solaris Green Energy', 'Clean Energy', 'https://solarisgreen.org'),
  ('a7777777-7777-7777-7777-777777777777', 'Nimbus Cloud Ops', 'Cloud Infrastructure', 'https://nimbuscloudops.dev'),
  ('a8888888-8888-8888-8888-888888888888', 'HyperScale SaaS', 'Software', 'https://hyperscalesaas.com'),
  ('a9999999-9999-9999-9999-999999999999', 'Pinnacle Industrial Supplies', 'Manufacturing', 'https://pinnacleind.com'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Vanguard Legal Partners', 'Legal Services', 'https://vanguardlegal.law')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Contacts (Mix of Leads, Customers, Vendors across stages)
INSERT INTO public.contacts (id, account_id, name, email, phone, type, stage, score, deal_value, lost_reason, assigned_to, created_at) VALUES
  -- Leads (Pipeline stages)
  ('c1010101-1010-1010-1010-101010101010', 'a1111111-1111-1111-1111-111111111111', 'Alexander Wright', 'a.wright@acmelogistics.com', '+1 (555) 234-5678', 'Lead', 'New', 75, 45000.00, NULL, 'd2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '15 days'),
  ('c1020202-2020-2020-2020-202020202020', 'a2222222-2222-2222-2222-222222222222', 'Dr. Rachel Patel', 'rachel.patel@apexhealth.org', '+1 (555) 345-6789', 'Lead', 'Contacted', 85, 92000.00, NULL, 'd3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '20 days'),
  ('c1030303-3030-3030-3030-303030303030', 'a3333333-3333-3333-3333-333333333333', 'Gareth Edwards', 'gedwards@cybershield.tech', '+1 (555) 456-7890', 'Lead', 'Qualified', 90, 68000.00, NULL, 'd4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '12 days'),
  ('c1040404-4040-4040-4040-404040404040', 'a4444444-4444-4444-4444-444444444444', 'Chloe Dupont', 'c.dupont@omnicommerce.io', '+1 (555) 567-8901', 'Lead', 'Proposal', 95, 120000.00, NULL, 'd2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '8 days'),
  ('c1050505-5050-5050-5050-505050505050', 'a5555555-5555-5555-5555-555555555555', 'Julian Sterling', 'jsterling@veritaswealth.com', '+1 (555) 678-9012', 'Lead', 'New', 65, 35000.00, NULL, 'd3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 days'),
  ('c1060606-6060-6060-6060-606060606060', 'a6666666-6666-6666-6666-666666666666', 'Naomi Tanaka', 'ntanaka@solarisgreen.org', '+1 (555) 789-0123', 'Lead', 'Contacted', 70, 54000.00, NULL, 'd4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '10 days'),
  ('c1070707-7070-7070-7070-707070707070', 'a7777777-7777-7777-7777-777777777777', 'Liam Gallagher', 'liam@nimbuscloudops.dev', '+1 (555) 890-1234', 'Lead', 'Qualified', 88, 80000.00, NULL, 'd2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '7 days'),
  ('c1080808-8080-8080-8080-808080808080', 'a8888888-8888-8888-8888-888888888888', 'Maya Lin', 'mlin@hyperscalesaas.com', '+1 (555) 901-2345', 'Lead', 'Proposal', 92, 145000.00, NULL, 'd3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 days'),
  ('c1090909-9090-9090-9090-909090909090', 'a9999999-9999-9999-9999-999999999999', 'Vikram Rao', 'vikram.rao@pinnacleind.com', '+1 (555) 012-3456', 'Lead', 'Lost', 40, 30000.00, 'Budget constraints and delayed executive approval', 'd4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '25 days'),
  ('c1101010-1010-1010-1010-101010101010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Samantha Cruz', 'scruz@vanguardlegal.law', '+1 (555) 123-4567', 'Lead', 'Lost', 50, 48000.00, 'Chose competitor due to existing legacy integration', 'd2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '18 days'),

  -- Customers (Won deals)
  ('c2010101-1010-1010-1010-101010101010', 'a1111111-1111-1111-1111-111111111111', 'Tariq Al-Mansoor', 'talmansoor@acmelogistics.com', '+1 (555) 234-9988', 'Customer', 'Won', 100, 110000.00, NULL, 'd2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '40 days'),
  ('c2020202-2020-2020-2020-202020202020', 'a2222222-2222-2222-2222-222222222222', 'Jessica Miller', 'jmiller@apexhealth.org', '+1 (555) 345-1122', 'Customer', 'Won', 98, 175000.00, NULL, 'd3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '35 days'),
  ('c2030303-3030-3030-3030-303030303030', 'a3333333-3333-3333-3333-333333333333', 'Carlos Santana', 'csantana@cybershield.tech', '+1 (555) 456-3344', 'Customer', 'Won', 95, 88000.00, NULL, 'd4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '30 days'),
  ('c2040404-4040-4040-4040-404040404040', 'a4444444-4444-4444-4444-444444444444', 'Brigitte Fontaine', 'bfontaine@omnicommerce.io', '+1 (555) 567-5566', 'Customer', 'Won', 100, 140000.00, NULL, 'd2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '28 days'),
  ('c2050505-5050-5050-5050-505050505050', 'a5555555-5555-5555-5555-555555555555', 'Harrison Blake', 'hblake@veritaswealth.com', '+1 (555) 678-7788', 'Customer', 'Won', 96, 210000.00, NULL, 'd3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '22 days'),
  ('c2060606-6060-6060-6060-606060606060', 'a7777777-7777-7777-7777-777777777777', 'Evan O''Connor', 'evan.oc@nimbuscloudops.dev', '+1 (555) 890-9900', 'Customer', 'Won', 94, 95000.00, NULL, 'd4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '14 days'),

  -- Vendors (Key partners & suppliers)
  ('c3010101-1010-1010-1010-101010101010', 'a9999999-9999-9999-9999-999999999999', 'Kurtis Zimmerman', 'kzimmerman@pinnacleind.com', '+1 (555) 909-1212', 'Vendor', 'Contacted', 80, 0.00, NULL, 'd1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days'),
  ('c3020202-2020-2020-2020-202020202020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Patricia Hayes', 'phayes@vanguardlegal.law', '+1 (555) 808-2323', 'Vendor', 'Qualified', 82, 0.00, NULL, 'd1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '50 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Activities (Calls, Emails, Notes)
INSERT INTO public.activities (id, contact_id, user_id, type, notes, created_at) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'c1010101-1010-1010-1010-101010101010', 'd2222222-2222-2222-2222-222222222222', 'Email', 'Automated welcome email sent following public lead capture.', NOW() - INTERVAL '15 days'),
  ('b1111111-1111-1111-1111-111111111112', 'c1010101-1010-1010-1010-101010101010', 'd2222222-2222-2222-2222-222222222222', 'Call', 'Discovery call completed. Inquiring about enterprise tier for 50 regional dispatch hubs.', NOW() - INTERVAL '14 days'),
  ('b1111111-1111-1111-1111-111111111113', 'c1020202-2020-2020-2020-202020202020', 'd3333333-3333-3333-3333-333333333333', 'Call', 'Spoke with Dr. Patel regarding HIPAA compliance integrations. Requested security whitepaper.', NOW() - INTERVAL '19 days'),
  ('b1111111-1111-1111-1111-111111111114', 'c1020202-2020-2020-2020-202020202020', 'd3333333-3333-3333-3333-333333333333', 'Email', 'Sent architecture diagrams and SOC2 Type II audit summary.', NOW() - INTERVAL '18 days'),
  ('b1111111-1111-1111-1111-111111111115', 'c1030303-3030-3030-3030-303030303030', 'd4444444-4444-4444-4444-444444444444', 'Note', 'Internal note: Gareth mentioned their fiscal budget approval is on the 15th.', NOW() - INTERVAL '11 days'),
  ('b1111111-1111-1111-1111-111111111116', 'c1040404-4040-4040-4040-404040404040', 'd2222222-2222-2222-2222-222222222222', 'Call', 'Review proposal draft with Chloe and procurement manager.', NOW() - INTERVAL '7 days'),
  ('b1111111-1111-1111-1111-111111111117', 'c1040404-4040-4040-4040-404040404040', 'd2222222-2222-2222-2222-222222222222', 'Email', 'Sent finalized SLA addendum for signing.', NOW() - INTERVAL '6 days'),
  ('b1111111-1111-1111-1111-111111111118', 'c1070707-7070-7070-7070-707070707070', 'd2222222-2222-2222-2222-222222222222', 'Call', 'Liam confirmed interest in multi-cloud backup module. Demo scheduled.', NOW() - INTERVAL '6 days'),
  ('b1111111-1111-1111-1111-111111111119', 'c1080808-8080-8080-8080-808080808080', 'd3333333-3333-3333-3333-333333333333', 'Call', 'Presentation to VP of Engineering went exceptionally well. Moving to proposal stage.', NOW() - INTERVAL '2 days'),
  ('b1111111-1111-1111-1111-111111111120', 'c2010101-1010-1010-1010-101010101010', 'd2222222-2222-2222-2222-222222222222', 'Note', 'Contract signed and payment received. Handed over to Customer Success for onboarding.', NOW() - INTERVAL '39 days'),
  ('b1111111-1111-1111-1111-111111111121', 'c2020202-2020-2020-2020-202020202020', 'd3333333-3333-3333-3333-333333333333', 'Call', 'Quarterly business review planning call with Jessica.', NOW() - INTERVAL '10 days'),
  ('b1111111-1111-1111-1111-111111111122', 'c2050505-5050-5050-5050-505050505050', 'd3333333-3333-3333-3333-333333333333', 'Note', 'Customer expanded license count from 50 to 120 seats.', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert 4 Past Campaigns with open/click rates, cost, and attributed revenue
INSERT INTO public.campaigns (id, name, segment_filter, subject, body_html, cost, attributed_revenue, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Q3 Enterprise Product Launch', '{"type": "Lead", "min_score": 70}'::jsonb, 'Accelerate your pipeline with 07 CRM Enterprise Suite', '<p>Hi {{name}},</p><p>Discover our newly launched automation capabilities engineered for high-velocity teams.</p>', 2500.00, 110000.00, NOW() - INTERVAL '45 days'),
  ('e2222222-2222-2222-2222-222222222222', 'Healthcare Tech Re-Engagement', '{"type": "Lead", "stage": "Contacted"}'::jsonb, 'Streamline compliant customer journeys in Healthcare', '<p>Hello {{name}},</p><p>Learn how top health organizations cut response latency by 45% using our HIPAA-ready platform.</p>', 1200.00, 48000.00, NOW() - INTERVAL '30 days'),
  ('e3333333-3333-3333-3333-333333333333', 'Customer Expansion & Upsell Webinar', '{"type": "Customer", "min_score": 80}'::jsonb, 'Exclusive Briefing: New Advanced Analytics for {{name}}', '<p>Hi {{name}},</p><p>Join our VP of Product for an intimate live demo on multi-tier attribution and forecasting.</p>', 850.00, 140000.00, NOW() - INTERVAL '20 days'),
  ('e4444444-4444-4444-4444-444444444444', 'Mid-Market Black Friday Nurture', '{"type": "Lead", "min_score": 50}'::jsonb, 'Lock in annual VIP pricing before quarter end', '<p>Hi {{name}},</p><p>We are offering 20% off all standard annual seats booked before the end of this month.</p>', 1800.00, 68000.00, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Campaign Logs for realistic stats
INSERT INTO public.campaign_logs (id, campaign_id, contact_id, status, opened, clicked, sent_at) VALUES
  -- Campaign 1
  ('f1111111-1111-1111-1111-111111111101', 'e1111111-1111-1111-1111-111111111111', 'c1010101-1010-1010-1010-101010101010', 'Sent', true, true, NOW() - INTERVAL '44 days'),
  ('f1111111-1111-1111-1111-111111111102', 'e1111111-1111-1111-1111-111111111111', 'c1020202-2020-2020-2020-202020202020', 'Sent', true, true, NOW() - INTERVAL '44 days'),
  ('f1111111-1111-1111-1111-111111111103', 'e1111111-1111-1111-1111-111111111111', 'c1030303-3030-3030-3030-303030303030', 'Sent', true, false, NOW() - INTERVAL '44 days'),
  ('f1111111-1111-1111-1111-111111111104', 'e1111111-1111-1111-1111-111111111111', 'c1040404-4040-4040-4040-404040404040', 'Sent', false, false, NOW() - INTERVAL '44 days'),
  ('f1111111-1111-1111-1111-111111111105', 'e1111111-1111-1111-1111-111111111111', 'c1070707-7070-7070-7070-707070707070', 'Sent', true, true, NOW() - INTERVAL '44 days'),

  -- Campaign 2
  ('f2222222-2222-2222-2222-222222222201', 'e2222222-2222-2222-2222-222222222222', 'c1020202-2020-2020-2020-202020202020', 'Sent', true, true, NOW() - INTERVAL '29 days'),
  ('f2222222-2222-2222-2222-222222222202', 'e2222222-2222-2222-2222-222222222222', 'c1060606-6060-6060-6060-606060606060', 'Sent', true, false, NOW() - INTERVAL '29 days'),

  -- Campaign 3
  ('f3333333-3333-3333-3333-333333333301', 'e3333333-3333-3333-3333-333333333333', 'c2010101-1010-1010-1010-101010101010', 'Sent', true, true, NOW() - INTERVAL '19 days'),
  ('f3333333-3333-3333-3333-333333333302', 'e3333333-3333-3333-3333-333333333333', 'c2020202-2020-2020-2020-202020202020', 'Sent', true, true, NOW() - INTERVAL '19 days'),
  ('f3333333-3333-3333-3333-333333333303', 'e3333333-3333-3333-3333-333333333333', 'c2030303-3030-3030-3030-303030303030', 'Sent', true, false, NOW() - INTERVAL '19 days'),
  ('f3333333-3333-3333-3333-333333333304', 'e3333333-3333-3333-3333-333333333333', 'c2040404-4040-4040-4040-404040404040', 'Sent', false, false, NOW() - INTERVAL '19 days'),
  ('f3333333-3333-3333-3333-333333333305', 'e3333333-3333-3333-3333-333333333333', 'c2050505-5050-5050-5050-505050505050', 'Sent', true, true, NOW() - INTERVAL '19 days'),

  -- Campaign 4
  ('f4444444-4444-4444-4444-444444444401', 'e4444444-4444-4444-4444-444444444444', 'c1010101-1010-1010-1010-101010101010', 'Sent', true, false, NOW() - INTERVAL '9 days'),
  ('f4444444-4444-4444-4444-444444444402', 'e4444444-4444-4444-4444-444444444444', 'c1030303-3030-3030-3030-303030303030', 'Sent', true, true, NOW() - INTERVAL '9 days'),
  ('f4444444-4444-4444-4444-444444444403', 'e4444444-4444-4444-4444-444444444444', 'c1050505-5050-5050-5050-505050505050', 'Sent', false, false, NOW() - INTERVAL '9 days'),
  ('f4444444-4444-4444-4444-444444444404', 'e4444444-4444-4444-4444-444444444444', 'c1060606-6060-6060-6060-606060606060', 'Sent', true, true, NOW() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;
