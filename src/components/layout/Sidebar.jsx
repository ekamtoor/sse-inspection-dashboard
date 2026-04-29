import {
  LayoutDashboard, MapPin, ClipboardCheck, AlertTriangle, FileText, Calendar,
  Wrench, Archive, Shield, LogOut, Users,
} from "lucide-react";

export default function Sidebar({ view, setView, activeInspection, activeInternal, userEmail, onSignOut }) {
  const nav = [
    { id: "dashboard",  label: "Dashboard",         icon: LayoutDashboard },
    { id: "sites",      label: "Sites",             icon: MapPin },
    { id: "schedule",   label: "Schedule",          icon: Calendar },
    { id: "inspection", label: "Pre-Inspection",    icon: ClipboardCheck, badge: activeInspection ? "live" : null },
    { id: "internal",   label: "Internal Ops",      icon: Wrench,         badge: activeInternal ? "live" : null },
    { id: "reports",    label: "Reports",           icon: FileText },
    { id: "corporate",  label: "Corporate Archive", icon: Archive },
    { id: "issues",     label: "Issues Tracker",    icon: AlertTriangle },
    { id: "inspectors", label: "Inspectors",        icon: Users },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-stone-900 text-stone-100 flex-col border-r border-stone-800 flex-shrink-0">
      <div className="px-5 py-6 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-400 rounded flex items-center justify-center">
            <Shield className="w-4 h-4 text-stone-900" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-semibold text-base leading-none">Vanguard</div>
            <div className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Pre-Inspection</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-widest text-stone-500 px-3 pt-2 pb-3 font-medium">Workspace</div>
        {nav.map((n) => {
          const Icon = n.icon;
          const active = view === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                active ? "bg-stone-100 text-stone-900 shadow-sm" : "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge === "live" && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-800">
        <div className="bg-stone-800/60 rounded-lg p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-900 font-mono text-xs font-semibold">
            {(userEmail || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{userEmail || "Signed out"}</div>
            <div className="text-[11px] text-stone-400">District Ops</div>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              title="Sign out"
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-700 rounded-md flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-stone-500">
          <img
            src="/seven-star-logo.png"
            alt=""
            className="w-3.5 h-3.5 object-contain opacity-70"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <span className="italic font-display">by Seven Star Energy</span>
        </div>
      </div>
    </aside>
  );
}
