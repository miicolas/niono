import type { Editor } from "@tiptap/react";

export type TableAction = { label: string; run: (editor: Editor) => void };

/** Actions proposées quand le curseur se trouve dans un tableau. */
export const TABLE_ACTIONS: TableAction[] = [
  { label: "+ Ligne", run: (e) => e.chain().focus().addRowAfter().run() },
  { label: "+ Colonne", run: (e) => e.chain().focus().addColumnAfter().run() },
  {
    label: "Supprimer la ligne",
    run: (e) => e.chain().focus().deleteRow().run(),
  },
  {
    label: "Supprimer la colonne",
    run: (e) => e.chain().focus().deleteColumn().run(),
  },
  { label: "Fusionner", run: (e) => e.chain().focus().mergeCells().run() },
  { label: "Séparer", run: (e) => e.chain().focus().splitCell().run() },
];
