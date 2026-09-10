import { editorControls } from "../apps/web/src/features/editor/editor-controls";
// @vitest-environment happy-dom
import { createElement as h, useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { EditorAssistantDialog } from "../apps/web/src/features/workspace/editor-assistant-dialog";
import { CommandDialog } from "../apps/web/src/components/ui/command";

afterEach(cleanup);

test.each(["Escape", "Fermer"])(
  "l’assistant ferme avec %s et rend le focus à l’éditeur",
  async (action) => {
    const restoreFocus = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return open
        ? h(EditorAssistantDialog, {
            onClose: () => setOpen(false),
            onRestoreFocus: restoreFocus,
            children: h("input", { "aria-label": "Instruction" }),
          })
        : null;
    }
    render(h(Harness));
    const dialog = await screen.findByRole("dialog", {
      name: "Assistant d’écriture",
    });
    const input = screen.getByRole("textbox", { name: "Instruction" });
    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(dialog.contains(input)).toBe(true);
    if (action === "Escape") fireEvent.keyDown(input, { key: "Escape" });
    else fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(restoreFocus).toHaveBeenCalledOnce());
  },
);

test("la palette garde son nom et sa description accessibles dans la modale", async () => {
  render(
    h(CommandDialog, {
      open: true,
      title: "Rechercher une page",
      description: "Parcourir les pages de cet espace.",
    }),
  );
  const dialog = await screen.findByRole("dialog", {
    name: "Rechercher une page",
  });
  const title = document.getElementById(
    dialog.getAttribute("aria-labelledby")!,
  );
  const description = document.getElementById(
    dialog.getAttribute("aria-describedby")!,
  );
  expect(dialog.contains(title)).toBe(true);
  expect(dialog.contains(description)).toBe(true);
  expect(description?.textContent).toBe("Parcourir les pages de cet espace.");
});

test("une réponse IA tardive ne rouvre pas la modale fermée", async () => {
  const { DocumentEditor } =
    await import("../packages/editor/src/document-editor");
  const { Checkbox } = await import("../apps/web/src/components/ui/checkbox");
  const { Input } = await import("../apps/web/src/components/ui/input");
  const { act } = await import("@testing-library/react");
  let resolveResponse!: (value: string) => void;
  const response = new Promise<string>((resolve) => {
    resolveResponse = resolve;
  });
  const onAI = vi.fn(() => response);
  render(
    h(DocumentEditor, {
      AssistantDialog: EditorAssistantDialog,
      ui: editorControls,
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
      onChange: vi.fn(),
      onUpload: vi.fn(),
      onReady: (editor) => editor.commands.setTextSelection({ from: 1, to: 8 }),
      onAI,
      aiAvailable: true,
    }),
  );
  const editor = await screen.findByRole("textbox", {
    name: "Contenu de la page",
  });
  fireEvent.keyDown(editor, { key: "j", ctrlKey: true });
  const instruction = await screen.findByRole("textbox", {
    name: "Instruction pour l’IA",
  });
  fireEvent.change(instruction, { target: { value: "Améliorer la clarté" } });
  fireEvent.submit(instruction.closest("form")!);
  await waitFor(() => expect(onAI).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await act(async () => {
    resolveResponse("Une idée plus claire.");
    await response;
  });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(editor.textContent).toBe("Une idée à préciser.");
});

test("le menu de bloc shadcn se ferme avec Échap et restaure le focus", async () => {
  const restoreFocus = vi.fn();
  function Harness() {
    const [open, setOpen] = useState(true);
    return open
      ? h(editorControls.BlockMenu, {
          x: 20,
          y: 20,
          onClose: () => setOpen(false),
          onRestoreFocus: restoreFocus,
          items: [
            {
              id: "duplicate",
              label: "Dupliquer",
              icon: null,
              onSelect: vi.fn(),
            },
          ],
        })
      : null;
  }
  render(h(Harness));
  const menu = await screen.findByRole("menu");
  expect(screen.getByRole("menuitem", { name: "Dupliquer" })).toBeTruthy();
  fireEvent.keyDown(menu, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  await waitFor(() => expect(restoreFocus).toHaveBeenCalledOnce());
});
