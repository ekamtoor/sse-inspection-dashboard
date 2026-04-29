import { Plus, Archive } from "lucide-react";
import CorporateDetail from "./CorporateDetail.jsx";

export default function CorporateView({ corporate, sites, completed, detail, setDetail, onAdd }) {
  if (detail) {
    return <CorporateDetail corp={detail} sites={sites} completed={completed} onBack={() => setDetail(null)} />;
  }

  const sorted = corporate.slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-stone-600 max-w-xl flex-1 min-w-0 hidden md:block">
          Archive of corporate mystery-shop results. Compares against your internal pre-inspections.
        </p>
        <button
          onClick={onAdd}
          className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 ml-auto"
        >
          <Plus className="w-4 h-4" /> Add report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {sorted.map((c) => {
          const site = sites.find((s) => s.id === c.siteId);
          const isMarathon = c.brand.includes("Marathon") || c.brand.includes("ARCO");
          return (
            <button
              key={c.id}
              onClick={() => setDetail(c)}
              className="bg-white border border-stone-200 rounded-xl p-4 md:p-5 hover:shadow-sm transition-shadow text-left"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded ${
                      isMarathon ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {c.brand}
                    </span>
                    <span className="font-mono text-[10px] text-stone-500">{c.date}</span>
                  </div>
                  <h3 className="font-display text-base md:text-lg font-semibold leading-tight truncate">{site?.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5 truncate">{site?.city}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-2xl font-semibold">{c.score}</div>
                  <div className="font-mono text-xs text-stone-400">/{c.total}</div>
                </div>
              </div>
              {c.cures && c.cures.length > 0 && (
                <div className="text-xs text-amber-700 font-medium pt-3 border-t border-stone-100">
                  ⚠ {c.cures.length} cure{c.cures.length === 1 ? "" : "s"} pending
                </div>
              )}
            </button>
          );
        })}
        {sorted.length === 0 && (
          <div className="col-span-full bg-white border border-stone-200 rounded-xl p-12 text-center">
            <Archive className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500">No corporate reports archived yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
