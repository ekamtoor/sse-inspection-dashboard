"use client";

import { useRef, useState } from "react";
import { X, Plus, Trash2, FileText, Loader2, Upload } from "lucide-react";
import Field from "../shared/Field.jsx";
import { uploadFile, deleteFile } from "../../lib/photos.js";

// Generic Documents form. Replaces CorporateForm. Captures:
//   - name (required)
//   - category (existing or "+ New category" inline)
//   - file (any type — PDF, image, doc, csv)
//   - location (optional, "All locations" if empty)
//   - issue date (optional)
//   - notes (free-text)
//
// Categories are tenant-defined. The form lets the user add a new category
// inline; the parent decides whether to persist that to tenant_config so it
// shows up in the dropdown for next time.

export default function DocumentForm({
  sites,
  categories,
  onSubmit,
  onClose,
  onAddCategory,
  user,
}) {
  const docIdRef = useRef(`DOC-${Date.now()}`);
  const fileRef = useRef();
  const [form, setForm] = useState({
    siteId: "",
    name: "",
    category: categories?.[0] || "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    pdf: null,
  });
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadError, setUploadError] = useState(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryDraft, setNewCategoryDraft] = useState("");
  const [errors, setErrors] = useState({});

  const handleFile = async (file) => {
    if (!file || !user) return;
    setUploadStatus("uploading");
    setUploadError(null);
    try {
      const result = await uploadFile(user.id, `documents/${docIdRef.current}`, file);
      setForm((f) => ({
        ...f,
        pdf: { url: result.url, path: result.path, name: file.name, contentType: file.type, size: file.size },
        name: f.name || file.name.replace(/\.[^.]+$/, ""),
      }));
      setUploadStatus("idle");
    } catch (err) {
      console.error("Document upload failed:", err);
      setUploadError(err?.message || "Upload failed");
      setUploadStatus("idle");
    }
  };

  const removeFile = () => {
    if (form.pdf?.path) deleteFile(form.pdf.path);
    setForm((f) => ({ ...f, pdf: null }));
  };

  const commitNewCategory = () => {
    const v = newCategoryDraft.trim();
    if (!v) return;
    if (onAddCategory) onAddCategory(v);
    setForm((f) => ({ ...f, category: v }));
    setNewCategoryDraft("");
    setShowNewCategory(false);
  };

  const submit = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Required";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (uploadStatus !== "idle") return;
    onSubmit({
      id: docIdRef.current,
      name: form.name.trim(),
      category: form.category || "Other",
      siteId: form.siteId || null,
      date: form.date,
      notes: form.notes,
      pdf: form.pdf,
    });
  };

  const cancelAndClose = () => {
    if (form.pdf?.path) deleteFile(form.pdf.path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:bg-stone-900/40 md:p-4"
      onClick={cancelAndClose}
    >
      <div
        className="bg-white w-full max-w-full md:max-w-xl shadow-2xl md:my-8 max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-xl animate-slide-up md:animate-slide"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="md:hidden pt-3 pb-1 flex justify-center flex-shrink-0">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        <div className="px-5 md:px-6 py-4 md:py-5 border-b border-stone-200 flex items-start justify-between flex-shrink-0">
          <div>
            <h3 className="font-display text-lg md:text-xl font-semibold">Upload Document</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Filed under a category, optionally tied to a location
            </p>
          </div>
          <button onClick={cancelAndClose} className="p-1 hover:bg-stone-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 md:px-6 py-5 space-y-4 flex-1 overflow-y-auto">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-3">
              File
            </div>
            {form.pdf ? (
              <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-md px-3 py-3">
                <div className="w-9 h-9 bg-stone-900 rounded-md flex items-center justify-center text-white flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{form.pdf.name}</div>
                  <a
                    href={form.pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-stone-500 hover:text-stone-900 underline"
                  >
                    Open uploaded file
                  </a>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md flex-shrink-0"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadStatus === "uploading" || !user}
                className="w-full border-2 border-dashed border-stone-300 hover:border-stone-500 hover:bg-stone-50 rounded-md px-4 py-6 flex flex-col items-center justify-center gap-2 text-stone-500 disabled:opacity-50"
              >
                {uploadStatus === "uploading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs">Uploading…</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-medium text-stone-700">Upload file</span>
                    <span className="text-[11px] text-stone-500">
                      PDF, image, doc, csv — anything
                    </span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            {uploadError && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {uploadError}
              </div>
            )}
          </div>

          <Field label="Name" required error={errors.name}>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Q1 2026 Mystery Shop"
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:border-stone-400"
            />
          </Field>

          <Field label="Category">
            {showNewCategory ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newCategoryDraft}
                  onChange={(e) => setNewCategoryDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitNewCategory()}
                  placeholder="New category name"
                  className="flex-1 text-sm border border-stone-300 rounded-md px-3 py-2"
                />
                <button
                  type="button"
                  onClick={commitNewCategory}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-xs px-3 py-2 rounded-md"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewCategory(false); setNewCategoryDraft(""); }}
                  className="text-stone-500 text-xs px-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex-1 text-sm border border-stone-300 rounded-md px-3 py-2 bg-white"
                >
                  {(categories || []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="text-xs font-medium text-stone-600 hover:text-stone-900 px-2 py-2 border border-stone-200 rounded-md flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>
            )}
          </Field>

          <Field label="Site (optional)">
            <select
              value={form.siteId}
              onChange={(e) => setForm({ ...form, siteId: e.target.value })}
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="">All locations</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Issue date">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 font-mono"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              placeholder="Anything worth recording about this document"
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 resize-none"
            />
          </Field>
        </div>

        <div className="px-5 md:px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={cancelAndClose}
            className="text-stone-500 hover:text-stone-900 text-sm px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={uploadStatus === "uploading"}
            className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Archive document
          </button>
        </div>
      </div>
    </div>
  );
}
