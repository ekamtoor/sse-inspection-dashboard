"use client";

import { useRouter } from "next/navigation";
import Dashboard from "@/components/dashboard/Dashboard.jsx";
import { useAppState } from "@/lib/contexts/app-state.jsx";

export default function DashboardPage() {
  const router = useRouter();
  const ctx = useAppState();
  return (
    <Dashboard
      setView={(v) => router.push(typeof v === "string" && v.startsWith("/") ? v : `/${v}`)}
      startInspection={ctx.startInspection}
      sites={ctx.sites}
      scheduled={ctx.scheduled || []}
      issues={ctx.issues || []}
      completed={ctx.completed || []}
      setIssueDetail={ctx.setIssueDetail}
      activeInspection={ctx.activeInspection}
    />
  );
}
