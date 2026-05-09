"use client";

import { useState } from "react";
import DocumentsView from "@/components/documents/DocumentsView.jsx";
import DocumentForm from "@/components/documents/DocumentForm.jsx";
import { useAppState } from "@/lib/contexts/app-state.jsx";
import { useTenant } from "@/lib/tenant/context.jsx";

export default function DocumentsPage() {
  const tenant = useTenant();
  const { user, sites, corporate, addCorporate, deleteCorporate, setConfirmDialog } = useAppState();

  // Documents share the existing `corporate` data store; tenant-config
  // owns the category list. Adding a new category writes to local tenant
  // state (Hypeify Claude Code wires this to tenant_config persistence).
  const [categories, setCategories] = useState(tenant.documentCategories || []);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);

  const onAddCategory = (name) => {
    if (!categories.includes(name)) setCategories([...categories, name]);
  };

  return (
    <>
      <DocumentsView
        documents={corporate || []}
        sites={sites}
        categories={categories}
        onAdd={() => setShowForm(true)}
        onDelete={(d) =>
          setConfirmDialog({
            title: "Delete this document?",
            message: "Removes the archived entry and its attached file. Cannot be undone.",
            confirmLabel: "Delete",
            onConfirm: () => deleteCorporate(d.id),
          })
        }
        detail={detail}
        setDetail={setDetail}
      />
      {showForm && (
        <DocumentForm
          sites={sites}
          categories={categories}
          onAddCategory={onAddCategory}
          onSubmit={(doc) => { addCorporate(doc); setShowForm(false); }}
          onClose={() => setShowForm(false)}
          user={user}
        />
      )}
    </>
  );
}
