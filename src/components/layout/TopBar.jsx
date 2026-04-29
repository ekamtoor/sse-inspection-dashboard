import { Search, Bell, Shield } from "lucide-react";

export default function TopBar({ view, activeInspection, activeInternal, siteDetail }) {
  const titles = {
    dashboard:  "Operations",
    sites:      siteDetail ? siteDetail.name : "Sites",
    schedule:   "Schedule",
    inspection: "Pre-Inspection",
    internal:   "Internal Ops",
    reports:    "Reports",
    corporate:  "Archive",
    issues:     "Issues",
  };
  const subs = {
    dashboard:  "Fleet performance at a glance",
    sites:      siteDetail ? `${siteDetail.brand} · ${siteDetail.city}` : "All Shell, Marathon & ARCO locations",
    schedule:   "Upcoming and recurring",
    inspection: "Live mystery-shop simulation",
    internal:   "Owner walkthrough",
    reports:    "Generated internal reports",
    corporate:  "Quarterly mystery-shop results",
    issues:     "Open items across all sites",
  };

  return (
    <header className="border-b border-stone-200 bg-white px-4 md:px-8 py-3 md:py-5 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2 md:items-baseline min-w-0">
        <div className="md:hidden w-7 h-7 bg-amber-400 rounded flex items-center justify-center flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-stone-900" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex md:flex-row md:items-baseline md:gap-3 flex-col">
          <h1 className="font-display text-lg md:text-2xl font-semibold text-stone-900 leading-tight truncate">
            {titles[view]}
          </h1>
          <span className="hidden md:block font-display italic text-stone-400 text-base">{subs[view]}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <button className="p-2 hover:bg-stone-100 rounded-md">
          <Search className="w-4 h-4 text-stone-600" />
        </button>
        <button className="p-2 hover:bg-stone-100 rounded-md relative">
          <Bell className="w-4 h-4 text-stone-600" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="hidden md:block h-6 w-px bg-stone-200 mx-2" />
        <div className="hidden md:block text-xs font-mono text-stone-500">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>
    </header>
  );
}
