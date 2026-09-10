import { mkdir, writeFile, symlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { collectOutputs } from "./collect-outputs.mjs";
let input = "";
for await (const chunk of process.stdin) {
  input += chunk;
  if (input.length > 75000000) throw new Error("Entrée trop volumineuse.");
}
try {
  const task = JSON.parse(input);
  for (const file of task.files) {
    const path = resolve("/work", file.path);
    if (
      !path.startsWith("/work/") ||
      path.includes("\0") ||
      file.path.split("/").includes("..")
    )
      throw new Error("Chemin refusé.");
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, Buffer.from(file.data, "base64"), { flag: "wx" });
  }
  await mkdir("/work/outputs", { recursive: true });
  await symlink("/opt/runner/node_modules", "/work/node_modules");
  const executable = task.runtime === "python" ? "python3" : "node";
  const result = await new Promise((resolveResult, reject) => {
    const child = spawn(executable, ["/work/" + task.entrypoint], {
      cwd: "/work",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout = (stdout + chunk).slice(-30000);
    });
    child.stderr.on("data", (chunk) => {
      stderr = (stderr + chunk).slice(-30000);
    });
    const timeout = setTimeout(() => child.kill("SIGKILL"), 115000);
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolveResult({ code, stdout, stderr });
    });
  });
  const files = await collectOutputs("/work/outputs");
  process.stdout.write(JSON.stringify({ ...result, files }));
} catch (error) {
  process.stdout.write(
    JSON.stringify({ code: 1, stdout: "", stderr: error.message, files: [] }),
  );
}
