"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import SSE_TENANT_CONFIG from "./default-sse.js";

// =====================================================================
// TenantProvider — single source of truth for "which tenant am I?"
// =====================================================================
// Today: returns the SSE config statically. Outpost has one customer.
//
// Tomorrow (Hypeify integration): TenantProvider resolves the tenant from:
//   1. The session user's `default_tenant` (from profiles table)
//   2. Or a tenant slug in the path / subdomain
//   3. Then loads `public.tenants` + `public.tenant_config` +
//      `public.inspection_templates` rows for that tenant
// The shape returned to consumers stays the TenantConfig shape.
// =====================================================================

const TenantContext = createContext(null);

export function TenantProvider({ children, override }) {
  // `override` lets the layout pass a server-loaded tenant config in. Until
  // we wire up server-side tenant resolution, fall back to the SSE seed.
  const [config, setConfig] = useState(override || SSE_TENANT_CONFIG);

  useEffect(() => {
    if (override) setConfig(override);
  }, [override]);

  const value = useMemo(() => ({ tenant: config, setTenant: setConfig }), [config]);
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used inside <TenantProvider>");
  return ctx.tenant;
}

export function useTenantBranding() {
  return useTenant().branding;
}

export function useTenantNavigation() {
  return useTenant().navigation;
}

export function useTenantFeature(featureId) {
  const tenant = useTenant();
  return Boolean(tenant.features?.[featureId]);
}

export function useTenantInspectionTemplate(templateId) {
  const tenant = useTenant();
  if (!templateId) return tenant.inspectionTemplates?.[0] || null;
  return tenant.inspectionTemplates?.find((t) => t.id === templateId) || null;
}
