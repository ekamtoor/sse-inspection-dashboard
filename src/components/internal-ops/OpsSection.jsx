import { ChevronDown, ChevronRight, CircleDot } from "lucide-react";
import OpsItem from "./OpsItem.jsx";

export default function OpsSection({
  section, open, onToggle, values, comments, photos, uploadingByItem, tobacco,
  setValue, setComment, setPhoto, removePhoto, setTobacco, isFlagged,
}) {
  const Icon = section.icon || CircleDot;
  const completed = section.items.filter((it) => values[it.id] !== undefined).length;
  const flagged = section.items.filter((it) => isFlagged(it, values[it.id])).length;

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-stone-50 text-left"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-stone-500 flex-shrink-0" />
        )}
        <div className="w-8 h-8 bg-stone-100 rounded-md flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-stone-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base md:text-lg font-semibold truncate">{section.label}</h3>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-xs flex-shrink-0">
          {flagged > 0 && <span className="text-red-600 font-medium">{flagged}</span>}
          <span className="font-mono text-stone-600">
            {completed}<span className="text-stone-400">/{section.items.length}</span>
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-stone-100 divide-y divide-stone-100">
          {section.items.map((it) => (
            <OpsItem
              key={it.id}
              item={it}
              value={values[it.id]}
              comment={comments[it.id]}
              photoList={photos?.[it.id]}
              uploadingCount={uploadingByItem?.[it.id] || 0}
              tobacco={tobacco}
              setValue={(v) => setValue(it.id, v)}
              setComment={(v) => setComment(it.id, v)}
              setPhoto={(f) => setPhoto(it.id, f)}
              removePhoto={(i) => removePhoto(it.id, i)}
              setTobacco={setTobacco}
              flagged={isFlagged(it, values[it.id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
