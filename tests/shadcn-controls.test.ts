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
import { SelectField } from "../apps/web/src/components/ui/select-field";
import { SelectItem } from "../apps/web/src/components/ui/select";
import { DatePicker } from "../apps/web/src/components/ui/date-picker";
import { DocumentEditor } from "../packages/editor/src/document-editor";
import { EditorAssistantDialog } from "../apps/web/src/features/workspace/editor-assistant-dialog";
import { Input } from "../apps/web/src/components/ui/input";
import { Checkbox } from "../apps/web/src/components/ui/checkbox";

HTMLElement.prototype.scrollIntoView ??= () => {};
afterEach(cleanup);

test("les choix shadcn conservent les valeurs de formulaire, y compris après effacement", async () => {
  const { container } = render(
    h(
      "form",
      null,
      h(
        SelectField,
        { name: "role", defaultValue: "editor", "aria-label": "Rôle" },
        h(SelectItem, { value: "editor" }, "Modification"),
        h(SelectItem, { value: "viewer" }, "Lecture"),
      ),
      h(
        SelectField,
        {
          name: "status",
          defaultValue: "todo",
          emptyLabel: "Sans statut",
          "aria-label": "Statut",
        },
        h(SelectItem, { value: "todo" }, "À faire"),
      ),
    ),
  );
  const form = container.querySelector("form")!;
  expect(new FormData(form).get("role")).toBe("editor");
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Rôle" }), {
    key: "ArrowDown",
  });
  fireEvent.click(await screen.findByRole("option", { name: "Lecture" }));
  await waitFor(() => expect(new FormData(form).get("role")).toBe("viewer"));
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Statut" }), {
    key: "ArrowDown",
  });
  fireEvent.click(await screen.findByRole("option", { name: "Sans statut" }));
  await waitFor(() => expect(new FormData(form).get("status")).toBe(""));
  expect(
    screen.getByRole("combobox", { name: "Statut" }).textContent,
  ).toContain("Sans statut");
});

test("le calendrier permet de changer puis effacer une date sans sélecteur natif", async () => {
  function Harness() {
    const [value, setValue] = useState("2026-09-06");
    return h(DatePicker, {
      value,
      onValueChange: setValue,
      "aria-label": "Échéance",
    });
  }
  const { container } = render(h(Harness));
  fireEvent.click(screen.getByRole("button", { name: "Échéance" }));
  const nextDay = await screen.findByRole("button", {
    name: /^lundi 7 septembre 2026$/i,
  });
  fireEvent.click(nextDay);
  expect(
    screen.getByRole("button", { name: "Échéance" }).textContent,
  ).toContain("07 sept. 2026");
  fireEvent.click(screen.getByRole("button", { name: "Échéance" }));
  fireEvent.click(screen.getByRole("button", { name: "Effacer la date" }));
  expect(
    screen.getByRole("button", { name: "Échéance" }).textContent,
  ).toContain("Choisir une date");
  expect(container.querySelector('input[type="date"]')).toBeNull();
});

test("la case shadcn de l’éditeur met à jour le document et respecte la lecture seule", async () => {
  const onChange = vi.fn();
  const props = {
    AssistantDialog: EditorAssistantDialog,
    ui: editorControls,
    Checkbox,
    Input,
    content: {
      type: "doc",
      content: [
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Préparer la livraison" }],
                },
              ],
            },
          ],
        },
      ],
    },
    editable: true,
    onChange,
    onUpload: vi.fn(),
  };
  const view = render(h(DocumentEditor, props));
  const checkbox = await screen.findByRole("checkbox", {
    name: "Tâche : Préparer la livraison",
  });
  expect(checkbox.tagName).toBe("BUTTON");
  fireEvent.click(checkbox);
  await waitFor(() =>
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: "taskList",
            content: expect.arrayContaining([
              expect.objectContaining({
                attrs: expect.objectContaining({ checked: true }),
              }),
            ]),
          }),
        ]),
      }),
    ),
  );
  view.rerender(h(DocumentEditor, { ...props, editable: false }));
  await waitFor(() =>
    expect(screen.getByRole("checkbox").hasAttribute("disabled")).toBe(true),
  );
});
