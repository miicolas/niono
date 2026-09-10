import { db, schema as s } from "@digipm/db";

export async function record(
  userId: string,
  status: "connecting" | "connected" | "disconnected" | "error",
  email: string | null = null,
  error: string | null = null,
) {
  await db
    .insert(s.codexConnections)
    .values({ userId, status, email, error })
    .onConflictDoUpdate({
      target: s.codexConnections.userId,
      set: { status, email, error, updatedAt: new Date() },
    });
}
