import { db } from "@/db";
import { insertWorkspace } from "@/server/services/workspaces/insert-workspace";

export function createWorkspace(userId: string, name: string) {
  return db.transaction((tx) => insertWorkspace(tx, userId, name));
}
