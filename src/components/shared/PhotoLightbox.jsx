import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

// Full-screen photo viewer with prev/next + keyboard navigation. The caller
// passes a flat list of { url, name } objects plus the index of the photo to
// open with; the component handles the rest (escape closes, arrows navigate).
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

      {/* The wrapper has `min-h-0` so flex shrinking actually applies — without
          it, max-h-full on the <img> resolves against an auto-sized parent and
          the image renders at its natural pixel size on desktop, leaving only
          the bottom half visible. `relative` anchors the absolute arrow buttons
          to this image area instead of the whole viewport. */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-2 md:px-16 pb-4 md:pb-8"
        onClick={(e) => e.stopPropagation()}
      >
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
    </div>
  );
}
