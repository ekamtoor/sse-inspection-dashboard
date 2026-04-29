import { useState } from "react";
import { X, Mail } from "lucide-react";
import SeverityDot from "../shared/SeverityDot.jsx";
import StatusPill from "../shared/StatusPill.jsx";

export default function IssueDetailModal({ issue, sites, onUpdate, onClose }) {
  const [note, setNote] = useState(issue.note || "");
  const [status, setStatus] = useState(issue.status);
  const site = sites.find((s) => s.id === issue.siteId);

  const save = () => {
    onUpdate({ ...issue, note, status });
    onClose();
  };

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
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <SeverityDot severity={issue.severity} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{issue.id}</span>
                <span className="text-[10px] uppercase tracking-wider text-stone-500">·</span>
                <span className="text-[10px] uppercase tracking-wider text-stone-500 truncate">{issue.category}</span>
              </div>
              <h3 className="font-display text-base md:text-lg font-semibold mt-1">{issue.item}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 md:px-6 py-5 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Site</div>
              <div className="text-sm font-medium mt-1">{site?.name}</div>
              <div className="text-xs text-stone-500">{site?.city}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Opened</div>
              <div className="text-sm font-mono mt-1">{issue.opened}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Severity</div>
              <div className="text-sm font-medium mt-1 capitalize flex items-center gap-2">
                <SeverityDot severity={issue.severity} /> {issue.severity}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Assignee</div>
              <div className="text-sm font-medium mt-1">{issue.assignee}</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Status</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["open", "in-progress", "resolved"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                    status === s
                      ? "bg-stone-900 text-white"
                      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <span className="ml-auto"><StatusPill status={status} /></span>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Notes</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm resize-none"
            />
          </div>

          {site?.manager?.email && (
            <a
              href={`mailto:${site.manager.email}?subject=${encodeURIComponent(`[${issue.id}] ${issue.item}`)}&body=${encodeURIComponent(note)}`}
              className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-50 px-3 py-2 rounded-md"
            >
              <Mail className="w-3.5 h-3.5" /> Email manager
            </a>
          )}
        </div>

        <div className="px-5 md:px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900 text-sm px-4 py-2 rounded-md">Cancel</button>
          <button onClick={save} className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-md">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
