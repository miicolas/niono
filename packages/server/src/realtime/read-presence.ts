import { db, schema as s } from "@digipm/db";
import { and, eq, gt } from "drizzle-orm";
import { accessPage } from "../access";
import type { Presence } from "@digipm/contracts/realtime";

export async function readPresence(
  userId: string,
  pageId: string,
): Promise<Presence[]> {
  await accessPage(db, userId, pageId);
  const rows = await db
    .select({
      clientId: s.realtimePresence.clientId,
      clock: s.realtimePresence.clock,
      state: s.realtimePresence.state,
      userId: s.session.userId,
    })
    .from(s.realtimePresence)
    .innerJoin(s.session, eq(s.session.id, s.realtimePresence.sessionId))
    .where(
      and(
        eq(s.realtimePresence.pageId, pageId),
        gt(s.realtimePresence.expiresAt, new Date()),
        gt(s.session.expiresAt, new Date()),
      ),
    )
    .limit(100);
  const allowed: Presence[] = [];
  for (const row of rows) {
    try {
      await accessPage(db, row.userId, pageId);
      allowed.push({
        clientId: row.clientId,
        clock: row.clock,
        state: row.state,
      });
    } catch {
      /* A revoked peer is no longer part of this room. */
    }
  }
  return allowed;
}
