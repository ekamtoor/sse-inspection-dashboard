import { useRef } from "react";
import { CheckCircle2, XCircle, MinusCircle, Camera, X, Loader2 } from "lucide-react";
import { getResponseType } from "../../data/schema.js";

// Cap photos per item so a runaway upload doesn't bloat a single inspection.
// 5 fits the common "snap a few angles" use case without getting silly.
const PHOTO_LIMIT = 5;

export default function ItemRow({
  item, answer, comment, photoList, uploadingCount,
  setAnswer, setComment, setPhoto, removePhoto,
}) {
  const fileRef = useRef();
  const photoCount = photoList?.length || 0;
  const inflight = uploadingCount || 0;
  const remaining = Math.max(0, PHOTO_LIMIT - photoCount - inflight);
  const responseType = getResponseType(item);
  const hasAnswer = answer != null && answer !== "";

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
            {responseType !== "pass_fail" && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-stone-400 font-mono">
                {responseType}
              </span>
            )}
          </div>

          {responseType === "pass_fail" && (
            <PassFailWidget
              answer={answer}
              setAnswer={setAnswer}
              points={item.pts}
            />
          )}

          {responseType === "number" && (
            <NumberWidget
              answer={answer}
              setAnswer={setAnswer}
              unit={item.unit}
              min={item.min}
              max={item.max}
              placeholder={item.placeholder}
            />
          )}

          {responseType === "text" && (
            <TextWidget
              answer={answer}
              setAnswer={setAnswer}
              placeholder={item.placeholder}
            />
          )}

          {responseType === "select" && (
            <SelectWidget
              answer={answer}
              setAnswer={setAnswer}
              options={item.options || []}
            />
          )}

          {(hasAnswer || comment || photoCount > 0 || inflight > 0) && (
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
                  <div key={p.path || p.url || i} className="w-16 h-16 rounded-md bg-stone-100 border border-stone-200 overflow-hidden relative group">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-stone-900/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center md:opacity-0 md:group-hover:opacity-100"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {Array.from({ length: inflight }).map((_, i) => (
                  <div
                    key={`upload-${i}`}
                    className="w-16 h-16 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ))}
                {/* Drop capture="environment" so iOS shows the native picker
                    (Camera / Photo Library / Files). Library mode honors the
                    `multiple` attribute; capture mode silently ignored it and
                    forced single-shot, which is why uploads felt limited to one. */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, remaining);
                    if (files.length > 0) setPhoto(files);
                    e.target.value = "";
                  }}
                />
                {remaining > 0 ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-16 h-16 rounded-md border border-dashed border-stone-300 hover:border-stone-500 hover:bg-stone-50 flex flex-col items-center justify-center gap-0.5 text-stone-500"
                    title={`Add up to ${remaining} more photo${remaining === 1 ? "" : "s"} (max ${PHOTO_LIMIT})`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-wider">Add</span>
                  </button>
                ) : (
                  <div
                    className="w-16 h-16 rounded-md border border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-0.5 text-stone-400"
                    title={`Photo limit reached (${PHOTO_LIMIT} max)`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-wider">Max</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PassFailWidget({ answer, setAnswer, points }) {
  return (
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
      <button
        onClick={() => setAnswer("na")}
        className={`px-3 py-2 md:py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 flex-1 md:flex-initial justify-center ${
          answer === "na"
            ? "bg-stone-700 text-white shadow-sm"
            : "bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200"
        }`}
      >
        <MinusCircle className="w-3.5 h-3.5" /> N/A
      </button>
      {points > 0 && <span className="ml-1 font-mono text-[10px] text-stone-400 flex-shrink-0">+{points}</span>}
    </div>
  );
}

function NumberWidget({ answer, setAnswer, unit, min, max, placeholder }) {
  const hint = [
    min != null ? `min ${min}` : null,
    max != null ? `max ${max}` : null,
  ].filter(Boolean).join(" · ");
  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        value={answer ?? ""}
        onChange={(e) => setAnswer(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={placeholder || "Enter a number"}
        min={min}
        max={max}
        className="w-40 text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400"
      />
      {unit && <span className="text-xs text-stone-500 font-mono">{unit}</span>}
      {hint && <span className="text-[10px] uppercase tracking-wider text-stone-400 ml-auto">{hint}</span>}
    </div>
  );
}

function TextWidget({ answer, setAnswer, placeholder }) {
  return (
    <div className="mt-3">
      <input
        type="text"
        value={answer ?? ""}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={placeholder || "Type your answer"}
        className="w-full text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400"
      />
    </div>
  );
}

function SelectWidget({ answer, setAnswer, options }) {
  return (
    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
      {options.length === 0 ? (
        <span className="text-xs text-stone-400 italic">No options configured for this item.</span>
      ) : (
        options.map((opt) => (
          <button
            key={opt}
            onClick={() => setAnswer(answer === opt ? "" : opt)}
            className={`px-3 py-2 md:py-1.5 rounded-md text-xs font-medium ${
              answer === opt
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            {opt}
          </button>
        ))
      )}
    </div>
  );
}
