import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";

import { Checkbox } from "../../../apps/web/src/components/ui/checkbox";
import { Input } from "../../../apps/web/src/components/ui/input";
import { editorControls } from "../../../apps/web/src/features/editor/editor-controls";
import { EditorAssistantDialog } from "../../../apps/web/src/features/workspace/editor-assistant-dialog";
import {
  DocumentEditor,
  type DocumentEditorProps,
} from "../../../packages/editor/src/document-editor";

export async function renderEditor(
  overrides: Partial<DocumentEditorProps> = {},
) {
  let editor:
    Parameters<NonNullable<DocumentEditorProps["onReady"]>>[0] | undefined;
  const props: DocumentEditorProps = {
    ui: editorControls,
    AssistantDialog: EditorAssistantDialog,
    Input,
    Checkbox,
    content: { type: "doc", content: [{ type: "paragraph" }] },
    editable: true,
    onChange: () => {},
    onUpload: async (file) => ({
      url: `/api/assets/${crypto.randomUUID()}`,
      name: file.name,
      mime: file.type,
    }),
    ...overrides,
    onReady: (value) => {
      editor = value;
      overrides.onReady?.(value);
    },
  };
  const view = render(createElement(DocumentEditor, props));
  const textbox = await screen.findByRole("textbox", {
    name: "Contenu de la page",
  });
  await waitFor(() => {
    if (!editor) throw new Error("Éditeur pas encore prêt");
  });
  return {
    editor: editor!,
    textbox,
    ...view,
    rerenderProps: (next: Partial<DocumentEditorProps>) =>
      view.rerender(createElement(DocumentEditor, { ...props, ...next })),
  };
}
