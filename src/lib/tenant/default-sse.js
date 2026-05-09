// =====================================================================
// Seven Star Energy — tenant #1 seed config
// =====================================================================
// This is the data Outpost reads to render SSE's experience. Every value
// in this file used to live hardcoded somewhere in the app. Moving them
// here is the white-label foundation: tenant #2 (a QSR, an HVAC chain,
// whatever) gets a different file like this and the same code drives a
// completely different UI.
//
// In production this object lives as a row in `public.tenants` +
// `public.tenant_config` + `public.inspection_templates`. Until the
// Hypeify Supabase project is up, TenantProvider loads this file as a
// static fallback so SSE has zero downtime during the migration.

const SSE_INSPECTION_TEMPLATE = {
  id: "sse-default-inspection",
  name: "Site Inspection",
  description:
    "200-point unified inspection — Image / Service Essentials are critical, Compliance & Legal is zero-tolerance, ≥85% required to pass.",
  version: 1,
  scoringRules: {
    totalPoints: 200,
    passingPercentage: 0.85,
    criticalSectionIds: ["image", "service"],
    zeroToleranceSectionIds: ["compliance-legal"],
  },
  // Pumps & Fueling Positions is generated per-inspection sized to the
  // location's `pumps` field (literal position count, not pumps × 2).
  dynamicSections: [
    {
      id: "pumps",
      kind: "per-location-count",
      sourceField: "pumps",
      label: "Pumps & Fueling Positions",
      itemPrefix: "P",
      questionTemplate:
        "Position {n} — clean, operational, free of graffiti and stickers?",
      documentation: true,
      subtitle:
        "Per-position check. Mark N/A for any positions that don't exist.",
    },
  ],
  sections: [
    {
      id: "image",
      label: "Image Essentials",
      critical: true,
      subtitle: "MUST PASS — any failure here fails the entire report",
      items: [
        { id: "I-1",  q: "Primary ID sign (PID) clean and well-maintained with prices properly displayed?", pts: 8 },
        { id: "I-2",  q: "Forecourt area well-maintained?", pts: 8 },
        { id: "I-3a", q: "Canopy clean and well-maintained?", pts: 7 },
        { id: "I-3b", q: "Location well-lit during hours of darkness?", pts: 5 },
        { id: "I-4",  q: "Pumps well-maintained and in working order?", pts: 8 },
        { id: "I-5",  q: "Interior of the store clean, well-lit, and accessible?", pts: 7 },
        { id: "I-6",  q: "Restrooms available, functioning/operational, and well-lit?", pts: 7 },
      ],
    },
    {
      id: "service",
      label: "Service Essentials",
      critical: true,
      subtitle: "MUST PASS — any failure here fails the entire report",
      items: [
        { id: "S-1", q: "Restrooms clean, stocked with toilet paper, soap, and paper towels?", pts: 7 },
        { id: "S-2", q: "Forecourt area cleaned (no debris, spills, or trash)?", pts: 7 },
        { id: "S-3", q: "Fuel island amenities stocked and clean (squeegees, towels, water)?", pts: 7 },
        { id: "S-4", q: "Pumps clean (top, skirt, valance)?", pts: 7 },
        { id: "S-5", q: "Cashier wearing a clean, brand-approved uniform shirt or nametag?", pts: 6 },
        { id: "S-6", q: "Cashier acknowledged you during your visit?", pts: 6 },
      ],
    },
    {
      id: "compliance-legal",
      label: "Compliance & Legal",
      critical: true,
      zeroTolerance: true,
      subtitle: "ZERO TOLERANCE — single failure is grounds for immediate brand action",
      items: [
        { id: "C-1", q: "Site does NOT sell drug paraphernalia (scales, pipes, bongs, glass blunts, rolling trays for non-tobacco use, smoking accessories)?", pts: 10 },
        { id: "C-2", q: "All employees attentive (not on phone, eating, smoking, or distracted while on duty)?", pts: 5 },
        { id: "C-3", q: "ID scanner / age-verification system working for tobacco and alcohol sales?", pts: 5 },
      ],
    },
    {
      id: "brand",
      label: "Brand Standards & Site Condition",
      items: [
        { id: "BS-1", q: "Channel letters and canopy fascia well-maintained, meet brand standards?", pts: 3 },
        { id: "BS-2", q: "Top Tier branding visible on all gasoline dispensers?", pts: 2 },
        { id: "BS-3", q: "No more than one fueling position out of order?", pts: 3 },
        { id: "BS-4", q: "Trash receptacles have lids and meet brand standards?", pts: 2 },
        { id: "BS-5", q: "Dispenser island curbs and bollards well-maintained (no rust, chips, bent)?", pts: 2 },
        { id: "BS-6", q: "Building curbs and perimeter curbs well-maintained?", pts: 2 },
        { id: "BS-7", q: "Landscaped areas and parking lot clean, well-maintained, no potholes?", pts: 3 },
        { id: "BS-8", q: "Building exterior (paint, siding, soffit, gutters) well-maintained?", pts: 2 },
        { id: "BS-9", q: "Windows clear, unobstructed view (no excessive signage blocking forecourt visibility)?", pts: 3 },
      ],
    },
    {
      id: "experience",
      label: "Customer Experience",
      items: [
        { id: "D-1", q: "Product shelves, displays, coolers, and food-service areas clean and functioning?", pts: 3 },
        { id: "D-2", q: "C-store has a good selection of products?", pts: 2 },
        { id: "D-3", q: "Food service offer present and well-stocked?", pts: 2 },
        { id: "D-4", q: "Staff pleasant, polite, made you feel valued?", pts: 3 },
        { id: "D-5", q: "Carwash present, clean, and fully operational?", pts: 2 },
      ],
    },
    {
      id: "marketing",
      label: "Marketing Programs",
      items: [
        { id: "M-1", q: "Site displaying current National Campaign POP in forecourt?", pts: 3 },
        { id: "M-2", q: "Cashier mentioned the loyalty / rewards program?", pts: 3 },
        { id: "M-3", q: "Loyalty / Rewards prompt present on dispenser screens?", pts: 2 },
      ],
    },
    {
      id: "operations",
      label: "Operations & Inventory",
      items: [
        { id: "OP-1",  q: "Beer cooler fully stocked, faced, and rotated FIFO?", pts: 2 },
        { id: "OP-2",  q: "No expired dairy, sandwiches, or perishables on the floor?", pts: 3 },
        { id: "OP-3",  q: "Coffee station fully stocked (cups, lids, creamer, sweeteners)?", pts: 2 },
        { id: "OP-4",  q: "Cigarette par stock met (no SKU below 2 cartons)?", pts: 2 },
        { id: "OP-5",  q: "Tobacco prices accurate, and price tags visible, legible, and current?", pts: 2 },
        { id: "OP-6",  q: "Beverage cooler and freezer temperatures within target ranges (capture readings as a comment)?", pts: 3 },
        { id: "OP-7",  q: "ATM operational, stocked, and surcharge posted clearly?", pts: 1 },
        { id: "OP-8",  q: "Lottery terminal operational and scratch-off display fully stocked?", pts: 1 },
        { id: "OP-9",  q: "Pull-tab game machines stocked and functional?", pts: 1 },
        { id: "OP-10", q: "Tobacco buy-down / rebate program tracked accurately, qty limits met for each active deal?", pts: 3 },
      ],
    },
    {
      id: "equipment",
      label: "Equipment & Compliance",
      items: [
        { id: "EQ-1", q: "All security cameras live, recording, and feeds visible on the DVR/monitor?", pts: 3 },
        { id: "EQ-2", q: "DVR retention current (≥30 days), timestamps accurate, and footage reviewable?", pts: 3 },
        { id: "EQ-3", q: "Fire extinguishers tagged within the last 12 months and in unobstructed locations?", pts: 2 },
        { id: "EQ-4", q: "Underground storage tank (UST) monitoring system clear — no active alarms?", pts: 3 },
        { id: "EQ-5", q: "Air pump operational, hose intact, pressure gauge accurate?", pts: 2 },
        { id: "EQ-6", q: "Vacuum operational, suction strong, hoses clean and intact?", pts: 2 },
        { id: "EQ-7", q: "Forecourt emergency stop button labeled, accessible, and tested per schedule?", pts: 1 },
      ],
    },
    {
      id: "food-safety",
      label: "Food Service & Sanitation",
      subtitle: "Mark items N/A if the site doesn't have food service / a kitchen.",
      items: [
        { id: "FS-1", q: "Compartment / 3-bay sink clean, fully operational, with hot water (≥110°F)? Capture photo.", pts: 2 },
        { id: "FS-2", q: "Hand-wash sinks stocked (soap, paper towels), accessible, and in good repair?", pts: 2 },
        { id: "FS-3", q: "Food prep surfaces, slicers, and utensils clean and sanitized?", pts: 2 },
        { id: "FS-4", q: "Hot food holding temperatures at or above 135°F (rollers, warmers, etc.)?", pts: 2 },
        { id: "FS-5", q: "All prepared food labeled with prep / use-by dates; nothing past discard?", pts: 2 },
        { id: "FS-6", q: "Hood / exhaust ventilation clean, no excessive grease buildup, filters in place?", pts: 2 },
      ],
    },
  ],
};

export const SSE_TENANT_CONFIG = {
  tenantId: "sse",
  slug: "sse",
  name: "Seven Star Energy",
  branding: {
    appName: "Vanguard",
    parentName: "Seven Star Energy",
    appLogoIcon: "shield",
    appLogoAccent: "#fbbf24",
    parentLogoUrl: "/seven-star-logo.png",
    pdfFooterLine: "Vanguard · by Seven Star Energy",
    loginCopy: "Internal use only",
    eyebrow: "Pre-Inspection",
  },
  navigation: [
    { id: "dashboard",  label: "Dashboard",         icon: "LayoutDashboard", route: "/dashboard" },
    { id: "sites",      label: "Sites",             icon: "MapPin",          route: "/sites" },
    { id: "schedule",   label: "Schedule",          icon: "Calendar",        route: "/schedule" },
    { id: "inspection", label: "Inspection",        icon: "ClipboardCheck",  route: "/inspection" },
    { id: "reports",    label: "Reports",           icon: "FileText",        route: "/reports" },
    { id: "documents",  label: "Corporate Archive", icon: "Archive",         route: "/documents" },
    { id: "issues",     label: "Issues Tracker",    icon: "AlertTriangle",   route: "/issues" },
    { id: "inspectors", label: "Inspectors",        icon: "Users",           route: "/inspectors" },
  ],
  locationFieldSchema: {
    fields: [
      { id: "name",     label: "Site name",       type: "text",     required: true },
      { id: "id",       label: "Site ID",         type: "text" },
      { id: "address",  label: "Street address",  type: "text",     required: true },
      { id: "city",     label: "City, State",     type: "text",     required: true },
      { id: "zip",      label: "ZIP",             type: "text" },
      {
        id: "brand",
        label: "Brand",
        type: "select",
        required: true,
        options: ["Shell", "Marathon", "ARCO", "Sunoco", "BP", "Unbranded"],
      },
      { id: "pumps",    label: "Pumps",           type: "number",   required: true, hint: "Total fueling positions" },
      { id: "nextDue",  label: "Next corporate due", type: "date" },
      { id: "notes",    label: "Notes",           type: "textarea" },
      { id: "operator", label: "Operator",        type: "contact" },
      { id: "manager",  label: "Site Manager",    type: "contact" },
    ],
  },
  locationStatusOptions: [
    { id: "good",             label: "Performing", tone: "emerald" },
    { id: "needs-attention",  label: "Watch",      tone: "amber" },
    { id: "critical",         label: "Critical",   tone: "red" },
  ],
  scheduleTypes: [
    "Full Audit",
    "Image Essentials Only",
    "Pump Sweep",
    "Pre-Corporate",
    "Brand Standards",
    "Daily Ops",
    "Weekly Walk",
  ],
  issueCategories: [
    "Image Essentials",
    "Service Essentials",
    "Brand Standards",
    "Customer Experience",
    "Customer Service",
    "Restrooms",
    "Equipment",
    "Tobacco",
    "Lottery",
    "Inventory",
    "Compliance & Legal",
    "Other",
  ],
  documentCategories: [
    "Corporate Mystery Shop",
    "Brand Audit",
    "Compliance Inspection",
    "Permits",
    "Other",
  ],
  features: {
    inspections: true,
    issues: true,
    documents: true,        // Corporate Archive renamed and generalized
    inspectors: true,
    schedule: true,
    surveys: false,         // module ships off; SSE will enable when ready
    reports: true,
  },
  inspectionTemplates: [SSE_INSPECTION_TEMPLATE],
  copy: {
    inspectionLabel: "Inspection",
    documentsLabel: "Corporate Archive",   // SSE-specific label for the generic Documents module
    reportsLabel: "Reports",
  },
  defaults: {
    photoLimitPerItem: 5,
    photoMaxLongSidePx: 1600,
    photoJpegQuality: 0.82,
    inspectionPdfPaper: "a4",
  },
};

export default SSE_TENANT_CONFIG;
