import { questionnaireSchema, questionnaireText } from "../questionnaire";
import { type DocumentNode } from "./document-node";

export function documentText(node: DocumentNode): string {
  if (node.type === "questionnaire") {
    const result = questionnaireSchema.safeParse(node.attrs?.questionnaire);
    return result.success ? questionnaireText(result.data) : "";
  }
  if (node.type === "mention") return String(node.attrs?.label ?? "");
  if (["image", "file", "bookmark"].includes(node.type))
    return [
      node.attrs?.title,
      node.attrs?.name,
      node.attrs?.caption,
      node.attrs?.description,
      node.attrs?.alt,
    ]
      .filter((value) => typeof value === "string" && value)
      .join(" ");
  return (
    node.text ??
    node.content?.map(documentText).join(node.type === "doc" ? "\n" : " ") ??
    ""
  );
}
