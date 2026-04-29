import { useState } from "react";
import { ChevronLeft, FileText, Wrench, Trash2 } from "lucide-react";
import { INTERNAL_OPS } from "../../data/internalOps.js";
import { uploadPhoto, deletePhoto } from "../../lib/photos.js";
import OpsSection from "./OpsSection.jsx";

export default function InternalOpsView({
  audit, setAudit, sites, onComplete, onLeave, onDiscard, startInternal, user,
}) {
  const [openSection, setOpenSection] = useState("atm");
  const [uploadingByItem, setUploadingByItem] = useState({});

  // No active audit yet — show site picker
  if (!audit) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-white border border-stone-200 rounded-xl p-5 md:p-8 text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-6 h-6 text-stone-600" />
          </div>
          <h3 className="font-display text-xl font-semibold">Start an Internal Ops Walk</h3>
          <p className="text-sm text-stone-500 mt-2 max-w-md mx-auto">
            Owner-side daily/weekly walkthrough. Captures everything corporate doesn't —
            tobacco buy-down, cooler temps, ATM cash, lottery, equipment, back stock.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => startInternal(s.id)}
                className="px-4 py-3 border border-stone-200 hover:border-stone-400 hover:bg-stone-50 rounded-md flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-xs text-stone-500 truncate">{s.city} · {s.brand}</div>
                </div>
                <span className="text-xs font-medium text-stone-900 flex-shrink-0">Start →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const setValue = (id, v) =>
    setAudit((curr) => ({ ...curr, values: { ...curr.values, [id]: v } }));
  const setComment = (id, v) =>
    setAudit((curr) => ({ ...curr, comments: { ...curr.comments, [id]: v } }));
  const setTobacco = (rows) =>
    setAudit((curr) => ({ ...curr, tobacco: typeof rows === "function" ? rows(curr.tobacco) : rows }));

  const setPhoto = async (id, files) => {
    if (!files || files.length === 0 || !user || !audit) return;
    const fileArr = Array.from(files);
    setUploadingByItem((u) => ({ ...u, [id]: (u[id] || 0) + fileArr.length }));
    const auditIdAtStart = audit.id;
    const uploaded = [];
    for (const f of fileArr) {
      try {
        uploaded.push(await uploadPhoto(user.id, auditIdAtStart, f));
      } catch (err) {
        console.error("Photo upload failed:", err);
        // eslint-disable-next-line no-alert
        alert(`Couldn't upload ${f.name}: ${err?.message || "unknown error"}`);
      }
    }
    setAudit((curr) => {
      if (!curr || curr.id !== auditIdAtStart) return curr;
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
    const target = audit.photos?.[id]?.[idx];
    setAudit((curr) => ({
      ...curr,
      photos: { ...curr.photos, [id]: (curr.photos?.[id] || []).filter((_, i) => i !== idx) },
    }));
    if (target?.path) deletePhoto(target.path);
  };

  const isFlagged = (item, v) => {
    if (v === undefined || v === "") return false;
    if (item.type === "yesno") return v === "no";
    if (item.type === "numeric") {
      const num = parseFloat(v);
      if (isNaN(num)) return false;
      return item.target ? num < item.target[0] || num > item.target[1] : false;
    }
    if (item.type === "currency") {
      const num = parseFloat(v);
      if (isNaN(num)) return false;
      return item.target ? num < item.target : false;
    }
    return false;
  };

  let totalAnswered = 0, totalItems = 0, totalFlagged = 0;
  INTERNAL_OPS.forEach((sec) =>
    sec.items.forEach((it) => {
      totalItems += 1;
      const v = audit.values[it.id];
      if (v !== undefined && v !== "") totalAnswered += 1;
      if (isFlagged(it, v)) totalFlagged += 1;
    })
  );
  const tobaccoMismatches = (audit.tobacco || []).filter((r) => !r.match).length;
  totalFlagged += tobaccoMismatches;
  const pct = (totalAnswered / totalItems) * 100;

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
              <div className="text-sm font-medium truncate">{audit.site?.name}</div>
              <div className="text-[11px] text-stone-500">Internal Ops · auto-saving</div>
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
              disabled={totalAnswered === 0}
              className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white text-xs font-medium px-3 py-2 rounded-md flex items-center gap-1.5 flex-shrink-0"
            >
              <FileText className="w-3.5 h-3.5" /> Submit
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono"><b>{totalAnswered}</b>/{totalItems}</span>
            {totalFlagged > 0 && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-red-600 font-semibold">{totalFlagged} flag{totalFlagged > 1 ? "s" : ""}</span>
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
                <div className="text-sm font-medium mt-0.5 truncate">{audit.site?.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Type</div>
                <div className="text-sm font-medium mt-0.5">Internal Ops Walk</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Progress</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-xs text-stone-600">{totalAnswered}/{totalItems}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Flags</div>
                <div className={`font-mono text-xl font-semibold mt-0.5 ${totalFlagged > 0 ? "text-red-600" : "text-stone-300"}`}>
                  {totalFlagged}
                </div>
              </div>
            </div>
            <button
              onClick={onComplete}
              disabled={totalAnswered === 0}
              className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-3">
        {INTERNAL_OPS.map((sec) => (
          <OpsSection
            key={sec.id}
            section={sec}
            open={openSection === sec.id}
            onToggle={() => setOpenSection(openSection === sec.id ? null : sec.id)}
            values={audit.values}
            comments={audit.comments}
            photos={audit.photos || {}}
            uploadingByItem={uploadingByItem}
            tobacco={audit.tobacco}
            setValue={setValue}
            setComment={setComment}
            setPhoto={setPhoto}
            removePhoto={removePhoto}
            setTobacco={setTobacco}
            isFlagged={isFlagged}
          />
        ))}
      </div>
    </div>
  );
}
