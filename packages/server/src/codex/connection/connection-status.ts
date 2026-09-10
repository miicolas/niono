import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { getRuntime } from "../runtime";
import { record } from "./record";
import { logins } from "./shared";

export async function connectionStatus(userId: string) {
  const [stored] = await db
    .select()
    .from(s.codexConnections)
    .where(eq(s.codexConnections.userId, userId));
  if (!stored || stored.status === "disconnected")
    return {
      status: "disconnected" as const,
      email: null,
      error: null,
      login: null,
    };
  try {
    const runtime = await getRuntime(userId);
    const { account } = await runtime.account();
    if (account?.type === "chatgpt") {
      if (stored.status !== "connected" || stored.email !== account.email)
        await record(userId, "connected", account.email);
      const pending = logins.get(userId);
      pending?.dispose();
      logins.delete(userId);
      return {
        status: "connected" as const,
        email: account.email,
        error: null,
        login: null,
      };
    }
    const pending = logins.get(userId);
    if (pending)
      return {
        status: "connecting" as const,
        email: null,
        error: null,
        login: {
          verificationUrl: pending.verificationUrl,
          userCode: pending.userCode,
        },
      };
    if (stored.status === "connecting" || stored.status === "connected")
      await record(
        userId,
        "error",
        null,
        "La connexion a expiré. Reconnectez votre compte.",
      );
    return {
      status: "error" as const,
      email: null,
      error: stored.error ?? "Reconnectez votre compte Codex.",
      login: null,
    };
  } catch (error) {
    return {
      status: "error" as const,
      email: null,
      error: error instanceof Error ? error.message : "Codex est indisponible.",
      login: null,
    };
  }
}
