import { useEffect, useState } from "react";
import {
  X, ChevronLeft, ChevronRight, Download, ShieldAlert,
} from "lucide-react";

// Full-screen photo viewer with prev/next + keyboard navigation. The caller
// passes a flat list of photo objects; each may also carry item context
// (question, answer, comment, section) which the side info panel surfaces.
export default function PhotoLightbox({ photos, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, photos.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length, onClose]);

  if (!photos || photos.length === 0) return null;
  const safeIndex = Math.min(Math.max(index, 0), photos.length - 1);
  const photo = photos[safeIndex];
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < photos.length - 1;
  const hasContext = Boolean(photo.itemId || photo.itemQuestion);

  const answerPill = (() => {
    if (photo.answer === "pass") {
      return { label: "Pass", className: "bg-emerald-500/30 text-emerald-200" };
    }
    if (photo.answer === "fail") {
      return { label: "Fail", className: "bg-red-500/40 text-red-100" };
    }
    if (photo.answer === "na") {
      return { label: "N/A", className: "bg-stone-500/40 text-stone-100" };
    }
    return null;
  })();

  return (
    <div
      className="fixed inset-0 z-[60] bg-stone-950/95 flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 md:px-6 py-3 text-white flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs md:text-sm text-stone-300 truncate flex-1 min-w-0 pr-3">
          <span className="font-mono mr-2">{safeIndex + 1} / {photos.length}</span>
          {photo.name && <span className="text-stone-400 truncate">{photo.name}</span>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {photo.url && (
            <a
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              download={photo.name || true}
              className="p-2 hover:bg-white/10 rounded-md text-stone-200"
              title="Open full size in new tab"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-md text-stone-200"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body splits into image area + (optional) info panel.
          Mobile: stacked column (image on top, panel below capped at 38vh).
          Desktop: side-by-side row with the panel as a fixed-width sidebar. */}
      <div
        className="flex-1 min-h-0 flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* min-h-0 + min-w-0 so flex shrinking actually applies and max-h-full /
            max-w-full on the <img> resolve correctly on desktop. */}
        <div className="relative flex-1 min-h-0 min-w-0 flex items-center justify-center px-2 md:px-12 pb-3 md:pb-8">
          {hasPrev && (
            <button
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-10"
              title="Previous (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <img
            src={photo.url}
            alt={photo.name || ""}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
          {hasNext && (
            <button
              onClick={() => setIndex((i) => Math.min(i + 1, photos.length - 1))}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-10"
              title="Next (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {hasContext && (
          <aside className="flex-shrink-0 md:w-80 lg:w-96 max-h-[38vh] md:max-h-none overflow-y-auto bg-stone-900/85 border-t border-white/10 md:border-t-0 md:border-l text-stone-200">
            <div className="px-4 md:px-6 py-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {photo.sectionZeroTolerance && (
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
                    {photo.sectionLabel || "Item"}
                  </span>
                  {photo.sectionDocumentation && (
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                      Documentation
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-stone-400">
                    {photo.itemId}
                  </span>
                  {photo.itemPoints > 0 && (
                    <span className="font-mono text-[10px] text-stone-500">+{photo.itemPoints} pts</span>
                  )}
                </div>
                {photo.itemQuestion && (
                  <p className="text-sm text-stone-100 mt-2 leading-relaxed">
                    {photo.itemQuestion}
                  </p>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-stone-400 font-medium mb-2">
                  Result
                </div>
                {answerPill ? (
                  <span
                    className={`inline-flex items-center text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${answerPill.className}`}
                  >
                    {answerPill.label}
                  </span>
                ) : (
                  <span className="text-xs text-stone-500 italic">No answer recorded</span>
                )}
              </div>

              {photo.comment && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-stone-400 font-medium mb-2">
                    Notes
                  </div>
                  <p className="text-sm text-stone-200 italic font-display leading-relaxed whitespace-pre-wrap">
                    {photo.comment}
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
