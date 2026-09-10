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
import { documentSchema, documentText } from "../packages/contracts/src";
import {
  newQuestion,
  questionnaireSchema,
  type PageQuestionnaire,
} from "../packages/contracts/src/questionnaire";
import { canonicalDocument } from "../packages/editor/src/document-transform";
import { QuestionnaireSection } from "../apps/web/src/features/workspace/questionnaire-section";
import { DocumentEditor } from "../packages/editor/src/document-editor";
import { Input } from "../apps/web/src/components/ui/input";
import { EditorAssistantDialog } from "../apps/web/src/features/workspace/editor-assistant-dialog";
import { Checkbox } from "../apps/web/src/components/ui/checkbox";

HTMLElement.prototype.scrollIntoView ??= () => {};
afterEach(cleanup);

test("configurer une section permet d’ajouter une question puis de commencer à répondre", () => {
  let saved: PageQuestionnaire = {
    title: "Questionnaire",
    completed: false,
    questions: [newQuestion()],
  };
  function Harness() {
    const [value, setValue] = useState(saved);
    return h(QuestionnaireSection, {
      value,
      editable: true,
      onChange(next) {
        saved = next;
        setValue(next);
      },
    });
  }
  render(h(Harness));
  expect(
    (
      screen.getByRole("button", {
        name: "Ouvrir le questionnaire",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("Intitulé"), {
    target: { value: "Quel objectif ?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ajouter une question" }));
  fireEvent.change(screen.getAllByLabelText("Intitulé")[1]!, {
    target: { value: "Pour quand ?" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Ouvrir le questionnaire" }),
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Quel objectif ?" }), {
    target: { value: "Livrer" },
  });
  fireEvent.click(screen.getByRole("radio", { name: "Configurer" }));
  fireEvent.change(screen.getAllByLabelText("Intitulé")[1]!, {
    target: { value: "Quelle échéance ?" },
  });
  expect(saved.questions[0]!.text).toBe("Livrer");
  fireEvent.change(screen.getAllByLabelText("Intitulé")[0]!, {
    target: { value: "Quel résultat ?" },
  });
  expect(saved.questions[0]!.text).toBe("");
  expect(questionnaireSchema.safeParse(saved).success).toBe(true);
});

function fixture(): PageQuestionnaire {
  return {
    title: "Préparer le projet",
    completed: false,
    questions: [
      {
        ...newQuestion(),
        prompt: "Quel objectif ?",
        kind: "single",
        options: ["Créer", "Améliorer"],
      },
      {
        ...newQuestion(),
        prompt: "Quels supports ?",
        kind: "multiple",
        options: ["Web", "Mobile"],
        allowOther: true,
      },
      { ...newQuestion(), prompt: "Une précision ?", required: false },
    ],
  };
}

test("le document conserve le questionnaire, son texte indexable et ses identifiants", () => {
  const data = fixture();
  data.questions[0]!.selected = ["Créer"];
  const doc = canonicalDocument({
    type: "doc",
    content: [{ type: "questionnaire", attrs: { questionnaire: data } }],
  });
  expect(documentSchema.parse(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
  expect(doc.content?.[0]?.attrs?.questionnaire).toEqual(data);
  expect(canonicalDocument(doc)).toEqual(doc);
  expect(documentText(doc)).toContain("Quel objectif ?\nCréer");
  expect(
    questionnaireSchema.safeParse({ ...data, completed: true }).success,
  ).toBe(false);
  data.questions[0]!.selected = ["Inconnu"];
  expect(
    documentSchema.safeParse({
      type: "doc",
      content: [{ type: "questionnaire", attrs: { questionnaire: data } }],
    }).success,
  ).toBe(false);
  expect(
    documentSchema.safeParse({
      type: "doc",
      content: [{ type: "questionnaire" }],
    }).success,
  ).toBe(false);
});

test("répondre, revenir, passer et rouvrir conserve les réponses dans le récapitulatif", async () => {
  let saved = fixture();
  function Harness({ editable = true }: { editable?: boolean }) {
    const [value, setValue] = useState(saved);
    return h(QuestionnaireSection, {
      value,
      editable,
      onChange(next) {
        saved = next;
        setValue(next);
      },
    });
  }
  const view = render(h(Harness));
  fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
  expect(screen.getByRole("alert").textContent).toContain("Renseignez");
  fireEvent.click(screen.getByRole("radio", { name: "Créer" }));
  fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Web" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Mobile" }));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Autre réponse : Quels supports ?" }),
    { target: { value: "Borne" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Précédent" }));
  expect(
    (screen.getByRole("radio", { name: "Créer" }) as HTMLInputElement).checked,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
  fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
  fireEvent.click(screen.getByRole("button", { name: "Passer" }));
  fireEvent.click(screen.getByRole("button", { name: "Terminer" }));
  expect(saved.completed).toBe(true);
  expect(saved.questions[1]!.selected).toEqual(["Web", "Mobile"]);
  expect(saved.questions[1]!.text).toBe("Borne");
  expect(questionnaireSchema.safeParse(saved).success).toBe(true);
  expect(
    screen.getByRole("region", { name: "Récapitulatif des réponses" })
      .textContent,
  ).toContain("Question passée");
  view.unmount();
  render(h(Harness, { editable: false }));
  expect(screen.getByText("Web Mobile Borne")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Configurer" })).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
});

test("le bloc éditeur sauvegarde chaque saisie et devient consultable en lecture seule", async () => {
  const onChange = vi.fn();
  const props = {
    Input,
    AssistantDialog: EditorAssistantDialog,
    ui: editorControls,
    Checkbox,
    QuestionnaireSection,
    content: {
      type: "doc",
      content: [
        {
          type: "questionnaire",
          attrs: {
            questionnaire: {
              ...fixture(),
              questions: [{ ...newQuestion(), prompt: "Votre objectif ?" }],
            },
          },
        },
        { type: "paragraph" },
      ],
    },
    editable: true,
    onChange,
    onUpload: vi.fn(),
  };
  const view = render(h(DocumentEditor, props));
  fireEvent.change(
    await screen.findByRole("textbox", { name: "Votre objectif ?" }),
    { target: { value: "Livrer la V1" } },
  );
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  const doc = onChange.mock.lastCall![0];
  expect(documentSchema.safeParse(doc).success).toBe(true);
  expect(documentText(doc)).toContain("Livrer la V1");
  view.rerender(h(DocumentEditor, { ...props, editable: false }));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Configurer" })).toBeNull(),
  );
  expect(
    screen.getByRole("region", { name: "Récapitulatif des réponses" })
      .textContent,
  ).toContain("Livrer la V1");
});
