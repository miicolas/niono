import { useRef } from "react";
import { useEditorUI } from "../document-editor/use-editor-ui";

export function MediaResizeHandle({
  width,
  onPreview,
  onCommit,
}: {
  width: number;
  onPreview: (width: number | null) => void;
  onCommit: (width: number) => void;
}) {
  const { Button } = useEditorUI();
  const drag = useRef<{
    x: number;
    width: number;
    next: number;
    max: number;
  } | null>(null);
  return (
    <Button
      type="button"
      className="media-resize-handle"
      role="slider"
      aria-label="Largeur de l’image"
      aria-valuemin={80}
      aria-valuemax={2400}
      aria-valuenow={Math.round(width)}
      onPointerDown={(event) => {
        event.preventDefault();
        const figure = event.currentTarget.closest("figure")!;
        const measured = figure.getBoundingClientRect().width;
        drag.current = {
          x: event.clientX,
          width: measured,
          next: measured,
          max: figure.parentElement?.getBoundingClientRect().width || 2400,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        drag.current.next = Math.round(
          Math.max(
            80,
            Math.min(
              drag.current.max,
              drag.current.width + (event.clientX - drag.current.x) * 2,
            ),
          ),
        );
        onPreview(drag.current.next);
      }}
      onPointerUp={() => {
        if (drag.current) onCommit(drag.current.next);
        drag.current = null;
        onPreview(null);
      }}
      onPointerCancel={() => {
        drag.current = null;
        onPreview(null);
      }}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        onCommit(
          event.key === "Home"
            ? 80
            : event.key === "End"
              ? 2400
              : Math.min(
                  2400,
                  Math.max(80, width + (event.key === "ArrowLeft" ? -20 : 20)),
                ),
        );
      }}
    />
  );
}
