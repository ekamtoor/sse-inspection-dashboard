import { FileText, ShieldAlert } from "lucide-react";
import { SCHEMA } from "../../data/schema.js";
import ReportDetail from "./ReportDetail.jsx";

export default function ReportsView({ reports, sites, detail, setDetail }) {
  if (detail) return <ReportDetail report={detail} sites={sites} onBack={() => setDetail(null)} />;

  const sorted = reports.slice().sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr className="text-left">
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">Date</th>
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">Site</th>
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">Score</th>
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">Flags</th>
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">Inspector</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sorted.map((r) => {
              const site = sites.find((s) => s.id === r.siteId);
              const ztFails = r.fails.filter((f) =>
                SCHEMA.find((s) => s.zeroTolerance && s.items.some((i) => i.id === f.id))
              );
              return (
                <tr key={r.id} className="hover:bg-stone-50 cursor-pointer" onClick={() => setDetail(r)}>
                  <td className="px-6 py-4 font-mono text-xs">{new Date(r.completedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{site?.name}</div>
                    <div className="text-xs text-stone-500">{site?.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-base font-semibold">{r.score}<span className="text-stone-400 text-xs">/{r.total}</span></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm ${r.fails.length > 0 ? "text-red-600 font-semibold" : "text-stone-400"}`}>
                        {r.fails.length}
                      </span>
                      {ztFails.length > 0 && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> {ztFails.length} ZT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-700">{r.inspector || "M. Reyes"}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-medium text-stone-900 hover:underline">Open →</span>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-stone-500">
                <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                No reports yet. Run a pre-inspection.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {sorted.map((r) => {
          const site = sites.find((s) => s.id === r.siteId);
          const ztFails = r.fails.filter((f) =>
            SCHEMA.find((s) => s.zeroTolerance && s.items.some((i) => i.id === f.id))
          );
          return (
            <button
              key={r.id}
              onClick={() => setDetail(r)}
              className="w-full bg-white border border-stone-200 rounded-xl p-4 text-left hover:bg-stone-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono text-stone-500">{new Date(r.completedAt).toLocaleDateString()}</div>
                  <div className="text-sm font-medium mt-0.5 truncate">{site?.name}</div>
                  <div className="text-xs text-stone-500 truncate">{r.inspector || "M. Reyes"}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-xl font-semibold">{r.score}<span className="text-stone-400 text-sm">/{r.total}</span></div>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className={`font-mono text-xs ${r.fails.length > 0 ? "text-red-600 font-semibold" : "text-stone-400"}`}>
                      {r.fails.length} flag{r.fails.length === 1 ? "" : "s"}
                    </span>
                    {ztFails.length > 0 && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-bold">
                        {ztFails.length} ZT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        {sorted.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
            <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm text-stone-500">No reports yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
