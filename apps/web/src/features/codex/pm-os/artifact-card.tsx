import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, ExternalLink } from "lucide-react";
import type { PmArtifact } from "@digipm/contracts/pm-os";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { client } from "@/lib/api";
import { PrototypePreview } from "./prototype-preview";
export function ArtifactCard({
  artifact,
  conversationId,
  workspaceId,
}: {
  artifact: PmArtifact;
  conversationId: string;
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);
  const preview = useQuery({
    queryKey: ["pm-artifact", conversationId, artifact.id],
    queryFn: () =>
      client.pm.preview({ conversationId, artifactId: artifact.id }),
    enabled: open,
    retry: false,
  });
  const current = preview.data;
  return (
    <div className="pm-artifact">
      <FileText size={20} />
      <div className="pm-artifact-details">
        <strong>{artifact.title}</strong>
        <span>
          {artifact.name} · {artifact.format.toUpperCase()} · révision{" "}
          {artifact.documentRevision}
        </span>
      </div>
      <div className="pm-actions">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Aperçu
        </Button>
        <a
          className="pm-icon-link"
          href={artifact.url}
          download={artifact.name}
          aria-label={"Télécharger " + artifact.name}
        >
          <Download size={16} />
        </a>
        <a
          className="pm-icon-link"
          href={`/?w=${workspaceId}&p=${artifact.pageId}`}
          aria-label={"Ouvrir " + artifact.title}
        >
          <ExternalLink size={16} />
        </a>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="pm-artifact-dialog">
          <DialogHeader>
            <DialogTitle>{artifact.title}</DialogTitle>
            <DialogDescription>
              Export révision {artifact.documentRevision}
              {current && current.documentRevision !== artifact.documentRevision
                ? ` · page actuelle révision ${current.documentRevision}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {preview.isPending && <p role="status">Chargement du fichier…</p>}
          {preview.error && <p role="alert">{preview.error.message}</p>}
          {current &&
            (artifact.format === "html" && current.text ? (
              <PrototypePreview html={current.text} title={artifact.title} />
            ) : artifact.format === "image" ? (
              <img
                src={artifact.url}
                alt={artifact.title}
                className="pm-artifact-image"
              />
            ) : current.text ? (
              <pre className="pm-artifact-text">{current.text}</pre>
            ) : (
              <p>Cette archive est disponible au téléchargement.</p>
            ))}
          {current?.truncated && (
            <p className="pm-caption">
              Aperçu limité au premier million de caractères. Le fichier
              téléchargé reste complet.
            </p>
          )}
          <div className="pm-actions">
            <a
              className="pm-download"
              href={artifact.url}
              download={artifact.name}
            >
              <Download size={14} /> Télécharger l’export r
              {artifact.documentRevision}
            </a>
            {["markdown", "csv", "json", "html", "code"].includes(
              artifact.format,
            ) &&
              current?.text &&
              !current.truncated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob([current.text!], {
                        type: "application/octet-stream",
                      }),
                    );
                    const link = document.createElement("a");
                    link.href = url;
                    link.download =
                      "r" + current.documentRevision + "-" + artifact.name;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  Exporter la page r{current.documentRevision}
                </Button>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
