import { ClipboardCheck, Wrench, FileText, Archive } from "lucide-react";

export default function MobileMoreSheet({ view, setView, activeInspection, activeInternal, onClose }) {
  const items = [
    { id: "inspection", label: "Pre-Inspection",    icon: ClipboardCheck, badge: activeInspection ? "live" : null },
    { id: "internal",   label: "Internal Ops",      icon: Wrench,         badge: activeInternal ? "live" : null },
    { id: "reports",    label: "Reports",           icon: FileText },
    { id: "corporate",  label: "Corporate Archive", icon: Archive },
  ];

  return (
    <div className="fixed inset-0 z-40 md:hidden flex flex-col" onClick={onClose}>
      <div className="flex-1 bg-stone-900/40" />
      <div
        className="bg-white rounded-t-2xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>
        <div className="px-3 pb-4 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-stone-500 px-3 pt-2 pb-2 font-medium">Workspace</div>
          {items.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-base ${
                  active ? "bg-stone-100 text-stone-900" : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <Icon className="w-5 h-5 text-stone-700" strokeWidth={2} />
                <span className="flex-1 text-left font-medium">{n.label}</span>
                {n.badge === "live" && (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-600">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
