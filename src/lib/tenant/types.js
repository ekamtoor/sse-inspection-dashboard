// =====================================================================
// Tenant config types (JSDoc — no TS dependency)
// =====================================================================
// A "tenant" is one customer org. SSE (Seven Star Energy) is tenant #1.
// The tenant config defines everything Outpost would otherwise hardcode:
// branding, navigation, location field schema, status options, inspection
// templates, document categories, role permissions, etc.
//
// In production this comes from `public.tenants` + `public.tenant_config`
// rows in the Hypeify Supabase project. For local dev / pre-integration,
// the SSE seed in default-sse.js is shipped statically and loaded by the
// TenantProvider.
//
// Hypeify Claude Code: when you wire in the multi-tenant DB, swap the
// loader in tenant/context.jsx to fetch from Supabase. The shape below
// stays the same.

/**
 * @typedef {Object} TenantBranding
 * @property {string}  appName              e.g. "Vanguard"
 * @property {string=} parentName           e.g. "Seven Star Energy"
 * @property {string=} appLogoUrl           public path or absolute URL
 * @property {string=} parentLogoUrl
 * @property {string=} faviconUrl
 * @property {Object=} colors               { primary, accent, surface, ... }
 * @property {string=} loginCopy            optional override for login intro
 * @property {string=} pdfFooterLine        optional override for PDF footer
 */

/**
 * @typedef {Object} TenantNavigationItem
 * @property {string} id                    matches a route or module
 * @property {string} label
 * @property {string} icon                  lucide icon name
 * @property {string=} route                /dashboard, /sites, etc.
 * @property {string=} subtitle
 * @property {string[]=} requiresPermissions
 * @property {boolean=} mobileBottomNav     show in the mobile primary nav
 */

/**
 * @typedef {Object} TenantLocationFieldSchema
 * @property {Array<{id:string,label:string,type:string,options?:any[]}>} fields
 *   Field types: text, number, select, multiselect, contact, address, status
 */

/**
 * @typedef {Object} TenantInspectionTemplate
 * @property {string} id
 * @property {string} name
 * @property {string=} description
 * @property {Array<Object>} sections         the SCHEMA shape from src/data/schema.js
 * @property {Object} scoringRules            { totalPoints, passingPercentage,
 *                                              criticalSectionIds, zeroToleranceSectionIds }
 * @property {Array<Object>=} dynamicSections  e.g. pumps generated from custom_fields.pumps
 * @property {number} version
 */

/**
 * @typedef {Object} TenantConfig
 * @property {string} tenantId
 * @property {string} slug                   e.g. "sse"
 * @property {string} name                   "Seven Star Energy"
 * @property {TenantBranding} branding
 * @property {TenantNavigationItem[]} navigation
 * @property {TenantLocationFieldSchema} locationFieldSchema
 * @property {string[]} locationStatusOptions
 * @property {string[]} scheduleTypes
 * @property {string[]} issueCategories
 * @property {string[]} documentCategories
 * @property {Object<string, boolean>} features    { corporate: true, surveys: false, ... }
 * @property {TenantInspectionTemplate[]} inspectionTemplates
 * @property {Object} copy                          tenant-overridable strings
 * @property {Object} defaults                      tenant defaults (photo limit, etc.)
 */

export const PLACEHOLDER = "Defined in default-sse.js";
