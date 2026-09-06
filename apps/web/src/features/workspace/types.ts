import type { client } from "@/lib/api";
export type PageItem = Awaited<ReturnType<typeof client.pages.list>>[number];
export type Bootstrap = Awaited<ReturnType<typeof client.bootstrap>>;
