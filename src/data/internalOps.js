import {
  Banknote, Trophy, Cigarette, Snowflake, Coffee, Receipt, ShieldCheck,
  Boxes, Droplets, ShowerHead,
} from "lucide-react";

// Internal ops walkthrough — daily/weekly owner checks beyond corporate scope.

export const INTERNAL_OPS = [
  { id: "atm", label: "ATM & Cash Services", icon: Banknote, items: [
    { id: "ATM-1", q: "ATM cash level (target: keep above $5,000)", type: "currency", target: 5000 },
    { id: "ATM-2", q: "Receipt paper rolls in storage (≥2 rolls)?", type: "yesno" },
    { id: "ATM-3", q: "ATM screen functioning, no error messages?", type: "yesno" },
    { id: "ATM-4", q: "Surcharge fee posted clearly and matches POS?", type: "yesno" },
  ]},
  { id: "lottery", label: "Lottery", icon: Trophy, items: [
    { id: "LOT-1", q: "Scratch-off display fully stocked (no empty slots)?", type: "yesno" },
    { id: "LOT-2", q: "Pull-tab game machines stocked and functional?", type: "yesno" },
    { id: "LOT-3", q: "Winning tickets reconciled and paid out today?", type: "yesno" },
    { id: "LOT-4", q: "Lottery terminal printing receipts (paper stocked)?", type: "yesno" },
    { id: "LOT-5", q: "Lottery commission settlement up to date?", type: "yesno" },
  ]},
  { id: "tobacco", label: "Tobacco & Vape", icon: Cigarette, items: [
    { id: "TOB-1", q: "Cigarette / tobacco buy-down audit (item-by-item)", type: "tobacco-audit" },
    { id: "TOB-2", q: "All cigarette price tags visible, legible, current?", type: "yesno" },
    { id: "TOB-3", q: "Vape / e-cig inventory counts match physical stock?", type: "yesno" },
    { id: "TOB-4", q: "No expired or damaged tobacco product on display?", type: "yesno" },
    { id: "TOB-5", q: "ID scanner / age verification system working?", type: "yesno" },
    { id: "TOB-6", q: "Restricted product log current (single sales, etc.)?", type: "yesno" },
  ]},
  { id: "coolers", label: "Coolers & Freezers", icon: Snowflake, items: [
    { id: "TMP-1", q: "Beverage cooler temp (target: 33–38°F)", type: "numeric", unit: "°F", target: [33, 38] },
    { id: "TMP-2", q: "Freezer temp (target: ≤ 0°F)", type: "numeric", unit: "°F", target: [-20, 0] },
    { id: "TMP-3", q: "Walk-in cooler temp (target: 33–38°F)", type: "numeric", unit: "°F", target: [33, 38] },
    { id: "TMP-4", q: "Ice cream freezer temp (target: ≤ -10°F)", type: "numeric", unit: "°F", target: [-20, -10] },
    { id: "COO-1", q: "Beer cooler fully stocked, faced, rotated FIFO?", type: "yesno" },
    { id: "COO-2", q: "No expired dairy, sandwiches, or perishables?", type: "yesno" },
    { id: "COO-3", q: "Cooler door seals intact, no fogging?", type: "yesno" },
  ]},
  { id: "stations", label: "Coffee & Fountain", icon: Coffee, items: [
    { id: "STA-1", q: "Coffee station: beans, creamer, sweeteners, cups, lids stocked?", type: "yesno" },
    { id: "STA-2", q: "Coffee carafes brewed/cleaned within last 2 hours?", type: "yesno" },
    { id: "STA-3", q: "Fountain BIB syrup levels OK, all flavors flowing?", type: "yesno" },
    { id: "STA-4", q: "CO2 / nitrogen tank levels acceptable?", type: "yesno" },
    { id: "STA-5", q: "Ice bin clean and full?", type: "yesno" },
    { id: "STA-6", q: "Slushie / frozen drink machines cleaned per schedule?", type: "yesno" },
  ]},
  { id: "cash", label: "Cash Management", icon: Receipt, items: [
    { id: "CSH-1", q: "Till count matches POS report (within $5)?", type: "yesno" },
    { id: "CSH-2", q: "Safe drops on schedule (no till over $300 cash)?", type: "yesno" },
    { id: "CSH-3", q: "Coin and small bill change adequate?", type: "yesno" },
    { id: "CSH-4", q: "Deposit slip prepared for bank run?", type: "yesno" },
  ]},
  { id: "compliance", label: "Compliance & Security", icon: ShieldCheck, items: [
    { id: "CMP-1", q: "All security cameras live and recording?", type: "yesno" },
    { id: "CMP-2", q: "DVR retention ≥ 30 days verified?", type: "yesno" },
    { id: "CMP-3", q: "Employee certifications current (food handler, age verification)?", type: "yesno" },
    { id: "CMP-4", q: "Underground storage tank monitoring system clear (no alarms)?", type: "yesno" },
    { id: "CMP-5", q: "Fire extinguishers tagged within last 12 months?", type: "yesno" },
    { id: "CMP-6", q: "Spill kit stocked and accessible?", type: "yesno" },
  ]},
  { id: "backstock", label: "Back Stock & Inventory", icon: Boxes, items: [
    { id: "BCK-1", q: "Back room organized, no expired product?", type: "yesno" },
    { id: "BCK-2", q: "Cigarette par stock met (no SKU below 2 cartons)?", type: "yesno" },
    { id: "BCK-3", q: "Beer / water / snacks par stock met?", type: "yesno" },
    { id: "BCK-4", q: "DEF (diesel exhaust fluid) in stock?", type: "yesno" },
    { id: "BCK-5", q: "Ice merchandiser stocked?", type: "yesno" },
    { id: "BCK-6", q: "Motor oil / wiper fluid stocked?", type: "yesno" },
  ]},
  { id: "amenities", label: "Exterior Equipment", icon: Droplets, items: [
    { id: "AMN-1", q: "Air pump operational, hose intact, gauge accurate?", type: "yesno" },
    { id: "AMN-2", q: "Vacuum operational, suction strong, hoses clean?", type: "yesno" },
    { id: "AMN-3", q: "Carwash chemicals stocked, no error codes?", type: "yesno" },
    { id: "AMN-4", q: "Carwash brushes / nozzles in good condition?", type: "yesno" },
    { id: "AMN-5", q: "Carwash bay clean, no debris or chemical buildup?", type: "yesno" },
  ]},
  { id: "bathroom", label: "Bathroom Supply Pars", icon: ShowerHead, items: [
    { id: "BTH-1", q: "TP rolls in storage (≥ 4)?", type: "yesno" },
    { id: "BTH-2", q: "Hand soap refill in stock?", type: "yesno" },
    { id: "BTH-3", q: "Paper towels / hand-dryer functional?", type: "yesno" },
    { id: "BTH-4", q: "Trash bags in stock?", type: "yesno" },
    { id: "BTH-5", q: "Air freshener / odor control in stock?", type: "yesno" },
  ]},
];
