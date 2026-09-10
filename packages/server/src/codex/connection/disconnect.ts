import { getRuntime, closeRuntime } from "../runtime";
import { starting, logins } from "./shared";
import { record } from "./record";

export async function disconnect(userId: string) {
  await starting.get(userId)?.catch(() => {});
  const runtime = await getRuntime(userId);
  const pending = logins.get(userId);
  if (pending) {
    pending.dispose();
    await runtime.request("account/login/cancel", { loginId: pending.loginId });
  }
  await runtime.request("account/logout");
  await closeRuntime(userId);
  await record(userId, "disconnected");
  return { disconnected: true };
}
