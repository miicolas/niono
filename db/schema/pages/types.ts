import type { favorites, grants, pages, recentPages } from "./schema";

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type PageKind = Page["kind"];
export type PageGrant = typeof grants.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type RecentPage = typeof recentPages.$inferSelect;
