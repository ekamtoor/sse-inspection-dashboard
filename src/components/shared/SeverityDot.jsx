export default function SeverityDot({ severity }) {
  const c =
    severity === "critical" ? "bg-red-500" :
    severity === "high"     ? "bg-amber-500" :
    severity === "medium"   ? "bg-stone-400" :
                              "bg-stone-300";
  return <span className={`w-2 h-2 rounded-full ${c} flex-shrink-0`} />;
}
