import { useState } from "react";
import { Plus, Store } from "lucide-react";
import SiteCard from "./SiteCard.jsx";

export default function SitesView({ sites, startInspection, startInternal, onAdd, onEdit, onDelete, onView }) {
  const [filter, setFilter] = useState("all");
  const [brand, setBrand] = useState("all");

  const filtered = sites.filter(
    (s) =>
      (filter === "all" || s.status === filter) &&
      (brand === "all" || s.brand.toLowerCase().includes(brand))
  );

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          {[
            { id: "all",              label: "All" },
            { id: "good",             label: "Performing" },
            { id: "needs-attention",  label: "Watch" },
            { id: "critical",         label: "Critical" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                filter === f.id
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-0.5 text-stone-300">|</span>
          {["all", "shell", "marathon"].map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                brand === b
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
              }`}
            >
              {b === "all" ? "All Brands" : b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={onAdd}
          className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 ml-auto"
        >
          <Plus className="w-4 h-4" /> Add Site
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {filtered.map((s) => (
          <SiteCard
            key={s.id}
            site={s}
            onStartInspection={() => startInspection(s.id)}
            onStartInternal={() => startInternal(s.id)}
            onEdit={() => onEdit(s)}
            onDelete={() => onDelete(s)}
            onView={() => onView(s)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full bg-white border border-stone-200 rounded-xl p-12 text-center">
            <Store className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500">No sites match.</p>
          </div>
        )}
      </div>
    </div>
  );
}
