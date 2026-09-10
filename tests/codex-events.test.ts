import { expect, test, vi } from "vitest";
import { db, schema as s } from "../packages/db/src";
import { eq } from "drizzle-orm";
import { events } from "../packages/server/src/codex/conversations";
import * as store from "../packages/server/src/codex/store";
import { owner, conversationId } from "./codex/setup";

test("une lecture antérieure à la fin d’une génération conserve son succès", async () => {
  const read = store.conversationFor;
  const spy = vi
    .spyOn(store, "conversationFor")
    .mockImplementationOnce(async (...args) => {
      const stale = await read(...args);
      await db
        .update(s.codexConversations)
        .set({ status: "completed" })
        .where(eq(s.codexConversations.id, conversationId));
      return stale;
    });
  try {
    expect((await events(owner, conversationId)).conversation.status).toBe(
      "completed",
    );
    expect((await read(owner, conversationId)).status).toBe("completed");
  } finally {
    spy.mockRestore();
  }
});
