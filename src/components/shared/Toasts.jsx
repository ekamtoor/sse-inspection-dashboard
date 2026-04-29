import { CheckCircle2 } from "lucide-react";

export default function Toasts({ toasts }) {
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-slide bg-stone-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {t.msg}
        </div>
      ))}
    </div>
  );
}
