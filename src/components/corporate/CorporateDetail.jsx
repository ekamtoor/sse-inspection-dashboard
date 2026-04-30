import { ChevronLeft, FileText, Trash2 } from "lucide-react";

export default function CorporateDetail({ corp, sites, completed, onBack, onDelete }) {
  const site = sites.find((s) => s.id === corp.siteId);
  const corpDate = new Date(corp.date);
  const matching = completed
    .filter((c) => c.siteId === corp.siteId)
    .filter((c) => {
      const d = new Date(c.completedAt);
      return Math.abs(d - corpDate) < 30 * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];

  const matchPct = corp.score / corp.total;
  const internalPct = matching ? matching.score / matching.total : null;
  const delta = internalPct !== null ? matchPct - internalPct : null;
  const isMarathon = corp.brand.includes("Marathon") || corp.brand.includes("ARCO");

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to archive
        </button>
        <div className="flex items-center gap-2">
          {corp.pdf?.url && (
            <a
              href={corp.pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-1.5"
              title={corp.pdf.name || "View PDF"}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">View </span>PDF
            </a>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(corp)}
              className="text-xs font-medium px-2 md:px-3 py-2 rounded-md border border-stone-300 text-stone-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 flex items-center gap-1.5"
              title="Delete corporate report"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-xl p-5 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium">
            <span className={`px-2 py-0.5 rounded ${isMarathon ? "bg-blue-500/20 text-blue-300" : "bg-amber-400/20 text-amber-400"}`}>
              {corp.brand}
            </span>
            <span className="text-stone-400">Corporate Mystery Shop</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mt-2">{site?.name}</h2>
          <p className="font-display italic text-stone-400 mt-1">{site?.city} · {corp.date}</p>
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-5 md:mt-6 pt-5 md:pt-6 border-t border-stone-700">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Score</div>
              <div className="font-mono text-3xl md:text-4xl font-semibold mt-1">
                {corp.score}<span className="text-stone-500 text-lg md:text-xl">/{corp.total}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Inspector</div>
              <div className="text-sm md:text-base font-medium mt-1">{corp.inspector}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Cures</div>
              <div className="font-mono text-3xl md:text-4xl font-semibold mt-1">{corp.cures?.length || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {matching && delta !== null && (
        <div className={`rounded-xl p-4 md:p-5 ${
          delta < -0.05 ? "bg-red-50 border-2 border-red-300" :
          delta >  0.05 ? "bg-emerald-50 border-2 border-emerald-300" :
                          "bg-amber-50 border-2 border-amber-300"
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-display text-base md:text-lg font-semibold">
                Internal vs Corporate {delta > 0 ? "(corporate higher)" : "(corporate lower)"}
              </div>
              <p className="text-sm text-stone-700 mt-1">
                Internal inspection on {new Date(matching.completedAt).toLocaleDateString()} scored{" "}
                <span className="font-mono font-semibold">{matching.score}/{matching.total}</span>{" "}
                ({Math.round(internalPct * 100)}%). Corporate scored{" "}
                <span className="font-mono font-semibold">{corp.score}/{corp.total}</span>{" "}
                ({Math.round(matchPct * 100)}%).{" "}
                <span className="font-medium">
                  Δ {delta > 0 ? "+" : ""}{Math.round(delta * 100)} pp
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {!matching && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 md:p-5 text-center">
          <p className="text-sm text-stone-600">No internal inspection within 30 days of this corporate visit.</p>
        </div>
      )}

      {corp.sections && corp.sections.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 md:p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Section Breakdown</h3>
          <div className="space-y-3 md:space-y-4">
            {corp.sections.map((s, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700 truncate min-w-0">
                    {s.label}{s.critical && <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-700">Must Pass</span>}
                  </span>
                  <span className="font-mono flex-shrink-0">{s.earned}/{s.total}</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      s.earned === s.total      ? "bg-emerald-500" :
                      s.earned / s.total >= 0.8 ? "bg-amber-400"   :
                                                  "bg-red-500"
                    }`}
                    style={{ width: `${(s.earned / s.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {corp.cures && corp.cures.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5">
          <h3 className="font-display text-lg font-semibold mb-3">Cures Required ({corp.cures.length})</h3>
          <ul className="space-y-1.5">
            {corp.cures.map((c, i) => (
              <li key={i} className="text-sm text-amber-900 flex items-start gap-2">
                <span className="font-mono text-amber-700 mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {corp.notes && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-5">
          <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-1">Notes</div>
          <p className="text-sm text-stone-700">{corp.notes}</p>
        </div>
      )}
    </div>
  );
}
