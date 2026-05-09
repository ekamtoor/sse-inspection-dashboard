"use client";

import Link from "next/link";
import { Settings as SettingsIcon, ExternalLink } from "lucide-react";
import { useTenant } from "@/lib/tenant/context.jsx";

// Placeholder tenant admin — will become the surface for editing branding,
// navigation, location field schema, role permissions, inspection
// templates, and document categories. Tenant Owners only.
//
// Hypeify Claude Code: build out CRUD for each section of tenant_config
// here. Permissions checked via the role/membership tables.
export default function SettingsPage() {
  const tenant = useTenant();
  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold">Workspace Settings</h1>
        <p className="text-sm text-stone-500 mt-1">
          {tenant.name} · {tenant.slug}
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5 flex items-start gap-3">
        <SettingsIcon className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="font-display text-base md:text-lg font-semibold text-amber-900">
            Admin surface coming soon
          </div>
          <p className="text-sm text-amber-800 mt-1">
            Tenant Owners will edit branding, navigation, form templates, location field schema,
            role permissions, and document categories from here. The data shape is already in
            place; the admin UI ships as part of the Hypeify integration phase.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <ConfigCard
          title="Branding"
          summary={`App: ${tenant.branding.appName} · Parent: ${tenant.branding.parentName || "—"}`}
        />
        <ConfigCard
          title="Navigation"
          summary={`${tenant.navigation.length} sidebar items`}
        />
        <ConfigCard
          title="Location field schema"
          summary={`${tenant.locationFieldSchema.fields.length} fields`}
        />
        <ConfigCard
          title="Inspection templates"
          summary={`${tenant.inspectionTemplates.length} template${tenant.inspectionTemplates.length === 1 ? "" : "s"}`}
        />
        <ConfigCard
          title="Issue categories"
          summary={`${tenant.issueCategories.length} options`}
        />
        <ConfigCard
          title="Document categories"
          summary={`${tenant.documentCategories.length} options`}
        />
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-5">
        <h2 className="font-display text-lg font-semibold">Hypeify integration</h2>
        <p className="text-sm text-stone-600 mt-2 leading-relaxed">
          Outpost is one product under the Hypeify parent brand. Some account-level controls
          (your profile, email/SMS preferences, password &amp; 2FA, billing) live on Hypeify
          itself and apply across every Hypeify product you use.
        </p>
        <Link
          href="https://hypeify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-stone-900 hover:underline"
        >
          Open Hypeify account <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

function ConfigCard({ title, summary }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">
        {title}
      </div>
      <div className="text-sm text-stone-800 mt-2">{summary}</div>
      <div className="text-[11px] text-stone-400 mt-3">Editing surface coming soon</div>
    </div>
  );
}
