# Outpost — Hypeify Integration Guide

Audience: **Hypeify Claude Code**, the agent integrating this repo as the
"Outpost" product inside the Hypeify monorepo / platform.

This doc tells you what's already in place, what's deliberately stubbed, and
exactly where to plug in real Hypeify infrastructure (auth, Supabase project,
Resend, Vercel, custom domain). The foundation is intentionally additive and
white-label-clean — no SSE assumptions are baked into product code; everything
SSE-specific lives in tenant data rows.

---

## TL;DR

- **What this repo is now**: a Next.js 15 (App Router, JSX) multi-tenant
  product called **Outpost**. SSE / Vanguard is tenant #1 (`slug='sse'`).
- **What it was**: a single-tenant Vite + React SPA called Vanguard for
  Seven Star Energy. Lift-and-shifted, not rebuilt. SSE feature parity is
  preserved end to end.
- **Auth, tenant resolution, env vars**: stubbed with shims that follow the
  exact contract Hypeify will plug into. Swap bodies, keep signatures.
- **Database**: 5 idempotent SQL migrations seed tenants / RLS / storage and
  insert SSE as tenant #1 with full configuration as DB rows.
- **Storage**: new `tenant-files` bucket with tenant-scoped RLS. Legacy
  `inspection-photos` URLs continue to resolve and aren't migrated yet
  (see "Data migration" below).

---

## Repo layout

```
outpost/
├── docs/
│   └── HYPEIFY-INTEGRATION.md     ← this file
├── public/                         ← static assets (logos, og images)
├── src/
│   ├── app/                        ← Next.js App Router
│   │   ├── layout.jsx              ← root layout, html/body, fonts
│   │   ├── globals.css             ← Tailwind + a few app-wide rules
│   │   ├── page.jsx                ← public landing page (Outpost marketing)
│   │   ├── (auth)/
│   │   │   ├── layout.jsx
│   │   │   └── login/page.jsx      ← thin wrapper around LoginScreen
│   │   └── (app)/                  ← authenticated app shell
│   │       ├── layout.jsx          ← auth gate + Tenant + AppState providers
│   │       ├── page.jsx            ← redirects → /dashboard
│   │       ├── dashboard/page.jsx
│   │       ├── sites/page.jsx
│   │       ├── schedule/page.jsx
│   │       ├── inspection/page.jsx
│   │       ├── reports/page.jsx
│   │       ├── issues/page.jsx
│   │       ├── documents/page.jsx  ← generic Documents module (was SSE Corporate Archive)
│   │       ├── inspectors/page.jsx
│   │       └── settings/page.jsx
│   ├── components/                 ← UI components (unchanged from Vanguard)
│   │   ├── auth/LoginScreen.jsx
│   │   ├── corporate/              ← legacy SSE-specific; safe to delete
│   │   │                             once Documents module fully replaces it
│   │   ├── dashboard/, documents/, inspection/, inspectors/, issues/,
│   │   ├── layout/, reports/, schedule/, shared/, sites/
│   ├── data/
│   │   └── schema.js               ← thin re-exporter; the real config now
│   │                                 lives in src/lib/tenant/default-sse.js
│   ├── hooks/
│   │   ├── useUserData.jsx         ← per-user JSON document store (legacy)
│   │   └── useScreenSize.js
│   └── lib/
│       ├── auth/hypeify.js         ← AUTH SHIM — replace bodies, keep contract
│       ├── contexts/app-state.jsx  ← AppStateProvider; all CRUD + UI state
│       ├── photos.js               ← Supabase Storage upload helper
│       ├── supabase/
│       │   ├── client.js           ← browser createBrowserClient (@supabase/ssr)
│       │   └── server.js           ← server createServerClient (@supabase/ssr)
│       └── tenant/
│           ├── context.jsx         ← TenantProvider + hooks
│           ├── default-sse.js      ← SSE seed config (mirrors row in tenant_config)
│           └── types.js            ← JSDoc tenant config types
└── supabase/
    └── migrations/
        ├── 0001_init_tenants.sql
        ├── 0002_domain_tables.sql
        ├── 0003_rls_policies.sql
        ├── 0004_seed_sse_tenant.sql
        └── 0005_storage_buckets.sql
```

---

## Environment variables

Wire these in Hypeify's Vercel project (or `.env.local` for dev). All
`NEXT_PUBLIC_*` are exposed to the browser bundle.

| Var                              | Required | Notes |
|----------------------------------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL`       | yes      | Hypeify-owned Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | yes      | Public anon key for that project   |
| `SUPABASE_SERVICE_ROLE_KEY`      | only for server-side admin scripts (data migration, webhooks). **Never** expose to the browser. |
| `RESEND_API_KEY`                 | server   | For magic-link / OTP email via Resend SMTP relay. Wired into Supabase Auth → Email settings, not read directly by Next.js. |
| `NEXT_PUBLIC_OUTPOST_BASE_URL`   | optional | Used in absolute redirects. Defaults to request origin. |

`@supabase/ssr` is already installed and the helpers in
`src/lib/supabase/{client,server}.js` cover both browser and server
contexts. No additional config needed.

---

## Auth: the Hypeify shim

**File**: `src/lib/auth/hypeify.js`

The whole app authenticates through this module. Internally it currently
calls Supabase Auth directly (magic link + OTP, mirroring what Vanguard
already shipped). The exported surface is:

```js
hypeifyAuth.getSession()         // → { user, accessToken } | null
hypeifyAuth.getUser()            // → user | null
hypeifyAuth.signInWithEmail(email, redirectTo)  // → { error? }
hypeifyAuth.verifyOtp(email, token)              // → { user?, error? }
hypeifyAuth.signOut()
hypeifyAuth.onAuthStateChange(cb)                // → unsubscribe()
```

**To integrate with Hypeify SSO**:

1. Replace the bodies of those functions with calls to the Hypeify auth
   service (the shared login page that all Hypeify products use, like
   Google's unified auth).
2. Keep the function signatures identical — every component imports the
   shim, not Supabase.
3. If Hypeify auth still uses Supabase under the hood (likely, since it's
   the same data plane), you may simply have the shim re-export the
   Hypeify-configured Supabase client and delete the local one.
4. The login page at `src/app/(auth)/login/page.jsx` is a thin wrapper
   around `LoginScreen.jsx`. Either:
   - Replace the wrapper with a redirect to the Hypeify login page, OR
   - Replace the in-page form with Hypeify's shared `<HypeifyLogin/>`
     component.

**Session source of truth**: cookies set by Supabase SSR. The auth gate
in `src/app/(app)/layout.jsx` reads the session via the shim on mount and
redirects to `/login` if missing. When you swap to Hypeify auth, this
behavior should remain — it doesn't matter to the app whether the cookies
were set by Supabase or by a Hypeify-issued session.

---

## Tenant resolution

**File**: `src/lib/tenant/context.jsx`

Currently the `TenantProvider` always resolves to the SSE tenant by
loading `src/lib/tenant/default-sse.js`. This is a placeholder so the app
runs without database access during local dev.

**To make it real** (one of these strategies; pick whichever Hypeify uses):

| Strategy | Trigger | Code change |
|---|---|---|
| **Path-based** (`outpost.hypeify.com/sse/...`) | Read first segment of `usePathname()` | In `TenantProvider`, `slug = pathname.split('/')[1]`; `select * from tenants where slug = $slug`. |
| **Subdomain** (`sse.outpost.hypeify.com`) | Read `headers().get('host')` server-side | Resolve in `(app)/layout.jsx` (server component) and pass `tenant` as a prop. |
| **Membership-based** (single tenant per user, default tenant) | After auth, read `profiles.default_tenant` or first active membership | Resolve in `(app)/layout.jsx` after the auth check. |

Whichever is chosen, the shape returned to `TenantProvider` is the
`TenantConfig` object documented in `src/lib/tenant/types.js`. Inside the
DB, that's the joined row of `tenants` + `tenant_config`.

The user has confirmed: **start with path-based** (`/sse/...`) for
simplicity. Adding subdomain support later is purely a router concern.

---

## Database / migrations

Run order, against the Hypeify-owned Supabase project:

```
0001_init_tenants.sql       — tenants, profiles, roles, memberships, invitations,
                              tenant_config, audit_log
0002_domain_tables.sql      — locations, inspection_templates, schedules,
                              inspections, issues, issue_activity, documents,
                              document_requests, surveys (+ submissions, responses),
                              reference_data, notifications_outbox, webhook_endpoints
0003_rls_policies.sql       — RLS on every table; is_member() helper; realtime adds
0004_seed_sse_tenant.sql    — SSE tenant row + 3 system roles + tenant_config row
0005_storage_buckets.sql    — tenant-files bucket + RLS policies
```

All migrations are **idempotent** (use `if not exists`, `on conflict do
nothing|update`). Safe to re-run.

The SSE tenant id is hardcoded at `00000000-0000-0000-0000-000000000001`
so the data-migration script can reference it deterministically.

### Data migration from the legacy single-tenant project

The current SSE app (Vite, on `main`) stores everything in a single JSONB
document per user via the `user_data` table / `useUserData` hook. To
migrate that user (the only one — testing account) into the new schema:

1. **Recreate the user**: have them sign in via the new Hypeify auth flow
   on the Outpost project. This creates `auth.users` + (via trigger) a
   `public.profiles` row.
2. **Insert the membership**:
   ```sql
   insert into public.tenant_memberships (tenant_id, user_id, role_id, status, joined_at)
   select '00000000-0000-0000-0000-000000000001',
          '<new auth.users.id>',
          (select id from public.roles
            where tenant_id='00000000-0000-0000-0000-000000000001'
              and name='Owner'),
          'active',
          now();
   ```
3. **Pull the legacy JSON**: `select data from user_data where user_id = '<old-user-id>'`
   from the *old* Supabase project. This is the giant document of
   `{ sites, schedule, inspections, reports, issues, corporate, inspectors }`.
4. **Fan out into relational rows** (script lives wherever Hypeify runs
   one-off scripts; pseudocode):
   - `sites[]` → `locations` rows (custom_fields JSONB carries pumps/brand/operator/manager)
   - `schedule[]` → `schedules` rows
   - `inspections[]` (in-progress) and `reports[]` (completed) → `inspections` rows with `state='in_progress'|'completed'`
   - `issues[]` → `issues` rows + their `notes/attachments/history` → `issue_activity` rows
   - `corporate[]` → `documents` rows (file_path stays pointing at the legacy `inspection-photos` bucket until the file move)
   - `inspectors[]` → `tenant_memberships` invites (currently a separate name list; either invite each or store as `inspector_name` snapshots)
5. **Photo URLs**: existing public URLs in legacy `inspection-photos`
   bucket continue to resolve. No need to move them. When/if you do
   migrate, copy each object into `tenant-files/<tenant_id>/<user_id>/inspections/<inspection_id>/<filename>`
   and rewrite the URL in the JSONB columns of `inspections.photos`.
6. **Verify**: a single `select count(*) from inspections where tenant_id = '00000...001'`
   should match the legacy report count.

A reference data-migration script can be added under
`scripts/migrate-sse-tenant.mjs` when ready.

---

## Storage

Bucket created in `0005_storage_buckets.sql`:

```
tenant-files (public)
└── {tenant_id}/{user_id}/{module}/{record_id}/{filename}
```

The first folder segment is the tenant_id (uuid). RLS policies match
that against `tenant_memberships` for the calling user.

Existing helper: `src/lib/photos.js` (legacy single-tenant uploader).
**Update this to take `tenantId` and write to `tenant-files`** before
the next round of feature work — but it can keep working pointing at the
legacy bucket during the cutover, since reads are public.

---

## Routes (final shape)

| Route | What it is | Public? |
|---|---|---|
| `/` | Public Outpost landing page | yes |
| `/login` | Auth (Hypeify shared login when integrated) | yes |
| `/dashboard` | Tenant home / KPIs | members only |
| `/sites` | Locations (the tenant calls them what they want — sites, restaurants, etc.) | members |
| `/schedule` | Calendar | members |
| `/inspection` | New / in-progress inspection runner | members |
| `/reports` | Completed inspections | members |
| `/issues` | Issue tracker with activity timeline | members |
| `/documents` | Generic doc vault (replaces SSE "Corporate Archive") | members |
| `/inspectors` | Inspector roster | members |
| `/settings` | Tenant admin (placeholder; surfaces tenant config summary) | members |

The `(app)/layout.jsx` enforces the auth gate and provides
`<TenantProvider>` and `<AppStateProvider>`. Pages are thin and just
render the corresponding view from `useAppState()`.

The sidebar / navigation order is currently hardcoded in `Sidebar.jsx`
for SSE parity. Move it to read `tenant.navigation` (already shaped for
this in the DB) when ready.

---

## What's deferred to Hypeify

These were intentionally **not** built in this foundation pass:

1. **Real Hypeify auth** — shim is in place; swap bodies in `lib/auth/hypeify.js`.
2. **Middleware-based auth gate** — current gate is client-side in
   `(app)/layout.jsx`. A `middleware.ts` reading the Supabase session
   cookie can replace it for server-rendered redirects.
3. **Multi-tenant routing** — currently always SSE. Wire path/subdomain
   resolution per "Tenant resolution" above.
4. **Custom domain support** (`vanguard.sevenstarenergy.com` →
   `outpost.hypeify.com/sse`) — Vercel domain config + a tiny rewrite
   step in `next.config.js`. Not needed for v1 cutover.
5. **Billing** — `tenant.feature_flags` is in place; gate UI on it.
   Stripe wiring lives in Hypeify proper.
6. **Surveys module full implementation** — DB scaffolding exists
   (`surveys`, `survey_submissions`, `survey_responses`,
   `reference_data`); UI is intentionally absent. SSE doesn't use it
   yet so no parity burden.
7. **Audit log writes** — table exists; add `public.log_audit()`
   security-definer RPC and call it from mutations when ready.
8. **Notifications outbox processor** — table exists; the cron / edge
   function that drains it is a Hypeify-platform concern.
9. **Webhook delivery** — `webhook_endpoints` table exists; the dispatcher
   is also platform-level.
10. **TypeScript** — kept JSX to minimize migration friction. Easy to
    convert later; `jsconfig.json` already has the path alias.
11. **i18n** — single-language for now.

---

## Sanity checks before merging into Hypeify

```bash
# install
npm install

# build
npm run build      # should produce a clean Next.js build with no missing imports

# run locally (will work even without env vars, since the auth shim allows null sessions)
npm run dev
# → visit http://localhost:3000      (landing page)
# → visit http://localhost:3000/login (auth)
```

Once `NEXT_PUBLIC_SUPABASE_URL` + anon key are wired and migrations
0001-0005 are applied, the same flow that works on the live Vanguard SSE
project should work end-to-end on Outpost for tenant SSE.

---

## Non-negotiable invariants (please preserve)

These are user constraints that survived the migration and should keep
guiding future changes:

1. **Tenant config is data, not code.** Anything that varies between
   tenants (branding, navigation, location form schema, status options,
   schedule types, issue/document categories, inspection templates,
   copy, defaults) lives in DB rows under `tenant_config` /
   `inspection_templates`. The `default-sse.js` file mirrors the seeded
   row for local dev only.
2. **Every domain row carries `tenant_id`.** Every RLS policy checks
   it via `is_member(tenant_id)`.
3. **Additive migrations only** when shipping changes.
4. **SSE feature parity is sacred.** The single-tenant Vanguard app on
   `main` keeps working until Hypeify cutover. Don't merge the
   `outpost-foundation` branch into `main` until the cutover plan is
   ready.
5. **No hardcoded customer assumptions** in product code. If you find
   any (e.g. references to "Seven Star", "ARCO", "pumps" outside the
   SSE tenant config), they're bugs.
