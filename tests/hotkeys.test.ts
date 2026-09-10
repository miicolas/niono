import { setPlatform } from "./fixtures/hotkeys/set-platform";
import { Navigation } from "./fixtures/hotkeys/navigation";
import { SearchNavigation } from "./fixtures/hotkeys/search-navigation";
// @vitest-environment happy-dom
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { HotkeyManager } from "@tanstack/react-hotkeys";
import { Shortcut } from "../apps/web/src/components/shortcut";
import { EditorAssistantDialog } from "../apps/web/src/features/workspace/editor-assistant-dialog";
import { Input } from "../apps/web/src/components/ui/input";
import { editorControls } from "../apps/web/src/features/editor/editor-controls";
import { Checkbox } from "../apps/web/src/components/ui/checkbox";
import { useUI } from "../apps/web/src/lib/ui-store";
import {
  DocumentEditor,
  type DocumentEditorProps,
} from "../packages/editor/src/document-editor";

afterEach(() => {
  cleanup();
  HotkeyManager.resetInstance();
  useUI.setState({ panel: "none" });
  vi.restoreAllMocks();
});

const platforms = [
  {
    name: "Mac",
    platform: "MacIntel",
    modifiers: { metaKey: true },
    label: "⌘ K",
  },
  {
    name: "Windows",
    platform: "Win32",
    modifiers: { ctrlKey: true },
    label: "Ctrl+K",
  },
  {
    name: "Linux",
    platform: "Linux x86_64",
    modifiers: { ctrlKey: true },
    label: "Ctrl+K",
  },
];

const editorProps: DocumentEditorProps = {
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

test.each(platforms)(
  "la recherche utilise le raccourci $name même dans un champ et le nettoie au démontage",
  ({ platform, modifiers, label }) => {
    setPlatform(platform);
    const view = render(h(SearchNavigation));
    expect(
      screen.getByRole("button", { name: "Rechercher" }).textContent,
    ).toContain(label);
    const input = screen.getByRole("textbox", { name: "Titre" });
    input.focus();
    fireEvent.keyDown(input, { key: "k" });
    fireEvent.keyDown(input, { key: "k", ...modifiers, shiftKey: true });
    fireEvent.keyDown(input, { key: "k", ...modifiers, altKey: true });
    expect(useUI.getState().panel).toBe("none");
    expect(fireEvent.keyDown(input, { key: "K", ...modifiers })).toBe(false);
    fireEvent.keyUp(input, { key: "K", ...modifiers });
    expect(useUI.getState().panel).toBe("search");
    view.unmount();
    useUI.setState({ panel: "none" });
    expect(fireEvent.keyDown(document.body, { key: "k", ...modifiers })).toBe(
      true,
    );
    expect(useUI.getState().panel).toBe("none");
  },
);

test.each(platforms)(
  "la navigation $name bascule une fois par pression et conserve son état courant",
  ({ platform, modifiers }) => {
    setPlatform(platform);
    render(h(Navigation));
    const navigation = screen.getByRole("status", { name: "Navigation" });
    expect(navigation.textContent).toBe("expanded/false");
    fireEvent.keyDown(document.body, { key: "B", ...modifiers });
    expect(navigation.textContent).toBe("collapsed/false");
    fireEvent.keyDown(document.body, { key: "B", ...modifiers, repeat: true });
    expect(navigation.textContent).toBe("collapsed/false");
    fireEvent.keyUp(document.body, { key: "B", ...modifiers });
    fireEvent.keyDown(document.body, { key: "b", ...modifiers });
    fireEvent.keyUp(document.body, { key: "b", ...modifiers });
    expect(navigation.textContent).toBe("expanded/false");
  },
);

test("la navigation laisse les champs et leurs descendants éditables recevoir Mod+B", () => {
  setPlatform("Linux");
  render(
    h(
      Navigation,
      null,
      h(Input, { "aria-label": "Titre" }),
      h("textarea", { "aria-label": "Message" }),
      h(
        "div",
        {
          contentEditable: true,
          suppressContentEditableWarning: true,
          role: "textbox",
          "aria-label": "Texte",
        },
        h("span", null, "Une phrase"),
      ),
    ),
  );
  const fields = screen.getAllByRole("textbox");
  for (const field of fields) {
    field.focus();
    const target = field.firstElementChild ?? field;
    expect(fireEvent.keyDown(target, { key: "b", ctrlKey: true })).toBe(true);
    fireEvent.keyUp(target, { key: "b", ctrlKey: true });
  }
  expect(screen.getByRole("status", { name: "Navigation" }).textContent).toBe(
    "expanded/false",
  );
});

test("Mod+B applique le gras dans Tiptap sans replier la navigation", async () => {
  setPlatform("Linux");
  const onChange = vi.fn();
  render(h(Navigation, null, h(DocumentEditor, { ...editorProps, onChange })));
  const editor = await screen.findByRole("textbox", {
    name: "Contenu de la page",
  });
  fireEvent.keyDown(editor, { key: "b", ctrlKey: true });
  fireEvent.keyUp(editor, { key: "b", ctrlKey: true });
  expect(onChange).toHaveBeenCalled();
  expect(editor.querySelector("strong")?.textContent).toBe("Une idé");
  expect(screen.getByRole("status", { name: "Navigation" }).textContent).toBe(
    "expanded/false",
  );
});

test.each(platforms)(
  "l’assistant $name respecte la sélection, le focus, les modificateurs et la lecture seule",
  async ({ platform, modifiers }) => {
    setPlatform(platform);
    const onCodex = vi.fn();
    const props = { ...editorProps, onCodex };
    const view = render(h(DocumentEditor, props));
    const editor = await screen.findByRole("textbox", {
      name: "Contenu de la page",
    });
    fireEvent.keyDown(document.body, { key: "j", ...modifiers });
    fireEvent.keyDown(editor, { key: "j", ...modifiers, shiftKey: true });
    fireEvent.keyDown(editor, { key: "j", ...modifiers, altKey: true });
    fireEvent.keyDown(editor, { key: "j", ...modifiers, repeat: true });
    fireEvent.keyDown(editor, { key: "j", ...modifiers, isComposing: true });
    expect(onCodex).not.toHaveBeenCalled();
    fireEvent.keyDown(editor, { key: "J", ...modifiers });
    fireEvent.keyUp(editor, { key: "J", ...modifiers });
    expect(onCodex).toHaveBeenCalledExactlyOnceWith({
      from: 1,
      to: 8,
      text: "Une idé",
    });
    view.rerender(h(DocumentEditor, { ...props, editable: false }));
    expect(fireEvent.keyDown(editor, { key: "j", ...modifiers })).toBe(true);
    expect(onCodex).toHaveBeenCalledOnce();
  },
);

test("le raccourci de recherche ferme la navigation mobile", () => {
  setPlatform("Linux");
  vi.spyOn(window, "innerWidth", "get").mockReturnValue(390);
  render(h(SearchNavigation));
  fireEvent.click(
    screen.getByRole("button", { name: "Ouvrir ou fermer la navigation" }),
  );
  expect(screen.getByRole("dialog", { name: "Navigation" })).toBeDefined();
  fireEvent.keyDown(screen.getByRole("button", { name: "Rechercher" }), {
    key: "k",
    ctrlKey: true,
  });
  fireEvent.keyUp(document.body, { key: "k", ctrlKey: true });
  expect(useUI.getState().panel).toBe("search");
  expect(screen.queryByRole("dialog", { name: "Navigation" })).toBeNull();
});

test("le libellé clavier s’hydrate sur Mac sans divergence avec le serveur", async () => {
  setPlatform("MacIntel");
  const container = document.createElement("div");
  container.innerHTML = renderToString(h(Shortcut, { hotkey: "Mod+K" }));
  expect(container.textContent).toBe("");
  document.body.append(container);
  const onRecoverableError = vi.fn();
  const root = hydrateRoot(container, h(Shortcut, { hotkey: "Mod+K" }), {
    onRecoverableError,
  });
  try {
    await act(async () => {});
    expect(container.textContent).toBe("⌘ K");
    expect(onRecoverableError).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
