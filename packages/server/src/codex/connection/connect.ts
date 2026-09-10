import { getRuntime } from "../runtime";
import { starting, logins } from "./shared";
import { record } from "./record";

export function connect(userId: string) {
  const existing = starting.get(userId);
  if (existing) return existing;
  const pending = logins.get(userId);
  if (pending)
    return Promise.resolve({
      verificationUrl: pending.verificationUrl,
      userCode: pending.userCode,
    });
  const task = (async () => {
    try {
      await record(userId, "connecting");
      const runtime = await getRuntime(userId);
      const login = await runtime.login();
      if (login.type !== "chatgptDeviceCode")
        throw new Error("Connexion par code indisponible.");
      const url = new URL(login.verificationUrl);
      if (
        url.protocol !== "https:" ||
        !["auth.openai.com", "chatgpt.com"].includes(url.hostname)
      )
        throw new Error("Adresse de connexion Codex inattendue.");
      const disposeEvent = runtime.on((event) => {
        if (
          event.method === "account/login/completed" &&
          event.params.loginId === login.loginId
        ) {
          cleanup();
          void (async () => {
            if (!event.params.success)
              await record(
                userId,
                "error",
                null,
                "Connexion refusée ou expirée. Réessayez.",
              );
            else {
              const { account } = await runtime.account();
              await record(
                userId,
                account?.type === "chatgpt" ? "connected" : "error",
                account?.type === "chatgpt" ? account.email : null,
              );
            }
          })().catch(() => {});
        }
      });
      const timer = setTimeout(
        () => {
          cleanup();
          void runtime
            .request("account/login/cancel", { loginId: login.loginId })
            .catch(() => {});
          void record(
            userId,
            "error",
            null,
            "Le code a expiré. Recommencez la connexion.",
          ).catch(() => {});
        },
        10 * 60 * 1000,
      );
      timer.unref();
      const cleanup = () => {
        clearTimeout(timer);
        disposeEvent();
        logins.delete(userId);
      };
      logins.set(userId, { ...login, dispose: cleanup });
      return {
        verificationUrl: login.verificationUrl,
        userCode: login.userCode,
      };
    } catch (error) {
      await record(
        userId,
        "error",
        null,
        error instanceof Error ? error.message : "Connexion impossible.",
      );
      throw error;
    }
  })();
  starting.set(userId, task);
  void task.finally(() => starting.delete(userId)).catch(() => {});
  return task;
}
