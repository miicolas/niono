import type { orpcClient } from "@/orpc/client";
export type PageItem = Awaited<
  ReturnType<typeof orpcClient.pages.list>
>[number];
export type Bootstrap = Awaited<
  ReturnType<typeof orpcClient.workspaces.bootstrap>
>;
export type PageData = Awaited<ReturnType<typeof orpcClient.pages.get>>;
export type PageMetadata = PageData["page"];
export type MetadataChanges = Partial<
  Pick<PageMetadata, "title" | "icon" | "cover" | "coverPosition">
>;
export type PagePanel = "none" | "history" | "share" | "icon" | "cover";
export type Heading = { id: string; text: string; level: number };
export type WorkspaceMembers = Awaited<
  ReturnType<typeof orpcClient.workspaces.members>
>;
export type ShareGrant = { userId: string; role: "editor" | "viewer" };
