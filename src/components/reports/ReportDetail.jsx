import { ChevronLeft, ShieldAlert, Camera } from "lucide-react";
import { SCHEMA } from "../../data/schema.js";
import PriorityPill from "../shared/PriorityPill.jsx";

export default function ReportDetail({ report, sites, onBack }) {
  const site = sites.find((s) => s.id === report.siteId);
  const ztFails = report.fails.filter((f) => SCHEMA.find((s) => s.zeroTolerance && s.items.some((i) => i.id === f.id)));

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <button onClick={onBack} className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to reports
      </button>

      <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-xl p-5 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-widest text-amber-400 font-medium">Internal Pre-Inspection</div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mt-2">{site?.name}</h2>
          <p className="font-display italic text-stone-400 mt-1">
            {site?.city} · {new Date(report.completedAt).toLocaleString()}
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-5 md:mt-6 pt-5 md:pt-6 border-t border-stone-700">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Score</div>
              <div className="font-mono text-3xl md:text-4xl font-semibold mt-1">
                {report.score}<span className="text-stone-500 text-lg md:text-xl">/{report.total}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Inspector</div>
              <div className="text-base md:text-lg font-medium mt-1">{report.inspector || "M. Reyes"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Flags</div>
              <div className={`font-mono text-3xl md:text-4xl font-semibold mt-1 ${report.fails.length > 0 ? "text-red-400" : "text-stone-500"}`}>
                {report.fails.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {ztFails.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 md:p-5 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-display text-base md:text-lg font-semibold text-red-900">
              {ztFails.length} Zero-Tolerance Violation{ztFails.length > 1 ? "s" : ""}
            </div>
            <div className="text-xs md:text-sm text-red-800 mt-1">Cure immediately or escalate to operator.</div>
          </div>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl p-5 md:p-6">
        <h3 className="font-display text-lg font-semibold mb-4">By Section</h3>
        <div className="space-y-4">
          {SCHEMA.map((sec) => {
            const items = sec.items;
            const earned = items.reduce((a, it) => a + (report.answers[it.id] === "pass" ? it.pts : 0), 0);
            const total = items.reduce((a, it) => a + it.pts, 0);
            const fails = items.filter((it) => report.answers[it.id] === "fail").length;
            if (total === 0 && fails === 0) return null;
            return (
              <div key={sec.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700 truncate flex items-center gap-2 min-w-0">
                    {sec.zeroTolerance && <ShieldAlert className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />}
                    <span className="truncate">{sec.label}</span>
                    {fails > 0 && <span className="text-xs text-red-600 font-mono flex-shrink-0">{fails} ✗</span>}
                  </span>
                  {total > 0 && <span className="font-mono text-sm flex-shrink-0">{earned}/{total}</span>}
                </div>
                {total > 0 && (
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${sec.zeroTolerance && fails > 0 ? "bg-red-500" : "bg-stone-700"}`}
                      style={{ width: `${(earned / total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-stone-200">
          <h3 className="font-display text-lg font-semibold">Action Items</h3>
          <p className="text-xs text-stone-500 mt-0.5">{report.fails.length} flag{report.fails.length === 1 ? "" : "s"} from this walk</p>
        </div>
        <div className="divide-y divide-stone-100">
          {report.fails.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-stone-500">All clear. No flags.</div>
          )}
          {report.fails.map((f) => {
            const sec = SCHEMA.find((s) => s.items.some((i) => i.id === f.id));
            const photos = report.photos?.[f.id] || [];
            return (
              <div key={f.id} className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{f.id}</span>
                      <span className="text-[10px] uppercase tracking-wider text-stone-500">·</span>
                      <span className="text-[10px] uppercase tracking-wider text-stone-500 truncate">{sec?.label}</span>
                    </div>
                    <div className="text-sm font-medium mt-1">{f.q}</div>
                    {f.comment && (
                      <p className="text-sm text-stone-600 mt-2 italic font-display">{f.comment}</p>
                    )}
                    {photos.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {photos.map((p, i) => (
                          <div key={i} className="w-14 h-14 rounded-md bg-stone-100 border border-stone-200 overflow-hidden">
                            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <PriorityPill priority={f.severity} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
