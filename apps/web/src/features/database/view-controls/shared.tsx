import { type ViewConfig } from "@digipm/contracts";
import type { client } from "@/lib/api";

export type DatabaseProperty = Awaited<
  ReturnType<typeof client.databases.get>
>["properties"][number];

export type FilterRule = ViewConfig["filters"][number];
