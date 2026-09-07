import { ORPCError } from "@orpc/server";

/** Garantit qu'une valeur attendue par l'invariant du code est bien présente. */
export function required<T>(
  value: T | undefined | null,
  message = "Donnée manquante."
): T {
  if (value === undefined || value === null) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message });
  }
  return value;
}
