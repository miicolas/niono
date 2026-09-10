import { promisify } from "node:util";
import { spawn, execFile } from "node:child_process";
import { mkdir, chmod, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { runtimes, runtimeConfig, CODEX_VERSION } from "./shared";
import { command } from "./command";
import { CodexRuntime } from "./codex-runtime";

export async function getRuntime(userId: string) {
  const existing = runtimes.get(userId);
  if (existing) {
    const value = await existing;
    if (!value.dead) return value;
    if (runtimes.get(userId) === existing) runtimes.delete(userId);
    return getRuntime(userId);
  }
  const promise = (async () => {
    const key = createHash("sha256").update(userId).digest("hex");
    const folder = resolve(
      process.env.INIT_CWD ?? process.cwd(),
      process.env.CODEX_DATA_DIR ?? ".data/codex",
      key,
    );
    const cwd = join(folder, "work");
    await mkdir(cwd, { recursive: true, mode: 0o700 });
    await chmod(folder, 0o700);
    await writeFile(join(folder, "config.toml"), runtimeConfig, {
      mode: 0o600,
    });
    const { executable, args } = command();
    const { stdout } = await promisify(execFile)(
      executable,
      [...args, "--version"],
      { encoding: "utf8", timeout: 30000 },
    );
    const version = stdout.trim();
    if (version !== `codex-cli ${CODEX_VERSION}`)
      throw new Error(`DigiPM nécessite Codex ${CODEX_VERSION}.`);
    const child = spawn(
      executable,
      [...args, "app-server", "--listen", "stdio://", "--strict-config"],
      {
        cwd,
        stdio: "pipe",
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          TMPDIR: process.env.TMPDIR,
          CODEX_HOME: folder,
          RUST_LOG: "off",
        },
      },
    );
    const runtime = new CodexRuntime(child, cwd);
    try {
      await runtime.initialize();
      return runtime;
    } catch (error) {
      runtime.close();
      throw error;
    }
  })();
  runtimes.set(userId, promise);
  try {
    return await promise;
  } catch (error) {
    runtimes.delete(userId);
    throw error;
  }
}
