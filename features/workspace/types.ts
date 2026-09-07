import type { orpcClient } from "@/orpc/client";
export type PageItem = Awaited<
  ReturnType<typeof orpcClient.pages.list>
>[number];
export type Bootstrap = Awaited<
  ReturnType<typeof orpcClient.workspaces.bootstrap>
>;
