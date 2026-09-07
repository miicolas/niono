import type { orpcClient } from "@/orpc/client";
export type Database = Awaited<ReturnType<typeof orpcClient.databases.get>>;
export type Property = Database["properties"][number];
export type Row = Awaited<
  ReturnType<typeof orpcClient.databases.query>
>["rows"][number];
export type Members = Awaited<ReturnType<typeof orpcClient.workspaces.members>>;
