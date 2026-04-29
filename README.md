# Vanguard

Pre-inspection dashboard for Seven Star Energy LLC. Tracks Shell, Marathon, and ARCO sites; runs internal pre-inspections; predicts and prevents corporate mystery-shop failures.

## Run locally

You need Node.js 18+ installed. Get it from [nodejs.org](https://nodejs.org).

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`). Works on desktop and mobile browsers.

## Build for production

```bash
npm run build
```

Output goes to `dist/`. You can deploy this folder to any static host.

## Deploy to a real URL

The fastest path to a live site you can use from your phone is **Vercel**:

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub.
3. Import this repo. Click deploy. Done.

Vercel auto-detects Vite and hands you a URL like `vanguard.vercel.app`. Every time you push to `main`, the site updates within seconds.

## File structure

```
src/
├── main.jsx            entry point
├── App.jsx             routing & top-level state
├── index.css           tailwind + base styles
├── data/               static rubrics & seeded sample data
├── hooks/              useStoredState (localStorage persistence)
├── lib/                pure helpers (scoring)
└── components/
    ├── layout/         Sidebar, MobileBottomNav, MobileMoreSheet, TopBar
    ├── shared/         small reusable bits (StatCard, Field, pills, etc.)
    ├── dashboard/      Dashboard view
    ├── sites/          Sites grid, card, detail, form modal
    ├── schedule/       Schedule view
    ├── inspection/     Pre-inspection workflow
    ├── internal-ops/   Owner ops walkthrough
    ├── reports/        Internal report archive + detail
    ├── corporate/      Corporate report archive + detail
    └── issues/         Issues kanban + detail modal
```

## Data persistence

Currently uses browser `localStorage` per device. Survives refreshes; doesn't sync across devices.

For multi-device sync (and photo storage), see [Photos & Sync](#photos--sync) below.

## Photos & Sync

The current build stores photos as in-memory blob URLs that vanish on refresh. For real photo storage and cross-device sync, add **Supabase** — free tier covers a small fleet:

1. Create a free project at [supabase.com](https://supabase.com).
2. Create a Storage bucket called `inspection-photos`.
3. Replace `useStoredState` with Supabase queries in the relevant components.

Two upgrade options:

- **Quick:** Keep localStorage, add Supabase only for photos.
- **Full:** Move all data (sites, issues, reports) to Supabase Postgres. Auth, multi-user, real-time sync.

Both are documented in `docs/storage.md` (TODO — ask Claude to generate it).

## Stack

- React 18 + Vite (fast dev server, modern build)
- Tailwind CSS (styling)
- Lucide React (icons)
- Fraunces + Geist (typography via Google Fonts)
- localStorage (persistence — replaceable with Supabase later)
