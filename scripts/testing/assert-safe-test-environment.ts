import { lstat, readlink, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const REPOSITORY_ROOT = resolve(import.meta.dir, "../..");

function isMissingFile(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function isInside(root: string, candidate: string): boolean {
  const relativePath = relative(root, candidate);
  return !(
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  );
}

export async function assertSafeWorktreeDotEnv(
  worktreeRoot: string
): Promise<void> {
  const root = await realpath(worktreeRoot);
  const dotEnvPath = resolve(root, ".env");
  const metadata = await lstat(dotEnvPath).catch((error: unknown) => {
    if (isMissingFile(error)) {
      return null;
    }
    throw error;
  });

  if (!metadata?.isSymbolicLink()) {
    return;
  }

  const linkTarget = await readlink(dotEnvPath);
  const unresolvedTarget = resolve(dirname(dotEnvPath), linkTarget);
  const resolvedTarget = await realpath(unresolvedTarget).catch(
    (error: unknown) => {
      if (isMissingFile(error)) {
        throw new Error(
          "Refusing to run tests: the worktree .env symlink target cannot be resolved"
        );
      }
      throw error;
    }
  );

  if (!isInside(root, resolvedTarget)) {
    throw new Error(
      "Refusing to run tests: the worktree .env symlink resolves outside the worktree"
    );
  }
}

if (import.meta.main) {
  await assertSafeWorktreeDotEnv(REPOSITORY_ROOT);
}
