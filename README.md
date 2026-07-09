# CommuterConnect Admin Panel

### A Transport Network Vehicle Service — Calbayog City, Samar

### React + Vite + Tailwind CSS + Supabase

---

## 📖 About

CommuterConnect is A Transport Network Vehicle Service for **Calbayog City, Samar**,
built for native transport types: **tricycles, timbols, and multicabs**.

This is the **Admin Panel** — one of three apps in the CommuterConnect system:

| App                            | Purpose                                                             |
| ------------------------------ | ------------------------------------------------------------------- |
| 🛠️ **Admin Panel** (this repo) | Verify drivers, manage bookings, fares, reports, ratings, analytics |
| 🧑 **Commuter App**            | Book rides, rate drivers, file reports                              |
| 🛺 **Driver App**              | Accept trips, update location, manage earnings                      |

All three share the **same Supabase project/database**, so they must use the **same
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`** to see the same live data.

### System Objectives

| #   | Objective                                                        | Admin Pages                |
| --- | ---------------------------------------------------------------- | -------------------------- |
| 1   | Manage bookings, user info, ride details, and fare inquiries     | Bookings, Commuters, Fares |
| 2   | Verify vehicle and driver information for reliability and safety | Drivers                    |
| 3   | Monitor system activity and record transactions                  | Analytics, Live Map        |
| 4   | Organize reports, ratings, and complaints                        | Reports, Ratings           |
| 5   | Generate ride records, booking confirmations and fare details    | Records                    |

---

## 🚀 Running This On Your Own Device (For Group Members)

Follow these steps exactly — this lets you run the admin panel on your own laptop
and see the **same live data** as everyone else on the team.

### 1. Install prerequisites

- **Node.js** v18 or higher → [nodejs.org](https://nodejs.org) (download the LTS version)
- **Git** → [git-scm.com](https://git-scm.com)
- A code editor like **VS Code** (recommended)

Check they're installed by opening a terminal (PowerShell / Terminal) and running:

```bash
node -v
git -v
```

### 2. Clone the repository

```bash
git clone https://github.com/EcoRaphael/ComCon-Admin.git
cd ComCon-Admin
```

> Replace the URL above with your team's actual GitHub repo link if different.

### 3. Install dependencies

```bash
npm install
```

This will take a minute — it downloads all the packages the project needs.

### 4. Set up environment variables

Create a new file named **`.env.local`** in the project root (same folder as `package.json`)
and paste in the team's shared Supabase credentials:

```env
VITE_SUPABASE_URL=https://hsyovokustaaabetknzl.supabase.co
VITE_SUPABASE_ANON_KEY=<ask your project lead for this — see note below>
VITE_APP_NAME=CommuterConnect
VITE_APP_CITY=Calbayog City
VITE_APP_REGION=Samar
```

> ⚠️ **Do not commit `.env.local` to GitHub.** It's already in `.gitignore`, so `git status`
> should never show it. The anon key is safe to share **within the team only** (over
> Messenger/group chat, not a public repo) — Supabase's Row Level Security policies
> protect the actual data even if someone has this key.
>
> **Never** share the `service_role` key with anyone — that one bypasses all security
> and should only exist on a secure backend, never in this file.

### 5. Run the app locally

```bash
npm run dev
```

Then open the URL shown in the terminal — usually:

```
http://localhost:5173
```

### 6. Log in

Use the admin account credentials shared by your project lead, or sign up a test
commuter/driver account through the commuter/driver apps to test the full flow.

---

## 🛠 Troubleshooting

**Blank white page / nothing loads**
Check the browser console (F12 → Console tab). If you see Supabase errors, double-check
your `.env.local` values are correct and there are no extra spaces.

**"Failed to fetch" or data never loads**
Your `.env.local` is probably missing or has the wrong Supabase URL/key. Re-copy it from
step 4.

**Port already in use**
If `5173` is taken, Vite will automatically try `5174`, `5175`, etc. — just use whatever
URL shows in the terminal.

**Styles look broken / unstyled**
Delete the `node_modules` folder and `package-lock.json`, then run `npm install` again.

---

## 📁 Project Structure

```
commuterconnect-admin/
├── src/
│   ├── App.jsx                        ← All routes
│   ├── index.css                      ← Tailwind + global styles
│   ├── lib/
│   │   ├── AuthContext.jsx            ← Supabase auth session + role
│   │   ├── AdminContext.jsx           ← Global state, fetches all data
│   │   ├── ToastContext.jsx
│   │   └── supabase/
│   │       ├── client.js              ← Supabase client init
│   │       └── service.js             ← All database queries
│   ├── components/
│   │   ├── auth/                      ← Login, Forgot/Reset Password
│   │   ├── layout/                    ← Sidebar, Topbar, AdminLayout
│   │   ├── ui/                        ← Badge, StatCard, Modal, DataTable...
│   │   └── pages/
│   │       ├── Dashboard.jsx          ← Overview + verification alerts
│   │       ├── Drivers.jsx            ← Objective 2: verify drivers & vehicles
│   │       ├── Customers.jsx          ← Objective 1: manage commuter info
│   │       ├── Bookings.jsx           ← Objective 1: bookings + fare inquiries
│   │       ├── Routes.jsx             ← Route viewing & trip planning
│   │       ├── Reports.jsx            ← Objective 4: complaints & reports
│   │       ├── Ratings.jsx            ← Objective 4: ride ratings
│   │       ├── Fares.jsx              ← Objective 1: fare management
│   │       ├── Payments.jsx           ← Manual fare/payment ledger
│   │       ├── Analytics.jsx          ← Objective 3: monitor system activity
│   │       ├── Records.jsx            ← Objective 5: generate ride records
│   │       ├── LiveMap.jsx            ← Objective 3: real-time tracking
│   │       └── Settings.jsx           ← System config
└── supabase/
    ├── schema.sql                     ← Core tables (users, drivers, bookings...)
    ├── schema_part2.sql               ← Extended tables (payments, vehicles...)
    ├── auth-setup.sql                 ← Auth triggers + RLS policies
    ├── policy-fixes.sql               ← ⚠️ Run this — adds missing RLS policies
    ├── seed.sql / seed_part2.sql      ← Sample data
    └── demoseed.sql                   ← Demo/presentation data
```

---

## 🛺 Vehicle Types (Calbayog City)

| Vehicle  | Base Fare | Per KM | Peak |
| -------- | --------- | ------ | ---- |
| Tricycle | ₱10.00    | ₱2.00  | +10% |
| Timbol   | ₱12.00    | ₱2.50  | +10% |
| Multicab | ₱15.00    | ₱3.00  | +15% |

---

## 🔌 Setting Up a Fresh Supabase Project (Project Lead Only)

If you're setting up the Supabase backend from scratch instead of using the shared one:

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run these files **in this exact order**:
   1. `supabase/schema.sql`
   2. `supabase/auth-setup.sql`
   3. `supabase/schema_part2.sql`
   4. **`supabase/policy-fixes.sql`** ← adds missing commuter/driver permissions (see note below)
   5. `supabase/seed.sql` and `supabase/seed_part2.sql` (optional sample data)
3. Go to **Project Settings → API** and copy the `Project URL` and `anon public` key
   into your `.env.local` (see step 4 above)
4. Go to **Authentication → Users** and manually create your first admin account,
   then run the admin-linking block at the bottom of `auth-setup.sql`

> ⚠️ **Important:** `policy-fixes.sql` is **required**, not optional. Without it, the
> commuter and driver apps will not be able to create bookings, submit ratings, file
> reports, or register as a driver — the base RLS policies only grant admin access
> and a few read-only permissions. This was discovered during testing and must be
> applied to any new Supabase project.

---

## 💳 About Online Payments

The **Payments** page in this admin panel is a **manual verification ledger**, not a
live payment gateway. Drivers/Admins record that a fare was paid (cash, GCash, Maya,
or bank) and manually enter a reference number; admin then confirms the status.

**There is currently no automated online payment processing** (no PayMongo, Stripe,
Xendit, or similar integration) — no money is actually charged through this system.
If your defense requires real online payment processing, that would need a separate
integration (PayMongo has a free PH-focused sandbox that supports GCash/Maya and is
a reasonable fit for this use case).

---

## 📦 Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Maps:** Leaflet.js + React-Leaflet
- **Charts:** Recharts
- **Icons:** Lucide React

---

## 🚢 Deployment

This project deploys to **Vercel**. See `vercel.json` for SPA routing config.
Environment variables must be added in **Vercel → Project Settings → Environment
Variables** (same three values as `.env.local`) — they are not read from the repo.

---

CommuterConnect © 2026 · Calbayog City, Samar
