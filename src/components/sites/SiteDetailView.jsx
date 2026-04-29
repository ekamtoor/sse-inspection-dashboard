import { ChevronLeft, Wrench, ClipboardCheck, Pencil, Trash2 } from "lucide-react";
import ContactCard from "../shared/ContactCard.jsx";
import DetailListCard from "../shared/DetailListCard.jsx";
import SeverityDot from "../shared/SeverityDot.jsx";

export default function SiteDetailView({
  site, scheduled, issues, completed, corporate,
  onBack, onEdit, onDelete, onStartInspection, onStartInternal,
  setIssueDetail, setReportDetail, setCorpDetail, setView,
}) {
  const siteIssues = issues.filter((i) => i.siteId === site.id);
  const siteSchedule = scheduled.filter((s) => s.siteId === site.id);
  const siteReports = completed.filter((r) => r.siteId === site.id);
  const siteCorp = corporate.filter((c) => c.siteId === site.id);
  const totalLabel = site.brand.includes("Marathon") ? "100" : "107";

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <button onClick={onBack} className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
        <ChevronLeft className="w-3.5 h-3.5" /> Back to sites
      </button>

      <div className="bg-white border border-stone-200 rounded-xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">#{site.id}</span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">·</span>
              <span className="text-[10px] uppercase tracking-wider text-stone-500">{site.brand}</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold leading-tight">{site.name}</h2>
            <p className="font-display italic text-stone-500 mt-1 text-sm md:text-base">
              {site.address || site.name} · {site.city} {site.zip || ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => onStartInternal(site.id)} className="text-xs font-medium px-3 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-md flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Ops
            </button>
            <button onClick={() => onStartInspection(site.id)} className="text-xs font-medium px-3 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" /> Pre-inspect
            </button>
            <button onClick={() => onEdit(site)} className="p-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-md">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(site)} className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-md">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-5 md:mt-6 pt-5 md:pt-6 border-t border-stone-100">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Last Score</div>
            <div className="font-mono text-xl md:text-2xl font-semibold mt-1">
              {site.lastScore || "—"}<span className="text-stone-300 text-sm md:text-base">/{totalLabel}</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Pumps</div>
            <div className="font-mono text-xl md:text-2xl font-semibold mt-1">{site.pumps}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Issues</div>
            <div className={`font-mono text-xl md:text-2xl font-semibold mt-1 ${site.openIssues > 0 ? "text-red-600" : "text-stone-300"}`}>
              {site.openIssues}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Status</div>
            <div className="text-sm font-medium mt-1.5">
              {site.status === "good" ? "Performing" : site.status === "needs-attention" ? "Watch" : "Critical"}
            </div>
          </div>
        </div>

        {site.notes && (
          <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-stone-100">
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-1">Notes</div>
            <p className="text-sm text-stone-700">{site.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <ContactCard label="Operator" contact={site.operator} />
        <ContactCard label="Site Manager" contact={site.manager} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <DetailListCard title="Open Issues" count={siteIssues.filter((i) => i.status !== "resolved").length} empty="No open issues">
          {siteIssues.filter((i) => i.status !== "resolved").slice(0, 5).map((iss) => (
            <button key={iss.id} onClick={() => setIssueDetail(iss)} className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-b-0">
              <div className="flex items-center gap-2 mb-1">
                <SeverityDot severity={iss.severity} />
                <span className="text-xs font-medium truncate">{iss.item}</span>
              </div>
              <p className="text-xs text-stone-500 line-clamp-1">{iss.note}</p>
            </button>
          ))}
        </DetailListCard>

        <DetailListCard title="Scheduled" count={siteSchedule.length} empty="Nothing scheduled">
          {siteSchedule.slice(0, 5).map((s) => (
            <div key={s.id} className="px-4 py-3 border-b border-stone-100 last:border-b-0">
              <div className="text-xs font-mono text-stone-700">{s.date} · {s.time}</div>
              <div className="text-sm font-medium mt-0.5">{s.type}</div>
              <div className="text-xs text-stone-500 mt-0.5">{s.inspector} · {s.kind === "internal" ? "Internal Ops" : "Pre-Inspection"}</div>
            </div>
          ))}
        </DetailListCard>

        <DetailListCard title="Recent Internal Reports" count={siteReports.length} empty="No internal reports yet">
          {siteReports.slice(0, 5).map((r) => (
            <button
              key={r.id}
              onClick={() => { setReportDetail(r); setView("reports"); }}
              className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-stone-500">{new Date(r.completedAt).toLocaleDateString()}</span>
                <span className="font-mono text-sm font-semibold">{r.score}/{r.total}</span>
              </div>
              <div className="text-xs text-stone-600 mt-0.5">{r.fails.length} flag{r.fails.length === 1 ? "" : "s"}</div>
            </button>
          ))}
        </DetailListCard>

        <DetailListCard title="Corporate Reports" count={siteCorp.length} empty="No corporate reports yet">
          {siteCorp.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCorpDetail(c); setView("corporate"); }}
              className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-stone-500">{c.date} · {c.brand}</span>
                <span className="font-mono text-sm font-semibold">{c.score}/{c.total}</span>
              </div>
              {c.cures && c.cures.length > 0 && (
                <div className="text-xs text-amber-700 mt-0.5">
                  {c.cures.length} cure{c.cures.length === 1 ? "" : "s"} pending
                </div>
              )}
            </button>
          ))}
        </DetailListCard>
      </div>
    </div>
  );
}
