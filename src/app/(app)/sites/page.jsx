"use client";

import { useRouter } from "next/navigation";
import SitesView from "@/components/sites/SitesView.jsx";
import SiteDetailView from "@/components/sites/SiteDetailView.jsx";
import { useAppState } from "@/lib/contexts/app-state.jsx";

export default function SitesPage() {
  const router = useRouter();
  const ctx = useAppState();
  const {
    sites, scheduled, issues, completed, corporate,
    siteDetailId, setSiteDetailId,
    setShowSiteForm, setEditingSite,
    setIssueDetail, setReportDetail, setCorpDetail,
    setConfirmDialog,
    deleteSite, startInspection,
  } = ctx;

  const siteDetail = siteDetailId ? sites.find((s) => s.id === siteDetailId) : null;

  if (siteDetail) {
    return (
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
        setReportDetail={(r) => { setReportDetail(r); router.push("/reports"); }}
        setCorpDetail={(c) => { setCorpDetail(c); router.push("/documents"); }}
        setView={(v) => router.push(`/${v}`)}
      />
    );
  }

  return (
    <SitesView
      sites={sites}
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
  );
}
