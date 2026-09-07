import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DEFAULT_IMAGE_ALIGN, toImageAlign } from "@/lib/editor/image-align";
import { clampImageWidth } from "@/lib/editor/image-width";
import { ImageView } from "./image-view";

/**
 * Image de la page : le nœud Tiptap standard, complété d'une largeur en
 * pourcentage et d'un alignement, et rendu par une vue React qui permet de la
 * redimensionner et de la déplacer.
 */
export const EditorImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const value = Number(element.getAttribute("data-width"));
          return value ? clampImageWidth(value) : null;
        },
        renderHTML: (attributes) =>
          attributes.width ? { "data-width": String(attributes.width) } : {},
      },
      align: {
        default: DEFAULT_IMAGE_ALIGN,
        parseHTML: (element) =>
          toImageAlign(element.getAttribute("data-align")),
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
}).configure({ allowBase64: false });
