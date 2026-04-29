import { useState } from "react";
import { Tag, CheckCircle2, XCircle, Trash2 } from "lucide-react";

export default function TobaccoAudit({ rows = [], setRows }) {
  const [draft, setDraft] = useState({ item: "", tag: "", scan: "" });

  const add = () => {
    if (!draft.item) return;
    const tag = parseFloat(draft.tag);
    const scan = parseFloat(draft.scan);
    const match = !isNaN(tag) && !isNaN(scan) && Math.abs(tag - scan) < 0.005;
    setRows([...(rows || []), { ...draft, match, id: Math.random().toString(36).slice(2) }]);
    setDraft({ item: "", tag: "", scan: "" });
  };
  const remove = (id) => setRows((rows || []).filter((r) => r.id !== id));
  const mismatches = (rows || []).filter((r) => !r.match).length;

  return (
    <div className="mt-3 bg-white border border-stone-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Tag className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
          <span className="text-xs font-medium text-stone-700">Buy-down price audit</span>
          <span className="hidden md:inline text-[10px] text-stone-500 font-mono">tag = scan?</span>
        </div>
        {mismatches > 0 && <span className="text-xs text-red-600 font-medium flex-shrink-0">{mismatches} ✗</span>}
      </div>
      <div className="divide-y divide-stone-100">
        {(rows || []).map((r) => (
          <div key={r.id} className={`px-3 py-2 flex items-center gap-2 md:gap-3 text-sm ${!r.match ? "bg-red-50/50" : ""}`}>
            <div className="flex-1 truncate">{r.item}</div>
            <div className="font-mono text-xs text-stone-600 text-right">
              ${parseFloat(r.tag).toFixed(2)}/${parseFloat(r.scan).toFixed(2)}
            </div>
            {r.match
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
            <button onClick={() => remove(r.id)} className="text-stone-400 hover:text-red-600 flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {(rows || []).length === 0 && (
          <div className="px-3 py-3 text-xs text-stone-400 italic">
            Add cigarette / tobacco SKUs below to check tag-vs-scan price match.
          </div>
        )}
      </div>
      <div className="px-3 py-2 bg-stone-50 border-t border-stone-200 flex items-center gap-1.5 md:gap-2 flex-wrap">
        <input
          value={draft.item}
          onChange={(e) => setDraft({ ...draft, item: e.target.value })}
          placeholder="Item"
          className="flex-1 min-w-0 bg-white border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-stone-400"
        />
        <input
          value={draft.tag}
          onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
          placeholder="Tag $"
          type="number"
          step="0.01"
          className="w-20 bg-white border border-stone-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-stone-400"
        />
        <input
          value={draft.scan}
          onChange={(e) => setDraft({ ...draft, scan: e.target.value })}
          placeholder="Scan $"
          type="number"
          step="0.01"
          className="w-20 bg-white border border-stone-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-stone-400"
        />
        <button onClick={add} className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium px-2.5 py-1.5 rounded">
          Add
        </button>
      </div>
    </div>
  );
}
