import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import UniqueID from "@tiptap/extension-unique-id";
import type { Extensions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Callout } from "./extensions/callout";
import { FileNode } from "./extensions/file-node";
import { PageLink } from "./extensions/page-link";
import { UploadPlaceholder } from "./extensions/upload-placeholder";
import { EditorImage } from "./image/extension";

/** Blocs qui reçoivent un identifiant stable, utile aux ancres et au sommaire. */
const IDENTIFIED_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "image",
  "table",
  "taskItem",
  "listItem",
  "callout",
  "details",
  "file",
];

/** Extensions Tiptap de la page ; les liens s'ouvrent au clic en lecture seule. */
export function createEditorExtensions(editable: boolean): Extensions {
  return [
    StarterKit.configure({
      dropcursor: { color: "#8ea7bf", width: 3 },
      link: {
        openOnClick: !editable,
        defaultProtocol: "https",
        protocols: ["https", "http", "mailto"],
      },
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
      a11y: {
        checkboxLabel: (node) => `Tâche : ${node.textContent || "sans titre"}`,
      },
    }),
    EditorImage,
    UploadPlaceholder,
    TableKit.configure({ table: { resizable: true } }),
    Placeholder.configure({
      placeholder: "Écrivez quelque chose, ou « / » pour les commandes…",
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Subscript,
    Superscript,
    Details.configure({ persist: true }),
    DetailsSummary,
    DetailsContent,
    Callout,
    FileNode,
    PageLink,
    UniqueID.configure({ types: IDENTIFIED_TYPES }),
  ];
}
