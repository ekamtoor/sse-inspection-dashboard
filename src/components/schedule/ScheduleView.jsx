import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Field from "../shared/Field.jsx";

export default function ScheduleView({
  sites, scheduled, addScheduled, startInspection, startInternal, onDelete,
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    siteId: sites[0]?.id || "",
    date: new Date().toISOString().slice(0, 10),
    time: "08:00",
    inspector: "M. Reyes",
    type: "Full Audit",
    kind: "preinspect",
  });

  const submit = (start) => {
    if (!form.siteId || !form.date) return;
    const e = addScheduled(form);
    setShowForm(false);
    if (start) form.kind === "internal" ? startInternal(form.siteId) : startInspection(form.siteId, e.id);
  };

  const sorted = scheduled.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-stone-600 max-w-xl flex-1 min-w-0 hidden md:block">
          Book pre-inspections internally — typically <span className="italic font-display">7–10 days</span> before a corporate window.
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 ml-auto"
        >
          <Plus className="w-4 h-4" /> Schedule new
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 md:p-6">
          <h3 className="font-display text-lg font-semibold mb-4">New Inspection</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <Field label="Audit kind">
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm">
                <option value="preinspect">Pre-Inspection (Mystery Shop simulation)</option>
                <option value="internal">Internal Ops (Owner walkthrough)</option>
              </select>
            </Field>
            <Field label="Site">
              <select value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm">
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm">
                {form.kind === "preinspect" ? (
                  <>
                    <option>Full Audit</option><option>Image Essentials Only</option><option>Pump Sweep</option>
                    <option>Pre-Corporate</option><option>Brand Standards</option>
                  </>
                ) : (
                  <>
                    <option>Daily Ops</option><option>Weekly Walk</option><option>Tobacco Audit</option>
                    <option>Cooler / Freezer Check</option><option>Cash Reconciliation</option>
                  </>
                )}
              </select>
            </Field>
            <Field label="Inspector">
              <select value={form.inspector} onChange={(e) => setForm({ ...form, inspector: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm">
                <option>M. Reyes</option><option>T. Brennan</option><option>L. Park</option>
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono" />
            </Field>
            <Field label="Time">
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm font-mono" />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button onClick={() => submit(true)} className="bg-amber-400 hover:bg-amber-300 text-stone-900 font-medium text-sm px-4 py-2 rounded-md">
              Schedule & start now
            </button>
            <button onClick={() => submit(false)} className="border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm px-4 py-2 rounded-md">
              Save for later
            </button>
            <button onClick={() => setShowForm(false)} className="text-stone-500 hover:text-stone-900 text-sm px-4 py-2 rounded-md ml-auto">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr className="text-left">
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">When</th>
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">Site</th>
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">Kind</th>
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">Type</th>
              <th className="text-[10px] font-medium uppercase tracking-wider text-stone-500 px-6 py-3">Inspector</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sorted.map((s) => {
              const site = sites.find((x) => x.id === s.siteId);
              const dt = new Date(s.date + "T00:00:00");
              return (
                <tr key={s.id} className="hover:bg-stone-50 group">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs">
                      {dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {s.time}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{site?.name}</div>
                    <div className="text-xs text-stone-500">{site?.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded ${s.kind === "internal" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                      {s.kind === "internal" ? "Ops" : "Pre-insp"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-1 bg-stone-100 rounded">{s.type}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-700">{s.inspector}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onDelete(s.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => (s.kind === "internal" ? startInternal(s.siteId) : startInspection(s.siteId, s.id))}
                        className="text-xs font-medium text-stone-900 hover:underline"
                      >
                        Start →
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-stone-500">Nothing scheduled.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {sorted.map((s) => {
          const site = sites.find((x) => x.id === s.siteId);
          const dt = new Date(s.date + "T00:00:00");
          return (
            <div key={s.id} className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 text-center flex-shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">
                      {dt.toLocaleDateString("en-US", { month: "short" })}
                    </div>
                    <div className="font-display text-xl font-semibold leading-tight">{dt.getDate()}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{site?.name}</div>
                    <div className="text-xs text-stone-500 truncate">{site?.city} · {s.time}</div>
                  </div>
                </div>
                <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded flex-shrink-0 ${s.kind === "internal" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                  {s.kind === "internal" ? "Ops" : "Pre-insp"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
                <div className="text-xs text-stone-500 truncate min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-stone-100 rounded mr-1.5">{s.type}</span>
                  {s.inspector}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => onDelete(s.id)} className="p-2 hover:bg-red-100 rounded text-stone-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => (s.kind === "internal" ? startInternal(s.siteId) : startInspection(s.siteId, s.id))}
                    className="bg-stone-900 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-stone-500">Nothing scheduled.</div>
        )}
      </div>
    </div>
  );
}
