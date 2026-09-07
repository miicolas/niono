import { MAX_ARCHIVE_BYTES } from "@/constants/limits";
import { tooLarge } from "../too-large";

/** Compteur d'octets qui refuse l'archive dès que la limite est dépassée. */
export function createArchiveBudget() {
  let total = 0;
  return (bytes: number) => {
    total += bytes;
    if (total > MAX_ARCHIVE_BYTES) {
      throw tooLarge();
    }
  };
}
