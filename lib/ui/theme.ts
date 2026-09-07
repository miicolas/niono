export type Theme = "dark" | "light";
const STORAGE_KEY = "digipm-theme";
/** Reads the theme persisted by the UI store; anything but "light" falls back to dark. */
export function readStoredTheme(): Theme {
  return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}
