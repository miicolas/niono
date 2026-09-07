import { queryOptions } from "@tanstack/react-query";
import { orpcClient } from "@/orpc/client";
export const bootstrapQuery = () =>
  queryOptions({
    queryKey: ["bootstrap"],
    queryFn: () => orpcClient.workspaces.bootstrap(),
    retry: false,
  });
export const pagesQuery = (workspaceId: string) =>
  queryOptions({
    queryKey: ["pages", workspaceId],
    queryFn: () => orpcClient.pages.list({ workspaceId }),
  });
export const recentQuery = (workspaceId: string) =>
  queryOptions({
    queryKey: ["recent", workspaceId],
    queryFn: () => orpcClient.pages.recent({ workspaceId }),
  });
