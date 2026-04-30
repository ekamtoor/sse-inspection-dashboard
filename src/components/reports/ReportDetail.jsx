import { useMemo, useState } from "react";
import { ChevronLeft, ShieldAlert, Download, Share2, Loader2, Trash2 } from "lucide-react";
import { SCHEMA, PASSING_PERCENTAGE, getInspectionSchema } from "../../data/schema.js";
import PriorityPill from "../shared/PriorityPill.jsx";
import PhotoLightbox from "../shared/PhotoLightbox.jsx";

// Reports written before the unified-schema migration don't have the new
// passed/percentage fields stored. Compute a reasonable approximation from
// what's there so old records still render with sensible numbers.
function deriveSummary(report) {
  if (typeof report.percentage === "number" && typeof report.passed === "boolean") {
    return {
      effectiveTotal: report.effectiveTotal ?? report.total,
      naPoints: report.naPoints ?? 0,
      percentage: report.percentage,
      passed: report.passed,
      failReasons: report.failReasons || {},
    };
  }
  let earned = 0;
  let totalConfigured = 0;
  let naPoints = 0;
  let failedCriticalItems = 0;
  let failedZTItems = 0;
  for (const sec of SCHEMA) {
    for (const it of sec.items) {
      totalConfigured += it.pts;
      const v = report.answers?.[it.id];
      if (v === "pass") earned += it.pts;
      else if (v === "na") naPoints += it.pts;
      else if (v === "fail") {
        if (sec.critical) failedCriticalItems += 1;
        if (sec.zeroTolerance) failedZTItems += 1;
      }
    }
  }
  const usedTotal = totalConfigured > 0 ? totalConfigured : (report.total || 0);
  const effectiveTotal = Math.max(usedTotal - naPoints, 0);
  const computedEarned = earned > 0 ? earned : (report.score || 0);
  const percentage = effectiveTotal > 0 ? computedEarned / effectiveTotal : 0;
  const failReasons = {
    critical: failedCriticalItems > 0,
    zeroTolerance: failedZTItems > 0,
    percentage: percentage < PASSING_PERCENTAGE,
  };
  return {
    effectiveTotal,
    naPoints,
    percentage,
    passed: !failReasons.critical && !failReasons.zeroTolerance && !failReasons.percentage,
    failReasons,
  };
}

export default function ReportDetail({ report, sites, onBack, onDelete }) {
  const site = sites.find((s) => s.id === report.siteId);
  const ztFails = (report.fails || []).filter((f) => SCHEMA.find((s) => s.zeroTolerance && s.items.some((i) => i.id === f.id)));
  const summary = useMemo(() => deriveSummary(report), [report]);
  // Reports persist their pumpPositions so the per-position list stays
  // consistent even if the site's pump count is later edited.
  const fullSchema = useMemo(() => getInspectionSchema(report), [report]);
  const [pdfStatus, setPdfStatus] = useState("idle");
  const [lightbox, setLightbox] = useState(null);
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function";

  // Flatten all photos in order so the lightbox can navigate across items.
  // Each entry carries the item context (question, answer, comment, section)
  // so the lightbox can show an info panel beside the photo.
  const allPhotos = useMemo(() => {
    const out = [];
    for (const sec of fullSchema) {
      for (const it of sec.items) {
        const list = report.photos?.[it.id] || [];
        for (const p of list) {
          if (p?.url) out.push({
            url: p.url,
            name: p.name || `${it.id}.jpg`,
            itemId: it.id,
            itemQuestion: it.q,
            itemPoints: it.pts,
            sectionLabel: sec.label,
            sectionDocumentation: !!sec.documentation,
            sectionZeroTolerance: !!sec.zeroTolerance,
            answer: report.answers?.[it.id],
            comment: report.comments?.[it.id] || "",
          });
        }
      }
    }
    return out;
  }, [report, fullSchema]);

  const openLightboxAt = (itemId, indexInItem) => {
    const photosForItem = report.photos?.[itemId] || [];
    const target = photosForItem[indexInItem];
    if (!target) return;
    const startIndex = allPhotos.findIndex((p) => p.url === target.url);
    setLightbox(startIndex >= 0 ? startIndex : 0);
  };

  const downloadPdf = async () => {
    if (pdfStatus !== "idle") return;
    setPdfStatus("generating");
    try {
      const { generateReportPDF, reportFilename } = await import("../../lib/pdf.js");
      const pdf = await generateReportPDF({ report, site });
      pdf.save(reportFilename(report, site));
    } catch (err) {
      console.error("PDF generation failed:", err);
      // eslint-disable-next-line no-alert
      alert("Couldn't generate PDF. Try again.");
    } finally {
      setPdfStatus("idle");
    }
  };

  const sharePdf = async () => {
    if (pdfStatus !== "idle") return;
    setPdfStatus("generating");
    try {
      const { generateReportPDF, reportFilename } = await import("../../lib/pdf.js");
      const pdf = await generateReportPDF({ report, site });
      const filename = reportFilename(report, site);
      const blob = pdf.output("blob");
      const file = new File([blob], filename, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
      } else {
        pdf.save(filename);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("PDF share failed:", err);
        // eslint-disable-next-line no-alert
        alert("Couldn't share PDF. Try downloading instead.");
      }
    } finally {
      setPdfStatus("idle");
    }
  };

  const verdict = summary.passed ? "PASS" : "FAIL";
  const percentLabel = `${Math.round(summary.percentage * 100)}%`;

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to reports
        </button>
        <div className="flex items-center gap-2">
          {canShare && (
            <button
              onClick={sharePdf}
              disabled={pdfStatus !== "idle"}
              className="md:hidden text-xs font-medium px-3 py-2 rounded-md border border-stone-300 hover:bg-stone-50 text-stone-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {pdfStatus === "generating" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              Share
            </button>
          )}
          <button
            onClick={downloadPdf}
            disabled={pdfStatus !== "idle"}
            className="text-xs font-medium px-3 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white disabled:opacity-50 flex items-center gap-1.5"
          >
            {pdfStatus === "generating" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">Download </span>PDF
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(report)}
              className="text-xs font-medium px-2 md:px-3 py-2 rounded-md border border-stone-300 text-stone-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 flex items-center gap-1.5"
              title="Delete report"
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-amber-400 font-medium">Inspection Report</span>
            <span
              className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-bold ${
                summary.passed ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
              }`}
            >
              {verdict}
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mt-2">{site?.name || <span className="italic text-stone-400">Site removed</span>}</h2>
          <p className="font-display italic text-stone-400 mt-1">
            {site?.city ? `${site.city} · ` : ""}{new Date(report.completedAt).toLocaleString()}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-5 md:mt-6 pt-5 md:pt-6 border-t border-stone-700">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Score</div>
              <div className="font-mono text-2xl md:text-4xl font-semibold mt-1">
                {report.score}<span className="text-stone-500 text-sm md:text-xl">/{summary.effectiveTotal || report.total}</span>
              </div>
              <div className="text-xs text-stone-400 mt-1 font-mono">{percentLabel}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Inspector</div>
              <div className="text-sm md:text-lg font-medium mt-1 truncate">{report.inspector || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Flags</div>
              <div className={`font-mono text-2xl md:text-4xl font-semibold mt-1 ${(report.fails?.length || 0) > 0 ? "text-red-400" : "text-stone-500"}`}>
                {report.fails?.length || 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">N/A</div>
              <div className="font-mono text-2xl md:text-4xl font-semibold mt-1 text-stone-500">
                {summary.naPoints}<span className="text-stone-600 text-sm md:text-xl">pt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!summary.passed && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 md:p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-base md:text-lg font-semibold text-red-900">
                Report did not pass
              </div>
              <ul className="text-xs md:text-sm text-red-800 mt-1 space-y-0.5">
                {summary.failReasons.zeroTolerance && (
                  <li>• Zero-tolerance violation flagged in Compliance &amp; Legal.</li>
                )}
                {summary.failReasons.critical && (
                  <li>• At least one Image or Service Essentials item failed.</li>
                )}
                {summary.failReasons.percentage && (
                  <li>• Score below {Math.round(PASSING_PERCENTAGE * 100)}% of effective total.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

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
          {fullSchema.map((sec) => {
            // Skip documentation-only sections (e.g. per-pump checklist) from
            // the score-bar overview — they don't contribute to /200.
            if (sec.documentation) return null;
            const items = sec.items;
            const earned = items.reduce((a, it) => a + (report.answers?.[it.id] === "pass" ? it.pts : 0), 0);
            const total = items.reduce((a, it) => a + it.pts, 0);
            const naPts = items.reduce((a, it) => a + (report.answers?.[it.id] === "na" ? it.pts : 0), 0);
            const fails = items.filter((it) => report.answers?.[it.id] === "fail").length;
            const effective = total - naPts;
            if (total === 0 && fails === 0) return null;
            return (
              <div key={sec.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700 truncate flex items-center gap-2 min-w-0">
                    {sec.zeroTolerance && <ShieldAlert className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />}
                    <span className="truncate">{sec.label}</span>
                    {fails > 0 && <span className="text-xs text-red-600 font-mono flex-shrink-0">{fails} ✗</span>}
                  </span>
                  <span className="font-mono text-sm flex-shrink-0">
                    {earned}<span className="text-stone-400">/{effective || total}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${sec.zeroTolerance && fails > 0 ? "bg-red-500" : "bg-stone-700"}`}
                    style={{ width: `${effective > 0 ? (earned / effective) * 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-stone-200">
          <h3 className="font-display text-lg font-semibold">Full Inspection</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {report.fails?.length || 0} flag{(report.fails?.length || 0) === 1 ? "" : "s"} · every item listed below
          </p>
        </div>
        <div>
          {fullSchema.map((sec) => {
            const items = sec.items;
            if (!items || items.length === 0) return null;
            const earned = items.reduce((a, it) => a + (report.answers?.[it.id] === "pass" ? it.pts : 0), 0);
            const total = items.reduce((a, it) => a + it.pts, 0);
            const naPts = items.reduce((a, it) => a + (report.answers?.[it.id] === "na" ? it.pts : 0), 0);
            const failsInSec = items.filter((it) => report.answers?.[it.id] === "fail").length;
            const naCount = items.filter((it) => report.answers?.[it.id] === "na").length;
            const passCount = items.filter((it) => report.answers?.[it.id] === "pass").length;
            const failsList = (report.fails || []).filter((f) => items.some((i) => i.id === f.id));
            return (
              <div key={sec.id} className="border-t border-stone-100 first:border-t-0">
                <div
                  className={`px-4 md:px-6 py-2.5 flex items-start gap-3 ${
                    sec.zeroTolerance ? "bg-red-50" : "bg-stone-50"
                  }`}
                >
                  <div className="flex-1 min-w-0 flex items-start gap-2">
                    {sec.zeroTolerance && <ShieldAlert className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <div className={`font-display font-semibold text-sm md:text-base ${sec.zeroTolerance ? "text-red-900" : "text-stone-900"}`}>
                        {sec.label}
                        {sec.documentation && (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-stone-500 font-bold">Documentation</span>
                        )}
                      </div>
                      {sec.subtitle && (
                        <div className="text-[11px] text-stone-500 mt-0.5">{sec.subtitle}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-shrink-0">
                    {failsInSec > 0 && (
                      <span className="text-red-600 font-medium">
                        {failsInSec} flag{failsInSec > 1 ? "s" : ""}
                      </span>
                    )}
                    {sec.documentation ? (
                      <span className="font-mono text-stone-600">
                        {passCount} pass · {naCount} N/A
                      </span>
                    ) : (
                      <>
                        {naPts > 0 && (
                          <span className="text-stone-500 font-mono">
                            {naPts}pt N/A
                          </span>
                        )}
                        <span className="font-mono text-stone-600">
                          {earned}<span className="text-stone-400">/{total - naPts || total}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-stone-100">
                  {items.map((it) => {
                    const ans = report.answers?.[it.id];
                    const note = report.comments?.[it.id];
                    const photos = report.photos?.[it.id] || [];
                    const failMatch = failsList.find((f) => f.id === it.id);
                    return (
                      <div key={it.id} className="px-4 md:px-6 py-3 md:py-3.5">
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-wider text-stone-500 pt-0.5 w-10 md:w-12 flex-shrink-0">
                            {it.id}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <p className="flex-1 text-sm text-stone-800 leading-relaxed">{it.q}</p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {failMatch && <PriorityPill priority={failMatch.severity} />}
                                {ans === "pass" && (
                                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                                    Pass
                                  </span>
                                )}
                                {ans === "fail" && (
                                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-red-600 text-white rounded font-bold">
                                    Fail
                                  </span>
                                )}
                                {ans === "na" && (
                                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-stone-700 text-white rounded font-bold">
                                    N/A
                                  </span>
                                )}
                                {!ans && (
                                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-stone-100 text-stone-500 rounded">
                                    —
                                  </span>
                                )}
                              </div>
                            </div>
                            {note && (
                              <p className="text-sm text-stone-600 mt-1.5 italic font-display">{note}</p>
                            )}
                            {photos.length > 0 && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                {photos.map((p, i) => (
                                  <button
                                    key={p.path || p.url || i}
                                    onClick={() => openLightboxAt(it.id, i)}
                                    className="w-16 h-16 md:w-20 md:h-20 rounded-md bg-stone-100 border border-stone-200 overflow-hidden hover:border-stone-400 transition-colors"
                                    title="Click to enlarge"
                                  >
                                    <img
                                      src={p.url}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(report.notes && report.notes.length > 0) && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-stone-200">
            <h3 className="font-display text-lg font-semibold">Inspection Notes</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {report.notes.length} note{report.notes.length === 1 ? "" : "s"} from this walkthrough
            </p>
          </div>
          <ol className="divide-y divide-stone-100">
            {report.notes.slice().sort((a, b) => (a.at || "").localeCompare(b.at || "")).map((n) => {
              const isImage = (n.attachment?.contentType || "").startsWith("image/")
                || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(n.attachment?.name || "");
              return (
                <li key={n.id} className="px-4 md:px-6 py-3 md:py-3.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap text-[10px] uppercase tracking-wider text-stone-500">
                    <span className="font-mono font-medium text-stone-600">
                      Note · <span className="text-stone-500 normal-case font-display italic">{n.actor || "—"}</span>
                    </span>
                    <span className="font-mono text-stone-400 normal-case">
                      {n.at ? new Date(n.at).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  {n.text && (
                    <p className="text-sm text-stone-800 mt-1.5 leading-relaxed whitespace-pre-wrap">{n.text}</p>
                  )}
                  {n.attachment && (
                    <div className="mt-2 flex items-center gap-3">
                      {isImage ? (
                        <a
                          href={n.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-14 h-14 md:w-16 md:h-16 rounded-md bg-stone-100 border border-stone-200 overflow-hidden hover:border-stone-400"
                        >
                          <img src={n.attachment.url} alt="" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <div className="w-10 h-12 bg-stone-200 rounded-sm flex items-center justify-center text-stone-600 flex-shrink-0">
                          <span className="text-[9px] font-mono uppercase">PDF</span>
                        </div>
                      )}
                      <a
                        href={n.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-stone-700 hover:underline truncate flex-1 min-w-0"
                      >
                        {n.attachment.name}
                      </a>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {lightbox !== null && allPhotos.length > 0 && (
        <PhotoLightbox photos={allPhotos} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
