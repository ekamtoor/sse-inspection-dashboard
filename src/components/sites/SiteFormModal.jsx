import { useState } from "react";
import { X } from "lucide-react";
import Field from "../shared/Field.jsx";

export default function SiteFormModal({ site, onSubmit, onClose }) {
  const [form, setForm] = useState(() =>
    site
      ? { ...site }
      : {
          id: "", name: "", address: "", city: "", zip: "", brand: "Shell", pumps: 8,
          status: "good", nextDue: "", notes: "",
          operator: { name: "Anil Patel", email: "anil@sevenstar.energy", phone: "937-555-0142" },
          manager: { name: "", email: "", phone: "" },
        }
  );
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name) e.name = "Required";
    if (!form.address) e.address = "Required";
    if (!form.city) e.city = "Required";
    if (!form.brand) e.brand = "Required";
    if (!form.pumps || form.pumps < 1) e.pumps = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => { if (validate()) onSubmit(form); };
  const setField = (k, v) => setForm({ ...form, [k]: v });
  const setNested = (parent, k, v) => setForm({ ...form, [parent]: { ...form[parent], [k]: v } });

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
            <h3 className="font-display text-lg md:text-xl font-semibold">{site ? "Edit Site" : "Add Site"}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{site ? `Update details for ${site.name}` : "New location to track"}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 md:px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-3">Location</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Field label="Site name" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={`w-full bg-stone-50 border rounded-md px-3 py-2 text-sm ${errors.name ? "border-red-300" : "border-stone-200"}`}
                />
              </Field>
              <Field label="Site ID (optional)">
                <input
                  value={form.id}
                  onChange={(e) => setField("id", e.target.value)}
                  placeholder="auto-generated if blank"
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono"
                />
              </Field>
              <Field label="Street address" required error={errors.address}>
                <input
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className={`w-full bg-stone-50 border rounded-md px-3 py-2 text-sm ${errors.address ? "border-red-300" : "border-stone-200"}`}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="City, State" required error={errors.city}>
                  <input
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="Dayton, OH"
                    className={`w-full bg-stone-50 border rounded-md px-3 py-2 text-sm ${errors.city ? "border-red-300" : "border-stone-200"}`}
                  />
                </Field>
                <Field label="ZIP">
                  <input
                    value={form.zip}
                    onChange={(e) => setField("zip", e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono"
                  />
                </Field>
              </div>
              <Field label="Brand" required error={errors.brand}>
                <select
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  className={`w-full bg-stone-50 border rounded-md px-3 py-2 text-sm ${errors.brand ? "border-red-300" : "border-stone-200"}`}
                >
                  <option value="Shell">Shell</option>
                  <option value="Marathon">Marathon</option>
                  <option value="ARCO">ARCO</option>
                  <option value="Marathon/ARCO">Marathon/ARCO</option>
                </select>
              </Field>
              <Field label="Pumps" required error={errors.pumps}>
                <input
                  type="number"
                  min="1"
                  value={form.pumps}
                  onChange={(e) => setField("pumps", parseInt(e.target.value) || "")}
                  className={`w-full bg-stone-50 border rounded-md px-3 py-2 text-sm font-mono ${errors.pumps ? "border-red-300" : "border-stone-200"}`}
                />
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="good">Performing</option>
                  <option value="needs-attention">Watch</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
              <Field label="Next corporate due">
                <input
                  type="date"
                  value={form.nextDue}
                  onChange={(e) => setField("nextDue", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono"
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={2}
                  placeholder="Anything operators should know about this site"
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm resize-none"
                />
              </Field>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-3">Operator</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Name">
                <input value={form.operator.name} onChange={(e) => setNested("operator", "name", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.operator.email} onChange={(e) => setNested("operator", "email", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm" />
              </Field>
              <Field label="Phone">
                <input value={form.operator.phone} onChange={(e) => setNested("operator", "phone", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono" />
              </Field>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-3">Site Manager</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Name">
                <input value={form.manager.name} onChange={(e) => setNested("manager", "name", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.manager.email} onChange={(e) => setNested("manager", "email", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm" />
              </Field>
              <Field label="Phone">
                <input value={form.manager.phone} onChange={(e) => setNested("manager", "phone", e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono" />
              </Field>
            </div>
          </div>
        </div>

        <div className="px-5 md:px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900 text-sm px-4 py-2 rounded-md">Cancel</button>
          <button onClick={submit} className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-md">
            {site ? "Save changes" : "Add site"}
          </button>
        </div>
      </div>
    </div>
  );
}
