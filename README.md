# HealSync

A permission-based medical data exchange connecting patients, doctors/hospitals, and pharmacies —
a patient-owned health record wallet, time-bound access grants, telehealth consultations, medicine
discovery, an AI assistant grounded in the patient's own records, and medication reminders.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design: data model, API map, auth &
access-control flows, and environment variable reference.

## Repository layout

```
backend/    Node.js/Express + MongoDB API
frontend/   Vite + React + TypeScript SPA (Patient, Doctor, Hospital, Pharmacy portals)
```

## Getting started

**Backend**

```bash
cd backend
npm install
cp .env.example .env   # fill in the required values, see ARCHITECTURE.md §9
npm run dev
```

Requires a running MongoDB instance (local or Atlas). The server validates required environment
variables at startup and fails fast with a clear message if any are missing.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` to the backend at `http://localhost:5050` (see
`frontend/vite.config.ts`).

## Tests

```bash
cd backend && npm test    # Vitest — auth factory, PatientAccess authorization gate, date-boundary utils
cd frontend && npm test   # Vitest + React Testing Library — route guards
```

Coverage is intentionally focused on the highest-risk paths (authentication, authorization,
role-based routing) rather than exhaustive — see ARCHITECTURE.md §8 for what's not yet covered.

## Tech stack

MERN + Vite/React/TypeScript frontend. See ARCHITECTURE.md §2 for the full breakdown, including
external integrations (Groq for AI, Supabase for file storage, Twilio, Mapbox, Gmail SMTP).
