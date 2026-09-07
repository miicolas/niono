/** Échoue explicitement quand une valeur attendue par le test est absente. */
export function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) {
    throw new Error("Valeur de test manquante.");
  }
  return value;
}
