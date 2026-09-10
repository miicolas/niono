import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { organization } from "./organization";
import { user } from "./user";

export const member = pgTable(
  "member",
  {
    id: text().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text().default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique().on(t.organizationId, t.userId), index().on(t.userId)],
);
