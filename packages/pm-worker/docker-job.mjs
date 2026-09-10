import { spawn, execFile } from "node:child_process";
export async function dockerJob(id, task, signal) {
  const name = "digipm-pm-" + id;
  const args = [
    "run",
    "--rm",
    "--pull=never",
    "--name",
    name,
    "--network",
    "none",
    "--read-only",
    "--user",
    "10001:10001",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--pids-limit",
    "128",
    "--cpus",
    "1",
    "--memory",
    "768m",
    "--memory-swap",
    "768m",
    "--ulimit",
    "fsize=20971520:20971520",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=128m,uid=10001,gid=10001",
    "--tmpfs",
    "/work:rw,exec,nosuid,size=256m,uid=10001,gid=10001",
    "-i",
    process.env.PM_RUNNER_IMAGE || "digipm-pm-runner:1",
    "node",
    "/opt/runner/execute.mjs",
  ];
  signal.throwIfAborted();
  const child = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
  const abort = () => {
    execFile("docker", ["rm", "-f", name], { timeout: 10000 }, () => {});
    child.kill("SIGKILL");
  };
  const timer = setTimeout(abort, 120000);
  signal.addEventListener("abort", abort, { once: true });
  try {
    return await new Promise((resolve, reject) => {
      let output = "",
        error = "";
      child.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.length > 75000000) {
          abort();
          reject(new Error("Sorties trop volumineuses."));
        }
      });
      child.stderr.on("data", (chunk) => {
        error = (error + chunk).slice(-2000);
      });
      child.on("error", reject);
      child.stdin.on("error", () => {});
      child.on("close", (code) => {
        if (code !== 0)
          reject(
            new Error(
              signal.aborted
                ? "Calcul interrompu."
                : "Calcul indisponible ou limite atteinte. " + error,
            ),
          );
        else {
          try {
            resolve(JSON.parse(output));
          } catch {
            reject(new Error("Résultat du conteneur invalide."));
          }
        }
      });
      child.stdin.end(JSON.stringify(task));
    });
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
