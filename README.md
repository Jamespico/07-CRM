# 07 CRM

A clean, mobile-responsive CRM web application built with React (Vite), Tailwind CSS, React Router, Supabase (Postgres, Auth, RLS), Recharts, and Lucide React. Ready for deployment on Vercel.

---

## Features

1. **Database Schema & Row-Level Security (Supabase Postgres)**
   - 6 tables: `profiles`, `accounts`, `contacts`, `activities`, `campaigns`, `campaign_logs`.
   - RLS policies:
     - `Admin`: full read and write access across all records.
     - `Sales Rep`: read and write access restricted to assigned contacts and activities.
   - Pre-seeded with 40 realistic synthetic records so all dashboards, tables, and pipeline stages are populated immediately.
   - Dual-mode client: works directly out-of-the-box in local demo mode, and automatically connects to live Supabase when `.env` is configured.

2. **Authentication & Team Management (`/team`)**
   - Supabase Auth login and signup flow.
   - `/team` page (Admin only) listing team members, assigned accounts, closed revenue, and role toggle (`Admin` vs. `Sales Rep`).
   - Quick role switcher in the sidebar to test permissions without re-logging in.

3. **Public Lead Capture (`/capture`)**
   - Standalone public form (no login required) collecting: Full Name, Email, Phone, Company Name, Estimated Budget, and Notes.
   - Creates or links company in `accounts`.
   - Calculates a deterministic lead score (0–100):
     - Phone provided: +30 points
     - Business email domain: +30 points (free webmail domains: +10 points)
     - Budget: +40 points for $50k+, +25 points for $15k–$50k, +15 points under $15k
   - Auto-assigns lead to a Sales Rep using round-robin logic.
   - Inserts into `contacts` with `type = 'Lead'` and `stage = 'New'`, logs an initial welcome email activity, and shows a confirmation screen.

4. **Contacts Directory & Slide-Over Drawer (`/contacts`)**
   - Searchable table with filter tabs for All, Leads, Customers, and Vendors.
   - Shows Name, Company, Type, Stage, Score badge, Assigned Rep, and Deal Value.
   - "Add Contact" modal and "Export CSV" button for the currently filtered view.
   - Slide-over detail drawer displaying contact info, score breakdown, activity timeline, and an activity logging form (Call, Email, Note).

5. **Sales Pipeline (`/pipeline`)**
   - Kanban board with 6 stages: New, Contacted, Qualified, Proposal, Won, Lost.
   - Mobile-friendly list view toggle.
   - Moving a deal to **Won** prompts to confirm `deal_value` and updates `type` to **Customer**.
   - Moving a deal to **Lost** prompts for `lost_reason`.

6. **Campaigns & Email Designer (`/campaigns`)**
   - Contact segmentation by type, stage, or minimum score with live matching audience count.
   - Split-screen email designer: subject, body with `{{name}}` merge tag, CTA button, cost, and live email preview.
   - Supabase Edge Function template (`supabase/functions/send-campaign-email/index.ts`) for Resend API dispatch, with automatic fallback logging to `campaign_logs`.
   - Campaigns table showing Sent count, Open Rate %, Click Rate %, Cost, Attributed Revenue, and calculated ROI `((Revenue - Cost) / Cost) * 100`.
   - "Simulate Open" and "Simulate Click" actions on campaign log entries to test live metric updates.

7. **Interactive Dashboard (`/dashboard`)**
   - 3 Global filters at the top (Date Range, Sales Rep, Contact Type) that dynamically filter all 4 charts and summary cards together:
     1. **Sales Funnel:** Bar chart of leads by stage.
     2. **Activities by Rep:** Stacked bar chart of Calls, Emails, and Notes per sales rep.
     3. **Campaign Performance:** Chart comparing Opens and Clicks across campaigns.
     4. **Customer Listing by Sales:** Bar chart of revenue by rep and Won customers table with "Export CSV".

---

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor**.
3. Run `supabase/schema.sql` to create tables, indexes, RLS policies, and auth triggers.
4. Run `supabase/seed.sql` to insert the 40 seed records.
5. In **Project Settings > API**, copy the Project URL and anon public key.

### 2. Environment Variables

In `client/.env` (or copy from `client/.env.example`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
*(If left unset, the application runs using the built-in local synthetic store).*

### 3. Run Locally

```bash
cd client
npm install
npm run dev
```

The application will start at `http://localhost:5173`.

### 4. Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Set the **Root Directory** to `client`.
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. SPA client routing is preconfigured in `client/vercel.json`.

---

## Project Structure

```
CRM/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx              # Responsive navigation & role switcher
│   │   │   └── ContactDetailDrawer.jsx # Slide-over contact detail & activity logger
│   │   ├── context/
│   │   │   └── CRMContext.jsx          # Supabase client state & store management
│   │   ├── data/
│   │   │   └── seedData.js             # Initial records matching schema
│   │   ├── lib/
│   │   │   └── supabase.js             # Supabase client initialization
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # Global filters & Recharts analytics
│   │   │   ├── Pipeline.jsx            # Kanban pipeline & stage transitions
│   │   │   ├── Contacts.jsx            # Contacts directory & CSV export
│   │   │   ├── Campaigns.jsx           # Email designer & log simulator
│   │   │   ├── Team.jsx                # Team directory & role permissions
│   │   │   ├── PublicCapture.jsx       # Public lead capture form
│   │   │   └── Login.jsx               # Auth login/signup page
│   │   ├── App.jsx                     # Router & route guards
│   │   └── index.css                   # Tailwind CSS styling
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── supabase/
│   ├── schema.sql                      # DDL schema with RLS policies
│   ├── seed.sql                        # 40 synthetic seed records
│   └── functions/
│       └── send-campaign-email/        # Edge Function template
└── README.md
```
