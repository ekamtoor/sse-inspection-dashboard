// =====================================================================
// Backwards-compatible SCHEMA exports
// =====================================================================
// Pre-Outpost migration this file held the SSE inspection rubric directly.
// Post-migration the rubric lives in the SSE tenant seed
// (src/lib/tenant/default-sse.js) and ultimately in the Hypeify Supabase
// database. This file re-exports the *current* SSE template so existing
// imports keep working until every call site is migrated to read from
// the tenant context (`useTenantInspectionTemplate()`).
//
// Hypeify Claude Code: when you finish the tenant-template refactor, this
// file goes away.

import SSE_TENANT_CONFIG from "../lib/tenant/default-sse.js";

const SSE_TEMPLATE = SSE_TENANT_CONFIG.inspectionTemplates[0];

export const SCHEMA = SSE_TEMPLATE.sections;

export const PASSING_PERCENTAGE = SSE_TEMPLATE.scoringRules.passingPercentage;

export const TOTAL_POINTS = SCHEMA.reduce(
  (sum, sec) => sum + sec.items.reduce((s, it) => s + it.pts, 0),
  0
);

export function buildPumpsSection(positionCount) {
  const count = Math.max(0, Math.floor(Number(positionCount) || 0));
  if (count === 0) return null;
  const dyn = SSE_TEMPLATE.dynamicSections?.find((d) => d.kind === "per-location-count");
  return {
    id: dyn?.id || "pumps",
    label: dyn?.label || "Pumps & Fueling Positions",
    documentation: dyn?.documentation ?? true,
    subtitle: dyn?.subtitle,
    items: Array.from({ length: count }, (_, i) => ({
      id: `${dyn?.itemPrefix || "P"}-${i + 1}`,
      q: (dyn?.questionTemplate || "Position {n} — clean, operational, free of graffiti and stickers?")
        .replace("{n}", String(i + 1)),
      pts: 0,
    })),
  };
}

export function resolvePumpPositions(input) {
  if (input == null) return 0;
  if (typeof input === "number") return input;
  if (typeof input.pumpPositions === "number") return input.pumpPositions;
  const sitePumps = Number(input.site?.pumps);
  if (Number.isFinite(sitePumps) && sitePumps > 0) return sitePumps;
  const directPumps = Number(input.pumps);
  if (Number.isFinite(directPumps) && directPumps > 0) return directPumps;
  return 0;
}

export function getInspectionSchema(input) {
  const positions = resolvePumpPositions(input);
  const pumps = buildPumpsSection(positions);
  return pumps ? [...SCHEMA, pumps] : SCHEMA;
}
