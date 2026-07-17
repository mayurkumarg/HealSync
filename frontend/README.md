# HealSync — Frontend

A modern healthcare UI for the HealSync platform, built with **React + TypeScript + Vite** and a
bespoke Tailwind design system with full light/dark theming. One role-aware app — the nav and
dashboard adapt to the signed-in user's role — with complete portals for all four roles: **Patient**,
**Doctor**, **Hospital**, and **Pharmacy**. See `../ARCHITECTURE.md` for the full system design.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS** with CSS-variable theme tokens (light/dark)
- **React Router v6** (route-level code-splitting via `React.lazy`/`Suspense`), **TanStack Query v5**, **axios**
- **react-hook-form + zod** (forms & validation)
- **framer-motion** (motion), **lucide-react** (icons), **recharts** (vitals/trend charts)
- **Vitest + React Testing Library** (tests)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` → `http://localhost:5050` (the backend), so run the backend too:

```bash
cd ../backend && npm run dev
```

Then open the app, create an account for any role, and explore.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check + production build to `dist/`
- `npm run preview` — preview the production build
- `npm test` — run the Vitest test suite

## Structure

```
src/
  api/          axios client + typed endpoint modules (normalizes backend response envelopes)
  components/
    ui/         design-system primitives (Button, Card, Modal, Drawer, Toast, Table, Tabs, Alert, …)
    layout/     AppShell, Sidebar, TopNav, Footer, PageHeader
    shared/     composite reusables (ErrorBoundary, CriticalInfoBanner, StatCard, ProfileMenu, ThemeToggle, Logo)
  context/      Auth, Theme, Toast, Socket providers
  features/     per-role feature modules (dashboard, vitals, reminders, documents, consultations, timeline,
                access, pharmacy, chat, profile, doctor/, hospital/, pharmacy/)
  pages/        landing + auth pages
  routes/       nav config, ProtectedRoute (auth gate), RoleRoute (role gate)
  tests/        Vitest + React Testing Library — route guards
  lib/          cn(), formatters, zod schemas, jwt decode
  styles/       global CSS + theme tokens
```

## Notes

- **Real API throughout** — every feature hits the real backend; there is no client-side mock
  fallback. Endpoints that depend on external services the environment may not have configured
  (Supabase document storage, Groq AI chat, Twilio, Mapbox, OCR.space) fail gracefully with a clear
  error/toast rather than silently substituting fake data.
- **Error handling:** a global `ErrorBoundary` wraps the app so an uncaught render error shows a
  recovery screen instead of a blank page; every list/dashboard query distinguishes a genuine error
  state from an empty one.
- **Theming:** toggle in the top bar or Profile → Appearance; the choice persists and respects the
  OS preference on first load.
