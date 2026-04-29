export default function StatCard({ label, value, unit, delta, icon: Icon, deltaPositive, deltaNegative }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 md:p-5">
      <div className="flex items-start justify-between">
        <div className="text-[10px] md:text-xs text-stone-500 uppercase tracking-wider font-medium">{label}</div>
        <div className="w-7 h-7 bg-stone-100 rounded-md flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-stone-600" />
        </div>
      </div>
      <div className="mt-2 md:mt-3 flex items-baseline gap-1">
        <span className="font-mono text-2xl md:text-3xl font-semibold tracking-tight">{value}</span>
        {unit && <span className="font-mono text-sm md:text-base text-stone-400">{unit}</span>}
      </div>
      <div
        className={`mt-1 text-[11px] md:text-xs font-medium ${
          deltaPositive ? "text-emerald-700" : deltaNegative ? "text-red-600" : "text-stone-500"
        }`}
      >
        {delta}
      </div>
    </div>
  );
}
