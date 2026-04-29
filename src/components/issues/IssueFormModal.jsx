import { useState } from "react";
import { X } from "lucide-react";
import Field from "../shared/Field.jsx";

const SEVERITIES = [
  { id: "critical", label: "Critical" },
  { id: "high",     label: "High" },
  { id: "medium",   label: "Medium" },
  { id: "low",      label: "Low" },
];

const STATUSES = [
  { id: "open",        label: "Open" },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved",    label: "Resolved" },
];

const CATEGORY_SUGGESTIONS = [
  "Image Essentials",
  "Service Essentials",
  "Brand Standards",
  "Customer Experience",
  "Customer Service",
  "Restrooms",
  "Equipment",
  "Tobacco",
  "Lottery",
  "Inventory",
  "Compliance & Legal",
  "Other",
];

function defaultAssignee(inspectors) {
  return (inspectors || []).find((i) => i.isDefault)?.name
    || (inspectors || [])[0]?.name
    || "";
}

export default function IssueFormModal({ sites, inspectors, onSubmit, onClose }) {
  const [form, setForm] = useState({
    siteId: sites[0]?.id || "",
    category: CATEGORY_SUGGESTIONS[0],
    item: "",
    severity: "medium",
    status: "open",
    note: "",
    assignee: defaultAssignee(inspectors),
    opened: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState({});

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const e = {};
    if (!form.siteId) e.siteId = "Required";
    if (!form.item.trim()) e.item = "Required";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit({
      ...form,
      item: form.item.trim(),
      note: form.note.trim(),
      opened: form.opened || new Date().toISOString().slice(0, 10),
    });
  };

  const inspectorList = inspectors || [];
  const inspectorNames = inspectorList.map((i) => i.name);
  const showLegacyAssignee = form.assignee && !inspectorNames.includes(form.assignee);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:bg-stone-900/40 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-full md:max-w-xl shadow-2xl md:my-8 max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-xl animate-slide-up md:animate-slide"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="md:hidden pt-3 pb-1 flex justify-center flex-shrink-0">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        <div className="px-5 md:px-6 py-4 md:py-5 border-b border-stone-200 flex items-start justify-between flex-shrink-0">
          <div>
            <h3 className="font-display text-lg md:text-xl font-semibold">New Issue</h3>
            <p className="text-xs text-stone-500 mt-0.5">Log something that needs attention</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 md:px-6 py-5 space-y-4 flex-1 overflow-y-auto">
          <Field label="Site" required error={errors.siteId}>
            <select
              value={form.siteId}
              onChange={(e) => setField("siteId", e.target.value)}
              className={`w-full text-sm border rounded-md px-3 py-2 bg-white ${errors.siteId ? "border-red-300" : "border-stone-300"}`}
            >
              <option value="">Select a site…</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="What's the issue?" required error={errors.item}>
            <input
              autoFocus
              value={form.item}
              onChange={(e) => setField("item", e.target.value)}
              placeholder="e.g., Pump 3 card reader stuck"
              className={`w-full text-sm border rounded-md px-3 py-2 ${errors.item ? "border-red-300" : "border-stone-300"}`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 bg-white"
              >
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Severity">
              <select
                value={form.severity}
                onChange={(e) => setField("severity", e.target.value)}
                className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 bg-white"
              >
                {SEVERITIES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Opened">
              <input
                type="date"
                value={form.opened}
                onChange={(e) => setField("opened", e.target.value)}
                className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 font-mono"
              />
            </Field>
          </div>

          <Field label="Assignee">
            {inspectorList.length === 0 ? (
              <input
                value={form.assignee}
                onChange={(e) => setField("assignee", e.target.value)}
                placeholder="Add inspectors in the Inspectors tab"
                className="w-full text-sm border border-stone-300 rounded-md px-3 py-2"
              />
            ) : (
              <select
                value={form.assignee}
                onChange={(e) => setField("assignee", e.target.value)}
                className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="">Unassigned</option>
                {showLegacyAssignee && (
                  <option value={form.assignee}>{form.assignee} (legacy)</option>
                )}
                {inspectorList.map((i) => (
                  <option key={i.id} value={i.name}>
                    {i.name}{i.role ? ` — ${i.role}` : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Notes">
            <textarea
              value={form.note}
              onChange={(e) => setField("note", e.target.value)}
              rows={4}
              placeholder="What's wrong, what's the plan, anything else relevant"
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 resize-none"
            />
          </Field>
        </div>

        <div className="px-5 md:px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900 text-sm px-4 py-2 rounded-md">
            Cancel
          </button>
          <button
            onClick={submit}
            className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Add issue
          </button>
        </div>
      </div>
    </div>
  );
}
