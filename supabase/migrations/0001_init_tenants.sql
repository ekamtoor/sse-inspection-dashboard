-- ============================================================
-- 0001_init_tenants.sql
-- ============================================================
-- Multi-tenant foundation. Creates tenants, profiles, roles, memberships,
-- tenant_config, and audit_log. Every other domain table is added by later
-- migrations and references `tenant_id`.
--
-- Run order: this is the first migration on the Hypeify Outpost Supabase
-- project. Assumes Supabase Auth is enabled (auth.users exists).

-- ----- tenants ------------------------------------------------
create table if not exists public.tenants (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  parent_brand    text not null default 'hypeify',
  branding        jsonb not null default '{}'::jsonb,
  feature_flags   jsonb not null default '{}'::jsonb,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----- profiles -----------------------------------------------
-- Lightweight join to auth.users; safe to read on the client.
create table if not exists public.profiles (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  avatar_url      text,
  default_tenant  uuid references public.tenants(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ----- roles --------------------------------------------------
-- Tenant-defined roles. is_system rows ('owner','admin','member')
-- are seeded for every new tenant and cannot be deleted.
create table if not exists public.roles (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text not null,
  description     text,
  is_system       boolean not null default false,
  permissions     jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (tenant_id, name)
);

-- ----- tenant_memberships -------------------------------------
-- A user can belong to many tenants; one row per (tenant, user).
create table if not exists public.tenant_memberships (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role_id         uuid references public.roles(id) on delete set null,
  status          text not null default 'active',
  invited_by      uuid references auth.users(id) on delete set null,
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists tenant_memberships_user_idx
  on public.tenant_memberships (user_id);

-- ----- tenant_invitations -------------------------------------
create table if not exists public.tenant_invitations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  email           text not null,
  role_id         uuid references public.roles(id) on delete set null,
  token           text unique not null,
  expires_at      timestamptz not null,
  status          text not null default 'pending',
  invited_by      uuid references auth.users(id) on delete set null,
  accepted_by     uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ----- tenant_config ------------------------------------------
-- Single row per tenant holding all the white-label configuration that
-- used to live hardcoded in the SSE app: navigation, location field
-- schema, status options, schedule types, issue categories, document
-- categories, and tenant-overridable copy / defaults.
create table if not exists public.tenant_config (
  tenant_id                  uuid primary key references public.tenants(id) on delete cascade,
  navigation                 jsonb not null default '[]'::jsonb,
  location_field_schema      jsonb not null default '{}'::jsonb,
  location_status_options    jsonb not null default '[]'::jsonb,
  schedule_types             jsonb not null default '[]'::jsonb,
  issue_categories           jsonb not null default '[]'::jsonb,
  document_categories        jsonb not null default '[]'::jsonb,
  copy                       jsonb not null default '{}'::jsonb,
  defaults                   jsonb not null default '{}'::jsonb,
  updated_at                 timestamptz not null default now()
);

-- ----- audit_log ----------------------------------------------
-- Append-only audit trail. Writes happen from the app via a
-- security-definer function to keep RLS reads lean.
create table if not exists public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  actor_user      uuid references auth.users(id) on delete set null,
  action          text not null,
  target_type     text,
  target_id       uuid,
  before          jsonb,
  after           jsonb,
  ip              inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

create index if not exists audit_log_tenant_idx
  on public.audit_log (tenant_id, created_at desc);
