import { client } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/notifications";
import type { DocumentNode } from "@digipm/contracts";
import { type WorkspacePanelsState } from "./shared";

export function TemplatesDialog({
  panel,
  close,
  templates,
  canEdit,
  busy,
  setBusy,
  workspaceId,
  onRefresh,
  onNavigate,
}: Pick<
  WorkspacePanelsState,
  | "panel"
  | "close"
  | "templates"
  | "canEdit"
  | "busy"
  | "setBusy"
  | "workspaceId"
  | "onRefresh"
  | "onNavigate"
>) {
  return (
    <Dialog
      open={panel === "templates"}
      onOpenChange={(v) => {
        if (!v) close();
      }}
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
            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={!canEdit || busy}
              key={template.title}
              className="recent-card"
              onClick={async () => {
                setBusy(true);
                try {
                  const content: DocumentNode = {
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
                  const page = await client.pages.create({
                    workspaceId,
                    title: template.title,
                    icon: template.icon,
                    content,
                  });
                  await onRefresh();
                  onNavigate(page.id);
                  close();
                } catch (e) {
                  reportError(e);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <span className="card-icon">{template.icon}</span>
              <strong>{template.title}</strong>
              <small>{template.description}</small>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
