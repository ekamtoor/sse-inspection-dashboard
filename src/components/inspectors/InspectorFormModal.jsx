import { useState } from "react";
import { X } from "lucide-react";
import Field from "../shared/Field.jsx";

const ROLE_OPTIONS = [
  "District Ops",
  "Field Inspector",
  "Operator",
  "Store Manager",
  "Compliance",
  "Other",
];

export default function InspectorFormModal({ inspector, onSubmit, onClose }) {
  const [form, setForm] = useState(() =>
    inspector
      ? { ...inspector }
      : { id: "", name: "", email: "", role: "District Ops", isDefault: false }
  );
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      name: form.name.trim(),
      email: form.email?.trim() || "",
      role: form.role || "Other",
    });
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:bg-stone-900/40 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-full md:max-w-md shadow-2xl md:my-8 max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-xl animate-slide-up md:animate-slide"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="md:hidden pt-3 pb-1 flex justify-center flex-shrink-0">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>
        <div className="px-5 md:px-6 py-4 md:py-5 border-b border-stone-200 flex items-start justify-between flex-shrink-0">
          <div>
            <h3 className="font-display text-lg md:text-xl font-semibold">
              {inspector ? "Edit Inspector" : "Add Inspector"}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {inspector ? `Update ${inspector.name}` : "Person who runs walks and signs reports"}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 md:px-6 py-5 space-y-4 flex-1 overflow-y-auto">
          <Field label="Name" required error={errors.name}>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Marcus Reyes"
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email || ""}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="m.reyes@sevenstar.energy"
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400"
            />
          </Field>

          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-stone-400"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.isDefault}
              onChange={(e) => setField("isDefault", e.target.checked)}
              className="w-4 h-4 accent-stone-900"
            />
            <span className="text-sm text-stone-700">
              Use as default inspector for new reports
            </span>
          </label>
        </div>

        <div className="px-5 md:px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900 text-sm px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {inspector ? "Save" : "Add inspector"}
          </button>
        </div>
      </div>
    </div>
  );
}
