import { LayoutDashboard, MapPin, Calendar, AlertTriangle, MoreHorizontal } from "lucide-react";

export default function MobileBottomNav({ view, setView, onMore, activeInspection, activeInternal, moreOpen }) {
  const items = [
    { id: "dashboard", label: "Home",     icon: LayoutDashboard },
    { id: "sites",     label: "Sites",    icon: MapPin },
    { id: "schedule",  label: "Schedule", icon: Calendar },
    { id: "issues",    label: "Issues",   icon: AlertTriangle },
  ];
  const moreActive = moreOpen || ["inspection", "internal", "reports", "corporate"].includes(view);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-30 flex pb-safe"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((n) => {
        const Icon = n.icon;
        const active = view === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 ${
              active ? "text-stone-900" : "text-stone-500"
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{n.label}</span>
          </button>
        );
      })}
      <button
        onClick={onMore}
        className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative ${
          moreActive ? "text-stone-900" : "text-stone-500"
        }`}
      >
        <div className="relative">
          <MoreHorizontal className="w-5 h-5" strokeWidth={moreActive ? 2.5 : 2} />
          {(activeInspection || activeInternal) && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          )}
        </div>
        <span className="text-[10px] font-medium">More</span>
      </button>
    </nav>
  );
}
