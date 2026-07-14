# HealSync

A permission-based medical data exchange connecting patients, hospitals/doctors, and pharmacies —
a patient-owned health record wallet, time-bound access grants, medicine discovery, AI-assisted
document summarization, and medication reminders.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design: data model, API map, auth &
access-control flows, and environment variable reference.

## Repository layout

```
backend/    Node.js/Express + MongoDB API (see backend/README or ARCHITECTURE.md to run it)
```

There is no frontend yet — see `ARCHITECTURE.md`'s "Recommended next steps" for the plan.

## Getting started

```bash
cd backend
npm install
cp .env.example .env   # fill in the required values, see ARCHITECTURE.md §9
npm run dev
```

Requires a running MongoDB instance (local or Atlas). The server validates required environment
variables at startup and fails fast with a clear message if any are missing.

## Tech stack

MERN: MongoDB, Express, Node.js. (React frontend planned, not yet built.)
