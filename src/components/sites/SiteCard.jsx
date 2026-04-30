import { MapPin, Building2, Pencil, Trash2, ClipboardCheck } from "lucide-react";

export default function SiteCard({ site, onStartInspection, onEdit, onDelete, onView }) {
  const score = site.lastScore || 0;
  const scoreColor =
    score >= 170 ? "text-emerald-700" :
    score >= 140 ? "text-amber-700"   :
    score > 0    ? "text-red-600"     :
                   "text-stone-400";
  const statusBg =
    site.status === "good"            ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    site.status === "needs-attention" ? "bg-amber-50 text-amber-700 border-amber-200"       :
    site.status === "critical"        ? "bg-red-50 text-red-700 border-red-200"             :
                                        "bg-stone-50 text-stone-600 border-stone-200";
  const statusLabel =
    site.status === "good" ? "Performing" :
    site.status === "needs-attention" ? "Watch" :
    site.status === "critical" ? "Critical" :
    "New";
  const dueDate = site.nextDue ? new Date(site.nextDue) : null;
  const today = new Date();
  const daysUntil = dueDate ? Math.round((dueDate - today) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-5 hover:shadow-sm transition-shadow group">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onView} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">#{site.id}</span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400">·</span>
            <span className="text-[10px] uppercase tracking-wider text-stone-500">{site.brand}</span>
          </div>
          <h3 className="font-display text-base md:text-lg font-semibold leading-tight">{site.name}</h3>
          <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" /> {site.city}
          </div>
        </button>
        <div className="flex items-start gap-1.5 flex-shrink-0">
          <div className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded border ${statusBg}`}>
            {statusLabel}
          </div>
          <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity flex">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-900"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 hover:bg-red-100 rounded text-stone-500 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {site.manager?.name && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-600">
          <Building2 className="w-3 h-3 text-stone-400 flex-shrink-0" />
          <span className="font-medium truncate">{site.manager.name}</span>
          <span className="text-stone-400">· Manager</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4 pb-4 md:pb-5 border-b border-stone-100">
        <div>
          <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-stone-500 font-medium">Score</div>
          <div className={`font-mono text-xl md:text-2xl font-semibold ${scoreColor} mt-1`}>
            {score || "—"}
            <span className="text-stone-400 text-xs md:text-sm">/200</span>
          </div>
        </div>
        <div>
          <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-stone-500 font-medium">Pumps</div>
          <div className="font-mono text-xl md:text-2xl font-semibold mt-1">{site.pumps}</div>
        </div>
        <div>
          <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-stone-500 font-medium">Issues</div>
          <div
            className={`font-mono text-xl md:text-2xl font-semibold mt-1 ${
              site.openIssues === 0 ? "text-stone-300" : site.openIssues > 2 ? "text-red-600" : "text-amber-700"
            }`}
          >
            {site.openIssues}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 md:mt-4 gap-2 flex-wrap">
        <div className="text-xs text-stone-500">
          {dueDate ? (
            <>Due in <span className="font-mono font-semibold text-stone-700">{daysUntil}d</span></>
          ) : (
            "No due date"
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onStartInspection} className="text-xs font-medium px-3 py-1.5 bg-stone-900 text-white rounded-md hover:bg-stone-800 flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5" /> Inspect
          </button>
        </div>
      </div>
    </div>
  );
}
