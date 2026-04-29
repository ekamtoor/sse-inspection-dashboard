import { CheckCircle2, XCircle } from "lucide-react";
import TobaccoAudit from "./TobaccoAudit.jsx";

export default function OpsItem({ item, value, comment, tobacco, setValue, setComment, setTobacco, flagged }) {
  return (
    <div className={`px-4 md:px-6 py-4 md:py-5 ${flagged ? "bg-red-50/40" : ""}`}>
      <div className="flex items-start gap-3 md:gap-4">
        <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-wider text-stone-500 pt-1 w-12 md:w-14 flex-shrink-0">
          {item.id}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-stone-800 leading-relaxed">{item.q}</div>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {item.type === "yesno" && (
              <>
                <button
                  onClick={() => setValue("yes")}
                  className={`px-3 py-2 md:py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 flex-1 md:flex-initial justify-center ${
                    value === "yes"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-stone-50 text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 border border-stone-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                </button>
                <button
                  onClick={() => setValue("no")}
                  className={`px-3 py-2 md:py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 flex-1 md:flex-initial justify-center ${
                    value === "no"
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-stone-50 text-stone-600 hover:bg-red-50 hover:text-red-700 border border-stone-200"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" /> No
                </button>
              </>
            )}
            {item.type === "numeric" && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={value || ""}
                  onChange={(e) => setValue(e.target.value)}
                  className={`w-24 bg-stone-50 border rounded-md px-2 py-2 md:py-1.5 text-sm font-mono focus:outline-none ${
                    flagged ? "border-red-300" : "border-stone-200 focus:border-stone-400"
                  }`}
                />
                <span className="text-xs text-stone-500 font-mono">{item.unit}</span>
              </div>
            )}
            {item.type === "currency" && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-stone-500 font-mono">$</span>
                <input
                  type="number"
                  value={value || ""}
                  onChange={(e) => setValue(e.target.value)}
                  className={`w-28 bg-stone-50 border rounded-md px-2 py-2 md:py-1.5 text-sm font-mono focus:outline-none ${
                    flagged ? "border-red-300" : "border-stone-200 focus:border-stone-400"
                  }`}
                />
              </div>
            )}
          </div>
          {item.target && (item.type === "numeric" || item.type === "currency") && (
            <div className="text-[10px] text-stone-400 font-mono mt-1">
              target:{" "}
              {item.type === "currency"
                ? `≥ $${item.target.toLocaleString()}`
                : `${item.target[0]}${item.unit || ""} – ${item.target[1]}${item.unit || ""}`}
              {flagged && <span className="ml-2 text-red-600 font-medium uppercase">out of range</span>}
            </div>
          )}
          {item.type === "tobacco-audit" && <TobaccoAudit rows={tobacco} setRows={setTobacco} />}
          {(value !== undefined || comment) && item.type !== "tobacco-audit" && (
            <div className="mt-3">
              <textarea
                value={comment || ""}
                onChange={(e) => setComment(e.target.value)}
                placeholder={flagged ? "What's wrong? What's the fix?" : "Notes (optional)"}
                rows={2}
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:border-stone-400"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
