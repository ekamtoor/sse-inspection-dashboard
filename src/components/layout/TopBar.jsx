import { Shield } from "lucide-react";

export default function TopBar({ view, siteDetail }) {
  const titles = {
    dashboard:  "Operations",
    sites:      siteDetail ? siteDetail.name : "Sites",
    schedule:   "Schedule",
    inspection: "Inspection",
    reports:    "Reports",
    corporate:  "Archive",
    issues:     "Issues",
    inspectors: "Inspectors",
  };
  const subs = {
    dashboard:  "Fleet performance at a glance",
    sites:      siteDetail ? `${siteDetail.brand} · ${siteDetail.city}` : "All locations",
    schedule:   "Upcoming and recurring",
    inspection: "Live walkthrough",
    reports:    "Generated inspection reports",
    corporate:  "Quarterly mystery-shop results",
    issues:     "Open items across all sites",
    inspectors: "Roster of people who run inspections",
  };

  return (
    <header
      className="border-b border-stone-200 bg-white px-4 md:px-8 py-3 md:py-5 flex items-center justify-between flex-shrink-0"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <div className="flex items-center gap-2 md:items-baseline min-w-0">
        <div className="md:hidden w-7 h-7 bg-amber-400 rounded flex items-center justify-center flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-stone-900" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex md:flex-row md:items-baseline md:gap-3 flex-col">
          <h1 className="font-display text-lg md:text-2xl font-semibold text-stone-900 leading-tight truncate">
            {titles[view] || ""}
          </h1>
          <span className="hidden md:block font-display italic text-stone-400 text-base">{subs[view] || ""}</span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <div className="text-xs font-mono text-stone-500">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>
    </header>
  );
}
