export default function PriorityPill({ priority }) {
  const map = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high:     "bg-amber-50 text-amber-700 border-amber-200",
    medium:   "bg-stone-50 text-stone-700 border-stone-200",
    low:      "bg-stone-50 text-stone-500 border-stone-200",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded border ${map[priority]} whitespace-nowrap`}>
      {priority}
    </span>
  );
}
