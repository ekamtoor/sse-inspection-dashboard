// Unified inspection rubric. Combines pre-inspection (Shell + Marathon) and
// internal-ops checks into one walkthrough that totals 200 points exactly,
// regardless of brand. Items marked N/A by the inspector are removed from the
// denominator at scoring time so the percentage stays honest.
//
// Pass criteria (computed in lib/scoring.js):
//   1. No failed item in any section flagged `critical` (Image / Service)
//   2. No failed item in any section flagged `zeroTolerance` (Compliance)
//   3. Score >= 85% of effective total
//
// Section point totals: 50 + 40 + 20 + 30 + 15 + 10 + 20 + 15 = 200

export const SCHEMA = [
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
      { id: "BS-1",  q: "Channel letters and canopy fascia well-maintained, meet brand standards?", pts: 3 },
      { id: "BS-2",  q: "Top Tier branding visible on all gasoline dispensers?", pts: 3 },
      { id: "BS-3",  q: "No more than one fueling position out of order?", pts: 3 },
      { id: "BS-4",  q: "Trash receptacles have lids and meet brand standards?", pts: 3 },
      { id: "BS-5",  q: "Dispenser island curbs and bollards well-maintained (no rust, chips, bent)?", pts: 3 },
      { id: "BS-6",  q: "Building curbs and perimeter curbs well-maintained?", pts: 3 },
      { id: "BS-7",  q: "Landscaped areas and parking lot clean, well-maintained, no potholes?", pts: 3 },
      { id: "BS-8",  q: "Building exterior (paint, siding, soffit, gutters) well-maintained?", pts: 3 },
      { id: "BS-9",  q: "Windows clear, unobstructed view (no excessive signage blocking forecourt visibility)?", pts: 3 },
      { id: "BS-10", q: "Aisles free of clutter, pallets, and boxes (no active stocking exemption)?", pts: 3 },
    ],
  },
  {
    id: "experience",
    label: "Customer Experience",
    items: [
      { id: "D-1", q: "Product shelves, displays, coolers, and food-service areas clean and functioning?", pts: 3 },
      { id: "D-2", q: "C-store has a good selection of products?", pts: 3 },
      { id: "D-3", q: "Food service offer present and well-stocked?", pts: 3 },
      { id: "D-4", q: "Staff pleasant, polite, made you feel valued?", pts: 3 },
      { id: "D-5", q: "Carwash present, clean, and fully operational?", pts: 3 },
    ],
  },
  {
    id: "marketing",
    label: "Marketing Programs",
    items: [
      { id: "M-1", q: "Site displaying current National Campaign POP in forecourt?", pts: 4 },
      { id: "M-2", q: "Cashier mentioned the loyalty / rewards program?", pts: 3 },
      { id: "M-3", q: "Loyalty / Rewards prompt present on dispenser screens?", pts: 3 },
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
      { id: "OP-6",  q: "Beverage and freezer temperatures within target ranges?", pts: 3 },
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
      { id: "EQ-1", q: "Security cameras live, recording, and DVR retention current (≥30 days)?", pts: 3 },
      { id: "EQ-2", q: "Fire extinguishers tagged within the last 12 months?", pts: 3 },
      { id: "EQ-3", q: "Underground storage tank monitoring system clear (no alarms)?", pts: 3 },
      { id: "EQ-4", q: "Air pump operational, hose intact, gauge accurate?", pts: 3 },
      { id: "EQ-5", q: "Vacuum operational, suction strong, hoses clean?", pts: 3 },
    ],
  },
  {
    id: "pumps",
    label: "Pumps & Fueling Positions",
    documentation: true,
    subtitle: "Per-pump check — mark N/A for any positions that don't exist at the site. Failures here are tracked but do not change the 200-point score (overall pump quality is already scored under Image Essentials I-4 and Service Essentials S-4).",
    items: Array.from({ length: 16 }, (_, i) => ({
      id: `P-${i + 1}`,
      q: `Pump ${i + 1} — clean, operational, free of graffiti and stickers?`,
      pts: 0,
    })),
  },
];

// Sanity check for future edits — keeps the rubric honest at 200 points.
export const TOTAL_POINTS = SCHEMA.reduce(
  (sum, sec) => sum + sec.items.reduce((s, it) => s + it.pts, 0),
  0
);

// Threshold for the percentage component of the pass/fail rule.
export const PASSING_PERCENTAGE = 0.85;
