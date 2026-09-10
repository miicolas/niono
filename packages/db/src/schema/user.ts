import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { dates } from "./dates";

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text(),
  ...dates(),
});
