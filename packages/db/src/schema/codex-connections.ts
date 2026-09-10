import { pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./user";
import { dates } from "./dates";

export const codexConnections = pgTable("codex_connections", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text()
    .$type<"disconnected" | "connecting" | "connected" | "error">()
    .default("disconnected")
    .notNull(),
  email: text(),
  error: text(),
  ...dates(),
});
