import { operations } from "./shared";

// App-server processes are personal. Serialize lifecycle operations even across spaces.
export function forUser<T>(
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const task = (operations.get(userId) ?? Promise.resolve())
    .catch(() => {})
    .then(operation);
  operations.set(userId, task);
  return task.finally(() => {
    if (operations.get(userId) === task) operations.delete(userId);
  });
}
