-- ============================================================
-- 0004_seed_sse_tenant.sql
-- ============================================================
-- Seeds tenant #1 (Seven Star Energy) plus the system roles every
-- tenant gets at creation. Idempotent — safe to re-run.
--
-- This intentionally does NOT seed the existing SSE user as a
-- membership. That happens in the data-migration script that runs
-- after Hypeify auth recreates the user account in this project.

insert into public.tenants (id, slug, name, parent_brand, branding, feature_flags, status)
values (
  '00000000-0000-0000-0000-000000000001',
  'sse',
  'Seven Star Energy',
  'hypeify',
  jsonb_build_object(
    'appName', 'Vanguard',
    'parentName', 'Seven Star Energy',
    'appLogoIcon', 'shield',
    'appLogoAccent', '#fbbf24',
    'parentLogoUrl', '/seven-star-logo.png',
    'pdfFooterLine', 'Vanguard · by Seven Star Energy',
    'loginCopy', 'Internal use only',
    'eyebrow', 'Pre-Inspection'
  ),
  jsonb_build_object(
    'inspections', true,
    'issues', true,
    'documents', true,
    'inspectors', true,
    'schedule', true,
    'surveys', false,
    'reports', true
  ),
  'active'
)
on conflict (slug) do update
  set name = excluded.name,
      branding = excluded.branding,
      feature_flags = excluded.feature_flags,
      updated_at = now();

-- System roles. Owner / Admin / Member. Permissions are coarse for now;
-- finer-grained module gating can layer on later.
insert into public.roles (id, tenant_id, name, description, is_system, permissions)
values
  ('00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   'Owner',
   'Full access including billing and tenant config.',
   true,
   jsonb_build_object('admin', true, 'modules', '*')),
  ('00000000-0000-0000-0000-000000000011',
   '00000000-0000-0000-0000-000000000001',
   'Admin',
   'Full access except billing.',
   true,
   jsonb_build_object('admin', true, 'billing', false, 'modules', '*')),
  ('00000000-0000-0000-0000-000000000012',
   '00000000-0000-0000-0000-000000000001',
   'Member',
   'Standard inspector / staff access.',
   true,
   jsonb_build_object('admin', false, 'modules', '*'))
on conflict (tenant_id, name) do nothing;

-- Tenant config — the previously-hardcoded SSE configuration as data.
insert into public.tenant_config (
  tenant_id,
  navigation,
  location_field_schema,
  location_status_options,
  schedule_types,
  issue_categories,
  document_categories,
  copy,
  defaults
) values (
  '00000000-0000-0000-0000-000000000001',
  $json$
    [
      { "id": "dashboard",  "label": "Dashboard",         "icon": "LayoutDashboard", "route": "/dashboard" },
      { "id": "sites",      "label": "Sites",             "icon": "MapPin",          "route": "/sites" },
      { "id": "schedule",   "label": "Schedule",          "icon": "Calendar",        "route": "/schedule" },
      { "id": "inspection", "label": "Inspection",        "icon": "ClipboardCheck",  "route": "/inspection" },
      { "id": "reports",    "label": "Reports",           "icon": "FileText",        "route": "/reports" },
      { "id": "documents",  "label": "Corporate Archive", "icon": "Archive",         "route": "/documents" },
      { "id": "issues",     "label": "Issues Tracker",    "icon": "AlertTriangle",   "route": "/issues" },
      { "id": "inspectors", "label": "Inspectors",        "icon": "Users",           "route": "/inspectors" }
    ]
  $json$::jsonb,
  $json$
    {
      "fields": [
        { "id": "name",     "label": "Site name",       "type": "text",     "required": true },
        { "id": "id",       "label": "Site ID",         "type": "text" },
        { "id": "address",  "label": "Street address",  "type": "text",     "required": true },
        { "id": "city",     "label": "City, State",     "type": "text",     "required": true },
        { "id": "zip",      "label": "ZIP",             "type": "text" },
        { "id": "brand",    "label": "Brand",           "type": "select",   "required": true,
          "options": ["Shell","Marathon","ARCO","Sunoco","BP","Unbranded"] },
        { "id": "pumps",    "label": "Pumps",           "type": "number",   "required": true,
          "hint": "Total fueling positions" },
        { "id": "nextDue",  "label": "Next corporate due", "type": "date" },
        { "id": "notes",    "label": "Notes",           "type": "textarea" },
        { "id": "operator", "label": "Operator",        "type": "contact" },
        { "id": "manager",  "label": "Site Manager",    "type": "contact" }
      ]
    }
  $json$::jsonb,
  $json$
    [
      { "id": "good",            "label": "Performing", "tone": "emerald" },
      { "id": "needs-attention", "label": "Watch",      "tone": "amber" },
      { "id": "critical",        "label": "Critical",   "tone": "red" }
    ]
  $json$::jsonb,
  $json$
    ["Full Audit","Image Essentials Only","Pump Sweep","Pre-Corporate","Brand Standards","Daily Ops","Weekly Walk"]
  $json$::jsonb,
  $json$
    ["Image Essentials","Service Essentials","Brand Standards","Customer Experience",
     "Customer Service","Restrooms","Equipment","Tobacco","Lottery","Inventory",
     "Compliance & Legal","Other"]
  $json$::jsonb,
  $json$
    ["Corporate Mystery Shop","Brand Audit","Compliance Inspection","Permits","Other"]
  $json$::jsonb,
  jsonb_build_object(
    'inspectionLabel', 'Inspection',
    'documentsLabel', 'Corporate Archive',
    'reportsLabel', 'Reports'
  ),
  jsonb_build_object(
    'photoLimitPerItem', 5,
    'photoMaxLongSidePx', 1600,
    'photoJpegQuality', 0.82,
    'inspectionPdfPaper', 'a4'
  )
)
on conflict (tenant_id) do update
  set navigation = excluded.navigation,
      location_field_schema = excluded.location_field_schema,
      location_status_options = excluded.location_status_options,
      schedule_types = excluded.schedule_types,
      issue_categories = excluded.issue_categories,
      document_categories = excluded.document_categories,
      copy = excluded.copy,
      defaults = excluded.defaults,
      updated_at = now();
