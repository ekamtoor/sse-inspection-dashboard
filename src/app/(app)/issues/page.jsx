"use client";

import IssuesView from "@/components/issues/IssuesView.jsx";
import { useAppState } from "@/lib/contexts/app-state.jsx";

export default function IssuesPage() {
  const { issues, sites, setIssueDetail, setShowIssueForm } = useAppState();
  return (
    <IssuesView
      issues={issues || []}
      sites={sites}
      setIssueDetail={setIssueDetail}
      onAdd={() => setShowIssueForm(true)}
    />
  );
}
