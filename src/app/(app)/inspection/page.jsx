"use client";

import InspectionView from "@/components/inspection/InspectionView.jsx";
import { useAppState } from "@/lib/contexts/app-state.jsx";

export default function InspectionPage() {
  const {
    user,
    activeInspection,
    setActiveInspection,
    completeInspection,
    leaveInspection,
    cancelInspection,
    resolveInspectorName,
  } = useAppState();
  return (
    <InspectionView
      inspection={activeInspection}
      setInspection={setActiveInspection}
      onComplete={completeInspection}
      onLeave={leaveInspection}
      onDiscard={cancelInspection}
      user={user}
      inspectorName={resolveInspectorName()}
    />
  );
}
