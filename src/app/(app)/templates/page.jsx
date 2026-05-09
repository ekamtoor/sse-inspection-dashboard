"use client";

import TemplateEditor from "@/components/templates/TemplateEditor.jsx";
import { useAppState } from "@/lib/contexts/app-state.jsx";

export default function TemplatesPage() {
  const { customTemplate, setCustomTemplate, toast } = useAppState();
  return (
    <TemplateEditor
      customTemplate={customTemplate}
      setCustomTemplate={setCustomTemplate}
      onToast={toast}
    />
  );
}
