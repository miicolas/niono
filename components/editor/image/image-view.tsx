import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { toImageAlign } from "@/lib/editor/image-align";
import { MAX_IMAGE_WIDTH } from "@/lib/editor/image-width";
import { MAX_ALT_LENGTH } from "@/lib/editor/validate-image-attrs";
import { ImageToolbar } from "./image-toolbar";
import { useImageResize } from "./use-image-resize";

const attr = (value: unknown) => (typeof value === "string" ? value : "");

/** Rendu d'une image dans la page, avec sa barre d'actions et ses poignées. */
export function ImageView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
}: ReactNodeViewProps) {
  const [altOpen, setAltOpen] = useState(false);
  const align = toImageAlign(node.attrs.align);
  const width = typeof node.attrs.width === "number" ? node.attrs.width : null;
  const { figure, preview, startResize } = useImageResize(align, (value) =>
    updateAttributes({ width: value })
  );
  const shown = preview ?? width;
  const editable = editor.isEditable;
  const active = editable && selected;

  return (
    <NodeViewWrapper className="editor-image" data-align={align}>
      <div
        className="image-frame"
        data-resizing={preview !== null || undefined}
        data-selected={active || undefined}
        data-sized={shown !== null || undefined}
        ref={figure}
        style={shown ? { width: `${shown}%` } : undefined}
      >
        {active && (
          <ImageToolbar
            align={align}
            altOpen={altOpen}
            onAlign={(value) => updateAttributes({ align: value })}
            onDelete={deleteNode}
            onFullWidth={() => updateAttributes({ width: MAX_IMAGE_WIDTH })}
            onToggleAlt={() => setAltOpen((open) => !open)}
            src={attr(node.attrs.src)}
          />
        )}
        <img
          alt={attr(node.attrs.alt)}
          draggable={false}
          src={attr(node.attrs.src)}
        />
        {editable && (
          <>
            <button
              aria-label="Réduire ou agrandir par la gauche"
              className="image-handle"
              data-side="left"
              onPointerDown={(event) => startResize(event, -1)}
              type="button"
            />
            <button
              aria-label="Réduire ou agrandir par la droite"
              className="image-handle"
              data-side="right"
              onPointerDown={(event) => startResize(event, 1)}
              type="button"
            />
          </>
        )}
      </div>
      {active && altOpen && (
        <input
          aria-label="Texte alternatif de l’image"
          className="image-alt"
          maxLength={MAX_ALT_LENGTH}
          onChange={(event) => updateAttributes({ alt: event.target.value })}
          placeholder="Décrivez l’image pour les lecteurs d’écran…"
          value={attr(node.attrs.alt)}
        />
      )}
    </NodeViewWrapper>
  );
}
