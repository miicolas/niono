import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";
import { dates } from "./dates";

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  activeOrganizationId: text("active_organization_id"),
  activeTeamId: text("active_team_id"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...dates(),
});
