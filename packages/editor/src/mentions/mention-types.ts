export type MentionItem = {
  kind: "page" | "person" | "date";
  referenceId: string;
  label: string;
  workspaceId: string;
};
export type MentionSearch = (
  query: string,
  pagesOnly: boolean,
) => Promise<MentionItem[]>;
export type MentionRange = {
  from: number;
  to: number;
  query: string;
  pagesOnly: boolean;
  x: number;
  y: number;
};
