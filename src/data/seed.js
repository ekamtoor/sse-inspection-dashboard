// Seed data for first-run accounts. Once a user has data in Supabase
// it never re-runs — these arrays exist purely to give a brand-new
// account something to look at on day one.

const EMPTY_CONTACT = { name: "", email: "", phone: "" };

export const SEED_SITES = [
  { id: "10009886", name: "6001 Far Hills Ave",   address: "6001 Far Hills Ave",   city: "Dayton, OH",         zip: "45459", brand: "Shell",     pumps: 8,  lastScore: 89,  lastInspection: "2026-03-11", nextDue: "2026-05-01", status: "needs-attention",
    operator: EMPTY_CONTACT, manager: EMPTY_CONTACT, notes: "Pump 4 history of intermittent card reader issues." },
  { id: "10009742", name: "2840 Wilmington Pike", address: "2840 Wilmington Pike", city: "Kettering, OH",      zip: "45419", brand: "Shell",     pumps: 6,  lastScore: 102, lastInspection: "2026-04-02", nextDue: "2026-06-15", status: "good",
    operator: EMPTY_CONTACT, manager: EMPTY_CONTACT, notes: "" },
  { id: "10010113", name: "175 W Central Ave",    address: "175 W Central Ave",    city: "Springboro, OH",     zip: "45066", brand: "Shell",     pumps: 8,  lastScore: 96,  lastInspection: "2026-03-28", nextDue: "2026-05-20", status: "good",
    operator: EMPTY_CONTACT, manager: EMPTY_CONTACT, notes: "" },
  { id: "218859",   name: "Dixie Gas & Go",       address: "6909 Dixie Hwy",       city: "Florence, KY",       zip: "41042", brand: "Marathon",  pumps: 6,  lastScore: 74,  lastInspection: "2026-02-22", nextDue: "2026-05-10", status: "critical",
    operator: EMPTY_CONTACT, manager: EMPTY_CONTACT, notes: "10 cures from 2026-Q1 corporate. Cure deadline 2026-03-26." },
  { id: "10010399", name: "1290 N Main St",       address: "1290 N Main St",       city: "Centerville, OH",    zip: "45459", brand: "Shell",     pumps: 10, lastScore: 104, lastInspection: "2026-04-15", nextDue: "2026-07-01", status: "good",
    operator: EMPTY_CONTACT, manager: EMPTY_CONTACT, notes: "Best-performing site. Reference for SOPs." },
  { id: "10010512", name: "8500 Yankee St",       address: "8500 Yankee St",       city: "Washington Twp, OH", zip: "45458", brand: "Marathon",  pumps: 8,  lastScore: 91,  lastInspection: "2026-04-08", nextDue: "2026-06-08", status: "good",
    operator: EMPTY_CONTACT, manager: EMPTY_CONTACT, notes: "" },
];

export const SEED_SCHEDULED = [
  { id: "S-2026-051", siteId: "218859",   date: "2026-04-30", time: "07:30", inspector: "",   type: "Pre-Corporate",     kind: "preinspect" },
  { id: "S-2026-052", siteId: "10009886", date: "2026-04-29", time: "06:00", inspector: "",   type: "Pump Sweep",        kind: "preinspect" },
  { id: "S-2026-053", siteId: "10010113", date: "2026-05-02", time: "09:00", inspector: "",   type: "Full Audit",        kind: "preinspect" },
  { id: "S-2026-054", siteId: "10010512", date: "2026-05-04", time: "08:15", inspector: "",   type: "Image Essentials",  kind: "preinspect" },
  { id: "S-2026-055", siteId: "10009886", date: "2026-04-29", time: "16:00", inspector: "",   type: "Daily Ops",         kind: "internal" },
];

export const SEED_ISSUES = [
  { id: "ISS-441", siteId: "10009886", category: "Image Essentials",   item: "I-4 — Pump condition",         severity: "critical", status: "open",        opened: "2026-03-11", note: "Multiple pumps flagged not functioning during shop. Vendor service call needed.",        assignee: "" },
  { id: "ISS-442", siteId: "218859",   category: "Restrooms",          item: "Q1.2 — Restroom cleanliness",  severity: "high",     status: "in-progress", opened: "2026-02-22", note: "Multiple infractions: trash on floor, layered grime on tiles. Deep clean and re-train custodial.", assignee: "" },
  { id: "ISS-443", siteId: "218859",   category: "Brand Standards",    item: "Q15 — POP outdated",           severity: "high",     status: "open",        opened: "2026-02-22", note: "None of the POP was current. Order current Marathon POP campaign immediately.",         assignee: "" },
  { id: "ISS-444", siteId: "218859",   category: "Customer Service",   item: "Q5 — Uniform compliance",      severity: "medium",   status: "open",        opened: "2026-02-22", note: "At least one employee on duty without uniform or nametag. Coaching + retrain.",         assignee: "" },
  { id: "ISS-445", siteId: "218859",   category: "Brand Standards",    item: "Q22 — Window obstruction",     severity: "medium",   status: "in-progress", opened: "2026-02-22", note: "Excessive signage blocking forecourt visibility. Remove non-essential window clings.",  assignee: "" },
  { id: "ISS-446", siteId: "10010113", category: "Customer Experience",item: "D-4 — Staff acknowledgment",   severity: "low",      status: "open",        opened: "2026-03-28", note: "Inconsistent greeting at counter.",                                                      assignee: "" },
  { id: "ISS-447", siteId: "10010113", category: "Service Essentials", item: "S-3 — Squeegee water",         severity: "medium",   status: "open",        opened: "2026-03-28", note: "Two of four squeegee buckets empty.",                                                    assignee: "" },
  { id: "ISS-448", siteId: "10010512", category: "Image Essentials",   item: "I-1 — PID price digit",        severity: "high",     status: "resolved",    opened: "2026-03-22", note: "Diesel digit out — replaced 3/24.",                                                      assignee: "" },
];

export const SEED_CORPORATE = [
  {
    id: "CORP-2026-Q1-001", siteId: "10009886", date: "2026-03-11", brand: "Shell", score: 89, total: 107,
    inspector: "Shell Mystery Shop (External)",
    sections: [
      { label: "Image Essentials",  earned: 33, total: 39, critical: true },
      { label: "Service Essentials", earned: 36, total: 36 },
      { label: "Marketing Programs", earned: 4,  total: 8  },
      { label: "Customer Experience",earned: 26, total: 28 },
    ],
    notes: "Failed I-4 (pumps). Cure window through 2026-05-01.",
    cures: ["I-4: Pump condition"],
  },
  {
    id: "CORP-2026-Q1-002", siteId: "218859", date: "2026-02-22", brand: "Marathon", score: 74, total: 100,
    inspector: "Marathon Mystery Shop (External)",
    sections: [
      { label: "Restrooms",            earned: 5,  total: 15 },
      { label: "C-Store",              earned: 10, total: 12 },
      { label: "Customer Service",     earned: 9,  total: 13 },
      { label: "Exterior / Forecourt", earned: 50, total: 60 },
    ],
    notes: "10 curable items. Cure deadline 2026-03-26. If cured, score becomes 85.",
    cures: ["Q9: MID", "Q11: Canopy columns", "Q12: Dispensers", "Q13: Fueling positions", "Q14: Valances", "Q15: POP", "Q18: Curbs/bollards", "Q19: Building curbs", "Q21: Building exterior", "Q22: Windows"],
  },
];
