import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";

export async function readRunOutput(runId: string) {
  const [old] = await db
    .select()
    .from(s.codexMessages)
    .where(
      and(
        eq(s.codexMessages.requestId, runId),
        eq(s.codexMessages.role, "assistant"),
      ),
    );
  return old?.text;
}
