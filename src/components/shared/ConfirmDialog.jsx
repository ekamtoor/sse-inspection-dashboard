import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ title, message, onConfirm, onClose, confirmLabel = "Delete" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-slide" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="text-sm text-stone-600 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-5 md:px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900 text-sm px-4 py-2 rounded-md">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
