// =====================================================================
// Backwards-compatible SCHEMA exports + response-type helpers
// =====================================================================
// Pre-Outpost migration this file held the SSE inspection rubric directly.
// Post-migration the rubric lives in the SSE tenant seed
// (src/lib/tenant/default-sse.js) and ultimately in the Hypeify Supabase
// database. This file re-exports the *current* SSE template so existing
// imports keep working until every call site is migrated to read from
// the tenant context (`useTenantInspectionTemplate()`).
//
// Hypeify Claude Code: when you finish the tenant-template refactor, this
// file goes away — replace SCHEMA imports with reads from
// useTenantInspectionTemplate(), and replace the helpers below with
// equivalents that take the active template as input.
//
// Item shape (responseType extension):
//   id        : string
//   q         : question text
//   pts       : points (only meaningful for pass_fail items)
//   responseType (optional, default "pass_fail")
//      "pass_fail"  → 3-button row, contributes to score
//      "number"     → numeric input (optional `unit`, `min`, `max`); informational
//      "text"       → free-text input; informational
//      "select"     → dropdown with `options: string[]`; informational
//   Items without responseType behave exactly like the original Pass/Fail/N/A.

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

// Combine the inspection's stamped sections (or the default SCHEMA) with the
// dynamic Pumps section. Components that render every item in an inspection
// (InspectionView, ReportDetail, PDF) should use this; scoring rolls up the
// scored items in the same set, but per-pump checks contribute 0 points.
export function getInspectionSchema(input) {
  const baseSections = input?.template?.sections?.length > 0
    ? input.template.sections
    : SCHEMA;
  const positions = resolvePumpPositions(input);
  const pumps = buildPumpsSection(positions);
  return pumps ? [...baseSections, pumps] : baseSections;
}

// ---------- Response-type helpers ----------
export const RESPONSE_TYPES = ["pass_fail", "number", "text", "select"];

export function getResponseType(item) {
  return item?.responseType || "pass_fail";
}

export function isScored(item) {
  return getResponseType(item) === "pass_fail";
}

// ---------- Template stamping ----------
// At inspection start, we stamp the active template onto the inspection so
// the runner / report / PDF all read from the inspection's own template.
// That way, edits to the active template don't retroactively change old
// reports — each report keeps the structure it was generated against.
//
// Stored shape:
//   inspection.template = { name, sections, passingPercentage, version }
//
// Existing in-flight inspections without a stamped template fall back to
// the static SCHEMA, so legacy data keeps working unchanged.
export function buildDefaultTemplate() {
  return {
    name: SSE_TEMPLATE.name || "SSE 200-Point Pre-Inspection",
    version: SSE_TEMPLATE.version || 1,
    passingPercentage: PASSING_PERCENTAGE,
    sections: SCHEMA,
  };
}

// Active template resolution. If a custom template was imported / saved
// (via the template editor), it lives in user data and is passed in here.
// Otherwise we hand back the built-in default. Once Hypeify Claude Code
// wires the tenant context, the "default" should come from the tenant's
// active inspection_templates row, not from this file.
export function resolveActiveTemplate(customTemplate) {
  if (customTemplate?.sections?.length > 0) return customTemplate;
  return buildDefaultTemplate();
}

// Read a template off an inspection (or the default if absent). Used by the
// runner, reports, and PDF so they can all share one resolution path.
export function getInspectionTemplate(inspection) {
  if (inspection?.template?.sections?.length > 0) return inspection.template;
  return buildDefaultTemplate();
}
