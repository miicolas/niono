import { pgTable, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { team } from "./team";
import { user } from "./user";

export const teamMember = pgTable(
  "team_member",
  {
    id: text().primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    membershipKey: text("membership_key").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.teamId, t.userId), index().on(t.userId)],
);
