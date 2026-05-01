import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Mail, Trash2, Send, Paperclip, Loader2, FileText, Download,
} from "lucide-react";
import SeverityDot from "../shared/SeverityDot.jsx";
import StatusPill from "../shared/StatusPill.jsx";
import { uploadFile, deleteFile } from "../../lib/photos.js";

const STATUSES = [
  { id: "open",        label: "Open" },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved",    label: "Resolved" },
];

function eventId() {
  return `EV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Promote the legacy `note` field to a synthetic "note" event so historical
// context renders in the timeline alongside any new activity entries. We keep
// synthesizing it (rather than inlining once) so the original creation note
// stays visible after subsequent edits.
function buildTimeline(issue) {
  const events = Array.isArray(issue.activity) ? [...issue.activity] : [];
  if (issue.note) {
    const alreadyHasIt = events.some((e) => e.type === "note" && e.text === issue.note);
    if (!alreadyHasIt) {
      events.push({
        id: `EV-legacy-${issue.id}`,
        type: "note",
        at: issue.opened ? new Date(issue.opened).toISOString() : new Date(0).toISOString(),
        actor: issue.assignee || "—",
        text: issue.note,
      });
    }
  }
  events.sort((a, b) => (a.at || "").localeCompare(b.at || ""));
  return events;
}

function isImage(att) {
  return (att?.contentType || "").startsWith("image/")
    || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(att?.name || "");
}

export default function IssueDetailModal({ issue, sites, user, inspectorName, onUpdate, onDelete, onClose }) {
  // Mirror the prop in local state so button clicks paint instantly even
  // before the parent's setIssues / re-render cycle finishes. The effect
  // below syncs the prop back in if anything else updates the issue.
  const [localIssue, setLocalIssue] = useState(issue);
  useEffect(() => {
    setLocalIssue(issue);
  }, [issue]);
  const view = localIssue;
  const site = sites.find((s) => s.id === view.siteId);
  const [draftNote, setDraftNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileRef = useRef();

  // Always read from the latest issue snapshot so the timeline updates after
  // each parent-side update.
  const timeline = useMemo(() => buildTimeline(view), [view]);
  const actor = inspectorName || view.assignee || user?.email || "Inspector";

  useEffect(() => {
    setDraftNote("");
    setErrorMsg(null);
  }, [view.id]);

  const appendEvent = (event) => {
    const next = {
      ...view,
      activity: [...(view.activity || []), event],
    };
    setLocalIssue(next);
    onUpdate(next);
  };

  const submitNote = async (e) => {
    e?.preventDefault?.();
    const text = draftNote.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    appendEvent({
      id: eventId(),
      type: "note",
      at: new Date().toISOString(),
      actor,
      text,
    });
    setDraftNote("");
    setSubmitting(false);
  };

  const handleStatusChange = (next) => {
    if (view.status === next) return;
    const event = {
      id: eventId(),
      type: "status_change",
      at: new Date().toISOString(),
      actor,
      fromStatus: view.status,
      toStatus: next,
      text: `Status changed from ${view.status || "—"} to ${next}.`,
    };
    const updated = {
      ...view,
      status: next,
      activity: [...(view.activity || []), event],
    };
    setLocalIssue(updated);
    onUpdate(updated);
  };

  const handleFile = async (file) => {
    if (!file || !user) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const result = await uploadFile(user.id, `issues/${view.id}`, file);
      const event = {
        id: eventId(),
        type: "attachment",
        at: new Date().toISOString(),
        actor,
        text: file.name,
        attachment: {
          url: result.url,
          path: result.path,
          name: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        },
      };
      appendEvent(event);
    } catch (err) {
      console.error("Attachment upload failed:", err);
      setErrorMsg(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (ev) => {
    if (ev.attachment?.path) deleteFile(ev.attachment.path);
    const updated = {
      ...view,
      activity: (view.activity || []).filter((e) => e.id !== ev.id),
    };
    setLocalIssue(updated);
    onUpdate(updated);
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
            <SeverityDot severity={view.severity} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{view.id}</span>
                <span className="text-[10px] uppercase tracking-wider text-stone-500">·</span>
                <span className="text-[10px] uppercase tracking-wider text-stone-500 truncate">{view.category}</span>
              </div>
              <h3 className="font-display text-base md:text-lg font-semibold mt-1">{view.item}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 md:px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Site</div>
              <div className="text-sm font-medium mt-1">{site?.name || <span className="italic text-stone-400">site removed</span>}</div>
              <div className="text-xs text-stone-500">{site?.city}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Opened</div>
              <div className="text-sm font-mono mt-1">{view.opened || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Severity</div>
              <div className="text-sm font-medium mt-1 capitalize flex items-center gap-2">
                <SeverityDot severity={view.severity} /> {view.severity}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Assignee</div>
              <div className="text-sm font-medium mt-1">{view.assignee || "—"}</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Status</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStatusChange(s.id)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                    view.status === s.id
                      ? "bg-stone-900 text-white"
                      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <span className="ml-auto"><StatusPill status={view.status} /></span>
            </div>
            <p className="text-[11px] text-stone-500 mt-2">
              Changing status logs the transition to the activity timeline below.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Activity</div>
              <span className="text-[10px] font-mono text-stone-400">{timeline.length} entr{timeline.length === 1 ? "y" : "ies"}</span>
            </div>
            {timeline.length === 0 ? (
              <div className="text-xs text-stone-500 italic px-3 py-3 bg-stone-50 rounded-md">
                No activity yet — add a note below to start the log.
              </div>
            ) : (
              <ol className="space-y-2.5">
                {timeline.map((ev) => (
                  <li
                    key={ev.id}
                    className={`rounded-md border p-3 ${
                      ev.type === "note"
                        ? "border-stone-200 bg-stone-50"
                        : ev.type === "status_change"
                          ? "border-amber-200 bg-amber-50/40"
                          : ev.type === "attachment"
                            ? "border-blue-200 bg-blue-50/40"
                            : "border-stone-200 bg-white"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2 flex-wrap text-[10px] uppercase tracking-wider text-stone-500">
                      <span className="font-mono font-medium text-stone-600">
                        {ev.type === "status_change"
                          ? "Status"
                          : ev.type === "attachment"
                            ? "Attachment"
                            : ev.type === "created"
                              ? "Created"
                              : "Note"}
                        {" · "}
                        <span className="text-stone-500 normal-case font-display italic">{ev.actor || "—"}</span>
                      </span>
                      <span className="font-mono text-stone-400 normal-case">{fmtTime(ev.at)}</span>
                    </div>

                    {ev.type === "status_change" && (
                      <div className="text-sm mt-1.5 flex items-center gap-2 flex-wrap">
                        <StatusPill status={ev.fromStatus} />
                        <span className="text-stone-400">→</span>
                        <StatusPill status={ev.toStatus} />
                      </div>
                    )}

                    {ev.text && ev.type !== "status_change" && ev.type !== "attachment" && (
                      <p className="text-sm text-stone-800 mt-1.5 leading-relaxed whitespace-pre-wrap">{ev.text}</p>
                    )}

                    {ev.type === "attachment" && ev.attachment && (
                      <div className="mt-2 flex items-center gap-3">
                        {isImage(ev.attachment) ? (
                          <a
                            href={ev.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-16 h-16 rounded-md bg-stone-100 border border-stone-200 overflow-hidden hover:border-stone-400"
                          >
                            <img src={ev.attachment.url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ) : (
                          <div className="w-10 h-12 bg-stone-200 rounded-sm flex items-center justify-center text-stone-600 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <a
                            href={ev.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-stone-800 hover:underline truncate block"
                          >
                            {ev.attachment.name}
                          </a>
                          {ev.attachment.size && (
                            <div className="text-[11px] text-stone-500 mt-0.5">
                              {(ev.attachment.size / 1024).toFixed(0)} KB
                            </div>
                          )}
                        </div>
                        <a
                          href={ev.attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={ev.attachment.name}
                          className="p-2 hover:bg-stone-100 rounded-md text-stone-500"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => removeAttachment(ev)}
                          className="p-2 hover:bg-red-50 rounded-md text-stone-400 hover:text-red-600"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <form onSubmit={submitNote} className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Add a note</div>
            <textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              rows={3}
              placeholder="What happened, what's the plan, anything to log?"
              className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-stone-400"
            />
            {errorMsg && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {errorMsg}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || !user}
                className="text-xs font-medium px-3 py-2 rounded-md border border-stone-300 hover:bg-stone-50 text-stone-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Paperclip className="w-3.5 h-3.5" /> Attach file
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={!draftNote.trim() || submitting}
                className="ml-auto bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-medium px-3 py-2 rounded-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Post note
              </button>
            </div>
          </form>

          {site?.manager?.email && (
            <a
              href={`mailto:${site.manager.email}?subject=${encodeURIComponent(`[${view.id}] ${view.item}`)}&body=${encodeURIComponent(timeline.filter((e) => e.type === "note").map((e) => e.text).join("\n\n"))}`}
              className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-50 px-3 py-2 rounded-md"
            >
              <Mail className="w-3.5 h-3.5" /> Email manager
            </a>
          )}
        </div>

        <div className="px-5 md:px-6 py-4 border-t border-stone-200 flex items-center justify-between gap-2 flex-shrink-0">
          {onDelete ? (
            <button
              onClick={() => onDelete(view)}
              className="text-xs font-medium px-2 md:px-3 py-2 rounded-md border border-stone-300 text-stone-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Delete</span>
            </button>
          ) : <span />}
          <div>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-900 text-sm px-4 py-2 rounded-md">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
