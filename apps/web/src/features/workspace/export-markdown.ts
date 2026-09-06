import { download } from "@/lib/download";
import TurndownService from "turndown";
export async function exportMarkdown(title: string, html: string) {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  const text = `# ${title}\n\n${service.turndown(html)}`;
  download(`${title || "page"}.md`, text, "text/markdown");
}
