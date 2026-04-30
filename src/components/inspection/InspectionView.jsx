import { useMemo, useState } from "react";
import { ChevronLeft, ClipboardCheck, FileText, ShieldAlert, Trash2 } from "lucide-react";
import { SCHEMA, getInspectionSchema } from "../../data/schema.js";
import { computeScore } from "../../lib/scoring.js";
import { uploadPhoto, deletePhoto } from "../../lib/photos.js";
import SectionBlock from "./SectionBlock.jsx";

export default function InspectionView({ inspection, setInspection, onComplete, onLeave, onDiscard, user }) {
  const [openSection, setOpenSection] = useState("image");
  const [uploadingByItem, setUploadingByItem] = useState({});

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

  const setAnswer = (id, v) =>
    setInspection((curr) => ({ ...curr, answers: { ...curr.answers, [id]: v } }));
  const setComment = (id, v) =>
    setInspection((curr) => ({ ...curr, comments: { ...curr.comments, [id]: v } }));

  const setPhoto = async (id, files) => {
    if (!files || files.length === 0 || !user || !inspection) return;
    const fileArr = Array.from(files);
    setUploadingByItem((u) => ({ ...u, [id]: (u[id] || 0) + fileArr.length }));
    const inspectionIdAtStart = inspection.id;
    const uploaded = [];
    for (const f of fileArr) {
      try {
        const result = await uploadPhoto(user.id, inspectionIdAtStart, f);
        uploaded.push(result);
      } catch (err) {
        console.error("Photo upload failed:", err);
        // Surface a simple alert; toast plumbing isn't reachable from here.
        // eslint-disable-next-line no-alert
        alert(`Couldn't upload ${f.name}: ${err?.message || "unknown error"}`);
      }
    }
    setInspection((curr) => {
      if (!curr || curr.id !== inspectionIdAtStart) return curr;
      return {
        ...curr,
        photos: { ...curr.photos, [id]: [...(curr.photos?.[id] || []), ...uploaded] },
      };
    });
    setUploadingByItem((u) => {
      const next = { ...u, [id]: Math.max(0, (u[id] || 0) - fileArr.length) };
      if (!next[id]) delete next[id];
      return next;
    });
  };

  const removePhoto = (id, idx) => {
    const target = inspection.photos?.[id]?.[idx];
    setInspection((curr) => ({
      ...curr,
      photos: { ...curr.photos, [id]: (curr.photos?.[id] || []).filter((_, i) => i !== idx) },
    }));
    if (target?.path) {
      deletePhoto(target.path);
    }
  };

  // Full schema (scored sections + dynamic Pumps section sized to this site)
  // for rendering. computeScore stays on the static SCHEMA so the per-pump
  // checks never count toward the 200-pt total.
  const fullSchema = useMemo(() => getInspectionSchema(inspection), [inspection]);
  const score = useMemo(() => computeScore(inspection.answers), [inspection.answers]);
  const failed = fullSchema.flatMap((sec) => sec.items.filter((it) => inspection.answers[it.id] === "fail"));
  const ztFailed = SCHEMA.filter((s) => s.zeroTolerance)
    .flatMap((sec) => sec.items.filter((it) => inspection.answers[it.id] === "fail")).length;
  const pct = (score.answered / score.totalItems) * 100;
  const livePassing = score.answered > 0 && score.passed;
  const liveFailing = score.answered > 0 && !score.passed;
  const percentLabel = score.answered > 0 ? `${Math.round(score.percentage * 100)}%` : "—";

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200">
        {/* Mobile header */}
        <div className="md:hidden px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onLeave}
              title="Save & leave"
              className="p-1.5 hover:bg-stone-100 rounded-md flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{inspection.site?.name}</div>
              <div className="text-[11px] text-stone-500">Inspection · auto-saving</div>
            </div>
            <button
              onClick={onDiscard}
              title="Discard"
              className="p-2 hover:bg-red-50 rounded-md text-stone-400 hover:text-red-600 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onComplete}
              disabled={score.answered === 0}
              className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white text-xs font-medium px-3 py-2 rounded-md flex items-center gap-1.5 flex-shrink-0"
            >
              <FileText className="w-3.5 h-3.5" /> Submit
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-mono">
              <b className="text-base text-stone-900">{score.earned}</b><span className="text-stone-400">/{score.effectiveTotal}</span>
            </span>
            <span className="font-mono text-stone-500">{percentLabel}</span>
            {livePassing && (
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Pass</span>
            )}
            {liveFailing && (
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-red-600 text-white rounded font-bold">Fail</span>
            )}
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
          <div className="flex items-center gap-4">
            <button
              onClick={onLeave}
              title="Save & leave — resume from dashboard"
              className="p-1.5 hover:bg-stone-100 rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onDiscard}
              title="Discard this in-progress walkthrough"
              className="text-xs font-medium text-stone-500 hover:text-red-600 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Discard
            </button>
            <div className="flex-1 grid grid-cols-4 gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Site</div>
                <div className="text-sm font-medium mt-0.5 truncate">{inspection.site?.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Live Score</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono text-xl font-semibold">
                    {score.earned}<span className="text-stone-400 text-sm">/{score.effectiveTotal}</span>
                  </span>
                  <span className="font-mono text-xs text-stone-500">{percentLabel}</span>
                  {livePassing && (
                    <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Pass</span>
                  )}
                  {liveFailing && (
                    <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-red-600 text-white rounded font-bold">Fail</span>
                  )}
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
        {fullSchema.map((sec) => (
          <SectionBlock
            key={sec.id}
            section={sec}
            open={openSection === sec.id}
            onToggle={() => setOpenSection(openSection === sec.id ? null : sec.id)}
            answers={inspection.answers}
            comments={inspection.comments}
            photos={inspection.photos}
            uploadingByItem={uploadingByItem}
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
