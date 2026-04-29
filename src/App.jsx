import { useMemo, useState } from "react";

import { useStoredState } from "./hooks/useStoredState.js";
import { SCHEMA } from "./data/schema.js";
import { computeScore } from "./lib/scoring.js";
import { SEED_SITES, SEED_SCHEDULED, SEED_ISSUES, SEED_CORPORATE } from "./data/seed.js";

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
import InternalOpsView from "./components/internal-ops/InternalOpsView.jsx";
import ReportsView from "./components/reports/ReportsView.jsx";
import CorporateView from "./components/corporate/CorporateView.jsx";
import CorporateForm from "./components/corporate/CorporateForm.jsx";
import IssuesView from "./components/issues/IssuesView.jsx";
import IssueDetailModal from "./components/issues/IssueDetailModal.jsx";

export default function App() {
  // Persisted data
  const [sites, setSites]                     = useStoredState("vg.sites",          SEED_SITES);
  const [scheduled, setScheduled]             = useStoredState("vg.scheduled",      SEED_SCHEDULED);
  const [issues, setIssues]                   = useStoredState("vg.issues",         SEED_ISSUES);
  const [completed, setCompleted]             = useStoredState("vg.reports",        []);
  const [corporate, setCorporate]             = useStoredState("vg.corporate",      SEED_CORPORATE);
  const [internalAudits, setInternalAudits]   = useStoredState("vg.internalAudits", []);

  // Ephemeral UI state
  const [view, setView] = useState("dashboard");
  const [activeInspection, setActiveInspection] = useState(null);
  const [activeInternal,   setActiveInternal]   = useState(null);
  const [issueDetail,  setIssueDetail]  = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [corpDetail,   setCorpDetail]   = useState(null);
  const [siteDetailId, setSiteDetailId] = useState(null);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [editingSite,  setEditingSite]  = useState(null);
  const [showCorpForm, setShowCorpForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  // Closes mobile more-sheet + clears any open detail when navigating
  const navigate = (v) => {
    setView(v);
    setMoreOpen(false);
    setSiteDetailId(null);
  };

  // Sites enriched with open issues count
  const sitesEnriched = useMemo(
    () =>
      sites.map((s) => ({
        ...s,
        openIssues: issues.filter((i) => i.siteId === s.id && i.status !== "resolved").length,
      })),
    [sites, issues]
  );

  // Site CRUD
  const addSite = (siteData) => {
    const id = siteData.id || `site-${Date.now()}`;
    setSites((prev) => [...prev, { ...siteData, id, lastScore: 0, lastInspection: null }]);
    setShowSiteForm(false);
    setEditingSite(null);
    toast("Site added.");
  };
  const updateSite = (siteData) => {
    setSites((prev) => prev.map((s) => (s.id === siteData.id ? { ...s, ...siteData } : s)));
    setShowSiteForm(false);
    setEditingSite(null);
    toast("Site updated.");
  };
  const deleteSite = (siteId) => {
    setSites((prev) => prev.filter((s) => s.id !== siteId));
    setScheduled((prev) => prev.filter((s) => s.siteId !== siteId));
    setIssues((prev) => prev.filter((i) => i.siteId !== siteId));
    setSiteDetailId(null);
    toast("Site removed.");
  };

  // Inspection lifecycle
  const startInspection = (siteId, scheduleId = null) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;
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
  };
  const completeInspection = () => {
    if (!activeInspection) return;
    const score = computeScore(activeInspection.answers);
    const fails = SCHEMA.flatMap((sec) =>
      sec.items
        .filter((it) => activeInspection.answers[it.id] === "fail")
        .map((it) => ({
          ...it,
          comment: activeInspection.comments[it.id] || "",
          severity: sec.zeroTolerance ? "critical" : sec.critical ? "high" : "medium",
        }))
    );
    const ztFails = SCHEMA.filter((s) => s.zeroTolerance)
      .flatMap((sec) => sec.items.filter((it) => activeInspection.answers[it.id] === "fail")).length;

    const report = {
      id: `RPT-${Date.now()}`,
      siteId: activeInspection.siteId,
      completedAt: new Date().toISOString(),
      inspector: "M. Reyes",
      score: score.earned,
      total: score.total,
      answers: activeInspection.answers,
      comments: activeInspection.comments,
      photos: activeInspection.photos,
      fails,
    };
    setCompleted((prev) => [report, ...prev]);

    // Update site lastScore and status
    setSites((prev) =>
      prev.map((s) =>
        s.id === activeInspection.siteId
          ? {
              ...s,
              lastScore: score.earned,
              lastInspection: new Date().toISOString().slice(0, 10),
              status:
                score.earned >= 100 ? "good" : score.earned >= 90 ? "needs-attention" : "critical",
            }
          : s
      )
    );

    // Auto-create issues from fails
    if (fails.length > 0) {
      const newIssues = fails.map((f) => {
        const sec = SCHEMA.find((s) => s.items.some((i) => i.id === f.id));
        return {
          id: `ISS-${Date.now()}-${f.id}`,
          siteId: activeInspection.siteId,
          category: sec?.label || "Inspection Finding",
          item: `${f.id} — ${f.q.slice(0, 60)}${f.q.length > 60 ? "…" : ""}`,
          severity: f.severity,
          status: "open",
          opened: new Date().toISOString().slice(0, 10),
          note:
            (sec?.zeroTolerance ? "[ZERO TOLERANCE] " : "") + (f.comment || "Auto-generated from internal pre-inspection."),
          assignee: "M. Reyes",
        };
      });
      setIssues((prev) => [...newIssues, ...prev]);
    }

    // Remove originating schedule entry
    if (activeInspection.scheduleId) {
      setScheduled((prev) => prev.filter((s) => s.id !== activeInspection.scheduleId));
    }

    toast(
      ztFails > 0
        ? `Report saved. ⚠ ${ztFails} ZERO-TOLERANCE violation${ztFails > 1 ? "s" : ""} flagged.`
        : `Report generated. ${fails.length} issue${fails.length === 1 ? "" : "s"} created.`
    );
    setActiveInspection(null);
    setReportDetail(report);
    navigate("reports");
  };
  const cancelInspection = () => {
    if (!activeInspection) return;
    setConfirmDialog({
      title: "Discard pre-inspection?",
      message: "Your in-progress walkthrough will be lost.",
      confirmLabel: "Discard",
      onConfirm: () => {
        setActiveInspection(null);
        navigate("dashboard");
      },
    });
  };

  // Internal ops lifecycle
  const startInternal = (siteId) => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;
    setActiveInternal({
      id: `OPS-${Date.now()}`,
      siteId,
      site,
      startedAt: new Date().toISOString(),
      values: {},
      comments: {},
      tobacco: [],
    });
    navigate("internal");
  };
  const completeInternal = () => {
    if (!activeInternal) return;
    const audit = { ...activeInternal, completedAt: new Date().toISOString() };
    setInternalAudits((prev) => [audit, ...prev]);
    toast("Internal ops walk archived.");
    setActiveInternal(null);
    navigate("dashboard");
  };
  const cancelInternal = () => {
    if (!activeInternal) return;
    setConfirmDialog({
      title: "Discard ops walk?",
      message: "Your in-progress walkthrough will be lost.",
      confirmLabel: "Discard",
      onConfirm: () => {
        setActiveInternal(null);
        navigate("dashboard");
      },
    });
  };

  // Issues
  const updateIssue = (issue) => {
    setIssues((prev) => prev.map((i) => (i.id === issue.id ? issue : i)));
    toast("Issue updated.");
  };

  // Schedule
  const addScheduled = (form) => {
    const entry = { id: `S-${Date.now()}`, ...form };
    setScheduled((prev) => [...prev, entry]);
    toast("Inspection scheduled.");
    return entry;
  };
  const deleteScheduled = (id) => {
    setScheduled((prev) => prev.filter((s) => s.id !== id));
    toast("Schedule removed.");
  };

  // Corporate
  const addCorporate = (form) => {
    const entry = { id: `CORP-${Date.now()}`, ...form };
    setCorporate((prev) => [entry, ...prev]);
    setShowCorpForm(false);
    toast("Corporate report archived.");
  };

  const siteDetail = siteDetailId ? sitesEnriched.find((s) => s.id === siteDetailId) : null;

  return (
    <div className="h-screen flex bg-stone-50 text-stone-900 overflow-hidden">
      <Sidebar
        view={view}
        setView={navigate}
        activeInspection={activeInspection}
        activeInternal={activeInternal}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <TopBar
          view={view}
          activeInspection={activeInspection}
          activeInternal={activeInternal}
          siteDetail={siteDetail}
        />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {view === "dashboard" && (
            <Dashboard
              setView={navigate}
              startInspection={startInspection}
              startInternal={startInternal}
              sites={sitesEnriched}
              scheduled={scheduled}
              issues={issues}
              completed={completed}
              setIssueDetail={setIssueDetail}
            />
          )}

          {view === "sites" && !siteDetail && (
            <SitesView
              sites={sitesEnriched}
              startInspection={startInspection}
              startInternal={startInternal}
              onAdd={() => { setEditingSite(null); setShowSiteForm(true); }}
              onEdit={(s) => { setEditingSite(s); setShowSiteForm(true); }}
              onDelete={(s) =>
                setConfirmDialog({
                  title: `Delete ${s.name}?`,
                  message: "This will also remove all related schedules and issues. Cannot be undone.",
                  onConfirm: () => deleteSite(s.id),
                })
              }
              onView={(s) => setSiteDetailId(s.id)}
            />
          )}

          {view === "sites" && siteDetail && (
            <SiteDetailView
              site={siteDetail}
              scheduled={scheduled}
              issues={issues}
              completed={completed}
              corporate={corporate}
              onBack={() => setSiteDetailId(null)}
              onEdit={(s) => { setEditingSite(s); setShowSiteForm(true); }}
              onDelete={(s) =>
                setConfirmDialog({
                  title: `Delete ${s.name}?`,
                  message: "This will also remove all related schedules and issues. Cannot be undone.",
                  onConfirm: () => deleteSite(s.id),
                })
              }
              onStartInspection={startInspection}
              onStartInternal={startInternal}
              setIssueDetail={setIssueDetail}
              setReportDetail={setReportDetail}
              setCorpDetail={setCorpDetail}
              setView={navigate}
            />
          )}

          {view === "schedule" && (
            <ScheduleView
              sites={sitesEnriched}
              scheduled={scheduled}
              addScheduled={addScheduled}
              startInspection={startInspection}
              startInternal={startInternal}
              onDelete={deleteScheduled}
            />
          )}

          {view === "inspection" && (
            <InspectionView
              inspection={activeInspection}
              setInspection={setActiveInspection}
              onComplete={completeInspection}
              onCancel={cancelInspection}
            />
          )}

          {view === "internal" && (
            <InternalOpsView
              audit={activeInternal}
              setAudit={setActiveInternal}
              sites={sitesEnriched}
              onComplete={completeInternal}
              onCancel={cancelInternal}
              startInternal={startInternal}
            />
          )}

          {view === "reports" && (
            <ReportsView
              reports={completed}
              sites={sitesEnriched}
              detail={reportDetail}
              setDetail={setReportDetail}
            />
          )}

          {view === "corporate" && (
            <CorporateView
              corporate={corporate}
              sites={sitesEnriched}
              completed={completed}
              detail={corpDetail}
              setDetail={setCorpDetail}
              onAdd={() => setShowCorpForm(true)}
            />
          )}

          {view === "issues" && (
            <IssuesView issues={issues} sites={sitesEnriched} setIssueDetail={setIssueDetail} />
          )}
        </div>

        <MobileBottomNav
          view={view}
          setView={navigate}
          onMore={() => setMoreOpen(!moreOpen)}
          activeInspection={activeInspection}
          activeInternal={activeInternal}
          moreOpen={moreOpen}
        />
      </main>

      {moreOpen && (
        <MobileMoreSheet
          view={view}
          setView={navigate}
          activeInspection={activeInspection}
          activeInternal={activeInternal}
          onClose={() => setMoreOpen(false)}
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
        <CorporateForm sites={sitesEnriched} onSubmit={addCorporate} onClose={() => setShowCorpForm(false)} />
      )}

      {issueDetail && (
        <IssueDetailModal
          issue={issueDetail}
          sites={sitesEnriched}
          onUpdate={updateIssue}
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
