import {
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from "react";
import type { ImageAlign } from "@/lib/editor/image-align";
import { clampImageWidth } from "@/lib/editor/image-width";

/** Une image centrée s'élargit des deux côtés à la fois. */
const growthFactor = (align: ImageAlign) => (align === "center" ? 2 : 1);

/**
 * Redimensionnement à la souris ou au doigt. La largeur suit le curseur pendant
 * le geste sans toucher au document, et n'est enregistrée qu'au relâchement :
 * un redimensionnement ne laisse ainsi qu'une seule étape à annuler.
 */
export function useImageResize(
  align: ImageAlign,
  commit: (width: number) => void
) {
  const figure = useRef<HTMLDivElement>(null);
  const live = useRef<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const startResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
    side: 1 | -1
  ) => {
    const image = figure.current?.querySelector("img");
    const available = figure.current?.parentElement?.clientWidth;
    if (!(image && available)) {
      return;
    }
    event.preventDefault();
    const handle = event.currentTarget;
    const startX = event.clientX;
    const startWidth = image.clientWidth;
    const factor = growthFactor(align);
    const move = (moveEvent: PointerEvent) => {
      const next = startWidth + (moveEvent.clientX - startX) * side * factor;
      live.current = clampImageWidth((next / available) * 100);
      setPreview(live.current);
    };
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
      handle.releasePointerCapture(event.pointerId);
      if (live.current !== null) {
        commit(live.current);
      }
      live.current = null;
      setPreview(null);
    };
    handle.setPointerCapture(event.pointerId);
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  };

  return { figure, preview, startResize };
}
