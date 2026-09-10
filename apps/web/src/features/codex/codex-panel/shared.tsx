import { client } from "@/lib/api";

export type EventResult = Awaited<ReturnType<typeof client.codex.events>>;
