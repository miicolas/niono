import { documentText, type DocumentNode } from "@digipm/contracts";
export function documentMarkdown(document: DocumentNode): string {
  const render = (node: DocumentNode): string => {
    if (node.type === "text") {
      let result = node.text ?? "";
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") result = "**" + result + "**";
        if (mark.type === "italic") result = "*" + result + "*";
        if (mark.type === "strike") result = "~~" + result + "~~";
        if (mark.type === "code") result = "`" + result + "`";
        if (mark.type === "link")
          result = "[" + result + "](" + String(mark.attrs?.href ?? "") + ")";
      }
      return result;
    }
    const children = node.content ?? [];
    const content = children.map(render).join("");
    if (node.type === "doc") return children.map(render).join("\n\n");
    if (node.type === "heading")
      return "#".repeat(Number(node.attrs?.level) || 1) + " " + content;
    if (node.type === "hardBreak") return "  \n";
    if (node.type === "horizontalRule") return "---";
    if (node.type === "codeBlock")
      return (
        "```" +
        String(node.attrs?.language ?? "") +
        "\n" +
        documentText(node) +
        "\n```"
      );
    if (node.type === "blockquote")
      return children
        .map(render)
        .join("\n")
        .split("\n")
        .map((line) => "> " + line)
        .join("\n");
    if (["bulletList", "orderedList", "taskList"].includes(node.type))
      return children
        .map((child, index) => {
          const prefix =
            node.type === "orderedList"
              ? String(index + Number(node.attrs?.start ?? 1)) + ". "
              : node.type === "taskList"
                ? "- [" + (child.attrs?.checked ? "x" : " ") + "] "
                : "- ";
          return prefix + render(child).replace(/\n/g, "\n  ");
        })
        .join("\n");
    if (node.type === "listItem" || node.type === "taskItem")
      return children.map(render).join("\n");
    if (node.type === "table")
      return children
        .map((row, index) => {
          const line =
            "| " +
            (row.content ?? [])
              .map((cell) =>
                render(cell).replace(/\|/g, "\\|").replace(/\n/g, " "),
              )
              .join(" | ") +
            " |";
          return index === 0
            ? line +
                "\n| " +
                (row.content ?? []).map(() => "---").join(" | ") +
                " |"
            : line;
        })
        .join("\n");
    if (node.type === "image")
      return (
        "![" +
        String(node.attrs?.alt ?? "Image") +
        "](" +
        String(node.attrs?.src ?? "") +
        ")"
      );
    if (node.type === "file")
      return (
        "[" +
        String(node.attrs?.name ?? "Fichier") +
        "](" +
        String(node.attrs?.href ?? "") +
        ")"
      );
    if (node.type === "questionnaire") return documentText(node);
    return content;
  };
  return render(document);
}
