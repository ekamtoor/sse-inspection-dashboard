export default function StatusPill({ status }) {
  const map = {
    open:          "bg-red-50 text-red-700 border-red-200",
    "in-progress": "bg-amber-50 text-amber-700 border-amber-200",
    resolved:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const label = status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded border ${map[status]} whitespace-nowrap`}>
      {label}
    </span>
  );
}
