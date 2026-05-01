import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { supabase } from "./lib/supabase.js";
import { DataProvider, useDataContext, useUserDataKey } from "./hooks/useUserData.jsx";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import { SCHEMA, PASSING_PERCENTAGE } from "./data/schema.js";
import { computeScore } from "./lib/scoring.js";
import { deletePhoto } from "./lib/photos.js";

import Sidebar from "./components/layout/Sidebar.jsx";
import MobileBottomNav from "./components/layout/MobileBottomNav.jsx";
import MobileMoreSheet from "./components/layout/MobileMoreSheet.jsx";
import TopBar from "./components/layout/TopBar.jsx";
import Toasts from "./components/shared/Toasts.jsx";
import ConfirmDialog from "./components/shared/ConfirmDialog.jsx";

import Dashboard from "./components/dashboard/Dashboard.jsx";
import SitesView from "./components/sites/SitesView.jsx";
import SiteDetailView from "./components/sites/SiteDetailView.jsx";
import SiteFormModal from "./components/sites/SiteFormModal.jsx";
import ScheduleView from "./components/schedule/ScheduleView.jsx";
import InspectionView from "./components/inspection/InspectionView.jsx";
import ReportsView from "./components/reports/ReportsView.jsx";
import CorporateView from "./components/corporate/CorporateView.jsx";
import CorporateForm from "./components/corporate/CorporateForm.jsx";
import IssuesView from "./components/issues/IssuesView.jsx";
import IssueDetailModal from "./components/issues/IssueDetailModal.jsx";
import IssueFormModal from "./components/issues/IssueFormModal.jsx";
import InspectorsView from "./components/inspectors/InspectorsView.jsx";
import InspectorFormModal from "./components/inspectors/InspectorFormModal.jsx";

function FullScreenLoader({ label }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="flex items-center gap-3 text-stone-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        {label || "Loading…"}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <FullScreenLoader label="Loading…" />;
  if (!session) return <LoginScreen />;

  return (
    <DataProvider user={session.user}>
      <AppShell user={session.user} />
    </DataProvider>
  );
}

function AppShell({ user }) {
  const { data, error } = useDataContext();
  const [sites, setSites]                     = useUserDataKey("sites");
  const [scheduled, setScheduled]             = useUserDataKey("scheduled");
  const [issues, setIssues]                   = useUserDataKey("issues");
  const [completed, setCompleted]             = useUserDataKey("reports");
  const [corporate, setCorporate]             = useUserDataKey("corporate");
  const [inspectors, setInspectors]           = useUserDataKey("inspectors");

  const [view, setViewRaw] = useUserDataKey("view");
  const [activeInspection, setActiveInspection] = useUserDataKey("active_inspection");
  const [issueDetail,  setIssueDetail]  = useState(null);
  const [showInspectorForm, setShowInspectorForm] = useState(false);
  const [editingInspector,  setEditingInspector]  = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [corpDetail,   setCorpDetail]   = useState(null);
  const [siteDetailId, setSiteDetailId] = useState(null);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [editingSite,  setEditingSite]  = useState(null);
  const [showCorpForm, setShowCorpForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const navigate = (v) => {
    setViewRaw(v);
    setMoreOpen(false);
    setSiteDetailId(null);
  };

  const sitesEnriched = useMemo(
    () =>
      (sites || []).map((s) => ({
        ...s,
        openIssues: (issues || []).filter((i) => i.siteId === s.id && i.status !== "resolved").length,
      })),
    [sites, issues]
  );

  const signOut = async () => {
    await supabase.auth.signOut();
  };

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
    setSites((prev) =>
      (prev || []).map((s) => (s.id === originalId ? { ...s, ...finalData } : s))
    );

    if (newId !== originalId) {
      const remap = (rows) =>
        (rows || []).map((r) => (r.siteId === originalId ? { ...r, siteId: newId } : r));
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
    // Best-effort cleanup of any photos and note attachments in Storage that
    // belonged to this site's reports, before we drop the rows that reference
    // their paths.
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
      navigate("inspection");
      return;
    }
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
            startedAt: new Date().toISOString(),
            answers: {},
            comments: {},
            photos: {},
          });
          navigate("inspection");
        },
      });
      return;
    }
    setActiveInspection({
      id: `INSP-${Date.now()}`,
      siteId,
      site,
      scheduleId,
      pumpPositions: Number(site.pumps) || 0,
      startedAt: new Date().toISOString(),
      answers: {},
      comments: {},
      photos: {},
    });
    navigate("inspection");
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
    const score = computeScore(answers);
    const fails = SCHEMA.flatMap((sec) =>
      sec.items
        .filter((it) => answers[it.id] === "fail")
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
        const sec = SCHEMA.find((s) => s.items.some((i) => i.id === f.id));
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

        // Bring the inspector's comment over as a note event so it shows up
        // in the activity timeline alongside the rest of the conversation.
        if (f.comment) {
          activity.push({
            id: `EV-${baseId}-note`,
            type: "note",
            at: new Date().toISOString(),
            actor: inspectorName,
            text: f.comment,
          });
        }

        // Each failed-item photo becomes an attachment event. We deliberately
        // omit `path` so deleting this issue later doesn't wipe the photo
        // from Storage — the report still owns the underlying file.
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
    navigate("reports");
  };
  const cancelInspection = () => {
    if (!activeInspection) return;
    setConfirmDialog({
      title: "Discard inspection?",
      message: "This permanently deletes your in-progress answers, comments, and photos.",
      confirmLabel: "Discard",
      onConfirm: () => {
        setActiveInspection(null);
        navigate("dashboard");
      },
    });
  };
  const leaveInspection = () => {
    navigate("dashboard");
  };

  const updateIssue = (issue) => {
    // No toast — IssueDetailModal fires this on every activity event
    // (status change, note, attachment) and the timeline already gives
    // visual feedback. A toast on each call would be noisy.
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
    toast("Corporate report archived.");
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
    toast("Corporate report deleted.");
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

  const siteDetail = siteDetailId ? sitesEnriched.find((s) => s.id === siteDetailId) : null;

  return (
    <div className="h-[100dvh] flex bg-stone-50 text-stone-900 overflow-hidden">
      <Sidebar
        view={view}
        setView={navigate}
        activeInspection={activeInspection}
        userEmail={user.email}
        onSignOut={signOut}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <TopBar view={view} siteDetail={siteDetail} />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {view === "dashboard" && (
            <Dashboard
              setView={navigate}
              startInspection={startInspection}
              sites={sitesEnriched}
              scheduled={scheduled || []}
              issues={issues || []}
              completed={completed || []}
              setIssueDetail={setIssueDetail}
              activeInspection={activeInspection}
            />
          )}

          {view === "sites" && !siteDetail && (
            <SitesView
              sites={sitesEnriched}
              startInspection={startInspection}
              onAdd={() => { setEditingSite(null); setShowSiteForm(true); }}
              onEdit={(s) => { setEditingSite(s); setShowSiteForm(true); }}
              onDelete={(s) =>
                setConfirmDialog({
                  title: `Delete ${s.name}?`,
                  message: "Also removes every schedule, issue, report, corporate entry, and photo tied to this site. Cannot be undone.",
                  onConfirm: () => deleteSite(s.id),
                })
              }
              onView={(s) => setSiteDetailId(s.id)}
            />
          )}

          {view === "sites" && siteDetail && (
            <SiteDetailView
              site={siteDetail}
              scheduled={scheduled || []}
              issues={issues || []}
              completed={completed || []}
              corporate={corporate || []}
              onBack={() => setSiteDetailId(null)}
              onEdit={(s) => { setEditingSite(s); setShowSiteForm(true); }}
              onDelete={(s) =>
                setConfirmDialog({
                  title: `Delete ${s.name}?`,
                  message: "Also removes every schedule, issue, report, corporate entry, and photo tied to this site. Cannot be undone.",
                  onConfirm: () => deleteSite(s.id),
                })
              }
              onStartInspection={startInspection}
              setIssueDetail={setIssueDetail}
              setReportDetail={setReportDetail}
              setCorpDetail={setCorpDetail}
              setView={navigate}
            />
          )}

          {view === "schedule" && (
            <ScheduleView
              sites={sitesEnriched}
              scheduled={scheduled || []}
              inspectors={inspectors || []}
              addScheduled={addScheduled}
              updateScheduled={updateScheduled}
              startInspection={startInspection}
              onDelete={deleteScheduled}
            />
          )}

          {view === "inspection" && (
            <InspectionView
              inspection={activeInspection}
              setInspection={setActiveInspection}
              onComplete={completeInspection}
              onLeave={leaveInspection}
              onDiscard={cancelInspection}
              user={user}
              inspectorName={resolveInspectorName()}
            />
          )}

          {view === "reports" && (
            <ReportsView
              reports={completed || []}
              sites={sitesEnriched}
              detail={reportDetail}
              setDetail={setReportDetail}
              onDelete={(r) =>
                setConfirmDialog({
                  title: "Delete this report?",
                  message: "Removes the report and any photos attached to it from cloud storage. Cannot be undone.",
                  confirmLabel: "Delete",
                  onConfirm: () => deleteReport(r.id),
                })
              }
            />
          )}

          {view === "corporate" && (
            <CorporateView
              corporate={corporate || []}
              sites={sitesEnriched}
              completed={completed || []}
              detail={corpDetail}
              setDetail={setCorpDetail}
              onAdd={() => setShowCorpForm(true)}
              onDelete={(c) =>
                setConfirmDialog({
                  title: "Delete this corporate report?",
                  message: "Removes the archived entry and the attached PDF, if any. Cannot be undone.",
                  confirmLabel: "Delete",
                  onConfirm: () => deleteCorporate(c.id),
                })
              }
            />
          )}

          {view === "issues" && (
            <IssuesView
              issues={issues || []}
              sites={sitesEnriched}
              setIssueDetail={setIssueDetail}
              onAdd={() => setShowIssueForm(true)}
            />
          )}

          {view === "inspectors" && (
            <InspectorsView
              inspectors={inspectors || []}
              onAdd={() => { setEditingInspector(null); setShowInspectorForm(true); }}
              onEdit={(p) => { setEditingInspector(p); setShowInspectorForm(true); }}
              onDelete={(p) =>
                setConfirmDialog({
                  title: `Remove ${p.name}?`,
                  message: "Existing reports keep this name. Future reports will use the default.",
                  confirmLabel: "Remove",
                  onConfirm: () => deleteInspector(p.id),
                })
              }
              onMakeDefault={(p) => makeInspectorDefault(p.id)}
            />
          )}
        </div>

        <MobileBottomNav
          view={view}
          setView={navigate}
          onMore={() => setMoreOpen(!moreOpen)}
          activeInspection={activeInspection}
          moreOpen={moreOpen}
        />
      </main>

      {moreOpen && (
        <MobileMoreSheet
          view={view}
          setView={navigate}
          activeInspection={activeInspection}
          onClose={() => setMoreOpen(false)}
          userEmail={user.email}
          onSignOut={signOut}
        />
      )}

      {showSiteForm && (
        <SiteFormModal
          site={editingSite}
          onSubmit={editingSite ? updateSite : addSite}
          onClose={() => { setShowSiteForm(false); setEditingSite(null); }}
        />
      )}

      {showCorpForm && (
        <CorporateForm sites={sitesEnriched} onSubmit={addCorporate} onClose={() => setShowCorpForm(false)} user={user} />
      )}

      {showInspectorForm && (
        <InspectorFormModal
          inspector={editingInspector}
          onSubmit={saveInspector}
          onClose={() => { setShowInspectorForm(false); setEditingInspector(null); }}
        />
      )}

      {showIssueForm && (
        <IssueFormModal
          sites={sitesEnriched}
          inspectors={inspectors || []}
          onSubmit={addIssue}
          onClose={() => setShowIssueForm(false)}
        />
      )}

      {issueDetail && (
        <IssueDetailModal
          // Pull the live record out of the issues array so status changes
          // and new activity events render immediately. Fall back to the
          // captured snapshot if the row was just deleted out from under us.
          issue={(issues || []).find((i) => i.id === issueDetail.id) || issueDetail}
          sites={sitesEnriched}
          user={user}
          inspectorName={resolveInspectorName()}
          onUpdate={updateIssue}
          onDelete={(iss) =>
            setConfirmDialog({
              title: "Delete this issue?",
              message: "Removes the issue from the tracker permanently.",
              confirmLabel: "Delete",
              onConfirm: () => deleteIssue(iss.id),
            })
          }
          onClose={() => setIssueDetail(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}
