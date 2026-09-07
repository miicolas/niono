import { and, eq, inArray } from "drizzle-orm";
import { schema as s } from "@/db";
import type { Connection } from "./connection";

export function grantsFor(cx: Connection, pageIds: string[], userId?: string) {
  return cx
    .select()
    .from(s.grants)
    .where(
      and(
        inArray(s.grants.pageId, pageIds),
        userId ? eq(s.grants.userId, userId) : undefined
      )
    );
}
