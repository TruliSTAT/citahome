# CitaHome — CARFAX for Residential Properties

## What This Is
CitaHome is a property history report platform. Every home has a service history — CitaHome surfaces it as a verified report.
Revenue: $39/report (single), $149/mo (agent unlimited).

v1 data sources: **CitaPros jobs + CitaTodo permits only.** CitaMedical excluded until post-launch.

## Stack
- **Backend:** Node.js + Express + better-sqlite3 — port 3001 (`backend/`)
- **Frontend:** React 18 + Vite + Tailwind CSS — port 5173 dev (`frontend/`)
- **Auth:** JWT tokens
- **Payments:** Stripe — $39/report single, $149/mo agent subscription
- **Deploy:** Railway — `citahome.com` via Cloudflare CNAME

## Project Structure
```
citahome/
  backend/
    server.js           ← Express entry, all middleware + routes
    database.js         ← SQLite init (better-sqlite3)
    middleware/
      auth.js           ← JWT auth + internal sync key auth
    routes/
      property.js       ← GET /api/property/search + GET /api/property/:id/report
      reports.js        ← POST /api/reports/purchase + GET /api/reports/verify + POST /api/reports/webhook
      citapros-sync.js  ← POST /api/sync/citapros (internal)
      citatodo-sync.js  ← POST /api/sync/citatodo (internal)
    lib/
      address-match.js  ← normalize() + parseComponents()
      report-builder.js ← buildReport(), detectRedFlags(), computeSystemAges()
    citahome.db         ← SQLite DB (auto-created)
    .env                ← local dev env vars
  frontend/
    src/
      App.jsx           ← React router (Home, Report pages)
      main.jsx          ← React root
      index.css         ← Tailwind base + custom components
      components/
        SearchBar.jsx
        PropertyReport.jsx
        ReportTimeline.jsx
        ReportSummary.jsx
        PaywallGate.jsx
        GrowingReportNote.jsx
      pages/
        Home.jsx        ← Landing + search
        Report.jsx      ← Full property report page
    vite.config.js
    tailwind.config.js
  railway.json
  CLAUDE.md
```

## Database Schema
- `properties` — normalized address records
- `service_records` — jobs (CitaPros) + permits (CitaTodo) linked to properties
- `report_purchases` — Stripe purchases with JWT access tokens

## Key API Routes
| Route | Description |
|-------|-------------|
| `GET /api/property/search?address=` | Fuzzy address search, auto-creates stub |
| `GET /api/property/:id/report` | Preview (3 records free) or full (with token) |
| `POST /api/reports/purchase` | Create Stripe checkout |
| `GET /api/reports/verify?token=` | Validate purchase token |
| `POST /api/reports/webhook` | Stripe webhook (raw body) |
| `POST /api/sync/citapros` | Internal: sync jobs from CitaPros |
| `POST /api/sync/citatodo` | Internal: sync permits from CitaTodo |
| `GET /api/health` | Health check |

## Environment Variables (backend/.env)
```
PORT=3001
NODE_ENV=development
DATABASE_PATH=./citahome.db
JWT_SECRET=<generate for prod>
STRIPE_SECRET_KEY=<from Railway>
STRIPE_WEBHOOK_SECRET=<from Railway>
CITAPROS_API_URL=https://citapros-backend.up.railway.app
CITAHOME_SYNC_KEY=<shared secret — also add to CitaPros>
CITATODO_API_URL=<when CitaTodo ships its export endpoint>
FRONTEND_URL=http://localhost:5173
```

## Commands
```bash
# Backend
cd backend && npm install && node server.js

# Frontend (dev)
cd frontend && npm install && npm run dev

# Frontend (prod build — output goes to frontend/dist, served by backend)
cd frontend && npm run build
```

## CitaPros Integration
CitaPros needs a new route: `routes/citahome-export.js` — see brief at `/Users/zues/agents/kodi/briefs/2026-05-18-citahome-v1.md`
Internal auth: `x-sync-key` header with shared `CITAHOME_SYNC_KEY`.

## Railway Deploy
1. Create new Railway service: `citahome`
2. Add all backend env vars
3. Start command: `node backend/server.js`
4. Health check: `/api/health`
5. Report domain back to Zues → Cloudflare zone `c441010d32f294222610c22180f9ce21`

## Dev Mode Note
If `STRIPE_SECRET_KEY` is not set, `POST /api/reports/purchase` returns a dev auto-approve token.
This makes the full paywall flow testable without Stripe keys.

## Address Matching
`lib/address-match.js` — normalizes addresses to uppercase abbreviated form for LIKE-based fuzzy lookup.
Example: "123 Main Street" → "123 MAIN ST"

## Red Flag Logic
- Open permit older than 90 days
- Same trade 3+ times in 12 months
- CitaPros job with no operator rating (unverified)

## System Age Estimation
Earliest matching service_record per trade keyword → age = today minus earliest date.
HVAC, Roof, Water Heater, Electrical.
