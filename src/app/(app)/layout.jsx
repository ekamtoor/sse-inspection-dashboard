"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

import { TenantProvider } from "@/lib/tenant/context.jsx";
import { AppStateProvider, useAppState } from "@/lib/contexts/app-state.jsx";
import { supabase } from "@/lib/supabase/client.js";

import Sidebar from "@/components/layout/Sidebar.jsx";
import TopBar from "@/components/layout/TopBar.jsx";
import MobileBottomNav from "@/components/layout/MobileBottomNav.jsx";
import MobileMoreSheet from "@/components/layout/MobileMoreSheet.jsx";
import Toasts from "@/components/shared/Toasts.jsx";
import ConfirmDialog from "@/components/shared/ConfirmDialog.jsx";
import SiteFormModal from "@/components/sites/SiteFormModal.jsx";
import CorporateForm from "@/components/corporate/CorporateForm.jsx";
import IssueDetailModal from "@/components/issues/IssueDetailModal.jsx";
import IssueFormModal from "@/components/issues/IssueFormModal.jsx";
import InspectorFormModal from "@/components/inspectors/InspectorFormModal.jsx";

// =====================================================================
// (app) layout
// =====================================================================
// Authenticated route group. Renders the chrome (sidebar, topbar, mobile
// nav) around whichever page is active, plus the global modal stack and
// toast container. Auth gate is a client redirect; for production we'll
// also have middleware.ts catch unauthenticated server-side requests.
// =====================================================================

export default function AppLayout({ children }) {
  const router = useRouter();
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex items-center gap-3 text-stone-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </div>
    );
  }
  if (!session) return null; // redirect in flight

  return (
    <TenantProvider>
      <AppStateProvider user={session.user}>
        <Shell>{children}</Shell>
      </AppStateProvider>
    </TenantProvider>
  );
}

// Pulls everything UI-shaped from the AppState context and renders chrome +
// modal stack. The actual page content lives in {children}.
function Shell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const ctx = useAppState();
  const {
    user,
    sites,
    inspectors,
    activeInspection,
    issueDetail, setIssueDetail,
    showSiteForm, setShowSiteForm,
    editingSite, setEditingSite,
    showCorpForm, setShowCorpForm,
    showInspectorForm, setShowInspectorForm,
    editingInspector, setEditingInspector,
    showIssueForm, setShowIssueForm,
    confirmDialog, setConfirmDialog,
    moreOpen, setMoreOpen,
    toasts,
    signOut,
    addSite, updateSite,
    addCorporate,
    saveInspector,
    addIssue,
    updateIssue,
    deleteIssue,
    resolveInspectorName,
  } = ctx;

  const navigate = (target) => {
    setMoreOpen(false);
    if (typeof target === "string" && target.startsWith("/")) {
      router.push(target);
      return;
    }
    // legacy: components still pass view ids like "dashboard". Map to URL.
    const slug = target === "dashboard" ? "/dashboard" : `/${target}`;
    router.push(slug);
  };

  // Components still read a `view` id rather than a path. Derive it from
  // the pathname so Sidebar / TopBar highlighting keeps working.
  const view = (() => {
    if (!pathname) return "dashboard";
    const seg = pathname.split("/").filter(Boolean)[0];
    return seg || "dashboard";
  })();

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
        <TopBar view={view} siteDetail={null} />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</div>

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
        <CorporateForm
          sites={sites}
          onSubmit={addCorporate}
          onClose={() => setShowCorpForm(false)}
          user={user}
        />
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
          sites={sites}
          inspectors={inspectors || []}
          onSubmit={addIssue}
          onClose={() => setShowIssueForm(false)}
        />
      )}

      {issueDetail && (
        <IssueDetailModal
          issue={(ctx.issues || []).find((i) => i.id === issueDetail.id) || issueDetail}
          sites={sites}
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
