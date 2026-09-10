import Image from "@tiptap/extension-image";
import { mediaAttributes } from "./media-attributes";

export const MediaImage = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), ...mediaAttributes(), src: { default: "" } };
  },
}).configure({ allowBase64: false });
