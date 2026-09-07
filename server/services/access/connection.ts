import type { DatabaseExecutor } from "@/db";

/** Connexion Drizzle acceptée par les helpers d'accès : base ou transaction. */
export type Connection = DatabaseExecutor;
