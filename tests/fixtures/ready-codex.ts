import { db, schema as s } from "../../packages/db/src";
export async function ready(
  userId: string,
  runtime: { state: { connected: boolean } },
) {
  runtime.state.connected = true;
  await db.insert(s.codexConnections).values({ userId, status: "connected" });
}
