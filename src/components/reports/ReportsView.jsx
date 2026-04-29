import { useMemo, useState } from "react";
import { FileText, ShieldAlert, Filter, X, Trash2 } from "lucide-react";
import { SCHEMA } from "../../data/schema.js";
import ReportDetail from "./ReportDetail.jsx";

export default function ReportsView({ reports, sites, detail, setDetail, onDelete }) {
  if (detail) return <ReportDetail report={detail} sites={sites} onBack={() => setDetail(null)} onDelete={onDelete} />;

  const [siteFilter, setSiteFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const sortedAll = useMemo(
    () => reports.slice().sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [reports]
  );

  const filtered = useMemo(() => {
    return sortedAll.filter((r) => {
      if (siteFilter !== "all" && r.siteId !== siteFilter) return false;
      if (fromDate && r.completedAt.slice(0, 10) < fromDate) return false;
      if (toDate && r.completedAt.slice(0, 10) > toDate) return false;
      return true;
    });
  }, [sortedAll, siteFilter, fromDate, toDate]);

  const filterActive = siteFilter !== "all" || fromDate || toDate;
  const clearFilters = () => {
    setSiteFilter("all");
    setFromDate("");
    setToDate("");
  };

  const sitesSorted = sites.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="bg-white border border-stone-200 rounded-xl p-3 md:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">Filters</span>
          {filterActive && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block mb-1">
              Site
            </label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-stone-400"
            >
              <option value="all">All sites</option>
              {sitesSorted.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block mb-1">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={toDate || undefined}
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 font-mono focus:outline-none focus:border-stone-400"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block mb-1">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || undefined}
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 font-mono focus:outline-none focus:border-stone-400"
            />
          </div>
        </div>
        {filterActive && (
          <div className="mt-3 text-xs text-stone-500">
            Showing <span className="font-semibold text-stone-900">{filtered.length}</span> of {sortedAll.length} reports
          </div>
        )}
      </div>

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
            {filtered.map((r) => {
              const site = sites.find((s) => s.id === r.siteId);
              const ztFails = r.fails.filter((f) =>
                SCHEMA.find((s) => s.zeroTolerance && s.items.some((i) => i.id === f.id))
              );
              return (
                <tr key={r.id} className="hover:bg-stone-50 group">
                  <td className="px-6 py-4 font-mono text-xs cursor-pointer" onClick={() => setDetail(r)}>{new Date(r.completedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setDetail(r)}>
                    <div className="text-sm font-medium">{site?.name || <span className="italic text-stone-400">site removed</span>}</div>
                    <div className="text-xs text-stone-500">{site?.city}</div>
                  </td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setDetail(r)}>
                    <div className="font-mono text-base font-semibold">{r.score}<span className="text-stone-400 text-xs">/{r.total}</span></div>
                  </td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setDetail(r)}>
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
                  <td className="px-6 py-4 text-sm text-stone-700 cursor-pointer" onClick={() => setDetail(r)}>{r.inspector || "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(r); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded text-stone-400 hover:text-red-600"
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setDetail(r)}
                        className="text-xs font-medium text-stone-900 hover:underline"
                      >
                        Open →
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-stone-500">
                <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                {sortedAll.length === 0
                  ? "No reports yet. Run a pre-inspection."
                  : "No reports match the current filters."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.map((r) => {
          const site = sites.find((s) => s.id === r.siteId);
          const ztFails = r.fails.filter((f) =>
            SCHEMA.find((s) => s.zeroTolerance && s.items.some((i) => i.id === f.id))
          );
          return (
            <div
              key={r.id}
              className="relative w-full bg-white border border-stone-200 rounded-xl p-4 hover:bg-stone-50"
            >
              <button
                onClick={() => setDetail(r)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 pr-8">
                    <div className="text-xs font-mono text-stone-500">{new Date(r.completedAt).toLocaleDateString()}</div>
                    <div className="text-sm font-medium mt-0.5 truncate">
                      {site?.name || <span className="italic text-stone-400">site removed</span>}
                    </div>
                    <div className="text-xs text-stone-500 truncate">{r.inspector || "—"}</div>
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
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(r); }}
                  className="absolute top-3 right-3 p-2 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50"
                  title="Delete report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
            <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm text-stone-500">
              {sortedAll.length === 0 ? "No reports yet." : "No reports match the current filters."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
