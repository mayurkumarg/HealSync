# HealSync — Frontend

A modern, premium healthcare UI for the HealSync platform, built with **React + TypeScript + Vite**
and a bespoke Tailwind design system with full light/dark theming.

> Phase 1 scope: shared foundation + design system + landing + auth (all four roles) + the complete
> **Patient app**. Doctor / Hospital / Pharmacy sign in and land on a placeholder while their full
> dashboards are built in later passes (see `../ARCHITECTURE.md`). It's a single **role-aware** app —
> the nav and dashboard adapt to the signed-in user's role.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** with CSS-variable theme tokens (light/dark)
- **React Router v6**, **TanStack Query v5**, **axios**
- **react-hook-form + zod** (forms & validation)
- **framer-motion** (motion), **lucide-react** (icons), **recharts** (vitals charts)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` → `http://localhost:5050` (the backend), so run the backend too:

```bash
cd ../backend && npm run dev
```

Then open the app, create a patient account (or sign in), and explore.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check + production build to `dist/`
- `npm run preview` — preview the production build

## Structure

```
src/
  api/          axios client + typed endpoint modules (normalizes backend response envelopes)
  components/
    ui/         design-system primitives (Button, Card, Modal, Drawer, Toast, Table, Tabs, …)
    layout/     AppShell, Sidebar, TopNav, Footer, PageHeader
    shared/     composite reusables (StatCard, ProfileMenu, ThemeToggle, Logo, ComingSoon)
  context/      Auth, Theme, Toast providers
  features/     patient feature modules (dashboard, vitals, reminders, documents, access, pharmacy, chat, profile)
  pages/        landing + auth pages
  routes/       nav config, ProtectedRoute
  lib/          cn(), formatters, zod schemas, jwt decode, mock fallback data
  styles/       global CSS + theme tokens
```

## Notes

- **Real API with graceful fallback:** features that don't need external keys (auth, reminders,
  vitals, access-sharing, medicine search) hit the real backend. Features that need keys the
  environment may not have (Supabase document upload/OCR, Ollama AI chat) degrade to clearly-labelled
  sample data so every screen stays viewable.
- **Theming:** toggle in the top bar or Profile → Appearance; the choice persists and respects the
  OS preference on first load.
