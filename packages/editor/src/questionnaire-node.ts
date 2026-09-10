import { Node } from "@tiptap/core";
import {
  questionnaireSchema,
  questionnaireText,
} from "@digipm/contracts/questionnaire";

// Shared with server-side document transformations; the React view is injected by the editor.
export const QuestionnaireNode = Node.create({
  name: "questionnaire",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { questionnaire: { default: null, rendered: false } };
  },
  parseHTML() {
    return [
      {
        tag: "section[data-questionnaire]",
        getAttrs: (element) => {
          try {
            const data = questionnaireSchema.safeParse(
              JSON.parse(element.getAttribute("data-questionnaire") ?? "null"),
            );
            return data.success ? { questionnaire: data.data } : false;
          } catch {
            return false;
          }
        },
      },
    ];
  },
  renderHTML({ node }) {
    const data = questionnaireSchema.parse(node.attrs.questionnaire);
    return [
      "section",
      { "data-questionnaire": JSON.stringify(data) },
      ["strong", {}, data.title],
      ...data.questions.map((q) => [
        "p",
        {},
        `${q.prompt} : ${[...q.selected, q.text].filter(Boolean).join(", ") || "Sans réponse"}`,
      ]),
    ];
  },
  renderText({ node }) {
    return questionnaireText(
      questionnaireSchema.parse(node.attrs.questionnaire),
    );
  },
});
