import { timestamp } from "drizzle-orm/pg-core";

/** Colonnes de suivi partagées par les tables du domaine. */
export const dates = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
