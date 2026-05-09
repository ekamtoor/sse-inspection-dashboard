"use client";

import ReportsView from "@/components/reports/ReportsView.jsx";
import { useAppState } from "@/lib/contexts/app-state.jsx";

export default function ReportsPage() {
  const {
    completed, sites,
    reportDetail, setReportDetail,
    setConfirmDialog, deleteReport,
  } = useAppState();
  return (
    <ReportsView
      reports={completed || []}
      sites={sites}
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
  );
}
