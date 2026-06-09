# CommuterConnect Admin Panel
### Web-Based Transportation Platform — Calbayog City, Samar
### React + Vite + Tailwind CSS · Chapter 1 Aligned

---

## 📖 About (Chapter 1)

CommuterConnect is a web-based application transportation platform for **Calbayog City, Samar**.
It addresses commuting challenges for residents who rely on native transport:
**tricycles, pedicabs, timbols, and multicabs**.

### System Objectives (Chapter 1)
| # | Objective | Admin Pages |
|---|-----------|-------------|
| 1 | Manage bookings, user info, ride details, and fare inquiries | Bookings, Commuters, Fares |
| 2 | Verify vehicle and driver information for reliability and safety | Drivers |
| 3 | Monitor system activity and record transactions | Analytics, Live Map |
| 4 | Organize reports, ratings, and complaints | Reports, Ratings |
| 5 | Generate ride records, booking confirmations and fare details | Records |

---

## 🚀 Quick Start

```bash
npm install
npm run dev      # → http://localhost:3000
npm run build    # production build
```

---

## 📁 Project Structure

```
commuterconnect-admin/
├── src/
│   ├── App.jsx                        ← All routes
│   ├── index.css                      ← Tailwind + global styles
│   ├── data/
│   │   └── mockData.js                ← Chapter 1 aligned data (tricycle/pedicab/timbol/multicab)
│   ├── hooks/
│   │   ├── useToast.js
│   │   └── useLocalStorage.js
│   ├── lib/
│   │   ├── AdminContext.jsx           ← Global state + all 5 objectives
│   │   └── ToastContext.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── Sidebar.jsx            ← Nav aligned to Chapter 1 objectives
│   │   │   └── Topbar.jsx
│   │   ├── ui/
│   │   │   └── index.jsx              ← Badge, StatCard, Modal, DataTable, Avatar...
│   │   └── pages/
│   │       ├── Dashboard.jsx          ← Overview + verification alerts
│   │       ├── Drivers.jsx            ← Objective 2: verify drivers & vehicles
│   │       ├── Customers.jsx          ← Objective 1: manage commuter info
│   │       ├── Bookings.jsx           ← Objective 1: bookings + fare inquiries
│   │       ├── Routes.jsx             ← Scope: route viewing & trip planning
│   │       ├── Reports.jsx            ← Objective 4: complaints & reports
│   │       ├── Ratings.jsx            ← Objective 4: ride ratings
│   │       ├── Fares.jsx              ← Objective 1: fare management (local vehicles)
│   │       ├── Analytics.jsx          ← Objective 3: monitor system activity
│   │       ├── Records.jsx            ← Objective 5: generate ride records
│   │       ├── LiveMap.jsx            ← Objective 3: real-time tracking
│   │       └── Settings.jsx           ← System config + Chapter 1 objectives display
```

---

## 🛺 Vehicle Types (Calbayog City)

| Vehicle  | Base Fare | Per KM | Peak |
|----------|-----------|--------|------|
| Tricycle | ₱10.00    | ₱2.00  | +10% |
| Pedicab  | ₱8.00     | ₱1.50  | None |
| Timbol   | ₱12.00    | ₱2.50  | +10% |
| Multicab | ₱15.00    | ₱3.00  | +15% |

---

## 🔌 Connecting to Supabase

1. Create project at https://supabase.com
2. Copy `.env.example` → `.env.local` and fill in credentials
3. Run SQL schema in Supabase SQL editor (see below)
4. Replace mock data in `src/data/mockData.js` with Supabase queries

### Database Schema

```sql
CREATE TABLE users (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  phone      TEXT,
  role       TEXT CHECK (role IN ('admin','driver','customer')) DEFAULT 'customer',
  status     TEXT DEFAULT 'active',
  address    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE drivers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES users(id),
  plate        TEXT NOT NULL,
  vehicle_type TEXT CHECK (vehicle_type IN ('Tricycle','Pedicab','Timbol','Multicab')),
  route        TEXT,
  rating       NUMERIC(3,1) DEFAULT 0,
  trips        INT DEFAULT 0,
  earnings     NUMERIC(10,2) DEFAULT 0,
  status       TEXT DEFAULT 'inactive',
  verified     BOOLEAN DEFAULT FALSE,
  license_no   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id    UUID REFERENCES users(id),
  driver_id      UUID REFERENCES drivers(id),
  pickup         TEXT NOT NULL,
  dropoff        TEXT NOT NULL,
  vehicle_type   TEXT,
  fare           NUMERIC(8,2),
  payment_status TEXT DEFAULT 'pending',
  status         TEXT DEFAULT 'pending',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id),
  driver_id   UUID REFERENCES drivers(id),
  issue_type  TEXT,
  severity    TEXT DEFAULT 'Low',
  description TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ratings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id  UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES users(id),
  driver_id   UUID REFERENCES drivers(id),
  stars       INT CHECK (stars BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  distance_km   NUMERIC(5,2),
  vehicle_types TEXT[],
  status        TEXT DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

Built for **Calbayog City, Samar** · LTFRB Region VIII · Capstone Project
