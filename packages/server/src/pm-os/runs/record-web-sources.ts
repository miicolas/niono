import { schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { withRun } from "./with-run";
export async function recordWebSources(
  userId: string,
  conversationId: string,
  runId: string,
  item: unknown,
) {
  const found = new Map<string, string>();
  const visit = (value: unknown, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 8) return;
    if (Array.isArray(value)) {
      value.slice(0, 100).forEach((entry) => visit(entry, depth + 1));
      return;
    }
    const object = value as Record<string, unknown>;
    if (typeof object.url === "string" && /^https?:\/\//.test(object.url))
      found.set(
        object.url.slice(0, 2000),
        typeof object.title === "string"
          ? object.title.slice(0, 300)
          : new URL(object.url).hostname,
      );
    Object.values(object).forEach((child) => visit(child, depth + 1));
  };
  visit(item);
  if (!found.size) return;
  await withRun(
    userId,
    conversationId,
    runId,
    async (tx, run) => {
      const sources = new Map(
        run.webSources.map((source) => [source.url, source.title]),
      );
      for (const [url, title] of found) sources.set(url, title);
      await tx
        .update(s.pmRuns)
        .set({
          webSources: [...sources]
            .slice(-100)
            .map(([url, title]) => ({ url, title })),
          updatedAt: new Date(),
        })
        .where(eq(s.pmRuns.id, runId));
    },
    false,
  );
}
