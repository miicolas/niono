import { db, type Transaction } from "@digipm/db";

export type Connection = typeof db | Transaction;
