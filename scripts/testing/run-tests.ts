import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { assertSafeWorktreeDotEnv } from "./assert-safe-test-environment";
import { createHermeticTestEnvironment } from "./test-environment";

const REPOSITORY_ROOT = resolve(import.meta.dir, "../..");

await assertSafeWorktreeDotEnv(REPOSITORY_ROOT);

const child = spawn(
  process.execPath,
  ["--no-env-file", "test", ...process.argv.slice(2)],
  {
    cwd: REPOSITORY_ROOT,
    env: createHermeticTestEnvironment(process.env),
    stdio: "inherit",
  }
);

child.once("error", (error) => {
  throw error;
});
child.once("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
