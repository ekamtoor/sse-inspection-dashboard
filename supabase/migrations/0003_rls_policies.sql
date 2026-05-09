-- ============================================================
-- 0003_rls_policies.sql
-- ============================================================
-- Row-Level Security on every domain table. The rule is uniform:
-- a user can read/write a row in tenant T only if they have an active
-- membership in tenant T. Mutation actions can additionally check
-- role permissions via has_action(), wired up later.
--
-- Hypeify Claude Code: location-scoped users (membership_location_scope)
-- need an additional clause on tables with location_id; left out here
-- to keep v1 simple. Add it when you ship location-scoped roles.

-- ----- helpers -----------------------------------------------
create or replace function public.is_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_memberships m
    where m.tenant_id = t
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- ----- tenants -----------------------------------------------
alter table public.tenants enable row level security;

create policy "tenants: members can read"
  on public.tenants for select
  using (public.is_member(id));

create policy "tenants: members can update branding/config"
  on public.tenants for update
  using (public.is_member(id));

-- ----- profiles ---------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (user_id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (user_id = auth.uid());

create policy "profiles: insert own"
  on public.profiles for insert
  with check (user_id = auth.uid());

-- ----- roles ------------------------------------------------
alter table public.roles enable row level security;
create policy "roles: tenant members"
  on public.roles for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- tenant_memberships -----------------------------------
alter table public.tenant_memberships enable row level security;

-- A user can see their own membership row in any tenant.
create policy "memberships: read own or tenant members"
  on public.tenant_memberships for select
  using (
    user_id = auth.uid()
    or public.is_member(tenant_id)
  );
create policy "memberships: tenant admins can write"
  on public.tenant_memberships for insert
  with check (public.is_member(tenant_id));
create policy "memberships: tenant admins can update"
  on public.tenant_memberships for update
  using (public.is_member(tenant_id));

-- ----- tenant_invitations -----------------------------------
alter table public.tenant_invitations enable row level security;
create policy "invitations: tenant members"
  on public.tenant_invitations for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- tenant_config ----------------------------------------
alter table public.tenant_config enable row level security;
create policy "tenant_config: tenant members"
  on public.tenant_config for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- audit_log --------------------------------------------
alter table public.audit_log enable row level security;
-- Read open to all members; writes happen via security-definer functions
-- so the app doesn't need direct insert privileges.
create policy "audit_log: tenant members read"
  on public.audit_log for select
  using (public.is_member(tenant_id));

-- ----- locations --------------------------------------------
alter table public.locations enable row level security;
create policy "locations: tenant members"
  on public.locations for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

alter table public.membership_location_scope enable row level security;
create policy "membership_location_scope: members read"
  on public.membership_location_scope for select
  using (
    exists (
      select 1 from public.tenant_memberships m
      where m.id = membership_id
        and (m.user_id = auth.uid() or public.is_member(m.tenant_id))
    )
  );

-- ----- inspection_templates ---------------------------------
alter table public.inspection_templates enable row level security;
create policy "inspection_templates: tenant members"
  on public.inspection_templates for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- schedules --------------------------------------------
alter table public.schedules enable row level security;
create policy "schedules: tenant members"
  on public.schedules for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- inspections ------------------------------------------
alter table public.inspections enable row level security;
create policy "inspections: tenant members"
  on public.inspections for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- issues + issue_activity ------------------------------
alter table public.issues enable row level security;
create policy "issues: tenant members"
  on public.issues for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

alter table public.issue_activity enable row level security;
create policy "issue_activity: tenant members"
  on public.issue_activity for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- documents --------------------------------------------
alter table public.documents enable row level security;
create policy "documents: tenant members"
  on public.documents for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

alter table public.document_requests enable row level security;
create policy "document_requests: tenant members"
  on public.document_requests for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- surveys ----------------------------------------------
alter table public.surveys enable row level security;
create policy "surveys: tenant members"
  on public.surveys for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

alter table public.survey_submissions enable row level security;
create policy "survey_submissions: tenant members"
  on public.survey_submissions for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

alter table public.survey_responses enable row level security;
create policy "survey_responses: members of submission's tenant"
  on public.survey_responses for all
  using (
    exists (
      select 1 from public.survey_submissions s
      where s.id = submission_id
        and public.is_member(s.tenant_id)
    )
  );

alter table public.reference_data enable row level security;
create policy "reference_data: tenant members"
  on public.reference_data for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- notifications + webhooks ----------------------------
alter table public.notifications_outbox enable row level security;
create policy "notifications_outbox: read own / tenant members"
  on public.notifications_outbox for select
  using (
    user_id = auth.uid()
    or (tenant_id is not null and public.is_member(tenant_id))
  );

alter table public.webhook_endpoints enable row level security;
create policy "webhook_endpoints: tenant members"
  on public.webhook_endpoints for all
  using (public.is_member(tenant_id))
  with check (public.is_member(tenant_id));

-- ----- realtime publication --------------------------------
-- Selectively expose tables to Supabase realtime. The client subscribes
-- with a tenant filter so cross-tenant noise stays isolated.
alter publication supabase_realtime add table public.inspections;
alter publication supabase_realtime add table public.issues;
alter publication supabase_realtime add table public.issue_activity;
alter publication supabase_realtime add table public.documents;
alter publication supabase_realtime add table public.tenant_config;
