// @vitest-environment happy-dom
import { createElement as h } from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Checkbox } from "../apps/web/src/components/ui/checkbox";
import { Input } from "../apps/web/src/components/ui/input";
import { editorControls } from "../apps/web/src/features/editor/editor-controls";
import { EditorAssistantDialog } from "../apps/web/src/features/workspace/editor-assistant-dialog";
import {
  DocumentEditor,
  type DocumentEditorProps,
} from "../packages/editor/src/document-editor";

afterEach(cleanup);

const props: DocumentEditorProps = {
  ui: editorControls,
  AssistantDialog: EditorAssistantDialog,
  Input,
  Checkbox,
  content: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Une idée à préciser." }],
      },
    ],
  },
  editable: true,
  onChange: () => {},
  onUpload: async () => ({ url: "", name: "", mime: "" }),
  onReady: (editor) => editor.commands.setTextSelection({ from: 1, to: 8 }),
};

test("le clic droit sur une sélection ouvre les outils d’écriture", async () => {
  const onChange = vi.fn();
  render(h(DocumentEditor, { ...props, onChange }));
  const editor = await screen.findByRole("textbox", {
    name: "Contenu de la page",
  });

  expect(fireEvent.contextMenu(editor)).toBe(false);
  expect(
    await screen.findByRole("menuitem", {
      name: /Améliorer avec l’assistant/,
    }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("menuitem", { name: /Gras/ }));

  await waitFor(() =>
    expect(editor.querySelector("strong")?.textContent).toBe("Une idé"),
  );
  expect(onChange).toHaveBeenCalled();
});

test("Maj + clic droit laisse le menu natif disponible", async () => {
  render(h(DocumentEditor, props));
  const editor = await screen.findByRole("textbox", {
    name: "Contenu de la page",
  });

  expect(fireEvent.contextMenu(editor, { shiftKey: true })).toBe(true);
  expect(screen.queryByRole("menu")).toBeNull();
});

test("Maj + F10 ouvre le même menu au clavier", async () => {
  render(h(DocumentEditor, props));
  const editor = await screen.findByRole("textbox", {
    name: "Contenu de la page",
  });

  expect(fireEvent.keyDown(editor, { key: "F10", shiftKey: true })).toBe(false);
  expect(
    await screen.findByRole("menuitem", {
      name: /Améliorer avec l’assistant/,
    }),
  ).toBeTruthy();
});

test("le clic droit en lecture seule reste natif", async () => {
  render(h(DocumentEditor, { ...props, editable: false }));
  const editor = await screen.findByRole("textbox", {
    name: "Contenu de la page",
  });

  expect(fireEvent.contextMenu(editor)).toBe(true);
  expect(screen.queryByRole("menu")).toBeNull();
});
