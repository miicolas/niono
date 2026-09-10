import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

export const invitation = pgTable(
  "invitation",
  {
    id: text().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text().notNull(),
    role: text(),
    teamId: text("team_id"),
    status: text().default("pending").notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index().on(t.organizationId), index().on(t.email)],
);
