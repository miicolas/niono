import type { entries, properties, sources, values, views } from "./schema";

export type DataSource = typeof sources.$inferSelect;
export type DatabaseEntry = typeof entries.$inferSelect;
export type PropertyDefinition = typeof properties.$inferSelect;
export type PropertyValueRow = typeof values.$inferSelect;
export type DatabaseView = typeof views.$inferSelect;
