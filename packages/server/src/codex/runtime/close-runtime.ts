import { runtimes } from "./shared";

export async function closeRuntime(userId: string) {
  const value = runtimes.get(userId);
  runtimes.delete(userId);
  if (value) (await value).close();
}
