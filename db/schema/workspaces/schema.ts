import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { dates } from "../columns";

export const workspaces = pgTable("workspaces", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  icon: text().default("D").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  ...dates(),
});
export const members = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text().$type<"owner" | "editor" | "viewer">().notNull(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })]
);
export const invitations = pgTable("invitations", {
  id: uuid().defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: text().notNull(),
  role: text().$type<"editor" | "viewer">().notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ...dates(),
});
