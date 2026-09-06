import type { client } from "@/lib/api";
export type Database = Awaited<ReturnType<typeof client.databases.get>>;
export type Property = Database["properties"][number];
export type Row = Awaited<
  ReturnType<typeof client.databases.query>
>["rows"][number];
export type Members = Awaited<ReturnType<typeof client.workspace.members>>;
