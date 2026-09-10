import { spawn } from "node:child_process";
import { afterEach, expect, test, vi } from "vitest";
import {
  CodexRuntime,
  runtimeConfig,
} from "../packages/server/src/codex/runtime";
const runtimes: CodexRuntime[] = [];
async function start() {
  const process = spawn(
    globalThis.process.execPath,
    [new URL("./fixtures/codex-wire.mjs", import.meta.url).pathname],
    { stdio: "pipe" },
  );
  const runtime = new CodexRuntime(process, "/test");
  runtimes.push(runtime);
  await runtime.initialize();
  return runtime;
}
afterEach(() => {
  for (const runtime of runtimes) runtime.close();
  runtimes.length = 0;
});
test("JSONL fragmenté et réponses corrélées", async () => {
  const runtime = await start();
  const result = await runtime.request("test/fragment");
  expect(result).toEqual({ message: "Écriture française" });
});
test("outils DigiPM seulement : succès explicite et approbation système refusée", async () => {
  const runtime = await start();
  const notifications: { method: string; params: Record<string, unknown> }[] =
    [];
  runtime.on((event) => notifications.push(event));
  const handler = vi.fn(async () => ({ title: "Page visible" }));
  runtime.bind("thread-test", handler);
  await runtime.request("test/tool");
  await vi.waitFor(() =>
    expect(
      notifications.find((e) => e.method === "test/result")?.params,
    ).toMatchObject({ success: true }),
  );
  expect(handler).toHaveBeenCalledOnce();
  await runtime.request("test/forbidden");
  await vi.waitFor(() =>
    expect(
      notifications.find((e) => e.method === "test/rejected")?.params,
    ).toEqual({ rejected: true }),
  );
});
test("délais et arrêt du processus terminent les requêtes en attente", async () => {
  const runtime = await start();
  await expect(runtime.request("test/timeout", {}, 15)).rejects.toThrow(
    "trop de temps",
  );
  const closed = vi.fn();
  runtime.on((event) => {
    if (event.method === "runtime/closed") closed();
  });
  await expect(runtime.request("test/crash")).rejects.toThrow("arrêté");
  expect(closed).toHaveBeenCalledOnce();
});
test("le profil privé désactive les outils hôtes et la découverte des skills", () => {
  for (const name of [
    "shell_tool",
    "unified_exec",
    "apps",
    "plugins",
    "browser_use",
    "computer_use",
    "multi_agent",
    "view_image",
  ])
    expect(runtimeConfig).toContain(`${name} = false`);
  expect(runtimeConfig).toContain("skip_host_skill_discovery = true");
  expect(runtimeConfig).toContain('web_search = "disabled"');
});
