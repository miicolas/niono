import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type PageTemplate, templates } from "@/constants/templates";
import type { DocumentNode } from "@/lib/editor/document-node";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";

/** One level-2 heading followed by an empty paragraph per section. */
function templateDocument(template: PageTemplate): DocumentNode {
  return {
    type: "doc",
    content: template.sections.flatMap((title) => [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: title }],
      },
      { type: "paragraph" },
    ]),
  };
}
export function TemplatesDialog({
  open,
  workspaceId,
  canEdit,
  onNavigate,
  onRefresh,
  onClose,
}: {
  open: boolean;
  workspaceId: string;
  canEdit: boolean;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const use = async (template: PageTemplate) => {
    setBusy(true);
    try {
      const page = await orpcClient.pages.create({
        workspaceId,
        title: template.title,
        icon: template.icon,
        content: templateDocument(template),
      });
      await onRefresh();
      onNavigate(page.id);
      onClose();
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Une longueur d’avance</DialogTitle>
          <DialogDescription>
            Choisissez un point de départ et appropriez-vous la page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((template) => (
            <button
              className="recent-card"
              disabled={!canEdit || busy}
              key={template.title}
              onClick={() => use(template)}
              type="button"
            >
              <span className="card-icon">{template.icon}</span>
              <strong>{template.title}</strong>
              <small>{template.description}</small>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
