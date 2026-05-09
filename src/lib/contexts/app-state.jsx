"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../supabase/client.js";
import {
  DataProvider,
  useDataContext,
  useUserDataKey,
} from "../../hooks/useUserData.jsx";
import { SCHEMA, resolveActiveTemplate, isScored } from "../../data/schema.js";
import { computeScore } from "../scoring.js";
import { deletePhoto } from "../photos.js";

// =====================================================================
// AppStateProvider
// =====================================================================
// Single client-side provider that holds *everything* the app shell used
// to manage in App.jsx: data hooks (sites, scheduled, issues, reports,
// corporate, inspectors, activeInspection, customTemplate), UI state
// (modals, toasts, confirm dialog, mobile more-sheet), and every CRUD
// handler.
//
// Pages and chrome components consume slices via useAppState(). This is
// deliberately one big context — fine-grained context-splitting can come
// later, but it would slow down the Next.js port and add no functional
// improvement for SSE today.
//
// Hypeify Claude Code: tenant-aware data should land here. The provider
// already takes a `user` prop; add a `tenant` prop and route reads/writes
// through tenant-scoped tables. Templates should ultimately come from
// `inspection_templates` rows, not from a per-user JSON blob.
// =====================================================================

const AppStateContext = createContext(null);

function FullScreenLoader({ label }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="flex items-center gap-3 text-stone-500 text-sm">
        <span className="w-4 h-4 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
        {label || "Loading…"}
      </div>
    </div>
  );
}

export function AppStateProvider({ user, children }) {
  return (
    <DataProvider user={user}>
      <Inner user={user}>{children}</Inner>
    </DataProvider>
  );
}

function Inner({ user, children }) {
  const { data, error } = useDataContext();
  const [sites, setSites]                     = useUserDataKey("sites");
  const [scheduled, setScheduled]             = useUserDataKey("scheduled");
  const [issues, setIssues]                   = useUserDataKey("issues");
  const [completed, setCompleted]             = useUserDataKey("reports");
  const [corporate, setCorporate]             = useUserDataKey("corporate");
  const [inspectors, setInspectors]           = useUserDataKey("inspectors");
  const [customTemplate, setCustomTemplate]   = useUserDataKey("template");
  const [activeInspection, setActiveInspection] = useUserDataKey("active_inspection");

  const [issueDetail, setIssueDetail]               = useState(null);
  const [showInspectorForm, setShowInspectorForm]   = useState(false);
  const [editingInspector, setEditingInspector]     = useState(null);
  const [reportDetail, setReportDetail]             = useState(null);
  const [corpDetail, setCorpDetail]                 = useState(null);
  const [siteDetailId, setSiteDetailId]             = useState(null);
  const [showSiteForm, setShowSiteForm]             = useState(false);
  const [editingSite, setEditingSite]               = useState(null);
  const [showCorpForm, setShowCorpForm]             = useState(false);
  const [showIssueForm, setShowIssueForm]           = useState(false);
  const [confirmDialog, setConfirmDialog]           = useState(null);
  const [moreOpen, setMoreOpen]                     = useState(false);
  const [toasts, setToasts]                         = useState([]);

  const toast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const sitesEnriched = useMemo(
    () =>
      (sites || []).map((s) => ({
        ...s,
        openIssues: (issues || []).filter(
          (i) => i.siteId === s.id && i.status !== "resolved"
        ).length,
      })),
    [sites, issues]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const addSite = (siteData) => {
    const id = siteData.id || `site-${Date.now()}`;
    setSites((prev) => [...(prev || []), { ...siteData, id, lastScore: 0, lastInspection: null }]);
    setShowSiteForm(false);
    setEditingSite(null);
    toast("Site added.");
  };
  const updateSite = (siteData) => {
    const originalId = editingSite?.id ?? siteData.id;
    const newId = (siteData.id || "").trim() || originalId;
    if (newId !== originalId && (sites || []).some((s) => s.id === newId)) {
      toast(`Site ID "${newId}" is already in use.`);
      return;
    }
    const finalData = { ...siteData, id: newId };
    setSites((prev) => (prev || []).map((s) => (s.id === originalId ? { ...s, ...finalData } : s)));
    if (newId !== originalId) {
      const remap = (rows) => (rows || []).map((r) => (r.siteId === originalId ? { ...r, siteId: newId } : r));
      setScheduled(remap);
      setIssues(remap);
      setCompleted(remap);
      setCorporate(remap);
      if (activeInspection?.siteId === originalId) {
        setActiveInspection({ ...activeInspection, siteId: newId });
      }
      if (siteDetailId === originalId) setSiteDetailId(newId);
    }
    setShowSiteForm(false);
    setEditingSite(null);
    toast("Site updated.");
  };
  const deleteSite = (siteId) => {
    for (const r of completed || []) {
      if (r.siteId !== siteId) continue;
      for (const list of Object.values(r.photos || {})) {
        for (const p of list || []) if (p?.path) deletePhoto(p.path);
      }
      for (const n of r.notes || []) {
        if (n?.attachment?.path) deletePhoto(n.attachment.path);
      }
    }
    setSites((prev) => (prev || []).filter((s) => s.id !== siteId));
    setScheduled((prev) => (prev || []).filter((s) => s.siteId !== siteId));
    setIssues((prev) => (prev || []).filter((i) => i.siteId !== siteId));
    setCompleted((prev) => (prev || []).filter((r) => r.siteId !== siteId));
    setCorporate((prev) => (prev || []).filter((c) => c.siteId !== siteId));
    if (activeInspection?.siteId === siteId) setActiveInspection(null);
    if (reportDetail?.siteId === siteId) setReportDetail(null);
    if (corpDetail?.siteId === siteId) setCorpDetail(null);
    setSiteDetailId(null);
    toast("Site removed.");
  };

  const startInspection = (siteId, scheduleId = null) => {
    const site = (sites || []).find((s) => s.id === siteId);
    if (!site) return;
    if (
      activeInspection &&
      activeInspection.siteId === siteId &&
      activeInspection.scheduleId === scheduleId
    ) {
      window.location.assign("/inspection");
      return;
    }
    // Stamp the active template onto every new inspection so future edits
    // to the template don't retroactively change in-flight or saved reports.
    const template = resolveActiveTemplate(customTemplate);
    if (activeInspection) {
      setConfirmDialog({
        title: "Discard in-progress walkthrough?",
        message:
          "Another inspection is already in progress. Starting a new one will discard the current answers and comments.",
        confirmLabel: "Discard and start new",
        onConfirm: () => {
          setActiveInspection({
            id: `INSP-${Date.now()}`,
            siteId,
            site,
            scheduleId,
            template,
            pumpPositions: Number(site.pumps) || 0,
            startedAt: new Date().toISOString(),
            answers: {},
            comments: {},
            photos: {},
          });
          window.location.assign("/inspection");
        },
      });
      return;
    }
    setActiveInspection({
      id: `INSP-${Date.now()}`,
      siteId,
      site,
      scheduleId,
      template,
      pumpPositions: Number(site.pumps) || 0,
      startedAt: new Date().toISOString(),
      answers: {},
      comments: {},
      photos: {},
    });
    window.location.assign("/inspection");
  };

  const resolveInspectorName = () => {
    if (activeInspection?.scheduleId) {
      const sched = (scheduled || []).find((s) => s.id === activeInspection.scheduleId);
      if (sched?.inspector) return sched.inspector;
    }
    const def = (inspectors || []).find((i) => i.isDefault);
    if (def?.name) return def.name;
    if ((inspectors || [])[0]?.name) return inspectors[0].name;
    return user.email || "Inspector";
  };

  const completeInspection = () => {
    if (!activeInspection) return;
    const answers = activeInspection.answers || {};
    const comments = activeInspection.comments || {};
    // Score against the inspection's stamped template (or the default
    // SCHEMA if this in-flight inspection predates template stamping).
    const sections = activeInspection.template?.sections || SCHEMA;
    const score = computeScore(answers, sections);
    const fails = sections.flatMap((sec) =>
      sec.items
        .filter((it) => isScored(it) && answers[it.id] === "fail")
        .map((it) => ({
          ...it,
          comment: comments[it.id] || "",
          severity: sec.zeroTolerance ? "critical" : sec.critical ? "high" : "medium",
        }))
    );
    const ztFails = score.failedZTItems;
    const inspectorName = resolveInspectorName();

    const report = {
      id: `RPT-${Date.now()}`,
      siteId: activeInspection.siteId,
      completedAt: new Date().toISOString(),
      inspector: inspectorName,
      template: activeInspection.template,
      score: score.earned,
      total: score.total,
      effectiveTotal: score.effectiveTotal,
      naPoints: score.naPoints,
      percentage: score.percentage,
      passed: score.passed,
      failReasons: score.failReasons,
      pumpPositions: activeInspection.pumpPositions
        ?? (Number(activeInspection.site?.pumps) || 0),
      notes: activeInspection.notes || [],
      answers,
      comments,
      photos: activeInspection.photos || {},
      fails,
    };
    setCompleted((prev) => [report, ...(prev || [])]);

    setSites((prev) =>
      (prev || []).map((s) =>
        s.id === activeInspection.siteId
          ? {
              ...s,
              lastScore: score.earned,
              lastInspection: new Date().toISOString().slice(0, 10),
              status: score.passed ? "good" : score.failedZTItems > 0 ? "critical" : "needs-attention",
            }
          : s
      )
    );

    if (fails.length > 0) {
      const newIssues = fails.map((f) => {
        const sec = sections.find((s) => s.items.some((i) => i.id === f.id));
        const baseTime = Date.now();
        const baseId = `${baseTime}-${f.id}`;
        const photosForItem = activeInspection.photos?.[f.id] || [];
        const activity = [
          {
            id: `EV-${baseId}-create`,
            type: "created",
            at: new Date().toISOString(),
            actor: inspectorName,
            text: `Auto-created from inspection ${report.id}.`,
          },
        ];
        if (f.comment) {
          activity.push({
            id: `EV-${baseId}-note`,
            type: "note",
            at: new Date().toISOString(),
            actor: inspectorName,
            text: f.comment,
          });
        }
        for (let i = 0; i < photosForItem.length; i++) {
          const p = photosForItem[i];
          if (!p?.url) continue;
          activity.push({
            id: `EV-${baseId}-photo-${i}`,
            type: "attachment",
            at: new Date().toISOString(),
            actor: inspectorName,
            text: p.name || `Inspection photo ${i + 1}`,
            attachment: {
              url: p.url,
              name: p.name || `Inspection photo ${i + 1}`,
              contentType: "image/jpeg",
            },
          });
        }
        return {
          id: `ISS-${baseId}`,
          siteId: activeInspection.siteId,
          category: sec?.label || "Inspection Finding",
          item: `${f.id} — ${f.q.slice(0, 60)}${f.q.length > 60 ? "…" : ""}`,
          severity: f.severity,
          status: "open",
          opened: new Date().toISOString().slice(0, 10),
          note:
            (sec?.zeroTolerance ? "[ZERO TOLERANCE] " : "") + (f.comment || "Auto-generated from inspection."),
          assignee: inspectorName,
          sourceReportId: report.id,
          activity,
        };
      });
      setIssues((prev) => [...newIssues, ...(prev || [])]);
    }

    if (activeInspection.scheduleId) {
      setScheduled((prev) => (prev || []).filter((s) => s.id !== activeInspection.scheduleId));
    }

    const verdict = score.passed ? "PASS" : "FAIL";
    toast(
      ztFails > 0
        ? `Report saved — ${verdict}. ⚠ ${ztFails} ZERO-TOLERANCE violation${ztFails > 1 ? "s" : ""} flagged.`
        : `Report saved — ${verdict}. ${fails.length} issue${fails.length === 1 ? "" : "s"} created.`
    );
    setActiveInspection(null);
    setReportDetail(report);
    window.location.assign("/reports");
  };

  const cancelInspection = () => {
    if (!activeInspection) return;
    setConfirmDialog({
      title: "Discard inspection?",
      message: "This permanently deletes your in-progress answers, comments, and photos.",
      confirmLabel: "Discard",
      onConfirm: () => {
        setActiveInspection(null);
        window.location.assign("/dashboard");
      },
    });
  };
  const leaveInspection = () => {
    window.location.assign("/dashboard");
  };

  const updateIssue = (issue) => {
    setIssues((prev) => (prev || []).map((i) => (i.id === issue.id ? issue : i)));
  };
  const addIssue = (form) => {
    const inspectorName = resolveInspectorName();
    const entry = {
      id: `ISS-${Date.now()}`,
      activity: [
        {
          id: `EV-${Date.now()}-create`,
          type: "created",
          at: new Date().toISOString(),
          actor: inspectorName,
          text: "Issue created.",
        },
      ],
      ...form,
    };
    setIssues((prev) => [entry, ...(prev || [])]);
    setShowIssueForm(false);
    toast("Issue added.");
  };
  const deleteIssue = (id) => {
    const target = (issues || []).find((i) => i.id === id);
    if (target?.activity) {
      for (const ev of target.activity) {
        if (ev.attachment?.path) deletePhoto(ev.attachment.path);
      }
    }
    setIssues((prev) => (prev || []).filter((i) => i.id !== id));
    setIssueDetail(null);
    toast("Issue deleted.");
  };

  const addScheduled = (form) => {
    const entry = { id: `S-${Date.now()}`, ...form };
    setScheduled((prev) => [...(prev || []), entry]);
    toast("Inspection scheduled.");
    return entry;
  };
  const updateScheduled = (entry) => {
    setScheduled((prev) => (prev || []).map((s) => (s.id === entry.id ? { ...s, ...entry } : s)));
    toast("Schedule updated.");
  };
  const deleteScheduled = (id) => {
    setScheduled((prev) => (prev || []).filter((s) => s.id !== id));
    toast("Schedule removed.");
  };

  const addCorporate = (form) => {
    const entry = { id: form.id || `CORP-${Date.now()}`, ...form };
    setCorporate((prev) => [entry, ...(prev || [])]);
    setShowCorpForm(false);
    toast("Document archived.");
  };

  const deleteReport = (reportId) => {
    const target = (completed || []).find((r) => r.id === reportId);
    if (target?.photos) {
      for (const list of Object.values(target.photos)) {
        for (const p of list || []) {
          if (p?.path) deletePhoto(p.path);
        }
      }
    }
    if (target?.notes) {
      for (const n of target.notes) {
        if (n?.attachment?.path) deletePhoto(n.attachment.path);
      }
    }
    setCompleted((prev) => (prev || []).filter((r) => r.id !== reportId));
    if (reportDetail?.id === reportId) setReportDetail(null);
    toast("Report deleted.");
  };

  const deleteCorporate = (corpId) => {
    const target = (corporate || []).find((c) => c.id === corpId);
    if (target?.pdf?.path) deletePhoto(target.pdf.path);
    setCorporate((prev) => (prev || []).filter((c) => c.id !== corpId));
    if (corpDetail?.id === corpId) setCorpDetail(null);
    toast("Document deleted.");
  };

  const saveInspector = (entry) => {
    const list = inspectors || [];
    const isExisting = entry.id && list.some((i) => i.id === entry.id);
    const id = entry.id || `INS-${Date.now()}`;
    const willBeDefault = entry.isDefault || list.length === 0;
    let next;
    if (isExisting) {
      next = list.map((i) => ({
        ...i,
        ...(i.id === id ? { ...entry, id } : {}),
        isDefault: willBeDefault ? i.id === id : i.isDefault,
      }));
    } else {
      next = [
        ...list.map((i) => ({ ...i, isDefault: willBeDefault ? false : i.isDefault })),
        { ...entry, id },
      ];
    }
    if (!next.some((i) => i.isDefault) && next.length > 0) next[0].isDefault = true;
    setInspectors(next);
    setShowInspectorForm(false);
    setEditingInspector(null);
    toast(isExisting ? "Inspector updated." : "Inspector added.");
  };

  const deleteInspector = (id) => {
    const list = inspectors || [];
    const wasDefault = list.find((i) => i.id === id)?.isDefault;
    let next = list.filter((i) => i.id !== id);
    if (wasDefault && next.length > 0) next[0] = { ...next[0], isDefault: true };
    setInspectors(next);
    toast("Inspector removed.");
  };

  const makeInspectorDefault = (id) => {
    const list = inspectors || [];
    setInspectors(list.map((i) => ({ ...i, isDefault: i.id === id })));
    toast("Default inspector updated.");
  };

  const value = useMemo(
    () => ({
      user,
      // data
      sites: sitesEnriched,
      rawSites: sites,
      scheduled,
      issues,
      completed,
      corporate,
      inspectors,
      activeInspection,
      customTemplate, setCustomTemplate,
      // ui state
      issueDetail, setIssueDetail,
      reportDetail, setReportDetail,
      corpDetail, setCorpDetail,
      siteDetailId, setSiteDetailId,
      showSiteForm, setShowSiteForm,
      editingSite, setEditingSite,
      showCorpForm, setShowCorpForm,
      showInspectorForm, setShowInspectorForm,
      editingInspector, setEditingInspector,
      showIssueForm, setShowIssueForm,
      confirmDialog, setConfirmDialog,
      moreOpen, setMoreOpen,
      toasts,
      // operations
      toast,
      signOut,
      addSite, updateSite, deleteSite,
      startInspection, completeInspection, cancelInspection, leaveInspection,
      setActiveInspection,
      resolveInspectorName,
      updateIssue, addIssue, deleteIssue,
      addScheduled, updateScheduled, deleteScheduled,
      addCorporate, deleteCorporate, deleteReport,
      saveInspector, deleteInspector, makeInspectorDefault,
    }),
    [
      user, sitesEnriched, sites, scheduled, issues, completed, corporate, inspectors, activeInspection,
      customTemplate,
      issueDetail, reportDetail, corpDetail, siteDetailId, showSiteForm, editingSite,
      showCorpForm, showInspectorForm, editingInspector, showIssueForm, confirmDialog, moreOpen, toasts,
    ]
  );

  if (!data) return <FullScreenLoader label="Loading your inspections…" />;
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="max-w-md text-center">
          <h2 className="font-display text-lg font-semibold mb-2">Couldn't load your data</h2>
          <p className="text-sm text-stone-600 mb-4">{error}</p>
          <button
            onClick={signOut}
            className="bg-stone-900 hover:bg-stone-800 text-white text-sm px-4 py-2 rounded-md"
          >
            Sign out and retry
          </button>
        </div>
      </div>
    );
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}
