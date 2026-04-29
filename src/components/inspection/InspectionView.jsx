import { useMemo, useState } from "react";
import { ChevronLeft, ClipboardCheck, FileText, ShieldAlert } from "lucide-react";
import { SCHEMA } from "../../data/schema.js";
import { computeScore } from "../../lib/scoring.js";
import SectionBlock from "./SectionBlock.jsx";

export default function InspectionView({ inspection, setInspection, onComplete, onCancel }) {
  const [openSection, setOpenSection] = useState("image");

  if (!inspection) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-white border border-stone-200 rounded-xl p-8 md:p-12 text-center">
          <ClipboardCheck className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold">No active pre-inspection</h3>
          <p className="text-sm text-stone-500 mt-2">Start one from a scheduled inspection or a site card.</p>
        </div>
      </div>
    );
  }

  const setAnswer = (id, v) => setInspection({ ...inspection, answers: { ...inspection.answers, [id]: v } });
  const setComment = (id, v) => setInspection({ ...inspection, comments: { ...inspection.comments, [id]: v } });
  const setPhoto = (id, files) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setInspection({
      ...inspection,
      photos: { ...inspection.photos, [id]: [...(inspection.photos[id] || []), ...list] },
    });
  };
  const removePhoto = (id, idx) =>
    setInspection({
      ...inspection,
      photos: { ...inspection.photos, [id]: (inspection.photos[id] || []).filter((_, i) => i !== idx) },
    });

  const score = useMemo(() => computeScore(inspection.answers), [inspection.answers]);
  const failed = SCHEMA.flatMap((sec) => sec.items.filter((it) => inspection.answers[it.id] === "fail"));
  const ztFailed = SCHEMA.filter((s) => s.zeroTolerance)
    .flatMap((sec) => sec.items.filter((it) => inspection.answers[it.id] === "fail")).length;
  const pct = (score.answered / score.totalItems) * 100;

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200">
        {/* Mobile header */}
        <div className="md:hidden px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={onCancel} className="p-1.5 hover:bg-stone-100 rounded-md flex-shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{inspection.site?.name}</div>
              <div className="text-[11px] text-stone-500">Pre-Inspection</div>
            </div>
            <button
              onClick={onComplete}
              disabled={score.answered === 0}
              className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white text-xs font-medium px-3 py-2 rounded-md flex items-center gap-1.5 flex-shrink-0"
            >
              <FileText className="w-3.5 h-3.5" /> Submit
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono">
              <b className="text-base text-stone-900">{score.earned}</b><span className="text-stone-400">/{score.total}</span>
            </span>
            <span className="text-stone-300">·</span>
            <span className="font-mono"><b>{score.answered}</b>/{score.totalItems}</span>
            {failed.length > 0 && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-red-600 font-semibold">{failed.length} flag{failed.length > 1 ? "s" : ""}</span>
              </>
            )}
          </div>
          <div className="mt-2 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:block px-8 py-4">
          <div className="flex items-center gap-6">
            <button onClick={onCancel} className="p-1.5 hover:bg-stone-100 rounded-md">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 grid grid-cols-4 gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Site</div>
                <div className="text-sm font-medium mt-0.5 truncate">{inspection.site?.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Live Score</div>
                <div className="font-mono text-xl font-semibold mt-0.5">
                  {score.earned}<span className="text-stone-400 text-sm">/{score.total}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Progress</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-xs text-stone-600">{score.answered}/{score.totalItems}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Flags</div>
                <div className={`font-mono text-xl font-semibold mt-0.5 ${failed.length > 0 ? "text-red-600" : "text-stone-300"}`}>
                  {failed.length}
                </div>
              </div>
            </div>
            <button
              onClick={onComplete}
              disabled={score.answered === 0}
              className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Generate Report
            </button>
          </div>
        </div>

        {ztFailed > 0 && (
          <div className="bg-red-50 border-t border-red-200 px-4 md:px-8 py-2.5 md:py-3 flex items-center gap-2 md:gap-3">
            <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs md:text-sm font-semibold text-red-900">
                {ztFailed} ZERO-TOLERANCE violation{ztFailed > 1 ? "s" : ""}
              </div>
              <div className="text-[11px] md:text-xs text-red-700 truncate md:whitespace-normal">
                Immediate corrective action required.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 space-y-3">
        {SCHEMA.map((sec) => (
          <SectionBlock
            key={sec.id}
            section={sec}
            open={openSection === sec.id}
            onToggle={() => setOpenSection(openSection === sec.id ? null : sec.id)}
            answers={inspection.answers}
            comments={inspection.comments}
            photos={inspection.photos}
            setAnswer={setAnswer}
            setComment={setComment}
            setPhoto={setPhoto}
            removePhoto={removePhoto}
          />
        ))}
      </div>
    </div>
  );
}
