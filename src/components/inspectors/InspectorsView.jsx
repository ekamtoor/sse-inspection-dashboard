import { Plus, Pencil, Trash2, Star, Mail, UserCircle2 } from "lucide-react";

export default function InspectorsView({ inspectors, onAdd, onEdit, onDelete, onMakeDefault }) {
  const list = inspectors || [];
  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Inspectors</h1>
          <p className="text-xs md:text-sm text-stone-500 mt-1">
            People who run inspections. Their name appears on every report they sign.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-3 md:px-4 py-2 rounded-md flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> <span className="hidden md:inline">Add inspector</span><span className="md:hidden">Add</span>
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 md:p-12 text-center">
          <UserCircle2 className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold">No inspectors yet</h3>
          <p className="text-sm text-stone-500 mt-2">
            Add the first one — they'll be the default on new reports.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
          {list.map((p) => (
            <div
              key={p.id}
              className="px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-stone-900 flex items-center justify-center font-mono text-xs font-semibold flex-shrink-0">
                {(p.name || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{p.name}</span>
                  {p.isDefault && (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                      <Star className="w-3 h-3" fill="currentColor" /> Default
                    </span>
                  )}
                  {p.role && (
                    <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">
                      {p.role}
                    </span>
                  )}
                </div>
                {p.email && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] md:text-xs text-stone-500">
                    <Mail className="w-3 h-3" /> <span className="truncate">{p.email}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!p.isDefault && (
                  <button
                    onClick={() => onMakeDefault(p)}
                    title="Make default"
                    className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-md"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(p)}
                  title="Edit"
                  className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(p)}
                  title="Remove"
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
