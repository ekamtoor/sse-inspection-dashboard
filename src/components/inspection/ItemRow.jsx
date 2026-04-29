import { useRef } from "react";
import { CheckCircle2, XCircle, Camera, X } from "lucide-react";

export default function ItemRow({ item, answer, comment, photoList, setAnswer, setComment, setPhoto, removePhoto }) {
  const fileRef = useRef();
  return (
    <div className="px-4 md:px-6 py-4 md:py-5">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-wider text-stone-500 pt-1 w-10 md:w-12 flex-shrink-0">
          {item.id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-stone-800 leading-relaxed">
            {item.q}
            {item.affects && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-stone-500 font-mono">
                affects {item.affects}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <button
              onClick={() => setAnswer("pass")}
              className={`px-3 py-2 md:py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 flex-1 md:flex-initial justify-center ${
                answer === "pass"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-stone-50 text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 border border-stone-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Pass
            </button>
            <button
              onClick={() => setAnswer("fail")}
              className={`px-3 py-2 md:py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 flex-1 md:flex-initial justify-center ${
                answer === "fail"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-stone-50 text-stone-600 hover:bg-red-50 hover:text-red-700 border border-stone-200"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" /> Fail
            </button>
            {item.pts > 0 && <span className="ml-1 font-mono text-[10px] text-stone-400 flex-shrink-0">+{item.pts}</span>}
          </div>
          {(answer || comment || (photoList && photoList.length > 0)) && (
            <div className="mt-3 space-y-3">
              <textarea
                value={comment || ""}
                onChange={(e) => setComment(e.target.value)}
                placeholder={answer === "fail" ? "What's wrong? What's the fix?" : "Notes (optional)"}
                rows={2}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:border-stone-400"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {photoList?.map((p, i) => (
                  <div key={i} className="w-16 h-16 rounded-md bg-stone-100 border border-stone-200 overflow-hidden relative group">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-stone-900/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center md:opacity-0 md:group-hover:opacity-100"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files)}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-16 h-16 rounded-md border border-dashed border-stone-300 hover:border-stone-500 hover:bg-stone-50 flex flex-col items-center justify-center gap-0.5 text-stone-500"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[9px] uppercase tracking-wider">Add</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
