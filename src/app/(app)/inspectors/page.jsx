"use client";

import InspectorsView from "@/components/inspectors/InspectorsView.jsx";
import { useAppState } from "@/lib/contexts/app-state.jsx";

export default function InspectorsPage() {
  const {
    inspectors,
    setEditingInspector, setShowInspectorForm,
    setConfirmDialog, deleteInspector, makeInspectorDefault,
  } = useAppState();
  return (
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
  );
}
