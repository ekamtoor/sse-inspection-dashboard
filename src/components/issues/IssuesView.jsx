import { useState } from "react";
import { Plus } from "lucide-react";
import SeverityDot from "../shared/SeverityDot.jsx";

export default function IssuesView({ issues, sites, setIssueDetail, onAdd }) {
  const [filter, setFilter] = useState("all");

  const cols = [
    { id: "open",         label: "Open",        color: "border-red-300 bg-red-50/30" },
    { id: "in-progress",  label: "In Progress", color: "border-amber-300 bg-amber-50/30" },
    { id: "resolved",     label: "Resolved",    color: "border-emerald-300 bg-emerald-50/30" },
  ];
  const filtered = issues.filter((i) => filter === "all" || i.siteId === filter);

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap overflow-x-auto pb-1 -mx-1 px-1 flex-1 min-w-0">
          <button
            onClick={() => setFilter("all")}
            className={`text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap ${
              filter === "all"
                ? "bg-stone-900 text-white"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            All sites
          </button>
          {sites.map((s) => (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap ${
                filter === s.id
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-3 md:px-4 py-2 rounded-md flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> <span className="hidden md:inline">New issue</span><span className="md:hidden">New</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {cols.map((col) => {
          const items = filtered.filter((i) => i.status === col.id);
          return (
            <div key={col.id} className={`rounded-xl border-2 border-dashed ${col.color} p-3 md:p-4 min-h-[160px]`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-sm">{col.label}</h3>
                <span className="font-mono text-xs text-stone-500">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((iss) => {
                  const site = sites.find((s) => s.id === iss.siteId);
                  return (
                    <button
                      key={iss.id}
                      onClick={() => setIssueDetail(iss)}
                      className="w-full bg-white border border-stone-200 rounded-md p-3 text-left hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <SeverityDot severity={iss.severity} />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{iss.id}</span>
                      </div>
                      <div className="text-sm font-medium leading-tight">{iss.item}</div>
                      <div className="text-xs text-stone-500 mt-1 truncate">{site?.name}</div>
                      <div className="text-xs text-stone-600 mt-2 line-clamp-2 leading-snug">{iss.note}</div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
                        <span className="text-[10px] text-stone-500">{iss.assignee}</span>
                        <span className="font-mono text-[10px] text-stone-400">{iss.opened}</span>
                      </div>
                    </button>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-center text-xs text-stone-400 py-6 italic">Nothing here.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
