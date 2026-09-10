import { client } from "@/lib/api";
import type { MentionItem } from "@digipm/editor/mentions/mention-types";

export async function searchMentions(
  workspaceId: string,
  query: string,
  pagesOnly: boolean,
): Promise<MentionItem[]> {
  const [pages, people] = await Promise.all([
    client.pages.search({ workspaceId, query }),
    pagesOnly
      ? Promise.resolve([])
      : client.pages.mentionPeople({ workspaceId, query }),
  ]);
  return [
    ...pages.slice(0, 12).map((page) => ({
      kind: "page" as const,
      referenceId: page.id,
      label: page.title || "Sans titre",
      workspaceId,
    })),
    ...people.map((member) => ({
      kind: "person" as const,
      referenceId: member.id,
      label: member.name,
      workspaceId,
    })),
  ];
}
