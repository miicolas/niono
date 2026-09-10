import { type Editor, useEditorState } from "@tiptap/react";
export function useEditorFormatting(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold"),
      italic: ctx.editor?.isActive("italic"),
      underline: ctx.editor?.isActive("underline"),
      strike: ctx.editor?.isActive("strike"),
      table: ctx.editor?.isActive("table"),
      undo: ctx.editor?.can().undo(),
      redo: ctx.editor?.can().redo(),
    }),
  });
}
