import { useMemo, useRef, useState } from "react";
import {
  Settings, Upload, RefreshCw, Save, Plus, Trash2, ChevronDown, ChevronRight,
  AlertTriangle, Shield, FileJson, Info,
} from "lucide-react";
import {
  RESPONSE_TYPES, getResponseType, buildDefaultTemplate, resolveActiveTemplate,
} from "../../data/schema.js";

// White-label template editor.
// - Reads / writes the saved custom template (stored under user_data.template).
// - Lets the user override the default 200-pt rubric with their own.
// - Supports JSON import (full replace) and revert to default.
// - Each item gets a response-type widget so question types can be mixed.
// - All edits live in local draft state; "Save" persists, "Cancel" reverts.

const RESPONSE_LABELS = {
  pass_fail: "Pass / Fail / N/A",
  number: "Number",
  text: "Text",
  select: "Select",
};

function blankItem(responseType = "pass_fail") {
  const id = `Q-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const base = { id, q: "New question", responseType };
  if (responseType === "pass_fail") return { ...base, pts: 1 };
  if (responseType === "number") return { ...base, unit: "" };
  if (responseType === "select") return { ...base, options: ["Option 1", "Option 2"] };
  return base;
}

function blankSection() {
  const id = `S-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return { id, label: "New Section", items: [blankItem()] };
}

function cloneTemplate(t) {
  return JSON.parse(JSON.stringify(t));
}

// Minimal validator. Expects the same shape buildDefaultTemplate produces.
function validateTemplate(obj) {
  if (!obj || typeof obj !== "object") return "JSON root must be an object.";
  if (!Array.isArray(obj.sections)) return "Missing `sections` array.";
  for (const sec of obj.sections) {
    if (!sec || typeof sec.label !== "string") return "Each section needs a string `label`.";
    if (!Array.isArray(sec.items)) return `Section "${sec.label}" is missing an items array.`;
    for (const it of sec.items) {
      if (typeof it.id !== "string" || !it.id) return `An item in "${sec.label}" is missing an id.`;
      if (typeof it.q !== "string") return `Item ${it.id} is missing question text (q).`;
      if (it.responseType && !RESPONSE_TYPES.includes(it.responseType)) {
        return `Item ${it.id} has unknown responseType "${it.responseType}".`;
      }
    }
  }
  return null;
}

export default function TemplateEditor({ customTemplate, setCustomTemplate, onToast }) {
  const active = useMemo(() => resolveActiveTemplate(customTemplate), [customTemplate]);
  const [draft, setDraft] = useState(() => cloneTemplate(active));
  const [openSection, setOpenSection] = useState(draft.sections[0]?.id || null);
  const [importError, setImportError] = useState(null);
  const fileRef = useRef();

  const isCustom = !!customTemplate?.sections?.length;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(active);

  const save = () => {
    setCustomTemplate(draft);
    onToast?.("Template saved.");
  };

  const cancel = () => {
    setDraft(cloneTemplate(active));
    setImportError(null);
  };

  const revertToDefault = () => {
    if (!isCustom) return;
    const def = buildDefaultTemplate();
    setCustomTemplate(null);
    setDraft(cloneTemplate(def));
    onToast?.("Reverted to default template.");
  };

  const importJson = async (file) => {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const err = validateTemplate(parsed);
      if (err) {
        setImportError(err);
        return;
      }
      setDraft({
        name: parsed.name || file.name.replace(/\.json$/i, ""),
        version: (parsed.version || 1),
        passingPercentage: parsed.passingPercentage ?? draft.passingPercentage ?? 0.85,
        sections: parsed.sections,
      });
      setOpenSection(parsed.sections[0]?.id || null);
      onToast?.("Template imported. Review and Save to apply.");
    } catch (e) {
      setImportError(e.message || "Invalid JSON file.");
    }
  };

  const updateMeta = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const updateSection = (id, patch) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));

  const removeSection = (id) =>
    setDraft((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== id) }));

  const addSection = () => {
    const sec = blankSection();
    setDraft((d) => ({ ...d, sections: [...d.sections, sec] }));
    setOpenSection(sec.id);
  };

  const updateItem = (sectionId, itemId, patch) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
            }
          : s
      ),
    }));

  const removeItem = (sectionId, itemId) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((it) => it.id !== itemId) } : s
      ),
    }));

  const addItem = (sectionId) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId ? { ...s, items: [...s.items, blankItem()] } : s
      ),
    }));

  const totalPoints = draft.sections.reduce(
    (a, s) => a + s.items.reduce((b, it) => b + (getResponseType(it) === "pass_fail" ? Number(it.pts) || 0 : 0), 0),
    0
  );

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-stone-500" />
            <h1 className="font-display text-2xl font-semibold">Templates</h1>
            {isCustom ? (
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">Custom</span>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">Default</span>
            )}
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Edit your inspection rubric. New inspections will use whatever's saved here.
            Existing reports keep their original template intact.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="text-sm font-medium px-3 py-2 rounded-md border border-stone-300 hover:bg-stone-50 flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Import JSON
          </button>
          {isCustom && (
            <button
              onClick={revertToDefault}
              className="text-sm font-medium px-3 py-2 rounded-md border border-stone-300 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5"
              title="Discard your custom template and use the built-in 200-point rubric."
            >
              <RefreshCw className="w-4 h-4" /> Revert to default
            </button>
          )}
          <button
            onClick={cancel}
            disabled={!isDirty}
            className="text-sm font-medium px-3 py-2 rounded-md border border-stone-300 disabled:opacity-50 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!isDirty}
            className="text-sm font-medium px-3 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </header>

      {importError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-2 text-sm text-blue-900">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          Importing a JSON template replaces the draft. Save to apply. The expected shape:
          <code className="ml-1 font-mono text-[12px]">{`{ name, sections: [{ id, label, critical?, zeroTolerance?, items: [{ id, q, responseType, pts, unit?, options? }] }] }`}</code>
        </div>
      </div>

      <section className="bg-white border border-stone-200 rounded-xl p-4 md:p-5 space-y-3">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <FileJson className="w-4 h-4 text-stone-500" /> Template metadata
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-stone-600 uppercase tracking-wide">Name</span>
            <input
              type="text"
              value={draft.name || ""}
              onChange={(e) => updateMeta({ name: e.target.value })}
              className="w-full mt-1 text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-stone-600 uppercase tracking-wide">Passing %</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={draft.passingPercentage ?? 0.85}
              onChange={(e) => updateMeta({ passingPercentage: Number(e.target.value) })}
              className="w-full mt-1 text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400"
            />
            <span className="text-[11px] text-stone-500 mt-0.5 block">Decimal (0–1). Default 0.85 = 85%.</span>
          </label>
          <div>
            <span className="text-xs font-medium text-stone-600 uppercase tracking-wide">Total scored points</span>
            <div className="mt-1 text-sm font-mono bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-stone-700">
              {totalPoints}
            </div>
            <span className="text-[11px] text-stone-500 mt-0.5 block">Sum of pass/fail item points.</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Sections</h2>
          <button
            onClick={addSection}
            className="text-sm font-medium px-3 py-2 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add section
          </button>
        </div>

        {draft.sections.length === 0 && (
          <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-8 text-center text-sm text-stone-500">
            No sections yet. Add one or import a JSON template.
          </div>
        )}

        {draft.sections.map((sec) => {
          const open = openSection === sec.id;
          return (
            <div key={sec.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <header className="px-4 md:px-5 py-3 flex items-center gap-3 border-b border-stone-100">
                <button
                  onClick={() => setOpenSection(open ? null : sec.id)}
                  className="p-1 hover:bg-stone-100 rounded"
                  title={open ? "Collapse" : "Expand"}
                >
                  {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={sec.label}
                  onChange={(e) => updateSection(sec.id, { label: e.target.value })}
                  className="flex-1 min-w-0 text-base font-display font-semibold bg-transparent border-0 focus:outline-none focus:ring-0"
                  placeholder="Section name"
                />
                <span className="text-[11px] font-mono text-stone-400">{sec.items.length} items</span>
                {sec.zeroTolerance && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" /> ZT
                  </span>
                )}
                <button
                  onClick={() => removeSection(sec.id)}
                  title="Remove section"
                  className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </header>

              {open && (
                <div className="p-4 md:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="block">
                      <span className="text-[11px] font-medium text-stone-600 uppercase tracking-wide">Section ID</span>
                      <input
                        type="text"
                        value={sec.id}
                        onChange={(e) => updateSection(sec.id, { id: e.target.value })}
                        className="w-full mt-1 text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400 font-mono"
                      />
                    </label>
                    <label className="flex items-center gap-2 mt-5">
                      <input
                        type="checkbox"
                        checked={!!sec.critical}
                        onChange={(e) => updateSection(sec.id, { critical: e.target.checked })}
                      />
                      <span className="text-sm">Critical (any fail = whole-report fail)</span>
                    </label>
                    <label className="flex items-center gap-2 mt-5">
                      <input
                        type="checkbox"
                        checked={!!sec.zeroTolerance}
                        onChange={(e) => updateSection(sec.id, { zeroTolerance: e.target.checked })}
                      />
                      <span className="text-sm">Zero-tolerance (escalates immediately)</span>
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-[11px] font-medium text-stone-600 uppercase tracking-wide">Subtitle / instructions</span>
                    <input
                      type="text"
                      value={sec.subtitle || ""}
                      onChange={(e) => updateSection(sec.id, { subtitle: e.target.value })}
                      placeholder="Optional helper text shown to inspectors"
                      className="w-full mt-1 text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400"
                    />
                  </label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-display font-semibold text-stone-700">Questions</h3>
                      <button
                        onClick={() => addItem(sec.id)}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add question
                      </button>
                    </div>

                    {sec.items.length === 0 && (
                      <div className="text-sm text-stone-400 italic px-2 py-3">No questions yet.</div>
                    )}

                    <div className="space-y-2">
                      {sec.items.map((it) => (
                        <ItemEditor
                          key={it.id}
                          item={it}
                          onChange={(patch) => updateItem(sec.id, it.id, patch)}
                          onRemove={() => removeItem(sec.id, it.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function ItemEditor({ item, onChange, onRemove }) {
  const rt = getResponseType(item);
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-md p-3 space-y-2">
      <div className="flex items-start gap-2 flex-wrap">
        <input
          type="text"
          value={item.id}
          onChange={(e) => onChange({ id: e.target.value })}
          className="text-xs font-mono w-28 bg-white border border-stone-200 rounded px-2 py-1.5 focus:outline-none focus:border-stone-400"
          title="Item ID — must be unique within the template"
        />
        <input
          type="text"
          value={item.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Question"
          className="flex-1 min-w-[200px] text-sm bg-white border border-stone-200 rounded px-2 py-1.5 focus:outline-none focus:border-stone-400"
        />
        <select
          value={rt}
          onChange={(e) => onChange({ responseType: e.target.value })}
          className="text-xs bg-white border border-stone-200 rounded px-2 py-1.5 focus:outline-none focus:border-stone-400"
        >
          {RESPONSE_TYPES.map((t) => (
            <option key={t} value={t}>{RESPONSE_LABELS[t]}</option>
          ))}
        </select>
        <button
          onClick={onRemove}
          title="Remove question"
          className="p-1.5 hover:bg-red-50 rounded text-stone-400 hover:text-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Type-specific config */}
      {rt === "pass_fail" && (
        <div className="flex items-center gap-3 flex-wrap pl-1">
          <label className="text-xs flex items-center gap-2">
            <span className="text-stone-500 uppercase tracking-wider font-medium">Points</span>
            <input
              type="number"
              min={0}
              value={item.pts ?? 0}
              onChange={(e) => onChange({ pts: Number(e.target.value) })}
              className="w-20 text-sm font-mono bg-white border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-stone-400"
            />
          </label>
        </div>
      )}

      {rt === "number" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-1">
          <label className="text-xs">
            <span className="text-stone-500 uppercase tracking-wider font-medium">Unit</span>
            <input
              type="text"
              value={item.unit || ""}
              onChange={(e) => onChange({ unit: e.target.value })}
              placeholder="e.g. °F, psi, %"
              className="w-full mt-0.5 text-sm bg-white border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-stone-400"
            />
          </label>
          <label className="text-xs">
            <span className="text-stone-500 uppercase tracking-wider font-medium">Min (optional)</span>
            <input
              type="number"
              value={item.min ?? ""}
              onChange={(e) => onChange({ min: e.target.value === "" ? undefined : Number(e.target.value) })}
              className="w-full mt-0.5 text-sm bg-white border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-stone-400"
            />
          </label>
          <label className="text-xs">
            <span className="text-stone-500 uppercase tracking-wider font-medium">Max (optional)</span>
            <input
              type="number"
              value={item.max ?? ""}
              onChange={(e) => onChange({ max: e.target.value === "" ? undefined : Number(e.target.value) })}
              className="w-full mt-0.5 text-sm bg-white border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-stone-400"
            />
          </label>
          <label className="text-xs">
            <span className="text-stone-500 uppercase tracking-wider font-medium">Placeholder</span>
            <input
              type="text"
              value={item.placeholder || ""}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              className="w-full mt-0.5 text-sm bg-white border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-stone-400"
            />
          </label>
        </div>
      )}

      {rt === "text" && (
        <div className="pl-1">
          <label className="text-xs">
            <span className="text-stone-500 uppercase tracking-wider font-medium">Placeholder (optional)</span>
            <input
              type="text"
              value={item.placeholder || ""}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              className="w-full mt-0.5 text-sm bg-white border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-stone-400"
            />
          </label>
        </div>
      )}

      {rt === "select" && (
        <div className="pl-1">
          <label className="text-xs">
            <span className="text-stone-500 uppercase tracking-wider font-medium">Options (one per line)</span>
            <textarea
              rows={3}
              value={(item.options || []).join("\n")}
              onChange={(e) =>
                onChange({
                  options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder={"Option 1\nOption 2\nOption 3"}
              className="w-full mt-0.5 text-sm bg-white border border-stone-200 rounded px-2 py-1.5 focus:outline-none focus:border-stone-400 resize-y"
            />
          </label>
        </div>
      )}
    </div>
  );
}
