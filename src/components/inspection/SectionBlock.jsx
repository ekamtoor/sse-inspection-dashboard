import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import ItemRow from "./ItemRow.jsx";

export default function SectionBlock({
  section, open, onToggle, answers, comments, photos, setAnswer, setComment, setPhoto, removePhoto,
}) {
  const earned = section.items.reduce((a, it) => a + (answers[it.id] === "pass" ? it.pts : 0), 0);
  const total = section.items.reduce((a, it) => a + it.pts, 0);
  const fails = section.items.filter((it) => answers[it.id] === "fail").length;
  const borderClass = section.zeroTolerance
    ? "border-red-300"
    : section.critical
      ? "border-amber-300"
      : "border-stone-200";

  return (
    <div className={`bg-white border-2 rounded-xl overflow-hidden ${borderClass}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-stone-50 text-left"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-stone-500 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {section.zeroTolerance && <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />}
            <h3 className="font-display text-base md:text-lg font-semibold">{section.label}</h3>
            {section.zeroTolerance ? (
              <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-wider px-1.5 md:px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold">
                Zero Tolerance
              </span>
            ) : section.critical && (
              <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-wider px-1.5 md:px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                Must Pass
              </span>
            )}
            {section.source && (
              <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-stone-100 text-stone-600 rounded">
                {section.source}
              </span>
            )}
          </div>
          {section.subtitle && (
            <p className={`text-[11px] md:text-xs mt-0.5 ${section.zeroTolerance ? "text-red-700 font-medium" : "text-stone-500"}`}>
              {section.subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-xs flex-shrink-0">
          {fails > 0 && <span className="text-red-600 font-medium">{fails}</span>}
          {total > 0 && <span className="font-mono text-stone-600">{earned}<span className="text-stone-400">/{total}</span></span>}
        </div>
      </button>
      {open && (
        <div className="border-t border-stone-100 divide-y divide-stone-100">
          {section.items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              answer={answers[it.id]}
              comment={comments[it.id]}
              photoList={photos[it.id]}
              setAnswer={(v) => setAnswer(it.id, v)}
              setComment={(v) => setComment(it.id, v)}
              setPhoto={(f) => setPhoto(it.id, f)}
              removePhoto={(i) => removePhoto(it.id, i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
