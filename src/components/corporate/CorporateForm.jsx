import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import Field from "../shared/Field.jsx";

export default function CorporateForm({ sites, onSubmit, onClose }) {
  const [form, setForm] = useState({
    siteId: sites[0]?.id || "",
    date: new Date().toISOString().slice(0, 10),
    brand: "Shell",
    score: "",
    total: 107,
    inspector: "Mystery Shop (External)",
    notes: "",
    sections: [{ label: "", earned: "", total: "" }],
    cures: [],
  });
  const [newCure, setNewCure] = useState("");

  const submit = () => {
    if (!form.siteId || !form.score) return;
    onSubmit({
      ...form,
      score: parseInt(form.score),
      total: parseInt(form.total),
      sections: form.sections
        .filter((s) => s.label && s.total)
        .map((s) => ({ ...s, earned: parseInt(s.earned), total: parseInt(s.total) })),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:bg-stone-900/40 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-full md:max-w-2xl shadow-2xl md:my-8 max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-xl animate-slide-up md:animate-slide"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="md:hidden pt-3 pb-1 flex justify-center flex-shrink-0">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>
        <div className="px-5 md:px-6 py-4 md:py-5 border-b border-stone-200 flex items-start justify-between flex-shrink-0">
          <div>
            <h3 className="font-display text-lg md:text-xl font-semibold">Add Corporate Report</h3>
            <p className="text-xs text-stone-500 mt-0.5">Archive a quarterly mystery-shop result</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 md:px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Field label="Site" required>
              <select value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm">
                {sites.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono" />
            </Field>
            <Field label="Brand">
              <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm">
                <option value="Shell">Shell</option>
                <option value="Marathon">Marathon</option>
                <option value="ARCO">ARCO</option>
                <option value="Marathon/ARCO">Marathon/ARCO</option>
              </select>
            </Field>
            <Field label="Inspector">
              <input value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm" />
            </Field>
            <Field label="Score" required>
              <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono" />
            </Field>
            <Field label="Total possible">
              <input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono" />
            </Field>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-3">Section Breakdown (optional)</div>
            <div className="space-y-2">
              {form.sections.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder="Section name"
                    value={s.label}
                    onChange={(e) => {
                      const sections = [...form.sections];
                      sections[i].label = e.target.value;
                      setForm({ ...form, sections });
                    }}
                    className="flex-1 min-w-0 bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Earned"
                    value={s.earned}
                    onChange={(e) => {
                      const sections = [...form.sections];
                      sections[i].earned = e.target.value;
                      setForm({ ...form, sections });
                    }}
                    className="w-20 bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono"
                  />
                  <span className="text-stone-400 flex-shrink-0">/</span>
                  <input
                    type="number"
                    placeholder="Total"
                    value={s.total}
                    onChange={(e) => {
                      const sections = [...form.sections];
                      sections[i].total = e.target.value;
                      setForm({ ...form, sections });
                    }}
                    className="w-20 bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => setForm({ ...form, sections: form.sections.filter((_, j) => j !== i) })}
                    className="p-1.5 hover:bg-red-100 rounded text-stone-400 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setForm({ ...form, sections: [...form.sections, { label: "", earned: "", total: "" }] })}
                className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add section
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-3">Curable Items</div>
            <div className="space-y-2">
              {form.cures.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <span className="text-sm flex-1 min-w-0 truncate">{c}</span>
                  <button
                    onClick={() => setForm({ ...form, cures: form.cures.filter((_, j) => j !== i) })}
                    className="text-amber-700 hover:text-red-600 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  placeholder='e.g., "Q15: POP outdated"'
                  value={newCure}
                  onChange={(e) => setNewCure(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCure) {
                      setForm({ ...form, cures: [...form.cures, newCure] });
                      setNewCure("");
                    }
                  }}
                  className="flex-1 min-w-0 bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm"
                />
                <button
                  onClick={() => {
                    if (newCure) {
                      setForm({ ...form, cures: [...form.cures, newCure] });
                      setNewCure("");
                    }
                  }}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-3 py-2 rounded-md flex-shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
              className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm resize-none" />
          </Field>
        </div>

        <div className="px-5 md:px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900 text-sm px-4 py-2 rounded-md">Cancel</button>
          <button onClick={submit} className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-md">
            Archive report
          </button>
        </div>
      </div>
    </div>
  );
}
