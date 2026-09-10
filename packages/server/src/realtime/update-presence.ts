import { db, schema as s } from "@digipm/db";
import { and, eq, lt } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { accessPage, lockWorkspace } from "../access";
import { presenceSchema } from "@digipm/contracts/realtime";
import type { z } from "zod";

export async function updatePresence(
  user: { id: string; name: string },
  sessionId: string,
  raw: z.input<typeof presenceSchema>,
) {
  const input = presenceSchema.parse(raw);
  return db.transaction(async (tx) => {
    const { page } = await accessPage(tx, user.id, input.pageId);
    await lockWorkspace(tx, page.workspaceId);
    await accessPage(tx, user.id, input.pageId);
    const [old] = await tx
      .select()
      .from(s.realtimePresence)
      .where(
        and(
          eq(s.realtimePresence.pageId, page.id),
          eq(s.realtimePresence.clientId, input.clientId),
        ),
      );
    if (old && old.sessionId !== sessionId) throw new ORPCError("CONFLICT");
    if (old && old.clock > input.clock) return;
    const colors = [
      "#d97706",
      "#2563eb",
      "#9333ea",
      "#db2777",
      "#059669",
      "#dc2626",
    ];
    const color =
      colors[
        Array.from(user.id).reduce(
          (sum, letter) => sum + letter.charCodeAt(0),
          0,
        ) % colors.length
      ]!;
    const fields = {
      clock: input.clock,
      state: input.active
        ? {
            user: { id: user.id, name: user.name, color },
            cursor: input.cursor,
          }
        : null,
      expiresAt: new Date(Date.now() + 30000),
    };
    await tx
      .insert(s.realtimePresence)
      .values({
        pageId: page.id,
        clientId: input.clientId,
        sessionId,
        ...fields,
      })
      .onConflictDoUpdate({
        target: [s.realtimePresence.pageId, s.realtimePresence.clientId],
        set: fields,
      });
    await tx
      .delete(s.realtimePresence)
      .where(lt(s.realtimePresence.expiresAt, new Date()));
  });
}
