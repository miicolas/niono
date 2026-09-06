import { spawnSync, type StdioOptions } from "node:child_process";
/** Runs a command inside the compose `postgres` service and returns its stdout. */
export function postgres(args: string[], stdio?: StdioOptions) {
  const result = spawnSync(
    "docker",
    ["compose", "exec", "-T", "postgres", ...args],
    { encoding: "utf8", stdio },
  );
  if (result.status !== 0)
    throw new Error(result.stderr || `Échec de ${args[0]} dans PostgreSQL.`);
  return result.stdout;
}
