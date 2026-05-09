"use client";

import ScheduleView from "@/components/schedule/ScheduleView.jsx";
import { useAppState } from "@/lib/contexts/app-state.jsx";

export default function SchedulePage() {
  const {
    sites, scheduled, inspectors,
    addScheduled, updateScheduled, deleteScheduled,
    startInspection,
  } = useAppState();
  return (
    <ScheduleView
      sites={sites}
      scheduled={scheduled || []}
      inspectors={inspectors || []}
      addScheduled={addScheduled}
      updateScheduled={updateScheduled}
      startInspection={startInspection}
      onDelete={deleteScheduled}
    />
  );
}
