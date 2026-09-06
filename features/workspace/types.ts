import type { client } from "@/orpc/client";
export type PageItem = Awaited<ReturnType<typeof client.pages.list>>[number];
export type Bootstrap = Awaited<ReturnType<typeof client.bootstrap>>;
