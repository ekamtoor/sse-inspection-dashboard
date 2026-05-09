"use client";

import { useMemo, useState } from "react";
import { Plus, Archive, FileText, Filter, X, Trash2, Download } from "lucide-react";

// Generic Documents module — renamed and simplified from the original
// Corporate Archive. A document is just: name, category, file, notes,
// optional location, optional dates. Tenants choose what categories they
// care about (SSE: Corporate Mystery Shop, Brand Audit, Compliance
// Inspection. QSR tenant: Health Inspection, Fire Safety, Liquor License).
//
// This view consumes the legacy `corporate` data store today so existing
// rows render alongside new ones. When migration to dedicated `documents`
// tables happens in the Hypeify Supabase project, this component switches
// data sources but keeps the same shape.

export default function DocumentsView({
  documents,
  sites,
  categories,
  onAdd,
  onDelete,
  detail,
  setDetail,
}) {
  const [siteFilter, setSiteFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    return (documents || [])
      .slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .filter((d) => {
        if (siteFilter !== "all" && d.siteId !== siteFilter) return false;
        if (categoryFilter !== "all" && (d.category || "") !== categoryFilter) return false;
        return true;
      });
  }, [documents, siteFilter, categoryFilter]);

  const filterActive = siteFilter !== "all" || categoryFilter !== "all";
  const clearFilters = () => {
    setSiteFilter("all");
    setCategoryFilter("all");
  };

  if (detail) {
    return (
      <DocumentDetail
        document={detail}
        sites={sites}
        onBack={() => setDetail(null)}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-stone-600 max-w-xl flex-1 min-w-0 hidden md:block">
          Site documents — corporate inspections, permits, audits, anything you want to keep filed by category.
        </p>
        <button
          onClick={onAdd}
          className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 ml-auto"
        >
          <Plus className="w-4 h-4" /> Upload document
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-3 md:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">Filters</span>
          {filterActive && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block mb-1">
              Site
            </label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-stone-400"
            >
              <option value="all">All sites</option>
              {sites
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-stone-400"
            >
              <option value="all">All categories</option>
              {(categories || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 md:p-12 text-center">
          <Archive className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-stone-500">
            {(documents || []).length === 0
              ? "No documents archived yet."
              : "No documents match the current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {filtered.map((d) => {
            const site = sites.find((s) => s.id === d.siteId);
            return (
              <div
                key={d.id}
                className="relative bg-white border border-stone-200 rounded-xl p-4 md:p-5 hover:shadow-sm transition-shadow group"
              >
                <button
                  onClick={() => setDetail(d)}
                  className="absolute inset-0 rounded-xl"
                  aria-label="Open document"
                />
                <div className="relative pointer-events-none">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {d.category && (
                          <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                            {d.category}
                          </span>
                        )}
                        {d.date && (
                          <span className="font-mono text-[10px] text-stone-500">{d.date}</span>
                        )}
                        {d.pdf?.url && (
                          <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded flex items-center gap-1">
                            <FileText className="w-3 h-3" /> File
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-base md:text-lg font-semibold leading-tight truncate">
                        {d.name || d.id}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5 truncate">
                        {site?.name || (d.siteId ? "(site removed)" : "All locations")}
                      </p>
                    </div>
                  </div>
                  {d.notes && (
                    <p className="text-xs text-stone-600 line-clamp-2 leading-snug pt-2 border-t border-stone-100">
                      {d.notes}
                    </p>
                  )}
                </div>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(d);
                    }}
                    className="absolute bottom-3 right-3 p-2 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 z-10"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DocumentDetail({ document, sites, onBack, onDelete }) {
  const site = sites.find((s) => s.id === document.siteId);
  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="text-xs font-medium text-stone-600 hover:text-stone-900"
        >
          ← Back to documents
        </button>
        <div className="flex items-center gap-2">
          {document.pdf?.url && (
            <a
              href={document.pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-2 rounded-md bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> View file
            </a>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(document)}
              className="text-xs font-medium px-2 md:px-3 py-2 rounded-md border border-stone-300 text-stone-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {document.category && (
            <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
              {document.category}
            </span>
          )}
          {document.date && (
            <span className="font-mono text-xs text-stone-500">{document.date}</span>
          )}
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold">{document.name || document.id}</h2>
        <p className="text-sm text-stone-500 mt-1">
          {site?.name || (document.siteId ? "(site removed)" : "All locations")}
          {site?.city ? ` · ${site.city}` : ""}
        </p>

        {document.notes && (
          <div className="mt-5 pt-5 border-t border-stone-100">
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">Notes</div>
            <p className="text-sm text-stone-700 whitespace-pre-wrap">{document.notes}</p>
          </div>
        )}

        {document.pdf?.url && (
          <div className="mt-5 pt-5 border-t border-stone-100">
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">File</div>
            <a
              href={document.pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 hover:underline"
            >
              <FileText className="w-4 h-4" />
              {document.pdf.name || "Download"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
