import type { documents, receipts, versions } from "./schema";

export type PageDocument = typeof documents.$inferSelect;
export type DocumentVersion = typeof versions.$inferSelect;
export type MutationReceipt = typeof receipts.$inferSelect;
