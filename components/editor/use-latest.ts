import { useRef } from "react";

/**
 * Référence toujours à jour d'une valeur qui change à chaque rendu. Permet à
 * un gestionnaire créé une seule fois (Tiptap, écouteurs) de lire la dernière
 * version d'un callback sans le recréer.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
