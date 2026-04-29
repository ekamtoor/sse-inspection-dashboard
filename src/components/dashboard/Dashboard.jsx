import {
  Store, Target, TrendingUp, AlertTriangle, ArrowUpRight, Clock,
  Sparkles, ArrowRight, Wrench,
} from "lucide-react";
import StatCard from "../shared/StatCard.jsx";
import SeverityDot from "../shared/SeverityDot.jsx";
import StatusPill from "../shared/StatusPill.jsx";

export default function Dashboard({
  setView, startInspection, startInternal, sites, scheduled, issues, completed, setIssueDetail,
}) {
  const avgScore = Math.round(sites.reduce((a, s) => a + s.lastScore, 0) / Math.max(sites.length, 1));
  const activeIssues = issues.filter((i) => i.status !== "resolved");
  const passRate = Math.round((sites.filter((s) => s.lastScore >= 95).length / Math.max(sites.length, 1)) * 100);
  const upcoming = scheduled.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5);
  const criticals = issues
    .filter((i) => i.status !== "resolved" && (i.severity === "critical" || i.severity === "high"))
    .slice(0, 5);

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Sites" value={sites.length} delta={`${completed.length} reports`} icon={Store} deltaPositive />
        <StatCard label="Avg. Score" value={avgScore} unit="/107" delta="across fleet" icon={Target} deltaPositive />
        <StatCard label="Pass Rate" value={passRate} unit="%" delta={`${sites.filter((s) => s.lastScore >= 95).length} of ${sites.length}`} icon={TrendingUp} deltaPositive />
        <StatCard label="Open Issues" value={activeIssues.length} delta={`${activeIssues.filter((i) => i.severity === "critical").length} critical`} icon={AlertTriangle} deltaNegative />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Upcoming</h2>
              <p className="text-xs text-stone-500 mt-0.5">Pre-inspections + ops walkthroughs</p>
            </div>
            <button onClick={() => setView("schedule")} className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {upcoming.map((s) => {
              const site = sites.find((x) => x.id === s.siteId);
              const dt = new Date(s.date + "T00:00:00");
              return (
                <div key={s.id} className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-stone-50 group">
                  <div className="w-11 md:w-12 text-center flex-shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">
                      {dt.toLocaleDateString("en-US", { month: "short" })}
                    </div>
                    <div className="font-display text-xl md:text-2xl font-semibold leading-tight">{dt.getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{site?.name}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] md:text-xs text-stone-500 flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.time}</span>
                      <span>·</span><span className="truncate">{s.inspector}</span>
                      <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-stone-100 rounded">{s.type}</span>
                      {s.kind === "internal" && <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">Ops</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => (s.kind === "internal" ? startInternal(s.siteId) : startInspection(s.siteId, s.id))}
                    className="md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-md flex-shrink-0"
                  >
                    Start
                  </button>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-stone-500">Nothing scheduled.</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 md:px-5 py-4 border-b border-stone-200">
            <h2 className="font-display text-lg font-semibold">Score Distribution</h2>
            <p className="text-xs text-stone-500 mt-0.5">Most recent corporate score</p>
          </div>
          <div className="p-4 md:p-5 space-y-3">
            {sites.slice().sort((a, b) => b.lastScore - a.lastScore).map((s) => (
              <div key={s.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-700 truncate flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{s.name}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 hidden sm:inline">
                      {s.brand.split("/")[0]}
                    </span>
                  </span>
                  <span className="font-mono text-stone-900">{s.lastScore}</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      s.lastScore >= 100 ? "bg-emerald-500" : s.lastScore >= 90 ? "bg-amber-400" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min((s.lastScore / 107) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 bg-white border border-stone-200 rounded-xl">
          <div className="px-4 md:px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Critical Issues</h2>
              <p className="text-xs text-stone-500 mt-0.5">Action needed before next corporate visit</p>
            </div>
            <button onClick={() => setView("issues")} className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {criticals.map((iss) => {
              const site = sites.find((s) => s.id === iss.siteId);
              return (
                <button
                  key={iss.id}
                  onClick={() => setIssueDetail(iss)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 flex items-start gap-3 md:gap-4 hover:bg-stone-50 text-left"
                >
                  <SeverityDot severity={iss.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium">{site?.name}</span>
                    </div>
                    <div className="text-sm font-medium mt-0.5 truncate">{iss.item}</div>
                    <div className="text-xs text-stone-600 mt-1 line-clamp-1">{iss.note}</div>
                  </div>
                  <StatusPill status={iss.status} />
                </button>
              );
            })}
            {criticals.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-stone-500">No critical issues.</div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-xl p-5 md:p-6 flex flex-col justify-between relative overflow-hidden min-h-[200px]">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Quick action
            </div>
            <h3 className="font-display text-xl md:text-2xl font-semibold leading-tight">
              Run a pre-inspection <span className="italic font-normal text-stone-400">now</span>
            </h3>
            <p className="text-sm text-stone-400 mt-2 leading-relaxed">
              Pick a site, walk the rubric, generate a fix list.
            </p>
          </div>
          <div className="relative mt-5 md:mt-6 space-y-2">
            <button
              onClick={() => setView("schedule")}
              className="w-full bg-amber-400 hover:bg-amber-300 text-stone-900 font-medium text-sm px-4 py-2.5 rounded-md flex items-center justify-center gap-2"
            >
              New pre-inspection <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("internal")}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white font-medium text-sm px-4 py-2.5 rounded-md flex items-center justify-center gap-2 border border-stone-700"
            >
              Internal ops walk <Wrench className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
