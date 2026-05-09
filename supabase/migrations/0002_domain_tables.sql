-- ============================================================
-- 0002_domain_tables.sql
-- ============================================================
-- Adds the per-tenant operational tables: locations, schedules,
-- inspection_templates, inspections, issues, issue_activity, documents,
-- and the surveys scaffolding.
--
-- Every row carries tenant_id and FK-cascades on tenant deletion.

-- ----- locations ----------------------------------------------
create table if not exists public.locations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  parent_id       uuid references public.locations(id) on delete set null,
  type            text not null default 'site',     -- site|district|region (tenant-defined)
  name            text not null,
  external_id     text,
  address         jsonb,
  custom_fields   jsonb not null default '{}'::jsonb,
  status          text,
  tags            text[] not null default '{}',
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists locations_tenant_external_idx
  on public.locations (tenant_id, external_id)
  where external_id is not null;

create index if not exists locations_tenant_idx on public.locations (tenant_id);

-- Optional location-scoping for users.
create table if not exists public.membership_location_scope (
  membership_id   uuid not null references public.tenant_memberships(id) on delete cascade,
  location_id     uuid not null references public.locations(id) on delete cascade,
  primary key (membership_id, location_id)
);

-- ----- inspection_templates -----------------------------------
create table if not exists public.inspection_templates (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  name               text not null,
  description        text,
  schema             jsonb not null,                -- sections + items
  scoring_rules      jsonb not null,                -- totalPoints, passingPercentage, etc.
  dynamic_sections   jsonb not null default '[]'::jsonb,
  version            int not null default 1,
  is_active          boolean not null default true,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (tenant_id, name, version)
);

-- ----- schedules ----------------------------------------------
create table if not exists public.schedules (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  location_id     uuid references public.locations(id) on delete cascade,
  template_id     uuid references public.inspection_templates(id) on delete set null,
  scheduled_at    timestamptz not null,
  duration_min    int,
  inspector_user  uuid references auth.users(id) on delete set null,
  inspector_name  text,
  type            text,
  status          text not null default 'scheduled',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists schedules_tenant_idx on public.schedules (tenant_id, scheduled_at);

-- ----- inspections --------------------------------------------
-- Stores both in-progress walks and completed reports. `state` field
-- distinguishes. completed/discarded inspections are immutable.
create table if not exists public.inspections (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  location_id     uuid references public.locations(id) on delete cascade,
  template_id     uuid references public.inspection_templates(id) on delete set null,
  template_version int,
  schedule_id     uuid references public.schedules(id) on delete set null,
  inspector_user  uuid references auth.users(id) on delete set null,
  inspector_name  text,                              -- denormalized snapshot
  state           text not null default 'in_progress', -- in_progress|completed|discarded
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  answers         jsonb not null default '{}'::jsonb,
  comments        jsonb not null default '{}'::jsonb,
  photos          jsonb not null default '{}'::jsonb,
  notes           jsonb not null default '[]'::jsonb,
  pump_positions  int,
  score_summary   jsonb,
  fails           jsonb not null default '[]'::jsonb
);
create index if not exists inspections_tenant_idx
  on public.inspections (tenant_id, completed_at desc);
create index if not exists inspections_location_idx
  on public.inspections (location_id);

-- ----- issues -------------------------------------------------
create table if not exists public.issues (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  location_id        uuid references public.locations(id) on delete cascade,
  source_inspection  uuid references public.inspections(id) on delete set null,
  source_item_id     text,
  category           text,
  severity           text,
  status             text not null default 'open',
  title              text not null,
  description        text,
  assignee_user      uuid references auth.users(id) on delete set null,
  assignee_name      text,
  due_at             timestamptz,
  opened_at          timestamptz not null default now(),
  resolved_at        timestamptz,
  archived_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists issues_tenant_status_idx
  on public.issues (tenant_id, status);
create index if not exists issues_location_idx on public.issues (location_id);

create table if not exists public.issue_activity (
  id              uuid primary key default gen_random_uuid(),
  issue_id        uuid not null references public.issues(id) on delete cascade,
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  type            text not null,                   -- created|note|status_change|attachment|assignment
  actor_user      uuid references auth.users(id) on delete set null,
  actor_name      text,
  payload         jsonb not null default '{}'::jsonb,
  attachment      jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists issue_activity_issue_idx
  on public.issue_activity (issue_id, created_at);

-- ----- documents ----------------------------------------------
-- Replaces the SSE-specific Corporate Archive. Generic per-location
-- file vault with tenant-defined categories.
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  location_id     uuid references public.locations(id) on delete cascade,
  name            text not null,
  category        text,
  file_path       text,                            -- Storage path
  file_url        text,                            -- public URL convenience
  file_name       text,
  file_content_type text,
  file_size       int,
  issue_date      date,
  expires_at      date,
  notes           text,
  uploaded_by     uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  archived_at     timestamptz
);
create index if not exists documents_tenant_idx
  on public.documents (tenant_id, category, issue_date desc);
create index if not exists documents_location_idx on public.documents (location_id);

create table if not exists public.document_requests (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  location_id     uuid references public.locations(id) on delete cascade,
  document_kind   text not null,
  requested_by    uuid references auth.users(id) on delete set null,
  due_at          timestamptz,
  status          text not null default 'open',
  fulfilled_doc   uuid references public.documents(id) on delete set null,
  created_at      timestamptz not null default now(),
  fulfilled_at    timestamptz
);

-- ----- surveys (generic scaffolding) --------------------------
-- Designed for the gas-price use case but reusable for any
-- recurring two-way data collection.
create table if not exists public.surveys (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  name               text not null,
  description        text,
  field_schema       jsonb not null,
  cadence            jsonb,
  scope              jsonb,
  response_schema    jsonb,
  reference_data_kind text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.survey_submissions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  survey_id       uuid not null references public.surveys(id) on delete cascade,
  location_id     uuid references public.locations(id) on delete cascade,
  submitted_by    uuid references auth.users(id) on delete set null,
  submitted_at    timestamptz not null default now(),
  data            jsonb not null,
  status          text not null default 'submitted'
);
create index if not exists survey_submissions_survey_idx
  on public.survey_submissions (survey_id, submitted_at desc);

create table if not exists public.survey_responses (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.survey_submissions(id) on delete cascade,
  responder_user  uuid references auth.users(id) on delete set null,
  responded_at    timestamptz not null default now(),
  action          text,
  payload         jsonb
);

-- User-proposed reference data (e.g. competitor stations) with an
-- approval queue. Generic; the survey config names the `kind`.
create table if not exists public.reference_data (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  kind            text not null,
  payload         jsonb not null,
  status          text not null default 'pending',
  proposed_by     uuid references auth.users(id) on delete set null,
  approved_by     uuid references auth.users(id) on delete set null,
  approved_at     timestamptz,
  rejected_reason text,
  created_at      timestamptz not null default now()
);

-- ----- notifications + webhooks (stubs) ----------------------
create table if not exists public.notifications_outbox (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references public.tenants(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  channel         text not null,
  template_key    text,
  payload         jsonb,
  status          text not null default 'pending',
  attempts        int not null default 0,
  last_error      text,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);

create table if not exists public.webhook_endpoints (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text,
  url             text not null,
  secret          text,
  events          text[] not null default '{}',
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
