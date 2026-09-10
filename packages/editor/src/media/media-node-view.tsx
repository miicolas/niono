import { safeUrl } from "@digipm/contracts";
import { changeMedia } from "./change-media";
import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  ImageIcon,
  File,
  Globe,
  MoreHorizontal,
  Download,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useEditorUI } from "../document-editor/use-editor-ui";
import { useEditorEditable } from "../document-editor/use-editor-editable";
import { useMediaUpload } from "./use-media-upload";
import { MediaResizeHandle } from "./media-resize-handle";
import type { MediaKind, UploadHandler } from "./media-types";

export function MediaNodeView(
  props: NodeViewProps & { onUpload: UploadHandler },
) {
  const { Button, Popover, MediaForm } = useEditorUI();
  const editable = useEditorEditable(props.editor);
  const kind = props.node.type.name as MediaKind;
  const a = props.node.attrs;
  const rawUrl = String((kind === "image" ? a.src : a.href) || "");
  const url = safeUrl(rawUrl) && !rawUrl.startsWith("mailto:") ? rawUrl : "";
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [broken, setBroken] = useState<string | null>(null);
  const upload = useMediaUpload(props, props.onUpload);
  const Icon =
    kind === "image" ? ImageIcon : kind === "bookmark" ? Globe : File;
  const label =
    kind === "image"
      ? "une image"
      : kind === "bookmark"
        ? "un signet web"
        : "un fichier";
  const restoreFocus = () => {
    if (!props.editor.isDestroyed) props.editor.commands.focus();
  };
  return (
    <NodeViewWrapper
      className={`media-block ${props.selected ? "is-selected" : ""}`}
      data-kind={kind}
      contentEditable={false}
    >
      <figure
        className="media-figure"
        data-align={a.alignment || "center"}
        style={
          kind === "image" && url
            ? { width: preview ?? a.width ?? "100%" }
            : undefined
        }
      >
        {!url ? (
          <Button
            className="media-placeholder"
            disabled={!editable}
            onClick={() => setOpen(true)}
          >
            <Icon size={20} />
            {editable
              ? `Ajouter ${label}`
              : `Bloc ${kind === "image" ? "image" : kind === "file" ? "fichier" : "signet"} vide`}
          </Button>
        ) : kind === "image" ? (
          <>
            {broken === url ? (
              <div role="status" className="media-placeholder">
                <ImageIcon size={20} />
                Image indisponible
              </div>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Voir l’image originale"
                className="media-image-link"
              >
                <img
                  src={url}
                  alt={a.alt || ""}
                  onError={() => setBroken(url)}
                  draggable={false}
                />
              </a>
            )}
            {editable && (
              <MediaResizeHandle
                width={preview ?? a.width ?? 760}
                onPreview={setPreview}
                onCommit={(width) => {
                  if (props.editor.isEditable)
                    changeMedia(props.editor, () =>
                      props.updateAttributes({ width, height: null }),
                    );
                }}
              />
            )}
          </>
        ) : (
          <a
            className={`media-card ${kind === "bookmark" ? "media-bookmark" : "media-file"}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon size={22} className="media-card-icon" />
            <span className="media-card-content">
              <strong>
                {kind === "bookmark" ? a.title || url : a.name || "Fichier"}
              </strong>
              {kind === "bookmark" && a.description && (
                <span>{a.description}</span>
              )}
              <small>
                {kind === "bookmark"
                  ? url
                  : a.size
                    ? `${Math.max(1, Math.round(a.size / 1024)).toLocaleString("fr-FR")} Ko`
                    : url}
              </small>
            </span>
            <ExternalLink size={14} />
          </a>
        )}
        {a.caption && <figcaption>{a.caption}</figcaption>}
        {editable && (
          <div className="media-actions">
            <Popover
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (!next) upload.cancel();
              }}
              label={`Réglages ${label}`}
              onRestoreFocus={restoreFocus}
              trigger={
                <Button
                  aria-label={`Modifier ${label}`}
                  title={`Modifier ${label}`}
                >
                  <MoreHorizontal size={16} />
                </Button>
              }
            >
              <MediaForm
                kind={kind}
                values={{
                  url,
                  name: kind === "bookmark" ? a.title || "" : a.name || "",
                  caption: a.caption || "",
                  alt: a.alt || "",
                  description: a.description || "",
                  width: a.width ? String(a.width) : "",
                  alignment: a.alignment || "center",
                }}
                onSubmit={(values) => {
                  if (!props.editor.isEditable) return;
                  changeMedia(props.editor, () =>
                    props.updateAttributes({
                      [kind === "image" ? "src" : "href"]: values.url,
                      [kind === "bookmark" ? "title" : "name"]: values.name,
                      caption: values.caption,
                      alt: values.alt,
                      description: values.description,
                      ...(kind === "image"
                        ? {
                            width: values.width ? Number(values.width) : null,
                            height: null,
                          }
                        : {}),
                      alignment: values.alignment,
                    }),
                  );
                  setBroken(null);
                  setOpen(false);
                  restoreFocus();
                }}
                onUpload={(file) => void upload.upload(file)}
                busy={upload.busy}
                error={upload.error}
                onCancel={upload.cancel}
              />
            </Popover>
            {url && kind !== "bookmark" && (
              <a
                className="media-action-link"
                href={
                  url + (url.startsWith("/api/assets/") ? "?download=1" : "")
                }
                download={a.name || undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Télécharger le fichier"
                title="Télécharger"
              >
                <Download size={16} />
              </a>
            )}
            <Button
              aria-label="Dupliquer le média"
              title="Dupliquer"
              onClick={() => {
                const pos = props.getPos();
                if (pos === undefined || !props.editor.isEditable) return;
                changeMedia(props.editor, () =>
                  props.editor
                    .chain()
                    .focus()
                    .insertContentAt(pos + props.node.nodeSize, {
                      ...props.node.toJSON(),
                      attrs: { ...a, id: null },
                    })
                    .run(),
                );
              }}
            >
              <Copy size={15} />
            </Button>
            <Button
              aria-label="Supprimer le média"
              title="Supprimer"
              onClick={() => {
                if (props.editor.isEditable) {
                  upload.cancel();
                  changeMedia(props.editor, props.deleteNode);
                }
              }}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        )}
      </figure>
    </NodeViewWrapper>
  );
}
